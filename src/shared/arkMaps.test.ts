import { describe, expect, it } from "bun:test";
import { CUSTOM_MAP_VALUE, DEFAULT_MAP, isOfficialMap, mapNameOf, mapOptions, OFFICIAL_MAPS } from "./arkMaps";
import { MAP_ID_PATTERN } from "./arkVariables";

describe("OFFICIAL_MAPS", () => {
	it("carries the ten maps the game ships", () => {
		expect(OFFICIAL_MAPS).toHaveLength(10);
	});

	it("every id is a map name the engine accepts", () => {
		const pattern = new RegExp(MAP_ID_PATTERN);

		for (const map of OFFICIAL_MAPS) {
			expect(pattern.test(map.id)).toBe(true);
		}
	});

	it("every map is named in both languages", () => {
		for (const map of OFFICIAL_MAPS) {
			expect(map.name.ar.length).toBeGreaterThan(0);
			expect(map.name.en.length).toBeGreaterThan(0);
		}
	});

	it("starts on the island, which is where a first ARK belongs", () => {
		expect(DEFAULT_MAP).toBe("TheIsland_WP");
	});
});

describe("isOfficialMap", () => {
	it("knows a shipped map from a mod one", () => {
		expect(isOfficialMap("Extinction_WP")).toBe(true);
		expect(isOfficialMap("Svartalfheim_WP")).toBe(false);
	});
});

describe("mapNameOf", () => {
	it("names a shipped map", () => {
		expect(mapNameOf("TheCenter_WP").en).toBe("The Center");
	});

	it("shows a mod map under its own id rather than nothing", () => {
		expect(mapNameOf("Svartalfheim_WP")).toEqual({
			ar: "Svartalfheim_WP",
			en: "Svartalfheim_WP",
		});
	});
});

describe("mapOptions", () => {
	it("offers every shipped map plus the mod-map escape hatch, last", () => {
		const options = mapOptions();

		expect(options).toHaveLength(OFFICIAL_MAPS.length + 1);
		expect(options.at(-1)?.value).toBe(CUSTOM_MAP_VALUE);
	});
});
