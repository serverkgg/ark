import type { Bridge } from "@serverkgg/bridge";
import { createRconAccess, type RconAccessPassword } from "@serverkgg/bridge/rcon";
import {
	type ArkStamp,
	RCON_PASSWORD_TARGET,
	readArkStamp,
	reportAdminPasswordRotated,
	rotateAdminPassword,
} from "../shared";

export const rconAccessPassword = (stamp: ArkStamp): RconAccessPassword | null => {
	if (stamp.adminPassword.length === 0 && stamp.adminPasswordNext === null) {
		return null;
	}

	return {
		pending: stamp.adminPasswordNext !== null,
		value: stamp.adminPasswordNext ?? stamp.adminPassword,
	};
};

export const rconAccess: Bridge.Detail = createRconAccess({
	async password(context) {
		return rconAccessPassword(await readArkStamp(context));
	},
	async rotate(context) {
		await rotateAdminPassword(context);

		reportAdminPasswordRotated(context, RCON_PASSWORD_TARGET);
	},
	tools: {
		ar: "تشتغل معه BattleMetrics وأدوات RCON العادية. وهي نفسها كلمة مرور الأدمن داخل اللعبة، فتغييرها يغيّر الاثنين مع بعض.",
		en: "BattleMetrics and the usual RCON tools work with it. It is also the in-game admin password, so rotating it changes both at once.",
	},
});
