import { type Bridge, BridgeDetailFormat, BridgeDetailTone, BridgeKind } from "@serverkgg/bridge";
import {
	ADMIN_PASSWORD_TARGET,
	type ArkStamp,
	readArkStamp,
	reportAdminPasswordRotated,
	rotateAdminPassword,
} from "../shared";

const DETAIL_ID = "admin";

const REFRESH_SECONDS = 60;

export const ROTATE_ACTION = "rotateAdmin";

export const adminBadge = (stamp: ArkStamp): Bridge.DetailBadge => {
	if (stamp.adminPasswordNext !== null) {
		return {
			label: {
				ar: "يُطبَّق بعد الريستارت",
				en: "Applies after restart",
			},
			tone: BridgeDetailTone.Warning,
		};
	}

	if (stamp.adminPassword.length > 0) {
		return {
			label: {
				ar: "جاهزة",
				en: "Ready",
			},
			tone: BridgeDetailTone.Success,
		};
	}

	return {
		label: {
			ar: "شغّل سيرفرك مرة واحدة لتُنشأ",
			en: "Start the server once to generate it",
		},
		tone: BridgeDetailTone.Warning,
	};
};

export const admin: Bridge.Detail = {
	kind: BridgeKind.Detail,
	refreshSeconds: REFRESH_SECONDS,
	async read(context) {
		const stamp = await readArkStamp(context);

		return {
			actions: [
				ROTATE_ACTION,
			],
			badges: [
				adminBadge(stamp),
			],
			description: {
				ar: "داخل اللعبة افتح الكونسول بزر Tab واكتب EnableCheats مع كلمة المرور هذه، لتصبح أدمن فورًا. وهي نفسها كلمة مرور RCON، فلا تعطها إلا لمن تثق به.",
				en: "In game, open the console with Tab and type EnableCheats followed by this password to become admin. The same password is the RCON password, so share it only with people you trust.",
			},
			id: DETAIL_ID,
			image: null,
			links: [],
			stale: false,
			stats: [
				{
					format: BridgeDetailFormat.Secret,
					key: "adminPassword",
					label: {
						ar: "كلمة مرور الأدمن",
						en: "Admin password",
					},
					value: stamp.adminPasswordNext ?? stamp.adminPassword,
				},
				{
					format: BridgeDetailFormat.Text,
					key: "build",
					label: {
						ar: "بيلد اللعبة",
						en: "Game build",
					},
					value: stamp.buildId ?? "",
				},
			],
			subtitle: {
				ar: "كلمة مرور الأدمن داخل اللعبة",
				en: "The in-game admin password",
			},
			title: {
				ar: "صلاحيات الأدمن",
				en: "Admin access",
			},
		};
	},
	actions: {
		async [ROTATE_ACTION](context) {
			await rotateAdminPassword(context);

			context.log("rotated the admin password, it goes live on the next start");
			reportAdminPasswordRotated(context, ADMIN_PASSWORD_TARGET);

			return null;
		},
	},
};
