import { create } from "zustand";
import {
  GameState,
  Character,
  ChapterIntroState,
  Item,
  Skill,
  Equipment,
  BattleLogType,
  BattlePhase,
  CycleCheckpoint,
} from "@/types/game";
import { ASSETS } from "@/app/config/imageAssets";
import {
  EQUIPMENT_TIERS,
  getMonsterByLevelAndStage,
  getPlayerGrowthStatsByLevel,
  getSkillStrikePower,
  getSkillHealAmount,
  getSkillBuffRate,
  getSkillBuffFlatBonus,
  getSkillSealChance,
} from "@/app/config/gameData";
import { SHOP_ITEMS } from "@/app/config/shopData";

const initialCharacter: Character = {
  id: "1",
  name: "勇者",
  hp: 100,
  maxHp: 100,
  mp: 100,
  maxMp: 100,
  attack: 20,
  defense: 10,
  critRate: 0,
  evasionRate: 0,
  level: 1,
  exp: 0,
  gold: 100,
  buffs: {},
};

const initialSkills: Skill[] = [
  {
    id: "s1",
    name: "雷霆斩",
    level: 1,
    maxLevel: 5,
    description:
      "以雷纹贯刃完成突进斩击，先破势再收割，是勇者最稳定的开阵术式。",
    cost: { gold: 50, mp: 20 },
    effect: { type: "damage", value: 20 },
  },
  {
    id: "s3",
    name: "战吼术",
    level: 1,
    maxLevel: 5,
    description: "将战意化为声浪震开怯意，短时间内大幅抬升进攻压迫力。",
    cost: { gold: 50, mp: 15 },
    effect: { type: "buff", value: 5, buffType: "attack", duration: 7 },
  },
  {
    id: "s2",
    name: "治疗术",
    level: 1,
    maxLevel: 5,
    description: "引导圣愈微光缝合伤势，在拉锯战中重建生存节奏。",
    cost: { gold: 50, mp: 10 },
    effect: { type: "heal", value: 30 },
  },
  {
    id: "s4",
    name: "圣盾术",
    level: 1,
    maxLevel: 5,
    description: "召来圣辉护壁覆盖周身，稳住前排并削弱敌方爆发窗口。",
    cost: { gold: 50, mp: 15 },
    effect: { type: "buff", value: 5, buffType: "defense", duration: 7 },
  },
  {
    id: "s5",
    name: "封印术",
    level: 1,
    maxLevel: 5,
    description: "刻下静默咒印封住敌方行动链，为反击争取关键回合。",
    cost: { gold: 50, mp: 15 },
    effect: { type: "debuff", value: 50, debuffType: "freeze", duration: 3 },
  },
];

const AUTO_SAVE_KEY = "paly-auto-save";
const CYCLE_CHECKPOINTS_KEY = "paly-cycle-checkpoints";
const MAX_CYCLE_CHECKPOINTS = 12;

// 创建装备道具
const createEquipmentItem = (
  type: "weapon" | "armor" | "helmet" | "horse" | "accessory",
  tier: number,
): Item => {
  const tierData = EQUIPMENT_TIERS[type][tier - 1];
  const image = ASSETS.equipment[type][tier - 1];
  const id = `${type}_t${tier}_${Date.now()}`;
  if (type === "weapon") {
    return {
      id,
      name: tierData.name,
      tier,
      type,
      attack: (tierData as any).attack,
      image,
      description: tierData.description,
    };
  }
  if (type === "horse") {
    return {
      id,
      name: tierData.name,
      tier,
      type,
      evasionRate: (tierData as any).evasionRate,
      image,
      description: tierData.description,
    };
  }
  if (type === "accessory") {
    return {
      id,
      name: tierData.name,
      tier,
      type,
      critRate: (tierData as any).critRate,
      image,
      description: tierData.description,
    };
  }
  if (type === "helmet") {
    return {
      id,
      name: tierData.name,
      tier,
      type,
      maxHpBonus: (tierData as any).maxHpBonus,
      image,
      description: tierData.description,
    };
  }
  return {
    id,
    name: tierData.name,
    tier,
    type,
    defense: (tierData as any).defense,
    image,
    description: tierData.description,
  };
};

const makeWatermelon = (n: number): Item => ({
  id: `food_watermelon_0${n}`,
  name: "清凉西瓜",
  type: "consumable",
  healHp: 100,
  image: ASSETS.food.watermelon,
  description:
    "南境绿洲培育的高含水战地果实，切开即带清甜凉气。前线士兵常把它当作最稳妥的应急补给。",
});

const makeHpPotion = (n: number): Item => ({
  id: `food_hp_potion_0${n}`,
  name: "赤焰生命",
  type: "consumable",
  healHpPct: 0.8,
  image: ASSETS.food.largeHpPotion,
  description:
    "神殿炼金所用血莲与晨露合成的高阶药剂，能在濒危时迅速拉回生命线。越是高压战局，越能体现它的价值。",
});

const makeMpPotion = (n: number): Item => ({
  id: `food_mp_potion_0${n}`,
  name: "幽蓝魔力",
  type: "consumable",
  healMpPct: 0.8,
  image: ASSETS.food.largeMpPotion,
  description:
    "封存月华与星屑精华的蓝阶药剂，可快速回补施法所需魔力。连发术式前饮用，往往能逆转整轮战局。",
});

const makeHotpot = (n: number): Item => ({
  id: `food_hotpot_0${n}`,
  name: "炙炎石锅饭",
  type: "consumable",
  healHp: 80,
  image: ASSETS.food.food1,
  description:
    "战地伙头兵用炭火焖熟的石锅拌饭，焦香滚烫，一碗下肚能驱散疲乏，稳住受创的身体。",
});

const makeSeafoodBowl = (n: number): Item => ({
  id: `food_seafood_bowl_0${n}`,
  name: "海珍大丼",
  type: "consumable",
  healHpPct: 0.5,
  healMpPct: 0.3,
  image: ASSETS.food.food2,
  description:
    "从海港运来的珍稀海鲜拼盘，营养丰沛，既能大幅修复战伤，又能滋养灵力加速回蓝。",
});

const makeTomatoJuice = (n: number): Item => ({
  id: `food_tomato_juice_0${n}`,
  name: "烈焰番茄汁",
  type: "consumable",
  healHp: 50,
  healMp: 60,
  image: ASSETS.food.food3,
  description:
    "以烈日番茄榨制、混入芹香香料的战地特调，入喉火辣，能同时为血肉和灵脉注入活力。",
});

const makePoison = (n: number): Item => ({
  id: `food_poison_0${n}`,
  name: "森幽毒液",
  type: "consumable",
  drainHpPct: 0.3,
  image: ASSETS.food.food4,
  description:
    "幽林深处炼制的绿色毒液，骷髅头标记警示着它的代价。服下者以血肉为燃料，瞬间将魔力回复至满载。",
});

const LOOT_MESSAGES = [
  "敌影溃散后，一件补给在尘土间亮起微光。",
  "你踏过残骸时，拾到了仍可用的前线补给。",
  "胜势落定，战场边缘滚出一份意外收获。",
  "短暂寂静后，一件掉落物从裂石缝里显露出来。",
  "你在余烬旁俯身搜检，摸到了一件可用战利品。",
];

// 所有食物工厂函数，新增食物时往这里加即可
const FOOD_FACTORIES: Array<(n: number) => Item> = [
  makeWatermelon,
  makeHpPotion,
  makeMpPotion,
  makeHotpot,
  makeSeafoodBowl,
  makeTomatoJuice,
  makePoison,
];

const makeRandomFood = (): Item => {
  const factory =
    FOOD_FACTORIES[Math.floor(Math.random() * FOOD_FACTORIES.length)];
  return factory(Date.now());
};

const createInitialInventory = (): Item[] => [
  createEquipmentItem("weapon", 1),
  createEquipmentItem("armor", 1),
  createEquipmentItem("helmet", 1),
  createEquipmentItem("horse", 1),
  createEquipmentItem("accessory", 1),
  makeWatermelon(1),
  makeWatermelon(2),
  makeWatermelon(3),
  makeHpPotion(1),
  makeHpPotion(2),
  makeHpPotion(3),
  makeMpPotion(1),
  makeMpPotion(2),
  makeMpPotion(3),
];

const cloneCharacter = (character: Character): Character => ({
  ...character,
  buffs: character.buffs
    ? {
        attackBoost: character.buffs.attackBoost
          ? { ...character.buffs.attackBoost }
          : undefined,
        defenseBoost: character.buffs.defenseBoost
          ? { ...character.buffs.defenseBoost }
          : undefined,
      }
    : {},
});

const cloneItem = (item: Item): Item => ({
  ...item,
  stats: item.stats ? { ...item.stats } : undefined,
});

const cloneSkill = (skill: Skill): Skill => {
  const normalizedNameMap: Partial<Record<Skill["id"], string>> = {
    s1: "雷霆斩",
    s3: "战吼术",
    s4: "圣盾术",
  };
  const normalizedDescriptionMap: Partial<Record<Skill["id"], string>> = {
    s1: "以雷纹贯刃完成突进斩击，先破势再收割，是勇者最稳定的开阵术式。",
    s2: "引导圣愈微光缝合伤势，在拉锯战中重建生存节奏。",
    s3: "将战意化为声浪震开怯意，短时间内大幅抬升进攻压迫力。",
    s4: "召来圣辉护壁覆盖周身，稳住前排并削弱敌方爆发窗口。",
    s5: "刻下静默咒印封住敌方行动链，为反击争取关键回合。",
  };
  const normalizedName = normalizedNameMap[skill.id] ?? skill.name;
  const normalizedDescription =
    normalizedDescriptionMap[skill.id] ?? skill.description;

  return {
    ...skill,
    name: normalizedName,
    description: normalizedDescription,
    cost: { ...skill.cost },
    effect: { ...skill.effect },
  };
};

const cloneRewardModal = (
  rewardModal: GameState["rewardModal"],
): GameState["rewardModal"] => {
  if (!rewardModal) return null;
  return {
    ...rewardModal,
    foodDrop: rewardModal.foodDrop
      ? {
          item: cloneItem(rewardModal.foodDrop.item),
          lootMessage: rewardModal.foodDrop.lootMessage,
        }
      : undefined,
    cycleReward: rewardModal.cycleReward
      ? {
          weapon: cloneItem(rewardModal.cycleReward.weapon),
          armor: cloneItem(rewardModal.cycleReward.armor),
          helmet: cloneItem(rewardModal.cycleReward.helmet),
          horse: cloneItem(rewardModal.cycleReward.horse),
          accessory: cloneItem(rewardModal.cycleReward.accessory),
        }
      : undefined,
  };
};

const cloneChapterIntro = (
  chapterIntro: ChapterIntroState | null,
): ChapterIntroState | null => {
  if (!chapterIntro) return null;
  return { ...chapterIntro };
};

const createChapterIntroState = (cycle: number): ChapterIntroState => ({
  show: true,
  cycle,
});

type CoreGameState = Omit<GameState, "checkpoints" | "isHydrated">;

type SaveFile = {
  snapshot: CoreGameState;
  lastSavedAt: string;
};

type CycleCheckpointFile = {
  id: string;
  cycle: number;
  createdAt: string;
  snapshot: CoreGameState;
};

const createCoreGameState = (hasSeenIntro = false): CoreGameState => ({
  character: cloneCharacter(initialCharacter),
  equipment: {},
  inventory: createInitialInventory(),
  skills: initialSkills.map(cloneSkill),
  currentMonster: null,
  battleLog: [],
  isPlayerTurn: true,
  rewardModal: null,
  chapterIntro: null,
  deathModal: false,
  monsterIndex: 0,
  cycle: 1,
  showCycleReward: false,
  hasSeenIntro,
  roundNumber: 0,
  battlePhase: "idle",
  battleTransitionText: "",
  redeemedCodes: [],
});

const createSnapshotFromState = (state: CoreGameState): CoreGameState => ({
  character: cloneCharacter(state.character),
  equipment: Object.fromEntries(
    Object.entries(state.equipment).map(([key, value]) => [
      key,
      value ? cloneItem(value) : value,
    ]),
  ) as Equipment,
  inventory: state.inventory.map(cloneItem),
  skills: state.skills.map(cloneSkill),
  currentMonster: state.currentMonster
    ? {
        ...state.currentMonster,
        reward: { ...state.currentMonster.reward },
      }
    : null,
  battleLog: state.battleLog.map((entry) => ({ ...entry })),
  isPlayerTurn: state.isPlayerTurn,
  rewardModal: cloneRewardModal(state.rewardModal),
  chapterIntro: cloneChapterIntro(state.chapterIntro),
  deathModal: state.deathModal,
  monsterIndex: state.monsterIndex,
  cycle: state.cycle,
  showCycleReward: state.showCycleReward,
  hasSeenIntro: state.hasSeenIntro,
  roundNumber: state.roundNumber,
  battlePhase: state.battlePhase,
  battleTransitionText: state.battleTransitionText,
  redeemedCodes: [...(state.redeemedCodes || [])],
});

const createVip666Weapon = (): Item => ({
  id: `cdk_vip666_weapon_${Date.now()}`,
  name: "开荒破阵刃",
  type: "weapon",
  attack: 25,
  image: ASSETS.cdk.vip666,
  description:
    "　　王都新兵福利武器。锋刃稳定，攻势凌厉，适合刚踏入回廊的勇者快速建立优势。",
});

const createWishBottle = (): Item => ({
  id: `cdk_vip888_wish_${Date.now()}`,
  name: "星潮愿望瓶",
  type: "consumable",
  image: ASSETS.cdk.vip888,
  description:
    "　　封存了流星雨碎光的神秘瓶子。开启后可能涌出三份补给，也可能化作 500 金币祝福。",
});

const readAutoSaveFile = (): SaveFile | null => {
  if (globalThis.window === undefined) return null;
  try {
    const raw = globalThis.localStorage.getItem(AUTO_SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SaveFile;
  } catch {
    return null;
  }
};

const writeAutoSaveFile = (snapshot: CoreGameState) => {
  if (globalThis.window === undefined) return;
  try {
    const payload: SaveFile = {
      snapshot: createSnapshotFromState(snapshot),
      lastSavedAt: new Date().toISOString(),
    };
    globalThis.localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore persistence write failures to keep gameplay available.
  }
};

const readCycleCheckpointFiles = (): CycleCheckpointFile[] => {
  if (globalThis.window === undefined) return [];
  try {
    const raw = globalThis.localStorage.getItem(CYCLE_CHECKPOINTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CycleCheckpointFile[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeCycleCheckpointFiles = (files: CycleCheckpointFile[]) => {
  if (globalThis.window === undefined) return;
  try {
    globalThis.localStorage.setItem(
      CYCLE_CHECKPOINTS_KEY,
      JSON.stringify(files),
    );
  } catch {
    // Ignore checkpoint write failures to avoid blocking gameplay.
  }
};

const resolveSaveIdBySnapshot = (snapshot: CoreGameState): string =>
  (snapshot.character.playerName || snapshot.character.name || "勇者")
    .trim()
    .toLowerCase();

const resolveSaveIdByCheckpoint = (checkpoint: CycleCheckpointFile): string =>
  resolveSaveIdBySnapshot(checkpoint.snapshot);

const createCheckpointSummary = (
  checkpoint: CycleCheckpointFile,
): CycleCheckpoint => ({
  id: checkpoint.id,
  cycle: checkpoint.cycle,
  playerName:
    checkpoint.snapshot.character.playerName ||
    checkpoint.snapshot.character.name,
  level: checkpoint.snapshot.character.level,
  gold: checkpoint.snapshot.character.gold,
  createdAt: checkpoint.createdAt,
});

const readCheckpointSummaries = (): CycleCheckpoint[] => {
  const files = readCycleCheckpointFiles();
  const summaries: CycleCheckpoint[] = [];

  for (const file of files) {
    try {
      if (!file?.snapshot?.character) continue;
      summaries.push(createCheckpointSummary(file));
    } catch {
      // Ignore malformed checkpoints so a bad entry does not block hydration.
    }
  }

  return summaries.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
};

const appendCycleCheckpoint = (snapshot: CoreGameState, cycle: number) => {
  const files = readCycleCheckpointFiles();
  const saveId = resolveSaveIdBySnapshot(snapshot);
  const next: CycleCheckpointFile = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    cycle,
    createdAt: new Date().toISOString(),
    snapshot: createSnapshotFromState(snapshot),
  };
  const merged = [
    ...files.filter((file) => resolveSaveIdByCheckpoint(file) !== saveId),
    next,
  ]
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )
    .slice(-MAX_CYCLE_CHECKPOINTS);
  writeCycleCheckpointFiles(merged);
};

// 升级辅助函数
const checkLevelUp = (
  character: Character,
  equipment?: Equipment,
): Character => {
  const expNeeded = 100;
  if (character.exp >= expNeeded) {
    const newLevel = character.level + 1;
    const nextStats = getPlayerGrowthStatsByLevel(newLevel);
    const nextMaxHp = nextStats.maxHp;
    const nextMaxMp = nextStats.maxMp;
    const nextEffectiveMaxHp = nextMaxHp + (equipment?.helmet?.maxHpBonus || 0);
    return {
      ...character,
      level: newLevel,
      exp: character.exp - expNeeded,
      maxHp: nextMaxHp,
      hp: Math.min(
        nextEffectiveMaxHp,
        character.hp + (nextMaxHp - character.maxHp),
      ),
      maxMp: nextMaxMp,
      mp: Math.min(nextMaxMp, character.mp + (nextMaxMp - character.maxMp)),
      attack: nextStats.attack,
      defense: nextStats.defense,
    };
  }
  return character;
};

const getHelmetHpBonus = (equipment: Equipment): number =>
  equipment.helmet?.maxHpBonus || 0;

const getEffectiveMaxHp = (
  character: Character,
  equipment: Equipment,
): number => character.maxHp + getHelmetHpBonus(equipment);

const CHINESE_NUMERALS = [
  "零",
  "一",
  "二",
  "三",
  "四",
  "五",
  "六",
  "七",
  "八",
  "九",
];

const toChineseNumber = (value: number): string => {
  if (value <= 10) {
    return value === 10 ? "十" : CHINESE_NUMERALS[value];
  }

  if (value < 20) {
    return `十${CHINESE_NUMERALS[value % 10]}`;
  }

  if (value < 100) {
    const tens = Math.floor(value / 10);
    const ones = value % 10;
    return `${CHINESE_NUMERALS[tens]}十${ones === 0 ? "" : CHINESE_NUMERALS[ones]}`;
  }

  const hundreds = Math.floor(value / 100);
  const remainder = value % 100;
  if (remainder === 0) {
    return `${CHINESE_NUMERALS[hundreds]}百`;
  }

  if (remainder < 10) {
    return `${CHINESE_NUMERALS[hundreds]}百零${CHINESE_NUMERALS[remainder]}`;
  }

  return `${CHINESE_NUMERALS[hundreds]}百${toChineseNumber(remainder)}`;
};

const formatRoundLabel = (round: number): string =>
  `第${toChineseNumber(round)}回合`;

const CRIT_RATE_CAP = 0.4;
const EVASION_RATE_CAP = 0.4;
const MONSTER_RATE_CAP = 0.2;

const clampRate = (value: number, cap: number): number =>
  Math.max(0, Math.min(value, cap));

const createLogEntry = (message: string, type: BattleLogType) => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  message,
  type,
});

interface GameStore extends GameState {
  equipItem: (item: Item) => void;
  unequipItem: (slot: keyof Equipment) => void;
  useItem: (itemId: string) => {
    title: string;
    story: string;
    items?: Item[];
    gold?: number;
  } | null;
  buyShopItem: (
    shopItemId: string,
    quantity?: number,
  ) => {
    success: boolean;
    message: string;
    item?: Item;
  };
  redeemCode: (code: string) => {
    success: boolean;
    message: string;
    reward?: {
      title: string;
      story: string;
      items?: Item[];
      gold?: number;
    };
  };
  upgradeSkill: (skillId: string) => void;
  startBattle: () => void;
  attack: () => void;
  useSkill: (skillId: string) => void;
  addLog: (message: string, type?: BattleLogType) => void;
  closeRewardModal: () => void;
  claimCycleReward: () => void;
  dismissChapterIntroAndStartBattle: () => void;
  resetGame: () => void;
  setHasSeenIntro: (playerName: string) => {
    success: boolean;
    message?: string;
  };
  setBattlePhase: (phase: BattlePhase, text?: string) => void;
  initializePersistence: () => void;
  refreshCheckpoints: () => void;
  restartFromLastCheckpoint: () => boolean;
  loadCheckpoint: (checkpointId: string) => boolean;
  deleteCheckpoint: (checkpointId: string) => boolean;
  startNewGame: () => void;
  clearAllProgress: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...createCoreGameState(),
  checkpoints: [],
  isHydrated: false,

  setBattlePhase: (phase: BattlePhase, text = "") =>
    set({ battlePhase: phase, battleTransitionText: text }),

  equipItem: (item: Item) =>
    set((state) => {
      const newEquipment = { ...state.equipment };
      const oldItem = newEquipment[item.type as keyof Equipment];
      newEquipment[item.type as keyof Equipment] = item;

      const itemIndex = state.inventory.findIndex((i) => i.id === item.id);
      const newInventory = [...state.inventory];

      if (itemIndex !== -1) {
        if (oldItem) {
          // If there was an old item, replace the new item's slot with the old item
          newInventory.splice(itemIndex, 1, oldItem);
        } else {
          // If the slot was empty, just remove the new item from inventory
          newInventory.splice(itemIndex, 1);
        }
      }

      const nextMaxHp = getEffectiveMaxHp(state.character, newEquipment);
      return {
        equipment: newEquipment,
        inventory: newInventory,
        character: {
          ...state.character,
          hp: Math.min(state.character.hp, nextMaxHp),
        },
      };
    }),

  unequipItem: (slot: keyof Equipment) =>
    set((state) => {
      const item = state.equipment[slot];
      if (!item) return state;
      const newEquipment = { ...state.equipment };
      delete newEquipment[slot];
      const nextMaxHp = getEffectiveMaxHp(state.character, newEquipment);
      return {
        equipment: newEquipment,
        inventory: [...state.inventory, item],
        character: {
          ...state.character,
          hp: Math.min(state.character.hp, nextMaxHp),
        },
      };
    }),

  useItem: (itemId: string) => {
    const state = get();
    const selectedItem = state.inventory.find((i: Item) => i.id === itemId);
    if (!selectedItem) return null;

    const newInventory = [...state.inventory];
    let item = selectedItem;

    if (selectedItem.type === "consumable") {
      // 背包展示按同名消耗品首个实例分组，消费时移除末尾实例可避免分组位置跳动。
      const removeIndex = state.inventory.findLastIndex(
        (i) => i.type === "consumable" && i.name === selectedItem.name,
      );
      if (removeIndex === -1) return null;
      item = state.inventory[removeIndex];
      newInventory.splice(removeIndex, 1);
    } else {
      const removeIndex = state.inventory.findIndex((i) => i.id === itemId);
      if (removeIndex === -1) return null;
      newInventory.splice(removeIndex, 1);
    }

    const newCharacter = { ...state.character };
    const effectiveMaxHp = getEffectiveMaxHp(newCharacter, state.equipment);

    if (item.name === "星潮愿望瓶") {
      const gainGold = Math.random() < 0.5;
      if (gainGold) {
        set({
          inventory: newInventory,
          character: { ...newCharacter, gold: newCharacter.gold + 500 },
        });
        return {
          title: "愿望实现",
          story:
            "你拧开星潮愿望瓶，瓶中光屑没有散去，反而凝成一枚沉甸甸的金色徽记，化作 500 金币落入行囊。",
          gold: 500,
        };
      }

      const bonusItems = [makeRandomFood(), makeRandomFood(), makeRandomFood()];
      set({
        inventory: [...newInventory, ...bonusItems],
        character: newCharacter,
      });
      return {
        title: "愿望实现",
        story:
          "你轻轻摇晃星潮愿望瓶，三道不同颜色的微光飞出，化作可立即使用的前线补给。",
        items: bonusItems,
      };
    }

    if (item.drainHpPct) {
      if (newCharacter.hp === 1) {
        return {
          title: "无法使用",
          story:
            "你颤抖着拔开瓶塞，却感到身体已在极限边缘——生命仅剩最后一丝，此时服下毒液将无力回天。森幽毒液被你慎重地收回了行囊。",
        };
      }
      const drain = Math.ceil(newCharacter.hp * item.drainHpPct);
      newCharacter.hp = Math.max(1, newCharacter.hp - drain);
      newCharacter.mp = newCharacter.maxMp;
    }

    if (item.healHp)
      newCharacter.hp = Math.min(effectiveMaxHp, newCharacter.hp + item.healHp);
    if (item.healMp)
      newCharacter.mp = Math.min(
        newCharacter.maxMp,
        newCharacter.mp + item.healMp,
      );
    if (item.healHpPct)
      newCharacter.hp = Math.min(
        effectiveMaxHp,
        newCharacter.hp + Math.floor(effectiveMaxHp * item.healHpPct),
      );
    if (item.healMpPct)
      newCharacter.mp = Math.min(
        newCharacter.maxMp,
        newCharacter.mp + Math.floor(newCharacter.maxMp * item.healMpPct),
      );

    set({ inventory: newInventory, character: newCharacter });
    return null;
  },

  buyShopItem: (shopItemId: string, quantity = 1) => {
    const state = get();
    const shopItem = SHOP_ITEMS.find((entry) => entry.id === shopItemId);
    if (!shopItem) {
      return { success: false, message: "商品不存在。" };
    }

    const normalizedQuantity = Math.max(1, Math.floor(quantity));
    const maxAffordable = Math.floor(state.character.gold / shopItem.price);
    if (maxAffordable <= 0) {
      return { success: false, message: "金币不足，无法购买。" };
    }

    if (normalizedQuantity > maxAffordable) {
      return {
        success: false,
        message: `数量超出可购买上限（最多 ${maxAffordable} 个）。`,
      };
    }

    const createShopConsumable = (id: string, seed: number): Item | null => {
      switch (id) {
        case "shop_watermelon":
          return makeWatermelon(seed);
        case "shop_hp_potion":
          return makeHpPotion(seed);
        case "shop_mp_potion":
          return makeMpPotion(seed);
        case "shop_hotpot":
          return makeHotpot(seed);
        case "shop_seafood_bowl":
          return makeSeafoodBowl(seed);
        case "shop_tomato_juice":
          return makeTomatoJuice(seed);
        case "shop_poison":
          return makePoison(seed);
        default:
          return null;
      }
    };

    const baseSeed = Date.now() + Math.floor(Math.random() * 1000);
    const purchasedItems: Item[] = [];
    for (let i = 0; i < normalizedQuantity; i += 1) {
      const nextItem = createShopConsumable(shopItemId, baseSeed + i);
      if (!nextItem) {
        return { success: false, message: "商品暂不可购买。" };
      }
      purchasedItems.push(nextItem);
    }

    const totalPrice = shopItem.price * normalizedQuantity;

    set({
      character: {
        ...state.character,
        gold: state.character.gold - totalPrice,
      },
      inventory: [...state.inventory, ...purchasedItems],
    });

    return {
      success: true,
      message: `购买成功：${shopItem.name} x${normalizedQuantity}（共 ${totalPrice} 金币）`,
      item: purchasedItems[0],
    };
  },

  redeemCode: (code: string) => {
    const state = get();
    const normalizedCode = code.trim().toLowerCase();

    if (!normalizedCode) {
      return { success: false, message: "请输入兑换码。" };
    }

    if (state.redeemedCodes.includes(normalizedCode)) {
      return { success: false, message: "该兑换码已领取过。" };
    }

    if (normalizedCode === "vip666") {
      const weapon = createVip666Weapon();
      set({
        inventory: [...state.inventory, weapon],
        redeemedCodes: [...state.redeemedCodes, normalizedCode],
      });
      return {
        success: true,
        message: "兑换成功！",
        reward: {
          title: "新兵福利已签收",
          story:
            "铁匠铺把最后一柄开荒破阵刃寄到了你的营地。锻炉余温尚存，锋刃已经等不及要试刀。",
          items: [weapon],
        },
      };
    }

    if (normalizedCode === "vip888") {
      const bottle = createWishBottle();
      set({
        inventory: [...state.inventory, bottle],
        redeemedCodes: [...state.redeemedCodes, normalizedCode],
      });
      return {
        success: true,
        message: "兑换成功！",
        reward: {
          title: "星潮祝福送达",
          story:
            "来自回廊彼端的信使留下了一个星潮愿望瓶。据说它会在你最需要的时候回应心愿。",
          items: [bottle],
        },
      };
    }

    return { success: false, message: "兑换码无效。" };
  },

  upgradeSkill: (skillId: string) =>
    set((state) => {
      const skill = state.skills.find((s: Skill) => s.id === skillId);
      if (!skill || skill.level >= skill.maxLevel) return state;
      const cost = skill.cost.gold * skill.level;
      if (state.character.gold < cost) return state;
      return {
        skills: state.skills.map((s: Skill) =>
          s.id === skillId ? { ...s, level: s.level + 1 } : s,
        ),
        character: { ...state.character, gold: state.character.gold - cost },
      };
    }),

  startBattle: () => {
    const state = get();
    if (state.chapterIntro?.show) return;
    const { monsterIndex, cycle } = state;
    const base = getMonsterByLevelAndStage(cycle, monsterIndex);
    set({
      currentMonster: {
        id: base.id,
        name: base.name,
        level: base.level,
        stage: base.stage,
        mapName: base.mapName,
        image: base.image,
        description: base.description,
        hp: base.hp,
        maxHp: base.hp,
        attack: base.attack,
        defense: base.defense,
        critRate: Math.min(MONSTER_RATE_CAP, base.critRate || 0),
        evasionRate: Math.min(MONSTER_RATE_CAP, base.evasionRate || 0),
        reward: base.reward,
      },
      battleLog: [createLogEntry("战斗开始！", "system")],
      isPlayerTurn: true,
      roundNumber: 0,
      battlePhase: "idle",
      battleTransitionText: "",
    });
  },

  attack: () => {
    const state = get();
    if (!state.currentMonster || !state.isPlayerTurn) return;
    if (state.battlePhase !== "idle") return;

    get().setBattlePhase("player-action", "你发起了攻击...");

    const newRound = state.roundNumber + 1;
    get().addLog(formatRoundLabel(newRound), "round-end");
    set({ roundNumber: newRound });

    const attackBuff = state.character.buffs?.attackBoost?.value || 0;
    const totalAttack =
      state.character.attack +
      (state.equipment.weapon?.attack || 0) +
      attackBuff;
    const totalCritRate = clampRate(
      state.character.critRate + (state.equipment.accessory?.critRate || 0),
      CRIT_RATE_CAP,
    );
    const isCrit = Math.random() < totalCritRate;
    const isMonsterEvaded =
      Math.random() < (state.currentMonster.evasionRate || 0);
    const jitter = Math.floor(Math.random() * 11) - 5; // -5 ~ +5
    const baseDamage = Math.max(
      1,
      totalAttack - state.currentMonster.defense + jitter,
    );
    const hitDamage = isCrit ? Math.floor(baseDamage * 1.5) : baseDamage;
    const damage = isMonsterEvaded ? 0 : hitDamage;
    const newMonsterHp = state.currentMonster.hp - damage;
    const critSuffix = isCrit ? "（暴击）" : "";
    const attackLogMsg = isMonsterEvaded
      ? `你攻击了${state.currentMonster.name}，但${state.currentMonster.name}闪避了！`
      : `你攻击了${state.currentMonster.name}，造成${damage}点伤害${critSuffix}`;

    get().addLog(attackLogMsg, "player");

    if (newMonsterHp <= 0) {
      get().addLog(`${state.currentMonster.name}被击败了！`, "system");
      const reward = state.currentMonster.reward;

      // 恢复最大蓝量的 50%
      const mpRecovery = Math.floor(state.character.maxMp * 0.5);
      const newMp = Math.min(
        state.character.maxMp,
        state.character.mp + mpRecovery,
      );
      get().addLog(`恢复了${mpRecovery}点蓝量`, "system");

      // 50% 概率掉落食物
      let foodDrop: Item | null = null;
      let lootMessage = "";
      if (Math.random() < 0.5) {
        foodDrop = makeRandomFood();
        lootMessage =
          LOOT_MESSAGES[Math.floor(Math.random() * LOOT_MESSAGES.length)];
      }

      const updatedChar = {
        ...state.character,
        exp: state.character.exp + reward.exp,
        gold: state.character.gold + reward.gold,
        mp: newMp,
      };
      const leveledUpChar = checkLevelUp(updatedChar, state.equipment);
      const didLevelUp = leveledUpChar.level > state.character.level;

      if (didLevelUp) {
        get().addLog(`恭喜升级！等级提升至 ${leveledUpChar.level}`, "system");
      }

      const newInventory = foodDrop
        ? [...state.inventory, foodDrop]
        : state.inventory;

      // 检查是否完成一轮10个怪物
      if (state.monsterIndex === 9) {
        if (state.cycle < 5) {
          const nextTier = state.cycle + 1;
          const cycleReward = {
            weapon: createEquipmentItem("weapon", nextTier),
            armor: createEquipmentItem("armor", nextTier),
            helmet: createEquipmentItem("helmet", nextTier),
            horse: createEquipmentItem("horse", nextTier),
            accessory: createEquipmentItem("accessory", nextTier),
          };
          set({
            character: leveledUpChar,
            inventory: newInventory,
            currentMonster: null,
            isPlayerTurn: true,
            battlePhase: "idle",
            battleTransitionText: "",
            rewardModal: {
              show: true,
              exp: reward.exp,
              gold: reward.gold,
              mpRecovery,
              cycleReward,
              ...(foodDrop
                ? { foodDrop: { item: foodDrop, lootMessage } }
                : {}),
            },
          });
        } else {
          set({
            character: leveledUpChar,
            inventory: newInventory,
            currentMonster: null,
            isPlayerTurn: true,
            battlePhase: "idle",
            battleTransitionText: "",
            rewardModal: {
              show: true,
              finalVictory: true,
              exp: reward.exp,
              gold: reward.gold,
              mpRecovery,
              ...(foodDrop
                ? { foodDrop: { item: foodDrop, lootMessage } }
                : {}),
            },
          });
          get().addLog("恭喜通关！", "system");
        }
      } else {
        set({
          character: leveledUpChar,
          inventory: newInventory,
          currentMonster: null,
          monsterIndex: state.monsterIndex + 1,
          isPlayerTurn: true,
          battlePhase: "idle",
          battleTransitionText: "",
          rewardModal: {
            show: true,
            exp: reward.exp,
            gold: reward.gold,
            mpRecovery,
            ...(foodDrop ? { foodDrop: { item: foodDrop, lootMessage } } : {}),
          },
        });
      }
      return;
    }

    set({
      currentMonster: { ...state.currentMonster, hp: newMonsterHp },
      isPlayerTurn: false,
    });
    setTimeout(() => {
      const liveState = get();
      if (!liveState.currentMonster) return;
      get().setBattlePhase(
        "monster-action",
        `${liveState.currentMonster.name}反击中...`,
      );
    }, 100);

    setTimeout(() => {
      const state = get();
      if (!state.currentMonster) return;

      // 冰冻：跳过怪物行动，减少冻结回合
      if (
        state.currentMonster.frozenTurns &&
        state.currentMonster.frozenTurns > 0
      ) {
        const newFrozen = state.currentMonster.frozenTurns - 1;
        get().addLog(
          `${state.currentMonster.name}被封印，无法行动！（${newFrozen}回合）`,
          "system",
        );
        set({
          currentMonster: { ...state.currentMonster, frozenTurns: newFrozen },
          isPlayerTurn: true,
          battlePhase: "idle",
          battleTransitionText: "",
        });
        return;
      }

      const defenseBuff = state.character.buffs?.defenseBoost?.value || 0;
      const totalDefense =
        state.character.defense +
        (state.equipment.armor?.defense || 0) +
        defenseBuff;
      const totalEvasionRate = clampRate(
        state.character.evasionRate + (state.equipment.horse?.evasionRate || 0),
        EVASION_RATE_CAP,
      );
      const isEvaded = Math.random() < totalEvasionRate;
      const monsterIsCrit =
        !isEvaded && Math.random() < (state.currentMonster.critRate || 0);
      const monsterJitter = Math.floor(Math.random() * 11) - 5;
      const baseMonsterDamage = Math.max(
        1,
        state.currentMonster.attack - totalDefense + monsterJitter,
      );
      const monsterHitDamage = monsterIsCrit
        ? Math.floor(baseMonsterDamage * 1.5)
        : baseMonsterDamage;
      const monsterDamage = isEvaded ? 0 : monsterHitDamage;
      const newPlayerHp = Math.max(0, state.character.hp - monsterDamage);
      const monsterCritSuffix = monsterIsCrit ? "（暴击）" : "";
      const monsterLogMsg = isEvaded
        ? `你闪避了${state.currentMonster.name}的攻击！`
        : `${state.currentMonster.name}攻击了你，造成${monsterDamage}点伤害${monsterCritSuffix}`;

      get().addLog(monsterLogMsg, "monster");

      if (newPlayerHp <= 0) {
        get().addLog("你被击败了...", "system");
        set({
          character: { ...state.character, hp: 0, buffs: {} },
          deathModal: true,
          isPlayerTurn: false,
          battlePhase: "idle",
          battleTransitionText: "",
        });
        return;
      }

      const newBuffs = { ...state.character.buffs };
      if (newBuffs.attackBoost) {
        newBuffs.attackBoost = {
          ...newBuffs.attackBoost,
          turnsLeft: newBuffs.attackBoost.turnsLeft - 1,
        };
        if (newBuffs.attackBoost.turnsLeft <= 0) {
          delete newBuffs.attackBoost;
          get().addLog("狂暴效果已消失", "system");
        }
      }
      if (newBuffs.defenseBoost) {
        newBuffs.defenseBoost = {
          ...newBuffs.defenseBoost,
          turnsLeft: newBuffs.defenseBoost.turnsLeft - 1,
        };
        if (newBuffs.defenseBoost.turnsLeft <= 0) {
          delete newBuffs.defenseBoost;
          get().addLog("防御效果已消失", "system");
        }
      }

      set({
        character: { ...state.character, hp: newPlayerHp, buffs: newBuffs },
        isPlayerTurn: true,
        battlePhase: "idle",
        battleTransitionText: "",
      });
    }, 1000);
  },

  useSkill: (skillId: string) => {
    const state = get();
    const skill = state.skills.find((s: Skill) => s.id === skillId);
    if (!skill || !state.isPlayerTurn) return;
    if (state.battlePhase !== "idle") return;

    const mpCost = skill.cost.mp;
    if (state.character.mp < mpCost) {
      get().addLog(
        `蓝量不足，无法使用${skill.name}（需要${mpCost}蓝）`,
        "system",
      );
      return;
    }

    get().setBattlePhase("player-action", `你发动了${skill.name}...`);

    const newRound = state.roundNumber + 1;
    get().addLog(formatRoundLabel(newRound), "round-end");
    set({ roundNumber: newRound });

    let monsterDefeated = false;
    let newMonsterHp = state.currentMonster?.hp ?? 0;

    if (skill.effect.type === "damage" && state.currentMonster) {
      const attackBuff = state.character.buffs?.attackBoost?.value || 0;
      const totalAttack =
        state.character.attack +
        (state.equipment.weapon?.attack || 0) +
        attackBuff;
      const strikePower = getSkillStrikePower(skill.level, totalAttack);
      const totalCritRate = clampRate(
        state.character.critRate + (state.equipment.accessory?.critRate || 0),
        CRIT_RATE_CAP,
      );
      const isCrit = Math.random() < totalCritRate;
      const isMonsterEvaded =
        Math.random() < (state.currentMonster.evasionRate || 0);
      const jitter = Math.floor(Math.random() * 11) - 5;
      const baseDamage = Math.max(
        1,
        Math.floor(strikePower - state.currentMonster.defense + jitter),
      );
      const skillHitDamage = isCrit ? Math.floor(baseDamage * 1.5) : baseDamage;
      const damage = isMonsterEvaded ? 0 : skillHitDamage;
      newMonsterHp = isMonsterEvaded
        ? state.currentMonster.hp
        : state.currentMonster.hp - damage;
      const skillCritSuffix = isCrit ? "（暴击）" : "";
      const skillLogMsg = isMonsterEvaded
        ? `使用${skill.name}，但${state.currentMonster.name}闪避了！`
        : `使用${skill.name}，打击力${strikePower}，共造成${damage}点伤害${skillCritSuffix}`;
      get().addLog(skillLogMsg, "player");
      monsterDefeated = newMonsterHp <= 0;
    } else if (skill.effect.type === "heal") {
      const effectiveMaxHp = getEffectiveMaxHp(
        state.character,
        state.equipment,
      );
      const heal = getSkillHealAmount(skill.level, effectiveMaxHp);
      const newHp = Math.min(effectiveMaxHp, state.character.hp + heal);
      get().addLog(
        `使用${skill.name}，消耗${mpCost}蓝，恢复${heal}点生命`,
        "player",
      );
      set((s) => ({
        character: { ...s.character, mp: s.character.mp - mpCost, hp: newHp },
        isPlayerTurn: false,
      }));
    } else if (skill.effect.type === "buff") {
      const buffRate = getSkillBuffRate(skill.level);
      const duration = skill.effect.duration || 7;
      const buffType = skill.effect.buffType;
      const newBuffs = { ...state.character.buffs };
      if (buffType === "attack") {
        const currentTotalAttack =
          state.character.attack +
          (state.equipment.weapon?.attack || 0) +
          (state.character.buffs?.attackBoost?.value || 0);
        const flatBonus = getSkillBuffFlatBonus(skill.level, "attack");
        const buffValue = Math.floor(currentTotalAttack * buffRate) + flatBonus;
        newBuffs.attackBoost = { value: buffValue, turnsLeft: duration };
        get().addLog(
          `使用${skill.name}，消耗${mpCost}蓝，攻击力提升${buffValue}（${Math.round(buffRate * 100)}% + ${flatBonus}），持续${duration}回合`,
          "player",
        );
      } else if (buffType === "defense") {
        const currentTotalDefense =
          state.character.defense +
          (state.equipment.armor?.defense || 0) +
          (state.character.buffs?.defenseBoost?.value || 0);
        const flatBonus = getSkillBuffFlatBonus(skill.level, "defense");
        const buffValue =
          Math.floor(currentTotalDefense * buffRate) + flatBonus;
        newBuffs.defenseBoost = { value: buffValue, turnsLeft: duration };
        get().addLog(
          `使用${skill.name}，消耗${mpCost}蓝，防御力提升${buffValue}（${Math.round(buffRate * 100)}% + ${flatBonus}），持续${duration}回合`,
          "player",
        );
      }
      set((s) => ({
        character: {
          ...s.character,
          mp: s.character.mp - mpCost,
          buffs: newBuffs,
        },
        isPlayerTurn: false,
      }));
    } else if (
      skill.effect.type === "debuff" &&
      skill.effect.debuffType === "freeze" &&
      state.currentMonster
    ) {
      const duration = skill.effect.duration || 3;
      const sealChance = getSkillSealChance(skill.level);
      const sealSuccess = Math.random() * 100 < sealChance;
      get().addLog(
        sealSuccess
          ? `使用${skill.name}，消耗${mpCost}蓝，${state.currentMonster.name}被成功封印${duration}回合！`
          : `使用${skill.name}，消耗${mpCost}蓝，封印失败（成功率${sealChance}%）`,
        "player",
      );
      set((s) => ({
        character: { ...s.character, mp: s.character.mp - mpCost },
        currentMonster: s.currentMonster
          ? { ...s.currentMonster, frozenTurns: sealSuccess ? duration : 0 }
          : null,
        isPlayerTurn: false,
      }));
    }

    if (monsterDefeated && state.currentMonster) {
      get().addLog(`${state.currentMonster.name}被击败了！`);
      const reward = state.currentMonster.reward;

      // 恢复最大蓝量的 50%
      const mpRecovery = Math.floor(state.character.maxMp * 0.5);
      const newMp = Math.min(
        state.character.maxMp,
        state.character.mp - mpCost + mpRecovery,
      );
      get().addLog(`恢复了${mpRecovery}点蓝量`);

      // 50% 概率掉落食物
      let foodDrop: Item | null = null;
      let lootMessage = "";
      if (Math.random() < 0.5) {
        foodDrop = makeRandomFood();
        lootMessage =
          LOOT_MESSAGES[Math.floor(Math.random() * LOOT_MESSAGES.length)];
      }

      const updatedChar = {
        ...state.character,
        mp: newMp,
        exp: state.character.exp + reward.exp,
        gold: state.character.gold + reward.gold,
      };
      const leveledUpChar = checkLevelUp(updatedChar, state.equipment);
      if (leveledUpChar.level > state.character.level) {
        get().addLog(`恭喜升级！等级提升至 ${leveledUpChar.level}`, "system");
      }

      const newInventory = foodDrop
        ? [...state.inventory, foodDrop]
        : state.inventory;

      if (state.monsterIndex === 9) {
        if (state.cycle < 5) {
          const nextTier = state.cycle + 1;
          const cycleReward = {
            weapon: createEquipmentItem("weapon", nextTier),
            armor: createEquipmentItem("armor", nextTier),
            helmet: createEquipmentItem("helmet", nextTier),
            horse: createEquipmentItem("horse", nextTier),
            accessory: createEquipmentItem("accessory", nextTier),
          };
          set({
            character: leveledUpChar,
            inventory: newInventory,
            currentMonster: null,
            isPlayerTurn: true,
            battlePhase: "idle",
            battleTransitionText: "",
            rewardModal: {
              show: true,
              exp: reward.exp,
              gold: reward.gold,
              mpRecovery,
              cycleReward,
              ...(foodDrop
                ? { foodDrop: { item: foodDrop, lootMessage } }
                : {}),
            },
          });
        } else {
          set({
            character: leveledUpChar,
            inventory: newInventory,
            currentMonster: null,
            isPlayerTurn: true,
            battlePhase: "idle",
            battleTransitionText: "",
            rewardModal: {
              show: true,
              finalVictory: true,
              exp: reward.exp,
              gold: reward.gold,
              mpRecovery,
              ...(foodDrop
                ? { foodDrop: { item: foodDrop, lootMessage } }
                : {}),
            },
          });
          get().addLog("恭喜通关！", "system");
        }
      } else {
        set({
          character: leveledUpChar,
          inventory: newInventory,
          currentMonster: null,
          monsterIndex: state.monsterIndex + 1,
          isPlayerTurn: true,
          battlePhase: "idle",
          battleTransitionText: "",
          rewardModal: {
            show: true,
            exp: reward.exp,
            gold: reward.gold,
            mpRecovery,
            ...(foodDrop ? { foodDrop: { item: foodDrop, lootMessage } } : {}),
          },
        });
      }
      return;
    }

    if (
      skill.effect.type === "damage" &&
      state.currentMonster &&
      !monsterDefeated
    ) {
      set((s) => ({
        character: { ...s.character, mp: s.character.mp - mpCost },
        currentMonster: { ...s.currentMonster!, hp: newMonsterHp },
        isPlayerTurn: false,
      }));
    }

    if (!monsterDefeated && state.currentMonster) {
      setTimeout(() => {
        const liveState = get();
        if (!liveState.currentMonster) return;
        get().setBattlePhase(
          "monster-action",
          `${liveState.currentMonster.name}反击中...`,
        );
      }, 180);
    }

    setTimeout(() => {
      const state = get();
      if (!state.currentMonster) return;

      // 冰冻：跳过怪物行动，减少冻结回合
      if (
        state.currentMonster.frozenTurns &&
        state.currentMonster.frozenTurns > 0
      ) {
        const newFrozen = state.currentMonster.frozenTurns - 1;
        get().addLog(
          `${state.currentMonster.name}被封印，无法行动！（${newFrozen}回合）`,
          "system",
        );
        set({
          currentMonster: { ...state.currentMonster, frozenTurns: newFrozen },
          isPlayerTurn: true,
          battlePhase: "idle",
          battleTransitionText: "",
        });
        return;
      }

      const defenseBuff = state.character.buffs?.defenseBoost?.value || 0;
      const totalDefense =
        state.character.defense +
        (state.equipment.armor?.defense || 0) +
        defenseBuff;
      const totalEvasionRate = clampRate(
        state.character.evasionRate + (state.equipment.horse?.evasionRate || 0),
        EVASION_RATE_CAP,
      );
      const isEvaded = Math.random() < totalEvasionRate;
      const monsterIsCrit =
        !isEvaded && Math.random() < (state.currentMonster.critRate || 0);
      const monsterJitter = Math.floor(Math.random() * 11) - 5;
      const baseMonsterDamage = Math.max(
        1,
        state.currentMonster.attack - totalDefense + monsterJitter,
      );
      const monsterHitDamage = monsterIsCrit
        ? Math.floor(baseMonsterDamage * 1.5)
        : baseMonsterDamage;
      const monsterDamage = isEvaded ? 0 : monsterHitDamage;
      const newPlayerHp = Math.max(0, state.character.hp - monsterDamage);
      const monsterCritSuffix = monsterIsCrit ? "（暴击）" : "";
      const monsterLogMsg = isEvaded
        ? `你闪避了${state.currentMonster.name}的攻击！`
        : `${state.currentMonster.name}攻击了你，造成${monsterDamage}点伤害${monsterCritSuffix}`;
      get().addLog(monsterLogMsg, "monster");

      if (newPlayerHp <= 0) {
        get().addLog("你被击败了...", "system");
        set({
          character: { ...state.character, hp: 0, buffs: {} },
          deathModal: true,
          isPlayerTurn: false,
          battlePhase: "idle",
          battleTransitionText: "",
        });
        return;
      }

      const newBuffs = { ...state.character.buffs };
      if (newBuffs.attackBoost) {
        newBuffs.attackBoost = {
          ...newBuffs.attackBoost,
          turnsLeft: newBuffs.attackBoost.turnsLeft - 1,
        };
        if (newBuffs.attackBoost.turnsLeft <= 0) {
          delete newBuffs.attackBoost;
          get().addLog("狂暴效果已消失", "system");
        }
      }
      if (newBuffs.defenseBoost) {
        newBuffs.defenseBoost = {
          ...newBuffs.defenseBoost,
          turnsLeft: newBuffs.defenseBoost.turnsLeft - 1,
        };
        if (newBuffs.defenseBoost.turnsLeft <= 0) {
          delete newBuffs.defenseBoost;
          get().addLog("防御效果已消失", "system");
        }
      }

      set({
        character: { ...state.character, hp: newPlayerHp, buffs: newBuffs },
        isPlayerTurn: true,
        battlePhase: "idle",
        battleTransitionText: "",
      });
    }, 1000);
  },

  addLog: (message: string, type: BattleLogType = "system") =>
    set((state) => ({
      battleLog: [...state.battleLog.slice(-19), createLogEntry(message, type)],
    })),

  closeRewardModal: () =>
    set({ rewardModal: null, battlePhase: "idle", battleTransitionText: "" }),

  claimCycleReward: () => {
    const { rewardModal, inventory, cycle } = get();
    if (!rewardModal?.cycleReward) return;
    const newItems = [
      rewardModal.cycleReward.weapon,
      rewardModal.cycleReward.armor,
      rewardModal.cycleReward.helmet,
      rewardModal.cycleReward.horse,
      rewardModal.cycleReward.accessory,
    ];
    const currentState = createSnapshotFromState(get());
    const restoredCharacter = {
      ...currentState.character,
      hp: getEffectiveMaxHp(currentState.character, currentState.equipment),
      mp: currentState.character.maxMp,
      buffs: {},
    };

    const nextState: CoreGameState = {
      ...currentState,
      character: restoredCharacter,
      inventory: [...inventory, ...newItems],
      cycle: cycle + 1,
      monsterIndex: 0,
      showCycleReward: false,
      rewardModal: null,
      chapterIntro: createChapterIntroState(cycle + 1),
      currentMonster: null,
      battleLog: [],
      isPlayerTurn: true,
      deathModal: false,
      roundNumber: 0,
      battlePhase: "idle",
      battleTransitionText: "",
    };
    appendCycleCheckpoint(nextState, nextState.cycle);
    set(nextState);
    get().refreshCheckpoints();
  },

  dismissChapterIntroAndStartBattle: () => {
    set({ chapterIntro: null });
    get().startBattle();
  },

  resetGame: () =>
    set((state) => ({
      ...createCoreGameState(true),
      checkpoints: state.checkpoints,
      isHydrated: state.isHydrated,
    })),

  setHasSeenIntro: (playerName: string) => {
    const trimmedName = playerName.trim() || "勇者";
    const state = get();
    const existingNames = new Set(
      state.checkpoints.map((cp) => cp.playerName.trim().toLowerCase()),
    );
    if (existingNames.has(trimmedName.toLowerCase())) {
      return {
        success: false,
        message: "名字已被使用，请换一个名字。",
      };
    }

    set((s) => ({
      hasSeenIntro: true,
      chapterIntro: createChapterIntroState(1),
      character: { ...s.character, playerName: trimmedName },
      battlePhase: "idle",
      battleTransitionText: "",
    }));
    return { success: true };
  },

  initializePersistence: () => {
    if (globalThis.window === undefined) return;
    try {
      let activeFile = readAutoSaveFile();
      if (!activeFile) {
        const freshState = createCoreGameState(false);
        writeAutoSaveFile(freshState);
        activeFile = readAutoSaveFile();
      }

      let hydratedState: CoreGameState;
      try {
        hydratedState = activeFile
          ? createSnapshotFromState(activeFile.snapshot)
          : createCoreGameState();
      } catch {
        // Fallback to a fresh snapshot when existing save schema is broken.
        hydratedState = createCoreGameState(false);
        writeAutoSaveFile(hydratedState);
      }

      set({
        ...hydratedState,
        checkpoints: readCheckpointSummaries(),
        isHydrated: true,
        battlePhase: "idle",
        battleTransitionText: "",
      });
    } catch {
      // Last-resort fallback: always unblock UI from hydration screen.
      const fallback = createCoreGameState(false);
      set({
        ...fallback,
        checkpoints: [],
        isHydrated: true,
        battlePhase: "idle",
        battleTransitionText: "",
      });
    }
  },

  refreshCheckpoints: () => {
    if (globalThis.window === undefined) return;
    set({ checkpoints: readCheckpointSummaries() });
  },

  restartFromLastCheckpoint: () => {
    if (globalThis.window === undefined) return false;
    const files = readCycleCheckpointFiles().sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    const latest = files[0];
    if (!latest) return false;
    const snapshot = createSnapshotFromState(latest.snapshot);
    set({
      ...snapshot,
      deathModal: false,
      rewardModal: null,
      currentMonster: null,
      battleLog: [createLogEntry(`已回退到 Lv.${latest.cycle}`, "system")],
      checkpoints: readCheckpointSummaries(),
      isHydrated: true,
      battlePhase: "idle",
      battleTransitionText: "",
    });
    if (!snapshot.chapterIntro?.show) {
      get().startBattle();
    }
    return true;
  },

  loadCheckpoint: (checkpointId: string) => {
    if (globalThis.window === undefined) return false;
    const files = readCycleCheckpointFiles();
    const target = files.find((file) => file.id === checkpointId);
    if (!target) return false;

    const snapshot = createSnapshotFromState(target.snapshot);
    set({
      ...snapshot,
      deathModal: false,
      rewardModal: null,
      currentMonster: null,
      battleLog: [
        createLogEntry(
          `已载入 ${target.snapshot.character.playerName || target.snapshot.character.name}（Lv.${target.cycle} 记录）`,
          "system",
        ),
      ],
      checkpoints: readCheckpointSummaries(),
      isHydrated: true,
      battlePhase: "idle",
      battleTransitionText: "",
    });
    if (!snapshot.chapterIntro?.show) {
      get().startBattle();
    }
    return true;
  },

  deleteCheckpoint: (checkpointId: string) => {
    if (globalThis.window === undefined) return false;
    const files = readCycleCheckpointFiles();
    const nextFiles = files.filter((file) => file.id !== checkpointId);
    if (nextFiles.length === files.length) return false;
    writeCycleCheckpointFiles(nextFiles);
    set({ checkpoints: readCheckpointSummaries() });
    return true;
  },

  startNewGame: () =>
    set((state) => ({
      ...createCoreGameState(false),
      checkpoints: state.checkpoints,
      isHydrated: state.isHydrated,
      battlePhase: "idle",
      battleTransitionText: "",
    })),

  clearAllProgress: () => {
    if (globalThis.window === undefined) return;
    globalThis.localStorage.removeItem(AUTO_SAVE_KEY);
    globalThis.localStorage.removeItem(CYCLE_CHECKPOINTS_KEY);

    const freshState = createCoreGameState(false);
    writeAutoSaveFile(freshState);

    set({
      ...freshState,
      checkpoints: [],
      isHydrated: true,
    });
  },
}));

let hasRegisteredSaveSubscription = false;

const persistCurrentActiveSlot = (state: GameStore) => {
  if (globalThis.window === undefined || !state.isHydrated) return;
  writeAutoSaveFile(createSnapshotFromState(state));
};

if (globalThis.window !== undefined && !hasRegisteredSaveSubscription) {
  hasRegisteredSaveSubscription = true;
  useGameStore.subscribe((state) => {
    persistCurrentActiveSlot(state);
  });
}
