import type { Bridge } from "@serverkgg/bridge";

const PLAYER_LINE = /^\d+\.\s*(?<name>.+?),\s*(?<eosId>[0-9a-f]{32})\s*$/i;

const EMPTY_ROSTER_OR_KEEP_ALIVE_LINE = /^(?:no players connected|keep alive)\.?$/i;

export interface ArkPlayer {
	name: string;
	eosId: string;
}

export interface ArkPlayerRow extends Bridge.Row {
	id: string;
	name: string;
	eosId: string;
}

export const parseListPlayers = (reply: string): ArkPlayer[] => {
	const players: ArkPlayer[] = [];
	const seen = new Set<string>();

	for (const raw of reply.split("\n")) {
		const line = raw.trim();

		if (line.length === 0 || EMPTY_ROSTER_OR_KEEP_ALIVE_LINE.test(line)) {
			continue;
		}

		const match = line.match(PLAYER_LINE);
		const name = match?.groups?.name?.trim() ?? "";
		const eosId = match?.groups?.eosId?.toLowerCase() ?? "";

		if (eosId.length === 0 || seen.has(eosId)) {
			continue;
		}

		seen.add(eosId);

		players.push({
			eosId,
			name,
		});
	}

	return players;
};

export const rowOf = (player: ArkPlayer): ArkPlayerRow => {
	return {
		eosId: player.eosId,
		id: player.eosId,
		name: player.name.length > 0 ? player.name : player.eosId,
	};
};

export const rosterOf = (players: ArkPlayer[]): ArkPlayerRow[] => {
	return players.map(rowOf);
};

export const presenceOf = (row: ArkPlayerRow): Bridge.Values => {
	return {
		eosId: row.eosId,
		player: row.name,
	};
};

export const findPlayer = (rows: ArkPlayerRow[], needle: string): ArkPlayerRow | null => {
	const wanted = needle.trim().toLowerCase();

	if (wanted.length === 0) {
		return null;
	}

	return (
		rows.find((row) => {
			return row.eosId.toLowerCase() === wanted || row.name.toLowerCase() === wanted;
		}) ?? null
	);
};
