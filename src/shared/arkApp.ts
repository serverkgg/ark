export const STEAM_APP_ID = "2430930";

export const CURSEFORGE_GAME_ID = 83_374;

export const CONTAINER_ROOT = "/home/container";

export const START_WRAPPER = "/opt/serverk/ark-start";

export const SERVER_EXE = "ArkAscendedServer.exe";

export const PROJECT_DIRECTORY = "ShooterGame";

export const BINARY_DIRECTORY = `${PROJECT_DIRECTORY}/Binaries/Win64`;

export const SERVER_BINARY = `${BINARY_DIRECTORY}/${SERVER_EXE}`;

export const SAVED_DIRECTORY = `${PROJECT_DIRECTORY}/Saved`;

export const CONFIG_DIRECTORY = `${SAVED_DIRECTORY}/Config/WindowsServer`;

export const GAME_USER_SETTINGS_FILE = `${CONFIG_DIRECTORY}/GameUserSettings.ini`;

export const GAME_FILE = `${CONFIG_DIRECTORY}/Game.ini`;

export const SAVED_ARKS_DIRECTORY = `${SAVED_DIRECTORY}/SavedArks`;

export const LOGS_DIRECTORY = `${SAVED_DIRECTORY}/Logs`;

export const SERVER_LOG_FILE = `${LOGS_DIRECTORY}/ShooterGame.log`;

export const MODS_DIRECTORY = `${BINARY_DIRECTORY}/${PROJECT_DIRECTORY}/Mods/${CURSEFORGE_GAME_ID}`;

export const ADMIN_LIST_FILE = `${SAVED_DIRECTORY}/AllowedCheaterAccountIDs.txt`;

export const WHITELIST_FILE = `${BINARY_DIRECTORY}/PlayersExclusiveJoinList.txt`;

export const BAN_LIST_FILE = `${BINARY_DIRECTORY}/BanList.txt`;

export const MODS_SIDECAR_FILE = ".serverk-mods.json";

export const GAME_ROOTS = [
	SERVER_BINARY,
	`${PROJECT_DIRECTORY}/Content/Paks`,
	"Engine/Binaries",
];

export const GAME_PORT = "game";

export const RCON_PORT = 27_020;

export const RCON_TIMEOUT_MS = 15_000;

export const SERVER_SETTINGS_SECTION = "ServerSettings";

export const SESSION_SETTINGS_SECTION = "SessionSettings";

export const MESSAGE_OF_THE_DAY_SECTION = "MessageOfTheDay";

export const SHOOTER_GAME_MODE_SECTION = "/Script/ShooterGame.ShooterGameMode";

export const SESSION_NAME_KEY = "SessionName";

export const SERVER_PASSWORD_KEY = "ServerPassword";

export const SERVER_ADMIN_PASSWORD_KEY = "ServerAdminPassword";

export const RCON_ENABLED_KEY = "RCONEnabled";

export const RCON_PORT_KEY = "RCONPort";

export const DEFAULT_SESSION_NAME = "Serverk ARK";

export const ADMIN_PASSWORD_LENGTH = 16;

export const SESSION_NAME_MAX = 64;

export const PASSWORD_MAX = 48;

export const MOTD_MAX = 400;

export const ANNOUNCE_MESSAGE_LENGTH = 300;

export const CONSOLE_COMMAND_MAX = 400;

export const MAX_PLAYERS_MIN = 1;

export const MAX_PLAYERS_MAX = 200;

export const MAX_PLAYERS_DEFAULT = 30;

export const MOD_LIST_LIMIT = 64;

export const EOS_ID_PATTERN = /^[0-9a-f]{32}$/i;

export const savedArkDirectory = (map: string) => {
	return `${SAVED_ARKS_DIRECTORY}/${map}`;
};
