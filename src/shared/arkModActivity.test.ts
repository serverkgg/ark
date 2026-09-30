import { describe, expect, test } from "bun:test";
import type { Bridge } from "@serverkgg/bridge";
import { findMod, modPosition } from "./arkModActivity";

const unreadable = () => {
	const warnings: string[] = [];
	const context = {
		files: {
			async exists() {
				throw new Error("the volume went away");
			},
		},
		log: Object.assign(() => undefined, {
			error: () => undefined,
			warn: (message: string) => {
				warnings.push(message);
			},
		}),
	} as unknown as Bridge.Context;

	return {
		context,
		warnings,
	};
};

describe("the lookups an activity entry is built from", () => {
	test("never fail the action when the staged mods cannot be read", async () => {
		const { context, warnings } = unreadable();

		expect(await findMod(context, "111111")).toBeNull();
		expect(await modPosition(context, "111111")).toBeNull();
		expect(warnings).toHaveLength(2);
	});
});
