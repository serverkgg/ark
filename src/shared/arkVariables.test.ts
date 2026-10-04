import { describe, expect, it } from "bun:test";
import type { Bridge } from "@serverkgg/bridge";
import { MAX_PLAYERS_DEFAULT } from "./arkApp";
import { clampMaxPlayers, mapIdOf, readLaunchVariables } from "./arkVariables";

const variableContext = (variables: Record<string, string>) => {
	return {
		variable(key: string) {
			return variables[key] ?? null;
		},
	} as unknown as Bridge.Context;
};

describe("clampMaxPlayers", () => {
	it("holds the range the game accepts", () => {
		expect(clampMaxPlayers(0)).toBe(1);
		expect(clampMaxPlayers(9999)).toBe(200);
		expect(clampMaxPlayers("70")).toBe(70);
		expect(clampMaxPlayers(30.4)).toBe(30);
	});

	it("falls back to the default for anything unreadable", () => {
		expect(clampMaxPlayers(null)).toBe(MAX_PLAYERS_DEFAULT);
		expect(clampMaxPlayers("")).toBe(MAX_PLAYERS_DEFAULT);
		expect(clampMaxPlayers("many")).toBe(MAX_PLAYERS_DEFAULT);
	});
});

describe("mapIdOf", () => {
	it("takes an official map as it stands", () => {
		expect(mapIdOf("Ragnarok_WP", null)).toBe("Ragnarok_WP");
	});

	it("reads the custom map only while the select says custom", () => {
		expect(mapIdOf("custom", "Svartalfheim_WP")).toBe("Svartalfheim_WP");
		expect(mapIdOf("TheCenter_WP", "Svartalfheim_WP")).toBe("TheCenter_WP");
	});

	it("falls back to the default rather than launching on a name the engine rejects", () => {
		expect(mapIdOf("custom", "not a map")).toBe("TheIsland_WP");
		expect(mapIdOf("custom", "")).toBe("TheIsland_WP");
		expect(mapIdOf(null, null)).toBe("TheIsland_WP");
		expect(mapIdOf("TheIsland", null)).toBe("TheIsland_WP");
	});
});

describe("readLaunchVariables", () => {
	it("reads the defaults a fresh server carries", () => {
		expect(readLaunchVariables(variableContext({}))).toEqual({
			battleye: false,
			crossplay: true,
			exclusiveJoin: false,
			map: "TheIsland_WP",
			maxPlayers: MAX_PLAYERS_DEFAULT,
		});
	});

	it("reads every toggle off its variable", () => {
		expect(
			readLaunchVariables(
				variableContext({
					BATTLEYE: "true",
					CROSSPLAY: "false",
					CUSTOM_MAP: "Svartalfheim_WP",
					EXCLUSIVE_JOIN: "true",
					MAP: "custom",
					MAX_PLAYERS: "70",
				}),
			),
		).toEqual({
			battleye: true,
			crossplay: false,
			exclusiveJoin: true,
			map: "Svartalfheim_WP",
			maxPlayers: 70,
		});
	});
});
