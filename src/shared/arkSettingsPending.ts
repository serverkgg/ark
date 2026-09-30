import type { Bridge } from "@serverkgg/bridge";
import { BridgeEventName } from "@serverkgg/bridge/protocol";
import { changedSettingKeys, sameSettingValue } from "@serverkgg/bridge/utils";
import { mergeIniSection } from "./arkConfig";
import {
	type ArkBaselineValue,
	type ArkPendingSection,
	type ArkPendingSettings,
	type ArkSettingsBaseline,
	type ArkStamp,
	patchArkStamp,
	readArkStamp,
} from "./arkStamp";

export interface ArkSettingPatch {
	file: string;
	section: string;
	values: Record<string, string>;
}

export const sectionKey = (file: string, section: string) => {
	return `${file} ${section}`;
};

export const mergePending = (pending: ArkPendingSettings, patches: ArkSettingPatch[]): ArkPendingSettings => {
	const next: ArkPendingSettings = {};

	for (const [file, sections] of Object.entries(pending)) {
		next[file] = {};

		for (const [section, values] of Object.entries(sections)) {
			next[file][section] = {
				...values,
			};
		}
	}

	for (const patch of patches) {
		if (Object.keys(patch.values).length === 0) {
			continue;
		}

		const file = next[patch.file] ?? {};

		file[patch.section] = {
			...file[patch.section],
			...patch.values,
		};

		next[patch.file] = file;
	}

	return next;
};

export const forgetPending = (pending: ArkPendingSettings, patches: ArkSettingPatch[]): ArkPendingSettings => {
	const dropped = new Map<string, Set<string>>();

	for (const patch of patches) {
		const id = sectionKey(patch.file, patch.section);
		const keys = dropped.get(id) ?? new Set<string>();

		for (const key of Object.keys(patch.values)) {
			keys.add(key);
		}

		dropped.set(id, keys);
	}

	const next: ArkPendingSettings = {};

	for (const [path, sections] of Object.entries(pending)) {
		for (const [name, values] of Object.entries(sections)) {
			const forget = dropped.get(sectionKey(path, name)) ?? new Set<string>();
			const kept: ArkPendingSection = {};

			for (const [key, value] of Object.entries(values)) {
				if (!forget.has(key)) {
					kept[key] = value;
				}
			}

			if (Object.keys(kept).length === 0) {
				continue;
			}

			const file = next[path] ?? {};

			file[name] = kept;
			next[path] = file;
		}
	}

	return next;
};

export const flattenPending = (pending: ArkPendingSettings): ArkSettingPatch[] => {
	const patches: ArkSettingPatch[] = [];

	for (const [file, sections] of Object.entries(pending)) {
		for (const [section, values] of Object.entries(sections)) {
			patches.push({
				file,
				section,
				values,
			});
		}
	}

	return patches;
};

export const pendingCount = (pending: ArkPendingSettings) => {
	return flattenPending(pending).reduce((total, patch) => total + Object.keys(patch.values).length, 0);
};

export const secretBaseline = (current: string, submitted: string): ArkBaselineValue => {
	return {
		changed: !sameSettingValue(current, submitted),
	};
};

export const pendingValues = (pending: ArkPendingSettings): Record<string, string> => {
	const values: Record<string, string> = {};

	for (const patch of flattenPending(pending)) {
		Object.assign(values, patch.values);
	}

	return values;
};

export const mergeBaseline = (
	baseline: ArkSettingsBaseline,
	pending: ArkPendingSettings,
	patches: ArkSettingPatch[],
	before: ArkSettingsBaseline | null,
): ArkSettingsBaseline => {
	const alreadyPending = pendingValues(pending);
	const next: ArkSettingsBaseline = {
		...baseline,
	};

	for (const patch of patches) {
		for (const key of Object.keys(patch.values)) {
			const first = before?.[key];

			if (first === undefined) {
				continue;
			}

			if (!(key in alreadyPending)) {
				next[key] = first;

				continue;
			}

			const kept = next[key];

			if (kept !== undefined && "changed" in kept && !kept.changed && "changed" in first && first.changed) {
				next[key] = first;
			}
		}
	}

	return next;
};

const keptBaseline = (baseline: ArkSettingsBaseline, pending: ArkPendingSettings): ArkSettingsBaseline => {
	const kept: ArkSettingsBaseline = {};
	const values = pendingValues(pending);

	for (const [key, entry] of Object.entries(baseline)) {
		if (key in values) {
			kept[key] = entry;
		}
	}

	return kept;
};

export const changedPendingKeys = (pending: ArkPendingSettings, baseline: ArkSettingsBaseline): string[] => {
	const changed: string[] = [];
	const before: Record<string, string> = {};
	const written: Record<string, string> = {};

	for (const [key, value] of Object.entries(pendingValues(pending))) {
		const entry = baseline[key];

		if (entry === undefined) {
			changed.push(key);
		} else if ("changed" in entry) {
			if (entry.changed) {
				changed.push(key);
			}
		} else {
			before[key] = entry.value;
			written[key] = value;
		}
	}

	return [
		...changed,
		...changedSettingKeys(before, written),
	].sort();
};

export const pendingFor = (pending: ArkPendingSettings, file: string, section: string): Record<string, string> => {
	return pending[file]?.[section] ?? {};
};

export const recordPendingSettings = async (
	context: Bridge.Context,
	patches: ArkSettingPatch[],
	before: ArkSettingsBaseline | null = null,
): Promise<ArkStamp> => {
	const stamp = await readArkStamp(context);

	return await patchArkStamp(context, {
		settingsBaseline: mergeBaseline(stamp.settingsBaseline, stamp.settingsPending, patches, before),
		settingsPending: mergePending(stamp.settingsPending, patches),
	});
};

export const forgetPendingSettings = async (context: Bridge.Context, patches: ArkSettingPatch[]): Promise<ArkStamp> => {
	const stamp = await readArkStamp(context);
	const next = forgetPending(stamp.settingsPending, patches);

	if (pendingCount(next) === pendingCount(stamp.settingsPending)) {
		return stamp;
	}

	return await patchArkStamp(context, {
		settingsBaseline: keptBaseline(stamp.settingsBaseline, next),
		settingsPending: next,
	});
};

export const replayPendingSettings = async (context: Bridge.Context, stamp: ArkStamp): Promise<ArkStamp> => {
	const patches = flattenPending(stamp.settingsPending);

	if (patches.length === 0) {
		return stamp;
	}

	for (const patch of patches) {
		await mergeIniSection(context, patch.file, patch.section, patch.values);
	}

	const count = pendingCount(stamp.settingsPending);

	context.log("replayed the settings the game overwrote on its last shutdown", {
		keys: count,
	});

	const cleared = await patchArkStamp(context, {
		settingsBaseline: {},
		settingsPending: {},
	});

	const keys = changedPendingKeys(stamp.settingsPending, stamp.settingsBaseline);

	if (keys.length === 0) {
		return cleared;
	}

	context.activity.report({
		details: {
			count: keys.length,
			keys: keys.join(", "),
		},
		name: BridgeEventName.SettingsApplied,
		text: {
			ar: `تم تطبيق الإعدادات اللي كانت تنتظر التشغيل (${keys.length})`,
			en: `Applied the settings that were waiting for the next start (${keys.length})`,
		},
	});

	return cleared;
};
