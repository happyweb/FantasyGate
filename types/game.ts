export interface Character {
  id: string;
  name: string;
  playerName?: string;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  attack: number;
  defense: number;
  critRate: number;
  evasionRate: number;
  level: number;
  exp: number;
  gold: number;
  buffs?: {
    attackBoost?: { value: number; turnsLeft: number };
    defenseBoost?: { value: number; turnsLeft: number };
  };
}

export interface Monster {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  critRate?: number;
  evasionRate?: number;
  frozenTurns?: number;
  reward: {
    exp: number;
    gold: number;
  };
}

export interface Item {
  id: string;
  name: string;
  tier?: number;
  type: "weapon" | "armor" | "helmet" | "horse" | "accessory" | "consumable";
  rarity?: "common" | "rare" | "epic" | "legendary";
  attack?: number;
  defense?: number;
  maxHpBonus?: number;
  critRate?: number;
  evasionRate?: number;
  healHp?: number;
  healMp?: number;
  healHpPct?: number;
  healMpPct?: number;
  image?: string;
  description?: string;
  stats?: {
    attack?: number;
    defense?: number;
    hp?: number;
    critRate?: number;
    evasionRate?: number;
  };
  icon?: string;
}

export interface Equipment {
  weapon?: Item;
  armor?: Item;
  helmet?: Item;
  horse?: Item;
  accessory?: Item;
}

export interface Skill {
  id: string;
  name: string;
  level: number;
  maxLevel: number;
  description: string;
  cost: {
    gold: number;
    mp: number;
  };
  effect: {
    type: "damage" | "heal" | "buff" | "debuff";
    value: number;
    buffType?: "attack" | "defense";
    debuffType?: "freeze";
    duration?: number;
  };
}

export type BattleLogType = "player" | "monster" | "system" | "round-end";

export type BattlePhase =
  | "idle"
  | "player-action"
  | "monster-action"
  | "transition";

export interface BattleLogEntry {
  id: string;
  message: string;
  type: BattleLogType;
}

export interface CycleCheckpoint {
  id: string;
  cycle: number;
  playerName: string;
  level: number;
  gold: number;
  createdAt: string;
}

export interface GameState {
  character: Character;
  equipment: Equipment;
  inventory: Item[];
  skills: Skill[];
  currentMonster: Monster | null;
  battleLog: BattleLogEntry[];
  isPlayerTurn: boolean;
  rewardModal: {
    show: boolean;
    finalVictory?: boolean;
    exp: number;
    gold: number;
    mpRecovery?: number;
    foodDrop?: {
      item: Item;
      lootMessage: string;
    };
    cycleReward?: {
      weapon: Item;
      armor: Item;
      helmet: Item;
      horse: Item;
      accessory: Item;
    };
  } | null;
  deathModal: boolean;
  monsterIndex: number;
  cycle: number;
  showCycleReward: boolean;
  hasSeenIntro: boolean;
  roundNumber: number;
  battlePhase: BattlePhase;
  battleTransitionText: string;
  redeemedCodes: string[];
  checkpoints: CycleCheckpoint[];
  isHydrated: boolean;
}
