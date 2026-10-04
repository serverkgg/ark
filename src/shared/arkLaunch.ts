import type { Bridge } from "@serverkgg/bridge";
import { BridgeEventName } from "@serverkgg/bridge/protocol";
import { changedSettingKeys } from "@serverkgg/bridge/utils";
import { mapNameOf } from "./arkMaps";
import { type ArkStamp, patchArkStamp } from "./arkStamp";
import {
	type ArkLaunchVariables,
	BATTLEYE_VARIABLE,
	CROSSPLAY_VARIABLE,
	EXCLUSIVE_JOIN_VARIABLE,
	MAP_VARIABLE,
	MAX_PLAYERS_VARIABLE,
} from "./arkVariables";

export const LAUNCH_TARGET = "launch";

export const launchSnapshot = (variables: ArkLaunchVariables): Record<string, string> => {
	return {
		[BATTLEYE_VARIABLE]: String(variables.battleye),
		[CROSSPLAY_VARIABLE]: String(variables.crossplay),
		[EXCLUSIVE_JOIN_VARIABLE]: String(variables.exclusiveJoin),
		[MAP_VARIABLE]: variables.map,
		[MAX_PLAYERS_VARIABLE]: String(variables.maxPlayers),
	};
};

export const launchChanges = (previous: Record<string, string>, next: Record<string, string>): string[] => {
	return changedSettingKeys(previous, next)
		.filter((key) => previous[key] !== undefined)
		.sort();
};

const sameSnapshot = (previous: Record<string, string>, next: Record<string, string>) => {
	return Object.keys(next).every((key) => previous[key] === next[key]);
};

export const worldActivatedText = (from: Bridge.Text, to: Bridge.Text): Bridge.Text => {
	return {
		ar: `تم تغيير الماب من ${from.ar} إلى ${to.ar}، ولكل ماب حفظها، فيبقى حفظ ${from.ar} إذا رجعت إليها`,
		en: `Changed the map from ${from.en} to ${to.en}, each map keeps its own save, so the save on ${from.en} is still there if you switch back`,
	};
};

const reportWorldActivated = (context: Bridge.Context, previous: string, next: string) => {
	const from = mapNameOf(previous);
	const to = mapNameOf(next);

	context.activity.report({
		details: {
			map: next,
			previous: from.en,
			previousMap: previous,
			world: to.en,
		},
		name: BridgeEventName.WorldActivated,
		subject: to.en,
		text: worldActivatedText(from, to),
	});
};

const reportLaunchApplied = (context: Bridge.Context, keys: string[]) => {
	context.activity.report({
		details: {
			count: keys.length,
			keys: keys.join(", "),
			target: LAUNCH_TARGET,
		},
		name: BridgeEventName.SettingsApplied,
		text: {
			ar: `تم تطبيق خيارات التشغيل التي تغيّرت (${keys.length})`,
			en: `Applied the changed launch options (${keys.length})`,
		},
	});
};

const recordLaunch = async (context: Bridge.Context, stamp: ArkStamp, variables: ArkLaunchVariables) => {
	const next = launchSnapshot(variables);

	if (sameSnapshot(stamp.launch, next)) {
		return;
	}

	const changed = launchChanges(stamp.launch, next);
	const previousMap = stamp.launch[MAP_VARIABLE];
	const options = changed.filter((key) => key !== MAP_VARIABLE);

	await patchArkStamp(context, {
		launch: next,
	});

	if (previousMap !== undefined && changed.includes(MAP_VARIABLE)) {
		reportWorldActivated(context, previousMap, variables.map);
	}

	if (options.length > 0) {
		reportLaunchApplied(context, options);
	}
};

export const applyLaunchVariables = async (context: Bridge.Context, stamp: ArkStamp, variables: ArkLaunchVariables) => {
	try {
		await recordLaunch(context, stamp, variables);
	} catch (error) {
		context.log.warn("the launch variables could not be recorded for the activity feed, starting anyway", {
			error: error instanceof Error ? error.message : String(error),
		});
	}
};
