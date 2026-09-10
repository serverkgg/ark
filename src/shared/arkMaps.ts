import type { Bridge } from "@serverkgg/bridge";

export const CUSTOM_MAP_VALUE = "custom";

export interface ArkMap {
	id: string;
	name: Bridge.Text;
}

export const OFFICIAL_MAPS: ArkMap[] = [
	{
		id: "TheIsland_WP",
		name: {
			ar: "ذا آيلاند",
			en: "The Island",
		},
	},
	{
		id: "ScorchedEarth_WP",
		name: {
			ar: "سكورتشد إيرث",
			en: "Scorched Earth",
		},
	},
	{
		id: "TheCenter_WP",
		name: {
			ar: "ذا سنتر",
			en: "The Center",
		},
	},
	{
		id: "Aberration_WP",
		name: {
			ar: "أبيريشن",
			en: "Aberration",
		},
	},
	{
		id: "Extinction_WP",
		name: {
			ar: "إكستنكشن",
			en: "Extinction",
		},
	},
	{
		id: "Ragnarok_WP",
		name: {
			ar: "راقناروك",
			en: "Ragnarok",
		},
	},
	{
		id: "Astraeos_WP",
		name: {
			ar: "أستريوس",
			en: "Astraeos",
		},
	},
	{
		id: "Valguero_WP",
		name: {
			ar: "فالغيرو",
			en: "Valguero",
		},
	},
	{
		id: "LostColony_WP",
		name: {
			ar: "لوست كولوني",
			en: "Lost Colony",
		},
	},
	{
		id: "Genesis_WP",
		name: {
			ar: "جينيسيس",
			en: "Genesis",
		},
	},
];

export const DEFAULT_MAP = OFFICIAL_MAPS[0]?.id ?? "TheIsland_WP";

export const MAP_BY_ID = new Map(
	OFFICIAL_MAPS.map((map) => [
		map.id,
		map,
	]),
);

export const isOfficialMap = (id: string) => {
	return MAP_BY_ID.has(id);
};

export const mapNameOf = (id: string): Bridge.Text => {
	const map = MAP_BY_ID.get(id);

	if (map) {
		return map.name;
	}

	return {
		ar: id,
		en: id,
	};
};

export const mapOptions = (): Bridge.Option[] => {
	return [
		...OFFICIAL_MAPS.map((map) => ({
			label: map.name,
			value: map.id,
		})),
		{
			label: {
				ar: "ماب من مود",
				en: "A map from a mod",
			},
			value: CUSTOM_MAP_VALUE,
		},
	];
};
