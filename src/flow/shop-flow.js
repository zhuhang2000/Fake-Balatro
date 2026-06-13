/* Shop state transitions, purchase actions and shelf anomalies. */
((root) => {
  function createShopFlow(deps) {
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
    const STATE_KEYS = ['gilded', 'cracked', 'echo', 'tainted'];

    const unowned = () => {
      const owned = new Set(state.jokers.map((j) => j.id));
      return JOKERS.filter((j) => !owned.has(j.id));
    };

    function rollOffers() {
      shopState.offers = shuffle(unowned().slice()).slice(0, 3);
    }

    function rollUpgradeOffers() {
      shopState.upgradeOffers = shuffle(
        HAND_ORDER.filter((k) => getHandStats(k, state.handLevels).level < MAX_HAND_LEVEL)
      )
        .slice(0, 2)
        .map((key) => ({ key, sold: false }));
    }

    /* Each shop visit re-rolls pricing glitches and the anomaly shelf. */
    function rollAnomalies() {
      shopState.discount = 1;
      const r = Math.random();
      if (r < 0.18) shopState.discount = 0.75;
      else if (r < 0.3) shopState.discount = 1.25;
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

    const effPrice = (price) => Math.max(1, Math.round(price * shopState.discount));

    function openShop(base, bonus, skipBonus, interest) {
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
      const card = document.querySelector('#shop .modal-card');
      if (card) {
        card.scrollTop = 0;
        requestAnimationFrame(() => {
          card.scrollTop = 0;
        });
      }
    }

    function coinBurst(count) {
      popEl($('#goldVal'));
      const p = elCenter($('#goldVal'));
      FX.coins(p.x, p.y, count);
    }

    function buyJoker(j) {
      const price = effPrice(j.price);
      if (
        state.jokers.includes(j) ||
        state.gold < price ||
        state.jokers.length >= state.maxJokers
      ) {
        SFX.deny();
        return;
      }
      state.gold -= price;
      state.jokers.push(j);
      SFX.buy();
      renderGold();
      renderJokers();
      renderShop();
      coinBurst(6);
    }

    function buyUpgrade(o) {
      const cur = getHandStats(o.key, state.handLevels);
      const price = effPrice(upgradePrice(o.key, state.handLevels));
      if (o.sold || cur.level >= MAX_HAND_LEVEL || state.gold < price) {
        SFX.deny();
        return;
      }
      state.gold -= price;
      state.handLevels[o.key] = cur.level + 1;
      o.sold = true;
      SFX.buy();
      renderGold();
      buildHandTable();
      renderShop();
      coinBurst(5);
    }

    /* Anomaly: pay 6, receive a random undisclosed joker. */
    function buyMystery() {
      const offer = shopState.mystery;
      const pool = unowned().filter((j) => !shopState.offers.includes(j));
      const pick = pool.length ? choice(pool) : choice(unowned());
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
    function buyService() {
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
      if (renderStatus) renderStatus();
      coinBurst(5);
    }

    /* Anomaly: pay 3, coin flip for 8 gold or nothing. */
    function buyRisk() {
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

    function sellJoker(j) {
      if (state.phase !== 'play' && state.phase !== 'shop') {
        SFX.deny();
        return;
      }
      const idx = state.jokers.indexOf(j);
      if (idx < 0) return;
      const p = j.el ? elCenter(j.el) : { x: 240, y: 140 };
      state.jokers.splice(idx, 1);
      state.gold += sellPrice(j);
      SFX.coin();
      FX.coins(p.x, p.y, 5);
      floatText(p.x, p.y, '+' + sellPrice(j) + ' 金', 'f-gold');
      renderGold();
      popEl($('#goldVal'));
      renderJokers();
      if (state.phase === 'shop') renderShop();
    }

    function buySlot(price) {
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

    function rerollShop() {
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

  const api = { createShopFlow };
  root.JokerShopFlow = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
