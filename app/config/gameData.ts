import type { Skill } from "@/types/game";

// 难度等级配置
export const CYCLE_CONFIG = [
  { name: "比武草原", multiplier: 1, color: "#10b981", title: "雾原前线" },
  { name: "裂岩荒境", multiplier: 2, color: "#3b82f6", title: "裂石营地" },
  { name: "断垣古堡", multiplier: 3, color: "#a855f7", title: "古堡回廊" },
  { name: "风暴龙脊", multiplier: 4, color: "#ec4899", title: "高空裂谷" },
  { name: "深渊王座", multiplier: 5, color: "#f97316", title: "终焉王庭" },
];

export const getPlayerGrowthStatsByLevel = (level: number) => {
  const safeLevel = Math.max(1, Math.floor(level));
  const n = Math.max(safeLevel - 1, 0);

  // Mid/late game strengthened curve: levels 2-3 ramp harder, levels 4-5 keep solid growth.
  const midBoostSteps = Math.min(n, 2);
  const lateSteps = Math.max(n - 2, 0);
  // Fine-tune cycle 2: slightly raise survivability and MP budget without inflating later tiers.
  const lv2MaxMpBonus = safeLevel === 2 ? 6 : 0;
  const lv2DefenseBonus = safeLevel === 2 ? 4 : 0;
  return {
    maxHp: Math.round(
      100 * (1 + 0.38 * midBoostSteps + 0.27 * lateSteps + 0.016 * n * n),
    ),
    maxMp:
      Math.round(
        100 * (1 + 0.26 * midBoostSteps + 0.18 * lateSteps + 0.012 * n * n),
      ) + lv2MaxMpBonus,
    attack: Math.round(
      20 * (1 + 0.34 * midBoostSteps + 0.23 * lateSteps + 0.018 * n * n),
    ),
    defense:
      Math.round(
        10 * (1 + 0.4 * midBoostSteps + 0.26 * lateSteps + 0.017 * n * n),
      ) + lv2DefenseBonus,
  };
};

export const getSkillStrikePower = (
  level: number,
  totalAttack: number,
): number => {
  const safeLevel = Math.max(1, Math.floor(level));
  const coeff = 1.02 + 0.09 * (safeLevel - 1);
  const flat = 6 * safeLevel;
  return Math.floor(totalAttack * coeff + flat);
};

export const getSkillHealAmount = (level: number, maxHp: number): number => {
  const safeLevel = Math.max(1, Math.floor(level));
  const ratio = 0.15 + 0.023 * (safeLevel - 1);
  const flat = 6 * safeLevel;
  return Math.floor(maxHp * ratio + flat);
};

export const getSkillBuffRate = (level: number): number => {
  const safeLevel = Math.max(1, Math.floor(level));
  return 0.12 + 0.03 * (safeLevel - 1);
};

export const getSkillBuffFlatBonus = (
  level: number,
  buffType: "attack" | "defense",
): number => {
  const safeLevel = Math.max(1, Math.floor(level));
  const base = buffType === "attack" ? 10 : 8;
  const growth = buffType === "attack" ? 4 : 3;
  return base + growth * (safeLevel - 1);
};

export const getSkillSealChance = (level: number): number => {
  const safeLevel = Math.max(1, Math.floor(level));
  return Math.min(88, 45 + (safeLevel - 1) * 9);
};

const formatPercent = (value: number): string => {
  const percent = value * 100;
  return Number.isInteger(percent) ? `${percent}` : percent.toFixed(1);
};

export const getSkillEffectText = (
  skill: Skill,
  context?: { maxHp?: number; totalAttack?: number; totalDefense?: number },
): string => {
  const level = Math.max(1, Math.floor(skill.level));

  if (skill.id === "s1") {
    const coeff = 1.02 + 0.09 * (level - 1);
    const flat = 6 * level;
    const coeffText = Number.isInteger(coeff) ? `${coeff}` : coeff.toFixed(2);
    if (typeof context?.totalAttack === "number") {
      return `攻击${context.totalAttack}*${coeffText} + ${flat}附加伤害`;
    }
    return `攻击*${coeffText} + ${flat}附加伤害`;
  }

  if (skill.id === "s2") {
    if (typeof context?.maxHp === "number") {
      return `恢复约${getSkillHealAmount(level, context.maxHp)}点生命`;
    }
    const ratio = 0.15 + 0.023 * (level - 1);
    const flat = 6 * level;
    return `恢复最大生命${formatPercent(ratio)}% + ${flat}`;
  }

  if (skill.id === "s3" || skill.id === "s4") {
    const rate = getSkillBuffRate(level);
    const label = skill.id === "s3" ? "攻击" : "防御";
    const flat = getSkillBuffFlatBonus(
      level,
      skill.id === "s3" ? "attack" : "defense",
    );
    return `${label}提升${formatPercent(rate)}% + ${flat}，持续${skill.effect.duration || 7}回合`;
  }

  if (skill.id === "s5") {
    return `封印概率${getSkillSealChance(level)}%，持续${skill.effect.duration || 3}回合`;
  }

  return "";
};

export const getCycleColorByTier = (tier?: number) => {
  if (!tier || Number.isNaN(tier)) return CYCLE_CONFIG[0].color;
  const safeTier = Math.min(Math.max(Math.floor(tier), 1), CYCLE_CONFIG.length);
  return CYCLE_CONFIG[safeTier - 1].color;
};

export const resolveItemTier = (item?: { tier?: number; id?: string }) => {
  if (item?.tier && !Number.isNaN(item.tier)) {
    return Math.min(Math.max(Math.floor(item.tier), 1), CYCLE_CONFIG.length);
  }

  if (item?.id) {
    const tierRegex = /_t(\d+)_/i;
    const matched = tierRegex.exec(item.id);
    if (matched?.[1]) {
      const parsed = Number.parseInt(matched[1], 10);
      if (!Number.isNaN(parsed)) {
        return Math.min(Math.max(parsed, 1), CYCLE_CONFIG.length);
      }
    }
  }

  return undefined;
};

export const getCycleColorByItem = (item?: { tier?: number; id?: string }) =>
  getCycleColorByTier(resolveItemTier(item));

const hexToRgb = (hex: string) => {
  const normalized = hex.replace("#", "");
  const isShort = normalized.length === 3;
  const expanded = isShort
    ? normalized
        .split("")
        .map((ch) => `${ch}${ch}`)
        .join("")
    : normalized;
  const value = Number.parseInt(expanded, 16);
  if (Number.isNaN(value)) return { r: 16, g: 185, b: 129 };
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
};

export const getEquipmentGlowStyleByItem = (item?: {
  tier?: number;
  id?: string;
}) => {
  const color = getCycleColorByItem(item);
  const { r, g, b } = hexToRgb(color);
  return {
    background: `radial-gradient(circle at 50% 50%, rgba(${r}, ${g}, ${b}, 0.13) 0%, rgba(${r}, ${g}, ${b}, 0.09) 26%, rgba(${r}, ${g}, ${b}, 0.055) 46%, rgba(${r}, ${g}, ${b}, 0.026) 64%, rgba(${r}, ${g}, ${b}, 0.01) 78%, rgba(${r}, ${g}, ${b}, 0.003) 90%, rgba(${r}, ${g}, ${b}, 0) 100%)`,
    borderRadius: "999px",
    padding: "2px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  };
};

type MonsterBaseStats = {
  hp: number;
  attack: number;
  defense: number;
};

export type MonsterConfig = {
  id: string;
  name: string;
  level: number;
  stage: number;
  mapName: string;
  image: string;
  description: string;
  baseStats: MonsterBaseStats;
  hp: number;
  attack: number;
  defense: number;
  critRate: number;
  evasionRate: number;
  reward: {
    exp: number;
    gold: number;
  };
};

const MONSTER_RATE_CAP = 0.2;
const MONSTER_RATE_BY_LEVEL: Record<number, number> = {
  1: 0.03,
  2: 0.07,
  3: 0.12,
  4: 0.16,
  5: 0.2,
};

const resolveMonsterRateByLevel = (level: number): number => {
  const safeLevel = Math.min(Math.max(Math.floor(level), 1), 5);
  return Math.min(MONSTER_RATE_CAP, MONSTER_RATE_BY_LEVEL[safeLevel] ?? 0);
};

export const WORLD_MAPS = [
  {
    level: 1,
    name: "比武草原",
    theme:
      "雾原前线昼夜潮湿，草脊与浅沼交错成天然猎场，白猿王的号角始终在地平线回荡。",
  },
  {
    level: 2,
    name: "裂岩荒境",
    theme: "裂石营地下方是纵横矿坑与熔岩暗道，混编部族围绕矿巢发动高频突袭。",
  },
  {
    level: 3,
    name: "断垣古堡",
    theme: "古堡回廊在月蚀夜与血宴大厅重叠，夜行眷属借黑潮扩张狩猎半径。",
  },
  {
    level: 4,
    name: "风暴龙脊",
    theme:
      "高空裂谷被雷暴与孢雾长期撕扯，异植群落与龙裔巡军在立体战场同步围猎。",
  },
  {
    level: 5,
    name: "深渊王座",
    theme: "终焉王庭以深井连接亡骸祭坛，焚冠冥皇统御冥火骸军执行最终封锁。",
  },
] as const;

const MONSTER_DATA_RAW: Array<Omit<MonsterConfig, "critRate" | "evasionRate">> =
  [
    {
      id: "m-lv1-1",
      name: "花背沼蛙",
      level: 1,
      stage: 1,
      mapName: "比武草原",
      image: "/logo/monster/m-lv1-1.webp",
      description:
        "雨季沼泽孵化的花背沼蛙会喷出滑腻毒涎，先封住脚步再扑咬喉侧。它常潜在浅水倒影里等待失位者，是雾原前线最阴险的伏击手。",
      baseStats: { hp: 100, attack: 25, defense: 5 },
      hp: 100,
      attack: 25,
      defense: 5,
      reward: { exp: 10, gold: 50 },
    },
    {
      id: "m-lv1-2",
      name: "巨角麋鹿",
      level: 1,
      stage: 2,
      mapName: "比武草原",
      image: "/logo/monster/m-lv1-2.webp",
      description:
        "巨角麋鹿以沉重鹿角劈开草脊，短程冲撞足以撕裂前排阵形。每逢晨雾降临，它会沿风脊反复试探防线缺口。",
      baseStats: { hp: 112, attack: 27, defense: 7 },
      hp: 112,
      attack: 27,
      defense: 7,
      reward: { exp: 10, gold: 56 },
    },
    {
      id: "m-lv1-3",
      name: "长牙灰狼",
      level: 1,
      stage: 3,
      mapName: "比武草原",
      image: "/logo/monster/m-lv1-3.webp",
      description:
        "长牙灰狼由头狼指挥分层围猎，先以假退诱你追击，再从盲侧合围。它们在草海奔行无声，最擅长拖垮急躁的对手。",
      baseStats: { hp: 124, attack: 29, defense: 8 },
      hp: 124,
      attack: 29,
      defense: 8,
      reward: { exp: 10, gold: 61 },
    },
    {
      id: "m-lv1-4",
      name: "裂壳沙蝎",
      level: 1,
      stage: 4,
      mapName: "比武草原",
      image: "/logo/monster/m-lv1-4.webp",
      description:
        "裂壳沙蝎栖在温热砂层下，尾针带着短效麻痹毒素。你若在它第一次试探后仍强攻，往往会被第二次突刺直接定住。",
      baseStats: { hp: 136, attack: 31, defense: 10 },
      hp: 136,
      attack: 31,
      defense: 10,
      reward: { exp: 10, gold: 67 },
    },
    {
      id: "m-lv1-5",
      name: "赤纹毒蛛",
      level: 1,
      stage: 5,
      mapName: "比武草原",
      image: "/logo/monster/m-lv1-5.webp",
      description:
        "赤纹毒蛛把蛛网织成半透明陷阱，红纹会在夜色里一闪而过。许多新兵直到护踝被黏住，才意识到自己已进网心。",
      baseStats: { hp: 148, attack: 33, defense: 12 },
      hp: 148,
      attack: 33,
      defense: 12,
      reward: { exp: 10, gold: 72 },
    },
    {
      id: "m-lv1-6",
      name: "蝎尾狮兽",
      level: 1,
      stage: 6,
      mapName: "比武草原",
      image: "/logo/monster/m-lv1-6.webp",
      description:
        "蝎尾狮兽是荒兽杂交失败后幸存的暴烈个体，狮吼与尾刺总成连击。它喜欢先逼退持盾者，再扑向阵后法师。",
      baseStats: { hp: 160, attack: 35, defense: 13 },
      hp: 160,
      attack: 35,
      defense: 13,
      reward: { exp: 10, gold: 78 },
    },
    {
      id: "m-lv1-7",
      name: "獠刃剑齿虎",
      level: 1,
      stage: 7,
      mapName: "比武草原",
      image: "/logo/monster/m-lv1-7.webp",
      description:
        "獠刃剑齿虎在出手前总会低伏蓄力，那一瞬安静得像风停。等它弹起时，最坚固的护腿也会被獠刃撕出豁口。",
      baseStats: { hp: 178, attack: 36, defense: 15 },
      hp: 178,
      attack: 36,
      defense: 15,
      reward: { exp: 10, gold: 83 },
    },
    {
      id: "m-lv1-8",
      name: "树背古龟",
      level: 1,
      stage: 8,
      mapName: "比武草原",
      image: "/logo/monster/m-lv1-8.webp",
      description:
        "树背古龟背甲长满苔木与硬藤，远看像一块会移动的矮丘。它推进缓慢却从不停步，专门把战斗拖进消耗泥潭。",
      baseStats: { hp: 190, attack: 37, defense: 17 },
      hp: 190,
      attack: 37,
      defense: 17,
      reward: { exp: 10, gold: 89 },
    },
    {
      id: "m-lv1-9",
      name: "风翼狮鹫",
      level: 1,
      stage: 9,
      mapName: "比武草原",
      image: "/logo/monster/m-lv1-9.webp",
      description:
        "风翼狮鹫借上升气流俯冲，利喙总挑护甲接缝下手。若你抬头太晚，它已完成一轮抓击并重新拉升。",
      baseStats: { hp: 198, attack: 39, defense: 18 },
      hp: 198,
      attack: 39,
      defense: 18,
      reward: { exp: 10, gold: 94 },
    },
    {
      id: "m-lv1-10",
      name: "霜鬃白猿王",
      level: 1,
      stage: 10,
      mapName: "比武草原",
      image: "/logo/monster/m-lv1-10.webp",
      description:
        "霜鬃白猿王以裂石重拳统御兽群，怒吼会让周遭荒兽同时暴走。它是雾原前线的原始王者，也是第一道真正的关门考验。",
      baseStats: { hp: 206, attack: 40, defense: 20 },
      hp: 206,
      attack: 40,
      defense: 20,
      reward: { exp: 10, gold: 100 },
    },
    {
      id: "m-lv2-1",
      name: "荒窟兽人",
      level: 2,
      stage: 1,
      mapName: "裂岩荒境",
      image: "/logo/monster/m-lv2-1.webp",
      description:
        "荒窟兽人世代困守裂岩矿坑，骨骼粗壮到可徒手扳断矛杆。它们不惧受伤，只惧失去矿脉与巢道。",
      baseStats: { hp: 100, attack: 25, defense: 5 },
      hp: 200,
      attack: 50,
      defense: 10,
      reward: { exp: 10, gold: 50 },
    },
    {
      id: "m-lv2-2",
      name: "赤瞳狼人",
      level: 2,
      stage: 2,
      mapName: "裂岩荒境",
      image: "/logo/monster/m-lv2-2.png",
      description:
        "赤瞳狼人被矿巢瘴雾长期侵蚀，嗅觉被放大到近乎诅咒。只要你露出一丝血腥气，它就会贴地追到洞壁尽头。",
      baseStats: { hp: 112, attack: 27, defense: 7 },
      hp: 224,
      attack: 54,
      defense: 14,
      reward: { exp: 10, gold: 56 },
    },
    {
      id: "m-lv2-3",
      name: "断角牛头兵",
      level: 2,
      stage: 3,
      mapName: "裂岩荒境",
      image: "/logo/monster/m-lv2-3.webp",
      description:
        "断角牛头兵以残角为荣，把每道裂痕都当作战勋。它总在冲阵时顶开第一面盾，为后方蛮兵撕出突进通道。",
      baseStats: { hp: 124, attack: 29, defense: 8 },
      hp: 248,
      attack: 58,
      defense: 16,
      reward: { exp: 10, gold: 61 },
    },
    {
      id: "m-lv2-4",
      name: "裂鳞蜥人",
      level: 2,
      stage: 4,
      mapName: "裂岩荒境",
      image: "/logo/monster/m-lv2-4.webp",
      description:
        "裂鳞蜥人擅长湿岩地形作战，假退转身几乎没有停顿。许多追击者都倒在它回刺那一击，连呼喊都来不及发出。",
      baseStats: { hp: 136, attack: 31, defense: 10 },
      hp: 272,
      attack: 62,
      defense: 20,
      reward: { exp: 10, gold: 67 },
    },
    {
      id: "m-lv2-5",
      name: "独眼蛮巨人",
      level: 2,
      stage: 5,
      mapName: "裂岩荒境",
      image: "/logo/monster/m-lv2-5.webp",
      description:
        "独眼蛮巨人视域狭窄却力沉如山，木棍落地能震裂石台。它不讲战术，只把每一次挥砸都当成处刑。",
      baseStats: { hp: 148, attack: 33, defense: 12 },
      hp: 296,
      attack: 66,
      defense: 24,
      reward: { exp: 10, gold: 72 },
    },
    {
      id: "m-lv2-6",
      name: "木棒哥布林",
      level: 2,
      stage: 6,
      mapName: "裂岩荒境",
      image: "/logo/monster/m-lv2-6.webp",
      description:
        "木棒哥布林看似杂乱无章，实则靠尖哨统一节奏。它们最爱围着落单目标兜圈，等你转身迟一步才集体扑上。",
      baseStats: { hp: 160, attack: 35, defense: 13 },
      hp: 320,
      attack: 70,
      defense: 26,
      reward: { exp: 10, gold: 78 },
    },
    {
      id: "m-lv2-7",
      name: "长矛地精",
      level: 2,
      stage: 7,
      mapName: "裂岩荒境",
      image: "/logo/monster/m-lv2-7.webp",
      description:
        "长矛地精长期盘踞高差地带，懂得用角度放大矛势。它会在你换位瞬间掷出第一矛，逼你被动交出节奏。",
      baseStats: { hp: 178, attack: 36, defense: 15 },
      hp: 356,
      attack: 72,
      defense: 30,
      reward: { exp: 10, gold: 83 },
    },
    {
      id: "m-lv2-8",
      name: "粗皮食人魔",
      level: 2,
      stage: 8,
      mapName: "裂岩荒境",
      image: "/logo/monster/m-lv2-8.webp",
      description:
        "粗皮食人魔靠脂肪与厚皮硬吃伤害，痛觉迟钝到近乎麻木。它越受伤越狂躁，后半段往往比开战时更危险。",
      baseStats: { hp: 190, attack: 37, defense: 17 },
      hp: 380,
      attack: 74,
      defense: 34,
      reward: { exp: 10, gold: 89 },
    },
    {
      id: "m-lv2-9",
      name: "重斧牛头人",
      level: 2,
      stage: 9,
      mapName: "裂岩荒境",
      image: "/logo/monster/m-lv2-9.webp",
      description:
        "重斧牛头人每次横扫都覆盖整片前场，逼迫对手反复后撤。若你的站位被压到墙角，它会毫不犹豫补上斩首重劈。",
      baseStats: { hp: 198, attack: 39, defense: 18 },
      hp: 396,
      attack: 78,
      defense: 36,
      reward: { exp: 10, gold: 94 },
    },
    {
      id: "m-lv2-10",
      name: "磐岳石王",
      level: 2,
      stage: 10,
      mapName: "裂岩荒境",
      image: "/logo/monster/m-lv2-10.webp",
      description:
        "磐岳石王胸腔岩核随怒意鼓动，能召碎岩在身前结成护壁。当它踏碎地面前冲时，整条裂石营地都会跟着震鸣。",
      baseStats: { hp: 206, attack: 40, defense: 20 },
      hp: 412,
      attack: 80,
      defense: 40,
      reward: { exp: 10, gold: 100 },
    },
    {
      id: "m-lv3-1",
      name: "暗廊蝠群",
      level: 3,
      stage: 1,
      mapName: "断垣古堡",
      image: "/logo/monster/m-lv3-1.webp",
      description:
        "暗廊蝠群倒悬在古堡穹裂里，以回声定位所有火源与脚步。你每一次急促呼吸，都会成为它们集体俯冲的信号。",
      baseStats: { hp: 100, attack: 25, defense: 5 },
      hp: 300,
      attack: 75,
      defense: 15,
      reward: { exp: 10, gold: 50 },
    },
    {
      id: "m-lv3-2",
      name: "夜幕潜行者",
      level: 3,
      stage: 2,
      mapName: "断垣古堡",
      image: "/logo/monster/m-lv3-2.webp",
      description:
        "夜幕潜行者曾是古堡雇佣剑手，月蚀后只剩猎杀本能。它披着吸光斗篷绕墙贴行，专挑最疲惫的人开刀。",
      baseStats: { hp: 112, attack: 27, defense: 7 },
      hp: 336,
      attack: 81,
      defense: 21,
      reward: { exp: 10, gold: 56 },
    },
    {
      id: "m-lv3-3",
      name: "猩红仆从",
      level: 3,
      stage: 3,
      mapName: "断垣古堡",
      image: "/logo/monster/m-lv3-3.webp",
      description:
        "猩红仆从仍保留侍者礼仪，举止端正却眼神空洞。它会在鞠躬瞬间拔刃突刺，把宴厅门廊变成屠宰线。",
      baseStats: { hp: 124, attack: 29, defense: 8 },
      hp: 372,
      attack: 87,
      defense: 24,
      reward: { exp: 10, gold: 61 },
    },
    {
      id: "m-lv3-4",
      name: "角冠魔裔",
      level: 3,
      stage: 4,
      mapName: "断垣古堡",
      image: "/logo/monster/m-lv3-4.webp",
      description:
        "角冠魔裔把撞角当成荣耀象征，冲阵前会以蹄刃刮地蓄势。门栓与塔盾在它面前都只是会碎裂的木片。",
      baseStats: { hp: 136, attack: 31, defense: 10 },
      hp: 408,
      attack: 93,
      defense: 30,
      reward: { exp: 10, gold: 67 },
    },
    {
      id: "m-lv3-5",
      name: "血宴魅影",
      level: 3,
      stage: 5,
      mapName: "断垣古堡",
      image: "/logo/monster/m-lv3-5.webp",
      description:
        "血宴魅影以温柔低语诱导靠近，獠牙却在贴身一刻才显形。它最擅长制造错觉，让你误判真正的威胁方向。",
      baseStats: { hp: 148, attack: 33, defense: 12 },
      hp: 444,
      attack: 99,
      defense: 36,
      reward: { exp: 10, gold: 72 },
    },
    {
      id: "m-lv3-6",
      name: "夜棺亲王",
      level: 3,
      stage: 6,
      mapName: "断垣古堡",
      image: "/logo/monster/m-lv3-6.webp",
      description:
        "夜棺亲王统领古堡内廷血裔，血术与黑雾同频释放。它从不急于终结，而是先把你拖进持续失衡的节奏。",
      baseStats: { hp: 160, attack: 35, defense: 13 },
      hp: 480,
      attack: 105,
      defense: 39,
      reward: { exp: 10, gold: 78 },
    },
    {
      id: "m-lv3-7",
      name: "蛇发祭司",
      level: 3,
      stage: 7,
      mapName: "断垣古堡",
      image: "/logo/monster/m-lv3-7.webp",
      description:
        "蛇发祭司借群蛇共享视野，能提前读出撤退路线。它的石化咒印不会立刻发作，却会在关键回合锁死退路。",
      baseStats: { hp: 178, attack: 36, defense: 15 },
      hp: 534,
      attack: 108,
      defense: 45,
      reward: { exp: 10, gold: 83 },
    },
    {
      id: "m-lv3-8",
      name: "裂翼巡猎龙",
      level: 3,
      stage: 8,
      mapName: "断垣古堡",
      image: "/logo/monster/m-lv3-8.webp",
      description:
        "裂翼巡猎龙常在塔脊上空盘旋，俯冲抓击后立刻拔高脱离。若你追着它抬头，它已把下一击角度调好。",
      baseStats: { hp: 190, attack: 37, defense: 17 },
      hp: 570,
      attack: 111,
      defense: 51,
      reward: { exp: 10, gold: 89 },
    },
    {
      id: "m-lv3-9",
      name: "深渊独眼魔",
      level: 3,
      stage: 9,
      mapName: "断垣古堡",
      image: "/logo/monster/m-lv3-9.webp",
      description:
        "深渊独眼魔由不稳定传送门溢出，触须会持续分泌减速黏液。它不追求爆发，而是让整条战线慢慢失去反击能力。",
      baseStats: { hp: 198, attack: 39, defense: 18 },
      hp: 594,
      attack: 117,
      defense: 54,
      reward: { exp: 10, gold: 94 },
    },
    {
      id: "m-lv3-10",
      name: "狱炎地狱犬王",
      level: 3,
      stage: 10,
      mapName: "断垣古堡",
      image: "/logo/monster/m-lv3-10.webp",
      description:
        "狱炎地狱犬王守着火井祭坛，三首嚎叫能唤醒地砖余烬。你若在它第三次咆哮前仍未破势，战场会被彻底点燃。",
      baseStats: { hp: 206, attack: 40, defense: 20 },
      hp: 618,
      attack: 120,
      defense: 60,
      reward: { exp: 10, gold: 100 },
    },
    {
      id: "m-lv4-1",
      name: "噬金拟态箱",
      level: 4,
      stage: 1,
      mapName: "风暴龙脊",
      image: "/logo/monster/m-lv4-1.webp",
      description:
        "噬金拟态箱会伪装成破损宝箱，连铰链声都模仿得惟妙惟肖。伸手开锁的一刻，它的金属颚会猛然合拢反噬。",
      baseStats: { hp: 100, attack: 25, defense: 5 },
      hp: 400,
      attack: 100,
      defense: 20,
      reward: { exp: 10, gold: 50 },
    },
    {
      id: "m-lv4-2",
      name: "噬光花妖",
      level: 4,
      stage: 2,
      mapName: "风暴龙脊",
      image: "/logo/monster/m-lv4-2.webp",
      description:
        "噬光花妖靠荧瓣引路，越明亮的花心越接近致命距离。它咬碎火把后会立刻扩散孢粉，让视野在几息内塌缩。",
      baseStats: { hp: 112, attack: 27, defense: 7 },
      hp: 448,
      attack: 108,
      defense: 28,
      reward: { exp: 10, gold: 56 },
    },
    {
      id: "m-lv4-3",
      name: "雷棘树卫",
      level: 4,
      stage: 3,
      mapName: "风暴龙脊",
      image: "/logo/monster/m-lv4-3.webp",
      description:
        "雷棘树卫扎根峭壁风口，枝干甩击总伴随细密电弧。盔甲被电芒短暂麻痹时，连最熟练的格挡都会慢半拍。",
      baseStats: { hp: 124, attack: 29, defense: 8 },
      hp: 496,
      attack: 116,
      defense: 32,
      reward: { exp: 10, gold: 61 },
    },
    {
      id: "m-lv4-4",
      name: "蔷薇噬魂藤",
      level: 4,
      stage: 4,
      mapName: "风暴龙脊",
      image: "/logo/monster/m-lv4-4.webp",
      description:
        "蔷薇噬魂藤以芳香掩饰猎杀意图，藤蔓缠身后会持续抽离体力。它从不急着绞杀，而是让猎物在恐惧里一点点失衡。",
      baseStats: { hp: 136, attack: 31, defense: 10 },
      hp: 544,
      attack: 124,
      defense: 40,
      reward: { exp: 10, gold: 67 },
    },
    {
      id: "m-lv4-5",
      name: "棘背地行龙",
      level: 4,
      stage: 5,
      mapName: "风暴龙脊",
      image: "/logo/monster/m-lv4-5.webp",
      description:
        "棘背地行龙依靠厚尾扫场，短距突进像落岩一样沉重。前排只要出现一瞬松动，它就会把缺口撕成断层。",
      baseStats: { hp: 148, attack: 33, defense: 12 },
      hp: 592,
      attack: 132,
      defense: 48,
      reward: { exp: 10, gold: 72 },
    },
    {
      id: "m-lv4-6",
      name: "风暴飞龙",
      level: 4,
      stage: 6,
      mapName: "风暴龙脊",
      image: "/logo/monster/m-lv4-6.webp",
      description:
        "风暴飞龙常藏身雷云后缘，只在俯角最刁钻时吐息。等你看见灼光落下，队形通常已经来不及完整散开。",
      baseStats: { hp: 160, attack: 35, defense: 13 },
      hp: 640,
      attack: 140,
      defense: 52,
      reward: { exp: 10, gold: 78 },
    },
    {
      id: "m-lv4-7",
      name: "秘典幼龙",
      level: 4,
      stage: 7,
      mapName: "风暴龙脊",
      image: "/logo/monster/m-lv4-7.webp",
      description:
        "秘典幼龙守着失落卷库，吐息虽弱却带精神扰动龙语。它的每次低鸣都会打断施法节拍，逼你改走近战节奏。",
      baseStats: { hp: 178, attack: 36, defense: 15 },
      hp: 712,
      attack: 144,
      defense: 60,
      reward: { exp: 10, gold: 83 },
    },
    {
      id: "m-lv4-8",
      name: "龙脊守巢者",
      level: 4,
      stage: 8,
      mapName: "风暴龙脊",
      image: "/logo/monster/m-lv4-8.webp",
      description:
        "龙脊守巢者昼夜巡弋悬崖巢区，对龙卵附近目标绝不留情。它能在狭窄岩脊上完成高速转身，追击几乎不会断线。",
      baseStats: { hp: 190, attack: 37, defense: 17 },
      hp: 760,
      attack: 148,
      defense: 68,
      reward: { exp: 10, gold: 89 },
    },
    {
      id: "m-lv4-9",
      name: "晶脊暴君",
      level: 4,
      stage: 9,
      mapName: "风暴龙脊",
      image: "/logo/monster/m-lv4-9.webp",
      description:
        "晶脊暴君体表晶簇储存过载能量，怒吼时会触发扇形晶爆。被冲击命中的人会短暂失聪，连指令都难以及时传达。",
      baseStats: { hp: 198, attack: 39, defense: 18 },
      hp: 792,
      attack: 156,
      defense: 72,
      reward: { exp: 10, gold: 94 },
    },
    {
      id: "m-lv4-10",
      name: "天灾三首龙皇",
      level: 4,
      stage: 10,
      mapName: "风暴龙脊",
      image: "/logo/monster/m-lv4-10.webp",
      description:
        "天灾三首龙皇统御整条风暴龙脊，三首分掌焰流雷暴与风压。三重龙鸣合奏时，山体脉络都会像被刀锋切开。",
      baseStats: { hp: 206, attack: 40, defense: 20 },
      hp: 824,
      attack: 160,
      defense: 80,
      reward: { exp: 10, gold: 100 },
    },
    {
      id: "m-lv5-1",
      name: "绷带守墓者",
      level: 5,
      stage: 1,
      mapName: "深渊王座",
      image: "/logo/monster/m-lv5-1.webp",
      description:
        "绷带守墓者由古咒驱动，动作迟缓却能无休止缠锁目标。它一旦贴住前排，后续亡骸就会沿缝隙蜂拥而上。",
      baseStats: { hp: 100, attack: 25, defense: 5 },
      hp: 500,
      attack: 125,
      defense: 25,
      reward: { exp: 10, gold: 50 },
    },
    {
      id: "m-lv5-2",
      name: "枯骨行者",
      level: 5,
      stage: 2,
      mapName: "深渊王座",
      image: "/logo/monster/m-lv5-2.png",
      description:
        "枯骨行者是王庭最廉价也最持久的亡兵，靠数量压榨耐力。它们没有情绪与恐惧，只会持续执行推进指令。",
      baseStats: { hp: 112, attack: 27, defense: 7 },
      hp: 560,
      attack: 135,
      defense: 35,
      reward: { exp: 10, gold: 56 },
    },
    {
      id: "m-lv5-3",
      name: "狂舞骸骨",
      level: 5,
      stage: 3,
      mapName: "深渊王座",
      image: "/logo/monster/m-lv5-3.webp",
      description:
        "狂舞骸骨在冥火鼓点下扭动前行，步伐诡异却异常齐整。你若被它节奏牵着走，出手窗口会被逐回合吞没。",
      baseStats: { hp: 124, attack: 29, defense: 8 },
      hp: 620,
      attack: 145,
      defense: 40,
      reward: { exp: 10, gold: 61 },
    },
    {
      id: "m-lv5-4",
      name: "朽甲骷髅兵",
      level: 5,
      stage: 4,
      mapName: "深渊王座",
      image: "/logo/monster/m-lv5-4.webp",
      description:
        "朽甲骷髅兵保留生前军阵记忆，盾剑联动近乎机械精确。面对它们时，单点突破往往会被整列反压回来。",
      baseStats: { hp: 136, attack: 31, defense: 10 },
      hp: 680,
      attack: 155,
      defense: 50,
      reward: { exp: 10, gold: 67 },
    },
    {
      id: "m-lv5-5",
      name: "幽兜噬魂者",
      level: 5,
      stage: 5,
      mapName: "深渊王座",
      image: "/logo/monster/m-lv5-5.png",
      description:
        "幽兜噬魂者披着吸光长袍游走侧翼，只在最暗处出手。它的第一击不一定最重，却常是让队形崩解的起点。",
      baseStats: { hp: 148, attack: 33, defense: 12 },
      hp: 740,
      attack: 165,
      defense: 60,
      reward: { exp: 10, gold: 72 },
    },
    {
      id: "m-lv5-6",
      name: "收魂摆渡者",
      level: 5,
      stage: 6,
      mapName: "深渊王座",
      image: "/logo/monster/m-lv5-6.webp",
      description:
        "收魂摆渡者执镰巡场，专门收割残血与断线目标。它不争先手，只等你资源见底时给出最后一刀。",
      baseStats: { hp: 160, attack: 35, defense: 13 },
      hp: 800,
      attack: 175,
      defense: 65,
      reward: { exp: 10, gold: 78 },
    },
    {
      id: "m-lv5-7",
      name: "冥宴侍骨",
      level: 5,
      stage: 7,
      mapName: "深渊王座",
      image: "/logo/monster/m-lv5-7.webp",
      description:
        "冥宴侍骨端着亡宴器具巡行王庭，咒礼会持续削弱意志。看似缓慢的礼节循环，实则是精密的消耗仪式。",
      baseStats: { hp: 178, attack: 36, defense: 15 },
      hp: 890,
      attack: 180,
      defense: 75,
      reward: { exp: 10, gold: 83 },
    },
    {
      id: "m-lv5-8",
      name: "冠冕巫骨王",
      level: 5,
      stage: 8,
      mapName: "深渊王座",
      image: "/logo/monster/m-lv5-8.webp",
      description:
        "冠冕巫骨王以王座法印统御骸潮，周边亡灵会被不断强化。只要它手杖仍在发光，战场就会持续向深渊倾斜。",
      baseStats: { hp: 190, attack: 37, defense: 17 },
      hp: 950,
      attack: 185,
      defense: 85,
      reward: { exp: 10, gold: 89 },
    },
    {
      id: "m-lv5-9",
      name: "紫焰魔颅",
      level: 5,
      stage: 9,
      mapName: "深渊王座",
      image: "/logo/monster/m-lv5-9.webp",
      description:
        "紫焰魔颅悬空巡弋，角焰会点燃灵魂并放大恐惧回声。它最可怕的不是灼烧，而是让整队判断同时失真。",
      baseStats: { hp: 198, attack: 39, defense: 18 },
      hp: 990,
      attack: 195,
      defense: 90,
      reward: { exp: 10, gold: 94 },
    },
    {
      id: "m-lv5-10",
      name: "焚冠冥皇",
      level: 5,
      stage: 10,
      mapName: "深渊王座",
      image: "/logo/monster/m-lv5-10.webp",
      description:
        "焚冠冥皇坐镇终焉王庭，冥火王冠能号令全域亡潮。击败它不仅是战斗胜利，更是让封印回廊再次闭合的终章。",
      baseStats: { hp: 206, attack: 40, defense: 20 },
      hp: 1030,
      attack: 200,
      defense: 100,
      reward: { exp: 10, gold: 100 },
    },
  ];

export const MONSTER_DATA: MonsterConfig[] = MONSTER_DATA_RAW.map(
  (monster) => ({
    ...monster,
    critRate: resolveMonsterRateByLevel(monster.level),
    evasionRate: resolveMonsterRateByLevel(monster.level),
  }),
);

export const getMonsterByLevelAndStage = (
  level: number,
  stageIndex: number,
): MonsterConfig => {
  const safeLevel = Math.min(Math.max(Math.floor(level), 1), WORLD_MAPS.length);
  const safeStage = Math.min(Math.max(Math.floor(stageIndex), 0), 9);
  return MONSTER_DATA[(safeLevel - 1) * 10 + safeStage];
};

// 装备等级数据
export const EQUIPMENT_TIERS = {
  weapon: [
    {
      tier: 1,
      attack: 15,
      name: "新手之剑",
      description:
        "城南铁匠学徒打出的第一批制式短剑，刃口不完美却重心扎实。很多传奇都从这把朴素铁刃开始写下第一行战报。",
    },
    {
      tier: 2,
      attack: 35,
      name: "精铁长剑",
      description:
        "以裂岩矿脉精铁反复回火而成，剑身细长、变招轻快。它不是最耀眼的武器，却是中段征途最可靠的同伴。",
    },
    {
      tier: 3,
      attack: 60,
      name: "秘银战刃",
      description:
        "秘银与星砂同炉熔铸，出鞘时会泛起冷白弧光。面对暗蚀血肉与诅咒结界，它总能比普通钢刃更早撕开缺口。",
    },
    {
      tier: 4,
      attack: 90,
      name: "龙鳞巨剑",
      description:
        "以古龙脱鳞重铸的双手巨剑，刃背厚重如墙。挥动时会带出压迫风压，常在一击之间改写正面战线。",
    },
    {
      tier: 5,
      attack: 110,
      name: "传说圣剑",
      description:
        "封印战争时代留存的圣剑本体，剑脊刻满祈光铭文。唯有意志与使命同频之人，才能唤醒它完整的审判之辉。",
    },
  ],
  armor: [
    {
      tier: 1,
      defense: 15,
      name: "布甲",
      description:
        "由前线后勤连夜缝制的轻型防具，胜在柔韧与透气。它挡不住重斩，却能让新兵多撑过一次致命误判。",
    },
    {
      tier: 2,
      defense: 35,
      name: "皮甲",
      description:
        "荒兽鞣皮与细链内衬拼接而成，兼顾机动与基础防护。常年在边境巡逻的斥候，把它称作最务实的保命甲。",
    },
    {
      tier: 3,
      defense: 55,
      name: "锁子甲",
      description:
        "数千枚精环逐个铆接的标准战甲，受力分散极其稳定。面对连击武器时，它能明显降低破甲后果。",
    },
    {
      tier: 4,
      defense: 80,
      name: "板甲",
      description:
        "整块精钢经热锻冷淬塑形，正面防护近乎壁垒。穿上它意味着放弃轻灵，换来在乱战中稳住阵芯的资格。",
    },
    {
      tier: 5,
      defense: 95,
      name: "龙鳞甲",
      description:
        "以高阶龙鳞与神殿丝线复合编织，轻而不脆、坚而不钝。传说它能削弱黑焰侵蚀，是终局之战的核心护具。",
    },
  ],
  helmet: [
    {
      tier: 1,
      maxHpBonus: 20,
      name: "布帽",
      description:
        "普通布帽内衬了薄皮护圈，能缓冲最常见的头部钝击。它不起眼，却常在第一场硬仗里救回一条命。",
    },
    {
      tier: 2,
      maxHpBonus: 40,
      name: "皮盔",
      description:
        "用整张兽颈皮裁制的轻盔，额骨位置额外加厚处理。对抗横扫与坠击时，它能显著减轻短暂眩晕。",
    },
    {
      tier: 3,
      maxHpBonus: 65,
      name: "铁盔",
      description:
        "王国常备军同款铁盔，结构均衡、视野开口合理。它代表纪律与标准，也是多数老兵最信任的头部防线。",
    },
    {
      tier: 4,
      maxHpBonus: 90,
      name: "精钢盔",
      description:
        "高纯精钢打造的封闭盔体，内衬缓冲层与导汗皮革。即便在长时鏖战中，也能保持稳定防护与清晰视域。",
    },
    {
      tier: 5,
      maxHpBonus: 110,
      name: "龙鳞盔",
      description:
        "龙颅碎片与细鳞熔接成冠，外层会反射幽暗咒光。佩戴者常报告听见低沉龙吟，那是勇气被唤醒的回声。",
    },
  ],
  horse: [
    {
      tier: 1,
      evasionRate: 0.06,
      name: "驯养小马",
      description:
        "边境牧场培育的温顺坐骑，听令快、惊吓阈值低。初入战场时，它能帮骑手稳住最关键的转向与后撤。",
    },
    {
      tier: 2,
      evasionRate: 0.14,
      name: "荒原战驹",
      description:
        "在风沙与碎石地长成的战马，爆发力与耐力同样扎实。它的急停与切线能力，让你更容易躲开重型追击。",
    },
    {
      tier: 3,
      evasionRate: 0.23,
      name: "影踪骏骑",
      description:
        "以夜训著称的轻型骏骑，蹄声被训练到几近无闻。缠斗中它能连续变向，把追兵一步步甩出攻击角。",
    },
    {
      tier: 4,
      evasionRate: 0.32,
      name: "苍雷梦魇",
      description:
        "披覆雷纹鬃毛的高阶坐骑，奔袭会拖出淡蓝残影。它擅长高速进退切换，是高危关卡里的生存核心。",
    },
    {
      tier: 5,
      evasionRate: 0.4,
      name: "圣辉天马",
      description:
        "只在封印继承者身边现身的神圣天马，翼辉可撕开浊雾。终局战中，它让你在绝境里仍保有一次完美闪避。",
    },
  ],
  accessory: [
    {
      tier: 1,
      critRate: 0.06,
      name: "裂纹护符",
      description:
        "刻着失传战纹的旧护符，会在杀意升起时微微发烫。它不直接增加力量，却总把致命一击推到正确时机。",
    },
    {
      tier: 2,
      critRate: 0.14,
      name: "鹰眼吊坠",
      description:
        "炼金镜片与银羽碎屑制成的吊坠，可强化瞬时聚焦。敌人露出破绽的刹那，它会先于直觉发出预警。",
    },
    {
      tier: 3,
      critRate: 0.23,
      name: "破军徽章",
      description:
        "破军军团统领遗留下的战徽，边缘仍留刀痕。佩戴后进攻节奏更锋利，连贯打击更容易触发重创。",
    },
    {
      tier: 4,
      critRate: 0.32,
      name: "星辉圣环",
      description:
        "星屑淬炼的圣环会在月下缓慢蓄辉，战时集中释放。它能持续抬高爆发上限，是压线翻盘的关键配件。",
    },
    {
      tier: 5,
      critRate: 0.4,
      name: "终焉王印",
      description:
        "封印战终局授予的王印，象征有资格直面冥皇。它会把持有者的杀伤窗口推至极限，代价是没有退路。",
    },
  ],
};
