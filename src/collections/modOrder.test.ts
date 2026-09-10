import { describe, expect, test } from "bun:test";
import type { Bridge } from "@serverkgg/bridge";
import { MODS_SIDECAR_FILE, readMods } from "../shared";
import { modOrder } from "./modOrder";

const harness = (
	staged: {
		projectId: string;
		enabled?: boolean;
	}[] = [],
) => {
	const files = new Map<string, string>();

	if (staged.length > 0) {
		files.set(
			MODS_SIDECAR_FILE,
			JSON.stringify({
				mods: staged.map((mod) => {
					return {
						addedAt: "",
						enabled: mod.enabled !== false,
						icon: "",
						pageUrl: "",
						projectId: mod.projectId,
						title: mod.projectId,
					};
				}),
			}),
		);
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
	} as unknown as Bridge.Context;

	return {
		context,
		async ids() {
			return (await readMods(context)).mods.map((mod) => mod.projectId);
		},
	};
};

describe("the load order table", () => {
	test("numbers the rows the way the launch line carries them", async () => {
		const { context } = harness([
			{
				projectId: "111111",
			},
			{
				enabled: false,
				projectId: "222222",
			},
		]);

		expect(await modOrder.list(context)).toEqual([
			{
				id: "111111",
				order: 1,
				projectId: "111111",
				state: "enabled",
				title: "111111",
			},
			{
				id: "222222",
				order: 2,
				projectId: "222222",
				state: "disabled",
				title: "222222",
			},
		]);
	});

	test("takes a raw mod id", async () => {
		const { context, ids } = harness();

		await modOrder.add?.(context, " 928437 ");

		expect(await ids()).toEqual([
			"928437",
		]);
	});

	test("refuses a page link and says to paste the id instead", async () => {
		const { context } = harness();

		await expect(
			modOrder.add?.(context, "https://www.curseforge.com/ark-survival-ascended/mods/structures-plus"),
		).rejects.toThrow();
	});

	test("refuses anything that is not digits", async () => {
		const { context } = harness();

		await expect(modOrder.add?.(context, "structures-plus")).rejects.toThrow();
	});
});

describe("reordering", () => {
	test("moves a mod up and down the list", async () => {
		const { context, ids } = harness([
			{
				projectId: "111111",
			},
			{
				projectId: "222222",
			},
		]);

		await modOrder.actions?.up?.(
			context,
			{
				id: "222222",
			},
			{},
		);

		expect(await ids()).toEqual([
			"222222",
			"111111",
		]);

		await modOrder.actions?.down?.(
			context,
			{
				id: "222222",
			},
			{},
		);

		expect(await ids()).toEqual([
			"111111",
			"222222",
		]);
	});

	test("stays put at the end of the list rather than falling off it", async () => {
		const { context, ids } = harness([
			{
				projectId: "111111",
			},
		]);

		await modOrder.actions?.up?.(
			context,
			{
				id: "111111",
			},
			{},
		);

		expect(await ids()).toEqual([
			"111111",
		]);
	});

	test("flips a mod off and back on", async () => {
		const { context } = harness([
			{
				projectId: "111111",
			},
		]);
		const row = {
			id: "111111",
		};

		await modOrder.actions?.toggle?.(context, row, {});

		expect((await readMods(context)).mods.at(0)?.enabled).toBe(false);

		await modOrder.actions?.toggle?.(context, row, {});

		expect((await readMods(context)).mods.at(0)?.enabled).toBe(true);
	});

	test("drops a mod from the list", async () => {
		const { context, ids } = harness([
			{
				projectId: "111111",
			},
		]);

		await modOrder.actions?.remove?.(
			context,
			{
				id: "111111",
			},
			{},
		);

		expect(await ids()).toEqual([]);
	});
});
