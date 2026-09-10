import { type Bridge, BridgeKind, BridgeUserError } from "@serverkgg/bridge";
import { ANNOUNCE_MESSAGE_LENGTH, rconCommand, serverChatCommand } from "../shared";

export const EMPTY_MESSAGE: Bridge.Text = {
	ar: "اكتب الرسالة أول.",
	en: "Write the message first.",
};

export const announceText = (message: string) => {
	return message
		.replaceAll(/[\r\n"]+/g, " ")
		.trim()
		.slice(0, ANNOUNCE_MESSAGE_LENGTH);
};

export const sendAnnounce = async (context: Bridge.Context, message: string) => {
	const text = announceText(message);

	if (text.length === 0) {
		throw new BridgeUserError(EMPTY_MESSAGE);
	}

	await rconCommand(context, serverChatCommand(text, ANNOUNCE_MESSAGE_LENGTH));
};

export const announce: Bridge.Announce = {
	kind: BridgeKind.Announce,
	async announce(context, message) {
		await sendAnnounce(context, message);
	},
};
