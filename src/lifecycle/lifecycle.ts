import { type Bridge, BridgeKind } from "@serverkgg/bridge";
import { BridgeEventName } from "@serverkgg/bridge/protocol";
import { protonCommand } from "@serverkgg/bridge/wine";
import {
	applyControlConfig,
	applyLaunchVariables,
	DO_EXIT,
	enabledModIds,
	GAME_PORT,
	metrics,
	promoteAdminPassword,
	RCON_PORT,
	rconSilent,
	readArkStamp,
	readLaunchVariables,
	readMods,
	readSessionName,
	releaseRcon,
	replayPendingSettings,
	roster,
	SAVE_WORLD,
	SERVER_EXE,
	START_WRAPPER,
	STEAM_APP_ID,
} from "../shared";
import { startArgs } from "./arkCommand";

const HEADLESS_SDL_DRIVERS_THE_ENGINE_REQUIRES = {
	SDL_AUDIODRIVER: "dummy",
	SDL_VIDEODRIVER: "dummy",
	XDG_SESSION_TYPE: "headless",
};

const WRITABLE_PROTON_RUNTIME_DIRECTORY = {
	XDG_RUNTIME_DIR: "/tmp/serverk-xdg",
};

const XALIA_OFF_TO_KEEP_ITS_CRASH_OUT_OF_THE_CONSOLE = {
	PROTON_USE_XALIA: "0",
};

export const ARK_ENVIRONMENT: Record<string, string> = {
	...XALIA_OFF_TO_KEEP_ITS_CRASH_OUT_OF_THE_CONSOLE,
	...HEADLESS_SDL_DRIVERS_THE_ENGINE_REQUIRES,
	...WRITABLE_PROTON_RUNTIME_DIRECTORY,
};

export const SERVER_READY = /has successfully started/;

export const SAVE_LINE = /World Save Complete/;

export const EXIT_LINE = /LogExit: Exiting\.|Log file closed/;

const STOP_TIMEOUT_SECONDS = 180;

const SAVE_TIMEOUT_MS = 60_000;

const EXIT_TIMEOUT_MS = 120_000;

const SETTLE_MS = 10_000;

let stopping: Promise<void> | null = null;

let unfollowSave: (() => void) | null = null;

const releaseFollow = () => {
	const stored = unfollowSave;

	unfollowSave = null;
	stored?.();
};

const shutdown = async (context: Bridge.Context) => {
	context.emit(BridgeEventName.ServerStopping);

	releaseFollow();

	if ((await rconSilent(context, SAVE_WORLD)) !== null) {
		if ((await context.logs.watch(SAVE_LINE, SAVE_TIMEOUT_MS)) === null) {
			context.log.warn("the world did not report itself saved, stopping anyway");
		}

		await Bun.sleep(SETTLE_MS);
	}

	await rconSilent(context, DO_EXIT);

	releaseRcon();
	metrics.clear();
	roster.clear();

	if ((await context.logs.watch(EXIT_LINE, EXIT_TIMEOUT_MS)) === null) {
		context.log.warn("the game did not print its exit line, letting the supervisor take it from here");
	}
};

export const lifecycle: Bridge.Lifecycle = {
	kind: BridgeKind.Lifecycle,
	ready: SERVER_READY,
	stopTimeoutSeconds: STOP_TIMEOUT_SECONDS,
	async command(context) {
		releaseRcon();
		releaseFollow();
		metrics.clear();
		roster.clear();

		const promoted = await promoteAdminPassword(context, await readArkStamp(context));
		const replayed = await replayPendingSettings(context, promoted);

		await applyControlConfig(context, promoted.adminPassword);

		const variables = readLaunchVariables(context);

		await applyLaunchVariables(context, replayed, variables);

		const proton = await protonCommand(context, {
			appId: STEAM_APP_ID,
			args: startArgs({
				battleye: variables.battleye,
				crossplay: variables.crossplay,
				exclusiveJoin: variables.exclusiveJoin,
				gamePort: context.port(GAME_PORT),
				map: variables.map,
				maxPlayers: variables.maxPlayers,
				mods: enabledModIds(await readMods(context)),
				rconPort: RCON_PORT,
				sessionName: await readSessionName(context),
			}),
			environment: ARK_ENVIRONMENT,
			exe: SERVER_EXE,
		});

		return [
			START_WRAPPER,
			...proton,
		];
	},
	async onReady(context) {
		metrics.markReady();

		releaseFollow();

		unfollowSave = context.logs.follow(SAVE_LINE, () => {
			metrics.recordSave();
		});
	},
	async stop(context) {
		stopping ??= shutdown(context).finally(() => {
			stopping = null;
		});

		await stopping;
	},
};
