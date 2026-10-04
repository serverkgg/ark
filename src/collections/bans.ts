import { type Bridge, BridgeKind } from "@serverkgg/bridge";
import { BridgeEventName } from "@serverkgg/bridge/protocol";
import {
	BAN_LIST_FILE,
	banCommand,
	editIdListFile,
	rconCommand,
	readIdListFile,
	requireEosId,
	unbanCommand,
	withId,
	withoutId,
} from "../shared";

const REFRESH_SECONDS = 60;

export interface ArkBanRow extends Bridge.Row {
	id: string;
	eosId: string;
}

export const banRow = (eosId: string): ArkBanRow => {
	return {
		eosId,
		id: eosId,
	};
};

export const bans: Bridge.Collection = {
	kind: BridgeKind.Collection,
	refreshSeconds: REFRESH_SECONDS,
	async list(context) {
		return (await readIdListFile(context, BAN_LIST_FILE)).map(banRow);
	},
	async add(context, input) {
		const eosId = requireEosId(input);

		if (context.server.running) {
			await rconCommand(context, banCommand(eosId));
		} else {
			await editIdListFile(context, BAN_LIST_FILE, (ids) => withId(ids, eosId));
		}

		context.emit(BridgeEventName.PlayerBanned, {
			eosId,
			player: eosId,
		});
		context.activity.report({
			details: {
				eosId,
			},
			name: BridgeEventName.PlayerBanned,
			subject: eosId,
			text: {
				ar: `تم حظر الحساب ${eosId}`,
				en: `Banned account ${eosId}`,
			},
		});

		context.log("banned an account from the panel", {
			eosId,
		});
	},
	actions: {
		async remove(context, row) {
			const eosId = requireEosId(row.id);

			if (context.server.running) {
				await rconCommand(context, unbanCommand(eosId));
			} else {
				await editIdListFile(context, BAN_LIST_FILE, (ids) => withoutId(ids, eosId));
			}

			context.activity.report({
				details: {
					eosId,
				},
				name: BridgeEventName.PlayerUnbanned,
				subject: eosId,
				text: {
					ar: `تم فك الحظر عن الحساب ${eosId}`,
					en: `Unbanned account ${eosId}`,
				},
			});

			context.log("lifted a ban from the panel", {
				eosId,
			});
		},
	},
};
