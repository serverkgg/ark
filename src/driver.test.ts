import { describe, expect, test } from "bun:test";
import { BridgeFormTarget, BridgeKind, BridgeLayout, BridgePlace } from "@serverkgg/bridge";
import { GuideOpenTab } from "@serverkgg/bridge/guides";
import { BridgeSetupStepKind } from "@serverkgg/bridge/protocol";
import { RCON_ACCESS_MODULE } from "@serverkgg/bridge/rcon";
import { compileGlobs, matchesAny } from "@serverkgg/bridge/utils";
import { driver } from "./driver";
import { BAN_LIST_FILE, GAME_ROOTS, MODS_DIRECTORY, MODS_SIDECAR_FILE, WHITELIST_FILE } from "./shared";

const manifest = Bun.YAML.parse(await Bun.file("serverk.yml").text()) as {
	backup: {
		only: string[];
	};
	container: {
		runtime: {
			platform: string;
			shmMb: number;
		};
	};
	files: {
		protected: string[];
	};
	reset: {
		keep: string[];
	};
};

const sections = () => {
	return (driver.panel?.tabs ?? []).flatMap((tab) => tab.sections);
};

describe("driver", () => {
	// validateDriver is not on the package's public entry points, so the gate is run the
	// way the runtime and the release path run it: through the maintainer CLI.
	test("passes the validation the runtime runs before it boots", () => {
		const validated = Bun.spawnSync([
			"bunx",
			"serverk-bridge",
			"validate",
		]);
		const output = `${validated.stdout.toString()}${validated.stderr.toString()}`;

		expect(output).toContain("ark is valid");
		expect(validated.exitCode).toBe(0);
	});

	test("carries every capability the panel leans on", () => {
		expect(driver.install).toBeDefined();
		expect(driver.lifecycle).toBeDefined();
		expect(driver.query).toBeDefined();
		expect(driver.events).toBeDefined();
		expect(driver.backup).toBeDefined();
		expect(driver.announce).toBeDefined();
		expect(driver.terminal?.run).toBeDefined();
	});

	test("every section names a module the driver actually exports", () => {
		const modules = new Set(Object.keys(driver.modules ?? {}));

		for (const section of sections()) {
			if (section.layout === BridgeLayout.Form && section.target === BridgeFormTarget.Variables) {
				continue;
			}

			expect(modules.has(section.module ?? "")).toBe(true);
		}
	});

	test("registers the remote access module the shared sections call for", () => {
		expect(Object.keys(driver.modules ?? {})).toContain(RCON_ACCESS_MODULE);
	});

	test("registers every module the panel drives the game through", () => {
		const modules = Object.keys(driver.modules ?? {});

		for (const id of [
			"admins",
			"bans",
			"modOrder",
			"mods",
			"saves",
			"settings",
			"whitelist",
		]) {
			expect(modules).toContain(id);
		}
	});

	test("writes the settings back rather than only reading them", () => {
		const settings = driver.modules?.settings;

		expect(settings?.kind).toBe(BridgeKind.Settings);
		expect(settings && "write" in settings ? settings.write : undefined).toBeDefined();
	});

	test("lands every setup step on a form section and a field the panel really declares", () => {
		for (const step of driver.setup?.steps ?? []) {
			if (step.kind === BridgeSetupStepKind.Form) {
				const tab = (driver.panel?.tabs ?? []).find((entry) => entry.id === step.tab);
				const section = (tab?.sections ?? []).find((entry) => entry.id === step.section);

				expect(section?.layout).toBe(BridgeLayout.Form);

				const fields = section?.layout === BridgeLayout.Form ? section.fields : [];

				for (const key of step.fields ?? []) {
					expect(fields.some((field) => field.key === key)).toBe(true);
				}
			}

			if (step.kind === BridgeSetupStepKind.Open) {
				const target = step.target;

				if (target.tab === GuideOpenTab.Panel) {
					expect((driver.panel?.tabs ?? []).some((tab) => tab.id === target.tabId)).toBe(true);
				}
			}
		}
	});

	test("leaves every setup step optional, because ARK boots with nothing asked of the customer", () => {
		expect(driver.setup?.steps.length).toBeGreaterThan(0);

		for (const step of driver.setup?.steps ?? []) {
			expect(step.required).toBe(false);
		}
	});

	test("protects only wiping a save, the one action nothing else brings back", () => {
		const protectedOf = (id: string) => {
			const module = driver.modules?.[id];

			return module && "protectedActions" in module ? (module.protectedActions ?? []) : [];
		};

		expect(protectedOf("saves")).toEqual([
			"wipe",
		]);

		for (const id of [
			"admin",
			"admins",
			"bans",
			"mods",
			"modOrder",
			"settings",
			"whitelist",
		]) {
			expect(protectedOf(id)).toEqual([]);
		}
	});

	test("every protected action is a mutation the module declares and runs while stopped", () => {
		for (const [id, module] of Object.entries(driver.modules ?? {})) {
			const declared =
				module.kind === BridgeKind.Collection
					? [
							...(module.add
								? [
										"add",
									]
								: []),
							...Object.keys(module.actions ?? {}),
						]
					: module.kind === BridgeKind.Catalog
						? [
								"install",
								"remove",
								...(module.toggle
									? [
											"toggle",
										]
									: []),
							]
						: [];
			const protectedActions = "protectedActions" in module ? (module.protectedActions ?? []) : [];

			if (protectedActions.length === 0) {
				continue;
			}

			expect("requiresRunning" in module ? module.requiresRunning : undefined, id).toBeFalsy();

			for (const action of protectedActions) {
				expect(declared, id).toContain(action);
			}
		}
	});

	test("gives the roster, the metrics and the admin card a help line in both languages", () => {
		for (const id of [
			"online",
			"metrics",
			"admin",
		]) {
			const section = sections().find((entry) => entry.id === id);

			expect(section?.help?.ar.length ?? 0).toBeGreaterThan(0);
			expect(section?.help?.en.length ?? 0).toBeGreaterThan(0);
		}
	});

	test("puts the roster on the Players page and the metrics on the Overview", () => {
		const online = sections().find((section) => section.module === "players");
		const metrics = sections().find((section) => section.module === "metrics");

		expect(online?.layout).toBe(BridgeLayout.Table);
		expect(online && "place" in online ? online.place : null).toBe(BridgePlace.Players);
		expect(metrics?.layout).toBe(BridgeLayout.Detail);
		expect(metrics && "place" in metrics ? metrics.place : null).toBe(BridgePlace.Overview);
	});

	test("declares the wine runtime the proton image needs", () => {
		expect(manifest.container.runtime.platform).toBe("wine");
		expect(manifest.container.runtime.shmMb).toBeGreaterThanOrEqual(256);
	});

	test("reset keeps every game root and the proton prefix", () => {
		const keep = compileGlobs(manifest.reset.keep);

		for (const root of GAME_ROOTS) {
			expect(matchesAny(root, keep)).toBe(true);
		}

		expect(manifest.reset.keep).toContain(".proton");
		expect(manifest.reset.keep).toContain(".serverk-wine.json");
		expect(manifest.reset.keep).toContain("steamapps");
	});

	test("reset drops the mods sidecar, so it really wipes the mods the reset dialog promises to wipe", () => {
		expect(manifest.reset.keep).not.toContain(MODS_SIDECAR_FILE);
	});

	test("reset keeps the mod payloads under the binaries, which the cleared list leaves inert", () => {
		expect(matchesAny(MODS_DIRECTORY, compileGlobs(manifest.reset.keep))).toBe(true);
	});

	test("the backup names the saves and both sidecars rather than excluding the install", () => {
		expect(manifest.backup.only).toContain("ShooterGame/Saved/**");
		expect(manifest.backup.only).toContain(".serverk-install.json");
		expect(manifest.backup.only).toContain(MODS_SIDECAR_FILE);
	});

	test("the mods sidecar stays protected, so a restore is the only thing that rewrites the list", () => {
		expect(manifest.files.protected).toContain(MODS_SIDECAR_FILE);
	});

	test("the backup carries the moderation lists the panel writes outside the saves", () => {
		expect(manifest.backup.only).toContain(BAN_LIST_FILE);
		expect(manifest.backup.only).toContain(WHITELIST_FILE);
	});
});
