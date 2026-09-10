import { beforeEach, describe, expect, test } from "bun:test";
import { type Bridge, BridgeUserError } from "@serverkgg/bridge";
import { INSTALL_STAMP_FILE } from "@serverkgg/bridge/install";
import { releaseRcon, roster } from "../shared";
import { consoleHandler, parseConsoleLine, rosterLines } from "./consoleHandler";

const EOS_ONE = "0002d6b1b2c34d56789abcdef0123456";

interface Emitted {
	event: string;
	payload: Bridge.Values | undefined;
}

const handlerContext = (replies: Record<string, string>) => {
	const sent: string[] = [];
	const emitted: Emitted[] = [];
	const stored = new Map<string, string>([
		[
			INSTALL_STAMP_FILE,
			JSON.stringify({
				adminPassword: "live",
			}),
		],
	]);

	const context = {
		emit(event: string, payload?: Bridge.Values) {
			emitted.push({
				event,
				payload,
			});
		},
		files: {
			async exists(path: string) {
				return stored.has(path);
			},
			async read(path: string) {
				return stored.get(path) ?? "";
			},
			async write(path: string, content: string) {
				stored.set(path, content);
			},
		},
		log: Object.assign(() => undefined, {
			error: () => undefined,
			warn: () => undefined,
		}),
		rcon: {
			async source() {
				return {
					async command(text: string) {
						sent.push(text);

						return replies[text] ?? "";
					},
					connected: true,
					async connect() {
						return;
					},
					async disconnect() {
						return;
					},
				};
			},
		},
	} as unknown as Bridge.Context;

	return {
		context,
		emitted,
		sent,
	};
};

beforeEach(() => {
	releaseRcon();
	roster.clear();
});

describe("parseConsoleLine", () => {
	test("splits a name off its arguments", () => {
		expect(parseConsoleLine("ServerChat hello there")).toEqual({
			args: [
				"hello",
				"there",
			],
			name: "serverchat",
			rest: "hello there",
			text: "ServerChat hello there",
		});
	});

	// ARK's own console takes `cheat <command>`; over rcon a doubled prefix answers with
	// nothing at all, so it is stripped before the line goes anywhere.
	test("strips the cheat prefix the in-game console needs", () => {
		expect(parseConsoleLine("cheat SaveWorld").text).toBe("SaveWorld");
		expect(parseConsoleLine("admincheat DestroyWildDinos").text).toBe("DestroyWildDinos");
	});
});

describe("rosterLines", () => {
	test("says plainly that nobody is on", () => {
		expect(rosterLines([])).toEqual([
			"no players online",
		]);
	});

	test("prints a header and one row per player", () => {
		expect(
			rosterLines([
				{
					eosId: EOS_ONE,
					id: EOS_ONE,
					name: "sara",
				},
			]),
		).toEqual([
			"name,eosid",
			`sara,${EOS_ONE}`,
		]);
	});
});

describe("consoleHandler", () => {
	test("passes an unknown command through to rcon as it was typed", async () => {
		const { context, sent } = handlerContext({
			"GiveItemNumToPlayer 1 1 1 0": "Gave item",
		});

		const reply = await consoleHandler(context, "cheat GiveItemNumToPlayer 1 1 1 0");

		expect(sent).toEqual([
			"GiveItemNumToPlayer 1 1 1 0",
		]);
		expect(reply?.line).toBe("Gave item");
	});

	test("says what it sent when the game answers with an empty body", async () => {
		const { context } = handlerContext({});

		expect((await consoleHandler(context, "SaveWorld"))?.line).toBe("sent: SaveWorld");
	});

	test("resolves a player name to the account id the game acts on", async () => {
		const { context, emitted, sent } = handlerContext({
			ListPlayers: `0. sara, ${EOS_ONE}`,
		});

		const reply = await consoleHandler(context, "KickPlayer sara");

		expect(sent).toContain(`KickPlayer ${EOS_ONE}`);
		expect(reply?.line).toBe("kicked: sara");
		expect(emitted.at(-1)?.event).toBe("PlayerKicked");
	});

	test("bans an account id for someone who is not on", async () => {
		const { context, sent } = handlerContext({
			ListPlayers: "No Players Connected",
		});

		await consoleHandler(context, `BanPlayer ${EOS_ONE}`);

		expect(sent).toContain(`BanPlayer ${EOS_ONE}`);
	});

	test("refuses a name that is neither online nor an account id", async () => {
		const { context } = handlerContext({
			ListPlayers: "No Players Connected",
		});

		expect(consoleHandler(context, "KickPlayer nobody")).rejects.toThrow(BridgeUserError);
	});

	test("answers ListPlayers from the roster rather than the raw reply", async () => {
		const { context } = handlerContext({
			ListPlayers: `Keep Alive\n0. sara, ${EOS_ONE}`,
		});

		expect((await consoleHandler(context, "listplayers"))?.line).toBe(`name,eosid\nsara,${EOS_ONE}`);
	});

	// DoExit drops the process with nothing saved, and the platform's own Stop does the
	// save and the bookkeeping, so the console never offers it as a working command.
	test("refuses DoExit and points at the Stop button", async () => {
		const { context, sent } = handlerContext({});

		expect(consoleHandler(context, "DoExit")).rejects.toThrow(BridgeUserError);
		expect(sent).toEqual([]);
	});

	test("lets an empty line fall through untouched", async () => {
		const { context } = handlerContext({});

		expect(await consoleHandler(context, "   ")).toBeNull();
	});
});
