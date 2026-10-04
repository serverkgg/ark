import { type Bridge, BridgeKind, BridgeTerminalLevel } from "@serverkgg/bridge";
import { consoleHandler } from "./consoleHandler";

const player: Bridge.TerminalArg = {
	column: "name",
	key: "player",
	label: {
		ar: "اللاعب",
		en: "Player",
	},
	module: "players",
	required: true,
};

const eosId: Bridge.TerminalArg = {
	key: "eosId",
	label: {
		ar: "معرّف اللاعب",
		en: "Account id",
	},
	required: true,
};

const message: Bridge.TerminalArg = {
	key: "message",
	label: {
		ar: "الرسالة",
		en: "Message",
	},
	required: true,
	variadic: true,
};

const commands: Bridge.TerminalCommand[] = [
	{
		name: "ListPlayers",
		summary: {
			ar: "يعرض اللاعبين المتصلين الآن مع أرقام حساباتهم.",
			en: "List the players who are online, with their account IDs.",
		},
	},
	{
		args: [
			player,
		],
		name: "KickPlayer",
		summary: {
			ar: "يطرد لاعبًا من سيرفرك.",
			en: "Kick a player from your server.",
		},
		syntax: "KickPlayer <player>",
	},
	{
		args: [
			player,
		],
		danger: true,
		name: "BanPlayer",
		summary: {
			ar: "يحظر لاعبًا نهائيًا. إذا لم يكن متصلًا الآن، فاكتب معرّفه بدلًا من اسمه.",
			en: "Ban a player for good. If they're offline, write their account ID instead of their name.",
		},
		syntax: "BanPlayer <player>",
	},
	{
		args: [
			eosId,
		],
		name: "UnbanPlayer",
		summary: {
			ar: "يفك الحظر عن لاعب بمعرّفه.",
			en: "Unban an account by its ID.",
		},
		syntax: "UnbanPlayer <eosId>",
	},
	{
		args: [
			message,
		],
		name: "ServerChat",
		summary: {
			ar: "رسالة تظهر في شات كل اللاعبين.",
			en: "A message that lands in everyone's chat.",
		},
		syntax: "ServerChat <message>",
	},
	{
		args: [
			message,
		],
		name: "Broadcast",
		summary: {
			ar: "رسالة تظهر على شاشة كل اللاعبين.",
			en: "A message that pops up on every player's screen.",
		},
		syntax: "Broadcast <message>",
	},
	{
		args: [
			eosId,
			message,
		],
		name: "ServerChatTo",
		summary: {
			ar: "رسالة إلى لاعب واحد فقط، بمعرّفه.",
			en: "A message to one player, by their account ID.",
		},
		syntax: 'ServerChatTo "<eosId>" <message>',
	},
	{
		name: "SaveWorld",
		summary: {
			ar: "يحفظ مابك على القرص الآن.",
			en: "Save your map to disk right now.",
		},
	},
	{
		danger: true,
		name: "DestroyWildDinos",
		summary: {
			ar: "يحذف كل الديناصورات البرية لتظهر من جديد. لا تتأثر الديناصورات المروّضة.",
			en: "Clears every wild dino so the map respawns them. Tamed dinos are untouched.",
		},
	},
	{
		name: "GetGameLog",
		summary: {
			ar: "يعرض آخر أسطر من سجل اللعبة.",
			en: "Show the latest lines from the game log.",
		},
	},
	{
		name: "GetChat",
		summary: {
			ar: "يعرض آخر رسائل الشات.",
			en: "Show the latest chat messages.",
		},
	},
	{
		name: "ShowMessageOfTheDay",
		summary: {
			ar: "يعرض رسالة اليوم كما يراها اللاعب.",
			en: "Show the message of the day the way a player sees it.",
		},
	},
	{
		danger: true,
		name: "DoExit",
		summary: {
			ar: "يغلق سيرفرك دون حفظ. استخدم زر الإيقاف بدلًا منه.",
			en: "Drops your server with nothing saved. Use the Stop button instead.",
		},
	},
];

const rules: Bridge.TerminalRule[] = [
	{
		level: BridgeTerminalLevel.Error,
		match: /: (?:Error|Fatal):|Fatal error|=== Critical error: ===/,
	},
	{
		level: BridgeTerminalLevel.Warn,
		match: /: Warning:/,
	},
	{
		level: BridgeTerminalLevel.Info,
		match: /LogRcon:|LogServerStats:|Full Startup:/,
	},
];

export const terminal: Bridge.Terminal = {
	kind: BridgeKind.Terminal,
	commands,
	rules,
	run: consoleHandler,
};
