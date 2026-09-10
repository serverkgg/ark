import type { Bridge } from "@serverkgg/bridge";
import { createRosterSync } from "@serverkgg/bridge/presence";
import { LIST_PLAYERS } from "./arkConsole";
import { type ArkPlayerRow, parseListPlayers, presenceOf, rosterOf } from "./arkPlayers";
import { rconSilent } from "./arkRcon";

export const roster = createRosterSync<ArkPlayerRow>({
	id: (row) => row.id,
	presenceOf,
});

export const readRoster = async (context: Bridge.Context): Promise<ArkPlayerRow[] | null> => {
	const reply = await rconSilent(context, LIST_PLAYERS);

	if (reply === null) {
		return null;
	}

	const rows = rosterOf(parseListPlayers(reply));

	roster.sync(context, rows);

	return rows;
};
