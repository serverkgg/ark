import { type Bridge, BridgeKind, BridgeUserError } from "@serverkgg/bridge";
import { type ArkMod, addMod, moveMod, readMods, removeMod, requireProjectId, toggleMod } from "../shared";

const REFRESH_SECONDS = 60;

const URL_INPUT: Bridge.Text = {
	ar: "حط رقم المود بس، مو الرابط. الرقم هو Project ID اللي في صندوق About في صفحة المود على CurseForge.",
	en: "Paste the mod id on its own, not the link. The id is the numeric Project ID in the About box on the mod's CurseForge page.",
};

const LINK_CHARACTERS = /[/:?]/;

export interface ArkModOrderRow extends Bridge.Row {
	id: string;
	order: number;
	title: string;
	projectId: string;
	state: string;
}

export const modOrderRow = (mod: ArkMod, index: number): ArkModOrderRow => {
	return {
		id: mod.projectId,
		order: index + 1,
		projectId: mod.projectId,
		state: mod.enabled ? "enabled" : "disabled",
		title: mod.title,
	};
};

const enabledOf = async (context: Bridge.Context, projectId: string) => {
	const mod = (await readMods(context)).mods.find((entry) => entry.projectId === projectId);

	return mod?.enabled ?? true;
};

// The web catalog installs from search results only, so this table is the way in for a
// mod the key cannot look up — and the only place the load order can be changed.
export const modOrder: Bridge.Collection = {
	kind: BridgeKind.Collection,
	refreshSeconds: REFRESH_SECONDS,
	async list(context) {
		return (await readMods(context)).mods.map(modOrderRow);
	},
	async add(context, input) {
		if (LINK_CHARACTERS.test(input)) {
			throw new BridgeUserError(URL_INPUT);
		}

		const projectId = requireProjectId(input);

		await addMod(context, {
			addedAt: new Date().toISOString(),
			enabled: true,
			icon: "",
			pageUrl: "",
			projectId,
			title: projectId,
		});

		context.log("staged a mod by its id, the server downloads it on the next start", {
			mod: projectId,
		});
	},
	actions: {
		async down(context, row) {
			await moveMod(context, row.id, 1);
		},

		async remove(context, row) {
			await removeMod(context, row.id);
		},

		async toggle(context, row) {
			await toggleMod(context, row.id, !(await enabledOf(context, row.id)));
		},

		async up(context, row) {
			await moveMod(context, row.id, -1);
		},
	},
};
