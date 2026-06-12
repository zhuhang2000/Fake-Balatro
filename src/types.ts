export type Suit = '♠' | '♥' | '♦' | '♣';
export type CardColor = 'black' | 'red';
export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;

export type HandTypeKey =
  | 'sflush'
  | 'four'
  | 'full'
  | 'flush'
  | 'straight'
  | 'three'
  | 'twopair'
  | 'pair'
  | 'high';

export type GamePhase = 'boot' | 'play' | 'scoring' | 'cleared' | 'shop' | 'victory' | 'over';
export type SortMode = 'rank' | 'suit';
export type HandLevels = Record<HandTypeKey, number>;

export interface Card {
  id: number;
  suit: Suit;
  color: CardColor;
  rank: Rank;
  sel?: boolean;
  el?: HTMLElement;
}

export interface HandBaseStats {
  name: string;
  chips: number;
  mult: number;
}

export interface HandStats extends HandBaseStats {
  level: number;
}

export interface HandUpgrade {
  chips: number;
  mult: number;
}

export interface HandEval {
  key: HandTypeKey;
  name: string;
  level: number;
  baseChips: number;
  baseMult: number;
  scoring: Card[];
}

export interface JokerEffect {
  chips?: number;
  mult?: number;
  xmult?: number;
  gold?: number;
  glitch?: boolean;
}

export type JokerPattern = 'stripe' | 'check' | 'none';
export type JokerEye = 'dot' | 'x' | 'slit' | 'cyclops' | 'mixed' | 'coin' | 'o';
export type JokerMouth =
  | 'grin'
  | 'zigzag'
  | 'teeth'
  | 'wave'
  | 'stitch'
  | 'frown'
  | 'gasp'
  | 'goldtooth';
export type JokerMark = 'heart' | 'tear' | 'crown';

export interface JokerArt {
  bg: string;
  pat: JokerPattern;
  skin: string;
  eye: JokerEye;
  mouth: JokerMouth;
  split?: string;
  mark?: JokerMark;
}

export interface Joker {
  id: string;
  name: string;
  price: number;
  desc: string;
  art: JokerArt;
  perCard?: (card: Card, ev: HandEval) => JokerEffect | null;
  onHand?: (ev: HandEval, played: Card[]) => JokerEffect | null;
  el?: HTMLElement;
}

export interface ShopOffer {
  key: HandTypeKey;
  sold: boolean;
}

export interface ShopState {
  offers: Joker[];
  upgradeOffers: ShopOffer[];
}

export interface GameState {
  level: number;
  target: number;
  score: number;
  total: number;
  gold: number;
  handsLeft: number;
  discardsLeft: number;
  deck: Card[];
  hand: Card[];
  played: Card[];
  jokers: Joker[];
  maxJokers: number;
  handLevels: HandLevels;
  phase: GamePhase;
  sort: SortMode;
  endless: boolean;
}
