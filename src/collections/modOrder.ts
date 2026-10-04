import { type Bridge, BridgeKind, BridgeUserError } from "@serverkgg/bridge";
import {
	type ArkMod,
	addMod,
	findMod,
	modPosition,
	moveMod,
	readMods,
	removeMod,
	reportModMoved,
	reportModRemoved,
	reportModStaged,
	reportModToggled,
	requireProjectId,
	toggleMod,
} from "../shared";

const REFRESH_SECONDS = 60;

const URL_INPUT: Bridge.Text = {
	ar: "ضع رقم المود فقط، وليس الرابط. الرقم هو Project ID الموجود في صندوق About في صفحة المود على CurseForge.",
	en: "Paste the mod ID on its own, not the link. The ID is the numeric Project ID in the About box on the mod's CurseForge page.",
};

const LINK_CHARACTERS = /[/:?]/;

export interface ArkModOrderRow extends Bridge.Row {
	id: string;
	order: number;
	title: string;
	projectId: string;
	state: Bridge.Text;
}

export const modOrderRow = (mod: ArkMod, index: number): ArkModOrderRow => {
	return {
		id: mod.projectId,
		order: index + 1,
		projectId: mod.projectId,
		state: mod.enabled
			? {
					ar: "مفعّل",
					en: "Enabled",
				}
			: {
					ar: "موقوف",
					en: "Disabled",
				},
		title: mod.title,
	};
};

const move = async (context: Bridge.Context, projectId: string, offset: number) => {
	const before = await modPosition(context, projectId);
	const sidecar = await moveMod(context, projectId, offset);
	const after = sidecar.mods.findIndex((entry) => entry.projectId === projectId);
	const mod = sidecar.mods[after];

	if (mod !== undefined && before !== null && after !== before) {
		reportModMoved(context, mod, after + 1);
	}
};

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
		const staged = await findMod(context, projectId);

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

		if (staged === null) {
			reportModStaged(context, {
				projectId,
				title: projectId,
			});
		}
	},
	actions: {
		async down(context, row) {
			await move(context, row.id, 1);
		},

		async remove(context, row) {
			const mod = await findMod(context, row.id);

			await removeMod(context, row.id);

			if (mod !== null) {
				reportModRemoved(context, mod);
			}
		},

		async toggle(context, row) {
			const mod = await findMod(context, row.id);
			const enabled = !(mod?.enabled ?? true);

			await toggleMod(context, row.id, enabled);

			if (mod !== null) {
				reportModToggled(context, mod, enabled);
			}
		},

		async up(context, row) {
			await move(context, row.id, -1);
		},
	},
};
