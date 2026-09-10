import { type Bridge, BridgeDetailFormat, BridgeDetailTone, BridgeKind } from "@serverkgg/bridge";
import { enabledModIds, mapNameOf, readArkStamp, readLaunchVariables, readMods, metrics as sampler } from "../shared";

const DETAIL_ID = "metrics";

const REFRESH_SECONDS = 15;

const MISSING = "—";

const MINUTE_SECONDS = 60;

const HOUR_SECONDS = 3600;

const arabicCount = (count: number, one: string, two: string, few: string, many: string) => {
	if (count === 1) {
		return one;
	}

	if (count === 2) {
		return two;
	}

	return `${count} ${count <= 10 ? few : many}`;
};

const arabicHours = (hours: number) => {
	return arabicCount(hours, "ساعة", "ساعتين", "ساعات", "ساعة");
};

const arabicMinutes = (minutes: number) => {
	return arabicCount(minutes, "دقيقة", "دقيقتين", "دقايق", "دقيقة");
};

export const formatUptime = (seconds: number): Bridge.Text => {
	const total = Math.max(0, Math.floor(seconds));
	const hours = Math.floor(total / HOUR_SECONDS);
	const minutes = Math.floor((total % HOUR_SECONDS) / MINUTE_SECONDS);

	if (hours === 0 && minutes === 0) {
		return {
			ar: "أقل من دقيقة",
			en: "Less than a minute",
		};
	}

	if (hours === 0) {
		return {
			ar: arabicMinutes(minutes),
			en: `${minutes}m`,
		};
	}

	if (minutes === 0) {
		return {
			ar: arabicHours(hours),
			en: `${hours}h`,
		};
	}

	return {
		ar: `${arabicHours(hours)} و${arabicMinutes(minutes)}`,
		en: `${hours}h ${minutes}m`,
	};
};

export const crossplayBadge = (crossplay: boolean): Bridge.DetailBadge => {
	return crossplay
		? {
				label: {
					ar: "كروس بلاي مفتوح",
					en: "Crossplay on",
				},
				tone: BridgeDetailTone.Success,
			}
		: {
				label: {
					ar: "PC بس",
					en: "PC only",
				},
				tone: BridgeDetailTone.Neutral,
			};
};

export const battleyeBadge = (battleye: boolean): Bridge.DetailBadge => {
	return battleye
		? {
				label: {
					ar: "BattlEye شغّال",
					en: "BattlEye on",
				},
				tone: BridgeDetailTone.Warning,
			}
		: {
				label: {
					ar: "BattlEye مطفي",
					en: "BattlEye off",
				},
				tone: BridgeDetailTone.Neutral,
			};
};

export const metrics: Bridge.Detail = {
	kind: BridgeKind.Detail,
	refreshSeconds: REFRESH_SECONDS,
	async read(context) {
		const stamp = await readArkStamp(context);
		const variables = readLaunchVariables(context);
		const mods = enabledModIds(await readMods(context));
		const snapshot = sampler.snapshot();
		const running = context.server.running;

		return {
			actions: [],
			badges: [
				crossplayBadge(variables.crossplay),
				battleyeBadge(variables.battleye),
			],
			description: null,
			id: DETAIL_ID,
			image: null,
			links: [],
			stale: !running,
			stats: [
				{
					format: BridgeDetailFormat.Text,
					key: "players",
					label: {
						ar: "اللاعبين",
						en: "Players",
					},
					value: snapshot.players === null ? MISSING : `${snapshot.players}/${variables.maxPlayers}`,
				},
				{
					format: BridgeDetailFormat.Text,
					key: "map",
					label: {
						ar: "الماب",
						en: "Map",
					},
					value: mapNameOf(variables.map),
				},
				{
					format: BridgeDetailFormat.Number,
					key: "mods",
					label: {
						ar: "المودات",
						en: "Mods",
					},
					value: mods.length,
				},
				{
					format: BridgeDetailFormat.Text,
					key: "build",
					label: {
						ar: "نسخة اللعبة",
						en: "Game build",
					},
					value: stamp.buildId ?? MISSING,
				},
				{
					format: BridgeDetailFormat.Text,
					key: "uptime",
					label: {
						ar: "شغّال من",
						en: "Up for",
					},
					value: snapshot.uptimeSeconds === null ? MISSING : formatUptime(snapshot.uptimeSeconds),
				},
				{
					format: snapshot.lastSaveAt === null ? BridgeDetailFormat.Text : BridgeDetailFormat.Date,
					key: "lastSave",
					label: {
						ar: "آخر حفظ",
						en: "Last save",
					},
					value: snapshot.lastSaveAt === null ? MISSING : new Date(snapshot.lastSaveAt).toISOString(),
				},
			],
			subtitle: {
				ar: "الأرقام هذي طالعة من سيرفرك نفسه، مو تقدير.",
				en: "These numbers come straight from your own server, not an estimate.",
			},
			title: {
				ar: "حالة السيرفر",
				en: "Server health",
			},
		};
	},
};
