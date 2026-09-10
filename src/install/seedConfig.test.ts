import { describe, expect, test } from "bun:test";
import type { Bridge } from "@serverkgg/bridge";
import { GAME_USER_SETTINGS_FILE, RCON_PORT, SERVER_SETTINGS_SECTION, SESSION_SETTINGS_SECTION } from "../shared";
import { defaultSessionName, seedConfig } from "./seedConfig";

type IniStore = Map<string, Record<string, Bridge.Values>>;

const iniContext = (initial: Record<string, Record<string, Bridge.Values>> = {}) => {
	const store: IniStore = new Map(Object.entries(initial));

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
					const sections = store.get(path) ?? {};
					const section = options?.section ?? "";

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
					options?: {
						section?: string;
					},
				) {
					return store.get(path)?.[options?.section ?? ""] ?? {};
				},
			},
		},
		files: {
			async ensure() {
				return;
			},
			async exists(path: string) {
				return store.has(path);
			},
		},
		server: {
			code: "abc123",
		},
	} as unknown as Bridge.Context;

	return {
		context,
		section(section: string) {
			return store.get(GAME_USER_SETTINGS_FILE)?.[section] ?? {};
		},
	};
};

describe("defaultSessionName", () => {
	test("names a fresh server after the platform and its own code", () => {
		expect(defaultSessionName("abc123")).toBe("Serverk ARK abc123");
	});
});

describe("seedConfig", () => {
	test("writes the control channel the driver dials on loopback", async () => {
		const { context, section } = iniContext();

		await seedConfig(context, "adminpass");

		expect(section(SERVER_SETTINGS_SECTION)).toMatchObject({
			RCONEnabled: "True",
			RCONPort: String(RCON_PORT),
			ServerAdminPassword: "adminpass",
		});
	});

	test("names the server and leaves the join password as an empty key to write into", async () => {
		const { context, section } = iniContext();

		await seedConfig(context, "adminpass");

		expect(section(SESSION_SETTINGS_SECTION).SessionName).toBe("Serverk ARK abc123");
		expect(section(SERVER_SETTINGS_SECTION).ServerPassword).toBe("");
	});

	test("keeps a name and a join password the customer already set", async () => {
		const { context, section } = iniContext({
			[GAME_USER_SETTINGS_FILE]: {
				[SERVER_SETTINGS_SECTION]: {
					ServerPassword: "letmein",
				},
				[SESSION_SETTINGS_SECTION]: {
					SessionName: "our tribe",
				},
			},
		});

		await seedConfig(context, "adminpass");

		expect(section(SESSION_SETTINGS_SECTION).SessionName).toBe("our tribe");
		expect(section(SERVER_SETTINGS_SECTION).ServerPassword).toBe("letmein");
	});

	test("re-merges the control keys over whatever the game wrote on its way out", async () => {
		const { context, section } = iniContext({
			[GAME_USER_SETTINGS_FILE]: {
				[SERVER_SETTINGS_SECTION]: {
					RCONEnabled: "False",
					ServerAdminPassword: "stale",
				},
			},
		});

		await seedConfig(context, "rotated");

		expect(section(SERVER_SETTINGS_SECTION)).toMatchObject({
			RCONEnabled: "True",
			ServerAdminPassword: "rotated",
		});
	});
});
