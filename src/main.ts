import * as Core from './core';
import { createJokers, drawJokerIcon } from './data/jokers';
import {
  DISCARDS_PER,
  HANDS_PER,
  HAND_SIZE,
  JOKER_SLOTS_BASE,
  JOKER_SLOTS_CAP,
  MAX_PLAY,
  createInitialState,
  createShopState,
  sellPrice,
} from './state/game-state';
/* ═══════════════════════════════════════════════════════════
   小丑终端 JOKER.SYS — 游戏流程入口
   ═══════════════════════════════════════════════════════════ */
import type { Card, GameState, Joker, ShopState } from './types';

import './systems/audio.js';
import './systems/fx.js';
import './ui/shop-view.js';
import './ui/cards-view.js';
import './ui/hud-view.js';
import './ui/readout-view.js';
import './ui/modals-view.js';
import './systems/grain.js';
import './flow/shop-flow.js';
import './flow/scoring-flow.js';

const $ = <T extends Element = HTMLElement>(selector: string): T => {
  const el = document.querySelector<T>(selector);
  if (!el) throw new Error(`Missing DOM element: ${selector}`);
  return el;
};

const {
  sleep,
  rnd,
  ri,
  choice,
  fmt,
  shuffle,
  SUIT_ORDER,
  rankName,
  chipVal,
  makeDeck,
  HAND_TYPES,
  HAND_ORDER,
  MAX_HAND_LEVEL,
  HAND_UPGRADES,
  initHandLevels,
  getHandStats,
  upgradePrice,
  evaluateHand,
  targetFor,
} = Core;

type SfxApi = {
  bigmult(): void;
  buy(): void;
  coin(): void;
  deny(): void;
  discard(): void;
  draw(index?: number): void;
  joker(index?: number): void;
  lose(): void;
  mult(): void;
  play(): void;
  select(on: boolean): void;
  settle(): void;
  tick(index?: number): void;
  win(): void;
};
type SoundApi = {
  ctx: AudioContext | null;
  init(): void;
};
type FxApi = {
  coins(x: number, y: number, count?: number): void;
  confetti(): void;
  init(): void;
  sparks(x: number, y: number, color: string, count?: number, speed?: number): void;
};
type VisualsApi = {
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
};
type CardsViewApi = {
  renderHand(fresh?: Card[]): void;
  renderJokers(): void;
  renderPlayed(): void;
  sortHand(): void;
};
type HudViewApi = {
  renderButtons(): void;
  renderCounts(): void;
  renderGold(): void;
  renderScore(): void;
};
type ReadoutViewApi = {
  resetReadout(): void;
  updatePreview(): void;
};
type ModalsViewApi = {
  buildHandTable(): void;
  hideModal(selector: string): void;
  hideModals(): void;
  showModal(selector: string): void;
};
type GrainApi = {
  makeGrain(): void;
};
type ShopViewApi = {
  renderShop(): void;
};
type ShopFlowApi = {
  openShop(base: number, bonus: number, interest: number): void;
  rerollShop(): void;
  [key: string]: unknown;
};
type ScoringFlowApi = {
  playHand(): Promise<void>;
};
type RuntimeRoot = typeof globalThis & {
  JokerAudio: { Snd: SoundApi; SFX: SfxApi };
  JokerCardsView: { createCardsView(deps: unknown): CardsViewApi };
  JokerGrain: { createGrain(deps: unknown): GrainApi };
  JokerHudView: { createHudView(deps: unknown): HudViewApi };
  JokerModalsView: { createModalsView(deps: unknown): ModalsViewApi };
  JokerReadoutView: { createReadoutView(deps: unknown): ReadoutViewApi };
  JokerScoringFlow: { createScoringFlow(deps: unknown): ScoringFlowApi };
  JokerShopFlow: { createShopFlow(deps: unknown): ShopFlowApi };
  JokerShopView: { createShopView(deps: unknown): ShopViewApi };
  JokerVisuals: { createVisuals(deps: unknown): VisualsApi };
};
const runtime = globalThis as RuntimeRoot;
const { Snd, SFX } = runtime.JokerAudio;
const { FX, elCenter, floatText, popEl, shake, flash, glitchFx, animateNumber } =
  runtime.JokerVisuals.createVisuals({ $, rnd, ri, choice, fmt, SFX });

const state: GameState = createInitialState();
const JOKERS: Joker[] = createJokers(() => state);
const shopState: ShopState = createShopState();
const shopHandlers: Record<string, unknown> = {};

const cardsView = runtime.JokerCardsView.createCardsView({
  $,
  state,
  SUIT_ORDER,
  rankName,
  drawJokerIcon,
  sellPrice,
  handlers: shopHandlers,
});
const { sortHand, renderHand, renderPlayed, renderJokers } = cardsView;
const hudView = runtime.JokerHudView.createHudView({ $, state, fmt });
const { renderCounts, renderScore, renderGold, renderButtons } = hudView;
const readoutView = runtime.JokerReadoutView.createReadoutView({
  $,
  state,
  fmt,
  chipVal,
  evaluateHand,
  popEl,
  renderButtons,
});
const { resetReadout, updatePreview } = readoutView;
const modalsView = runtime.JokerModalsView.createModalsView({ $, state, HAND_ORDER, getHandStats });
const { showModal, hideModal, hideModals, buildHandTable } = modalsView;
const grain = runtime.JokerGrain.createGrain({ $ });
const { makeGrain } = grain;
const scoringFlow = runtime.JokerScoringFlow.createScoringFlow({
  $,
  state,
  MAX_PLAY,
  sleep,
  fmt,
  chipVal,
  evaluateHand,
  SFX,
  FX,
  elCenter,
  floatText,
  popEl,
  shake,
  flash,
  glitchFx,
  animateNumber,
  renderButtons,
  renderCounts,
  renderGold,
  renderHand,
  renderPlayed,
  resetReadout,
  drawTo,
  levelClear,
  gameOver,
});
const { playHand } = scoringFlow;

function startRun(): void {
  state.level = 1;
  state.gold = 4;
  state.jokers = [];
  state.endless = false;
  state.maxJokers = JOKER_SLOTS_BASE;
  state.handLevels = initHandLevels();
  state.total = 0;
  buildHandTable();
  hideModals();
  startLevel();
}

function startLevel(): void {
  state.target = targetFor(state.level);
  state.score = 0;
  state.handsLeft = HANDS_PER;
  state.discardsLeft = DISCARDS_PER;
  state.deck = shuffle(makeDeck());
  state.hand = [];
  state.played = [];
  state.phase = 'play';
  renderJokers();
  renderGold();
  renderScore();
  $('#playArea').innerHTML = '';
  resetReadout();
  drawTo();
  renderButtons();
}

function drawTo(): void {
  const fresh: Card[] = [];
  while (state.hand.length < HAND_SIZE && state.deck.length) {
    const card = state.deck.pop();
    if (!card) break;
    card.sel = false;
    state.hand.push(card);
    fresh.push(card);
  }
  sortHand();
  renderHand(fresh);
  renderCounts();
  fresh.forEach((_card, i) => setTimeout(() => SFX.draw(i), i * 55));
}

function onCardClick(card: Card): void {
  if (state.phase !== 'play') return;
  if (!card.sel && state.hand.filter((x) => x.sel).length >= MAX_PLAY) {
    SFX.deny();
    if (card.el) popEl(card.el, 'nope');
    return;
  }
  card.sel = !card.sel;
  SFX.select(card.sel);
  card.el?.classList.toggle('sel', card.sel);
  updatePreview();
}

async function discardSel(): Promise<void> {
  if (state.phase !== 'play' || state.discardsLeft <= 0) {
    SFX.deny();
    return;
  }
  const selected = state.hand.filter((card) => card.sel);
  if (!selected.length) {
    SFX.deny();
    return;
  }
  state.discardsLeft--;
  state.hand = state.hand.filter((card) => !card.sel);
  SFX.discard();
  renderHand();
  renderCounts();
  await sleep(120);
  drawTo();
  updatePreview();
}

async function levelClear(): Promise<void> {
  state.phase = 'cleared';
  renderButtons();
  SFX.win();
  FX.confetti();
  flash('rgba(93,255,143,.25)');
  shake(2);
  const hn = $('#handName');
  hn.textContent = '目 标 达 成 ！';
  popEl(hn, 'big');
  const base = 4;
  const bonus = state.handsLeft;
  const interest = Math.min(5, Math.floor(state.gold / 5));
  await sleep(1000);
  state.gold += base + bonus + interest;
  renderGold();
  popEl($('#goldVal'));
  const p = elCenter($('#goldVal'));
  FX.coins(p.x, p.y, 12);
  SFX.coin();
  openShop(base, bonus, interest);
}

const shopView = runtime.JokerShopView.createShopView({
  $,
  state,
  shopState,
  handlers: shopHandlers,
  HAND_TYPES,
  MAX_HAND_LEVEL,
  JOKER_SLOTS_BASE,
  JOKER_SLOTS_CAP,
  getHandStats,
  upgradePrice,
  sellPrice,
  drawJokerIcon,
  renderGold,
});
const { renderShop } = shopView;
const shopFlow = runtime.JokerShopFlow.createShopFlow({
  $,
  state,
  shopState,
  JOKERS,
  Core,
  JOKER_SLOTS_CAP,
  sellPrice,
  SFX,
  FX,
  elCenter,
  floatText,
  popEl,
  renderGold,
  renderJokers,
  buildHandTable,
  showModal,
  renderShop,
});
Object.assign(shopHandlers, shopFlow);
const { openShop, rerollShop } = shopFlow;

function nextLevel(): void {
  hideModal('#shop');
  state.level++;
  if (state.level > 8 && !state.endless) {
    state.phase = 'victory';
    SFX.win();
    FX.confetti();
    $('#vicStats').textContent = '本局累计得分 ' + fmt(state.total);
    showModal('#victory');
    return;
  }
  startLevel();
}

async function gameOver(): Promise<void> {
  state.phase = 'over';
  renderButtons();
  SFX.lose();
  flash('rgba(255,64,64,.35)');
  shake(3);
  $('#overStats').innerHTML =
    `止步于 第 ${state.level} 关<br>本关得分 ${fmt(state.score)} ／ 目标 ${fmt(state.target)}` +
    `<br>本局累计得分 <b class="goodtxt">${fmt(state.total)}</b><br>小丑们收起了笑容。`;
  await sleep(900);
  showModal('#gameover');
}

function init(): void {
  FX.init();
  makeGrain();
  buildHandTable();
  resetReadout();
  renderJokers();

  $('#handArea').addEventListener('click', (event) => {
    const target = event.target as Element | null;
    const el = target?.closest<HTMLElement>('.card');
    if (!el) return;
    const card = state.hand.find((item) => item.id === Number(el.dataset.id));
    if (card) onCardClick(card);
  });
  $('#btnPlay').addEventListener('click', () => {
    void playHand();
  });
  $('#btnDiscard').addEventListener('click', () => {
    void discardSel();
  });
  $('#sortRank').addEventListener('click', () => {
    if (state.phase !== 'play') return;
    state.sort = 'rank';
    $('#sortRank').classList.add('on');
    $('#sortSuit').classList.remove('on');
    SFX.select(true);
    sortHand();
    renderHand();
  });
  $('#sortSuit').addEventListener('click', () => {
    if (state.phase !== 'play') return;
    state.sort = 'suit';
    $('#sortSuit').classList.add('on');
    $('#sortRank').classList.remove('on');
    SFX.select(true);
    sortHand();
    renderHand();
  });
  $('#btnHelp').addEventListener('click', () => {
    SFX.select(true);
    showModal('#help');
  });
  $('#btnCloseHelp').addEventListener('click', () => {
    SFX.select(false);
    hideModal('#help');
  });
  $('#btnReroll').addEventListener('click', rerollShop);
  $('#btnNext').addEventListener('click', () => {
    SFX.play();
    nextLevel();
  });
  $('#btnRestart').addEventListener('click', () => {
    SFX.buy();
    startRun();
  });
  $('#btnRestartV').addEventListener('click', () => {
    SFX.buy();
    startRun();
  });
  $('#btnEndless').addEventListener('click', () => {
    state.endless = true;
    SFX.buy();
    hideModal('#victory');
    startLevel();
  });
  $('#btnBoot').addEventListener('click', () => {
    Snd.init();
    if (Snd.ctx && Snd.ctx.state === 'suspended') Snd.ctx.resume();
    SFX.coin();
    popEl($('#screen'), 'poweron');
    hideModal('#boot');
    startRun();
  });
}

window.addEventListener('DOMContentLoaded', init);

export {
  HAND_TYPES,
  HAND_UPGRADES,
  chipVal,
  evaluateHand,
  getHandStats,
  initHandLevels,
  makeDeck,
  targetFor,
};
