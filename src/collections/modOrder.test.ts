import { describe, expect, it } from "bun:test";
import type { Bridge } from "@serverkgg/bridge";
import { BridgeEventName } from "@serverkgg/bridge/protocol";
import { MOD_ORDER_TARGET, MODS_SIDECAR_FILE, readMods } from "../shared";
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
	} as unknown as Bridge.Context;

	return {
		context,
		async ids() {
			return (await readMods(context)).mods.map((mod) => mod.projectId);
		},
		reported,
	};
};

describe("the load order table", () => {
	it("numbers the rows the way the launch line carries them", async () => {
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
				state: {
					ar: "مفعّل",
					en: "Enabled",
				},
				title: "111111",
			},
			{
				id: "222222",
				order: 2,
				projectId: "222222",
				state: {
					ar: "موقوف",
					en: "Disabled",
				},
				title: "222222",
			},
		]);
	});

	it("takes a raw mod id", async () => {
		const { context, ids } = harness();

		await modOrder.add?.(context, " 928437 ");

		expect(await ids()).toEqual([
			"928437",
		]);
	});

	it("refuses a page link and says to paste the id instead", async () => {
		const { context } = harness();

		await expect(
			modOrder.add?.(context, "https://www.curseforge.com/ark-survival-ascended/mods/structures-plus"),
		).rejects.toThrow();
	});

	it("refuses anything that is not digits", async () => {
		const { context } = harness();

		await expect(modOrder.add?.(context, "structures-plus")).rejects.toThrow();
	});
});

describe("reordering", () => {
	it("moves a mod up and down the list", async () => {
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

	it("stays put at the end of the list rather than falling off it", async () => {
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

	it("flips a mod off and back on", async () => {
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

	it("drops a mod from the list", async () => {
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

describe("the activity the load order table reports", () => {
	it("reports a staged id as enabled and waiting for the next start, never as installed", async () => {
		const { context, reported } = harness();

		await modOrder.add?.(context, "928437");

		expect(reported).toMatchObject([
			{
				details: {
					projectId: "928437",
					staged: true,
				},
				name: BridgeEventName.ModEnabled,
				subject: "928437",
			},
		]);
		expect(reported.at(0)?.text.en).toContain("next start");
	});

	it("reports nothing when the id is already on the list", async () => {
		const { context, reported } = harness([
			{
				projectId: "928437",
			},
		]);

		await modOrder.add?.(context, "928437");

		expect(reported).toEqual([]);
	});

	it("reports a move as a load order change with the new position", async () => {
		const { context, reported } = harness([
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

		expect(reported).toMatchObject([
			{
				details: {
					position: 1,
					projectId: "222222",
					target: MOD_ORDER_TARGET,
				},
				name: BridgeEventName.SettingsApplied,
				subject: "222222",
			},
		]);
	});

	it("reports nothing for a move that cannot happen", async () => {
		const { context, reported } = harness([
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

		expect(reported).toEqual([]);
	});

	it("reports a toggle and a removal by their own names", async () => {
		const { context, reported } = harness([
			{
				projectId: "111111",
			},
		]);
		const row = {
			id: "111111",
		};

		await modOrder.actions?.toggle?.(context, row, {});
		await modOrder.actions?.toggle?.(context, row, {});
		await modOrder.actions?.remove?.(context, row, {});

		expect(reported.map((entry) => entry.name)).toEqual([
			BridgeEventName.ModDisabled,
			BridgeEventName.ModEnabled,
			BridgeEventName.ModRemoved,
		]);
	});
});
