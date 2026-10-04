import { describe, expect, it } from "bun:test";
import type { Bridge } from "@serverkgg/bridge";
import { INSTALL_STAMP_FILE } from "@serverkgg/bridge/install";
import { BridgeEventName } from "@serverkgg/bridge/protocol";
import { sameSettingValue } from "@serverkgg/bridge/utils";
import { GAME_USER_SETTINGS_FILE, SERVER_SETTINGS_SECTION } from "./arkApp";
import {
	changedPendingKeys,
	flattenPending,
	forgetPending,
	forgetPendingSettings,
	mergeBaseline,
	mergePending,
	pendingCount,
	pendingFor,
	recordPendingSettings,
	replayPendingSettings,
	secretBaseline,
} from "./arkSettingsPending";
import { readArkStamp } from "./arkStamp";

const pendingContext = () => {
	const merged: {
		path: string;
		section: string;
		values: Bridge.Values;
	}[] = [];
	const stored = new Map<string, string>([
		[
			INSTALL_STAMP_FILE,
			JSON.stringify({
				adminPassword: "live",
			}),
		],
	]);
	const reported: Bridge.Activity[] = [];

	const context = {
		activity: {
			report(entry: Bridge.Activity) {
				reported.push(entry);
			},
		},
		codec: {
			ini: {
				async merge(
					path: string,
					values: Bridge.Values,
					options?: {
						section?: string;
					},
				) {
					merged.push({
						path,
						section: options?.section ?? "",
						values,
					});
				},
				async read() {
					return {};
				},
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
				stored.set(path, content);
			},
		},
		log: Object.assign(() => undefined, {
			error: () => undefined,
			warn: () => undefined,
		}),
	} as unknown as Bridge.Context;

	return {
		context,
		merged,
		reported,
	};
};

describe("mergePending", () => {
	it("folds a second write into the same section rather than replacing it", () => {
		const first = mergePending({}, [
			{
				file: "a.ini",
				section: "S",
				values: {
					XP: "2",
				},
			},
		]);

		expect(
			mergePending(first, [
				{
					file: "a.ini",
					section: "S",
					values: {
						Taming: "3",
					},
				},
			]),
		).toEqual({
			"a.ini": {
				S: {
					Taming: "3",
					XP: "2",
				},
			},
		});
	});

	it("lets a later write win on the same key", () => {
		const first = mergePending({}, [
			{
				file: "a.ini",
				section: "S",
				values: {
					XP: "2",
				},
			},
		]);

		expect(
			pendingFor(
				mergePending(first, [
					{
						file: "a.ini",
						section: "S",
						values: {
							XP: "5",
						},
					},
				]),
				"a.ini",
				"S",
			),
		).toEqual({
			XP: "5",
		});
	});

	it("ignores an empty patch", () => {
		expect(
			mergePending({}, [
				{
					file: "a.ini",
					section: "S",
					values: {},
				},
			]),
		).toEqual({});
	});
});

describe("forgetPending", () => {
	const parked = mergePending({}, [
		{
			file: "a.ini",
			section: "S",
			values: {
				Taming: "3",
				XP: "2",
			},
		},
		{
			file: "a.ini",
			section: "T",
			values: {
				Mating: "4",
			},
		},
	]);

	it("drops only the keys that were just written, and leaves the rest parked", () => {
		expect(
			forgetPending(parked, [
				{
					file: "a.ini",
					section: "S",
					values: {
						XP: "5",
					},
				},
			]),
		).toEqual({
			"a.ini": {
				S: {
					Taming: "3",
				},
				T: {
					Mating: "4",
				},
			},
		});
	});

	it("drops the section once its last key is gone", () => {
		expect(
			forgetPending(parked, [
				{
					file: "a.ini",
					section: "T",
					values: {
						Mating: "1",
					},
				},
			]),
		).toEqual({
			"a.ini": {
				S: {
					Taming: "3",
					XP: "2",
				},
			},
		});
	});

	it("leaves a key parked when another file happens to use the same name", () => {
		expect(
			forgetPending(parked, [
				{
					file: "b.ini",
					section: "S",
					values: {
						XP: "9",
					},
				},
			]),
		).toEqual(parked);
	});
});

describe("flattenPending and pendingCount", () => {
	it("counts every key across every file", () => {
		const pending = mergePending({}, [
			{
				file: "a.ini",
				section: "S",
				values: {
					Taming: "3",
					XP: "2",
				},
			},
			{
				file: "b.ini",
				section: "T",
				values: {
					Mating: "4",
				},
			},
		]);

		expect(flattenPending(pending)).toHaveLength(2);
		expect(pendingCount(pending)).toBe(3);
	});
});

describe("record then replay", () => {
	it("parks a write while the server is up and lays it back before the next start", async () => {
		const { context, merged } = pendingContext();

		await recordPendingSettings(context, [
			{
				file: GAME_USER_SETTINGS_FILE,
				section: SERVER_SETTINGS_SECTION,
				values: {
					XPMultiplier: "2",
				},
			},
		]);

		expect(pendingCount((await readArkStamp(context)).settingsPending)).toBe(1);

		await replayPendingSettings(context, await readArkStamp(context));

		expect(merged).toEqual([
			{
				path: GAME_USER_SETTINGS_FILE,
				section: SERVER_SETTINGS_SECTION,
				values: {
					XPMultiplier: "2",
				},
			},
		]);
		expect((await readArkStamp(context)).settingsPending).toEqual({});
	});

	it("writes nothing when there is nothing parked", async () => {
		const { context, merged } = pendingContext();

		await replayPendingSettings(context, await readArkStamp(context));

		expect(merged).toEqual([]);
	});
});

describe("the activity a replay reports", () => {
	it("reports every pending key of a stamp written before the baseline existed, and still starts", async () => {
		const { context, merged, reported } = pendingContext();

		await context.files.write(
			INSTALL_STAMP_FILE,
			JSON.stringify({
				adminPassword: "live",
				settingsPending: {
					[GAME_USER_SETTINGS_FILE]: {
						[SERVER_SETTINGS_SECTION]: {
							ServerPassword: "join-password-never-shown",
							XPMultiplier: "2",
						},
					},
				},
			}),
		);

		await replayPendingSettings(context, await readArkStamp(context));

		expect(merged).toHaveLength(1);
		expect(reported).toMatchObject([
			{
				details: {
					count: 2,
					keys: "ServerPassword, XPMultiplier",
				},
				name: BridgeEventName.SettingsApplied,
			},
		]);
		expect(JSON.stringify(reported)).not.toContain("join-password-never-shown");
		expect(JSON.stringify(reported)).not.toContain("live");
		expect(await readArkStamp(context)).toMatchObject({
			settingsBaseline: {},
			settingsPending: {},
		});
	});

	it("reports nothing when the cleared stamp cannot be written", async () => {
		const { context, reported } = pendingContext();

		await recordPendingSettings(context, [
			{
				file: GAME_USER_SETTINGS_FILE,
				section: SERVER_SETTINGS_SECTION,
				values: {
					XPMultiplier: "2",
				},
			},
		]);

		const stamp = await readArkStamp(context);

		context.files.write = async () => {
			throw new Error("the volume is read-only");
		};

		await expect(replayPendingSettings(context, stamp)).rejects.toThrow();

		expect(reported).toEqual([]);
	});

	it("reports nothing when there is nothing parked", async () => {
		const { context, reported } = pendingContext();

		await replayPendingSettings(context, await readArkStamp(context));

		expect(reported).toEqual([]);
	});
});

describe("the baseline a pending write keeps", () => {
	const patch = (values: Record<string, string>) => {
		return [
			{
				file: GAME_USER_SETTINGS_FILE,
				section: SERVER_SETTINGS_SECTION,
				values,
			},
		];
	};

	it("keeps the first baseline of a key that is already pending", () => {
		const first = mergeBaseline(
			{},
			{},
			patch({
				XPMultiplier: "2",
			}),
			{
				XPMultiplier: {
					value: "1",
				},
			},
		);
		const second = mergeBaseline(
			first,
			mergePending(
				{},
				patch({
					XPMultiplier: "2",
				}),
			),
			patch({
				XPMultiplier: "3",
			}),
			{
				XPMultiplier: {
					value: "2",
				},
			},
		);

		expect(second).toEqual({
			XPMultiplier: {
				value: "1",
			},
		});
	});

	it("keeps only whether a secret differed, never its value or a digest", () => {
		const entry = secretBaseline("old-join-password", "new-join-password");

		expect(entry).toEqual({
			changed: true,
		});
		expect(secretBaseline("same-password", "same-password")).toEqual({
			changed: false,
		});
		expect(
			changedPendingKeys(
				mergePending(
					{},
					patch({
						ServerPassword: "new-join-password",
					}),
				),
				{
					ServerPassword: entry,
				},
			),
		).toEqual([
			"ServerPassword",
		]);
	});

	it("lets a later save turn a secret's flag on but never off", () => {
		const pending = mergePending(
			{},
			patch({
				ServerPassword: "p",
			}),
		);
		const unchanged = {
			ServerPassword: {
				changed: false,
			},
		};
		const changed = {
			ServerPassword: {
				changed: true,
			},
		};

		expect(
			mergeBaseline(
				unchanged,
				pending,
				patch({
					ServerPassword: "q",
				}),
				changed,
			),
		).toEqual(changed);
		expect(
			mergeBaseline(
				changed,
				pending,
				patch({
					ServerPassword: "p",
				}),
				unchanged,
			),
		).toEqual(changed);
	});

	it("reads a digest left by an earlier build as changed, never as an error", async () => {
		const { context, reported } = pendingContext();

		await context.files.write(
			INSTALL_STAMP_FILE,
			JSON.stringify({
				adminPassword: "live",
				settingsBaseline: {
					ServerPassword: {
						digest: "0f4d1c",
					},
				},
				settingsPending: {
					[GAME_USER_SETTINGS_FILE]: {
						[SERVER_SETTINGS_SECTION]: {
							ServerPassword: "p",
						},
					},
				},
			}),
		);

		expect((await readArkStamp(context)).settingsBaseline).toEqual({
			ServerPassword: {
				changed: true,
			},
		});

		await replayPendingSettings(context, await readArkStamp(context));

		expect(reported).toMatchObject([
			{
				details: {
					keys: "ServerPassword",
				},
			},
		]);
	});

	it("compares a plain baseline the way the bridge compares settings", () => {
		expect(
			changedPendingKeys(
				mergePending(
					{},
					patch({
						Duration: "20",
						ServerPVE: "False",
						XPMultiplier: "2",
					}),
				),
				{
					Duration: {
						value: "20.000000",
					},
					ServerPVE: {
						value: "false",
					},
					XPMultiplier: {
						value: "1",
					},
				},
			),
		).toEqual([
			"XPMultiplier",
		]);
	});
});

describe("the bridge comparison the replay report relies on", () => {
	it("reads a number the game padded as the number it is", () => {
		expect(sameSettingValue("1", "1.000000")).toBe(true);
		expect(sameSettingValue("2.5", "2.500000")).toBe(true);
		expect(sameSettingValue("1", "2.000000")).toBe(false);
	});

	it("reads a boolean in any case as the same boolean", () => {
		expect(sameSettingValue("True", "true")).toBe(true);
		expect(sameSettingValue("False", "true")).toBe(false);
	});

	it("takes only plain decimals as numbers, so an exponent is different text", () => {
		expect(sameSettingValue("1e3", "1000")).toBe(false);
		expect(sameSettingValue(" My Tribe ", "My Tribe")).toBe(true);
		expect(sameSettingValue(undefined, "")).toBe(true);
		expect(sameSettingValue(undefined, "1")).toBe(false);
	});
});

describe("forgetPendingSettings", () => {
	it("drops the parked copy of a key that was written while the server was down", async () => {
		const { context } = pendingContext();

		await recordPendingSettings(context, [
			{
				file: GAME_USER_SETTINGS_FILE,
				section: SERVER_SETTINGS_SECTION,
				values: {
					TamingSpeedMultiplier: "4",
					XPMultiplier: "2",
				},
			},
		]);

		await forgetPendingSettings(context, [
			{
				file: GAME_USER_SETTINGS_FILE,
				section: SERVER_SETTINGS_SECTION,
				values: {
					XPMultiplier: "3",
				},
			},
		]);

		expect(
			pendingFor((await readArkStamp(context)).settingsPending, GAME_USER_SETTINGS_FILE, SERVER_SETTINGS_SECTION),
		).toEqual({
			TamingSpeedMultiplier: "4",
		});
	});
});
