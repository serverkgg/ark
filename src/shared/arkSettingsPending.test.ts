import { describe, expect, test } from "bun:test";
import type { Bridge } from "@serverkgg/bridge";
import { INSTALL_STAMP_FILE } from "@serverkgg/bridge/install";
import { GAME_USER_SETTINGS_FILE, SERVER_SETTINGS_SECTION } from "./arkApp";
import {
	flattenPending,
	forgetPending,
	forgetPendingSettings,
	mergePending,
	pendingCount,
	pendingFor,
	recordPendingSettings,
	replayPendingSettings,
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

	const context = {
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
	};
};

describe("mergePending", () => {
	test("folds a second write into the same section rather than replacing it", () => {
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

	test("lets a later write win on the same key", () => {
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

	test("ignores an empty patch", () => {
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

	test("drops only the keys that were just written, and leaves the rest parked", () => {
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

	test("drops the section once its last key is gone", () => {
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

	test("leaves a key parked when another file happens to use the same name", () => {
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
	test("counts every key across every file", () => {
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
	test("parks a write while the server is up and lays it back before the next start", async () => {
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

	test("writes nothing when there is nothing parked", async () => {
		const { context, merged } = pendingContext();

		await replayPendingSettings(context, await readArkStamp(context));

		expect(merged).toEqual([]);
	});
});

describe("forgetPendingSettings", () => {
	test("drops the parked copy of a key that was written while the server was down", async () => {
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
