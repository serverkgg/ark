import { beforeEach, describe, expect, test } from "bun:test";
import type { Bridge } from "@serverkgg/bridge";
import { INSTALL_STAMP_FILE } from "@serverkgg/bridge/install";
import { BridgeEventName } from "@serverkgg/bridge/protocol";
import { BAN_LIST_FILE, releaseRcon } from "../shared";
import { bans } from "./bans";

const FIRST = "0002a1b3c4d5e6f708192a3b4c5d6e7f";

const SECOND = "1112a1b3c4d5e6f708192a3b4c5d6e7f";

const harness = (options: { running: boolean; banned?: string[] }) => {
	const files = new Map<string, string>([
		[
			INSTALL_STAMP_FILE,
			JSON.stringify({
				adminPassword: "live",
			}),
		],
	]);

	if (options.banned) {
		files.set(BAN_LIST_FILE, `${options.banned.join("\n")}\n`);
	}

	const sent: string[] = [];
	const emitted: string[] = [];

	const context = {
		emit(event: string) {
			emitted.push(event);
		},
		files: {
			async exists(path: string) {
				return files.has(path);
			},
			async read(path: string) {
				return files.get(path) ?? "";
			},
			async write(path: string, content: string) {
				files.set(path, content);
			},
		},
		log: Object.assign(() => undefined, {
			error: () => undefined,
			warn: () => undefined,
		}),
		rcon: {
			async source() {
				return {
					async command(input: string) {
						sent.push(input);

						return "";
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
		server: {
			running: options.running,
		},
	} as unknown as Bridge.Context;

	return {
		context,
		emitted,
		file() {
			return files.get(BAN_LIST_FILE) ?? "";
		},
		sent,
	};
};

beforeEach(() => {
	releaseRcon();
});

describe("listing the bans", () => {
	test("reads the ids out of the file the game keeps", async () => {
		const { context } = harness({
			banned: [
				FIRST,
				SECOND,
			],
			running: false,
		});

		expect(await bans.list(context)).toEqual([
			{
				eosId: FIRST,
				id: FIRST,
			},
			{
				eosId: SECOND,
				id: SECOND,
			},
		]);
	});

	test("reads the id out of a line the game wrote with its own trailing fields", async () => {
		const { context } = harness({
			banned: [
				`${FIRST},"someone",0`,
				`${SECOND},"another",0`,
			],
			running: false,
		});

		expect(await bans.list(context)).toEqual([
			{
				eosId: FIRST,
				id: FIRST,
			},
			{
				eosId: SECOND,
				id: SECOND,
			},
		]);
	});

	test("answers with nothing at all before the file exists", async () => {
		const { context } = harness({
			running: false,
		});

		expect(await bans.list(context)).toEqual([]);
	});
});

describe("banning an account", () => {
	test("leaves the file to the running server and only sends the command", async () => {
		const { context, file, sent } = harness({
			running: true,
		});

		await bans.add?.(context, FIRST);

		expect(sent).toEqual([
			`BanPlayer ${FIRST}`,
		]);
		expect(file()).toBe("");
	});

	test("edits the file alone while the server is down", async () => {
		const { context, file, sent } = harness({
			running: false,
		});

		await bans.add?.(context, FIRST);

		expect(sent).toEqual([]);
		expect(file()).toBe(`${FIRST}\n`);
	});

	test("raises the event the activity feed reads", async () => {
		const { context, emitted } = harness({
			running: false,
		});

		await bans.add?.(context, FIRST);

		expect(emitted).toEqual([
			BridgeEventName.PlayerBanned,
		]);
	});

	test("refuses anything that is not an account id", async () => {
		const { context } = harness({
			running: false,
		});

		await expect(bans.add?.(context, "someone")).rejects.toThrow();
	});
});

describe("lifting a ban", () => {
	test("leaves the file to the running server and only sends the command", async () => {
		const { context, file, sent } = harness({
			banned: [
				FIRST,
				SECOND,
			],
			running: true,
		});

		await bans.actions?.remove?.(
			context,
			{
				eosId: FIRST,
				id: FIRST,
			},
			{},
		);

		expect(sent).toEqual([
			`UnbanPlayer ${FIRST}`,
		]);
		expect(file()).toBe(`${FIRST}\n${SECOND}\n`);
	});

	test("edits the file alone while the server is down", async () => {
		const { context, file, sent } = harness({
			banned: [
				FIRST,
				SECOND,
			],
			running: false,
		});

		await bans.actions?.remove?.(
			context,
			{
				eosId: FIRST,
				id: FIRST,
			},
			{},
		);

		expect(sent).toEqual([]);
		expect(file()).toBe(`${SECOND}\n`);
	});
});
