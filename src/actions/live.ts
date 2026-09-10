import { type Bridge, BridgeKind } from "@serverkgg/bridge";
import { sendAnnounce } from "../announce";
import { DESTROY_WILD_DINOS, metrics, rconCommand, SAVE_WORLD } from "../shared";

export const MESSAGE_ARGUMENT = "message";

export const live: Bridge.Actions = {
	kind: BridgeKind.Actions,
	requiresRunning: true,
	actions: {
		async announce(context, args) {
			await sendAnnounce(context, String(args[MESSAGE_ARGUMENT] ?? ""));
		},

		async destroyWildDinos(context) {
			await rconCommand(context, DESTROY_WILD_DINOS);
		},

		async save(context) {
			await rconCommand(context, SAVE_WORLD);

			metrics.recordSave();
		},
	},
};
