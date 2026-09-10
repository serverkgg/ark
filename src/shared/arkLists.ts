import { type Bridge, BridgeUserError } from "@serverkgg/bridge";
import { EOS_ID_PATTERN } from "./arkApp";

export const BAD_EOS_ID: Bridge.Text = {
	ar: "الصق رقم حساب اللاعب — 32 حرف ورقم، تلقاه في جدول اللاعبين.",
	en: "Paste the player's account id — 32 letters and digits, straight from the players table.",
};

// The ban list the game writes carries the account id first and its own trailing fields
// after a comma; the admin and whitelist files are one bare id per line. Reading the
// first field covers both.
export const parseIdList = (content: string): string[] => {
	const ids: string[] = [];
	const seen = new Set<string>();

	for (const raw of content.split("\n")) {
		const id = (raw.split(",").at(0) ?? "").trim().toLowerCase();

		if (!EOS_ID_PATTERN.test(id) || seen.has(id)) {
			continue;
		}

		seen.add(id);
		ids.push(id);
	}

	return ids;
};

export const serializeIdList = (ids: string[]) => {
	return ids.length === 0 ? "" : `${ids.join("\n")}\n`;
};

export const withId = (ids: string[], id: string) => {
	return ids.includes(id)
		? ids
		: [
				...ids,
				id,
			];
};

export const withoutId = (ids: string[], id: string) => {
	return ids.filter((entry) => entry !== id);
};

export const requireEosId = (input: string) => {
	const id = input.trim().toLowerCase();

	if (!EOS_ID_PATTERN.test(id)) {
		throw new BridgeUserError(BAD_EOS_ID);
	}

	return id;
};

export const readIdListFile = async (context: Bridge.Context, path: string): Promise<string[]> => {
	if (!(await context.files.exists(path))) {
		return [];
	}

	return parseIdList(await context.files.read(path));
};

export const writeIdListFile = async (context: Bridge.Context, path: string, ids: string[]) => {
	await context.files.write(path, serializeIdList(ids));
};

let queue: Promise<unknown> = Promise.resolve();

export const editIdListFile = async (
	context: Bridge.Context,
	path: string,
	edit: (ids: string[]) => string[],
): Promise<string[]> => {
	const work = async () => {
		const ids = edit(await readIdListFile(context, path));

		await writeIdListFile(context, path, ids);

		return ids;
	};
	const next = queue.then(work, work);

	queue = next.catch(() => undefined);

	return await next;
};
