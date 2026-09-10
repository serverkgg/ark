import { describe, expect, test } from "bun:test";
import type { Bridge } from "@serverkgg/bridge";
import { BridgeUserError } from "@serverkgg/bridge";
import { MODS_SIDECAR_FILE } from "./arkApp";
import {
	type ArkMod,
	addMod,
	enabledModIds,
	isProjectId,
	moveMod,
	normalizeSidecar,
	readMods,
	removeMod,
	requireProjectId,
	toggleMod,
} from "./arkMods";

const mod = (projectId: string, enabled = true): ArkMod => ({
	addedAt: "2026-09-10T00:00:00.000Z",
	enabled,
	icon: "",
	pageUrl: "",
	projectId,
	title: `mod ${projectId}`,
});

const sidecarContext = (mods: ArkMod[] = []) => {
	const stored = new Map<string, string>([
		[
			MODS_SIDECAR_FILE,
			JSON.stringify({
				mods,
			}),
		],
	]);

	return {
		files: {
			async exists(path: string) {
				return stored.has(path);
			},
			async read(path: string) {
				return stored.get(path) ?? "";
			},
			async write(path: string, content: string) {
				stored.set(path, content);
			},
		},
	} as unknown as Bridge.Context;
};

describe("isProjectId and requireProjectId", () => {
	test("takes the digits a CurseForge url carries", () => {
		expect(isProjectId("893657")).toBe(true);
		expect(isProjectId("  893657 ")).toBe(true);
	});

	test("refuses a slug or a url", () => {
		expect(isProjectId("structures-plus")).toBe(false);
		expect(isProjectId("")).toBe(false);
		expect(() => requireProjectId("structures-plus")).toThrow(BridgeUserError);
	});
});

describe("normalizeSidecar", () => {
	test("reads a missing file as no mods", () => {
		expect(normalizeSidecar(null)).toEqual({
			mods: [],
		});
	});

	test("drops an entry with no usable id and keeps one entry per mod", () => {
		expect(
			normalizeSidecar({
				mods: [
					mod("893657"),
					mod("893657"),
					{
						...mod("nope"),
					},
				],
			}).mods,
		).toHaveLength(1);
	});

	test("treats a mod with no enabled flag as enabled", () => {
		expect(
			normalizeSidecar({
				mods: [
					{
						projectId: "893657",
					} as ArkMod,
				],
			}).mods.at(0)?.enabled,
		).toBe(true);
	});
});

describe("the ordered list the launch line is built from", () => {
	test("keeps the order mods were added in", async () => {
		const context = sidecarContext();

		await addMod(context, mod("111111"));
		await addMod(context, mod("222222"));

		expect(enabledModIds(await readMods(context))).toEqual([
			"111111",
			"222222",
		]);
	});

	test("adds a mod once", async () => {
		const context = sidecarContext();

		await addMod(context, mod("111111"));
		await addMod(context, mod("111111"));

		expect((await readMods(context)).mods).toHaveLength(1);
	});

	test("leaves a disabled mod in the list but off the launch line", async () => {
		const context = sidecarContext([
			mod("111111"),
			mod("222222"),
		]);

		await toggleMod(context, "111111", false);

		expect((await readMods(context)).mods).toHaveLength(2);
		expect(enabledModIds(await readMods(context))).toEqual([
			"222222",
		]);
	});

	test("moves a mod up and down, and stops at the ends", async () => {
		const context = sidecarContext([
			mod("111111"),
			mod("222222"),
		]);

		await moveMod(context, "222222", -1);

		expect(enabledModIds(await readMods(context))).toEqual([
			"222222",
			"111111",
		]);

		await moveMod(context, "222222", -1);

		expect(enabledModIds(await readMods(context))).toEqual([
			"222222",
			"111111",
		]);
	});

	test("removes a mod", async () => {
		const context = sidecarContext([
			mod("111111"),
		]);

		await removeMod(context, "111111");

		expect((await readMods(context)).mods).toEqual([]);
	});

	test("refuses to grow past the limit the launch line can carry", async () => {
		const context = sidecarContext(
			Array.from(
				{
					length: 64,
				},
				(_entry, index) => mod(String(100_000 + index)),
			),
		);

		expect(addMod(context, mod("999999"))).rejects.toThrow(BridgeUserError);
	});
});
