import { describe, expect, test } from "bun:test";
import { BridgeUserError } from "@serverkgg/bridge";
import { parseIdList, requireEosId, serializeIdList, withId, withoutId } from "./arkLists";

const EOS_ONE = "0002d6b1b2c34d56789abcdef0123456";

const EOS_TWO = "1112d6b1b2c34d56789abcdef0123456";

describe("parseIdList", () => {
	test("reads one id per line", () => {
		expect(parseIdList(`${EOS_ONE}\n${EOS_TWO}\n`)).toEqual([
			EOS_ONE,
			EOS_TWO,
		]);
	});

	test("ignores blank lines, spaces and anything that is not an account id", () => {
		expect(parseIdList(`\n  ${EOS_ONE}  \n# a comment\nnot-an-id\n`)).toEqual([
			EOS_ONE,
		]);
	});

	test("takes the id out of the first field of a ban line the game wrote", () => {
		expect(parseIdList(`${EOS_ONE},"someone",0\n${EOS_TWO},"another",0\n`)).toEqual([
			EOS_ONE,
			EOS_TWO,
		]);
	});

	test("reads a bare id line and a comma line the same way", () => {
		expect(parseIdList(`${EOS_ONE}\n${EOS_TWO}, extra\n`)).toEqual([
			EOS_ONE,
			EOS_TWO,
		]);
	});

	test("keeps one entry per account whether or not the line carries trailing fields", () => {
		expect(parseIdList(`${EOS_ONE},"someone",0\n${EOS_ONE}`)).toEqual([
			EOS_ONE,
		]);
	});

	test("keeps one entry per account whatever the casing", () => {
		expect(parseIdList(`${EOS_ONE}\n${EOS_ONE.toUpperCase()}`)).toEqual([
			EOS_ONE,
		]);
	});
});

describe("serializeIdList", () => {
	test("writes a trailing newline the game's parser expects", () => {
		expect(
			serializeIdList([
				EOS_ONE,
				EOS_TWO,
			]),
		).toBe(`${EOS_ONE}\n${EOS_TWO}\n`);
	});

	test("writes an empty file for an empty list rather than a lone newline", () => {
		expect(serializeIdList([])).toBe("");
	});
});

describe("withId and withoutId", () => {
	test("adds once and removes cleanly", () => {
		const added = withId([], EOS_ONE);

		expect(added).toEqual([
			EOS_ONE,
		]);
		expect(withId(added, EOS_ONE)).toBe(added);
		expect(withoutId(added, EOS_ONE)).toEqual([]);
	});

	test("leaves the list alone when removing an id it never held", () => {
		expect(
			withoutId(
				[
					EOS_ONE,
				],
				EOS_TWO,
			),
		).toEqual([
			EOS_ONE,
		]);
	});
});

describe("requireEosId", () => {
	test("normalizes a good id", () => {
		expect(requireEosId(`  ${EOS_ONE.toUpperCase()}  `)).toBe(EOS_ONE);
	});

	test("refuses anything else with something the customer can act on", () => {
		expect(() => requireEosId("76561198000000000")).toThrow(BridgeUserError);
		expect(() => requireEosId("")).toThrow(BridgeUserError);
	});
});
