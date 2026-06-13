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

/* Context handed to every joker hook so effects read state and draw randomness
   through the single injected source rather than reaching for Math.random. */
export interface JokerContext {
  state: GameState;
  rng: GameRng;
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
  perCard?: (card: Card, ev: HandEval, ctx: JokerContext) => JokerEffect | null;
  onHand?: (ev: HandEval, played: Card[], ctx: JokerContext) => JokerEffect | null;
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

/* The single random source for all game-affecting randomness. Swapping its
   backing function (default Math.random) makes a whole run reproducible. */
export interface GameRng extends EventRng {
  shuffle<T>(items: T[]): T[];
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
export type AnnouncerTone = 'sys' | 'good' | 'bad' | 'weird' | 'gold';

export interface AnnouncerDeps {
  $: DomQuery;
}

export interface AnnouncerApi {
  announce(text: string, tone?: AnnouncerTone, hold?: number): void;
  splash(title: string, tone?: AnnouncerTone): void;
}

export interface EventsFlowDeps {
  state: GameState;
  events: readonly ChaosEvent[];
  rollEvent(
    events: readonly ChaosEvent[],
    state: GameState,
    trigger: EventTrigger,
    rng: EventRng
  ): ChaosEvent | null;
  rng: EventRng;
  announcer: AnnouncerApi;
  SFX: SfxApi;
  flash(color?: string): void;
  shake(level?: number): void;
  glitchFx(): void;
  renderCounts(): void;
  renderGold(): void;
  renderHand(): void;
  renderStatus?: () => void;
}

export interface EventsFlowApi {
  maybeFire(trigger: EventTrigger): ChaosEvent | null;
}
export interface HudViewDeps {
  $: DomQuery;
  state: GameState;
  fmt: NumberFormatter;
}

export interface HudViewApi {
  renderButtons(): void;
  renderCounts(): void;
  renderGold(): void;
  renderScore(): void;
}

export interface ReadoutViewDeps {
  $: DomQuery;
  state: GameState;
  fmt: NumberFormatter;
  chipVal(rank: Rank): number;
  evaluateHand(cards: Card[], levels: HandLevels): HandEval;
  previewStateChips?(card: Card, baseChips: number): number;
  popEl(el: Element, className?: string): void;
  renderButtons(): void;
}

export interface ReadoutViewApi {
  resetReadout(): void;
  updatePreview(): void;
}

export interface ModalsViewDeps {
  $: DomQuery;
  state: GameState;
  HAND_ORDER: readonly HandTypeKey[];
  getHandStats(key: HandTypeKey, levels: HandLevels): HandStats;
  CARD_STATES: Record<CardStateKey, CardStateMeta>;
}

export interface ModalsViewApi {
  buildHandTable(): void;
  buildStatesModal(): void;
  hideModal(selector: string): void;
  hideModals(): void;
  renderStatus(): void;
  showModal(selector: string): void;
}
export interface CardsViewHandlers {
  sellJoker(joker: Joker): void;
}

export interface CardsViewDeps {
  $: DomQuery;
  state: GameState;
  SUIT_ORDER: Record<Suit, number>;
  rankName(rank: Rank): string;
  drawJokerIcon(canvas: HTMLCanvasElement, art: JokerArt): void;
  sellPrice(joker: Joker): number;
  CARD_STATES: Record<CardStateKey, CardStateMeta>;
  handlers: CardsViewHandlers;
}

export interface CardsViewApi {
  cardEl(card: Card): HTMLElement;
  renderHand(fresh?: Card[]): void;
  renderJokers(): void;
  renderPlayed(): void;
  sortHand(): void;
}

export interface ShopViewHandlers extends CardsViewHandlers {
  effPrice(price: number): number;
  buyJoker(joker: Joker): void;
  buyUpgrade(offer: ShopOffer): void;
  buyMystery(): void;
  buyService(): void;
  buyRisk(): void;
  buySlot(price: number): void;
}

export interface ShopViewDeps {
  $: DomQuery;
  state: GameState;
  shopState: ShopState;
  handlers: ShopViewHandlers;
  HAND_TYPES: Record<HandTypeKey, HandBaseStats>;
  MAX_HAND_LEVEL: number;
  JOKER_SLOTS_BASE: number;
  JOKER_SLOTS_CAP: number;
  getHandStats(key: HandTypeKey, levels: HandLevels): HandStats;
  upgradePrice(key: HandTypeKey, levels: HandLevels): number;
  sellPrice(joker: Joker): number;
  drawJokerIcon(canvas: HTMLCanvasElement, art: JokerArt): void;
  renderGold(): void;
}

export interface ShopViewApi {
  drawSlotIcon(canvas: HTMLCanvasElement): void;
  renderShop(): void;
  renderUpgradeOffers(box: Element): void;
}

export interface ShopFlowCoreApi {
  shuffle<T>(items: T[]): T[];
  choice<T>(items: readonly T[]): T;
  HAND_ORDER: readonly HandTypeKey[];
  MAX_HAND_LEVEL: number;
  getHandStats(key: HandTypeKey, levels: HandLevels): HandStats;
  upgradePrice(key: HandTypeKey, levels: HandLevels): number;
}

export interface ShopFlowDeps {
  $: DomQuery;
  state: GameState;
  shopState: ShopState;
  JOKERS: Joker[];
  Core: ShopFlowCoreApi;
  rng: GameRng;
  JOKER_SLOTS_CAP: number;
  sellPrice(joker: Joker): number;
  SFX: SfxApi;
  FX: FxApi;
  elCenter(el: Element): { x: number; y: number };
  floatText(x: number, y: number, text: string, className?: string): void;
  popEl(el: Element, className?: string): void;
  glitchFx(): void;
  announcer: AnnouncerApi;
  renderGold(): void;
  renderJokers(): void;
  buildHandTable(): void;
  showModal(selector: string): void;
  renderShop(): void;
  renderStatus?: () => void;
}

export interface ShopFlowApi extends ShopViewHandlers {
  rollOffers(): void;
  rollUpgradeOffers(): void;
  rollAnomalies(): void;
  openShop(base: number, bonus: number, skipBonus: number, interest: number): void;
  rerollShop(): void;
}

export interface ScoringFlowDeps {
  $: DomQuery;
  state: GameState;
  rng: GameRng;
  MAX_PLAY: number;
  sleep(ms: number): Promise<void>;
  fmt: NumberFormatter;
  chipVal(rank: Rank): number;
  evaluateHand(cards: Card[], levels: HandLevels): HandEval;
  stateScoreProc(key: CardStateKey): CardStateProc;
  CARD_STATES: Record<CardStateKey, CardStateMeta>;
  SFX: SfxApi;
  FX: FxApi;
  elCenter(el: Element): { x: number; y: number };
  floatText(x: number, y: number, text: string, className?: string): void;
  popEl(el: Element, className?: string): void;
  shake(level?: number): void;
  flash(color?: string): void;
  glitchFx(): void;
  animateNumber(
    el: Element,
    from: number,
    to: number,
    duration?: number,
    tick?: boolean
  ): Promise<void>;
  announcer: AnnouncerApi;
  maybeFireEvent(trigger: EventTrigger): ChaosEvent | null;
  renderButtons(): void;
  renderCounts(): void;
  renderGold(): void;
  renderHand(fresh?: Card[]): void;
  renderPlayed(): void;
  renderJokers(): void;
  resetReadout(): void;
  renderStatus?: () => void;
  drawTo(): void;
  refreshCleared(): void;
  settleLevel(skipped: boolean): Promise<void>;
  gameOver(): Promise<void>;
}

export interface ScoringFlowApi {
  playHand(): Promise<void>;
}
