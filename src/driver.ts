import type { BridgeDriver } from "@serverkgg/bridge";
import { RCON_ACCESS_MODULE } from "@serverkgg/bridge/rcon";
import { live } from "./actions";
import { announce } from "./announce";
import { backup } from "./backup";
import { admins, bans, modOrder, players, saves, whitelist } from "./collections";
import { admin, metrics, rconAccess } from "./details";
import { events } from "./events";
import { install } from "./install";
import { lifecycle } from "./lifecycle";
import { mods } from "./mods";
import { panel } from "./panel";
import { query } from "./query";
import { settings } from "./settings";
import { setup } from "./setup";
import { terminal } from "./terminal";

export const driver: BridgeDriver = {
	announce,
	backup,
	events,
	install,
	lifecycle,
	panel,
	query,
	setup,
	terminal,
	modules: {
		admin,
		admins,
		bans,
		live,
		metrics,
		modOrder,
		mods,
		players,
		saves,
		settings,
		whitelist,
		[RCON_ACCESS_MODULE]: rconAccess,
	},
};
