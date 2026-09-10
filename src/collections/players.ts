import { type Bridge, BridgeKind, BridgeUserError } from "@serverkgg/bridge";
import { BridgeEventName } from "@serverkgg/bridge/protocol";
import { banCommand, EOS_ID_PATTERN, kickCommand, rconCommand, readRoster } from "../shared";

const REFRESH_SECONDS = 15;

const UNKNOWN_PLAYER: Bridge.Text = {
	ar: "اللاعب هذا ما عاد داخل السيرفر.",
	en: "That player is no longer on the server.",
};

const eosIdOf = (row: Bridge.Row) => {
	const eosId = String(row.eosId ?? row.id ?? "").toLowerCase();

	if (!EOS_ID_PATTERN.test(eosId)) {
		throw new BridgeUserError(UNKNOWN_PLAYER);
	}

	return eosId;
};

const presenceFor = (row: Bridge.Row): Bridge.Values => {
	return {
		eosId: String(row.eosId ?? ""),
		player: String(row.name ?? ""),
	};
};

export const kickPlayer = async (context: Bridge.Context, row: Bridge.Row) => {
	await rconCommand(context, kickCommand(eosIdOf(row)));

	context.emit(BridgeEventName.PlayerKicked, presenceFor(row));
};

export const banPlayer = async (context: Bridge.Context, row: Bridge.Row) => {
	await rconCommand(context, banCommand(eosIdOf(row)));

	context.emit(BridgeEventName.PlayerBanned, presenceFor(row));
};

export const players: Bridge.Collection = {
	kind: BridgeKind.Collection,
	refreshSeconds: REFRESH_SECONDS,
	requiresRunning: true,
	async list(context) {
		return (await readRoster(context)) ?? [];
	},
	actions: {
		async ban(context, row) {
			await banPlayer(context, row);
		},

		async kick(context, row) {
			await kickPlayer(context, row);
		},
	},
};
