import {
	type Bridge,
	BridgeConfirm,
	BridgeControl,
	BridgeFormTarget,
	BridgeIcon,
	BridgeLayout,
	BridgePlace,
} from "@serverkgg/bridge";
import { rconAccessSections } from "@serverkgg/bridge/rcon";
import { MESSAGE_ARGUMENT } from "../actions";
import {
	ANNOUNCE_MESSAGE_LENGTH,
	BATTLEYE_VARIABLE,
	BREEDING_FIELDS,
	CHAT_FIELDS,
	CROSSPLAY_VARIABLE,
	CUSTOM_MAP_VALUE,
	CUSTOM_MAP_VARIABLE,
	EXCLUSIVE_JOIN_VARIABLE,
	MAP_ID_PATTERN,
	MAP_VARIABLE,
	MAX_PLAYERS_MAX,
	MAX_PLAYERS_MIN,
	MAX_PLAYERS_VARIABLE,
	mapOptions,
	RATES_FIELDS,
	RULES_FIELDS,
	SERVER_FIELDS,
} from "../shared";

const settingsTab: Bridge.Tab = {
	icon: BridgeIcon.Settings,
	id: "settings",
	sections: [
		{
			fields: SERVER_FIELDS,
			help: {
				ar: "اسم سيرفرك وكلمة مروره ورسالة اليوم، وشوي تفاصيل عن شكل اللعب.",
				en: "Your server's name, its password and its message of the day, plus a few touches on how it plays.",
			},
			id: "server",
			layout: BridgeLayout.Form,
			module: "settings",
			restartHint: true,
			target: BridgeFormTarget.Settings,
			title: {
				ar: "السيرفر",
				en: "Server",
			},
		},
		{
			fields: RULES_FIELDS,
			help: {
				ar: "PVP ولا PVE، الغارات، البناء، وحدود المباني والديناصورات.",
				en: "PVP or PVE, raiding, building, and the limits on structures and dinos.",
			},
			id: "rules",
			layout: BridgeLayout.Form,
			module: "settings",
			restartHint: true,
			target: BridgeFormTarget.Settings,
			title: {
				ar: "قوانين اللعب",
				en: "Play rules",
			},
		},
		{
			fields: RATES_FIELDS,
			help: {
				ar: "الصعوبة والمضاعفات: الخبرة، الترويض، الحصاد، الليل والنهار، والضرر.",
				en: "Difficulty and the multipliers: XP, taming, harvesting, day and night, and damage.",
			},
			id: "rates",
			layout: BridgeLayout.Form,
			module: "settings",
			restartHint: true,
			target: BridgeFormTarget.Settings,
			title: {
				ar: "الصعوبة والمضاعفات",
				en: "Difficulty and rates",
			},
		},
		{
			fields: BREEDING_FIELDS,
			help: {
				ar: "التزاوج وتفقيس البيض وتربية الصغار. هذي الإعدادات في ملف Game.ini.",
				en: "Mating, hatching and raising babies. These live in Game.ini.",
			},
			id: "breeding",
			layout: BridgeLayout.Form,
			module: "settings",
			restartHint: true,
			target: BridgeFormTarget.Settings,
			title: {
				ar: "التزاوج والتربية",
				en: "Breeding",
			},
		},
		{
			fields: CHAT_FIELDS,
			help: {
				ar: "من يسمع مين ومن يقرأ لمين داخل سيرفرك.",
				en: "Who hears whom, and who reads whom, on your server.",
			},
			id: "chat",
			layout: BridgeLayout.Form,
			module: "settings",
			restartHint: true,
			target: BridgeFormTarget.Settings,
			title: {
				ar: "الشات",
				en: "Chat",
			},
		},
	],
	title: {
		ar: "الإعدادات",
		en: "Settings",
	},
};

const launchTab: Bridge.Tab = {
	icon: BridgeIcon.Rocket,
	id: "launch",
	sections: [
		{
			confirm: BridgeConfirm.Normal,
			confirmText: {
				ar: "نعيد تشغيل سيرفرك عشان يشتغل التغيير. عالمك ما يتأثر، وكل ماب لها عالمها الخاص.",
				en: "We restart your server so the change takes effect. Your world is untouched, and every map keeps its own.",
			},
			fields: [
				{
					control: BridgeControl.Select,
					help: {
						ar: "كل ماب لها عالم مستقل، فالتبديل ما يمسح شيء — ترجع للماب القديمة وتلقى كل شيء زي ما تركته.",
						en: "Every map keeps a world of its own, so switching deletes nothing — go back and you find it as you left it.",
					},
					key: MAP_VARIABLE,
					label: {
						ar: "الماب",
						en: "Map",
					},
					options: mapOptions(),
				},
				{
					control: BridgeControl.Text,
					help: {
						ar: "اسم الماب اللي يعطيك إياه المود، ينتهي بـ _WP. ولازم تضيف مود الماب من تبويب المودات كمان.",
						en: "The map name the mod gives you, ending in _WP. The map's mod has to be added from the Mods tab too.",
					},
					key: CUSTOM_MAP_VARIABLE,
					label: {
						ar: "ماب المود",
						en: "Mod map",
					},
					pattern: MAP_ID_PATTERN,
					patternHint: {
						ar: "حروف وأرقام إنجليزية وشرطة سفلية، وينتهي بـ _WP — مثل Svartalfheim_WP.",
						en: "Latin letters, digits and underscores, ending in _WP — Svartalfheim_WP for example.",
					},
					placeholder: "Svartalfheim_WP",
					visibleWhen: {
						values: [
							CUSTOM_MAP_VALUE,
						],
						variable: MAP_VARIABLE,
					},
				},
				{
					control: BridgeControl.Number,
					help: {
						ar: "كل خانة زيادة تاكل رام. خل الرقم قريب من عدد أصحابك الفعلي.",
						en: "Every extra slot eats memory. Keep it close to how many people actually play.",
					},
					key: MAX_PLAYERS_VARIABLE,
					label: {
						ar: "عدد الخانات",
						en: "Player slots",
					},
					max: MAX_PLAYERS_MAX,
					min: MAX_PLAYERS_MIN,
				},
				{
					control: BridgeControl.Boolean,
					help: {
						ar: "يخلي لاعبين الإكس بوكس والبلايستيشن يدخلون معك مو بس PC.",
						en: "Lets Xbox and PlayStation players in beside the PC crowd.",
					},
					key: CROSSPLAY_VARIABLE,
					label: {
						ar: "الكروس بلاي",
						en: "Crossplay",
					},
				},
				{
					control: BridgeControl.Boolean,
					help: {
						ar: "مضاد الغش الرسمي. ما يشتغل مع الطريقة اللي نشغّل فيها آرك، فخلّه مطفي — التبديل موجود لليوم اللي يشتغل فيه.",
						en: "The official anti-cheat. It cannot run the way we run ARK, so leave it off — the toggle is here for the day the engine can run it.",
					},
					key: BATTLEYE_VARIABLE,
					label: {
						ar: "BattlEye",
						en: "BattlEye",
					},
					warning: {
						ar: "BattlEye ما يقدر يشتغل مع الطريقة اللي نشغّل فيها آرك، وتشغيله يمنع اللاعبين من الدخول.",
						en: "BattlEye cannot run the way we run ARK, and switching it on locks players out.",
					},
				},
				{
					control: BridgeControl.Boolean,
					help: {
						ar: "لما يكون مشغّل، ما يدخل إلا اللي في القائمة البيضاء.",
						en: "With this on, only the accounts on the whitelist can enter.",
					},
					key: EXCLUSIVE_JOIN_VARIABLE,
					label: {
						ar: "الدخول الحصري",
						en: "Exclusive join",
					},
				},
			],
			help: {
				ar: "هذي الإعدادات تمشي على سطر التشغيل، فكل تغيير فيها يبي إعادة تشغيل.",
				en: "These ride the launch line, so every change here needs a restart.",
			},
			id: "launch",
			layout: BridgeLayout.Form,
			reinstall: false,
			restartHint: true,
			target: BridgeFormTarget.Variables,
			title: {
				ar: "التشغيل",
				en: "Launch",
			},
		},
	],
	title: {
		ar: "التشغيل",
		en: "Launch",
	},
};

const modsTab: Bridge.Tab = {
	icon: BridgeIcon.Puzzle,
	id: "mods",
	sections: [
		{
			empty: {
				ar: "ما ركّبت أي مود. دوّر على واحد فوق وركّبه، وسيرفرك ينزّله بنفسه أول ما تشغّله بعدها.",
				en: "No mods yet. Find one above and stage it; your server downloads it itself on the next start.",
			},
			help: {
				ar: "إحنا نسجّل رقم المود بس؛ سيرفرك هو اللي ينزّله من CurseForge أول تشغيل بعد التغيير، فأول تشغيل بعد إضافة مودات يطوّل شوي.",
				en: "We only record the mod's id; your server pulls it from CurseForge itself on the next start, so the first boot after adding mods takes longer.",
			},
			id: "catalog",
			layout: BridgeLayout.Catalog,
			module: "mods",
			restartHint: true,
			title: {
				ar: "كتالوج المودات",
				en: "Mod catalog",
			},
		},
		{
			actions: [
				{
					id: "up",
					label: {
						ar: "فوق",
						en: "Up",
					},
				},
				{
					id: "down",
					label: {
						ar: "تحت",
						en: "Down",
					},
				},
				{
					id: "toggle",
					label: {
						ar: "شغّل أو طفّي",
						en: "Enable or disable",
					},
				},
				{
					confirm: BridgeConfirm.Normal,
					confirmText: {
						ar: "نشيله من القائمة، وأي شيء بناه اللاعبين من هذا المود يختفي من عالمك.",
						en: "We drop it from the list, and anything your players built with it disappears from your world.",
					},
					id: "remove",
					label: {
						ar: "حذف",
						en: "Remove",
					},
				},
			],
			add: {
				label: {
					ar: "أضف مود برقمه",
					en: "Add a mod by its id",
				},
				placeholder: "928437",
			},
			columns: [
				{
					key: "order",
					label: {
						ar: "الترتيب",
						en: "Order",
					},
				},
				{
					key: "title",
					label: {
						ar: "المود",
						en: "Mod",
					},
				},
				{
					key: "projectId",
					label: {
						ar: "الرقم",
						en: "Id",
					},
				},
				{
					key: "state",
					label: {
						ar: "الحالة",
						en: "State",
					},
				},
			],
			empty: {
				ar: "القائمة فاضية. حط رقم المود هنا لو ما لقيته في الكتالوج.",
				en: "The list is empty. Paste a mod id here if you could not find it in the catalog.",
			},
			help: {
				ar: "الترتيب مهم: المود اللي فوق يحمّل أول، وماب المود لازم تكون فوق أي مود يعدّل عليها.",
				en: "Order matters: the mod on top loads first, and a map mod belongs above anything that changes it.",
			},
			id: "order",
			layout: BridgeLayout.Table,
			module: "modOrder",
			restartHint: true,
			title: {
				ar: "ترتيب التحميل",
				en: "Load order",
			},
		},
	],
	title: {
		ar: "المودات",
		en: "Mods",
	},
};

const playersTab: Bridge.Tab = {
	icon: BridgeIcon.Users,
	id: "players",
	sections: [
		{
			actions: [
				{
					confirm: BridgeConfirm.Normal,
					id: "kick",
					label: {
						ar: "طرد",
						en: "Kick",
					},
				},
				{
					confirm: BridgeConfirm.Strong,
					confirmText: {
						ar: "الحظر يمنع الحساب من الدخول إلى أن تفكه من جدول المحظورين في نفس الصفحة.",
						en: "A ban keeps the account out until you lift it from the Bans table on this same page.",
					},
					id: "ban",
					label: {
						ar: "حظر",
						en: "Ban",
					},
					offline: true,
				},
			],
			columns: [
				{
					key: "name",
					label: {
						ar: "اللاعب",
						en: "Player",
					},
				},
				{
					key: "eosId",
					label: {
						ar: "رقم الحساب",
						en: "Account id",
					},
				},
			],
			empty: {
				ar: "ما فيه أحد داخل الحين.",
				en: "Nobody is online right now.",
			},
			id: "online",
			layout: BridgeLayout.Table,
			module: "players",
			place: BridgePlace.Players,
			title: {
				ar: "داخلين الحين",
				en: "Online now",
			},
		},
		{
			actions: [
				{
					confirm: BridgeConfirm.Normal,
					id: "remove",
					label: {
						ar: "فك الحظر",
						en: "Unban",
					},
				},
			],
			add: {
				label: {
					ar: "احظر حساب",
					en: "Ban an account",
				},
				placeholder: "0002a1b3c4d5e6f708192a3b4c5d6e7f",
			},
			columns: [
				{
					key: "eosId",
					label: {
						ar: "رقم الحساب",
						en: "Account id",
					},
				},
			],
			empty: {
				ar: "ما فيه أحد محظور.",
				en: "Nobody is banned.",
			},
			help: {
				ar: "الحظر برقم الحساب، وتلقاه في جدول اللاعبين فوق. لو سيرفرك شغّال يمشي على طول.",
				en: "Bans go by account id, and the players table above has it. With your server up it lands right away.",
			},
			id: "bans",
			layout: BridgeLayout.Table,
			module: "bans",
			place: BridgePlace.Players,
			title: {
				ar: "المحظورين",
				en: "Bans",
			},
		},
		{
			actions: [
				{
					confirm: BridgeConfirm.Normal,
					id: "remove",
					label: {
						ar: "شيله",
						en: "Remove",
					},
				},
			],
			add: {
				label: {
					ar: "أضف أدمن",
					en: "Add an admin",
				},
				placeholder: "0002a1b3c4d5e6f708192a3b4c5d6e7f",
			},
			columns: [
				{
					key: "eosId",
					label: {
						ar: "رقم الحساب",
						en: "Account id",
					},
				},
			],
			empty: {
				ar: "ما فيه أدمنية هنا. أي أحد يقدر يصير أدمن بكلمة المرور من تبويب التحكم.",
				en: "No admins here. Anyone can still become admin with the password from the Controls tab.",
			},
			help: {
				ar: "الحسابات هذي تصير أدمن بدون ما تكتب كلمة المرور، وسيرفرك يقرأ القائمة عند التشغيل.",
				en: "These accounts become admin without typing the password, and your server reads the list when it starts.",
			},
			id: "admins",
			layout: BridgeLayout.Table,
			module: "admins",
			place: BridgePlace.Players,
			restartHint: true,
			title: {
				ar: "الأدمنية",
				en: "Admins",
			},
		},
		{
			actions: [
				{
					confirm: BridgeConfirm.Normal,
					id: "remove",
					label: {
						ar: "شيله",
						en: "Remove",
					},
				},
			],
			add: {
				label: {
					ar: "أضف حساب",
					en: "Add an account",
				},
				placeholder: "0002a1b3c4d5e6f708192a3b4c5d6e7f",
			},
			columns: [
				{
					key: "eosId",
					label: {
						ar: "رقم الحساب",
						en: "Account id",
					},
				},
			],
			empty: {
				ar: "القائمة فاضية.",
				en: "The list is empty.",
			},
			help: {
				ar: "ما تشتغل إلا لما تفتح الدخول الحصري من تبويب التشغيل؛ بدونه أي أحد يدخل.",
				en: "It only bites once exclusive join is on in the Launch tab; without it anyone can enter.",
			},
			id: "whitelist",
			layout: BridgeLayout.Table,
			module: "whitelist",
			place: BridgePlace.Players,
			restartHint: true,
			title: {
				ar: "القائمة البيضاء",
				en: "Whitelist",
			},
		},
	],
	title: {
		ar: "اللاعبين",
		en: "Players",
	},
};

const controlsTab: Bridge.Tab = {
	icon: BridgeIcon.Command,
	id: "controls",
	sections: [
		{
			id: "metrics",
			layout: BridgeLayout.Detail,
			module: "metrics",
			place: BridgePlace.Overview,
			title: {
				ar: "حالة السيرفر",
				en: "Server health",
			},
		},
		{
			actions: [
				{
					fields: [
						{
							control: BridgeControl.Text,
							help: {
								ar: "توصل لكل اللي داخلين الحين.",
								en: "Reaches everyone on the server right now.",
							},
							key: MESSAGE_ARGUMENT,
							label: {
								ar: "الرسالة",
								en: "Message",
							},
							maxLength: ANNOUNCE_MESSAGE_LENGTH,
						},
					],
					id: "announce",
					label: {
						ar: "رسالة للاعبين",
						en: "Message the players",
					},
				},
				{
					id: "save",
					label: {
						ar: "احفظ العالم الحين",
						en: "Save the world now",
					},
				},
				{
					confirm: BridgeConfirm.Strong,
					confirmText: {
						ar: "نمسح كل الديناصورات البرية عشان تنزل من جديد. المروّضة ما تنمس، بس أي ديناصور بري كنت تراقبه بيروح.",
						en: "We clear every wild dino so the map respawns them. Tamed dinos are safe, but any wild one you had your eye on is gone.",
					},
					id: "destroyWildDinos",
					label: {
						ar: "رجّع الديناصورات البرية",
						en: "Respawn the wild dinos",
					},
				},
			],
			help: {
				ar: "تشتغل على طول على سيرفرك الشغّال.",
				en: "These run on your live server right away.",
			},
			id: "live",
			layout: BridgeLayout.Actions,
			module: "live",
			title: {
				ar: "تحكم مباشر",
				en: "Live controls",
			},
		},
		{
			actions: [
				{
					confirm: BridgeConfirm.Strong,
					confirmText: {
						ar: "الكلمة الجديدة تشتغل بعد إعادة التشغيل، والقديمة تبطل ساعتها. وهي نفسها كلمة مرور RCON.",
						en: "The new password goes live on the next restart and the old one stops working then. It is the RCON password too.",
					},
					id: "rotateAdmin",
					label: {
						ar: "غيّر كلمة مرور الأدمن",
						en: "Rotate the admin password",
					},
				},
			],
			empty: {
				ar: "لسا ما جهزت كلمة المرور. شغّل سيرفرك مرة وحدة.",
				en: "The password is not ready yet. Start your server once.",
			},
			id: "admin",
			layout: BridgeLayout.Detail,
			module: "admin",
			title: {
				ar: "صلاحيات الأدمن",
				en: "Admin access",
			},
		},
		{
			actions: [
				{
					confirm: BridgeConfirm.Strong,
					confirmText: {
						ar: "نمسح عالم الماب هذي كامل — الشخصيات والمباني والديناصورات. ما فيه رجعة إلا من نسخة احتياطية.",
						en: "We erase this map's whole world — characters, buildings and dinos. Nothing comes back except from a backup.",
					},
					id: "wipe",
					label: {
						ar: "امسح العالم",
						en: "Wipe the world",
					},
				},
			],
			columns: [
				{
					key: "map",
					label: {
						ar: "الماب",
						en: "Map",
					},
				},
				{
					key: "id",
					label: {
						ar: "اسم الملف",
						en: "Folder",
					},
				},
				{
					key: "size",
					label: {
						ar: "الحجم",
						en: "Size",
					},
				},
				{
					key: "active",
					label: {
						ar: "الشغّالة",
						en: "Active",
					},
				},
			],
			empty: {
				ar: "ما فيه عوالم محفوظة بعد. شغّل سيرفرك مرة وحدة.",
				en: "No worlds saved yet. Start your server once.",
			},
			help: {
				ar: "كل ماب لعبت عليها لها مجلد هنا. المسح ما يشتغل إلا والسيرفر واقف، وخذ نسخة احتياطية قبل.",
				en: "Every map you have played on has a folder here. A wipe only runs while the server is stopped, and a backup first is the safe move.",
			},
			id: "saves",
			layout: BridgeLayout.Table,
			module: "saves",
			title: {
				ar: "عوالمك المحفوظة",
				en: "Your saved worlds",
			},
		},
		...rconAccessSections(),
	],
	title: {
		ar: "التحكم",
		en: "Controls",
	},
};

export const panel: Bridge.Panel = {
	tabs: [
		settingsTab,
		launchTab,
		modsTab,
		playersTab,
		controlsTab,
	],
};
