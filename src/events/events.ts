import { type Bridge, BridgeKind } from "@serverkgg/bridge";
import { BridgeEventName } from "@serverkgg/bridge/protocol";
import { SAVE_LINE, SERVER_READY } from "../lifecycle";

// ARK logs a join and a leave at a verbosity the shipped server never prints, so the
// roster poll raises those two and they are declared in `emits` instead.
export const events: Bridge.Events = {
	kind: BridgeKind.Events,
	emits: [
		BridgeEventName.PlayerJoined,
		BridgeEventName.PlayerLeft,
		BridgeEventName.PlayerKicked,
		BridgeEventName.PlayerBanned,
		BridgeEventName.ServerStopping,
		BridgeEventName.ServerUpdated,
	],
	patterns: [
		{
			emit: BridgeEventName.ServerStarted,
			match: SERVER_READY,
		},
		{
			emit: BridgeEventName.WorldSaved,
			match: SAVE_LINE,
		},
		{
			emit: BridgeEventName.ServerCrashed,
			match: /(?<detail>Fatal error|appError|Critical error)/,
		},
		{
			emit: BridgeEventName.PortBindFailed,
			match: /LogNet: Error:.*?[Ff]ailed to bind.*?(?<port>\d{2,5})/,
		},
	],
};
