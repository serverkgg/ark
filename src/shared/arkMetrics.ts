export interface ArkMetricsSnapshot {
	readyAt: number | null;
	players: number | null;
	lastSaveAt: number | null;
	uptimeSeconds: number | null;
}

export interface ArkMetricsSampler {
	markReady(at?: number): void;
	recordPlayers(online: number | null): void;
	recordSave(at?: number): void;
	snapshot(at?: number): ArkMetricsSnapshot;
	clear(): void;
}

export const createMetricsSampler = (): ArkMetricsSampler => {
	let readyAt: number | null = null;
	let players: number | null = null;
	let lastSaveAt: number | null = null;

	return {
		markReady(at = Date.now()) {
			readyAt = at;
		},

		recordPlayers(online) {
			players = online;
		},

		recordSave(at = Date.now()) {
			lastSaveAt = at;
		},

		snapshot(at = Date.now()) {
			return {
				lastSaveAt,
				players,
				readyAt,
				uptimeSeconds: readyAt === null ? null : Math.max(0, Math.floor((at - readyAt) / 1000)),
			};
		},

		clear() {
			readyAt = null;
			players = null;
			lastSaveAt = null;
		},
	};
};

export const metrics = createMetricsSampler();
