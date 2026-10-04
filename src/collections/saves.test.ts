import { describe, expect, it } from "bun:test";
import type { Bridge } from "@serverkgg/bridge";
import { BridgeEventName } from "@serverkgg/bridge/protocol";
import { OFFICIAL_MAPS, SAVED_ARKS_DIRECTORY, savedArkDirectory } from "../shared";
import { saves, worldWipedText } from "./saves";

const harness = (options: { maps?: string[]; variables?: Record<string, string> }) => {
	const maps = options.maps ?? [];
	const removed: string[] = [];
	const commands: string[][] = [];
	const reported: Bridge.Activity[] = [];

	const context = {
		activity: {
			report(entry: Bridge.Activity) {
				reported.push(entry);
			},
		},
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
		variable(key: string) {
			return options.variables?.[key] ?? null;
		},
	} as unknown as Bridge.Context;

	return {
		commands,
		context,
		removed,
		reported,
	};
};

describe("listing the saved worlds", () => {
	it("names each map folder, its size and the one the server boots into", async () => {
		const { context } = harness({
			maps: [
				"Ragnarok_WP",
				"TheIsland_WP",
			],
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

	it("reads the folders with find rather than walking the whole volume", async () => {
		const { commands, context } = harness({
			maps: [
				"TheIsland_WP",
			],
		});

		await saves.list(context);

		expect(commands.at(0)?.at(0)).toBe("find");
		expect(commands.at(1)?.at(0)).toBe("du");
	});

	it("answers with nothing at all before the first save", async () => {
		const { context } = harness({});

		expect(await saves.list(context)).toEqual([]);
	});
});

describe("wiping one map's world", () => {
	it("removes exactly that map's folder", async () => {
		const { context, removed } = harness({
			maps: [
				"TheIsland_WP",
			],
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

	it("refuses a row id that is a path rather than a folder name", async () => {
		const { context, removed } = harness({
			maps: [
				"TheIsland_WP",
			],
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

describe("the activity a wipe reports", () => {
	it("names the wiped map's world", async () => {
		const { context, reported } = harness({
			maps: [
				"ScorchedEarth_WP",
			],
		});

		await saves.actions?.wipe?.(
			context,
			{
				id: "ScorchedEarth_WP",
			},
			{},
		);

		expect(reported).toMatchObject([
			{
				details: {
					map: "ScorchedEarth_WP",
					world: "Scorched Earth",
				},
				name: BridgeEventName.WorldWiped,
				subject: "Scorched Earth",
			},
		]);
	});

	it("reports nothing when the wipe is refused", async () => {
		const { context, reported } = harness({
			maps: [
				"ScorchedEarth_WP",
			],
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

		expect(reported).toEqual([]);
	});
});

describe("worldWipedText", () => {
	it("never puts an article in front of a map name, for every official map", () => {
		for (const map of OFFICIAL_MAPS) {
			const text = worldWipedText(map.name);

			expect(text.en).not.toMatch(/\bthe\s+the\b/i);
			expect(text.en).not.toMatch(/\b(the|a|an)\s+(?=[A-Z])/);
			expect(text.ar).not.toContain(`ال${map.name.ar}`);
		}
	});
});
