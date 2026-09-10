import { describe, expect, test } from "bun:test";
import type { Bridge } from "@serverkgg/bridge";
import { CURSEFORGE_SECRET } from "@serverkgg/bridge/catalogs";
import { MOD_LIST_LIMIT, MODS_DIRECTORY, MODS_SIDECAR_FILE, readMods } from "../shared";
import { mods } from "./mods";
import { CURSEFORGE_PROVIDER, NOT_READY_NOTE } from "./modsCurseforge";

const QUERY: Bridge.CatalogQuery = {
	category: null,
	page: 0,
	provider: null,
	query: "",
	sort: null,
};

const harness = (
	options: {
		key?: string;
		mods?: {
			projectId: string;
			title: string;
		}[];
	} = {},
) => {
	const files = new Map<string, string>();

	if (options.mods) {
		files.set(
			MODS_SIDECAR_FILE,
			JSON.stringify({
				mods: options.mods.map((mod) => {
					return {
						addedAt: "",
						enabled: true,
						icon: "",
						pageUrl: "",
						projectId: mod.projectId,
						title: mod.title,
					};
				}),
			}),
		);
	}

	const warnings: string[] = [];

	const context = {
		files: {
			async ensure() {
				return;
			},
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
			warn: (message: string) => {
				warnings.push(message);
			},
		}),
		net: {
			async json() {
				throw new Error("curseforge is unreachable in this test");
			},
		},
		secret(key: string) {
			return key === CURSEFORGE_SECRET ? (options.key ?? null) : null;
		},
	} as unknown as Bridge.Context;

	return {
		context,
		warnings,
	};
};

describe("searching the catalog", () => {
	test("says the catalog is off, in both languages, when the key is not set", async () => {
		const { context } = harness();
		const page = await mods.search(context, QUERY);

		expect(page.hits).toEqual([]);
		expect(page.total).toBe(0);
		expect(page.providers).toEqual([
			{
				id: CURSEFORGE_PROVIDER,
				label: {
					ar: "CurseForge",
					en: "CurseForge",
				},
				note: NOT_READY_NOTE,
				ready: false,
			},
		]);
	});

	test("still offers the sorts, so the panel renders the section rather than an error", async () => {
		const { context } = harness();

		expect((await mods.search(context, QUERY)).sorts.length).toBeGreaterThan(0);
	});
});

describe("staging a mod", () => {
	test("refuses anything that is not a mod id", async () => {
		const { context } = harness();

		await expect(mods.install(context, "https://www.curseforge.com/ark-survival-ascended/mods/x")).rejects.toThrow();
		await expect(mods.install(context, "")).rejects.toThrow();
	});

	test("records the id alone when the key is not set, and says so in the log", async () => {
		const { context } = harness();
		const entry = await mods.install(context, "928437");

		expect(entry).toMatchObject({
			enabled: true,
			id: "928437",
			pageUrl: null,
			provider: CURSEFORGE_PROVIDER,
			title: "928437",
		});
		expect((await readMods(context)).mods).toHaveLength(1);
	});

	test("degrades to the id when curseforge does not answer", async () => {
		const { context, warnings } = harness({
			key: "a-key",
		});
		const entry = await mods.install(context, "928437");

		expect(entry.title).toBe("928437");
		expect(warnings).toContain("curseforge did not answer for this mod, staging it by its id alone");
	});

	test("keeps one entry per mod however many times it is staged", async () => {
		const { context } = harness();

		await mods.install(context, "928437");
		await mods.install(context, "928437");

		expect((await readMods(context)).mods).toHaveLength(1);
	});

	test("stops at the mod limit rather than writing a launch line the game refuses", async () => {
		const { context } = harness({
			mods: Array.from({
				length: MOD_LIST_LIMIT,
			}).map((_, index) => {
				return {
					projectId: String(100_000 + index),
					title: "staged",
				};
			}),
		});

		await expect(mods.install(context, "928437")).rejects.toThrow();
	});
});

describe("listing what is staged", () => {
	test("answers in the order the launch line will carry them", async () => {
		const { context } = harness({
			mods: [
				{
					projectId: "111111",
					title: "first",
				},
				{
					projectId: "222222",
					title: "second",
				},
			],
		});

		expect((await mods.installed(context)).map((entry) => entry.id)).toEqual([
			"111111",
			"222222",
		]);
	});

	test("points each entry at the mods root the server downloads into", async () => {
		const { context } = harness({
			mods: [
				{
					projectId: "111111",
					title: "first",
				},
			],
		});

		expect((await mods.installed(context)).at(0)?.path).toBe(MODS_DIRECTORY);
	});
});

describe("removing and toggling", () => {
	test("drops the id from the list without touching a file on disk", async () => {
		const { context } = harness({
			mods: [
				{
					projectId: "111111",
					title: "first",
				},
			],
		});

		await mods.remove(context, "111111");

		expect((await readMods(context)).mods).toEqual([]);
	});

	test("parks a mod without forgetting it", async () => {
		const { context } = harness({
			mods: [
				{
					projectId: "111111",
					title: "first",
				},
			],
		});

		await mods.toggle?.(context, "111111", false);

		expect((await readMods(context)).mods.at(0)?.enabled).toBe(false);
	});
});
