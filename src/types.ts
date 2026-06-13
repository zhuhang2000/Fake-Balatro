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

export type CardStateKey = 'gilded' | 'cracked' | 'echo' | 'tainted';

export interface CardStateMeta {
  key: CardStateKey;
  name: string;
  badge: string;
  desc: string;
  color: string;
}

export interface CardStateProc {
  chips: number;
  gold: number;
  mult: number;
  echo: boolean;
  deckCrack: boolean;
  spreadChance: number;
}

export interface Card {
  id: number;
  suit: Suit;
  color: CardColor;
  rank: Rank;
  state?: CardStateKey | null;
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
  shatter?: boolean;
  infect?: boolean;
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

export interface ShopAnomaly {
  price: number;
  sold: boolean;
}

export interface ShopState {
  offers: Joker[];
  upgradeOffers: ShopOffer[];
  discount: number;
  mystery: ShopAnomaly | null;
  service: ShopAnomaly | null;
  risk: ShopAnomaly | null;
}

export interface LevelMods {
  suitBoost: { suit: Suit; chips: number } | null;
  nextHandMult: number;
  nextHandXMult: number;
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
  mods: LevelMods;
  pendingMutations: CardStateKey[];
  cleared: boolean;
  eventLog: EventLogEntry[];
}

export interface EventLogEntry {
  name: string;
  kind: EventKind;
  lines: string[];
}

export type EventKind = 'good' | 'bad' | 'mixed' | 'risk';
export type EventTrigger = 'levelStart' | 'afterScore';

export interface EventRng {
  rnd(a: number, b: number): number;
  ri(a: number, b: number): number;
  choice<T>(items: readonly T[]): T;
}

export interface EventOutcome {
  lines: string[];
}

export interface ChaosEvent {
  id: string;
  name: string;
  kind: EventKind;
  weight: number;
  trigger: EventTrigger;
  canFire(state: GameState): boolean;
  apply(state: GameState, rng: EventRng): EventOutcome;
}
export type DomQuery = <T extends Element = HTMLElement>(selector: string) => T;
export type NumberFormatter = (value: number) => string;

export interface ToneOptions {
  f?: number;
  f2?: number | null;
  type?: OscillatorType;
  dur?: number;
  vol?: number;
  at?: number;
}

export interface NoiseOptions {
  dur?: number;
  vol?: number;
  at?: number;
  ftype?: BiquadFilterType;
  f?: number;
  f2?: number | null;
  q?: number;
}

export interface SoundApi {
  ctx: AudioContext | null;
  init(): void;
  t(): number;
  tone(options?: ToneOptions): void;
  noise(options?: NoiseOptions): void;
  joker(index?: number): void;
}

export interface SfxApi {
  bigmult(): void;
  breakthrough(): void;
  buy(): void;
  coin(): void;
  crack(): void;
  deny(): void;
  discard(): void;
  draw(index?: number): void;
  echo(index?: number): void;
  edge(): void;
  event(kind: EventKind | string): void;
  gild(): void;
  joker(index?: number): void;
  lose(): void;
  mult(): void;
  overkill(): void;
  play(): void;
  select(on: boolean): void;
  settle(): void;
  shatter(): void;
  taint(): void;
  tick(index?: number): void;
  win(): void;
}

export interface FxApi {
  init(): void;
  sparks(x: number, y: number, color: string, count?: number, speed?: number): void;
  coins(x: number, y: number, count?: number): void;
  confetti(): void;
}

export interface VisualsDeps {
  $: DomQuery;
  rnd(a: number, b: number): number;
  ri(a: number, b: number): number;
  choice<T>(items: readonly T[]): T;
  fmt: NumberFormatter;
  SFX: SfxApi;
}

export interface VisualsApi {
  FX: FxApi;
  animateNumber(
    el: Element,
    from: number,
    to: number,
    duration?: number,
    tick?: boolean
  ): Promise<void>;
  elCenter(el: Element): { x: number; y: number };
  flash(color?: string): void;
  floatText(x: number, y: number, text: string, className?: string): void;
  glitchFx(): void;
  popEl(el: Element, className?: string): void;
  shake(level?: number): void;
}

export interface GrainDeps {
  $: DomQuery;
}

export interface GrainApi {
  makeGrain(): void;
}
