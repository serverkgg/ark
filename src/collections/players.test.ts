import { beforeEach, describe, expect, it } from "bun:test";
import type { Bridge } from "@serverkgg/bridge";
import { INSTALL_STAMP_FILE } from "@serverkgg/bridge/install";
import { BridgeEventName } from "@serverkgg/bridge/protocol";
import { releaseRcon } from "../shared";
import { banPlayer, kickPlayer } from "./players";

const EOS_ID = "0002a1b3c4d5e6f708192a3b4c5d6e7f";

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
	const emitted: {
		event: string;
		payload?: Bridge.Values;
	}[] = [];
	const reported: Bridge.Activity[] = [];

	const context = {
		activity: {
			report(entry: Bridge.Activity) {
				reported.push(entry);
			},
		},
		emit(event: string, payload?: Bridge.Values) {
			emitted.push({
				event,
				payload,
			});
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
		emitted,
		reported,
		sent,
	};
};

const row: Bridge.Row = {
	eosId: EOS_ID,
	id: EOS_ID,
	name: "Rex Tamer",
};

beforeEach(() => {
	releaseRcon();
});

describe("acting on a player from the roster", () => {
	it("keeps the kick event unchanged and reports the kick by the player's name", async () => {
		const { context, emitted, reported } = harness();

		await kickPlayer(context, row);

		expect(emitted).toEqual([
			{
				event: BridgeEventName.PlayerKicked,
				payload: {
					eosId: EOS_ID,
					player: "Rex Tamer",
				},
			},
		]);
		expect(reported).toMatchObject([
			{
				details: {
					eosId: EOS_ID,
				},
				name: BridgeEventName.PlayerKicked,
				subject: "Rex Tamer",
			},
		]);
		expect(JSON.stringify(reported)).not.toContain(PASSWORD);
	});

	it("keeps the ban event unchanged and reports the ban by the player's name", async () => {
		const { context, emitted, reported, sent } = harness();

		await banPlayer(context, row);

		expect(sent).toEqual([
			`BanPlayer ${EOS_ID}`,
		]);
		expect(emitted.map((entry) => entry.event)).toEqual([
			BridgeEventName.PlayerBanned,
		]);
		expect(reported).toMatchObject([
			{
				name: BridgeEventName.PlayerBanned,
				subject: "Rex Tamer",
			},
		]);
		expect(JSON.stringify(reported)).not.toContain(PASSWORD);
	});

	it("falls back to the account id when the roster has no name", async () => {
		const { context, reported } = harness();

		await kickPlayer(context, {
			eosId: EOS_ID,
			id: EOS_ID,
		});

		expect(reported.at(0)?.subject).toBe(EOS_ID);
	});
});
