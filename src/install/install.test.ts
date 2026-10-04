import { describe, expect, it } from "bun:test";
import { type Bridge, BridgeUserError } from "@serverkgg/bridge";
import { INSTALL_STAMP_FILE } from "@serverkgg/bridge/install";
import { BridgeEventName } from "@serverkgg/bridge/protocol";
import { GAME_ROOTS, readArkStamp } from "../shared";
import { GAME_FILES_MISSING, recordBuild, reportGameInstalled, requireGameFiles } from "./install";

const PASSWORD = "admin-password-never-shown";

const harness = (options: { buildId?: string; roots?: string[]; failWrites?: boolean } = {}) => {
	const stored = new Map<string, string>([
		[
			INSTALL_STAMP_FILE,
			JSON.stringify({
				adminPassword: PASSWORD,
				buildId: options.buildId,
			}),
		],
	]);
	const present = new Set(options.roots ?? GAME_ROOTS);
	const reported: Bridge.Activity[] = [];
	const emitted: {
		event: string;
		payload?: Bridge.Values;
	}[] = [];

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
			async ensure() {
				return;
			},
			async exists(path: string) {
				return stored.has(path) || present.has(path);
			},
			async read(path: string) {
				return stored.get(path) ?? "";
			},
			async write(path: string, content: string) {
				if (options.failWrites) {
					throw new Error("the volume is read-only");
				}

				stored.set(path, content);
			},
		},
		log: Object.assign(() => undefined, {
			error: () => undefined,
			warn: () => undefined,
		}),
	} as unknown as Bridge.Context;

	return {
		context,
		emitted,
		reported,
	};
};

describe("recording the build steam installed", () => {
	it("emits the plain update event and reports it beside, both with the from and to keys every other game uses", async () => {
		const { context, emitted, reported } = harness({
			buildId: "100",
		});

		await recordBuild(context, await readArkStamp(context), "200");

		expect(reported).toMatchObject([
			{
				details: {
					from: "100",
					to: "200",
				},
				name: BridgeEventName.ServerUpdated,
				subject: "200",
			},
		]);
		expect(reported.at(0)?.details).not.toHaveProperty("build");
		expect(reported.at(0)?.details).not.toHaveProperty("previous");
		expect(emitted).toEqual([
			{
				event: BridgeEventName.ServerUpdated,
				payload: {
					from: "100",
					to: "200",
				},
			},
		]);
		expect(JSON.stringify(reported)).not.toContain(PASSWORD);
		expect((await readArkStamp(context)).buildId).toBe("200");
	});

	it("reports nothing on the first build or on the same build", async () => {
		const first = harness();

		await recordBuild(first.context, await readArkStamp(first.context), "100");

		expect(first.reported).toEqual([]);
		expect(first.emitted).toEqual([]);
		expect((await readArkStamp(first.context)).buildId).toBe("100");

		const same = harness({
			buildId: "100",
		});

		await recordBuild(same.context, await readArkStamp(same.context), "100");

		expect(same.reported).toEqual([]);
		expect(same.emitted).toEqual([]);
	});

	it("keeps the plain event but reports nothing when the build cannot be stamped", async () => {
		const { context, emitted, reported } = harness({
			buildId: "100",
			failWrites: true,
		});

		await expect(recordBuild(context, await readArkStamp(context), "200")).rejects.toThrow();

		expect(emitted.map((entry) => entry.event)).toEqual([
			BridgeEventName.ServerUpdated,
		]);
		expect(reported).toEqual([]);
	});

	it("keeps the stamped build when steam names none", async () => {
		const { context, reported } = harness({
			buildId: "100",
		});

		await recordBuild(context, await readArkStamp(context), null);

		expect(reported).toEqual([]);
		expect((await readArkStamp(context)).buildId).toBe("100");
	});
});

describe("the end of an install", () => {
	it("reports a first install by the game's name", () => {
		const { context, reported } = harness();

		reportGameInstalled(context, "100");

		expect(reported).toMatchObject([
			{
				details: {
					build: "100",
				},
				name: BridgeEventName.GameInstalled,
				subject: "ARK: Survival Ascended",
			},
		]);
	});

	it("tells the owner to retry when the download left the game files missing, and keeps the detail as the cause", async () => {
		const { context } = harness({
			roots: [],
		});
		const failure = await requireGameFiles(context).then(
			() => null,
			(error: unknown) => error,
		);

		expect(failure).toBeInstanceOf(BridgeUserError);
		expect(failure instanceof BridgeUserError ? failure.text : null).toEqual(GAME_FILES_MISSING);
		expect(failure instanceof Error ? String(failure.cause) : "").toContain("steamcmd finished but");
	});

	it("passes when every game root is there", async () => {
		const { context } = harness();

		await requireGameFiles(context);
	});
});
