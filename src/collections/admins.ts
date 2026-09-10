import { type Bridge, BridgeKind } from "@serverkgg/bridge";
import { ADMIN_LIST_FILE, editIdListFile, readIdListFile, requireEosId, withId, withoutId } from "../shared";

const REFRESH_SECONDS = 60;

export interface ArkAdminRow extends Bridge.Row {
	id: string;
	eosId: string;
}

export const adminRow = (eosId: string): ArkAdminRow => {
	return {
		eosId,
		id: eosId,
	};
};

// An account on this list is admin without typing the password. ARK reads the file at
// boot, so the panel says the change lands on the next start.
export const admins: Bridge.Collection = {
	kind: BridgeKind.Collection,
	refreshSeconds: REFRESH_SECONDS,
	async list(context) {
		return (await readIdListFile(context, ADMIN_LIST_FILE)).map(adminRow);
	},
	async add(context, input) {
		const eosId = requireEosId(input);

		await editIdListFile(context, ADMIN_LIST_FILE, (ids) => withId(ids, eosId));

		context.log("added an admin account", {
			eosId,
		});
	},
	actions: {
		async remove(context, row) {
			const eosId = requireEosId(row.id);

			await editIdListFile(context, ADMIN_LIST_FILE, (ids) => withoutId(ids, eosId));

			context.log("removed an admin account", {
				eosId,
			});
		},
	},
};
