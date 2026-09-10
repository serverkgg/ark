import type { Bridge } from "@serverkgg/bridge";
import {
	applyControlConfig,
	DEFAULT_SESSION_NAME,
	GAME_USER_SETTINGS_FILE,
	mergeIniSection,
	readServerSettings,
	readSessionSettings,
	SERVER_PASSWORD_KEY,
	SERVER_SETTINGS_SECTION,
	SESSION_NAME_KEY,
	SESSION_NAME_MAX,
	SESSION_SETTINGS_SECTION,
} from "../shared";

export const defaultSessionName = (code: string) => {
	return `${DEFAULT_SESSION_NAME} ${code}`.slice(0, SESSION_NAME_MAX);
};

export const seedConfig = async (context: Bridge.Context, adminPassword: string) => {
	await applyControlConfig(context, adminPassword);

	const session = await readSessionSettings(context);

	if ((session[SESSION_NAME_KEY] ?? "").length === 0) {
		await mergeIniSection(context, GAME_USER_SETTINGS_FILE, SESSION_SETTINGS_SECTION, {
			[SESSION_NAME_KEY]: defaultSessionName(context.server.code),
		});
	}

	const settings = await readServerSettings(context);

	if (settings[SERVER_PASSWORD_KEY] === undefined) {
		await mergeIniSection(context, GAME_USER_SETTINGS_FILE, SERVER_SETTINGS_SECTION, {
			[SERVER_PASSWORD_KEY]: "",
		});
	}
};
