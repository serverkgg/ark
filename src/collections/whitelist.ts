import { type Bridge, BridgeKind } from "@serverkgg/bridge";
import { editIdListFile, readIdListFile, requireEosId, WHITELIST_FILE, withId, withoutId } from "../shared";

const REFRESH_SECONDS = 60;

export interface ArkWhitelistRow extends Bridge.Row {
	id: string;
	eosId: string;
}

export const whitelistRow = (eosId: string): ArkWhitelistRow => {
	return {
		eosId,
		id: eosId,
	};
};

// The list only bites while the exclusive join variable is on; without it ARK reads the
// file and lets everyone in anyway.
export const whitelist: Bridge.Collection = {
	kind: BridgeKind.Collection,
	refreshSeconds: REFRESH_SECONDS,
	async list(context) {
		return (await readIdListFile(context, WHITELIST_FILE)).map(whitelistRow);
	},
	async add(context, input) {
		const eosId = requireEosId(input);

		await editIdListFile(context, WHITELIST_FILE, (ids) => withId(ids, eosId));

		context.log("added an account to the whitelist", {
			eosId,
		});
	},
	actions: {
		async remove(context, row) {
			const eosId = requireEosId(row.id);

			await editIdListFile(context, WHITELIST_FILE, (ids) => withoutId(ids, eosId));

			context.log("removed an account from the whitelist", {
				eosId,
			});
		},
	},
};
