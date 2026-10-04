import type { Bridge } from "@serverkgg/bridge";
import { BridgeEventName } from "@serverkgg/bridge/protocol";
import { type ArkMod, readMods } from "./arkMods";

export const MOD_ORDER_TARGET = "mod-order";

export interface ArkModNoun {
	projectId: string;
	title: string;
}

const titleOf = (mod: ArkModNoun) => {
	const title = mod.title.trim();

	return title.length > 0 ? title : mod.projectId;
};

const stagedMods = async (context: Bridge.Context): Promise<ArkMod[] | null> => {
	try {
		return (await readMods(context)).mods;
	} catch (error) {
		context.log.warn("the staged mods could not be read for the activity entry, reporting without them", {
			error: error instanceof Error ? error.message : String(error),
		});

		return null;
	}
};

export const findMod = async (context: Bridge.Context, projectId: string): Promise<ArkMod | null> => {
	return (await stagedMods(context))?.find((entry) => entry.projectId === projectId) ?? null;
};

export const modPosition = async (context: Bridge.Context, projectId: string): Promise<number | null> => {
	const mods = await stagedMods(context);

	if (mods === null) {
		return null;
	}

	return mods.findIndex((entry) => entry.projectId === projectId);
};

export const reportModStaged = (context: Bridge.Context, mod: ArkModNoun) => {
	const title = titleOf(mod);

	context.activity.report({
		details: {
			projectId: mod.projectId,
			staged: true,
		},
		name: BridgeEventName.ModEnabled,
		subject: title,
		text: {
			ar: `تم تثبيت مود ${title}، ويُنزَّل في التشغيل القادم`,
			en: `Installed mod ${title}, it downloads on the next start`,
		},
	});
};

export const reportModRemoved = (context: Bridge.Context, mod: ArkModNoun) => {
	const title = titleOf(mod);

	context.activity.report({
		details: {
			projectId: mod.projectId,
		},
		name: BridgeEventName.ModRemoved,
		subject: title,
		text: {
			ar: `تمت إزالة مود ${title}، ويُطبَّق التغيير في التشغيل القادم`,
			en: `Removed mod ${title}, takes effect on the next start`,
		},
	});
};

export const reportModToggled = (context: Bridge.Context, mod: ArkModNoun, enabled: boolean) => {
	const title = titleOf(mod);

	context.activity.report({
		details: {
			projectId: mod.projectId,
		},
		name: enabled ? BridgeEventName.ModEnabled : BridgeEventName.ModDisabled,
		subject: title,
		text: enabled
			? {
					ar: `تم تفعيل مود ${title}، ويُطبَّق التغيير في التشغيل القادم`,
					en: `Enabled mod ${title}, takes effect on the next start`,
				}
			: {
					ar: `تم إيقاف مود ${title}، ويُطبَّق التغيير في التشغيل القادم`,
					en: `Disabled mod ${title}, takes effect on the next start`,
				},
	});
};

export const reportModMoved = (context: Bridge.Context, mod: ArkModNoun, position: number) => {
	const title = titleOf(mod);

	context.activity.report({
		details: {
			position,
			projectId: mod.projectId,
			target: MOD_ORDER_TARGET,
		},
		name: BridgeEventName.SettingsApplied,
		subject: title,
		text: {
			ar: `تم نقل مود ${title} إلى الرقم ${position} في ترتيب التحميل، ويُطبَّق التغيير في التشغيل القادم`,
			en: `Moved mod ${title} to number ${position} in the load order, takes effect on the next start`,
		},
	});
};
