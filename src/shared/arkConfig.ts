import type { Bridge } from "@serverkgg/bridge";
import {
	CONFIG_DIRECTORY,
	GAME_USER_SETTINGS_FILE,
	RCON_ENABLED_KEY,
	RCON_PORT,
	RCON_PORT_KEY,
	SERVER_ADMIN_PASSWORD_KEY,
	SERVER_PASSWORD_KEY,
	SERVER_SETTINGS_SECTION,
	SESSION_NAME_KEY,
	SESSION_SETTINGS_SECTION,
} from "./arkApp";

const textOf = (value: Bridge.Value | undefined) => {
	if (typeof value === "string") {
		return value;
	}

	if (typeof value === "number" || typeof value === "boolean") {
		return String(value);
	}

	return "";
};

export const readIniSection = async (context: Bridge.Context, path: string, section: string) => {
	if (!(await context.files.exists(path))) {
		return {};
	}

	const values = await context.codec.ini.read(path, {
		section,
	});

	const record: Record<string, string> = {};

	for (const [key, value] of Object.entries(values)) {
		record[key] = textOf(value);
	}

	return record;
};

export const mergeIniSection = async (
	context: Bridge.Context,
	path: string,
	section: string,
	values: Record<string, string>,
) => {
	if (Object.keys(values).length === 0) {
		return;
	}

	await context.files.ensure(CONFIG_DIRECTORY);
	await context.codec.ini.merge(path, values, {
		section,
	});
};

export const readServerSettings = async (context: Bridge.Context) => {
	return await readIniSection(context, GAME_USER_SETTINGS_FILE, SERVER_SETTINGS_SECTION);
};

export const readSessionSettings = async (context: Bridge.Context) => {
	return await readIniSection(context, GAME_USER_SETTINGS_FILE, SESSION_SETTINGS_SECTION);
};

export const readSessionName = async (context: Bridge.Context) => {
	return (await readSessionSettings(context))[SESSION_NAME_KEY] ?? "";
};

export const readServerPassword = async (context: Bridge.Context) => {
	return (await readServerSettings(context))[SERVER_PASSWORD_KEY] ?? "";
};

export const applyControlConfig = async (context: Bridge.Context, adminPassword: string) => {
	await mergeIniSection(context, GAME_USER_SETTINGS_FILE, SERVER_SETTINGS_SECTION, {
		[RCON_ENABLED_KEY]: "True",
		[RCON_PORT_KEY]: String(RCON_PORT),
		[SERVER_ADMIN_PASSWORD_KEY]: adminPassword,
	});
};
