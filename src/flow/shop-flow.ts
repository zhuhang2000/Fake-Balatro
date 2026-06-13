/* Shop state transitions, purchase actions and shelf anomalies. */
import type { CardStateKey, Joker, ShopFlowApi, ShopFlowDeps, ShopOffer } from '../types';

const STATE_KEYS: readonly CardStateKey[] = ['gilded', 'cracked', 'echo', 'tainted'];

export function createShopFlow(deps: ShopFlowDeps): ShopFlowApi {
  const {
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
    glitchFx,
    announcer,
    renderGold,
    renderJokers,
    buildHandTable,
    showModal,
    renderShop,
    renderStatus,
  } = deps;
  const { shuffle, choice, HAND_ORDER, MAX_HAND_LEVEL, getHandStats, upgradePrice } = Core;

  const unowned = (): Joker[] => {
    const owned = new Set(state.jokers.map((joker) => joker.id));
    return JOKERS.filter((joker) => !owned.has(joker.id));
  };

  function rollOffers(): void {
    shopState.offers = shuffle(unowned().slice()).slice(0, 3);
  }

  function rollUpgradeOffers(): void {
    shopState.upgradeOffers = shuffle(
      HAND_ORDER.filter((key) => getHandStats(key, state.handLevels).level < MAX_HAND_LEVEL)
    )
      .slice(0, 2)
      .map((key) => ({ key, sold: false }));
  }

  /* Each shop visit re-rolls pricing glitches and the anomaly shelf. */
  function rollAnomalies(): void {
    shopState.discount = 1;
    const roll = Math.random();
    if (roll < 0.18) shopState.discount = 0.75;
    else if (roll < 0.3) shopState.discount = 1.25;
    shopState.mystery =
      unowned().length > 0 && Math.random() < 0.55 ? { price: 6, sold: false } : null;
    shopState.service = Math.random() < 0.5 ? { price: 5, sold: false } : null;
    shopState.risk = Math.random() < 0.45 ? { price: 3, sold: false } : null;
    if (shopState.discount < 1) {
      SFX.event('good');
      glitchFx();
      announcer.announce('价签故障：全场 75 折', 'gold');
    } else if (shopState.discount > 1) {
      SFX.event('bad');
      announcer.announce('通胀脉冲：价格 +25%', 'bad');
    }
  }

  const effPrice = (price: number): number => Math.max(1, Math.round(price * shopState.discount));

  function openShop(base: number, bonus: number, skipBonus: number, interest: number): void {
    state.phase = 'shop';
    rollOffers();
    rollUpgradeOffers();
    rollAnomalies();
    const total = base + bonus + skipBonus + interest;
    const skipPart = skipBonus ? ` · 跳关 +${skipBonus}` : '';
    $('#rewardLine').innerHTML =
      `过关奖励 <b>+${total} 金</b>（基础 +${base} · 剩余出牌 +${bonus}${skipPart} · 利息 +${interest}）`;
    renderShop();
    showModal('#shop');
    /* Always present the shelf from the top, ignoring last visit's scroll. */
    const card = document.querySelector<HTMLElement>('#shop .modal-card');
    if (card) {
      card.scrollTop = 0;
      requestAnimationFrame(() => {
        card.scrollTop = 0;
      });
    }
  }

  function coinBurst(count: number): void {
    popEl($('#goldVal'));
    const point = elCenter($('#goldVal'));
    FX.coins(point.x, point.y, count);
  }

  function buyJoker(joker: Joker): void {
    const price = effPrice(joker.price);
    if (
      state.jokers.includes(joker) ||
      state.gold < price ||
      state.jokers.length >= state.maxJokers
    ) {
      SFX.deny();
      return;
    }
    state.gold -= price;
    state.jokers.push(joker);
    SFX.buy();
    renderGold();
    renderJokers();
    renderShop();
    coinBurst(6);
  }

  function buyUpgrade(offer: ShopOffer): void {
    const current = getHandStats(offer.key, state.handLevels);
    const price = effPrice(upgradePrice(offer.key, state.handLevels));
    if (offer.sold || current.level >= MAX_HAND_LEVEL || state.gold < price) {
      SFX.deny();
      return;
    }
    state.gold -= price;
    state.handLevels[offer.key] = current.level + 1;
    offer.sold = true;
    SFX.buy();
    renderGold();
    buildHandTable();
    renderShop();
    coinBurst(5);
  }

  /* Anomaly: pay 6, receive a random undisclosed joker. */
  function buyMystery(): void {
    const offer = shopState.mystery;
    const unownedJokers = unowned();
    const pool = unownedJokers.filter((joker) => !shopState.offers.includes(joker));
    const pick = pool.length ? choice(pool) : unownedJokers.length ? choice(unownedJokers) : null;
    if (
      !offer ||
      offer.sold ||
      !pick ||
      state.gold < offer.price ||
      state.jokers.length >= state.maxJokers
    ) {
      SFX.deny();
      return;
    }
    state.gold -= offer.price;
    state.jokers.push(pick);
    offer.sold = true;
    SFX.buy();
    glitchFx();
    announcer.announce(`信号解码：${pick.name}`, 'weird');
    renderGold();
    renderJokers();
    renderShop();
    coinBurst(6);
  }

  /* Anomaly: pay 5, three cards of next level's deck get mutated. */
  function buyService(): void {
    const offer = shopState.service;
    if (!offer || offer.sold || state.gold < offer.price) {
      SFX.deny();
      return;
    }
    state.gold -= offer.price;
    for (let i = 0; i < 3; i++) state.pendingMutations.push(choice(STATE_KEYS));
    offer.sold = true;
    SFX.buy();
    announcer.announce('改造舱已预约：下一关 3 张牌将变异', 'weird');
    renderGold();
    renderShop();
    renderStatus?.();
    coinBurst(5);
  }

  /* Anomaly: pay 3, coin flip for 8 gold or nothing. */
  function buyRisk(): void {
    const offer = shopState.risk;
    if (!offer || offer.sold || state.gold < offer.price) {
      SFX.deny();
      return;
    }
    state.gold -= offer.price;
    offer.sold = true;
    if (Math.random() < 0.5) {
      state.gold += 8;
      SFX.coin();
      announcer.announce('赌局命中：金币+8', 'gold');
      coinBurst(10);
    } else {
      SFX.deny();
      glitchFx();
      announcer.announce('吞币。终端笑了。', 'bad');
    }
    renderGold();
    renderShop();
  }

  function sellJoker(joker: Joker): void {
    if (state.phase !== 'play' && state.phase !== 'shop') {
      SFX.deny();
      return;
    }
    const index = state.jokers.indexOf(joker);
    if (index < 0) return;
    const point = joker.el ? elCenter(joker.el) : { x: 240, y: 140 };
    state.jokers.splice(index, 1);
    state.gold += sellPrice(joker);
    SFX.coin();
    FX.coins(point.x, point.y, 5);
    floatText(point.x, point.y, `+${sellPrice(joker)} 金`, 'f-gold');
    renderGold();
    popEl($('#goldVal'));
    renderJokers();
    if (state.phase === 'shop') renderShop();
  }

  function buySlot(price: number): void {
    if (state.maxJokers >= JOKER_SLOTS_CAP || state.gold < price) {
      SFX.deny();
      return;
    }
    state.gold -= price;
    state.maxJokers++;
    SFX.buy();
    renderGold();
    renderJokers();
    renderShop();
    popEl($('#goldVal'));
  }

  function rerollShop(): void {
    if (state.gold < 2) {
      SFX.deny();
      return;
    }
    state.gold -= 2;
    SFX.discard();
    rollOffers();
    rollUpgradeOffers();
    if (Math.random() < 0.15 && shopState.discount > 0.85) {
      shopState.discount = 0.85;
      glitchFx();
      SFX.event('weird');
      announcer.announce('货架闪烁：意外折扣 85 折', 'gold');
    }
    renderShop();
  }

  return {
    rollOffers,
    rollUpgradeOffers,
    rollAnomalies,
    effPrice,
    openShop,
    buyJoker,
    buyUpgrade,
    buyMystery,
    buyService,
    buyRisk,
    sellJoker,
    buySlot,
    rerollShop,
  };
}
