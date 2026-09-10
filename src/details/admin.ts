import { type Bridge, BridgeDetailFormat, BridgeDetailTone, BridgeKind } from "@serverkgg/bridge";
import { type ArkStamp, readArkStamp, rotateAdminPassword } from "../shared";

const DETAIL_ID = "admin";

const REFRESH_SECONDS = 60;

export const ROTATE_ACTION = "rotateAdmin";

export const adminBadge = (stamp: ArkStamp): Bridge.DetailBadge => {
	if (stamp.adminPasswordNext !== null) {
		return {
			label: {
				ar: "يطبّق بعد إعادة التشغيل",
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
			ar: "شغّل سيرفرك مرة عشان تتولد",
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
				ar: "داخل اللعبة افتح الكونسول بزر Tab واكتب EnableCheats مع كلمة المرور هذي، وتصير أدمن على طول. ونفس الكلمة هي كلمة مرور RCON، فلا تعطيها إلا اللي تثق فيه.",
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
						ar: "نسخة اللعبة",
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
		// ARK reads ServerAdminPassword off the launch string once, at boot, so the new
		// one waits in the stamp and the boot path promotes it before the process starts.
		async [ROTATE_ACTION](context) {
			await rotateAdminPassword(context);

			context.log("rotated the admin password, it goes live on the next start");

			return null;
		},
	},
};
