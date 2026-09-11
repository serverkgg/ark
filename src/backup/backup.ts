import { type Bridge, BridgeKind } from "@serverkgg/bridge";
import { SAVE_LINE } from "../lifecycle";
import { rconSilent, SAVE_WORLD } from "../shared";

const SETTLE_SECONDS = 10;

const SAVE_TIMEOUT_MS = 60_000;

export const backup: Bridge.Backup = {
	kind: BridgeKind.Backup,
	settleSeconds: SETTLE_SECONDS,
	async quiesce(context) {
		if (!context.server.running) {
			return;
		}

		if ((await rconSilent(context, SAVE_WORLD)) === null) {
			throw new Error("the world could not be saved before the backup");
		}

		if ((await context.logs.watch(SAVE_LINE, SAVE_TIMEOUT_MS)) === null) {
			throw new Error("the world did not report itself saved before the backup");
		}

		context.log("saved the world before the backup");
	},
};
