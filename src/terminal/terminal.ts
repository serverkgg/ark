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
		ar: "رقم الحساب",
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
			ar: "يعرض اللاعبين الداخلين الحين مع أرقام حساباتهم.",
			en: "List the players who are online, with their account ids.",
		},
	},
	{
		args: [
			player,
		],
		name: "KickPlayer",
		summary: {
			ar: "يطرد لاعب من سيرفرك.",
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
			ar: "يحظر لاعب نهائيًا. لو مو داخل الحين، اكتب رقم حسابه بدل اسمه.",
			en: "Ban a player for good. If they are offline, write their account id instead of their name.",
		},
		syntax: "BanPlayer <player>",
	},
	{
		args: [
			eosId,
		],
		name: "UnbanPlayer",
		summary: {
			ar: "يفك الحظر عن حساب برقمه.",
			en: "Lift a ban with the account id.",
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
			ar: "رسالة تطلع على شاشة كل اللاعبين.",
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
			ar: "رسالة للاعب واحد بس، برقم حسابه.",
			en: "A message to one player, by their account id.",
		},
		syntax: 'ServerChatTo "<eosId>" <message>',
	},
	{
		name: "SaveWorld",
		summary: {
			ar: "يحفظ عالمك على القرص الحين.",
			en: "Save your world to disk right now.",
		},
	},
	{
		danger: true,
		name: "DestroyWildDinos",
		summary: {
			ar: "يمسح كل الديناصورات البرية عشان ترجع تنزل من جديد. المروّضة ما تنمس.",
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
			ar: "يعرض رسالة اليوم زي ما يشوفها اللاعب.",
			en: "Show the message of the day the way a player sees it.",
		},
	},
	{
		danger: true,
		name: "DoExit",
		summary: {
			ar: "يقفل سيرفرك بدون حفظ — استخدم زر الإيقاف بدلها.",
			en: "Drops your server with nothing saved — use the Stop button instead.",
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

// ARK reads nothing on stdin: the game's own console is rcon, so every line typed here
// is answered by the driver instead of being written into a pipe nobody reads.
export const terminal: Bridge.Terminal = {
	kind: BridgeKind.Terminal,
	commands,
	rules,
	run: consoleHandler,
};
