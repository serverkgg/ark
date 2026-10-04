import { describe, expect, it } from "bun:test";
import { type ArkCommandInput, mapStringWithoutSecrets, sanitizeSessionName, startArgs } from "./arkCommand";

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
	it("drops the separator the launch string is built out of", () => {
		expect(sanitizeSessionName("my?server")).toBe("myserver");
	});

	it("flattens newlines and trims", () => {
		expect(sanitizeSessionName("  my\nserver  ")).toBe("my server");
	});
});

describe("mapStringWithoutSecrets", () => {
	it("carries the map, the name and the rcon switch and nothing else", () => {
		expect(mapStringWithoutSecrets(input())).toBe(
			"TheIsland_WP?listen?SessionName=Serverk ARK abc123?RCONPort=27020?RCONEnabled=True",
		);
	});

	it("names no password, because the engine prints its own command line into the log", () => {
		expect(mapStringWithoutSecrets(input())).not.toContain("Password");
	});

	it("reads the rcon port from the input rather than a constant", () => {
		expect(
			mapStringWithoutSecrets(
				input({
					rconPort: 27_021,
				}),
			),
		).toContain("?RCONPort=27021?");
	});

	it("never carries the game port, because the engine ignores it inside the map string", () => {
		expect(mapStringWithoutSecrets(input())).not.toContain("?Port=");
	});
});

describe("startArgs", () => {
	it("keeps the launch string first", () => {
		expect(startArgs(input()).at(0)).toStartWith("TheIsland_WP?listen");
	});

	it("passes the game port as a flag, right after the launch string", () => {
		expect(startArgs(input()).at(1)).toBe("-Port=9001");

		expect(
			startArgs(
				input({
					gamePort: 9007,
				}),
			).at(1),
		).toBe("-Port=9007");
	});

	it("never lets a password reach argv, whatever the toggles", () => {
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

	it("clamps the slot count into the range the game accepts", () => {
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

	it("adds -mods only when there is a mod to load", () => {
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

	it("carries the always-on flags", () => {
		const args = startArgs(input());

		expect(args).toContain("-servergamelog");
		expect(args).toContain("-oldconsole");
		expect(args).toContain("-nosteam");
	});

	it("turns BattlEye off unless it was asked for", () => {
		expect(startArgs(input())).toContain("-NoBattlEye");

		expect(
			startArgs(
				input({
					battleye: true,
				}),
			),
		).not.toContain("-NoBattlEye");
	});

	it("opens crossplay and exclusive join only on their toggles", () => {
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
