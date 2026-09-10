import { type Bridge, BridgeKind, BridgeUserError } from "@serverkgg/bridge";
import { execDetail } from "@serverkgg/bridge/utils";
import { mapNameOf, readLaunchVariables, SAVED_ARKS_DIRECTORY, savedArkDirectory } from "../shared";

const REFRESH_SECONDS = 60;

const ACTIVE_MARK = "✓";

const FIND_TIMEOUT_MS = 30_000;

const SIZE_TIMEOUT_MS = 120_000;

const SAFE_NAME = /^[A-Za-z0-9_.-]+$/;

const MUST_BE_STOPPED: Bridge.Text = {
	ar: "وقّف سيرفرك أول. الوايب وهو شغّال يخلي اللعبة تكتب العالم من ذاكرتها مرة ثانية.",
	en: "Stop your server first. Wiping while it is up lets the game write the world back out of memory.",
};

const MISSING_SAVE: Bridge.Text = {
	ar: "عالم الماب هذي ما عاد موجود.",
	en: "That map's world is not there any more.",
};

export interface ArkSaveRow extends Bridge.Row {
	id: string;
	map: string;
	size: string;
	active: string;
}

const megabytes = (size: number | undefined) => {
	return size === undefined ? "" : `${Math.max(1, size)} MB`;
};

// context.files.list walks the whole volume, and this one holds eleven gigabytes of
// cooked content, so the worlds are read with find and measured with du.
const mapNames = async (context: Bridge.Context): Promise<string[]> => {
	if (!(await context.files.exists(SAVED_ARKS_DIRECTORY))) {
		return [];
	}

	const found = await context.exec(
		[
			"find",
			SAVED_ARKS_DIRECTORY,
			"-mindepth",
			"1",
			"-maxdepth",
			"1",
			"-type",
			"d",
			"-printf",
			"%f\n",
		],
		{
			timeoutMs: FIND_TIMEOUT_MS,
		},
	);

	if (found.code !== 0) {
		throw new Error(`the saved worlds could not be listed — ${execDetail(found)}`);
	}

	return found.stdout
		.split("\n")
		.map((line) => line.trim())
		.filter((line) => SAFE_NAME.test(line))
		.sort();
};

const sizesOf = async (context: Bridge.Context, names: string[]): Promise<Map<string, number>> => {
	const sizes = new Map<string, number>();

	if (names.length === 0) {
		return sizes;
	}

	const measured = await context.exec(
		[
			"du",
			"-sm",
			...names.map(savedArkDirectory),
		],
		{
			timeoutMs: SIZE_TIMEOUT_MS,
		},
	);

	for (const line of measured.stdout.split("\n")) {
		const [size, path] = line.trim().split(/\s+/, 2);
		const name = path?.split("/").at(-1) ?? "";
		const parsed = Number(size);

		if (name.length > 0 && Number.isFinite(parsed)) {
			sizes.set(name, Math.round(parsed));
		}
	}

	return sizes;
};

export const saves: Bridge.Collection = {
	kind: BridgeKind.Collection,
	refreshSeconds: REFRESH_SECONDS,
	async list(context) {
		const names = await mapNames(context);
		const sizes = await sizesOf(context, names);
		const { map } = readLaunchVariables(context);

		return names.map((name) => {
			return {
				active: name === map ? ACTIVE_MARK : "",
				id: name,
				map: mapNameOf(name).en,
				size: megabytes(sizes.get(name)),
			} satisfies ArkSaveRow;
		});
	},
	actions: {
		async wipe(context, row) {
			if (context.server.running) {
				throw new BridgeUserError(MUST_BE_STOPPED);
			}

			if (!SAFE_NAME.test(row.id)) {
				throw new BridgeUserError(MISSING_SAVE);
			}

			const path = savedArkDirectory(row.id);

			if (!(await context.files.exists(path))) {
				throw new BridgeUserError(MISSING_SAVE);
			}

			await context.files.remove(path);

			context.log("wiped a map's world from the panel", {
				map: row.id,
			});
		},
	},
};
