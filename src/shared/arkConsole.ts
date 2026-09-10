import { CONSOLE_COMMAND_MAX } from "./arkApp";

export const LIST_PLAYERS = "ListPlayers";

export const SAVE_WORLD = "SaveWorld";

export const DO_EXIT = "DoExit";

export const DESTROY_WILD_DINOS = "DestroyWildDinos";

export const GET_GAME_LOG = "GetGameLog";

export const GET_CHAT = "GetChat";

export const SHOW_MESSAGE_OF_THE_DAY = "ShowMessageOfTheDay";

const CHEAT_PREFIX = /^(?:cheat|admincheat)\s+/i;

export const sanitizeCommand = (input: string) => {
	return input
		.replaceAll(/[\r\n]+/g, " ")
		.trim()
		.slice(0, CONSOLE_COMMAND_MAX);
};

// ARK's own console takes `cheat <command>`; over rcon the prefix is already implied
// and a doubled one answers with nothing at all.
export const stripCheatPrefix = (input: string) => {
	return input.replace(CHEAT_PREFIX, "").trim();
};

const messageText = (message: string, limit: number) => {
	return message
		.replaceAll(/[\r\n"]+/g, " ")
		.trim()
		.slice(0, limit);
};

export const kickCommand = (eosId: string) => {
	return `KickPlayer ${eosId}`;
};

export const banCommand = (eosId: string) => {
	return `BanPlayer ${eosId}`;
};

export const unbanCommand = (eosId: string) => {
	return `UnbanPlayer ${eosId}`;
};

export const serverChatCommand = (message: string, limit: number) => {
	return `ServerChat ${messageText(message, limit)}`;
};

export const broadcastCommand = (message: string, limit: number) => {
	return `Broadcast ${messageText(message, limit)}`;
};

export const serverChatToCommand = (eosId: string, message: string, limit: number) => {
	return `ServerChatTo "${eosId}" ${messageText(message, limit)}`;
};
