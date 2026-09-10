import { describe, expect, test } from "bun:test";
import { type ArkCommandInput, mapString, sanitizeSessionName, startArgs } from "./arkCommand";

const input = (overrides: Partial<ArkCommandInput> = {}): ArkCommandInput => ({
	battleye: false,
	crossplay: true,
	exclusiveJoin: false,
	gamePort: 9001,
	map: "TheIsland_WP",
	maxPlayers: 30,
	mods: [],
	rconPort: 27_020,
	sessionName: "Serverk ARK abc123",
	...overrides,
});

describe("sanitizeSessionName", () => {
	test("drops the separator the launch string is built out of", () => {
		expect(sanitizeSessionName("my?server")).toBe("myserver");
	});

	test("flattens newlines and trims", () => {
		expect(sanitizeSessionName("  my\nserver  ")).toBe("my server");
	});
});

describe("mapString", () => {
	test("carries the map, the name, the ports and the rcon switch and nothing else", () => {
		expect(mapString(input())).toBe(
			"TheIsland_WP?listen?SessionName=Serverk ARK abc123?Port=9001?RCONPort=27020?RCONEnabled=True",
		);
	});

	test("names no password, because the engine prints its own command line into the log", () => {
		expect(mapString(input())).not.toContain("Password");
	});

	test("reads both ports from the input rather than a constant", () => {
		expect(
			mapString(
				input({
					gamePort: 9007,
					rconPort: 27_021,
				}),
			),
		).toContain("?Port=9007?RCONPort=27021?");
	});
});

describe("startArgs", () => {
	test("keeps the launch string first", () => {
		expect(startArgs(input()).at(0)).toStartWith("TheIsland_WP?listen");
	});

	test("never lets a password reach argv, whatever the toggles", () => {
		const args = startArgs(
			input({
				battleye: true,
				crossplay: false,
				exclusiveJoin: true,
				mods: [
					"893657",
				],
				sessionName: "Serverk ARK abc123",
			}),
		);

		expect(args.join(" ")).not.toContain("Password");
	});

	test("clamps the slot count into the range the game accepts", () => {
		expect(
			startArgs(
				input({
					maxPlayers: 5000,
				}),
			),
		).toContain("-WinLiveMaxPlayers=200");

		expect(
			startArgs(
				input({
					maxPlayers: 0,
				}),
			),
		).toContain("-WinLiveMaxPlayers=1");
	});

	test("adds -mods only when there is a mod to load", () => {
		expect(startArgs(input()).some((arg) => arg.startsWith("-mods="))).toBe(false);

		expect(
			startArgs(
				input({
					mods: [
						"893657",
						"928988",
					],
				}),
			),
		).toContain("-mods=893657,928988");
	});

	test("carries the always-on flags", () => {
		const args = startArgs(input());

		expect(args).toContain("-servergamelog");
		expect(args).toContain("-oldconsole");
		expect(args).toContain("-nosteam");
	});

	test("turns BattlEye off unless it was asked for", () => {
		expect(startArgs(input())).toContain("-NoBattlEye");

		expect(
			startArgs(
				input({
					battleye: true,
				}),
			),
		).not.toContain("-NoBattlEye");
	});

	test("opens crossplay and exclusive join only on their toggles", () => {
		expect(startArgs(input())).toContain("-ServerPlatform=ALL");

		expect(
			startArgs(
				input({
					crossplay: false,
				}),
			),
		).not.toContain("-ServerPlatform=ALL");

		expect(startArgs(input())).not.toContain("-exclusivejoin");

		expect(
			startArgs(
				input({
					exclusiveJoin: true,
				}),
			),
		).toContain("-exclusivejoin");
	});
});
