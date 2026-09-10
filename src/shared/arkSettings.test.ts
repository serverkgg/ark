import { describe, expect, test } from "bun:test";
import { BridgeControl } from "@serverkgg/bridge";
import {
	GAME_FILE,
	GAME_USER_SETTINGS_FILE,
	MESSAGE_OF_THE_DAY_SECTION,
	PASSWORD_MAX,
	SERVER_SETTINGS_SECTION,
	SESSION_NAME_MAX,
	SESSION_SETTINGS_SECTION,
	SHOOTER_GAME_MODE_SECTION,
} from "./arkApp";
import {
	ARK_SETTINGS,
	ArkSettingKind,
	BREEDING_FIELDS,
	CHAT_FIELDS,
	RATES_FIELDS,
	RULES_FIELDS,
	SERVER_FIELDS,
	SESSION_NAME_PATTERN,
	SETTING_BY_KEY,
	SETTINGS_SECTIONS,
	settingsByFile,
	settingUpdates,
	settingValues,
	validateSettingsWrite,
} from "./arkSettings";

// Game.ini legitimately repeats these keys, one line per override, and the ini codec
// writes a single key per line — a form field for one of them would eat the rest.
const REPEATED_GAME_KEYS = [
	"ConfigAddNPCSpawnEntriesContainer",
	"ConfigOverrideItemCraftingCosts",
	"ConfigOverrideItemMaxQuantity",
	"ConfigOverrideSupplyCrateItems",
	"EngramEntryAutoUnlocks",
	"HarvestResourceItemAmountClassMultipliers",
	"LevelExperienceRampOverrides",
	"OverrideNamedEngramEntries",
	"OverridePlayerLevelEngramPoints",
];

const ALL_FIELDS = [
	...SERVER_FIELDS,
	...RULES_FIELDS,
	...RATES_FIELDS,
	...BREEDING_FIELDS,
	...CHAT_FIELDS,
];

describe("the settings table", () => {
	test("names every key once", () => {
		expect(SETTING_BY_KEY.size).toBe(ARK_SETTINGS.length);
	});

	test("puts every key in one of the two ini files the game reads", () => {
		for (const setting of ARK_SETTINGS) {
			expect([
				GAME_FILE,
				GAME_USER_SETTINGS_FILE,
			]).toContain(setting.file);
			expect([
				MESSAGE_OF_THE_DAY_SECTION,
				SERVER_SETTINGS_SECTION,
				SESSION_SETTINGS_SECTION,
				SHOOTER_GAME_MODE_SECTION,
			]).toContain(setting.section);
		}
	});

	test("never offers a Game.ini key the file repeats", () => {
		for (const key of REPEATED_GAME_KEYS) {
			expect(SETTING_BY_KEY.has(key)).toBe(false);
		}
	});

	test("lists each file and section once, so a read walks them once", () => {
		const ids = SETTINGS_SECTIONS.map((section) => `${section.file} ${section.section}`);

		expect(new Set(ids).size).toBe(ids.length);
	});

	test("keeps the server name to what the launch line can carry", () => {
		const sessionName = SETTING_BY_KEY.get("SessionName");

		expect(sessionName?.kind).toBe(ArkSettingKind.Text);
		expect(sessionName?.file).toBe(GAME_USER_SETTINGS_FILE);
		expect(sessionName?.section).toBe(SESSION_SETTINGS_SECTION);
		expect(sessionName?.maxLength).toBe(SESSION_NAME_MAX);
		expect(sessionName?.pattern).toBe(SESSION_NAME_PATTERN);
		expect(sessionName?.patternHint).toBeDefined();
	});

	test("hides the join password from anyone who may not read it", () => {
		const password = SETTING_BY_KEY.get("ServerPassword");

		expect(password?.kind).toBe(ArkSettingKind.Secret);
		expect(password?.maxLength).toBe(PASSWORD_MAX);
	});
});

describe("the fields the panel renders", () => {
	test("covers the whole table and nothing else", () => {
		expect(ALL_FIELDS.map((field) => field.key).sort()).toEqual(ARK_SETTINGS.map((setting) => setting.key).sort());
	});

	test("labels every field in both languages", () => {
		for (const field of ALL_FIELDS) {
			expect(field.label.ar.length).toBeGreaterThan(0);
			expect(field.label.en.length).toBeGreaterThan(0);
		}
	});

	test("maps each kind onto the control the web knows", () => {
		const controls = new Map(
			ALL_FIELDS.map((field) => [
				field.key,
				field.control,
			]),
		);

		expect(controls.get("SessionName")).toBe(BridgeControl.Text);
		expect(controls.get("ServerPassword")).toBe(BridgeControl.Secret);
		expect(controls.get("ServerPVE")).toBe(BridgeControl.Boolean);
		expect(controls.get("XPMultiplier")).toBe(BridgeControl.Number);
	});
});

describe("settingValues", () => {
	test("reads the ini text back as the type the form expects", () => {
		expect(
			settingValues({
				ServerPVE: "True",
				SessionName: "our tribe",
				XPMultiplier: "2.500000",
			}),
		).toMatchObject({
			ServerPVE: true,
			SessionName: "our tribe",
			XPMultiplier: 2.5,
		});
	});

	test("falls back to the game's own default for a key the file never had", () => {
		expect(settingValues({})).toMatchObject({
			AutoSavePeriodMinutes: 15,
			ServerCrosshair: true,
			ServerPVE: false,
			XPMultiplier: 1,
		});
	});
});

describe("settingUpdates and settingsByFile", () => {
	test("writes booleans the way ARK writes them", () => {
		expect(
			settingUpdates({
				ServerHardcore: false,
				ServerPVE: true,
			}),
		).toEqual({
			ServerHardcore: "False",
			ServerPVE: "True",
		});
	});

	test("drops a key the table does not own", () => {
		expect(
			settingUpdates({
				NotASetting: "1",
			}),
		).toEqual({});
	});

	test("splits one write across the files and sections it belongs to", () => {
		const patches = settingsByFile(
			settingUpdates({
				MatingIntervalMultiplier: 0.5,
				Message: "welcome",
				ServerPVE: true,
				SessionName: "our tribe",
			}),
		);

		expect(patches).toContainEqual({
			file: GAME_USER_SETTINGS_FILE,
			section: SESSION_SETTINGS_SECTION,
			values: {
				SessionName: "our tribe",
			},
		});
		expect(patches).toContainEqual({
			file: GAME_USER_SETTINGS_FILE,
			section: SERVER_SETTINGS_SECTION,
			values: {
				ServerPVE: "True",
			},
		});
		expect(patches).toContainEqual({
			file: GAME_USER_SETTINGS_FILE,
			section: MESSAGE_OF_THE_DAY_SECTION,
			values: {
				Message: "welcome",
			},
		});
		expect(patches).toContainEqual({
			file: GAME_FILE,
			section: SHOOTER_GAME_MODE_SECTION,
			values: {
				MatingIntervalMultiplier: "0.5",
			},
		});
	});
});

describe("validateSettingsWrite", () => {
	test("passes a write the table knows", () => {
		expect(
			validateSettingsWrite({
				ServerPVE: "true",
				SessionName: "our tribe",
				XPMultiplier: "2",
			}),
		).toEqual({
			ServerPVE: true,
			SessionName: "our tribe",
			XPMultiplier: 2,
		});
	});

	test("refuses a key the panel does not own", () => {
		expect(() =>
			validateSettingsWrite({
				ServerAdminPassword: "nope",
			}),
		).toThrow();
	});

	test("refuses an empty server name", () => {
		expect(() =>
			validateSettingsWrite({
				SessionName: "",
			}),
		).toThrow();
	});

	test("refuses a server name carrying the character that splits the launch line", () => {
		expect(() =>
			validateSettingsWrite({
				SessionName: "our tribe?listen",
			}),
		).toThrow();
	});

	test("refuses a join password longer than the game accepts", () => {
		expect(() =>
			validateSettingsWrite({
				ServerPassword: "p".repeat(PASSWORD_MAX + 1),
			}),
		).toThrow();
	});

	test("refuses a number outside the field", () => {
		expect(() =>
			validateSettingsWrite({
				AutoSavePeriodMinutes: 0,
			}),
		).toThrow();
		expect(() =>
			validateSettingsWrite({
				OverrideOfficialDifficulty: 40,
			}),
		).toThrow();
		expect(() =>
			validateSettingsWrite({
				XPMultiplier: -1,
			}),
		).toThrow();
	});

	test("refuses a line break or a hidden character inside the message of the day", () => {
		expect(() =>
			validateSettingsWrite({
				Message: "welcome\nto the tribe",
			}),
		).toThrow();
		expect(() =>
			validateSettingsWrite({
				Message: "welcome\u0007",
			}),
		).toThrow();
	});

	test("refuses a toggle that is neither on nor off", () => {
		expect(() =>
			validateSettingsWrite({
				ServerPVE: "maybe",
			}),
		).toThrow();
	});
});
