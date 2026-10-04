import { describe, expect, it } from "bun:test";
import {
	type Bridge,
	BridgeConfirm,
	BridgeControl,
	BridgeFormTarget,
	BridgeLayout,
	BridgePlace,
} from "@serverkgg/bridge";
import { CUSTOM_MAP_VALUE, CUSTOM_MAP_VARIABLE, MAP_ID_PATTERN, MAP_VARIABLE, mapOptions } from "../shared";
import { panel } from "./panel";

const sections = panel.tabs.flatMap((tab) => tab.sections);

const sectionOf = (id: string) => {
	return sections.find((section) => section.id === id);
};

const fieldsOf = (id: string): Bridge.Field[] => {
	const section = sectionOf(id);

	return section?.layout === BridgeLayout.Form ? section.fields : [];
};

const fieldOf = (id: string, key: string) => {
	return fieldsOf(id).find((field) => field.key === key);
};

const actionOf = (id: string, action: string) => {
	const section = sectionOf(id);
	const actions = section && "actions" in section ? (section.actions ?? []) : [];

	return actions.find((entry) => entry.id === action);
};

describe("the tabs", () => {
	it("open on the settings and end on the controls", () => {
		expect(panel.tabs.map((tab) => tab.id)).toEqual([
			"settings",
			"launch",
			"mods",
			"players",
			"controls",
		]);
	});

	it("gives every section a title and every form a line saying what it is for", () => {
		for (const section of sections.filter((entry) => !entry.id.startsWith("rcon-access"))) {
			expect(section.title).toBeDefined();

			if (section.layout === BridgeLayout.Form) {
				expect(section.help).toBeDefined();
			}
		}
	});
});

describe("the settings forms", () => {
	const forms = (panel.tabs.find((tab) => tab.id === "settings")?.sections ?? []).filter(
		(section) => section.layout === BridgeLayout.Form,
	);

	it("all write through the one settings module", () => {
		expect(forms).toHaveLength(5);

		for (const form of forms) {
			expect(form.target).toBe(BridgeFormTarget.Settings);
			expect(form.module).toBe("settings");
			expect(form.restartHint).toBe(true);
		}
	});

	it("masks the join password rather than showing it back", () => {
		expect(fieldOf("server", "ServerPassword")?.control).toBe(BridgeControl.Secret);
	});

	it("carries the server name with the pattern the launch line needs", () => {
		const sessionName = fieldOf("server", "SessionName");

		expect(sessionName?.control).toBe(BridgeControl.Text);
		expect(sessionName?.pattern).toBe("^[^?]+$");
		expect(sessionName?.patternHint).toBeDefined();
	});
});

describe("the launch form", () => {
	it("offers exactly the maps the driver knows how to start", () => {
		expect(fieldOf("launch", MAP_VARIABLE)?.options).toEqual(mapOptions());
	});

	it("asks for a mod map only after the customer picks one", () => {
		const custom = fieldOf("launch", CUSTOM_MAP_VARIABLE);

		expect(custom?.pattern).toBe(MAP_ID_PATTERN);
		expect(custom?.visibleWhen).toEqual({
			values: [
				CUSTOM_MAP_VALUE,
			],
			variable: MAP_VARIABLE,
		});
	});
});

describe("the mods tab", () => {
	it("pairs the catalog with the load order table", () => {
		expect(sectionOf("catalog")?.layout).toBe(BridgeLayout.Catalog);
		expect(sectionOf("catalog")?.module).toBe("mods");

		const order = sectionOf("order");

		expect(order?.layout).toBe(BridgeLayout.Table);
		expect(order?.module).toBe("modOrder");
		expect(order?.layout === BridgeLayout.Table ? order.add : null).toBeDefined();
	});

	it("carries the four controls a load order needs", () => {
		const order = sectionOf("order");
		const actions = order && "actions" in order ? (order.actions ?? []) : [];

		expect(actions.map((action) => action.id)).toEqual([
			"up",
			"down",
			"toggle",
			"remove",
		]);
	});

	it("says a mod change lands on the next start", () => {
		const catalog = sectionOf("catalog");

		expect(catalog?.layout === BridgeLayout.Catalog ? catalog.restartHint : null).toBe(true);
	});
});

describe("the players page", () => {
	it("puts the roster and the three lists where the platform renders players", () => {
		for (const id of [
			"online",
			"bans",
			"admins",
			"whitelist",
		]) {
			const section = sectionOf(id);

			expect(section && "place" in section ? section.place : null).toBe(BridgePlace.Players);
		}
	});

	it("lets a ban reach someone who is not connected", () => {
		expect(actionOf("online", "ban")?.offline).toBe(true);
	});

	it("takes an account id into every list", () => {
		for (const id of [
			"bans",
			"admins",
			"whitelist",
		]) {
			const section = sectionOf(id);

			expect(section?.layout === BridgeLayout.Table ? section.add : null).toBeDefined();
		}
	});
});

describe("the destructive controls", () => {
	it("asks twice before anything that cannot be taken back", () => {
		expect(actionOf("live", "destroyWildDinos")?.confirm).toBe(BridgeConfirm.Strong);
		expect(actionOf("saves", "wipe")?.confirm).toBe(BridgeConfirm.Strong);
		expect(actionOf("admin", "rotateAdmin")?.confirm).toBe(BridgeConfirm.Strong);
	});

	it("says in Arabic and English what each one costs", () => {
		for (const action of [
			actionOf("live", "destroyWildDinos"),
			actionOf("saves", "wipe"),
		]) {
			expect(action?.confirmText?.ar.length).toBeGreaterThan(0);
			expect(action?.confirmText?.en.length).toBeGreaterThan(0);
		}
	});
});
