import { describe, expect, test } from "bun:test";
import type { Bridge } from "@serverkgg/bridge";
import { SAVED_ARKS_DIRECTORY, savedArkDirectory } from "../shared";
import { saves } from "./saves";

const harness = (options: { running: boolean; maps?: string[]; variables?: Record<string, string> }) => {
	const maps = options.maps ?? [];
	const removed: string[] = [];
	const commands: string[][] = [];

	const context = {
		async exec(command: string[]) {
			commands.push(command);

			if (command.at(0) === "find") {
				return {
					code: 0,
					stderr: "",
					stdout: `${maps.join("\n")}\n`,
				};
			}

			return {
				code: 0,
				stderr: "",
				stdout: maps.map((map, index) => `${index + 1}\t${savedArkDirectory(map)}`).join("\n"),
			};
		},
		files: {
			async exists(path: string) {
				return path === SAVED_ARKS_DIRECTORY || maps.some((map) => savedArkDirectory(map) === path);
			},
			async remove(path: string) {
				removed.push(path);
			},
		},
		log: Object.assign(() => undefined, {
			error: () => undefined,
			warn: () => undefined,
		}),
		server: {
			running: options.running,
		},
		variable(key: string) {
			return options.variables?.[key] ?? null;
		},
	} as unknown as Bridge.Context;

	return {
		commands,
		context,
		removed,
	};
};

describe("listing the saved worlds", () => {
	test("names each map folder, its size and the one the server boots into", async () => {
		const { context } = harness({
			maps: [
				"Ragnarok_WP",
				"TheIsland_WP",
			],
			running: false,
			variables: {
				MAP: "TheIsland_WP",
			},
		});

		expect(await saves.list(context)).toEqual([
			{
				active: "",
				id: "Ragnarok_WP",
				map: {
					ar: "راقناروك",
					en: "Ragnarok",
				},
				size: "1 MB",
			},
			{
				active: "✓",
				id: "TheIsland_WP",
				map: {
					ar: "ذا آيلاند",
					en: "The Island",
				},
				size: "2 MB",
			},
		]);
	});

	test("reads the folders with find rather than walking the whole volume", async () => {
		const { commands, context } = harness({
			maps: [
				"TheIsland_WP",
			],
			running: false,
		});

		await saves.list(context);

		expect(commands.at(0)?.at(0)).toBe("find");
		expect(commands.at(1)?.at(0)).toBe("du");
	});

	test("answers with nothing at all before the first save", async () => {
		const { context } = harness({
			running: false,
		});

		expect(await saves.list(context)).toEqual([]);
	});
});

describe("wiping one map's world", () => {
	test("refuses while the server is up, because the game would write it back out of memory", async () => {
		const { context, removed } = harness({
			maps: [
				"TheIsland_WP",
			],
			running: true,
		});

		await expect(
			saves.actions?.wipe?.(
				context,
				{
					id: "TheIsland_WP",
				},
				{},
			),
		).rejects.toThrow();

		expect(removed).toEqual([]);
	});

	test("removes exactly that map's folder", async () => {
		const { context, removed } = harness({
			maps: [
				"TheIsland_WP",
			],
			running: false,
		});

		await saves.actions?.wipe?.(
			context,
			{
				id: "TheIsland_WP",
			},
			{},
		);

		expect(removed).toEqual([
			savedArkDirectory("TheIsland_WP"),
		]);
	});

	test("refuses a row id that is a path rather than a folder name", async () => {
		const { context, removed } = harness({
			maps: [
				"TheIsland_WP",
			],
			running: false,
		});

		await expect(
			saves.actions?.wipe?.(
				context,
				{
					id: "../../ShooterGame",
				},
				{},
			),
		).rejects.toThrow();

		expect(removed).toEqual([]);
	});
});
