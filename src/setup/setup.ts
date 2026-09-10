import { type Bridge, BridgeKind } from "@serverkgg/bridge";
import { GuideOpenTab } from "@serverkgg/bridge/guides";
import { BridgeSetupStepKind } from "@serverkgg/bridge/protocol";
import { CROSSPLAY_VARIABLE, CUSTOM_MAP_VARIABLE, MAP_VARIABLE, MAX_PLAYERS_VARIABLE } from "../shared";

export const setup: Bridge.Setup = {
	kind: BridgeKind.Setup,
	steps: [
		{
			fields: [
				"SessionName",
				"ServerPassword",
				"Message",
			],
			help: {
				ar: "الاسم اللي يشوفونه اللاعبين في قائمة Unofficial، وكلمة مرور لو تبي سيرفرك خاص.",
				en: "The name players see under Unofficial, and a password if you want your server private.",
			},
			id: "name",
			kind: BridgeSetupStepKind.Form,
			required: false,
			section: "server",
			tab: "settings",
			title: {
				ar: "سمِّ سيرفرك",
				en: "Name your server",
			},
		},
		{
			fields: [
				MAP_VARIABLE,
				CUSTOM_MAP_VARIABLE,
				MAX_PLAYERS_VARIABLE,
				CROSSPLAY_VARIABLE,
			],
			help: {
				ar: "اختر الماب وعدد الخانات من الحين. كل ماب لها عالمها الخاص، والتبديل بعدين ما يمسح شيء.",
				en: "Pick the map and the number of slots now. Every map keeps its own world, so switching later deletes nothing.",
			},
			id: "launch",
			kind: BridgeSetupStepKind.Form,
			required: false,
			section: "launch",
			tab: "launch",
			title: {
				ar: "اختر الماب",
				en: "Pick your map",
			},
		},
		{
			help: {
				ar: "دوّر على المودات اللي تبيها وركّبها، وسيرفرك ينزّلها بنفسه في أول تشغيل بعدها.",
				en: "Find the mods you want and stage them; your server downloads them itself on the next start.",
			},
			id: "mods",
			kind: BridgeSetupStepKind.Open,
			required: false,
			target: {
				tab: GuideOpenTab.Panel,
				tabId: "mods",
			},
			title: {
				ar: "ركّب مودات",
				en: "Add some mods",
			},
		},
		{
			help: {
				ar: "انسخ عنوان سيرفرك وارسله لأصحابك.",
				en: "Copy your server address and send it to your friends.",
			},
			id: "invite",
			kind: BridgeSetupStepKind.Open,
			required: false,
			target: {
				tab: GuideOpenTab.Access,
			},
			title: {
				ar: "عزم أصحابك",
				en: "Invite your friends",
			},
		},
	],
};
