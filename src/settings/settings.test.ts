import { describe, expect, test } from "bun:test";
import type { Bridge } from "@serverkgg/bridge";
import { INSTALL_STAMP_FILE } from "@serverkgg/bridge/install";
import {
	GAME_FILE,
	GAME_USER_SETTINGS_FILE,
	pendingFor,
	readArkStamp,
	SERVER_SETTINGS_SECTION,
	SESSION_SETTINGS_SECTION,
	SHOOTER_GAME_MODE_SECTION,
} from "../shared";
import { settings } from "./settings";

type IniStore = Map<string, Record<string, Bridge.Values>>;

interface Harness {
	context: Bridge.Context;
	server: {
		running: boolean;
	};
	section(file: string, section: string): Bridge.Values;
}

const harness = (options: { running: boolean; ini?: Record<string, Record<string, Bridge.Values>> }): Harness => {
	const store: IniStore = new Map(Object.entries(options.ini ?? {}));
	const files = new Map<string, string>([
		[
			INSTALL_STAMP_FILE,
			JSON.stringify({
				adminPassword: "live",
			}),
		],
	]);
	const server = {
		running: options.running,
	};

	const context = {
		codec: {
			ini: {
				async merge(
					path: string,
					values: Bridge.Values,
					codecOptions?: {
						section?: string;
					},
				) {
					const sections = store.get(path) ?? {};
					const section = codecOptions?.section ?? "";

					store.set(path, {
						...sections,
						[section]: {
							...sections[section],
							...values,
						},
					});
				},
				async read(
					path: string,
					codecOptions?: {
						section?: string;
					},
				) {
					return store.get(path)?.[codecOptions?.section ?? ""] ?? {};
				},
			},
		},
		files: {
			async ensure() {
				return;
			},
			async exists(path: string) {
				return store.has(path) || files.has(path);
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
		server,
	} as unknown as Bridge.Context;

	return {
		context,
		section(file: string, section: string) {
			return store.get(file)?.[section] ?? {};
		},
		server,
	};
};

describe("reading the settings the panel shows", () => {
	test("shows what the two ini files say while nothing is parked", async () => {
		const { context } = harness({
			ini: {
				[GAME_FILE]: {
					[SHOOTER_GAME_MODE_SECTION]: {
						MatingIntervalMultiplier: "0.5",
					},
				},
				[GAME_USER_SETTINGS_FILE]: {
					[SERVER_SETTINGS_SECTION]: {
						XPMultiplier: "2.000000",
					},
					[SESSION_SETTINGS_SECTION]: {
						SessionName: "our tribe",
					},
				},
			},
			running: false,
		});

		expect(await settings.read(context)).toMatchObject({
			MatingIntervalMultiplier: 0.5,
			SessionName: "our tribe",
			XPMultiplier: 2,
		});
	});

	test("shows the owner his own value after the game rewrote the ini on shutdown", async () => {
		const { context, section } = harness({
			ini: {
				[GAME_USER_SETTINGS_FILE]: {
					[SERVER_SETTINGS_SECTION]: {
						XPMultiplier: "1.000000",
					},
				},
			},
			running: true,
		});

		await settings.write?.(context, {
			XPMultiplier: 3,
		});

		section(GAME_USER_SETTINGS_FILE, SERVER_SETTINGS_SECTION).XPMultiplier = "1.000000";

		expect(await settings.read(context)).toMatchObject({
			XPMultiplier: 3,
		});
	});
});

describe("writing a setting while the game is running", () => {
	test("writes it into the ini the game reads at its next start", async () => {
		const { context, section } = harness({
			running: true,
		});

		await settings.write?.(context, {
			XPMultiplier: 3,
		});

		expect(section(GAME_USER_SETTINGS_FILE, SERVER_SETTINGS_SECTION).XPMultiplier).toBe("3");
	});

	test("parks it too, because the game rewrites the ini when it shuts down", async () => {
		const { context } = harness({
			running: true,
		});

		await settings.write?.(context, {
			XPMultiplier: 3,
		});

		expect(
			pendingFor((await readArkStamp(context)).settingsPending, GAME_USER_SETTINGS_FILE, SERVER_SETTINGS_SECTION),
		).toEqual({
			XPMultiplier: "3",
		});
	});

	test("puts a breeding key in Game.ini rather than in the settings the game rewrites", async () => {
		const { context, section } = harness({
			running: true,
		});

		await settings.write?.(context, {
			BabyMatureSpeedMultiplier: 10,
		});

		expect(section(GAME_FILE, SHOOTER_GAME_MODE_SECTION).BabyMatureSpeedMultiplier).toBe("10");
		expect(pendingFor((await readArkStamp(context)).settingsPending, GAME_FILE, SHOOTER_GAME_MODE_SECTION)).toEqual({
			BabyMatureSpeedMultiplier: "10",
		});
	});

	test("refuses a value outside the field before anything is written or parked", async () => {
		const { context, section } = harness({
			running: true,
		});

		await expect(
			settings.write?.(context, {
				AutoSavePeriodMinutes: 0,
			}),
		).rejects.toThrow();

		expect(section(GAME_USER_SETTINGS_FILE, SERVER_SETTINGS_SECTION).AutoSavePeriodMinutes).toBeUndefined();
		expect((await readArkStamp(context)).settingsPending).toEqual({});
	});
});

describe("writing a setting while the game is stopped", () => {
	test("writes it into the ini, which nothing is going to overwrite", async () => {
		const { context, section } = harness({
			running: false,
		});

		await settings.write?.(context, {
			XPMultiplier: 3,
		});

		expect(section(GAME_USER_SETTINGS_FILE, SERVER_SETTINGS_SECTION).XPMultiplier).toBe("3");
		expect((await readArkStamp(context)).settingsPending).toEqual({});
	});

	test("drops the older running write so the next start does not replay it over this one", async () => {
		const { context, server } = harness({
			running: true,
		});

		await settings.write?.(context, {
			TamingSpeedMultiplier: 2,
			XPMultiplier: 3,
		});

		server.running = false;

		await settings.write?.(context, {
			XPMultiplier: 5,
		});

		expect(
			pendingFor((await readArkStamp(context)).settingsPending, GAME_USER_SETTINGS_FILE, SERVER_SETTINGS_SECTION),
		).toEqual({
			TamingSpeedMultiplier: "2",
		});
	});
});

// The platform's own ini codec is not reachable from a game package — @serverkgg/bridge
// exports no "./codecs" subpath — so this stand-in follows the same contract: comments,
// section headers and untouched lines are copied through, a known key is rewritten in
// place, and an unknown one is appended to the end of its section.
const readIniText = (contents: string, section: string) => {
	const values: Record<string, string> = {};

	let current = "";

	for (const line of contents.split("\n")) {
		const trimmed = line.trim();

		if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
			current = trimmed.slice(1, -1);

			continue;
		}

		const separator = line.indexOf("=");

		if (current !== section || trimmed.startsWith(";") || trimmed.startsWith("#") || separator === -1) {
			continue;
		}

		values[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
	}

	return values;
};

const mergeIniText = (contents: string, values: Record<string, string>, section: string) => {
	const pending = new Map(Object.entries(values));
	const output: string[] = [];

	let current = "";

	for (const line of contents.split("\n")) {
		const trimmed = line.trim();

		if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
			current = trimmed.slice(1, -1);
			output.push(line);

			continue;
		}

		const separator = line.indexOf("=");
		const key = current === section && separator !== -1 ? line.slice(0, separator).trim() : "";
		const replacement = pending.get(key);

		if (replacement === undefined) {
			output.push(line);

			continue;
		}

		pending.delete(key);
		output.push(`${key}=${replacement}`);
	}

	for (const [key, value] of pending) {
		output.push(`[${section}]`, `${key}=${value}`);
	}

	return output.join("\n");
};

const PREAMBLE_INI = [
	";METADATA=(Diff=true, UseCommands=true)",
	"[ServerSettings]",
	"ServerAdminPassword=live",
	"ServerPassword=",
	"XPMultiplier=1.000000",
	"RCONEnabled=True",
	"RCONPort=27020",
	"",
	"[SessionSettings]",
	"SessionName=our tribe",
	"",
].join("\n");

const textHarness = (contents: string) => {
	const files = new Map<string, string>([
		[
			GAME_USER_SETTINGS_FILE,
			contents,
		],
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
					const strings: Record<string, string> = {};

					for (const [key, value] of Object.entries(values)) {
						strings[key] = String(value);
					}

					files.set(path, mergeIniText(files.get(path) ?? "", strings, options?.section ?? ""));
				},
				async read(
					path: string,
					options?: {
						section?: string;
					},
				) {
					return readIniText(files.get(path) ?? "", options?.section ?? "");
				},
			},
		},
		files: {
			async ensure() {
				return;
			},
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
		server: {
			running: false,
		},
	} as unknown as Bridge.Context;

	return {
		context,
		text() {
			return files.get(GAME_USER_SETTINGS_FILE) ?? "";
		},
	};
};

describe("the file the game actually writes", () => {
	test("reads past the metadata line the game puts before the first section", async () => {
		const { context } = textHarness(PREAMBLE_INI);

		expect(await settings.read(context)).toMatchObject({
			ServerPassword: "",
			SessionName: "our tribe",
			XPMultiplier: 1,
		});
	});

	test("a write leaves the metadata line, the blank join password and every other line alone", async () => {
		const { context, text } = textHarness(PREAMBLE_INI);

		await settings.write?.(context, {
			XPMultiplier: 3,
		});

		expect(text()).toBe(PREAMBLE_INI.replace("XPMultiplier=1.000000", "XPMultiplier=3"));
	});

	test("the metadata line is never read back as a setting", async () => {
		const { context } = textHarness(PREAMBLE_INI);

		expect(await settings.read(context)).not.toHaveProperty(";METADATA");
	});
});
