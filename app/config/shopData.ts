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
        "　　艾尔大陆南部沙漠绿洲中生长的神奇果实，果肉鲜红多汁，蕴含着大地的生命之力。",
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
        "　　由圣地神殿炼金术士秘制而成的高阶生命药剂，能在危急时快速恢复战力。",
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
        "　　封存月华与星屑的魔力药剂，可迅速回补大量蓝量，适合技能连发前使用。",
    },
  },
];
