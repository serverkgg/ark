import { type Bridge, BridgeUserError } from "@serverkgg/bridge";
import { readStamp, writeStamp } from "@serverkgg/bridge/install";
import { MOD_LIST_LIMIT, MODS_SIDECAR_FILE } from "./arkApp";

const PROJECT_ID = /^\d{2,10}$/;

export const MOD_LIMIT_REACHED: Bridge.Text = {
	ar: `وصلت الحد — ${MOD_LIST_LIMIT} مود لكل سيرفر. شيل واحد قبل ما تضيف غيره.`,
	en: `You are at the limit — ${MOD_LIST_LIMIT} mods per server. Remove one before adding another.`,
};

export const BAD_PROJECT_ID: Bridge.Text = {
	ar: "رقم المود أرقام بس — هو Project ID اللي في صندوق About في صفحة المود على CurseForge.",
	en: "A mod id is digits only — it is the Project ID in the About box on the mod's CurseForge page.",
};

export interface ArkMod {
	projectId: string;
	title: string;
	pageUrl: string;
	icon: string;
	enabled: boolean;
	addedAt: string;
}

export interface ArkModsSidecar {
	mods: ArkMod[];
}

export const EMPTY_SIDECAR: ArkModsSidecar = {
	mods: [],
};

export const isProjectId = (value: string) => {
	return PROJECT_ID.test(value.trim());
};

export const requireProjectId = (value: string) => {
	const id = value.trim();

	if (!isProjectId(id)) {
		throw new BridgeUserError(BAD_PROJECT_ID);
	}

	return id;
};

const stringOr = (value: unknown, fallback: string) => {
	return typeof value === "string" ? value : fallback;
};

const normalizeMod = (raw: unknown): ArkMod | null => {
	if (typeof raw !== "object" || raw === null) {
		return null;
	}

	const entry = raw as Partial<ArkMod>;
	const projectId = stringOr(entry.projectId, "").trim();

	if (!isProjectId(projectId)) {
		return null;
	}

	return {
		addedAt: stringOr(entry.addedAt, ""),
		enabled: entry.enabled !== false,
		icon: stringOr(entry.icon, ""),
		pageUrl: stringOr(entry.pageUrl, ""),
		projectId,
		title: stringOr(entry.title, projectId),
	};
};

export const normalizeSidecar = (raw: Partial<ArkModsSidecar> | null): ArkModsSidecar => {
	const seen = new Set<string>();
	const mods: ArkMod[] = [];

	for (const entry of Array.isArray(raw?.mods) ? raw.mods : []) {
		const mod = normalizeMod(entry);

		if (mod === null || seen.has(mod.projectId)) {
			continue;
		}

		seen.add(mod.projectId);
		mods.push(mod);
	}

	return {
		mods,
	};
};

export const readMods = async (context: Bridge.Context): Promise<ArkModsSidecar> => {
	return normalizeSidecar(await readStamp<Partial<ArkModsSidecar>>(context, MODS_SIDECAR_FILE));
};

export const writeMods = async (context: Bridge.Context, sidecar: ArkModsSidecar) => {
	await writeStamp(context, normalizeSidecar(sidecar), MODS_SIDECAR_FILE);
};

let queue: Promise<unknown> = Promise.resolve();

export const exclusive = <Result>(work: () => Promise<Result>): Promise<Result> => {
	const next = queue.then(work, work);

	queue = next.catch(() => undefined);

	return next;
};

export const editMods = async (
	context: Bridge.Context,
	edit: (mods: ArkMod[]) => ArkMod[],
): Promise<ArkModsSidecar> => {
	return await exclusive(async () => {
		const sidecar = normalizeSidecar({
			mods: edit((await readMods(context)).mods),
		});

		await writeMods(context, sidecar);

		return sidecar;
	});
};

export const addMod = async (context: Bridge.Context, mod: ArkMod) => {
	return await exclusive(async () => {
		const current = await readMods(context);

		if (current.mods.some((entry) => entry.projectId === mod.projectId)) {
			return current;
		}

		if (current.mods.length >= MOD_LIST_LIMIT) {
			throw new BridgeUserError(MOD_LIMIT_REACHED);
		}

		const sidecar = normalizeSidecar({
			mods: [
				...current.mods,
				mod,
			],
		});

		await writeMods(context, sidecar);

		return sidecar;
	});
};

export const removeMod = async (context: Bridge.Context, projectId: string) => {
	return await editMods(context, (mods) => mods.filter((entry) => entry.projectId !== projectId));
};

export const toggleMod = async (context: Bridge.Context, projectId: string, enabled: boolean) => {
	return await editMods(context, (mods) => {
		return mods.map((entry) =>
			entry.projectId === projectId
				? {
						...entry,
						enabled,
					}
				: entry,
		);
	});
};

export const moveMod = async (context: Bridge.Context, projectId: string, offset: number) => {
	return await editMods(context, (mods) => {
		const index = mods.findIndex((entry) => entry.projectId === projectId);
		const target = index + offset;

		if (index === -1 || target < 0 || target >= mods.length) {
			return mods;
		}

		const reordered = [
			...mods,
		];
		const [moved] = reordered.splice(index, 1);

		if (moved === undefined) {
			return mods;
		}

		reordered.splice(target, 0, moved);

		return reordered;
	});
};

export const enabledModIds = (sidecar: ArkModsSidecar) => {
	return sidecar.mods.filter((mod) => mod.enabled).map((mod) => mod.projectId);
};
