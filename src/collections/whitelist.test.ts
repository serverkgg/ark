import { describe, expect, it } from "bun:test";
import type { Bridge } from "@serverkgg/bridge";
import { BridgeEventName } from "@serverkgg/bridge/protocol";
import { WHITELIST_FILE } from "../shared";
import { whitelist } from "./whitelist";

const FIRST = "0002a1b3c4d5e6f708192a3b4c5d6e7f";

const SECOND = "1112a1b3c4d5e6f708192a3b4c5d6e7f";

const harness = (listed?: string[]) => {
	const files = new Map<string, string>();

	if (listed) {
		files.set(WHITELIST_FILE, `${listed.join("\n")}\n`);
	}

	const reported: Bridge.Activity[] = [];

	const context = {
		activity: {
			report(entry: Bridge.Activity) {
				reported.push(entry);
			},
		},
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
			return files.get(WHITELIST_FILE) ?? "";
		},
		reported,
	};
};

describe("the whitelist", () => {
	it("reads the accounts out of the exclusive join file", async () => {
		const { context } = harness([
			FIRST,
		]);

		expect(await whitelist.list(context)).toEqual([
			{
				eosId: FIRST,
				id: FIRST,
			},
		]);
	});

	it("answers with nothing at all before the file exists", async () => {
		const { context } = harness();

		expect(await whitelist.list(context)).toEqual([]);
	});

	it("adds an account to the file the launch flag reads", async () => {
		const { context, file } = harness();

		await whitelist.add?.(context, FIRST);

		expect(file()).toBe(`${FIRST}\n`);
	});

	it("drops one account and leaves the rest", async () => {
		const { context, file } = harness([
			FIRST,
			SECOND,
		]);

		await whitelist.actions?.remove?.(
			context,
			{
				eosId: SECOND,
				id: SECOND,
			},
			{},
		);

		expect(file()).toBe(`${FIRST}\n`);
	});

	it("refuses anything that is not an account id", async () => {
		const { context } = harness();

		await expect(whitelist.add?.(context, "1234")).rejects.toThrow();
	});
});

describe("the activity the whitelist list reports", () => {
	it("grants access to the account it added", async () => {
		const { context, reported } = harness();

		await whitelist.add?.(context, FIRST);

		expect(reported).toMatchObject([
			{
				details: {
					eosId: FIRST,
					list: "whitelist",
				},
				name: BridgeEventName.AccessGranted,
				subject: FIRST,
			},
		]);
	});

	it("revokes access from the account it removed", async () => {
		const { context, reported } = harness([
			FIRST,
		]);

		await whitelist.actions?.remove?.(
			context,
			{
				eosId: FIRST,
				id: FIRST,
			},
			{},
		);

		expect(reported).toMatchObject([
			{
				details: {
					eosId: FIRST,
					list: "whitelist",
				},
				name: BridgeEventName.AccessRevoked,
				subject: FIRST,
			},
		]);
	});
});
