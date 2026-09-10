import { describe, expect, test } from "bun:test";
import { BridgeDetailTone } from "@serverkgg/bridge";
import { createMetricsSampler } from "../shared";
import { battleyeBadge, crossplayBadge, formatUptime } from "./metrics";

describe("createMetricsSampler", () => {
	test("reads an untouched sampler as knowing nothing", () => {
		expect(createMetricsSampler().snapshot()).toEqual({
			lastSaveAt: null,
			players: null,
			readyAt: null,
			uptimeSeconds: null,
		});
	});

	test("counts the uptime from the moment the game reported itself ready", () => {
		const sampler = createMetricsSampler();

		sampler.markReady(1000);

		expect(sampler.snapshot(61_000).uptimeSeconds).toBe(60);
	});

	test("never reports a negative uptime when the clock moves backwards", () => {
		const sampler = createMetricsSampler();

		sampler.markReady(10_000);

		expect(sampler.snapshot(1000).uptimeSeconds).toBe(0);
	});

	test("holds the last player count and the last save", () => {
		const sampler = createMetricsSampler();

		sampler.recordPlayers(4);
		sampler.recordSave(5000);

		expect(sampler.snapshot()).toMatchObject({
			lastSaveAt: 5000,
			players: 4,
		});
	});

	// The sampler is module state, so a restart has to wipe it or the Overview shows the
	// previous run's uptime.
	test("forgets the previous run", () => {
		const sampler = createMetricsSampler();

		sampler.markReady(1000);
		sampler.recordPlayers(4);
		sampler.recordSave(5000);
		sampler.clear();

		expect(sampler.snapshot()).toEqual({
			lastSaveAt: null,
			players: null,
			readyAt: null,
			uptimeSeconds: null,
		});
	});
});

describe("formatUptime", () => {
	test("reads a fresh start as less than a minute", () => {
		expect(formatUptime(12).en).toBe("Less than a minute");
	});

	test("reads minutes, hours and both", () => {
		expect(formatUptime(180).en).toBe("3m");
		expect(formatUptime(7200).en).toBe("2h");
		expect(formatUptime(9000).en).toBe("2h 30m");
	});

	test("counts in Arabic rather than pasting a number into a plural", () => {
		expect(formatUptime(3600).ar).toBe("ساعة");
		expect(formatUptime(7200).ar).toBe("ساعتين");
		expect(formatUptime(10_800).ar).toBe("3 ساعات");
	});

	test("never reads a negative uptime", () => {
		expect(formatUptime(-10).en).toBe("Less than a minute");
	});
});

describe("the badges on the overview tile", () => {
	test("says whether the console crowd can join", () => {
		expect(crossplayBadge(true).tone).toBe(BridgeDetailTone.Success);
		expect(crossplayBadge(false).tone).toBe(BridgeDetailTone.Neutral);
	});

	// BattlEye cannot run the way ARK is started here, so an owner who turned it on is
	// warned rather than reassured.
	test("warns while BattlEye is on", () => {
		expect(battleyeBadge(true).tone).toBe(BridgeDetailTone.Warning);
		expect(battleyeBadge(false).tone).toBe(BridgeDetailTone.Neutral);
	});

	test("names every badge in both languages", () => {
		for (const badge of [
			crossplayBadge(true),
			crossplayBadge(false),
			battleyeBadge(true),
			battleyeBadge(false),
		]) {
			expect(badge.label.ar.length).toBeGreaterThan(0);
			expect(badge.label.en.length).toBeGreaterThan(0);
		}
	});
});
