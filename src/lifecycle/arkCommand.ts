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

// `?` is the separator of the launch string itself, so a session name carrying one
// would split into an option the engine then reads as garbage.
export const stripQuery = (value: string) => {
	return value.replaceAll("?", "").replaceAll(/[\r\n]+/g, " ");
};

export const sanitizeSessionName = (name: string) => {
	return stripQuery(name).trim().slice(0, SESSION_NAME_MAX);
};

// No password ever rides the launch string: the engine echoes its whole command line
// into ShooterGame.log, and the wrapper tails that log into the customer's console.
// ServerPassword and ServerAdminPassword live in [ServerSettings] instead, written by
// applyControlConfig and the settings module before every start.
export const mapString = (input: ArkCommandInput) => {
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
		mapString(input),
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
