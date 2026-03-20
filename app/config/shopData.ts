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
];
