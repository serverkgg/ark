import { describe, expect, test } from "bun:test";
import type { Bridge } from "@serverkgg/bridge";
import { INSTALL_STAMP_FILE } from "@serverkgg/bridge/install";
import {
	normalizePending,
	normalizeStamp,
	patchArkStamp,
	promoteAdminPassword,
	readArkStamp,
	rotateAdminPassword,
} from "./arkStamp";

const stampContext = (stamp: object) => {
	const stored = new Map<string, string>([
		[
			INSTALL_STAMP_FILE,
			JSON.stringify(stamp),
		],
	]);

	return {
		files: {
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
	} as unknown as Bridge.Context;
};

describe("normalizeStamp", () => {
	test("carries a pending admin password and reads a missing one as null", () => {
		expect(
			normalizeStamp({
				adminPassword: "live",
				adminPasswordNext: "next",
			}),
		).toMatchObject({
			adminPassword: "live",
			adminPasswordNext: "next",
		});
		expect(normalizeStamp(null).adminPasswordNext).toBeNull();
		expect(
			normalizeStamp({
				adminPasswordNext: "",
			}).adminPasswordNext,
		).toBeNull();
	});

	test("reads an empty stamp as the shape the driver expects", () => {
		expect(normalizeStamp(null)).toEqual({
			adminPassword: "",
			adminPasswordNext: null,
			buildId: null,
			settingsPending: {},
		});
	});
});

describe("normalizePending", () => {
	test("keeps a file, section and string values", () => {
		expect(
			normalizePending({
				"a.ini": {
					ServerSettings: {
						XPMultiplier: "2",
					},
				},
			}),
		).toEqual({
			"a.ini": {
				ServerSettings: {
					XPMultiplier: "2",
				},
			},
		});
	});

	test("drops anything that is not a string value, and the sections it empties", () => {
		expect(
			normalizePending({
				"a.ini": {
					ServerSettings: {
						XPMultiplier: 2,
					},
				},
			}),
		).toEqual({});
	});

	test("reads garbage as nothing pending", () => {
		expect(normalizePending("nope")).toEqual({});
		expect(normalizePending(null)).toEqual({});
		expect(normalizePending([])).toEqual({});
	});
});

describe("promoteAdminPassword", () => {
	test("moves the next password into place and clears it", async () => {
		const context = stampContext({
			adminPassword: "live",
			adminPasswordNext: "next",
		});

		const promoted = await promoteAdminPassword(context, await readArkStamp(context));

		expect(promoted.adminPassword).toBe("next");
		expect(promoted.adminPasswordNext).toBeNull();
		expect((await readArkStamp(context)).adminPassword).toBe("next");
	});

	test("leaves the live password alone when nothing was rotated", async () => {
		const context = stampContext({
			adminPassword: "live",
		});

		expect((await promoteAdminPassword(context, await readArkStamp(context))).adminPassword).toBe("live");
	});
});

describe("rotateAdminPassword", () => {
	test("parks a new password without touching the one the process is running on", async () => {
		const context = stampContext({
			adminPassword: "live",
		});

		await rotateAdminPassword(context);

		const stamp = await readArkStamp(context);

		expect(stamp.adminPassword).toBe("live");
		expect(stamp.adminPasswordNext).not.toBeNull();
		expect(stamp.adminPasswordNext).not.toBe("live");
	});
});

describe("patchArkStamp", () => {
	test("keeps the keys it was not asked to change", async () => {
		const context = stampContext({
			adminPassword: "live",
			buildId: "1",
		});

		expect(
			await patchArkStamp(context, {
				buildId: "2",
			}),
		).toMatchObject({
			adminPassword: "live",
			buildId: "2",
		});
	});
});
