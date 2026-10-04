import { describe, expect, it } from "bun:test";
import type { Bridge } from "@serverkgg/bridge";
import { BridgeEventName } from "@serverkgg/bridge/protocol";
import { ADMIN_LIST_FILE } from "../shared";
import { admins } from "./admins";

const FIRST = "0002a1b3c4d5e6f708192a3b4c5d6e7f";

const SECOND = "1112a1b3c4d5e6f708192a3b4c5d6e7f";

const harness = (listed?: string[]) => {
	const files = new Map<string, string>();

	if (listed) {
		files.set(ADMIN_LIST_FILE, `${listed.join("\n")}\n`);
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
			return files.get(ADMIN_LIST_FILE) ?? "";
		},
		reported,
	};
};

describe("the admin list", () => {
	it("reads one account per line out of the file the game loads at boot", async () => {
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

	it("answers with nothing at all before the file exists", async () => {
		const { context } = harness();

		expect(await admins.list(context)).toEqual([]);
	});

	it("adds an account without asking the running server, because the file is the whole mechanism", async () => {
		const { context, file } = harness();

		await admins.add?.(context, FIRST.toUpperCase());

		expect(file()).toBe(`${FIRST}\n`);
	});

	it("never lists the same account twice", async () => {
		const { context, file } = harness([
			FIRST,
		]);

		await admins.add?.(context, FIRST);

		expect(file()).toBe(`${FIRST}\n`);
	});

	it("drops one account and leaves the rest", async () => {
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

	it("refuses anything that is not an account id", async () => {
		const { context } = harness();

		await expect(admins.add?.(context, "our friend")).rejects.toThrow();
	});
});

describe("the activity the admins list reports", () => {
	it("grants access to the account it added", async () => {
		const { context, reported } = harness();

		await admins.add?.(context, FIRST);

		expect(reported).toMatchObject([
			{
				details: {
					eosId: FIRST,
					list: "admins",
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

		await admins.actions?.remove?.(
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
					list: "admins",
				},
				name: BridgeEventName.AccessRevoked,
				subject: FIRST,
			},
		]);
	});
});
