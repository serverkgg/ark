import { clampMaxPlayers, SESSION_NAME_MAX } from "../shared";

export interface ArkCommandInput {
	map: string;
	sessionName: string;
	gamePort: number;
	rconPort: number;
	maxPlayers: number;
	mods: string[];
	crossplay: boolean;
	battleye: boolean;
	exclusiveJoin: boolean;
}

export const stripQuery = (value: string) => {
	return value.replaceAll("?", "").replaceAll(/[\r\n]+/g, " ");
};

export const sanitizeSessionName = (name: string) => {
	return stripQuery(name).trim().slice(0, SESSION_NAME_MAX);
};

export const mapStringWithoutSecrets = (input: ArkCommandInput) => {
	return [
		input.map,
		"listen",
		`SessionName=${sanitizeSessionName(input.sessionName)}`,
		`RCONPort=${input.rconPort}`,
		"RCONEnabled=True",
	].join("?");
};

export const startArgs = (input: ArkCommandInput): string[] => {
	return [
		mapStringWithoutSecrets(input),
		`-Port=${input.gamePort}`,
		`-WinLiveMaxPlayers=${clampMaxPlayers(input.maxPlayers)}`,
		...(input.mods.length === 0
			? []
			: [
					`-mods=${input.mods.join(",")}`,
				]),
		"-servergamelog",
		"-oldconsole",
		"-nosteam",
		...(input.battleye
			? []
			: [
					"-NoBattlEye",
				]),
		...(input.crossplay
			? [
					"-ServerPlatform=ALL",
				]
			: []),
		...(input.exclusiveJoin
			? [
					"-exclusivejoin",
				]
			: []),
	];
};
