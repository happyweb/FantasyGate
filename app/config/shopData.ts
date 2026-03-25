import { ASSETS } from "@/app/config/imageAssets";
import type { Item } from "@/types/game";

export type ShopCategory = "all" | "hp" | "mp";

export type ShopItem = {
  id: string;
  name: string;
  price: number;
  category: ShopCategory;
  item: Pick<
    Item,
    | "name"
    | "type"
    | "image"
    | "description"
    | "healHp"
    | "healHpPct"
    | "healMp"
    | "healMpPct"
    | "drainHpPct"
  >;
};

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: "shop_watermelon",
    name: "清凉西瓜",
    price: 70,
    category: "hp",
    item: {
      name: "清凉西瓜",
      type: "consumable",
      healHp: 100,
      image: ASSETS.food.watermelon,
      description:
        "南境绿洲培育的高含水战地果实，切开即带清甜凉气，适合战后稳住生命线。",
    },
  },
  {
    id: "shop_hp_potion",
    name: "赤焰生命",
    price: 140,
    category: "hp",
    item: {
      name: "赤焰生命",
      type: "consumable",
      healHpPct: 0.8,
      image: ASSETS.food.largeHpPotion,
      description:
        "神殿炼金所提炼的高阶生命药剂，专为高压关卡设计，能迅速拉回濒危血线。",
    },
  },
  {
    id: "shop_mp_potion",
    name: "幽蓝魔力",
    price: 200,
    category: "mp",
    item: {
      name: "幽蓝魔力",
      type: "consumable",
      healMpPct: 0.8,
      image: ASSETS.food.largeMpPotion,
      description:
        "封存月华与星屑精华的回魔药剂，可在短时间重建施法循环，适合连续爆发前使用。",
    },
  },
  {
    id: "shop_hotpot",
    name: "炙炎石锅饭",
    price: 80,
    category: "hp",
    item: {
      name: "炙炎石锅饭",
      type: "consumable",
      healHp: 80,
      image: ASSETS.food.food1,
      description:
        "战地伙头兵用炭火煨熟的石锅拌饭，焦香滚烫，一碗下肚能驱散疲乏，快速稳住受创的身体。",
    },
  },
  {
    id: "shop_seafood_bowl",
    name: "海珍大丼",
    price: 220,
    category: "hp",
    item: {
      name: "海珍大丼",
      type: "consumable",
      healHpPct: 0.5,
      healMpPct: 0.3,
      image: ASSETS.food.food2,
      description:
        "从海港运来的珍稀海鲜拼盘，营养丰沛，既能大幅修复战伤，又能滋养灵力加速回蓝。",
    },
  },
  {
    id: "shop_tomato_juice",
    name: "烈焰番茄汁",
    price: 120,
    category: "hp",
    item: {
      name: "烈焰番茄汁",
      type: "consumable",
      healHp: 50,
      healMp: 60,
      image: ASSETS.food.food3,
      description:
        "以烈日番茄榨制、混入芹香香料的战地特调，入喉火辣，能同时为血肉和灵脉注入活力。",
    },
  },
  {
    id: "shop_poison",
    name: "森幽毒液",
    price: 160,
    category: "mp",
    item: {
      name: "森幽毒液",
      type: "consumable",
      drainHpPct: 0.3,
      image: ASSETS.food.food4,
      description:
        "幽林深处淬炼的绿色毒液，骷髅头标记警示其代价。服下者以血肉为燃料，瞬间将魔力回复至满载。",
    },
  },
];
