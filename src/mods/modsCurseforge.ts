import type { Bridge } from "@serverkgg/bridge";
import {
	type CurseforgeCatalog,
	type CurseforgeCategory,
	type CurseforgeMod,
	CurseforgeSort,
} from "@serverkgg/bridge/catalogs";

export const CURSEFORGE_PROVIDER = "curseforge";

const CATEGORY_HIERARCHY = /\s*\\\s*/g;

export const NOT_READY_NOTE: Bridge.Text = {
	ar: "كتالوج المودات مقفل الحين لأن مفتاح CurseForge ناقص. لسا تقدر تضيف أي مود برقمه من جدول الترتيب تحت.",
	en: "The mod catalog is off right now because the CurseForge key is missing. You can still add any mod by its id from the order table below.",
};

export const CURSEFORGE_LABEL: Bridge.Text = {
	ar: "CurseForge",
	en: "CurseForge",
};

export const cleanCategoryName = (name: string) => {
	return name.replace(CATEGORY_HIERARCHY, " & ").trim();
};

export const categoryLabel = (category: CurseforgeCategory): Bridge.Text => {
	const cleaned = cleanCategoryName(category.name);

	return {
		ar: cleaned,
		en: cleaned,
	};
};

export const categoryName = (category: CurseforgeCategory) => {
	return categoryLabel(category).en;
};

interface SortFacet extends Bridge.CatalogFacet {
	value: CurseforgeSort;
}

export const SORTS: SortFacet[] = [
	{
		label: {
			ar: "الأكثر شهرة",
			en: "Most popular",
		},
		value: CurseforgeSort.Popularity,
	},
	{
		label: {
			ar: "آخر تحديث",
			en: "Recently updated",
		},
		value: CurseforgeSort.LastUpdated,
	},
	{
		label: {
			ar: "الاسم",
			en: "Name",
		},
		value: CurseforgeSort.Name,
	},
];

const SORT_BY_VALUE = new Map<string, CurseforgeSort>(
	SORTS.map((facet) => [
		facet.value,
		facet.value,
	]),
);

export const sortOf = (value: string | null) => {
	return SORT_BY_VALUE.get(value ?? "") ?? CurseforgeSort.Popularity;
};

export const categoryOf = (value: string | null) => {
	const id = Number.parseInt(value ?? "", 10);

	return Number.isSafeInteger(id) ? id : undefined;
};

export const providersOf = (catalog: CurseforgeCatalog): Bridge.CatalogProvider[] => {
	const ready = catalog.ready();

	return [
		{
			id: CURSEFORGE_PROVIDER,
			label: CURSEFORGE_LABEL,
			ready,
			...(ready
				? {}
				: {
						note: NOT_READY_NOTE,
					}),
		},
	];
};

export const categoriesOf = async (
	context: Bridge.Context,
	catalog: CurseforgeCatalog,
): Promise<Bridge.CatalogFacet[]> => {
	try {
		return (await catalog.categories())
			.filter((category) => category.isClass !== true)
			.map((category) => {
				return {
					label: categoryLabel(category),
					value: String(category.id),
				};
			});
	} catch {
		context.log.warn("could not read the curseforge categories for ark");

		return [];
	}
};

export const hitOf = (mod: CurseforgeMod): Bridge.CatalogHit => {
	return {
		author: mod.authors.at(0)?.name ?? null,
		categories: mod.categories.map(categoryName),
		description: mod.summary,
		downloads: mod.downloadCount,
		icon: mod.logo?.thumbnailUrl ?? null,
		id: String(mod.id),
		pageUrl: mod.links?.websiteUrl ?? null,
		provider: CURSEFORGE_PROVIDER,
		title: mod.name,
		updatedAt: mod.dateModified,
	};
};
