import type { Bridge } from "@serverkgg/bridge";
import { mergeIniSection } from "./arkConfig";
import {
	type ArkPendingSection,
	type ArkPendingSettings,
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

export const pendingFor = (pending: ArkPendingSettings, file: string, section: string): Record<string, string> => {
	return pending[file]?.[section] ?? {};
};

export const recordPendingSettings = async (context: Bridge.Context, patches: ArkSettingPatch[]): Promise<ArkStamp> => {
	const stamp = await readArkStamp(context);

	return await patchArkStamp(context, {
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

	context.log("replayed the settings the game overwrote on its last shutdown", {
		keys: pendingCount(stamp.settingsPending),
	});

	return await patchArkStamp(context, {
		settingsPending: {},
	});
};
