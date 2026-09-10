import type { Bridge } from "@serverkgg/bridge";
import { MAX_PLAYERS_DEFAULT, MAX_PLAYERS_MAX, MAX_PLAYERS_MIN } from "./arkApp";
import { CUSTOM_MAP_VALUE, DEFAULT_MAP } from "./arkMaps";

export const MAP_VARIABLE = "MAP";

export const CUSTOM_MAP_VARIABLE = "CUSTOM_MAP";

export const MAX_PLAYERS_VARIABLE = "MAX_PLAYERS";

export const CROSSPLAY_VARIABLE = "CROSSPLAY";

export const BATTLEYE_VARIABLE = "BATTLEYE";

export const EXCLUSIVE_JOIN_VARIABLE = "EXCLUSIVE_JOIN";

export const MAP_ID_PATTERN = "^[A-Za-z0-9_]+_WP$";

const MAP_ID = new RegExp(MAP_ID_PATTERN);

export interface ArkLaunchVariables {
	map: string;
	maxPlayers: number;
	crossplay: boolean;
	battleye: boolean;
	exclusiveJoin: boolean;
}

export const clampMaxPlayers = (value: unknown) => {
	if (typeof value === "string" && value.trim().length === 0) {
		return MAX_PLAYERS_DEFAULT;
	}

	const parsed = typeof value === "number" ? value : Number(value);

	if (value === null || value === undefined || !Number.isFinite(parsed)) {
		return MAX_PLAYERS_DEFAULT;
	}

	return Math.min(MAX_PLAYERS_MAX, Math.max(MAX_PLAYERS_MIN, Math.round(parsed)));
};

export const mapIdOf = (map: string | null, custom: string | null) => {
	if (map === null || map.length === 0) {
		return DEFAULT_MAP;
	}

	if (map !== CUSTOM_MAP_VALUE) {
		return MAP_ID.test(map) ? map : DEFAULT_MAP;
	}

	const trimmed = (custom ?? "").trim();

	return MAP_ID.test(trimmed) ? trimmed : DEFAULT_MAP;
};

const flagOf = (value: string | null, fallback: boolean) => {
	if (value === null || value.length === 0) {
		return fallback;
	}

	return value === "true";
};

export const readLaunchVariables = (context: Bridge.Context): ArkLaunchVariables => {
	return {
		battleye: flagOf(context.variable(BATTLEYE_VARIABLE), false),
		crossplay: flagOf(context.variable(CROSSPLAY_VARIABLE), true),
		exclusiveJoin: flagOf(context.variable(EXCLUSIVE_JOIN_VARIABLE), false),
		map: mapIdOf(context.variable(MAP_VARIABLE), context.variable(CUSTOM_MAP_VARIABLE)),
		maxPlayers: clampMaxPlayers(context.variable(MAX_PLAYERS_VARIABLE)),
	};
};
