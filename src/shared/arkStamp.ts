import type { Bridge } from "@serverkgg/bridge";
import { readStamp, writeStamp } from "@serverkgg/bridge/install";
import { BridgeEventName } from "@serverkgg/bridge/protocol";
import { generateToken } from "@serverkgg/bridge/utils";
import { ADMIN_PASSWORD_LENGTH } from "./arkApp";

export type ArkPendingSection = Record<string, string>;

export type ArkPendingFile = Record<string, ArkPendingSection>;

export type ArkPendingSettings = Record<string, ArkPendingFile>;

export type ArkBaselineValue =
	| {
			value: string;
	  }
	| {
			changed: boolean;
	  };

export type ArkSettingsBaseline = Record<string, ArkBaselineValue>;

export interface ArkStamp {
	buildId: string | null;
	adminPassword: string;
	adminPasswordNext: string | null;
	// ARK rewrites GameUserSettings.ini from memory when it exits, so a panel write made
	// while the server is up is also parked here and laid back over the file before the
	// next start. Without the replay the write is silently thrown away.
	settingsPending: ArkPendingSettings;
	settingsBaseline: ArkSettingsBaseline;
	launch: Record<string, string>;
}

export const EMPTY_STAMP: ArkStamp = {
	adminPassword: "",
	adminPasswordNext: null,
	buildId: null,
	launch: {},
	settingsBaseline: {},
	settingsPending: {},
};

const stringOr = (value: unknown, fallback: string) => {
	return typeof value === "string" ? value : fallback;
};

const nullableString = (value: unknown) => {
	return typeof value === "string" && value.length > 0 ? value : null;
};

const stringRecord = (value: unknown): Record<string, string> => {
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		return {};
	}

	const record: Record<string, string> = {};

	for (const [key, entry] of Object.entries(value)) {
		if (typeof entry === "string") {
			record[key] = entry;
		}
	}

	return record;
};

export const normalizePending = (value: unknown): ArkPendingSettings => {
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		return {};
	}

	const pending: ArkPendingSettings = {};

	for (const [path, sections] of Object.entries(value)) {
		if (typeof sections !== "object" || sections === null || Array.isArray(sections)) {
			continue;
		}

		const file: ArkPendingFile = {};

		for (const [section, values] of Object.entries(sections)) {
			const record = stringRecord(values);

			if (Object.keys(record).length > 0) {
				file[section] = record;
			}
		}

		if (Object.keys(file).length > 0) {
			pending[path] = file;
		}
	}

	return pending;
};

const baselineValueOf = (value: unknown): ArkBaselineValue | null => {
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		return null;
	}

	if ("changed" in value && typeof value.changed === "boolean") {
		return {
			changed: value.changed,
		};
	}

	if ("digest" in value) {
		return {
			changed: true,
		};
	}

	if ("value" in value && typeof value.value === "string") {
		return {
			value: value.value,
		};
	}

	return null;
};

export const normalizeBaseline = (value: unknown): ArkSettingsBaseline => {
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		return {};
	}

	const baseline: ArkSettingsBaseline = {};

	for (const [key, entry] of Object.entries(value)) {
		const normalized = baselineValueOf(entry);

		if (normalized !== null) {
			baseline[key] = normalized;
		}
	}

	return baseline;
};

export const normalizeStamp = (raw: Partial<ArkStamp> | null): ArkStamp => {
	return {
		adminPassword: stringOr(raw?.adminPassword, ""),
		adminPasswordNext: nullableString(raw?.adminPasswordNext),
		buildId: nullableString(raw?.buildId),
		launch: stringRecord(raw?.launch),
		settingsBaseline: normalizeBaseline(raw?.settingsBaseline),
		settingsPending: normalizePending(raw?.settingsPending),
	};
};

export const readArkStamp = async (context: Bridge.Context): Promise<ArkStamp> => {
	return normalizeStamp(await readStamp<Partial<ArkStamp>>(context));
};

export const writeArkStamp = async (context: Bridge.Context, stamp: ArkStamp) => {
	await writeStamp(context, stamp);
};

export const patchArkStamp = async (context: Bridge.Context, patch: Partial<ArkStamp>): Promise<ArkStamp> => {
	const stamp = normalizeStamp({
		...(await readArkStamp(context)),
		...patch,
	});

	await writeArkStamp(context, stamp);

	return stamp;
};

export const promoteAdminPassword = async (context: Bridge.Context, stamp: ArkStamp): Promise<ArkStamp> => {
	if (stamp.adminPasswordNext === null) {
		return stamp;
	}

	return await patchArkStamp(context, {
		adminPassword: stamp.adminPasswordNext,
		adminPasswordNext: null,
	});
};

export const ADMIN_PASSWORD_TARGET = "admin-password";

export const RCON_PASSWORD_TARGET = "rcon-password";

export const rotateAdminPassword = async (context: Bridge.Context) => {
	await patchArkStamp(context, {
		adminPasswordNext: generateToken(ADMIN_PASSWORD_LENGTH),
	});
};

export const reportAdminPasswordRotated = (context: Bridge.Context, target: string) => {
	context.activity.report({
		details: {
			target,
		},
		name: BridgeEventName.SecretRotated,
		text: {
			ar: "تم تغيير كلمة مرور الأدمن وكلمة مرور RCON معها، والتغيير ينطبق مع التشغيل الجاي",
			en: "Changed the admin password and the RCON password with it, takes effect on the next start",
		},
	});
};
