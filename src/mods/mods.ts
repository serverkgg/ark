import { type Bridge, BridgeKind } from "@serverkgg/bridge";
import { CURSEFORGE_SEARCH_CEILING, createCurseforgeCatalog } from "@serverkgg/bridge/catalogs";
import {
	type ArkMod,
	addMod,
	CURSEFORGE_GAME_ID,
	MODS_DIRECTORY,
	readMods,
	removeMod,
	requireProjectId,
	toggleMod,
} from "../shared";
import { CURSEFORGE_PROVIDER, categoriesOf, categoryOf, hitOf, providersOf, SORTS, sortOf } from "./modsCurseforge";

const PAGE_SIZE = 20;

const curseforge = (context: Bridge.Context) => {
	return createCurseforgeCatalog(context, {
		gameId: CURSEFORGE_GAME_ID,
	});
};

export const entryOf = (mod: ArkMod): Bridge.CatalogEntry => {
	return {
		enabled: mod.enabled,
		gameVersion: null,
		icon: mod.icon.length > 0 ? mod.icon : null,
		id: mod.projectId,
		pageUrl: mod.pageUrl.length > 0 ? mod.pageUrl : null,
		path: MODS_DIRECTORY,
		provider: CURSEFORGE_PROVIDER,
		sizeBytes: 0,
		stale: false,
		title: mod.title,
		version: null,
	};
};

export interface ArkModDetails {
	title: string;
	pageUrl: string;
	icon: string;
}

export const modDetails = async (context: Bridge.Context, projectId: string): Promise<ArkModDetails> => {
	const catalog = curseforge(context);
	const bare: ArkModDetails = {
		icon: "",
		pageUrl: "",
		title: projectId,
	};

	if (!catalog.ready()) {
		return bare;
	}

	try {
		const mod = await catalog.mod(projectId);

		return {
			icon: mod.logo?.thumbnailUrl ?? "",
			pageUrl: mod.links?.websiteUrl ?? "",
			title: mod.name,
		};
	} catch (error) {
		context.log.warn("curseforge did not answer for this mod, staging it by its id alone", {
			error: error instanceof Error ? error.message : String(error),
			mod: projectId,
		});

		return bare;
	}
};

export const stageMod = async (context: Bridge.Context, id: string): Promise<Bridge.CatalogEntry> => {
	const projectId = requireProjectId(id);
	const details = await modDetails(context, projectId);
	const sidecar = await addMod(context, {
		addedAt: new Date().toISOString(),
		enabled: true,
		icon: details.icon,
		pageUrl: details.pageUrl,
		projectId,
		title: details.title,
	});
	const mod = sidecar.mods.find((entry) => entry.projectId === projectId);

	context.log("staged a mod, the server downloads it itself on the next start", {
		mod: projectId,
	});

	return entryOf(
		mod ?? {
			addedAt: "",
			enabled: true,
			icon: details.icon,
			pageUrl: details.pageUrl,
			projectId,
			title: details.title,
		},
	);
};

export const mods: Bridge.Catalog = {
	kind: BridgeKind.Catalog,
	pageSize: PAGE_SIZE,
	async search(context, query) {
		const catalog = curseforge(context);
		const providers = providersOf(catalog);

		if (!catalog.ready()) {
			return {
				categories: [],
				hits: [],
				providers,
				sorts: SORTS,
				total: 0,
			};
		}

		const facets = {
			categories: await categoriesOf(context, catalog),
			providers,
			sorts: SORTS,
		};
		const index = query.page * PAGE_SIZE;

		if (index + PAGE_SIZE > CURSEFORGE_SEARCH_CEILING) {
			return {
				...facets,
				hits: [],
				total: CURSEFORGE_SEARCH_CEILING,
			};
		}

		const page = await catalog.search({
			categoryId: categoryOf(query.category),
			index,
			pageSize: PAGE_SIZE,
			query: query.query,
			sort: sortOf(query.sort),
		});

		return {
			...facets,
			hits: page.data.map(hitOf),
			total: Math.min(page.pagination.totalCount, CURSEFORGE_SEARCH_CEILING),
		};
	},
	async installed(context) {
		return (await readMods(context)).mods.map(entryOf);
	},
	async install(context, id) {
		return await stageMod(context, id);
	},
	async remove(context, id) {
		await removeMod(context, requireProjectId(id));
	},
	async toggle(context, id, enabled) {
		await toggleMod(context, requireProjectId(id), enabled);
	},
};
