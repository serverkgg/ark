import { describe, expect, test } from "bun:test";
import { BRIDGE_EVENT_NAMES, BridgeEventName } from "@serverkgg/bridge/protocol";
import { events } from "./events";

const matcherFor = (emit: BridgeEventName) => {
	return events.patterns.find((pattern) => pattern.emit === emit)?.match;
};

describe("events", () => {
	test("declares only names the platform keeps", () => {
		for (const name of [
			...events.patterns.map((pattern) => pattern.emit),
			...(events.emits ?? []),
		]) {
			expect(BRIDGE_EVENT_NAMES).toContain(name);
		}
	});

	// The roster poll is what sees a join and a leave, so they are raised from code and
	// have to be declared, or every feature that gates on them stays dark.
	test("declares the events the roster and the driver raise", () => {
		expect(events.emits).toContain(BridgeEventName.PlayerJoined);
		expect(events.emits).toContain(BridgeEventName.PlayerLeft);
		expect(events.emits).toContain(BridgeEventName.PlayerKicked);
		expect(events.emits).toContain(BridgeEventName.PlayerBanned);
		expect(events.emits).toContain(BridgeEventName.ServerStopping);
		expect(events.emits).toContain(BridgeEventName.ServerUpdated);
	});

	test("reads the startup line as the server being up", () => {
		const match = matcherFor(BridgeEventName.ServerStarted);

		expect(match?.test("Server has successfully started!")).toBe(true);
		expect(match?.test("[2026.09.10-01.02.03:456][  0]LogMemory: Platform Memory Stats")).toBe(false);
	});

	test("ignores the second startup line the engine prints, so the event fires once", () => {
		const match = matcherFor(BridgeEventName.ServerStarted);

		expect(match?.test("[2026.09.10-01.02.03:456][  0]Full Startup: 94.21 seconds")).toBe(false);
	});

	test("reads the save line the stop path and the backup both wait on", () => {
		const match = matcherFor(BridgeEventName.WorldSaved);

		expect(match?.test("[2026.09.10-01.02.03:456][  0]World Save Complete. Took: 1.146036")).toBe(true);
		expect(match?.test("Saving world")).toBe(false);
	});

	test("ignores the rcon reply, which never reaches the log", () => {
		const match = matcherFor(BridgeEventName.WorldSaved);

		expect(match?.test("World Saved")).toBe(false);
	});

	test("reads the three ways the engine reports a crash", () => {
		const match = matcherFor(BridgeEventName.ServerCrashed);

		expect(match?.test("Fatal error!")).toBe(true);
		expect(match?.test("LogWindows: Error: appError called")).toBe(true);
		expect(match?.test("=== Critical error: ===")).toBe(true);
		expect(match?.test("LogNet: Warning: a dropped packet")).toBe(false);
	});

	test("names the port in a bind failure so the panel can show it", () => {
		const match = matcherFor(BridgeEventName.PortBindFailed);

		expect("LogNet: Error: Failed to bind to port 9001".match(match ?? /$^/)?.groups?.port).toBe("9001");
	});
});
