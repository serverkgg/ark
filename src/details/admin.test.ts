import { describe, expect, it } from "bun:test";
import type { Bridge } from "@serverkgg/bridge";
import { INSTALL_STAMP_FILE } from "@serverkgg/bridge/install";
import { BridgeEventName } from "@serverkgg/bridge/protocol";
import { RCON_ACCESS_ROTATE } from "@serverkgg/bridge/rcon";
import { ADMIN_PASSWORD_TARGET, RCON_PASSWORD_TARGET, readArkStamp } from "../shared";
import { admin, ROTATE_ACTION } from "./admin";
import { rconAccess } from "./rconAccess";

const PASSWORD = "admin-password-never-shown";

const harness = () => {
	const stored = new Map<string, string>([
		[
			INSTALL_STAMP_FILE,
			JSON.stringify({
				adminPassword: PASSWORD,
			}),
		],
	]);
	const reported: Bridge.Activity[] = [];

	const context = {
		activity: {
			report(entry: Bridge.Activity) {
				reported.push(entry);
			},
		},
		files: {
			async ensure() {
				return;
			},
			async exists(path: string) {
				return stored.has(path);
			},
			async read(path: string) {
				return stored.get(path) ?? "";
			},
			async write(path: string, content: string) {
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
		reported,
	};
};

const secretsOf = async (context: Bridge.Context) => {
	const stamp = await readArkStamp(context);

	return [
		stamp.adminPassword,
		stamp.adminPasswordNext ?? "",
	].filter((value) => value.length > 0);
};

describe("rotating the admin password", () => {
	it("reports the rotation by its target alone from the admin card", async () => {
		const { context, reported } = harness();

		await admin.actions?.[ROTATE_ACTION]?.(context, {});

		expect(reported).toMatchObject([
			{
				details: {
					target: ADMIN_PASSWORD_TARGET,
				},
				name: BridgeEventName.SecretRotated,
			},
		]);
		expect(reported.at(0)?.subject).toBeUndefined();

		for (const secret of await secretsOf(context)) {
			expect(JSON.stringify(reported)).not.toContain(secret);
		}
	});

	it("reports the rotation by its target alone from the remote access card", async () => {
		const { context, reported } = harness();

		await rconAccess.actions?.[RCON_ACCESS_ROTATE]?.(context, {});

		expect(reported).toMatchObject([
			{
				details: {
					target: RCON_PASSWORD_TARGET,
				},
				name: BridgeEventName.SecretRotated,
			},
		]);

		for (const secret of await secretsOf(context)) {
			expect(JSON.stringify(reported)).not.toContain(secret);
		}
	});
});
