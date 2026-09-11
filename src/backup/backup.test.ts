import { describe, expect, test } from "bun:test";
import { type Bridge, BridgeRconCode, BridgeRconError } from "@serverkgg/bridge";
import { SAVE_LINE } from "../lifecycle";
import { SAVE_WORLD } from "../shared";
import { backup } from "./backup";

const SAVE_REPLY = "World Save Complete";

interface Harness {
	password: string;
	running?: boolean;
	reachable?: boolean;
	answers?: boolean;
}

const harness = (options: Harness) => {
	const sent: string[] = [];
	const notes: string[] = [];

	const context = {
		server: {
			running: options.running ?? true,
		},
		files: {
			exists: async () => true,
			read: async () =>
				JSON.stringify({
					adminPassword: options.password,
				}),
		},
		rcon: {
			source: async () => {
				if (options.reachable === false) {
					throw new BridgeRconError(BridgeRconCode.Unreachable, "no rcon on this port");
				}

				return {
					command: async (input: string) => {
						sent.push(input);

						return "";
					},
					disconnect: async () => undefined,
				};
			},
		},
		logs: {
			watch: async (pattern: RegExp) => {
				return (options.answers ?? true) ? SAVE_REPLY.match(pattern) : null;
			},
		},
		log: Object.assign(
			(message: string) => {
				notes.push(message);
			},
			{
				warn: () => undefined,
			},
		),
	} as unknown as Bridge.Context;

	return {
		context,
		sent,
		notes,
	};
};

describe("holding the world still before the backup", () => {
	test("asks ark to save the world and waits for the line it prints when it is done", async () => {
		const run = harness({
			password: "saves-cleanly",
		});

		await backup.quiesce?.(run.context);

		expect(run.sent).toEqual([
			SAVE_WORLD,
		]);
		expect(run.notes).toEqual([
			"saved the world before the backup",
		]);
	});

	test("raises when rcon will not take the save, so the point is not labelled clean", async () => {
		const run = harness({
			password: "no-rcon",
			reachable: false,
		});

		await expect(backup.quiesce?.(run.context)).rejects.toThrow("the world could not be saved before the backup");
		expect(run.notes).toEqual([]);
	});

	test("raises when the save never reports, so the point is not labelled clean", async () => {
		const run = harness({
			answers: false,
			password: "never-confirms",
		});

		await expect(backup.quiesce?.(run.context)).rejects.toThrow(
			"the world did not report itself saved before the backup",
		);
		expect(run.notes).toEqual([]);
	});

	test("sends nothing to a server that is not running", async () => {
		const run = harness({
			password: "parked",
			running: false,
		});

		await backup.quiesce?.(run.context);

		expect(run.sent).toEqual([]);
	});

	test("matches the line a real ark console prints when the save finishes", () => {
		expect(SAVE_LINE.test(SAVE_REPLY)).toBe(true);
	});
});
