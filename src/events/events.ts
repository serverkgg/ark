import { type Bridge, BridgeKind } from "@serverkgg/bridge";
import { BridgeEventName } from "@serverkgg/bridge/protocol";
import { SAVE_LINE, SERVER_READY } from "../lifecycle";

const EVENTS_RAISED_BY_ROSTER_POLL = [
	BridgeEventName.PlayerJoined,
	BridgeEventName.PlayerLeft,
];

export const events: Bridge.Events = {
	kind: BridgeKind.Events,
	emits: [
		...EVENTS_RAISED_BY_ROSTER_POLL,
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
