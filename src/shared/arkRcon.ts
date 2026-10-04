import { type Bridge, type BridgeRconClient, BridgeRconError, BridgeUserError } from "@serverkgg/bridge";
import { RCON_PORT, RCON_TIMEOUT_MS } from "./arkApp";
import { readArkStamp } from "./arkStamp";

export const RCON_UNREACHABLE: Bridge.Text = {
	ar: "تعذّر الوصول إلى سيرفرك. تأكد من أنه شغّال، وجرب مرة ثانية.",
	en: "We couldn't reach your server. Make sure it's running and try again.",
};

export const RCON_UNSEEDED: Bridge.Text = {
	ar: "قناة التحكم غير جاهزة بعد. شغّل سيرفرك مرة واحدة لتجهز.",
	en: "The control channel isn't ready yet. Start your server once and it will be there.",
};

let client: BridgeRconClient | null = null;

let password = "";

const dropClient = () => {
	const open = client;

	client = null;
	password = "";

	void open?.disconnect().catch(() => undefined);
};

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

			throw new BridgeUserError(RCON_UNREACHABLE, {
				cause: error,
			});
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
