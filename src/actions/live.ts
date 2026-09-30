import { type Bridge, BridgeKind } from "@serverkgg/bridge";
import { activityExcerpt, BridgeEventName } from "@serverkgg/bridge/protocol";
import { announceText, sendAnnounce } from "../announce";
import { DESTROY_WILD_DINOS, metrics, rconCommand, SAVE_WORLD } from "../shared";

export const MESSAGE_ARGUMENT = "message";

export const DESTROY_WILD_DINOS_WHAT = "destroy-wild-dinos";

export const SAVE_WHAT = "save";

export const live: Bridge.Actions = {
	kind: BridgeKind.Actions,
	requiresRunning: true,
	actions: {
		async announce(context, args) {
			const message = String(args[MESSAGE_ARGUMENT] ?? "");

			await sendAnnounce(context, message);

			const excerpt = activityExcerpt(announceText(message));

			context.activity.report({
				name: BridgeEventName.BroadcastSent,
				text: {
					ar: `تم إرسال إعلان للاعبين: «${excerpt}»`,
					en: `Sent an announcement to players: "${excerpt}"`,
				},
			});
		},

		async destroyWildDinos(context) {
			await rconCommand(context, DESTROY_WILD_DINOS);

			context.activity.report({
				details: {
					what: DESTROY_WILD_DINOS_WHAT,
				},
				name: BridgeEventName.GameplayChanged,
				text: {
					ar: "تم مسح الديناصورات البرية، وبتتولد من جديد",
					en: "Wiped the wild dinos, they respawn fresh",
				},
			});
		},

		async save(context) {
			await rconCommand(context, SAVE_WORLD);

			metrics.recordSave();

			context.activity.report({
				details: {
					what: SAVE_WHAT,
				},
				name: BridgeEventName.GameplayChanged,
				text: {
					ar: "تم حفظ الماب",
					en: "Saved the map",
				},
			});
		},
	},
};
