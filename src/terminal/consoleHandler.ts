import { type Bridge, BridgeUserError } from "@serverkgg/bridge";
import { banPlayer, kickPlayer } from "../collections";
import {
	type ArkPlayerRow,
	EOS_ID_PATTERN,
	findPlayer,
	rconCommand,
	readRoster,
	sanitizeCommand,
	stripCheatPrefix,
} from "../shared";

const SPACING = /\s+/;

const ROSTER_HEADER = "name,eosid";

export interface ArkConsoleLine {
	text: string;
	name: string;
	rest: string;
	args: string[];
}

export const parseConsoleLine = (input: string): ArkConsoleLine => {
	const text = stripCheatPrefix(sanitizeCommand(input));
	const boundary = text.search(SPACING);
	const rest = boundary < 0 ? "" : text.slice(boundary).trim();

	return {
		args: rest.length === 0 ? [] : rest.split(SPACING),
		name: (boundary < 0 ? text : text.slice(0, boundary)).toLowerCase(),
		rest,
		text,
	};
};

export const rosterLines = (rows: ArkPlayerRow[]): string[] => {
	if (rows.length === 0) {
		return [
			"no players online",
		];
	}

	return [
		ROSTER_HEADER,
		...rows.map((row) => `${row.name},${row.eosId}`),
	];
};

const needleOf = (line: ArkConsoleLine) => {
	if (line.rest.length === 0) {
		throw new BridgeUserError({
			ar: "اكتب اسم اللاعب أو معرّفه أولًا.",
			en: "Write the player name or their account ID first.",
		});
	}

	return line.rest;
};

const targetOf = async (context: Bridge.Context, line: ArkConsoleLine): Promise<ArkPlayerRow> => {
	const needle = needleOf(line);
	const found = findPlayer((await readRoster(context)) ?? [], needle);

	if (found) {
		return found;
	}

	if (!EOS_ID_PATTERN.test(needle)) {
		throw new BridgeUserError({
			ar: "لا يوجد لاعب متصل بهذا الاسم الآن. للاعب غير متصل، اكتب معرّفه.",
			en: "No player with that name is online right now. For someone who's offline, write their account ID.",
		});
	}

	return {
		eosId: needle.toLowerCase(),
		id: needle.toLowerCase(),
		name: needle.toLowerCase(),
	};
};

type ArkConsoleCommand = (context: Bridge.Context, line: ArkConsoleLine) => Promise<string[]>;

export const consoleCommands: Record<string, ArkConsoleCommand> = {
	async banplayer(context, line) {
		const row = await targetOf(context, line);

		await banPlayer(context, row);

		return [
			`banned: ${row.name}`,
		];
	},

	async doexit() {
		throw new BridgeUserError({
			ar: "يغلق DoExit سيرفرك دون حفظ ودون أي ترتيب بعده. استخدم زر الإيقاف في الأعلى بدلًا منه.",
			en: "DoExit drops your server with nothing saved and nothing cleaned up. Use the Stop button above instead.",
		});
	},

	async kickplayer(context, line) {
		const row = await targetOf(context, line);

		await kickPlayer(context, row);

		return [
			`kicked: ${row.name}`,
		];
	},

	async listplayers(context) {
		return rosterLines((await readRoster(context)) ?? []);
	},
};

export const consoleHandler: NonNullable<Bridge.Terminal["run"]> = async (context, input) => {
	const line = parseConsoleLine(input);

	if (line.name.length === 0) {
		return null;
	}

	const command = consoleCommands[line.name];

	if (command) {
		return {
			groups: {},
			line: (await command(context, line)).join("\n"),
			sent: input,
		};
	}

	const reply = (await rconCommand(context, line.text)).trim();

	return {
		groups: {},
		line: reply.length === 0 ? `sent: ${line.text}` : reply,
		sent: input,
	};
};
