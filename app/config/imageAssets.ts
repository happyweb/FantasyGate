// 图片资源配置（使用 /logo/ 路径）
export const ASSETS = {
  monsters: Array.from(
    { length: 10 },
    (_, i) => `/logo/monster/monster_${String(i + 1).padStart(2, "0")}.png`,
  ),

  equipment: {
    weapon: Array.from(
      { length: 5 },
      (_, i) => `/logo/weapon/weapon_${String(i + 1).padStart(2, "0")}.png`,
    ),
    armor: Array.from(
      { length: 5 },
      (_, i) => `/logo/armor/armor_${String(i + 1).padStart(2, "0")}.png`,
    ),
    helmet: Array.from(
      { length: 5 },
      (_, i) => `/logo/helmet/helmet_${String(i + 1).padStart(2, "0")}.png`,
    ),
    horse: Array.from(
      { length: 5 },
      (_, i) => `/logo/horse/horse_${String(i + 1).padStart(2, "0")}.png`,
    ),
    accessory: Array.from(
      { length: 5 },
      (_, i) => `/logo/ornament/ornament_${String(i + 1).padStart(2, "0")}.png`,
    ),
  },

  players: Array.from(
    { length: 5 },
    (_, i) => `/logo/user/user_${String(i + 1).padStart(2, "0")}.png`,
  ),

  ui: {
    gold: "/logo/others/gold.png",
    chest: "/logo/ui/chest.png",
    award: "/logo/others/award.png",
    pass: "/logo/others/pass.png",
    defense: "/logo/others/defense.png",
    thump: "/logo/others/thump.png",
    rage: "/logo/others/rage.png",
    medicine: "/logo/others/medicine.png",
    combat: "/logo/others/combat.png",
    magicArts: "/logo/others/magic-arts.png",
    box: "/logo/others/box.png",
    map: "/logo/others/map.png",
    init: "/logo/others/init.png",
    record: "/logo/others/record.png",
    humanSkeleton: "/logo/others/human-skeleton.png",
    empiricalValue: "/logo/others/empirical-value.png",
    frozen: "/logo/others/frozen.png",
    atk: "/logo/others/ATK.png",
    armorValue: "/logo/others/armor-value.png",
    criticalStrike: "/logo/others/critical-strike.png",
    dodge: "/logo/others/dodge.png",
  },

  food: {
    watermelon: "/logo/food/watermelon.png",
    largeHpPotion: "/logo/food/large-hp-potion.png",
    largeMpPotion: "/logo/food/large-mp-potion.png",
  },

  cdk: {
    vip666: "/logo/cdk/vip666.png",
    vip888: "/logo/cdk/vip888.png",
  },
};
