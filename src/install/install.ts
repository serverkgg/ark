import { type Bridge, BridgeKind, BridgeUserError } from "@serverkgg/bridge";
import { BridgeEventName } from "@serverkgg/bridge/protocol";
import { ANONYMOUS_LOGIN, createSteamcmd, missingGameRoots, SteamcmdPlatform } from "@serverkgg/bridge/steam";
import { generateToken } from "@serverkgg/bridge/utils";
import { prepareWinePrefix } from "@serverkgg/bridge/wine";
import {
	ADMIN_PASSWORD_LENGTH,
	type ArkStamp,
	enabledModIds,
	GAME_ROOTS,
	LOGS_DIRECTORY,
	mapNameOf,
	patchArkStamp,
	readArkStamp,
	readLaunchVariables,
	readMods,
	SAVED_ARKS_DIRECTORY,
	STEAM_APP_ID,
} from "../shared";
import { seedConfig } from "./seedConfig";

const LABEL = "ARK: Survival Ascended";

export const GAME_FILES_MISSING: Bridge.Text = {
	ar: "التنزيل خلص بس ملفات اللعبة ناقصة. جرّب التثبيت مرة ثانية.",
	en: "The download finished but the game files are missing. Try the install again.",
};

export const steamcmdFor = (context: Bridge.Context) => {
	return createSteamcmd(context, {
		appId: STEAM_APP_ID,
		label: LABEL,
		login: ANONYMOUS_LOGIN,
		platform: SteamcmdPlatform.Windows,
	});
};

const seedAdminPassword = async (context: Bridge.Context, stamp: ArkStamp): Promise<ArkStamp> => {
	if (stamp.adminPassword.length > 0) {
		return stamp;
	}

	context.log("generating the admin password the control channel runs on");

	return await patchArkStamp(context, {
		adminPassword: generateToken(ADMIN_PASSWORD_LENGTH),
	});
};

export const requireGameFiles = async (context: Bridge.Context) => {
	const unrepaired = await missingGameRoots(context, GAME_ROOTS);

	if (unrepaired.length > 0) {
		throw new BridgeUserError(GAME_FILES_MISSING, {
			cause: new Error(`steamcmd finished but ${unrepaired.join(", ")} is missing`),
		});
	}
};

export const recordBuild = async (context: Bridge.Context, stamp: ArkStamp, buildId: string | null) => {
	if (buildId === null) {
		context.log.warn(
			"steam finished without naming a build, so this install stays on the build the stamp already holds",
			{
				app: STEAM_APP_ID,
				build: stamp.buildId,
			},
		);

		return;
	}

	if (stamp.buildId !== null && stamp.buildId !== buildId) {
		context.log("the server moved to a newer ARK build", {
			from: stamp.buildId,
			to: buildId,
		});
		context.emit(BridgeEventName.ServerUpdated, {
			from: stamp.buildId,
			to: buildId,
		});
	}

	if (buildId === stamp.buildId) {
		return;
	}

	await patchArkStamp(context, {
		buildId,
	});

	if (stamp.buildId !== null) {
		context.activity.report({
			details: {
				from: stamp.buildId,
				to: buildId,
			},
			name: BridgeEventName.ServerUpdated,
			subject: buildId,
			text: {
				ar: `تم تحديث آرك من البيلد ${stamp.buildId} إلى ${buildId}`,
				en: `Updated ARK from build ${stamp.buildId} to ${buildId}`,
			},
		});
	}
};

export const reportGameInstalled = (context: Bridge.Context, buildId: string | null) => {
	context.activity.report({
		details: {
			build: buildId,
		},
		name: BridgeEventName.GameInstalled,
		subject: LABEL,
		text: {
			ar: "تم تثبيت آرك سيرفايفل أسندد، والسيرفر جاهز يشتغل",
			en: "Installed ARK: Survival Ascended, the server is ready to start",
		},
	});
};

export const install: Bridge.Install = {
	kind: BridgeKind.Install,
	async run(context) {
		const stamp = await readArkStamp(context);
		const missing = await missingGameRoots(context, GAME_ROOTS);
		const steam = steamcmdFor(context);

		await steam.prepare();

		const fresh = missing.length > 0;

		if (fresh) {
			context.log("letting steam fetch and verify the whole install — ARK is about 11 GB, so the first time is long", {
				app: STEAM_APP_ID,
				missing: missing.join(", "),
			});
		} else {
			context.log("checking steam for a newer build", {
				app: STEAM_APP_ID,
			});
		}

		await steam.update({
			validate: fresh,
		});

		await requireGameFiles(context);

		// No linkSteamClient: the payload is the Windows build, and the Linux steamclient
		// shared objects it would drop are read by nothing here. Proton needs its own
		// prefix instead, and it belongs to the volume rather than to the image.
		await prepareWinePrefix(context, {
			appId: STEAM_APP_ID,
			proton: true,
		});

		const seeded = await seedAdminPassword(context, stamp);

		await seedConfig(context, seeded.adminPassword);
		await context.files.ensure(SAVED_ARKS_DIRECTORY, LOGS_DIRECTORY);

		const buildId = await steam.buildId();

		await recordBuild(context, seeded, buildId);

		context.log("install complete", {
			app: STEAM_APP_ID,
			build: buildId,
		});

		if (fresh && stamp.buildId === null) {
			reportGameInstalled(context, buildId);
		}
	},
	async describe(context) {
		const stamp = await readArkStamp(context);
		const mods = enabledModIds(await readMods(context));
		const { map } = readLaunchVariables(context);

		return {
			build: mods.length === 0 ? null : `${mods.length} mods`,
			variant: mapNameOf(map).en,
			version: stamp.buildId,
		};
	},
};
