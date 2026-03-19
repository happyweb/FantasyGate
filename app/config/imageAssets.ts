// 图片资源配置（使用 /logo/ 路径）
export const ASSETS = {
  monsters: [
    "/logo/monster/monster_01.webp",
    "/logo/monster/monster_02.webp",
    "/logo/monster/monster_03.webp",
    "/logo/monster/monster_04.png",
    "/logo/monster/monster_05.png",
    "/logo/monster/monster_06.webp",
    "/logo/monster/monster_07.png",
    "/logo/monster/monster_08.webp",
    "/logo/monster/monster_09.webp",
    "/logo/monster/monster_10.webp",
  ],

  equipment: {
    weapon: Array.from(
      { length: 5 },
      (_, i) => `/logo/weapon/weapon_${String(i + 1).padStart(2, "0")}.png`,
    ),
    armor: [
      "/logo/armor/armor_01.png",
      "/logo/armor/armor_02.png",
      "/logo/armor/armor_03.png",
      "/logo/armor/armor_04.webp",
      "/logo/armor/armor_05.png",
    ],
    helmet: [
      "/logo/helmet/helmet_01.png",
      "/logo/helmet/helmet_02.webp",
      "/logo/helmet/helmet_03.png",
      "/logo/helmet/helmet_04.png",
      "/logo/helmet/helmet_05.webp",
    ],
    horse: [
      "/logo/horse/horse_01.png",
      "/logo/horse/horse_02.png",
      "/logo/horse/horse_03.png",
      "/logo/horse/horse_04.png",
      "/logo/horse/horse_05.webp",
    ],
    accessory: [
      "/logo/ornament/ornament_01.webp",
      "/logo/ornament/ornament_02.png",
      "/logo/ornament/ornament_03.png",
      "/logo/ornament/ornament_04.png",
      "/logo/ornament/ornament_05.png",
    ],
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
    shield: "/logo/others/shield.webp",
    thump: "/logo/others/thump.png",
    rage: "/logo/others/rage.png",
    medicine: "/logo/others/medicine.png",
    combat: "/logo/others/combat.png",
    magicArts: "/logo/others/magic-arts.png",
    box: "/logo/others/box.png",
    map: "/logo/others/map.png",
    init: "/logo/others/init.png",
    record: "/logo/others/record.webp",
    humanSkeleton: "/logo/others/human-skeleton.png",
    empiricalValue: "/logo/others/empirical-value.png",
    frozen: "/logo/others/frozen.png",
    atk: "/logo/others/ATK.png",
    armorValue: "/logo/others/armor-value.png",
    criticalStrike: "/logo/others/critical-strike.webp",
    dodge: "/logo/others/dodge.webp",
  },

  food: {
    watermelon: "/logo/food/watermelon.png",
    largeHpPotion: "/logo/food/large-hp-potion.png",
    largeMpPotion: "/logo/food/large-mp-potion.png",
  },

  cdk: {
    vip666: "/logo/cdk/vip666.png",
    vip888: "/logo/cdk/vip888.webp",
  },
};
