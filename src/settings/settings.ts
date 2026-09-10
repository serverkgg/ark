import { type Bridge, BridgeKind } from "@serverkgg/bridge";
import {
	flattenPending,
	forgetPendingSettings,
	mergeIniSection,
	readArkStamp,
	readIniSection,
	recordPendingSettings,
	SETTINGS_SECTIONS,
	settingsByFile,
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

export const settings: Bridge.Settings = {
	kind: BridgeKind.Settings,
	async read(context) {
		return settingValues(await storedSettings(context));
	},
	async write(context, values) {
		const patches = settingsByFile(settingUpdates(validateSettingsWrite(values)));

		// Writing the files now keeps a stopped server correct at once; a running one
		// rewrites them from memory when it exits, which is what the parking is for.
		for (const patch of patches) {
			await mergeIniSection(context, patch.file, patch.section, patch.values);
		}

		if (context.server.running) {
			await recordPendingSettings(context, patches);

			return;
		}

		await forgetPendingSettings(context, patches);
	},
};
