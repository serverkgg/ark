import { describe, expect, test } from "bun:test";
import { findPlayer, parseListPlayers, presenceOf, rosterOf, rowOf } from "./arkPlayers";

const EOS_ONE = "0002d6b1b2c34d56789abcdef0123456";

const EOS_TWO = "1112d6b1b2c34d56789abcdef0123456";

describe("parseListPlayers", () => {
	test("reads the numbered rows the game answers with", () => {
		expect(parseListPlayers(`0. sara, ${EOS_ONE}\n1. omar, ${EOS_TWO}\n`)).toEqual([
			{
				eosId: EOS_ONE,
				name: "sara",
			},
			{
				eosId: EOS_TWO,
				name: "omar",
			},
		]);
	});

	test("answers with nothing while the map is empty", () => {
		expect(parseListPlayers("No Players Connected\n")).toEqual([]);
	});

	test("drops the keep-alive frames the server pushes on its own", () => {
		expect(parseListPlayers(`Keep Alive\n0. sara, ${EOS_ONE}\nKeep Alive\n`)).toEqual([
			{
				eosId: EOS_ONE,
				name: "sara",
			},
		]);
	});

	test("keeps a comma that belongs to the player's name", () => {
		expect(parseListPlayers(`0. sara, the tamer, ${EOS_ONE}`)).toEqual([
			{
				eosId: EOS_ONE,
				name: "sara, the tamer",
			},
		]);
	});

	test("keeps one row per account when a reply repeats itself", () => {
		expect(parseListPlayers(`0. sara, ${EOS_ONE}\n0. sara, ${EOS_ONE.toUpperCase()}`)).toHaveLength(1);
	});

	test("ignores a line that carries no account id", () => {
		expect(parseListPlayers("0. sara, not-an-id\n\n")).toEqual([]);
	});
});

describe("rowOf", () => {
	test("uses the account id as the row id the platform bans by", () => {
		expect(
			rowOf({
				eosId: EOS_ONE,
				name: "sara",
			}),
		).toEqual({
			eosId: EOS_ONE,
			id: EOS_ONE,
			name: "sara",
		});
	});

	test("falls back to the account id when the game sends no name", () => {
		expect(
			rowOf({
				eosId: EOS_ONE,
				name: "",
			}).name,
		).toBe(EOS_ONE);
	});
});

describe("presenceOf", () => {
	test("carries the two keys the manifest declares", () => {
		expect(
			presenceOf({
				eosId: EOS_ONE,
				id: EOS_ONE,
				name: "sara",
			}),
		).toEqual({
			eosId: EOS_ONE,
			player: "sara",
		});
	});
});

describe("findPlayer", () => {
	const rows = rosterOf(parseListPlayers(`0. sara, ${EOS_ONE}\n1. omar, ${EOS_TWO}`));

	test("finds by name whatever the casing", () => {
		expect(findPlayer(rows, "SARA")?.eosId).toBe(EOS_ONE);
	});

	test("finds by account id", () => {
		expect(findPlayer(rows, EOS_TWO.toUpperCase())?.eosId).toBe(EOS_TWO);
	});

	test("answers with nothing for someone who is not on", () => {
		expect(findPlayer(rows, "nobody")).toBeNull();
		expect(findPlayer(rows, "  ")).toBeNull();
	});
});
