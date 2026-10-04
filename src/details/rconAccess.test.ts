import { describe, expect, it } from "bun:test";
import { normalizeStamp } from "../shared";
import { rconAccessPassword } from "./rconAccess";

describe("rconAccessPassword", () => {
	it("hides the card until the first boot generates a password", () => {
		expect(rconAccessPassword(normalizeStamp(null))).toBeNull();
	});

	it("shows the live password with nothing pending", () => {
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

	it("shows the rotated password as pending while the process still runs on the old one", () => {
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

	it("shows a rotation made before the first boot", () => {
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
