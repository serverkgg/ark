import { type Bridge, type BridgeRconClient, BridgeRconError, BridgeUserError } from "@serverkgg/bridge";
import { RCON_PORT, RCON_TIMEOUT_MS } from "./arkApp";
import { readArkStamp } from "./arkStamp";

export const RCON_UNREACHABLE: Bridge.Text = {
	ar: "ما قدرنا نوصل لسيرفرك. تأكد إنه شغّال وجرّب مرة ثانية.",
	en: "We could not reach your server. Make sure it is running and try again.",
};

export const RCON_UNSEEDED: Bridge.Text = {
	ar: "قناة التحكم ما جهزت بعد. شغّل سيرفرك مرة وحدة وبتجهز.",
	en: "The control channel is not ready yet. Start your server once and it will be there.",
};

let client: BridgeRconClient | null = null;

let password = "";

const dropClient = () => {
	const open = client;

	client = null;
	password = "";

	void open?.disconnect().catch(() => undefined);
};

// mirroredIds stays on: ARK sends unsolicited keep-alive frames, and turning the id
// filter off would let one of them answer the command that is in flight.
const connect = async (context: Bridge.Context) => {
	const stamp = await readArkStamp(context);

	if (stamp.adminPassword.length === 0) {
		throw new BridgeUserError(RCON_UNSEEDED);
	}

	if (client !== null && password === stamp.adminPassword) {
		return client;
	}

	dropClient();

	password = stamp.adminPassword;

	client = await context.rcon.source({
		password: stamp.adminPassword,
		port: RCON_PORT,
		timeoutMs: RCON_TIMEOUT_MS,
	});

	return client;
};

export const rconCommand = async (context: Bridge.Context, input: string): Promise<string> => {
	try {
		return await (await connect(context)).command(input);
	} catch (error) {
		if (error instanceof BridgeRconError) {
			context.log.warn("the rcon request did not go through", {
				code: error.code,
				error: error.message,
			});

			throw new BridgeUserError(RCON_UNREACHABLE);
		}

		throw error;
	}
};

export const rconSilent = async (context: Bridge.Context, input: string): Promise<string | null> => {
	try {
		return await (await connect(context)).command(input);
	} catch (error) {
		context.log.warn("the rcon request did not go through", {
			error: error instanceof Error ? error.message : String(error),
		});

		return null;
	}
};

export const releaseRcon = () => {
	dropClient();
};
