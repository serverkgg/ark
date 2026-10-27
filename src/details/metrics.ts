import { type Bridge, BridgeDetailFormat, BridgeDetailTone, BridgeKind } from "@serverkgg/bridge";
import { formatUptime } from "@serverkgg/bridge/utils";
import { enabledModIds, mapNameOf, readArkStamp, readLaunchVariables, readMods, metrics as sampler } from "../shared";

const DETAIL_ID = "metrics";

const REFRESH_SECONDS = 15;

const MISSING = "—";

export const crossplayBadge = (crossplay: boolean): Bridge.DetailBadge => {
	return crossplay
		? {
				label: {
					ar: "الكروس بلاي مفعّل",
					en: "Crossplay on",
				},
				tone: BridgeDetailTone.Success,
			}
		: {
				label: {
					ar: "PC فقط",
					en: "PC only",
				},
				tone: BridgeDetailTone.Neutral,
			};
};

export const battleyeBadge = (battleye: boolean): Bridge.DetailBadge => {
	return battleye
		? {
				label: {
					ar: "BattlEye مفعّل",
					en: "BattlEye on",
				},
				tone: BridgeDetailTone.Warning,
			}
		: {
				label: {
					ar: "BattlEye موقوف",
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
						ar: "اللاعبون",
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
						ar: "بيلد اللعبة",
						en: "Game build",
					},
					value: stamp.buildId ?? MISSING,
				},
				{
					format: BridgeDetailFormat.Text,
					key: "uptime",
					label: {
						ar: "مدة التشغيل",
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
				ar: "هذه الأرقام صادرة من سيرفرك مباشرة، وليست تقديرًا.",
				en: "These numbers come straight from your own server, not an estimate.",
			},
			title: {
				ar: "حالة السيرفر",
				en: "Server health",
			},
		};
	},
};
