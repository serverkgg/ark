import { type Bridge, BridgeKind, BridgeUserError } from "@serverkgg/bridge";
import { BridgeEventName } from "@serverkgg/bridge/protocol";
import { banCommand, EOS_ID_PATTERN, kickCommand, rconCommand, readRoster } from "../shared";

const REFRESH_SECONDS = 15;

const UNKNOWN_PLAYER: Bridge.Text = {
	ar: "هذا اللاعب لم يعد متصلًا بالسيرفر.",
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

const nameOf = (row: Bridge.Row, eosId: string) => {
	const name = String(row.name ?? "").trim();

	return name.length > 0 ? name : eosId;
};

export const kickPlayer = async (context: Bridge.Context, row: Bridge.Row) => {
	const eosId = eosIdOf(row);
	const name = nameOf(row, eosId);

	await rconCommand(context, kickCommand(eosId));

	context.emit(BridgeEventName.PlayerKicked, presenceFor(row));
	context.activity.report({
		details: {
			eosId,
		},
		name: BridgeEventName.PlayerKicked,
		subject: name,
		text: {
			ar: `تم طرد ${name}`,
			en: `Kicked ${name}`,
		},
	});
};

export const banPlayer = async (context: Bridge.Context, row: Bridge.Row) => {
	const eosId = eosIdOf(row);
	const name = nameOf(row, eosId);

	await rconCommand(context, banCommand(eosId));

	context.emit(BridgeEventName.PlayerBanned, presenceFor(row));
	context.activity.report({
		details: {
			eosId,
		},
		name: BridgeEventName.PlayerBanned,
		subject: name,
		text: {
			ar: `تم حظر ${name}`,
			en: `Banned ${name}`,
		},
	});
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
