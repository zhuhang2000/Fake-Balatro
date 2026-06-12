/* ═══════════════════════════════════════════════════════════
   小丑终端 JOKER.SYS — 游戏逻辑 / Web Audio 合成音效 / Canvas 粒子
   零外部依赖，所有素材由代码实时生成
   ═══════════════════════════════════════════════════════════ */

const $ = (s) => document.querySelector(s);
const Core = typeof require !== 'undefined' ? require('./core/index.js') : window.JokerCore;
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
const AudioMod = typeof require !== 'undefined' ? require('./systems/audio.js') : window.JokerAudio;
const { Snd, SFX } = AudioMod;
const JokerDefs = typeof require !== 'undefined' ? require('./data/jokers.js') : window.JokerJokers;
const { createJokers, drawJokerIcon } = JokerDefs;
const Visuals = typeof require !== 'undefined' ? require('./systems/fx.js') : window.JokerVisuals;
const { FX, elCenter, floatText, popEl, shake, flash, glitchFx, animateNumber } =
  Visuals.createVisuals({ $, rnd, ri, choice, fmt, SFX });
const GameState =
  typeof require !== 'undefined' ? require('./state/game-state.js') : window.JokerGameState;
const {
  HANDS_PER,
  DISCARDS_PER,
  HAND_SIZE,
  MAX_PLAY,
  JOKER_SLOTS_BASE,
  JOKER_SLOTS_CAP,
  sellPrice,
  createInitialState,
  createShopState,
} = GameState;
const ShopViewMod =
  typeof require !== 'undefined' ? require('./ui/shop-view.js') : window.JokerShopView;
const ShopFlowMod =
  typeof require !== 'undefined' ? require('./flow/shop-flow.js') : window.JokerShopFlow;
const ScoringFlowMod =
  typeof require !== 'undefined' ? require('./flow/scoring-flow.js') : window.JokerScoringFlow;
const CardsViewMod =
  typeof require !== 'undefined' ? require('./ui/cards-view.js') : window.JokerCardsView;
const HudViewMod =
  typeof require !== 'undefined' ? require('./ui/hud-view.js') : window.JokerHudView;
const ReadoutViewMod =
  typeof require !== 'undefined' ? require('./ui/readout-view.js') : window.JokerReadoutView;
const ModalsViewMod =
  typeof require !== 'undefined' ? require('./ui/modals-view.js') : window.JokerModalsView;
const GrainMod = typeof require !== 'undefined' ? require('./systems/grain.js') : window.JokerGrain;

/* ═══════════════════════════════════════════
   游戏状态与流程
   ═══════════════════════════════════════════ */
const state = createInitialState();
const JOKERS = createJokers(() => state);
const shopState = createShopState();
const shopHandlers = {};

/* ──────── 视图模块 ──────── */
const cardsView = CardsViewMod.createCardsView({
  $,
  state,
  SUIT_ORDER,
  rankName,
  drawJokerIcon,
  sellPrice,
  handlers: shopHandlers,
});
const { sortHand, renderHand, renderPlayed, renderJokers } = cardsView;
const hudView = HudViewMod.createHudView({ $, state, fmt });
const { renderCounts, renderScore, renderGold, renderButtons } = hudView;
const readoutView = ReadoutViewMod.createReadoutView({
  $,
  state,
  fmt,
  chipVal,
  evaluateHand,
  popEl,
  renderButtons,
});
const { resetReadout, updatePreview } = readoutView;
const modalsView = ModalsViewMod.createModalsView({ $, state, HAND_ORDER, getHandStats });
const { showModal, hideModal, hideModals, buildHandTable } = modalsView;
const grain = GrainMod.createGrain({ $ });
const { makeGrain } = grain;
const scoringFlow = ScoringFlowMod.createScoringFlow({
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

/* ──────── 流程 ──────── */
function startRun() {
  state.level = 1;
  state.gold = 4;
  state.jokers = [];
  state.endless = false;
  state.maxJokers = JOKER_SLOTS_BASE;
  state.handLevels = initHandLevels();
  state.total = 0; // 累计得分：整局只增不减
  buildHandTable();
  hideModals();
  startLevel();
}
function startLevel() {
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
function drawTo() {
  const fresh = [];
  while (state.hand.length < HAND_SIZE && state.deck.length) {
    const c = state.deck.pop();
    c.sel = false;
    state.hand.push(c);
    fresh.push(c);
  }
  sortHand();
  renderHand(fresh);
  renderCounts();
  fresh.forEach((c, i) => setTimeout(() => SFX.draw(i), i * 55));
}
function onCardClick(c) {
  if (state.phase !== 'play') return;
  if (!c.sel && state.hand.filter((x) => x.sel).length >= MAX_PLAY) {
    SFX.deny();
    popEl(c.el, 'nope');
    return;
  }
  c.sel = !c.sel;
  SFX.select(c.sel);
  c.el.classList.toggle('sel', c.sel);
  updatePreview();
}

async function discardSel() {
  if (state.phase !== 'play' || state.discardsLeft <= 0) {
    SFX.deny();
    return;
  }
  const sel = state.hand.filter((c) => c.sel);
  if (!sel.length) {
    SFX.deny();
    return;
  }
  state.discardsLeft--;
  state.hand = state.hand.filter((c) => !c.sel);
  SFX.discard();
  renderHand();
  renderCounts();
  await sleep(120);
  drawTo();
  updatePreview();
}

/* ──────── 过关 / 商店 ──────── */
async function levelClear() {
  state.phase = 'cleared';
  renderButtons();
  SFX.win();
  FX.confetti();
  flash('rgba(93,255,143,.25)');
  shake(2);
  const hn = $('#handName');
  hn.textContent = '目 标 达 成 ！';
  popEl(hn, 'big');
  const base = 4,
    bonus = state.handsLeft,
    interest = Math.min(5, Math.floor(state.gold / 5));
  await sleep(1000);
  state.gold += base + bonus + interest;
  renderGold();
  popEl($('#goldVal'));
  const p = elCenter($('#goldVal'));
  FX.coins(p.x, p.y, 12);
  SFX.coin();
  openShop(base, bonus, interest);
}
const shopView = ShopViewMod.createShopView({
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
const shopFlow = ShopFlowMod.createShopFlow({
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
const {
  rollOffers,
  rollUpgradeOffers,
  openShop,
  buyJoker,
  buyUpgrade,
  sellJoker,
  buySlot,
  rerollShop,
} = shopFlow;
function nextLevel() {
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

/* ──────── 失败 ──────── */
async function gameOver() {
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

/* ──────── 初始化 ──────── */
function init() {
  FX.init();
  makeGrain();
  buildHandTable();
  resetReadout();
  renderJokers();

  $('#handArea').addEventListener('click', (e) => {
    const el = e.target.closest('.card');
    if (!el) return;
    const c = state.hand.find((c) => c.id === Number(el.dataset.id));
    if (c) onCardClick(c);
  });
  $('#btnPlay').onclick = playHand;
  $('#btnDiscard').onclick = discardSel;
  $('#sortRank').onclick = () => {
    if (state.phase !== 'play') return;
    state.sort = 'rank';
    $('#sortRank').classList.add('on');
    $('#sortSuit').classList.remove('on');
    SFX.select(true);
    sortHand();
    renderHand();
  };
  $('#sortSuit').onclick = () => {
    if (state.phase !== 'play') return;
    state.sort = 'suit';
    $('#sortSuit').classList.add('on');
    $('#sortRank').classList.remove('on');
    SFX.select(true);
    sortHand();
    renderHand();
  };
  $('#btnHelp').onclick = () => {
    SFX.select(true);
    showModal('#help');
  };
  $('#btnCloseHelp').onclick = () => {
    SFX.select(false);
    hideModal('#help');
  };
  $('#btnReroll').onclick = rerollShop;
  $('#btnNext').onclick = () => {
    SFX.play();
    nextLevel();
  };
  $('#btnRestart').onclick = () => {
    SFX.buy();
    startRun();
  };
  $('#btnRestartV').onclick = () => {
    SFX.buy();
    startRun();
  };
  $('#btnEndless').onclick = () => {
    state.endless = true;
    SFX.buy();
    hideModal('#victory');
    startLevel();
  };
  $('#btnBoot').onclick = () => {
    Snd.init();
    if (Snd.ctx && Snd.ctx.state === 'suspended') Snd.ctx.resume();
    SFX.coin();
    popEl($('#screen'), 'poweron');
    hideModal('#boot');
    startRun();
  };
}
if (typeof document !== 'undefined' && typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', init);
}

/* node 单元测试入口（浏览器中无副作用） */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    evaluateHand,
    chipVal,
    makeDeck,
    HAND_TYPES,
    HAND_UPGRADES,
    initHandLevels,
    getHandStats,
    targetFor,
  };
}
/* EOF */
