import { type Bridge, BridgeKind } from "@serverkgg/bridge";
import {
	ArkSettingKind,
	type ArkSettingsBaseline,
	flattenPending,
	forgetPendingSettings,
	mergeIniSection,
	readArkStamp,
	readIniSection,
	recordPendingSettings,
	SETTING_BY_KEY,
	SETTINGS_SECTIONS,
	secretBaseline,
	settingsByFile,
	settingText,
	settingUpdates,
	settingValues,
	validateSettingsWrite,
} from "../shared";

const storedSettings = async (context: Bridge.Context): Promise<Record<string, string>> => {
	const stored: Record<string, string> = {};

	for (const { file, section } of SETTINGS_SECTIONS) {
		Object.assign(stored, await readIniSection(context, file, section));
	}

	for (const patch of flattenPending((await readArkStamp(context)).settingsPending)) {
		Object.assign(stored, patch.values);
	}

	return stored;
};

const baselineFor = async (
	context: Bridge.Context,
	updates: Record<string, string>,
): Promise<ArkSettingsBaseline | null> => {
	try {
		const shown = settingValues(await storedSettings(context));
		const baseline: ArkSettingsBaseline = {};

		for (const [key, submitted] of Object.entries(updates)) {
			const setting = SETTING_BY_KEY.get(key);
			const value = shown[key];

			if (setting === undefined || value === undefined) {
				continue;
			}

			const current = settingText(setting, value);

			baseline[key] =
				setting.kind === ArkSettingKind.Secret
					? secretBaseline(current, submitted)
					: {
							value: current,
						};
		}

		return baseline;
	} catch (error) {
		context.log.warn("the settings could not be read before the write, the next start reports every parked key", {
			error: error instanceof Error ? error.message : String(error),
		});

		return null;
	}
};

export const settings: Bridge.Settings = {
	kind: BridgeKind.Settings,
	async read(context) {
		return settingValues(await storedSettings(context));
	},
	async write(context, values) {
		const updates = settingUpdates(validateSettingsWrite(values));
		const patches = settingsByFile(updates);
		const before = context.server.running ? await baselineFor(context, updates) : null;

		for (const patch of patches) {
			await mergeIniSection(context, patch.file, patch.section, patch.values);
		}

		if (context.server.running) {
			await recordPendingSettings(context, patches, before);

			return;
		}

		await forgetPendingSettings(context, patches);
	},
};
