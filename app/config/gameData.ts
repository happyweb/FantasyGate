import type { Skill } from "@/types/game";

// 难度等级配置
export const CYCLE_CONFIG = [
  { name: "简单", multiplier: 1, color: "#10b981", title: "新手" },
  { name: "普通", multiplier: 2, color: "#3b82f6", title: "勇者" },
  { name: "困难", multiplier: 3, color: "#a855f7", title: "精英" },
  { name: "史诗", multiplier: 4, color: "#ec4899", title: "大师" },
  { name: "传说", multiplier: 5, color: "#f97316", title: "传说" },
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

// 10 个怪物基础数据（攻防已预乘削弱系数：前6关×0.8，后4关×0.7）
export const MONSTER_DATA = [
  { name: "史莱姆", hp: 100, attack: 25, defense: 5 },
  { name: "哥布林", hp: 112, attack: 27, defense: 7 },
  { name: "骷髅兵", hp: 124, attack: 29, defense: 8 },
  { name: "蜥蜴人", hp: 136, attack: 31, defense: 10 },
  { name: "半兽人", hp: 148, attack: 33, defense: 12 },
  { name: "暗影刺客", hp: 160, attack: 35, defense: 13 },
  { name: "石像鬼", hp: 178, attack: 36, defense: 15 },
  { name: "火焰恶魔", hp: 190, attack: 37, defense: 17 },
  { name: "黑暗骑士", hp: 198, attack: 39, defense: 18 },
  { name: "龙族守卫", hp: 206, attack: 40, defense: 20 },
];

// 装备等级数据
export const EQUIPMENT_TIERS = {
  weapon: [
    {
      tier: 1,
      attack: 15,
      name: "新手之剑",
      description:
        "　　冒险者踏上旅途时的第一把武器，做工虽粗糙，却承载着无数勇者的梦想。锋刃虽钝，危急时刻依然能给予敌人有效打击。",
    },
    {
      tier: 2,
      attack: 35,
      name: "精铁长剑",
      description:
        "　　由精炼铁矿锻造而成，剑身修长笔直，平衡感极佳。经验丰富的铁匠花费数日打磨，是中级冒险者的可靠伙伴。",
    },
    {
      tier: 3,
      attack: 60,
      name: "秘银战刃",
      description:
        "　　以稀有秘银矿石铸造，剑身散发淡淡银色光芒。据说秘银能克制暗影生物，是深入地下城的必备利器。",
    },
    {
      tier: 4,
      attack: 90,
      name: "龙鳞巨剑",
      description:
        "　　以远古龙族鳞片为材料锻造，剑身坚硬无比，锋利异常。每一次挥砍都带着龙族的威压，令敌人胆寒。",
    },
    {
      tier: 5,
      attack: 110,
      name: "传说圣剑",
      description:
        "　　上古光明神赐予勇者的神圣武器，剑身刻有封印魔王的古老符文。据说只有真正的勇者才能发挥出它全部的力量。",
    },
  ],
  armor: [
    {
      tier: 1,
      defense: 15,
      name: "布甲",
      description:
        "　　由粗布缝制而成的简易护甲，防护力有限，但轻便透气。适合初出茅庐的冒险者穿戴，是踏上征途的第一件护身之物。",
    },
    {
      tier: 2,
      defense: 35,
      name: "皮甲",
      description:
        "　　以兽皮鞣制而成，经特殊处理后具有一定韧性。既能提供基本防护，又不影响行动灵活性，是中级冒险者的常见选择。",
    },
    {
      tier: 3,
      defense: 55,
      name: "锁子甲",
      description:
        "　　由数千个精铁环扣连接而成，防御力大幅提升。工艺复杂耗时，是经验丰富的铁匠才能打造的精品护甲。",
    },
    {
      tier: 4,
      defense: 80,
      name: "板甲",
      description:
        "　　以厚重精钢板材锻造，防御力极为出色。穿戴时行动略显迟缓，但面对强敌时能提供坚实可靠的保护。",
    },
    {
      tier: 5,
      defense: 95,
      name: "龙鳞甲",
      description:
        "　　以远古龙族鳞片编织而成，兼具轻盈与坚固。传说龙鳞能抵御魔法攻击，是传说级勇者的专属护甲。",
    },
  ],
  helmet: [
    {
      tier: 1,
      maxHpBonus: 20,
      name: "布帽",
      description:
        "　　简单的布制头盔，防护力微弱，但轻便舒适。初级冒险者的入门装备，在危险的旅途中聊胜于无。",
    },
    {
      tier: 2,
      maxHpBonus: 40,
      name: "皮盔",
      description:
        "　　以厚实兽皮制成，能有效缓冲来自头部的打击。经特殊处理的皮革既坚韧又轻便，是中级冒险者的实用选择。",
    },
    {
      tier: 3,
      maxHpBonus: 65,
      name: "铁盔",
      description:
        "　　由精铁锻造的标准战盔，造型威武，防护力出色。额前刻有简单纹饰，是王国正规军的标准配备之一。",
    },
    {
      tier: 4,
      maxHpBonus: 90,
      name: "精钢盔",
      description:
        "　　以高纯度精钢打造，盔体厚实，内衬柔软皮革。精心设计的通风孔既保证防护性，又不影响视野和呼吸。",
    },
    {
      tier: 5,
      maxHpBonus: 110,
      name: "龙鳞盔",
      description:
        "　　以龙族头骨碎片和鳞片精心打造，散发神秘光泽。据说佩戴者能感受到龙族的意志，在战斗中获得额外的勇气。",
    },
  ],
  horse: [
    {
      tier: 1,
      evasionRate: 0.06,
      name: "驯养小马",
      description:
        "　　陪伴新手勇者踏上冒险之路的温顺坐骑，能在关键时刻帮助骑手迅速侧身，显著提升闪避能力。",
    },
    {
      tier: 2,
      evasionRate: 0.14,
      name: "荒原战驹",
      description:
        "　　在荒原风沙中成长的战马，爆发力与耐力兼备，冲锋与变向时更容易规避敌方攻击。",
    },
    {
      tier: 3,
      evasionRate: 0.23,
      name: "影踪骏骑",
      description:
        "　　步伐轻灵、行动如风，能够在缠斗中快速变向，让骑手更从容地规避攻击。",
    },
    {
      tier: 4,
      evasionRate: 0.32,
      name: "苍雷梦魇",
      description:
        "　　传说中披着雷纹的高阶坐骑，奔袭时会拉出残影，大幅提升闪避与机动能力。",
    },
    {
      tier: 5,
      evasionRate: 0.4,
      name: "圣辉天马",
      description:
        "　　仅在传奇勇者身边现身的神圣坐骑，拥有极致机动性，是终局战斗中规避致命伤害的关键助力。",
    },
  ],
  accessory: [
    {
      tier: 1,
      critRate: 0.06,
      name: "裂纹护符",
      description:
        "　　刻有旧日符文的饰品，能在短暂瞬间强化攻击时机，提升暴击概率。",
    },
    {
      tier: 2,
      critRate: 0.14,
      name: "鹰眼吊坠",
      description: "　　蕴含敏锐感知之力的吊坠，让勇者更容易捕捉敌人的破绽。",
    },
    {
      tier: 3,
      critRate: 0.23,
      name: "破军徽章",
      description:
        "　　战场名将遗留的徽章，佩戴后攻击节奏更凌厉，暴击概率显著提高。",
    },
    {
      tier: 4,
      critRate: 0.32,
      name: "星辉圣环",
      description: "　　由星辰之力淬炼的圣环，可持续放大致命打击机会。",
    },
    {
      tier: 5,
      critRate: 0.4,
      name: "终焉王印",
      description: "　　象征最终试炼胜者的王印，将勇者的爆发力推至巅峰。",
    },
  ],
};
