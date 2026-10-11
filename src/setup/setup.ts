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
				ar: "الاسم الذي يراه اللاعبون في قائمة Unofficial، وكلمة مرور إذا أردت سيرفرك خاصًا.",
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
				ar: "اختر الماب وعدد الخانات الآن. لكل ماب حفظه الخاص، والتبديل لاحقًا لا يحذف شيئًا.",
				en: "Pick the map and the number of slots now. Every map keeps its own save, so switching later deletes nothing.",
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
				ar: "ابحث عن المودات التي تريدها وثبّتها، وسينزّلها سيرفرك بنفسه في التشغيل التالي.",
				en: "Find the mods you want and install them, and your server downloads them itself on the next start.",
			},
			id: "mods",
			kind: BridgeSetupStepKind.Open,
			required: false,
			target: {
				tab: GuideOpenTab.Panel,
				tabId: "mods",
			},
			title: {
				ar: "ثبّت مودات",
				en: "Add some mods",
			},
		},
		{
			help: {
				ar: "انسخ عنوان سيرفرك وأرسله لأصحابك.",
				en: "Copy your server address and send it to your friends.",
			},
			id: "invite",
			kind: BridgeSetupStepKind.Open,
			required: false,
			target: {
				tab: GuideOpenTab.Access,
			},
			title: {
				ar: "ادعُ أصحابك",
				en: "Invite your friends",
			},
		},
	],
};
