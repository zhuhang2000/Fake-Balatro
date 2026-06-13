import * as Core from './core';
import { EVENTS, rollEvent } from './data/events';
import { createJokers, drawJokerIcon } from './data/jokers';
import { createEventsFlow } from './flow/events-flow';
import { createScoringFlow } from './flow/scoring-flow';
import { createShopFlow } from './flow/shop-flow';
import {
  DISCARDS_PER,
  HANDS_PER,
  HAND_SIZE,
  JOKER_SLOTS_BASE,
  JOKER_SLOTS_CAP,
  MAX_PLAY,
  createInitialState,
  createShopState,
  resetLevelMods,
  sellPrice,
} from './state/game-state';
import { createAnnouncer } from './systems/announcer';
/* ═══════════════════════════════════════════════════════════
   小丑终端 JOKER.SYS — 游戏流程入口
   ═══════════════════════════════════════════════════════════ */
import { SFX, Snd } from './systems/audio';
import { createVisuals } from './systems/fx';
import { createGrain } from './systems/grain';
import type {
  Card,
  EventTrigger,
  GameRng,
  GameState,
  Joker,
  ShopFlowApi,
  ShopState,
  ShopViewHandlers,
} from './types';
import { createCardsView } from './ui/cards-view';
import { createHudView } from './ui/hud-view';
import { createModalsView } from './ui/modals-view';
import { createReadoutView } from './ui/readout-view';
import { createShopView } from './ui/shop-view';

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
  createRng,
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
  cumulativeTargetFor,
  CARD_STATES,
  stateScoreProc,
  previewStateChips,
  sprinkleStates,
  sprinkleCountFor,
} = Core;

const rng: GameRng = createRng();

const { FX, elCenter, floatText, popEl, shake, flash, glitchFx, animateNumber } = createVisuals({
  $,
  rnd,
  ri,
  choice,
  fmt,
  SFX,
});

const state: GameState = createInitialState();
const JOKERS: Joker[] = createJokers(() => state);
const shopState: ShopState = createShopState();

/* Views need shop actions, but the shop flow is created later (it depends on
   views). Rather than assert an empty object into the right shape, expose
   stable delegators that forward to the flow once it exists. */
let shopFlow: ShopFlowApi | null = null;
const shopHandlers: ShopViewHandlers = {
  sellJoker: (joker) => shopFlow?.sellJoker(joker),
  effPrice: (price) => (shopFlow ? shopFlow.effPrice(price) : price),
  buyJoker: (joker) => shopFlow?.buyJoker(joker),
  buyUpgrade: (offer) => shopFlow?.buyUpgrade(offer),
  buyMystery: () => shopFlow?.buyMystery(),
  buyService: () => shopFlow?.buyService(),
  buyRisk: () => shopFlow?.buyRisk(),
  buySlot: (price) => shopFlow?.buySlot(price),
};

const announcer = createAnnouncer({ $ });
const cardsView = createCardsView({
  $,
  state,
  SUIT_ORDER,
  rankName,
  drawJokerIcon,
  sellPrice,
  CARD_STATES,
  handlers: shopHandlers,
});
const { sortHand, renderHand, renderPlayed, renderJokers } = cardsView;
const hudView = createHudView({ $, state, fmt });
const { renderCounts, renderScore, renderGold, renderButtons } = hudView;
const readoutView = createReadoutView({
  $,
  state,
  fmt,
  chipVal,
  evaluateHand,
  previewStateChips,
  popEl,
  renderButtons,
});
const { resetReadout, updatePreview } = readoutView;
const modalsView = createModalsView({
  $,
  state,
  HAND_ORDER,
  getHandStats,
  CARD_STATES,
});
const { showModal, hideModal, hideModals, buildHandTable, renderStatus, buildStatesModal } =
  modalsView;
const grain = createGrain({ $ });
const { makeGrain } = grain;
const eventsFlow = createEventsFlow({
  state,
  events: EVENTS,
  rollEvent,
  rng,
  announcer,
  SFX,
  flash,
  shake,
  glitchFx,
  renderCounts,
  renderGold,
  renderHand,
  renderStatus,
});
const scoringFlow = createScoringFlow({
  $,
  state,
  rng,
  MAX_PLAY,
  sleep,
  fmt,
  chipVal,
  evaluateHand,
  stateScoreProc,
  CARD_STATES,
  SFX,
  FX,
  elCenter,
  floatText,
  popEl,
  shake,
  flash,
  glitchFx,
  animateNumber,
  announcer,
  maybeFireEvent: (trigger: EventTrigger) => eventsFlow.maybeFire(trigger),
  renderButtons,
  renderCounts,
  renderGold,
  renderHand,
  renderPlayed,
  renderJokers,
  resetReadout,
  renderStatus,
  drawTo,
  refreshCleared,
  settleLevel,
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
  state.pendingMutations = [];
  buildHandTable();
  hideModals();
  startLevel();
}

function startLevel(): void {
  state.target = cumulativeTargetFor(state.level);
  state.score = 0;
  state.handsLeft = HANDS_PER;
  state.discardsLeft = DISCARDS_PER;
  state.deck = rng.shuffle(makeDeck());
  sprinkleStates(state.deck, sprinkleCountFor(state.level, rng), rng, state.pendingMutations);
  state.hand = [];
  state.played = [];
  state.phase = 'play';
  state.cleared = false;
  state.eventLog = [];
  resetLevelMods(state);
  renderJokers();
  renderGold();
  renderScore();
  renderStatus();
  $('#playArea').innerHTML = '';
  resetReadout();
  drawTo();
  renderButtons();
  /* Score banked from earlier levels may already clear this one's threshold. */
  refreshCleared();
  window.setTimeout(() => {
    if (state.phase === 'play') {
      eventsFlow.maybeFire('levelStart');
      refreshCleared();
    }
  }, 700);
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

/* Fired once when the cumulative score first reaches this level's threshold. */
function onLevelCleared(): void {
  renderStatus();
  renderButtons();
  if (state.handsLeft > 0) {
    announcer.announce('累计得分已达标：可继续冲分，或点「结算进店」跳关换金币', 'good');
  }
}

/* Source of truth for the cleared flag: cleared once cumulative total reaches
   the running target. Banked score can pre-clear a level; a target-raising
   event can revert it while the level is still live. */
function refreshCleared(): void {
  const nowClear = state.total >= state.target;
  if (nowClear && !state.cleared) {
    state.cleared = true;
    onLevelCleared();
  } else if (!nowClear && state.cleared && state.phase === 'play') {
    state.cleared = false;
    renderStatus();
    renderButtons();
  }
}

/* Settle the cleared level and open the shop. `skipped` is true when the
   player ends early with hands still in reserve (extra gold reward). */
async function settleLevel(skipped: boolean): Promise<void> {
  if (state.phase !== 'play' && state.phase !== 'scoring') return;
  state.phase = 'cleared';
  renderButtons();
  const hn = $('#handName');
  const ratio = state.total / state.target;
  if (ratio >= 2) {
    hn.textContent = '过 载 通 关 ！';
    SFX.overkill();
    FX.confetti();
    FX.confetti();
    flash('rgba(255,210,63,.32)');
    shake(3);
    glitchFx();
    announcer.announce(`输出 ${Math.floor(ratio * 100)}%：评分核心冒烟`, 'gold');
  } else if (state.total - state.target <= state.target * 0.06) {
    hn.textContent = '压 线 通 过';
    SFX.win();
    SFX.edge();
    FX.confetti();
    flash('rgba(93,255,143,.25)');
    shake(2);
    announcer.announce('擦着目标线滑入 系统假装没看见', 'good');
  } else {
    hn.textContent = '目 标 达 成 ！';
    SFX.win();
    FX.confetti();
    flash('rgba(93,255,143,.25)');
    shake(2);
  }
  popEl(hn, 'big');
  const base = 4;
  const handsBonus = state.handsLeft * 2;
  const skipBonus = skipped && state.handsLeft > 0 ? 3 : 0;
  const interest = Math.min(5, Math.floor(state.gold / 5));
  await sleep(1000);
  state.gold += base + handsBonus + skipBonus + interest;
  renderGold();
  popEl($('#goldVal'));
  const p = elCenter($('#goldVal'));
  FX.coins(p.x, p.y, 12);
  SFX.coin();
  openShop(base, handsBonus, skipBonus, interest);
}

const shopView = createShopView({
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
shopFlow = createShopFlow({
  $,
  state,
  shopState,
  JOKERS,
  Core,
  rng,
  JOKER_SLOTS_CAP,
  sellPrice,
  SFX,
  FX,
  elCenter,
  floatText,
  popEl,
  glitchFx,
  announcer,
  renderGold,
  renderJokers,
  buildHandTable,
  showModal,
  renderShop,
  renderStatus,
});
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
    `止步于 第 ${state.level} 关<br>累计得分 <b class="goodtxt">${fmt(state.total)}</b> ／ 目标 ${fmt(state.target)}` +
    `<br>本关贡献 ${fmt(state.score)}<br>小丑们收起了笑容。`;
  await sleep(900);
  showModal('#gameover');
}

function init(): void {
  FX.init();
  makeGrain();
  buildHandTable();
  resetReadout();
  renderJokers();
  renderStatus();

  $('#handArea').addEventListener('click', (event) => {
    const target = event.target as Element | null;
    const el = target?.closest<HTMLElement>('.card');
    if (!el) return;
    // biome-ignore lint/complexity/useLiteralKeys: DOMStringMap requires index access under TS noPropertyAccessFromIndexSignature
    const card = state.hand.find((item) => item.id === Number(el.dataset['id']));
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
  $('#btnStates').addEventListener('click', () => {
    SFX.select(true);
    buildStatesModal();
    showModal('#states');
  });
  $('#btnCloseStates').addEventListener('click', () => {
    SFX.select(false);
    hideModal('#states');
  });
  $('#btnSettle').addEventListener('click', () => {
    if (state.phase !== 'play' || !state.cleared) {
      SFX.deny();
      return;
    }
    SFX.coin();
    void settleLevel(true);
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
