import { describe, expect, test } from "bun:test";
import { normalizeStamp } from "../shared";
import { rconAccessPassword } from "./rconAccess";

describe("rconAccessPassword", () => {
	// A card with no password at all is better than one showing an empty box, so the
	// shared detail hides itself until the first boot generates one.
	test("hides the card until the first boot generates a password", () => {
		expect(rconAccessPassword(normalizeStamp(null))).toBeNull();
	});

	test("shows the live password with nothing pending", () => {
		expect(
			rconAccessPassword(
				normalizeStamp({
					adminPassword: "live",
				}),
			),
		).toEqual({
			pending: false,
			value: "live",
		});
	});

	// ARK reads the password off the launch string once, at boot, so a rotation shows the
	// password the customer will need after the restart, badged as pending.
	test("shows the rotated password as pending while the process still runs on the old one", () => {
		expect(
			rconAccessPassword(
				normalizeStamp({
					adminPassword: "live",
					adminPasswordNext: "next",
				}),
			),
		).toEqual({
			pending: true,
			value: "next",
		});
	});

	test("shows a rotation made before the first boot", () => {
		expect(
			rconAccessPassword(
				normalizeStamp({
					adminPasswordNext: "next",
				}),
			),
		).toEqual({
			pending: true,
			value: "next",
		});
	});
});
