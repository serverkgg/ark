import { describe, expect, test } from "bun:test";
import type { Bridge } from "@serverkgg/bridge";
import { ADMIN_LIST_FILE } from "../shared";
import { admins } from "./admins";

const FIRST = "0002a1b3c4d5e6f708192a3b4c5d6e7f";

const SECOND = "1112a1b3c4d5e6f708192a3b4c5d6e7f";

const harness = (listed?: string[]) => {
	const files = new Map<string, string>();

	if (listed) {
		files.set(ADMIN_LIST_FILE, `${listed.join("\n")}\n`);
	}

	const context = {
		files: {
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
			running: true,
		},
	} as unknown as Bridge.Context;

	return {
		context,
		file() {
			return files.get(ADMIN_LIST_FILE) ?? "";
		},
	};
};

describe("the admin list", () => {
	test("reads one account per line out of the file the game loads at boot", async () => {
		const { context } = harness([
			FIRST,
			SECOND,
		]);

		expect(await admins.list(context)).toEqual([
			{
				eosId: FIRST,
				id: FIRST,
			},
			{
				eosId: SECOND,
				id: SECOND,
			},
		]);
	});

	test("answers with nothing at all before the file exists", async () => {
		const { context } = harness();

		expect(await admins.list(context)).toEqual([]);
	});

	test("adds an account without asking the running server, because the file is the whole mechanism", async () => {
		const { context, file } = harness();

		await admins.add?.(context, FIRST.toUpperCase());

		expect(file()).toBe(`${FIRST}\n`);
	});

	test("never lists the same account twice", async () => {
		const { context, file } = harness([
			FIRST,
		]);

		await admins.add?.(context, FIRST);

		expect(file()).toBe(`${FIRST}\n`);
	});

	test("drops one account and leaves the rest", async () => {
		const { context, file } = harness([
			FIRST,
			SECOND,
		]);

		await admins.actions?.remove?.(
			context,
			{
				eosId: FIRST,
				id: FIRST,
			},
			{},
		);

		expect(file()).toBe(`${SECOND}\n`);
	});

	test("refuses anything that is not an account id", async () => {
		const { context } = harness();

		await expect(admins.add?.(context, "our friend")).rejects.toThrow();
	});
});
