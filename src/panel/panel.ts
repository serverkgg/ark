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
				ar: "اسم سيرفرك وكلمة مروره ورسالة اليوم، وبعض التفاصيل عن طريقة اللعب.",
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
				ar: "PVP أو PVE، والغارات، والبناء، وحدود المباني والديناصورات.",
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
				ar: "الصعوبة والمضاعفات: الخبرة، والترويض، والحصاد، والليل والنهار، والضرر.",
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
				ar: "التزاوج وتفقيس البيض وتربية الصغار. هذه الإعدادات في ملف Game.ini.",
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
				ar: "من يسمع من، ومن يقرأ رسائل من، داخل سيرفرك.",
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
				ar: "ننفّذ ريستارت لسيرفرك ليُطبَّق التغيير. لا يتأثر حفظك، فلكل ماب حفظه الخاص.",
				en: "We restart your server so the change takes effect. Your save is untouched, and every map keeps its own.",
			},
			fields: [
				{
					control: BridgeControl.Select,
					help: {
						ar: "لكل ماب حفظ مستقل، فالتبديل لا يحذف شيئًا. ارجع إلى الماب القديم وستجد كل شيء كما تركته.",
						en: "Every map keeps a save of its own, so switching deletes nothing. Go back and you find it as you left it.",
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
						ar: "اسم الماب الذي يعطيك إياه المود، وينتهي بـ _WP. ويلزم أيضًا إضافة مود الماب من تبويب المودات.",
						en: "The map name the mod gives you, ending in _WP. The map's mod has to be added from the Mods tab too.",
					},
					key: CUSTOM_MAP_VARIABLE,
					label: {
						ar: "ماب المود",
						en: "Mod map",
					},
					pattern: MAP_ID_PATTERN,
					patternHint: {
						ar: "حروف وأرقام إنجليزية وشرطة سفلية، وينتهي بـ _WP، مثل Svartalfheim_WP.",
						en: "Latin letters, digits and underscores, ending in _WP, for example Svartalfheim_WP.",
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
						ar: "كل خانة إضافية تستهلك من الرام. اجعل الرقم قريبًا من عدد أصحابك الفعلي.",
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
						ar: "يسمح للاعبي Xbox و PlayStation بالدخول معك، وليس لاعبي PC فقط.",
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
						ar: "مضاد الغش الرسمي. لا يشتغل بالطريقة التي نشغّل بها آرك، فأبقِه موقوفًا. الخيار موجود لليوم الذي يصبح فيه تشغيله ممكنًا.",
						en: "The official anti-cheat. It can't run the way we run ARK, so leave it off. The toggle is here for the day the engine can run it.",
					},
					key: BATTLEYE_VARIABLE,
					label: {
						ar: "BattlEye",
						en: "BattlEye",
					},
					warning: {
						ar: "لا يشتغل BattlEye بالطريقة التي نشغّل بها آرك، وتفعيله يمنع اللاعبين من الدخول.",
						en: "BattlEye can't run the way we run ARK, and switching it on locks players out.",
					},
				},
				{
					control: BridgeControl.Boolean,
					help: {
						ar: "عند تفعيله، لا يدخل إلا من في القائمة البيضاء.",
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
				ar: "هذه الإعدادات جزء من سطر التشغيل، فيُطبَّق أي تغيير فيها بعد الريستارت.",
				en: "These are part of the launch line, so every change here needs a restart.",
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
				ar: "لم تثبّت أي مود بعد. ابحث عن مود في الأعلى وثبّته، وسينزّله سيرفرك بنفسه في التشغيل التالي.",
				en: "No mods yet. Find one above and install it, and your server downloads it itself on the next start.",
			},
			help: {
				ar: "نسجّل رقم المود فقط، وسيرفرك هو الذي ينزّله من CurseForge في أول تشغيل بعد التغيير، لذلك يستغرق أول تشغيل بعد إضافة مودات وقتًا أطول. وتحفظ النسخة الاحتياطية القائمة وليس ملفات المودات، فعند استرجاع نسخة ينزّلها سيرفرك من جديد في أول تشغيل، والريسيت يحذف القائمة كلها.",
				en: "We only record the mod's ID. Your server pulls it from CurseForge itself on the next start, so the first boot after adding mods takes longer. A backup keeps that list rather than the mod files, so restoring one has your server download them again on its first start, and a reset clears the list.",
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
						ar: "للأعلى",
						en: "Up",
					},
				},
				{
					id: "down",
					label: {
						ar: "للأسفل",
						en: "Down",
					},
				},
				{
					id: "toggle",
					label: {
						ar: "فعّل أو أوقف",
						en: "Enable or disable",
					},
				},
				{
					confirm: BridgeConfirm.Normal,
					confirmText: {
						ar: "سنزيله من القائمة، وسيختفي من مابك كل ما بناه اللاعبون بهذا المود.",
						en: "We drop it from the list, and anything your players built with it disappears from your map.",
					},
					id: "remove",
					label: {
						ar: "أزل",
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
				ar: "القائمة فارغة. ضع رقم المود هنا إذا لم تجده في الكتالوج.",
				en: "The list is empty. Paste a mod ID here if you couldn't find it in the catalog.",
			},
			help: {
				ar: "الترتيب مهم: المود الذي في الأعلى يُحمَّل أولًا، ويلزم أن يكون مود الماب فوق أي مود يعدّل عليه.",
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
						ar: "اطرد",
						en: "Kick",
					},
				},
				{
					confirm: BridgeConfirm.Normal,
					confirmText: {
						ar: "يمنع الحظر الحساب من الدخول حتى تفك الحظر من جدول المحظورين في الصفحة نفسها.",
						en: "A ban keeps the account out until you unban it from the Bans table on this same page.",
					},
					id: "ban",
					label: {
						ar: "احظر",
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
						ar: "معرّف اللاعب",
						en: "Account id",
					},
				},
			],
			empty: {
				ar: "لا يوجد لاعبون متصلون الآن.",
				en: "Nobody is online right now.",
			},
			help: {
				ar: "تتحدث القائمة كل 15 ثانية أثناء تشغيل سيرفرك، ومنها تطرد أي لاعب أو تحظره.",
				en: "The list refreshes every 15 seconds while your server is up, and you kick or ban any player from it.",
			},
			id: "online",
			layout: BridgeLayout.Table,
			module: "players",
			place: BridgePlace.Players,
			title: {
				ar: "المتصلون الآن",
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
					ar: "احظر حسابًا",
					en: "Ban an account",
				},
				placeholder: "0002a1b3c4d5e6f708192a3b4c5d6e7f",
			},
			columns: [
				{
					key: "eosId",
					label: {
						ar: "معرّف اللاعب",
						en: "Account id",
					},
				},
			],
			empty: {
				ar: "لا يوجد لاعبون محظورون.",
				en: "Nobody is banned.",
			},
			help: {
				ar: "الحظر يكون بمعرّف اللاعب، وتجده في جدول اللاعبين في الأعلى. وإذا كان سيرفرك شغّالًا يُطبَّق فورًا.",
				en: "Bans go by account ID, and the players table above has it. With your server up, the ban applies right away.",
			},
			id: "bans",
			layout: BridgeLayout.Table,
			module: "bans",
			place: BridgePlace.Players,
			title: {
				ar: "المحظورون",
				en: "Banned players",
			},
		},
		{
			actions: [
				{
					confirm: BridgeConfirm.Normal,
					id: "remove",
					label: {
						ar: "أزله",
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
						ar: "معرّف اللاعب",
						en: "Account id",
					},
				},
			],
			empty: {
				ar: "لا يوجد أدمن هنا بعد. ويستطيع أي شخص أن يصبح أدمن بكلمة المرور الموجودة في تبويب التحكم.",
				en: "No admins here. Anyone can still become admin with the password from the Controls tab.",
			},
			help: {
				ar: "تصبح هذه الحسابات أدمن دون كتابة كلمة المرور، ويقرأ سيرفرك القائمة عند التشغيل.",
				en: "These accounts become admin without typing the password, and your server reads the list when it starts.",
			},
			id: "admins",
			layout: BridgeLayout.Table,
			module: "admins",
			place: BridgePlace.Players,
			restartHint: true,
			title: {
				ar: "الأدمن",
				en: "Admins",
			},
		},
		{
			actions: [
				{
					confirm: BridgeConfirm.Normal,
					id: "remove",
					label: {
						ar: "أزله",
						en: "Remove",
					},
				},
			],
			add: {
				label: {
					ar: "أضف حسابًا",
					en: "Add an account",
				},
				placeholder: "0002a1b3c4d5e6f708192a3b4c5d6e7f",
			},
			columns: [
				{
					key: "eosId",
					label: {
						ar: "معرّف اللاعب",
						en: "Account id",
					},
				},
			],
			empty: {
				ar: "القائمة فارغة.",
				en: "The list is empty.",
			},
			help: {
				ar: "لا تُطبَّق إلا بعد تفعيل الدخول الحصري من تبويب التشغيل، ومن دونه يستطيع أي شخص الدخول.",
				en: "It only applies once exclusive join is on in the Launch tab. Without it, anyone can enter.",
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
		ar: "اللاعبون",
		en: "Players",
	},
};

const controlsTab: Bridge.Tab = {
	icon: BridgeIcon.Command,
	id: "controls",
	sections: [
		{
			help: {
				ar: "اللاعبون والماب والمودات وبيلد اللعبة في نظرة واحدة، وتتحدث كل 15 ثانية.",
				en: "Players, map, mods and game build at a glance, refreshed every 15 seconds.",
			},
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
								ar: "تصل إلى كل اللاعبين المتصلين الآن.",
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
						ar: "احفظ الماب الآن",
						en: "Save the map now",
					},
				},
				{
					confirm: BridgeConfirm.Normal,
					confirmText: {
						ar: "سنحذف كل الديناصورات البرية لتظهر من جديد. لا تتأثر الديناصورات المروّضة، لكن أي ديناصور بري كنت تراقبه سيختفي.",
						en: "We clear every wild dino so the map respawns them. Tamed dinos are safe, but any wild one you had your eye on is gone.",
					},
					id: "destroyWildDinos",
					label: {
						ar: "أعد ظهور الديناصورات البرية",
						en: "Respawn the wild dinos",
					},
				},
			],
			help: {
				ar: "تُنفَّذ فورًا على سيرفرك الشغّال.",
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
					confirm: BridgeConfirm.Normal,
					confirmText: {
						ar: "تُطبَّق كلمة المرور الجديدة بعد الريستارت، وتتوقف القديمة في الوقت نفسه. وهي نفسها كلمة مرور RCON.",
						en: "The new password goes live on the next restart and the old one stops working then. It's the RCON password too.",
					},
					id: "rotateAdmin",
					label: {
						ar: "غيّر كلمة مرور الأدمن",
						en: "Rotate the admin password",
					},
				},
			],
			empty: {
				ar: "كلمة المرور غير جاهزة بعد. شغّل سيرفرك مرة واحدة.",
				en: "The password isn't ready yet. Start your server once.",
			},
			help: {
				ar: "لا تعطها إلا لمن تثق به: فهي تجعل أي شخص أدمن داخل اللعبة، وتفتح له RCON عند تفعيل الوصول عن بُعد.",
				en: "Share it only with people you trust: it makes anyone admin in game, and opens RCON to them once remote access is on.",
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
						ar: "سيتم حذف حفظ هذا الماب كاملًا، بما فيه الشخصيات والمباني والديناصورات. نأخذ نسخة احتياطية قبل الحذف، ومنها تسترجع الماب إذا غيّرت رأيك.",
						en: "We erase this map's whole save, including characters, buildings and dinos. We take a backup first, so you can restore the map if you change your mind.",
					},
					id: "wipe",
					label: {
						ar: "اعمل وايب للماب",
						en: "Wipe the map",
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
						ar: "الشغّال",
						en: "Active",
					},
				},
			],
			empty: {
				ar: "لا توجد مابات محفوظة بعد. شغّل سيرفرك مرة واحدة.",
				en: "No map saves yet. Start your server once.",
			},
			help: {
				ar: "لكل ماب لعبت عليه مجلد هنا. لا يُنفَّذ الوايب إلا والسيرفر متوقف، وخذ نسخة احتياطية قبله.",
				en: "Every map you've played on has a folder here. A wipe only runs while the server is stopped, so take a backup first.",
			},
			id: "saves",
			layout: BridgeLayout.Table,
			module: "saves",
			title: {
				ar: "ماباتك المحفوظة",
				en: "Your saved maps",
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
