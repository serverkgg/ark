import { beforeEach, describe, expect, test } from "bun:test";
import type { Bridge } from "@serverkgg/bridge";
import { INSTALL_STAMP_FILE } from "@serverkgg/bridge/install";
import { BRIDGE_ACTIVITY_EXCERPT_LENGTH_LIMIT, BridgeEventName } from "@serverkgg/bridge/protocol";
import { releaseRcon } from "../shared";
import { DESTROY_WILD_DINOS_WHAT, live, MESSAGE_ARGUMENT, SAVE_WHAT } from "./live";

const PASSWORD = "admin-password-never-shown";

const harness = () => {
	const files = new Map<string, string>([
		[
			INSTALL_STAMP_FILE,
			JSON.stringify({
				adminPassword: PASSWORD,
			}),
		],
	]);
	const sent: string[] = [];
	const reported: Bridge.Activity[] = [];

	const context = {
		activity: {
			report(entry: Bridge.Activity) {
				reported.push(entry);
			},
		},
		files: {
			async exists(path: string) {
				return files.has(path);
			},
			async read(path: string) {
				return files.get(path) ?? "";
			},
		},
		log: Object.assign(() => undefined, {
			error: () => undefined,
			warn: () => undefined,
		}),
		rcon: {
			async source() {
				return {
					async command(input: string) {
						sent.push(input);

						return "";
					},
					connected: true,
					async connect() {
						return;
					},
					async disconnect() {
						return;
					},
				};
			},
		},
		server: {
			running: true,
		},
	} as unknown as Bridge.Context;

	return {
		context,
		reported,
		sent,
	};
};

beforeEach(() => {
	releaseRcon();
});

describe("the live actions", () => {
	test("reports a broadcast with an excerpt of the message, never the whole of a long one", async () => {
		const { context, reported } = harness();
		const message = `Wipe tonight at nine. ${"Bring your dinos home. ".repeat(10)}`;

		await live.actions.announce?.(context, {
			[MESSAGE_ARGUMENT]: message,
		});

		const text = reported.at(0)?.text.en ?? "";

		expect(reported.at(0)?.name).toBe(BridgeEventName.BroadcastSent);
		expect(text).toContain("Wipe tonight at nine.");
		expect(text).not.toContain(message.trim());
		expect(text.length).toBeLessThan(BRIDGE_ACTIVITY_EXCERPT_LENGTH_LIMIT + 40);
		expect(JSON.stringify(reported)).not.toContain(PASSWORD);
	});

	test("reports clearing the wild dinos as a gameplay change", async () => {
		const { context, reported } = harness();

		await live.actions.destroyWildDinos?.(context, {});

		expect(reported).toMatchObject([
			{
				details: {
					what: DESTROY_WILD_DINOS_WHAT,
				},
				name: BridgeEventName.GameplayChanged,
			},
		]);
		expect(JSON.stringify(reported)).not.toContain(PASSWORD);
	});

	test("reports a manual save as a gameplay change", async () => {
		const { context, reported, sent } = harness();

		await live.actions.save?.(context, {});

		expect(sent).toHaveLength(1);
		expect(reported).toMatchObject([
			{
				details: {
					what: SAVE_WHAT,
				},
				name: BridgeEventName.GameplayChanged,
			},
		]);
	});
});
