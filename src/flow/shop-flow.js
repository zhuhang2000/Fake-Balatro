/* Shop state transitions and purchase actions. */
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
      renderGold,
      renderJokers,
      buildHandTable,
      showModal,
      renderShop,
    } = deps;
    const { shuffle, HAND_ORDER, MAX_HAND_LEVEL, getHandStats, upgradePrice } = Core;

    function rollOffers() {
      const owned = new Set(state.jokers.map((j) => j.id));
      shopState.offers = shuffle(JOKERS.filter((j) => !owned.has(j.id))).slice(0, 3);
    }

    function rollUpgradeOffers() {
      shopState.upgradeOffers = shuffle(
        HAND_ORDER.filter((k) => getHandStats(k, state.handLevels).level < MAX_HAND_LEVEL)
      )
        .slice(0, 2)
        .map((key) => ({ key, sold: false }));
    }

    function openShop(base, bonus, interest) {
      state.phase = 'shop';
      rollOffers();
      rollUpgradeOffers();
      $('#rewardLine').innerHTML =
        `过关奖励 <b>+${base + bonus + interest} 金</b>（基础 +${base} · 剩余出牌 +${bonus} · 利息 +${interest}）`;
      renderShop();
      showModal('#shop');
    }

    function buyJoker(j) {
      if (
        state.jokers.includes(j) ||
        state.gold < j.price ||
        state.jokers.length >= state.maxJokers
      ) {
        SFX.deny();
        return;
      }
      state.gold -= j.price;
      state.jokers.push(j);
      SFX.buy();
      renderGold();
      renderJokers();
      renderShop();
      popEl($('#goldVal'));
      const p = elCenter($('#goldVal'));
      FX.coins(p.x, p.y, 6);
    }

    function buyUpgrade(o) {
      const cur = getHandStats(o.key, state.handLevels);
      const price = upgradePrice(o.key, state.handLevels);
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
      popEl($('#goldVal'));
      const p = elCenter($('#goldVal'));
      FX.coins(p.x, p.y, 5);
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
      renderShop();
    }

    return {
      rollOffers,
      rollUpgradeOffers,
      openShop,
      buyJoker,
      buyUpgrade,
      sellJoker,
      buySlot,
      rerollShop,
    };
  }

  const api = { createShopFlow };
  root.JokerShopFlow = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
