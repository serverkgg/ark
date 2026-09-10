import { type Bridge, BridgeKind } from "@serverkgg/bridge";
import { metrics, readLaunchVariables, readRoster } from "../shared";

const REFRESH_SECONDS = 15;

export const query: Bridge.Query = {
	kind: BridgeKind.Query,
	refreshSeconds: REFRESH_SECONDS,
	async sample(context) {
		const rows = await readRoster(context);
		const online = rows === null ? null : rows.length;

		metrics.recordPlayers(online);

		return {
			max: readLaunchVariables(context).maxPlayers,
			online,
		};
	},
};
