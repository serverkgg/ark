import { type Bridge, BridgeKind } from "@serverkgg/bridge";
import { BridgeEventName } from "@serverkgg/bridge/protocol";
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

export const admins: Bridge.Collection = {
	kind: BridgeKind.Collection,
	refreshSeconds: REFRESH_SECONDS,
	async list(context) {
		return (await readIdListFile(context, ADMIN_LIST_FILE)).map(adminRow);
	},
	async add(context, input) {
		const eosId = requireEosId(input);

		await editIdListFile(context, ADMIN_LIST_FILE, (ids) => withId(ids, eosId));
		context.activity.report({
			details: {
				eosId,
				list: "admins",
			},
			name: BridgeEventName.AccessGranted,
			subject: eosId,
			text: {
				ar: `تمت إضافة الحساب ${eosId} إلى قائمة الأدمن، ويُطبَّق التغيير في التشغيل القادم`,
				en: `Added account ${eosId} to the admin list, takes effect on the next start`,
			},
		});

		context.log("added an admin account", {
			eosId,
		});
	},
	actions: {
		async remove(context, row) {
			const eosId = requireEosId(row.id);

			await editIdListFile(context, ADMIN_LIST_FILE, (ids) => withoutId(ids, eosId));
			context.activity.report({
				details: {
					eosId,
					list: "admins",
				},
				name: BridgeEventName.AccessRevoked,
				subject: eosId,
				text: {
					ar: `تمت إزالة الحساب ${eosId} من قائمة الأدمن، ويُطبَّق التغيير في التشغيل القادم`,
					en: `Removed account ${eosId} from the admin list, takes effect on the next start`,
				},
			});

			context.log("removed an admin account", {
				eosId,
			});
		},
	},
};
