/* Shop DOM rendering. */
((root) => {
  function createShopView(deps) {
    const {
      $,
      state,
      shopState,
      handlers,
      HAND_TYPES,
      MAX_HAND_LEVEL,
      JOKER_SLOTS_BASE,
      JOKER_SLOTS_CAP,
      getHandStats,
      upgradePrice,
      sellPrice,
      drawJokerIcon,
      renderGold,
    } = deps;

    function appendShopTitle(box, text) {
      const h = document.createElement('div');
      h.className = 'shop-section-title';
      h.textContent = text;
      box.appendChild(h);
    }

    function upgradeGainText(cur, next) {
      const parts = [];
      if (next.chips > cur.chips) parts.push('+' + (next.chips - cur.chips) + '筹码');
      if (next.mult > cur.mult) parts.push('+' + (next.mult - cur.mult) + '倍率');
      return parts.join(' / ') || '已达上限';
    }

    function renderUpgradeOffers(box) {
      appendShopTitle(box, '牌 型 训 练');
      if (!shopState.upgradeOffers.length) {
        const d = document.createElement('div');
        d.className = 'shop-empty shop-wide';
        d.textContent = '全部牌型已训练到上限';
        box.appendChild(d);
        return;
      }
      shopState.upgradeOffers.forEach((o) => {
        const cur = getHandStats(o.key, state.handLevels);
        const nextLevels = Object.assign({}, state.handLevels, {
          [o.key]: Math.min(MAX_HAND_LEVEL, cur.level + 1),
        });
        const next = getHandStats(o.key, nextLevels);
        const price = upgradePrice(o.key, state.handLevels);
        const d = document.createElement('div');
        d.className = 'offer offer-upgrade' + (o.sold ? ' sold' : '');
        const badge = document.createElement('div');
        badge.className = 'upgrade-badge';
        badge.textContent = 'Lv.' + cur.level;
        const nm = document.createElement('div');
        nm.className = 'oname';
        nm.textContent = HAND_TYPES[o.key].name + '训练';
        const ds = document.createElement('div');
        ds.className = 'odesc';
        ds.textContent = `Lv.${cur.level} → Lv.${next.level} · ${upgradeGainText(cur, next)}`;
        const bt = document.createElement('button');
        bt.className = 'btn-mini';
        bt.textContent = o.sold ? '已训练' : `训练 ${price} 金`;
        bt.disabled = o.sold || state.gold < price || cur.level >= MAX_HAND_LEVEL;
        bt.onclick = () => handlers.buyUpgrade(o);
        d.append(badge, nm, ds, bt);
        box.appendChild(d);
      });
    }

    function drawSlotIcon(cv) {
      const G = 16,
        px = cv.width / G,
        g = cv.getContext('2d');
      const P = (x, y, c) => {
        g.fillStyle = c;
        g.fillRect(Math.floor(x * px), Math.floor(y * px), Math.ceil(px), Math.ceil(px));
      };
      g.fillStyle = '#101024';
      g.fillRect(0, 0, cv.width, cv.height);
      const dash = '#5a5a8a',
        gold = '#ffd23f';
      for (let x = 2; x <= 13; x++)
        if (x % 2 === 0) {
          P(x, 2, dash);
          P(x, 13, dash);
        }
      for (let y = 2; y <= 13; y++)
        if (y % 2 === 0) {
          P(2, y, dash);
          P(13, y, dash);
        }
      for (let y = 5; y <= 10; y++) {
        P(7, y, gold);
        P(8, y, gold);
      }
      for (let x = 5; x <= 10; x++) {
        P(x, 7, gold);
        P(x, 8, gold);
      }
    }

    function renderShop() {
      const box = $('#shopOffers');
      box.innerHTML = '';
      renderGold();
      appendShopTitle(box, '怪 诞 小 丑');
      if (!shopState.offers.length) {
        const d = document.createElement('div');
        d.className = 'shop-empty';
        d.textContent = '货架空了……小丑们都被你带走了';
        box.appendChild(d);
      }
      shopState.offers.forEach((j) => {
        const owned = state.jokers.includes(j);
        const d = document.createElement('div');
        d.className = 'offer' + (owned ? ' sold' : '');
        const cv = document.createElement('canvas');
        cv.width = 64;
        cv.height = 64;
        drawJokerIcon(cv, j.art);
        const nm = document.createElement('div');
        nm.className = 'oname';
        nm.textContent = j.name;
        const ds = document.createElement('div');
        ds.className = 'odesc';
        ds.textContent = j.desc;
        const bt = document.createElement('button');
        bt.className = 'btn-mini';
        bt.textContent = owned ? '已 售' : `购买 ${j.price} 金`;
        bt.disabled = owned || state.gold < j.price || state.jokers.length >= state.maxJokers;
        bt.onclick = () => handlers.buyJoker(j);
        d.append(cv, nm, ds, bt);
        box.appendChild(d);
      });
      renderUpgradeOffers(box);
      appendShopTitle(box, '机 台 改 造');
      const canExp = state.maxJokers < JOKER_SLOTS_CAP;
      const price = state.maxJokers === JOKER_SLOTS_BASE ? 12 : 18;
      const d = document.createElement('div');
      d.className = 'offer offer-exp';
      const cv = document.createElement('canvas');
      cv.width = 64;
      cv.height = 64;
      drawSlotIcon(cv);
      const nm = document.createElement('div');
      nm.className = 'oname';
      nm.textContent = '槽位扩容';
      const ds = document.createElement('div');
      ds.className = 'odesc';
      ds.textContent = canExp
        ? `小丑槽上限 +1（${state.maxJokers} → ${state.maxJokers + 1}，最多 ${JOKER_SLOTS_CAP}）`
        : `小丑槽已达上限 ${JOKER_SLOTS_CAP}`;
      const bt = document.createElement('button');
      bt.className = 'btn-mini';
      bt.textContent = canExp ? `购买 ${price} 金` : '已达上限';
      bt.disabled = !canExp || state.gold < price;
      bt.onclick = () => handlers.buySlot(price);
      d.append(cv, nm, ds, bt);
      box.appendChild(d);

      const ow = $('#shopOwned');
      ow.innerHTML = '';
      if (state.jokers.length) {
        const h = document.createElement('div');
        h.className = 'owned-title';
        h.textContent = `我的小丑 ${state.jokers.length}/${state.maxJokers} · 半价回收，腾位换新`;
        ow.appendChild(h);
        const row = document.createElement('div');
        row.className = 'owned-row';
        state.jokers.forEach((j) => {
          const d = document.createElement('div');
          d.className = 'owned-chip';
          const cv = document.createElement('canvas');
          cv.width = 64;
          cv.height = 64;
          drawJokerIcon(cv, j.art);
          const nm = document.createElement('div');
          nm.className = 'oc-name';
          nm.textContent = j.name;
          const bt = document.createElement('button');
          bt.className = 'btn-mini';
          bt.textContent = `售 ${sellPrice(j)} 金`;
          bt.onclick = () => handlers.sellJoker(j);
          d.append(cv, nm, bt);
          row.appendChild(d);
        });
        ow.appendChild(row);
      }
      $('#btnReroll').disabled = state.gold < 2;
    }

    return { renderShop, renderUpgradeOffers, drawSlotIcon };
  }

  const api = { createShopView };
  root.JokerShopView = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
