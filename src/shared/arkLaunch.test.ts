import { describe, expect, test } from "bun:test";
import type { Bridge } from "@serverkgg/bridge";
import { INSTALL_STAMP_FILE } from "@serverkgg/bridge/install";
import { BridgeEventName } from "@serverkgg/bridge/protocol";
import { applyLaunchVariables, LAUNCH_TARGET, launchChanges, launchSnapshot, worldActivatedText } from "./arkLaunch";
import { OFFICIAL_MAPS } from "./arkMaps";
import { readArkStamp } from "./arkStamp";
import { type ArkLaunchVariables, CROSSPLAY_VARIABLE, MAP_VARIABLE, MAX_PLAYERS_VARIABLE } from "./arkVariables";

const PASSWORD = "admin-password-never-shown";

const ISLAND: ArkLaunchVariables = {
	battleye: false,
	crossplay: true,
	exclusiveJoin: false,
	map: "TheIsland_WP",
	maxPlayers: 20,
};

const harness = (launch?: Record<string, string> | string, failWrites = false) => {
	const stored = new Map<string, string>([
		[
			INSTALL_STAMP_FILE,
			JSON.stringify({
				adminPassword: PASSWORD,
				launch,
			}),
		],
	]);
	const reported: Bridge.Activity[] = [];
	const warnings: string[] = [];

	const context = {
		activity: {
			report(entry: Bridge.Activity) {
				reported.push(entry);
			},
		},
		files: {
			async ensure() {
				return;
			},
			async exists(path: string) {
				return stored.has(path);
			},
			async read(path: string) {
				return stored.get(path) ?? "";
			},
			async write(path: string, content: string) {
				if (failWrites) {
					throw new Error("the volume is read-only");
				}

				stored.set(path, content);
			},
		},
		log: Object.assign(() => undefined, {
			error: () => undefined,
			warn: (message: string) => {
				warnings.push(message);
			},
		}),
	} as unknown as Bridge.Context;

	return {
		context,
		reported,
		warnings,
	};
};

describe("launchChanges", () => {
	test("names only the keys that were there before and moved", () => {
		expect(
			launchChanges(
				{
					[MAP_VARIABLE]: "TheIsland_WP",
				},
				launchSnapshot(ISLAND),
			),
		).toEqual([]);
		expect(
			launchChanges(
				launchSnapshot(ISLAND),
				launchSnapshot({
					...ISLAND,
					map: "Ragnarok_WP",
					maxPlayers: 40,
				}),
			),
		).toEqual([
			MAP_VARIABLE,
			MAX_PLAYERS_VARIABLE,
		]);
	});
});

describe("applying the launch variables at boot", () => {
	test("records the first boot quietly", async () => {
		const { context, reported } = harness();

		await applyLaunchVariables(context, await readArkStamp(context), ISLAND);

		expect(reported).toEqual([]);
		expect((await readArkStamp(context)).launch).toEqual(launchSnapshot(ISLAND));
	});

	test("reports nothing when nothing moved", async () => {
		const { context, reported } = harness(launchSnapshot(ISLAND));

		await applyLaunchVariables(context, await readArkStamp(context), ISLAND);

		expect(reported).toEqual([]);
	});

	test("reports a new map by its display name beside the one it replaced", async () => {
		const { context, reported } = harness(launchSnapshot(ISLAND));

		await applyLaunchVariables(context, await readArkStamp(context), {
			...ISLAND,
			map: "Ragnarok_WP",
		});

		expect(reported).toMatchObject([
			{
				details: {
					map: "Ragnarok_WP",
					previous: "The Island",
					previousMap: "TheIsland_WP",
					world: "Ragnarok",
				},
				name: BridgeEventName.WorldActivated,
				subject: "Ragnarok",
			},
		]);
		expect(reported.at(0)?.text.en).toContain("keeps its own save");
		expect(JSON.stringify(reported)).not.toContain(PASSWORD);
		expect((await readArkStamp(context)).launch[MAP_VARIABLE]).toBe("Ragnarok_WP");
	});

	test("reports the other launch options by key name and count", async () => {
		const { context, reported } = harness(launchSnapshot(ISLAND));

		await applyLaunchVariables(context, await readArkStamp(context), {
			...ISLAND,
			battleye: true,
			maxPlayers: 40,
		});

		expect(reported).toMatchObject([
			{
				details: {
					count: 2,
					keys: "BATTLEYE, MAX_PLAYERS",
					target: LAUNCH_TARGET,
				},
				name: BridgeEventName.SettingsApplied,
			},
		]);
	});

	test("starts anyway and reports nothing when the stamp cannot be written", async () => {
		const { context, reported, warnings } = harness(launchSnapshot(ISLAND), true);

		await applyLaunchVariables(context, await readArkStamp(context), {
			...ISLAND,
			map: "Ragnarok_WP",
		});

		expect(reported).toEqual([]);
		expect(warnings).toHaveLength(1);
	});

	test("treats a malformed launch record as a first boot", async () => {
		const { context, reported } = harness("not a record");

		await applyLaunchVariables(context, await readArkStamp(context), ISLAND);

		expect(reported).toEqual([]);
		expect((await readArkStamp(context)).launch).toEqual(launchSnapshot(ISLAND));
	});

	test("reports nothing when the stored value only differs in how it is written", async () => {
		const { context, reported } = harness({
			...launchSnapshot(ISLAND),
			[CROSSPLAY_VARIABLE]: "True",
			[MAX_PLAYERS_VARIABLE]: "20.000000",
		});

		await applyLaunchVariables(context, await readArkStamp(context), ISLAND);

		expect(reported).toEqual([]);
		expect((await readArkStamp(context)).launch).toEqual(launchSnapshot(ISLAND));
	});
});

describe("worldActivatedText", () => {
	test("never puts an article in front of a map name, for every official map", () => {
		for (const from of OFFICIAL_MAPS) {
			for (const to of OFFICIAL_MAPS) {
				const text = worldActivatedText(from.name, to.name);

				expect(text.en).not.toMatch(/\bthe\s+the\b/i);
				expect(text.en).not.toMatch(/\b(the|a|an)\s+(?=[A-Z])/);
				expect(text.ar).not.toContain(`ال${from.name.ar}`);
				expect(text.ar).not.toContain(`ال${to.name.ar}`);
			}
		}
	});
});
