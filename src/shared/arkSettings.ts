import { type Bridge, BridgeControl, BridgeUserError } from "@serverkgg/bridge";
import {
	GAME_FILE,
	GAME_USER_SETTINGS_FILE,
	MESSAGE_OF_THE_DAY_SECTION,
	MOTD_MAX,
	PASSWORD_MAX,
	SERVER_SETTINGS_SECTION,
	SESSION_NAME_MAX,
	SESSION_SETTINGS_SECTION,
	SHOOTER_GAME_MODE_SECTION,
} from "./arkApp";
import { type ArkSettingPatch, sectionKey } from "./arkSettingsPending";

export enum ArkSettingKind {
	Boolean = "boolean",
	Number = "number",
	Secret = "secret",
	Text = "text",
}

export enum ArkSettingGroup {
	Breeding = "breeding",
	Chat = "chat",
	Rates = "rates",
	Rules = "rules",
	Server = "server",
}

export interface ArkSetting {
	key: string;
	file: string;
	section: string;
	kind: ArkSettingKind;
	group: ArkSettingGroup;
	fallback: string;
	label: Bridge.Text;
	help?: Bridge.Text;
	warning?: Bridge.Text;
	min?: number;
	max?: number;
	step?: number;
	maxLength?: number;
	pattern?: string;
	patternHint?: Bridge.Text;
}

type ArkSettingSpec = Omit<ArkSetting, "file" | "group" | "section">;

type ArkPlacedSetting = Omit<ArkSetting, "group">;

export const SESSION_NAME_PATTERN = "^[^?]+$";

const MULTIPLIER_STEP = 0.1;

const inServerSettings = (spec: ArkSettingSpec): ArkPlacedSetting => {
	return {
		...spec,
		file: GAME_USER_SETTINGS_FILE,
		section: SERVER_SETTINGS_SECTION,
	};
};

const inSessionSettings = (spec: ArkSettingSpec): ArkPlacedSetting => {
	return {
		...spec,
		file: GAME_USER_SETTINGS_FILE,
		section: SESSION_SETTINGS_SECTION,
	};
};

const inMessageOfTheDay = (spec: ArkSettingSpec): ArkPlacedSetting => {
	return {
		...spec,
		file: GAME_USER_SETTINGS_FILE,
		section: MESSAGE_OF_THE_DAY_SECTION,
	};
};

const inGameMode = (spec: ArkSettingSpec): ArkPlacedSetting => {
	return {
		...spec,
		file: GAME_FILE,
		section: SHOOTER_GAME_MODE_SECTION,
	};
};

const grouped = (group: ArkSettingGroup, settings: ArkPlacedSetting[]): ArkSetting[] => {
	return settings.map((setting) => {
		return {
			...setting,
			group,
		};
	});
};

const multiplier = (spec: Omit<ArkSettingSpec, "fallback" | "kind" | "min" | "step">): ArkSettingSpec => {
	return {
		...spec,
		fallback: "1.0",
		kind: ArkSettingKind.Number,
		min: 0,
		step: MULTIPLIER_STEP,
	};
};

export const SERVER_SETTINGS_GROUP = grouped(ArkSettingGroup.Server, [
	inSessionSettings({
		help: {
			ar: "الاسم اللي يشوفونه اللاعبين في قائمة Unofficial. علامة الاستفهام تكسر سطر التشغيل، فما نقبلها.",
			en: "The name players see under Unofficial. A question mark breaks the launch line, so it is not allowed.",
		},
		key: "SessionName",
		kind: ArkSettingKind.Text,
		label: {
			ar: "اسم السيرفر",
			en: "Server name",
		},
		maxLength: SESSION_NAME_MAX,
		pattern: SESSION_NAME_PATTERN,
		patternHint: {
			ar: "اكتب اسم مو فاضي وما فيه علامة استفهام.",
			en: "Write a name that is not empty and has no question mark in it.",
		},
		fallback: "",
	}),
	inServerSettings({
		fallback: "",
		help: {
			ar: "خلها فاضية عشان سيرفرك يكون مفتوح للكل.",
			en: "Leave it empty to keep your server open to everyone.",
		},
		key: "ServerPassword",
		kind: ArkSettingKind.Secret,
		label: {
			ar: "كلمة مرور الدخول",
			en: "Join password",
		},
		maxLength: PASSWORD_MAX,
	}),
	inMessageOfTheDay({
		fallback: "",
		help: {
			ar: "تطلع لكل لاعب أول ما يدخل سيرفرك.",
			en: "Shown to every player the moment they join.",
		},
		key: "Message",
		kind: ArkSettingKind.Text,
		label: {
			ar: "رسالة اليوم",
			en: "Message of the day",
		},
		maxLength: MOTD_MAX,
	}),
	inMessageOfTheDay({
		fallback: "20",
		help: {
			ar: "بالثواني — كم تجلس الرسالة على شاشة اللاعب.",
			en: "In seconds — how long the message sits on the player's screen.",
		},
		key: "Duration",
		kind: ArkSettingKind.Number,
		label: {
			ar: "مدة الرسالة",
			en: "Message duration",
		},
		max: 300,
		min: 0,
		step: 1,
	}),
	inServerSettings({
		fallback: "3600",
		help: {
			ar: "بالثواني. اللاعب اللي ما تحرك هالمدة يطلع لحاله. 0 يوقف الطرد.",
			en: "In seconds. A player who has not moved for that long is dropped. 0 turns it off.",
		},
		key: "KickIdlePlayersPeriod",
		kind: ArkSettingKind.Number,
		label: {
			ar: "طرد الواقف بلا حركة",
			en: "Kick idle players after",
		},
		max: 86_400,
		min: 0,
		step: 60,
	}),
	inServerSettings({
		fallback: "15",
		help: {
			ar: "بالدقايق. كل ما قرّبته صار عالمك أأمن، بس تحس بتقطيع بسيط كل حفظة.",
			en: "In minutes. Shorter keeps your world safer, at the cost of a small stutter on every save.",
		},
		key: "AutoSavePeriodMinutes",
		kind: ArkSettingKind.Number,
		label: {
			ar: "الحفظ التلقائي كل",
			en: "Auto save every",
		},
		max: 240,
		min: 1,
		step: 1,
	}),
	inServerSettings({
		fallback: "False",
		key: "AlwaysNotifyPlayerJoined",
		kind: ArkSettingKind.Boolean,
		label: {
			ar: "إشعار دخول اللاعبين",
			en: "Announce joins",
		},
	}),
	inServerSettings({
		fallback: "False",
		key: "AlwaysNotifyPlayerLeft",
		kind: ArkSettingKind.Boolean,
		label: {
			ar: "إشعار خروج اللاعبين",
			en: "Announce leaves",
		},
	}),
	inServerSettings({
		fallback: "True",
		key: "ServerCrosshair",
		kind: ArkSettingKind.Boolean,
		label: {
			ar: "علامة التصويب",
			en: "Crosshair",
		},
	}),
	inServerSettings({
		fallback: "True",
		key: "AllowThirdPersonPlayer",
		kind: ArkSettingKind.Boolean,
		label: {
			ar: "منظور الشخص الثالث",
			en: "Third person view",
		},
	}),
	inServerSettings({
		fallback: "True",
		help: {
			ar: "يبيّن مكان اللاعب على المابين الكبيرة والصغيرة.",
			en: "Shows the player where they are on the map and the minimap.",
		},
		key: "ShowMapPlayerLocation",
		kind: ArkSettingKind.Boolean,
		label: {
			ar: "موقع اللاعب على الماب",
			en: "Show the player's location",
		},
	}),
	inServerSettings({
		fallback: "False",
		help: {
			ar: "يشيل الواجهة كلها عن اللاعبين — للسيرفرات اللي تبي جو واقعي.",
			en: "Strips the whole HUD from your players — for servers that want it raw.",
		},
		key: "ServerForceNoHUD",
		kind: ArkSettingKind.Boolean,
		label: {
			ar: "إخفاء واجهة اللعب",
			en: "Hide the HUD",
		},
	}),
]);

export const RULES_SETTINGS_GROUP = grouped(ArkSettingGroup.Rules, [
	inServerSettings({
		fallback: "False",
		help: {
			ar: "من هنا تقرر شكل سيرفرك: القتال، الغارات، والبناء. مع PVE ما يقدر اللاعبين يضربون بعض.",
			en: "This is where you shape your server: combat, raiding and building. With PVE on, players cannot hurt each other.",
		},
		key: "ServerPVE",
		kind: ArkSettingKind.Boolean,
		label: {
			ar: "سيرفر PVE",
			en: "PVE server",
		},
	}),
	inServerSettings({
		fallback: "False",
		help: {
			ar: "قاعدة اللاعب ما تنهجم وهو مو داخل.",
			en: "A player's base cannot be raided while they are offline.",
		},
		key: "PreventOfflinePvP",
		kind: ArkSettingKind.Boolean,
		label: {
			ar: "حماية اللي مو داخل",
			en: "Offline raid protection",
		},
	}),
	inServerSettings({
		fallback: "False",
		key: "ServerHardcore",
		kind: ArkSettingKind.Boolean,
		label: {
			ar: "الهاردكور",
			en: "Hardcore",
		},
		warning: {
			ar: "في الهاردكور، موت اللاعب يرجّعه للمستوى 1 من جديد.",
			en: "In hardcore, death sends the player all the way back to level 1.",
		},
	}),
	inServerSettings({
		fallback: "False",
		help: {
			ar: "يخلي الديناصورات الطيّارة تشيل اللاعبين والديناصورات في سيرفر PVE.",
			en: "Lets flyers pick up players and dinos on a PVE server.",
		},
		key: "AllowFlyerCarryPvE",
		kind: ArkSettingKind.Boolean,
		label: {
			ar: "الديناصورات الطيّارة تشيل في PVE",
			en: "Flyers carry in PVE",
		},
	}),
	inServerSettings({
		fallback: "False",
		key: "AllowCaveBuildingPvE",
		kind: ArkSettingKind.Boolean,
		label: {
			ar: "البناء في الكهوف بـ PVE",
			en: "Cave building in PVE",
		},
	}),
	inServerSettings({
		fallback: "False",
		help: {
			ar: "يخلي التيتانوصور وأمثاله يبقى معك بعد الترويض بدل ما يروح.",
			en: "Lets a Titanosaur and its kind stay with you after taming instead of walking off.",
		},
		key: "AllowRaidDinoFeeding",
		kind: ArkSettingKind.Boolean,
		label: {
			ar: "تغذية ديناصورات الغارات",
			en: "Raid dino feeding",
		},
	}),
	inServerSettings({
		fallback: "False",
		help: {
			ar: "مبانيك تبقى مكانها حتى لو ما دخلت مدة طويلة.",
			en: "Your builds stay put even after a long time away.",
		},
		key: "DisableStructureDecayPvE",
		kind: ArkSettingKind.Boolean,
		label: {
			ar: "إيقاف تهالك المباني في PVE",
			en: "No structure decay in PVE",
		},
	}),
	inServerSettings(
		multiplier({
			help: {
				ar: "كل ما نقّصته، تهالكت المباني المتروكة أسرع.",
				en: "Lower it and abandoned builds fall apart sooner.",
			},
			key: "PvEStructureDecayPeriodMultiplier",
			label: {
				ar: "مضاعف تهالك المباني",
				en: "Structure decay multiplier",
			},
		}),
	),
	inServerSettings({
		fallback: "10500",
		key: "TheMaxStructuresInRange",
		kind: ArkSettingKind.Number,
		label: {
			ar: "حد المباني في المنطقة",
			en: "Structure limit in one area",
		},
		max: 60_000,
		min: 100,
		step: 100,
		warning: {
			ar: "كل ما كبّرت الرقم، زاد اللي تاكله الرام وصار اللاق أقرب.",
			en: "A bigger number eats more memory and brings lag closer.",
		},
	}),
	inServerSettings({
		fallback: "5000",
		key: "MaxTamedDinos",
		kind: ArkSettingKind.Number,
		label: {
			ar: "حد الديناصورات المروّضة",
			en: "Tamed dino limit",
		},
		max: 20_000,
		min: 50,
		step: 50,
		warning: {
			ar: "كل ما كبّرت الرقم، زاد اللي تاكله الرام وصار اللاق أقرب.",
			en: "A bigger number eats more memory and brings lag closer.",
		},
	}),
	inServerSettings({
		fallback: "False",
		help: {
			ar: "يمنع ديناصور واحد من كنس موارد الماب بضربة وحدة.",
			en: "Stops one dino from clearing the map's resources in a single hit.",
		},
		key: "ClampResourceHarvestDamage",
		kind: ArkSettingKind.Boolean,
		label: {
			ar: "تحديد ضرر الحصاد",
			en: "Clamp harvest damage",
		},
	}),
	inGameMode({
		fallback: "False",
		help: {
			ar: "أعضاء القبيلة ما يأذون بعض في سيرفر PVE.",
			en: "Tribe members cannot hurt each other on a PVE server.",
		},
		key: "bPvEDisableFriendlyFire",
		kind: ArkSettingKind.Boolean,
		label: {
			ar: "إيقاف ضرر القبيلة في PVE",
			en: "No tribe friendly fire in PVE",
		},
	}),
	inGameMode({
		fallback: "False",
		help: {
			ar: "يخلي المباني تنحط فوق الصخور والأرض المايلة بدون ما ترفض.",
			en: "Lets structures snap onto rocks and uneven ground instead of being refused.",
		},
		key: "bDisableStructurePlacementCollision",
		kind: ArkSettingKind.Boolean,
		label: {
			ar: "البناء بدون تصادم",
			en: "Build through the terrain",
		},
	}),
	inGameMode({
		fallback: "False",
		help: {
			ar: "اللاعب يعيد توزيع نقاطه كم ما يبي.",
			en: "A player can redistribute their stat points as often as they like.",
		},
		key: "bAllowUnlimitedRespecs",
		kind: ArkSettingKind.Boolean,
		label: {
			ar: "إعادة توزيع النقاط بلا حد",
			en: "Unlimited respecs",
		},
	}),
	inGameMode({
		fallback: "0",
		help: {
			ar: "0 يعني بدون حد.",
			en: "0 means no limit.",
		},
		key: "MaxNumberOfPlayersInTribe",
		kind: ArkSettingKind.Number,
		label: {
			ar: "حد أعضاء القبيلة",
			en: "Tribe member limit",
		},
		max: 200,
		min: 0,
		step: 1,
	}),
]);

export const RATES_SETTINGS_GROUP = grouped(ArkSettingGroup.Rates, [
	inServerSettings({
		fallback: "1.0",
		help: {
			ar: "هو والصعوبة الرسمية تحت يقررون أعلى مستوى تطلع فيه الديناصورات البرية.",
			en: "Together with the official difficulty below, this decides how high wild dinos spawn.",
		},
		key: "DifficultyOffset",
		kind: ArkSettingKind.Number,
		label: {
			ar: "مضاعف الصعوبة",
			en: "Difficulty offset",
		},
		max: 1,
		min: 0,
		step: 0.01,
	}),
	inServerSettings({
		fallback: "5.0",
		help: {
			ar: "5 يعطيك ديناصورات إلى المستوى 150، و10 إلى 300.",
			en: "5 gives you wild dinos up to level 150, 10 up to level 300.",
		},
		key: "OverrideOfficialDifficulty",
		kind: ArkSettingKind.Number,
		label: {
			ar: "تجاوز الصعوبة الرسمية",
			en: "Override official difficulty",
		},
		max: 20,
		min: 1,
		step: 0.5,
	}),
	inServerSettings(
		multiplier({
			help: {
				ar: "كل المضاعفات هنا تقرأ بنفس الطريقة: 1 هو الطبيعي، وكل ما كبّرت الرقم صار الشي أسرع أو أكثر.",
				en: "Every multiplier here reads the same way: 1 is normal, and a bigger number means faster or more.",
			},
			key: "XPMultiplier",
			label: {
				ar: "مضاعف الخبرة",
				en: "XP multiplier",
			},
		}),
	),
	inServerSettings(
		multiplier({
			key: "TamingSpeedMultiplier",
			label: {
				ar: "سرعة الترويض",
				en: "Taming speed",
			},
		}),
	),
	inServerSettings(
		multiplier({
			key: "HarvestAmountMultiplier",
			label: {
				ar: "كمية الحصاد",
				en: "Harvest amount",
			},
		}),
	),
	inServerSettings(
		multiplier({
			help: {
				ar: "كل ما نقّصته، رجعت الأشجار والصخور أسرع.",
				en: "Lower it and the trees and rocks come back faster.",
			},
			key: "ResourcesRespawnPeriodMultiplier",
			label: {
				ar: "رجوع الموارد",
				en: "Resource respawn",
			},
		}),
	),
	inServerSettings(
		multiplier({
			key: "DayCycleSpeedScale",
			label: {
				ar: "سرعة دورة اليوم",
				en: "Day cycle speed",
			},
		}),
	),
	inServerSettings(
		multiplier({
			help: {
				ar: "كل ما كبّرته، قصر النهار.",
				en: "Higher makes the day shorter.",
			},
			key: "DayTimeSpeedScale",
			label: {
				ar: "سرعة النهار",
				en: "Day speed",
			},
		}),
	),
	inServerSettings(
		multiplier({
			help: {
				ar: "كل ما كبّرته، قصر الليل.",
				en: "Higher makes the night shorter.",
			},
			key: "NightTimeSpeedScale",
			label: {
				ar: "سرعة الليل",
				en: "Night speed",
			},
		}),
	),
	inServerSettings(
		multiplier({
			key: "PlayerCharacterFoodDrainMultiplier",
			label: {
				ar: "سرعة الجوع",
				en: "Hunger drain",
			},
		}),
	),
	inServerSettings(
		multiplier({
			key: "PlayerCharacterWaterDrainMultiplier",
			label: {
				ar: "سرعة العطش",
				en: "Thirst drain",
			},
		}),
	),
	inServerSettings(
		multiplier({
			key: "PlayerDamageMultiplier",
			label: {
				ar: "ضرر اللاعب",
				en: "Player damage",
			},
		}),
	),
	inServerSettings(
		multiplier({
			help: {
				ar: "كل ما كبّرته، قل الضرر اللي ياخذه اللاعب.",
				en: "The bigger it is, the less damage the player takes.",
			},
			key: "PlayerResistanceMultiplier",
			label: {
				ar: "مقاومة اللاعب",
				en: "Player resistance",
			},
		}),
	),
	inServerSettings(
		multiplier({
			key: "DinoDamageMultiplier",
			label: {
				ar: "ضرر الديناصورات البرية",
				en: "Wild dino damage",
			},
		}),
	),
	inServerSettings(
		multiplier({
			key: "DinoResistanceMultiplier",
			label: {
				ar: "مقاومة الديناصورات البرية",
				en: "Wild dino resistance",
			},
		}),
	),
	inServerSettings(
		multiplier({
			key: "StructureDamageMultiplier",
			label: {
				ar: "ضرر المباني",
				en: "Structure damage",
			},
		}),
	),
	inServerSettings(
		multiplier({
			key: "StructureResistanceMultiplier",
			label: {
				ar: "مقاومة المباني",
				en: "Structure resistance",
			},
		}),
	),
]);

export const BREEDING_SETTINGS_GROUP = grouped(ArkSettingGroup.Breeding, [
	inGameMode(
		multiplier({
			help: {
				ar: "كل ما نقّصته، قدر الديناصور يتزاوج مرة ثانية أسرع.",
				en: "Lower it and a dino can mate again sooner.",
			},
			key: "MatingIntervalMultiplier",
			label: {
				ar: "الفاصل بين التزاوجات",
				en: "Mating interval",
			},
		}),
	),
	inGameMode(
		multiplier({
			key: "EggHatchSpeedMultiplier",
			label: {
				ar: "سرعة تفقيس البيض",
				en: "Egg hatch speed",
			},
		}),
	),
	inGameMode(
		multiplier({
			key: "BabyMatureSpeedMultiplier",
			label: {
				ar: "سرعة كبر الصغار",
				en: "Baby maturation speed",
			},
		}),
	),
	inGameMode(
		multiplier({
			help: {
				ar: "كل ما نقّصته، طلب الصغير تدليل أكثر — وكل ما كبّرته ارتحت.",
				en: "Lower it and the baby asks to be cuddled more often; higher and you get a break.",
			},
			key: "BabyCuddleIntervalMultiplier",
			label: {
				ar: "الفاصل بين تدليل الصغار",
				en: "Baby cuddle interval",
			},
		}),
	),
	inGameMode(
		multiplier({
			key: "LayEggIntervalMultiplier",
			label: {
				ar: "الفاصل بين وضع البيض",
				en: "Egg laying interval",
			},
		}),
	),
]);

export const CHAT_SETTINGS_GROUP = grouped(ArkSettingGroup.Chat, [
	inServerSettings({
		fallback: "False",
		help: {
			ar: "صوتك يوصل كل من في السيرفر، مو بس اللي جنبك.",
			en: "Your voice reaches everyone on the server, not just whoever is standing next to you.",
		},
		key: "GlobalVoiceChat",
		kind: ArkSettingKind.Boolean,
		label: {
			ar: "الشات الصوتي العام",
			en: "Global voice chat",
		},
	}),
	inServerSettings({
		fallback: "False",
		help: {
			ar: "الكتابة توصل بس للي قريبين منك في الماب.",
			en: "Typed chat reaches only the players close to you on the map.",
		},
		key: "ProximityChat",
		kind: ArkSettingKind.Boolean,
		label: {
			ar: "الشات القريب",
			en: "Proximity chat",
		},
	}),
]);

export const ARK_SETTINGS: ArkSetting[] = [
	...SERVER_SETTINGS_GROUP,
	...RULES_SETTINGS_GROUP,
	...RATES_SETTINGS_GROUP,
	...BREEDING_SETTINGS_GROUP,
	...CHAT_SETTINGS_GROUP,
];

export const SETTING_BY_KEY = new Map(
	ARK_SETTINGS.map((setting) => [
		setting.key,
		setting,
	]),
);

export interface ArkSettingsSection {
	file: string;
	section: string;
}

export const SETTINGS_SECTIONS: ArkSettingsSection[] = [
	...new Map(
		ARK_SETTINGS.map((setting) => [
			sectionKey(setting.file, setting.section),
			{
				file: setting.file,
				section: setting.section,
			},
		]),
	).values(),
];

const CONTROL_BY_KIND: Record<ArkSettingKind, BridgeControl> = {
	[ArkSettingKind.Boolean]: BridgeControl.Boolean,
	[ArkSettingKind.Number]: BridgeControl.Number,
	[ArkSettingKind.Secret]: BridgeControl.Secret,
	[ArkSettingKind.Text]: BridgeControl.Text,
};

export const fieldOf = (setting: ArkSetting): Bridge.Field => {
	return {
		control: CONTROL_BY_KIND[setting.kind],
		help: setting.help,
		key: setting.key,
		label: setting.label,
		max: setting.max,
		maxLength: setting.maxLength,
		min: setting.min,
		pattern: setting.pattern,
		patternHint: setting.patternHint,
		step: setting.step,
		warning: setting.warning,
	};
};

export const fieldsOf = (settings: ArkSetting[]): Bridge.Field[] => {
	return settings.map(fieldOf);
};

export const SERVER_FIELDS = fieldsOf(SERVER_SETTINGS_GROUP);

export const RULES_FIELDS = fieldsOf(RULES_SETTINGS_GROUP);

export const RATES_FIELDS = fieldsOf(RATES_SETTINGS_GROUP);

export const BREEDING_FIELDS = fieldsOf(BREEDING_SETTINGS_GROUP);

export const CHAT_FIELDS = fieldsOf(CHAT_SETTINGS_GROUP);

const TRUE_WORDS = new Set([
	"1",
	"on",
	"true",
	"yes",
]);

const UNIT_SEPARATOR = 0x1f;

const DELETE_CHARACTER = 0x7f;

const hasControlCharacter = (text: string) => {
	for (const character of text) {
		const code = character.codePointAt(0) ?? 0;

		if (code <= UNIT_SEPARATOR || code === DELETE_CHARACTER) {
			return true;
		}
	}

	return false;
};

export const settingValue = (setting: ArkSetting, raw: string | undefined): Bridge.Value => {
	const value = raw ?? setting.fallback;

	if (setting.kind === ArkSettingKind.Boolean) {
		return TRUE_WORDS.has(value.trim().toLowerCase());
	}

	if (setting.kind === ArkSettingKind.Number) {
		const parsed = Number(value.trim());

		return Number.isFinite(parsed) ? parsed : Number(setting.fallback);
	}

	return value;
};

export const settingValues = (stored: Record<string, string>): Bridge.Values => {
	const values: Bridge.Values = {};

	for (const setting of ARK_SETTINGS) {
		values[setting.key] = settingValue(setting, stored[setting.key]);
	}

	return values;
};

const booleanText = (value: Bridge.Value) => {
	if (typeof value === "boolean") {
		return value ? "True" : "False";
	}

	return TRUE_WORDS.has(String(value).trim().toLowerCase()) ? "True" : "False";
};

export const settingText = (setting: ArkSetting, value: Bridge.Value): string => {
	if (setting.kind === ArkSettingKind.Boolean) {
		return booleanText(value);
	}

	if (setting.kind === ArkSettingKind.Number) {
		return String(value);
	}

	return value === null ? "" : String(value);
};

export const settingUpdates = (values: Bridge.Values): Record<string, string> => {
	const updates: Record<string, string> = {};

	for (const [key, value] of Object.entries(values)) {
		const setting = SETTING_BY_KEY.get(key);

		if (setting) {
			updates[key] = settingText(setting, value);
		}
	}

	return updates;
};

export const settingsByFile = (updates: Record<string, string>): ArkSettingPatch[] => {
	const patches = new Map<string, ArkSettingPatch>();

	for (const [key, value] of Object.entries(updates)) {
		const setting = SETTING_BY_KEY.get(key);

		if (!setting) {
			continue;
		}

		const id = sectionKey(setting.file, setting.section);
		const patch = patches.get(id) ?? {
			file: setting.file,
			section: setting.section,
			values: {},
		};

		patch.values[key] = value;
		patches.set(id, patch);
	}

	return [
		...patches.values(),
	];
};

const unknownSetting = (key: string): Bridge.Text => {
	return {
		ar: `${key} مو إعداد تقدر تغيّره من اللوحة.`,
		en: `${key} is not a setting the panel can change.`,
	};
};

const booleanOf = (setting: ArkSetting, value: Bridge.Value) => {
	if (typeof value === "boolean") {
		return value;
	}

	const text = String(value).trim().toLowerCase();

	if (text === "true" || text === "false") {
		return text === "true";
	}

	throw new BridgeUserError({
		ar: `«${setting.label.ar}» يا مشغّل يا مطفي، ما فيه خيار ثالث.`,
		en: `${setting.label.en} is either on or off, nothing else.`,
	});
};

const numberOf = (setting: ArkSetting, value: Bridge.Value) => {
	const text = typeof value === "string" ? value.trim() : value;
	const parsed = typeof text === "number" ? text : Number(text);
	const readable = typeof text === "number" || (typeof text === "string" && text.length > 0);

	if (!readable || !Number.isFinite(parsed)) {
		throw new BridgeUserError({
			ar: `«${setting.label.ar}» يبي له رقم.`,
			en: `${setting.label.en} needs a number.`,
		});
	}

	const min = setting.min;
	const max = setting.max;

	if (min !== undefined && max !== undefined && (parsed < min || parsed > max)) {
		throw new BridgeUserError({
			ar: `«${setting.label.ar}» لازم يكون بين ${min} و ${max}.`,
			en: `${setting.label.en} must be between ${min} and ${max}.`,
		});
	}

	if (min !== undefined && max === undefined && parsed < min) {
		throw new BridgeUserError({
			ar: `«${setting.label.ar}» لازم يكون ${min} أو أكثر.`,
			en: `${setting.label.en} must be ${min} or more.`,
		});
	}

	return parsed;
};

const textOf = (setting: ArkSetting, value: Bridge.Value) => {
	const text = value === null ? "" : String(value);

	if (hasControlCharacter(text)) {
		throw new BridgeUserError({
			ar: `«${setting.label.ar}» يبي له سطر واحد بدون رموز مخفية.`,
			en: `${setting.label.en} must be one line, with no line breaks or hidden characters.`,
		});
	}

	const limit = setting.maxLength;

	if (limit !== undefined && text.length > limit) {
		throw new BridgeUserError({
			ar: `«${setting.label.ar}» أطول من ${limit} حرف.`,
			en: `${setting.label.en} is longer than ${limit} characters.`,
		});
	}

	if (setting.pattern !== undefined && !new RegExp(setting.pattern).test(text)) {
		throw new BridgeUserError(
			setting.patternHint ?? {
				ar: `«${setting.label.ar}» مكتوب بشكل ما نقدر نستخدمه.`,
				en: `${setting.label.en} is written in a shape we cannot use.`,
			},
		);
	}

	return text;
};

export const validateSettingsWrite = (values: Bridge.Values): Bridge.Values => {
	const checked: Bridge.Values = {};

	for (const [key, value] of Object.entries(values)) {
		const setting = SETTING_BY_KEY.get(key);

		if (!setting) {
			throw new BridgeUserError(unknownSetting(key));
		}

		if (setting.kind === ArkSettingKind.Boolean) {
			checked[key] = booleanOf(setting, value);

			continue;
		}

		if (setting.kind === ArkSettingKind.Number) {
			checked[key] = numberOf(setting, value);

			continue;
		}

		checked[key] = textOf(setting, value);
	}

	return checked;
};
