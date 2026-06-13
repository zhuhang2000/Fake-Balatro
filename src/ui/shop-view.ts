import type { HandLevels, Joker, ShopAnomaly, ShopViewApi, ShopViewDeps } from '../types';

export function createShopView(deps: ShopViewDeps): ShopViewApi {
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

  function appendShopTitle(box: Element, text: string) {
    const h = document.createElement('div');
    h.className = 'shop-section-title';
    h.textContent = text;
    box.appendChild(h);
  }

  function priceTag(base: number) {
    const eff = handlers.effPrice(base);
    if (eff === base) return `${eff} 金`;
    return `<s>${base}</s> ${eff} 金`;
  }

  function upgradeGainText(
    cur: { chips: number; mult: number },
    next: { chips: number; mult: number }
  ) {
    const parts: string[] = [];
    if (next.chips > cur.chips) parts.push('+' + (next.chips - cur.chips) + '筹码');
    if (next.mult > cur.mult) parts.push('+' + (next.mult - cur.mult) + '倍率');
    return parts.join(' / ') || '已达上限';
  }

  function renderUpgradeOffers(box: Element) {
    appendShopTitle(box, '牌 型 训 练');
    if (!shopState.upgradeOffers.length) {
      const d = document.createElement('div');
      d.className = 'shop-empty shop-wide';
      d.textContent = '全部牌型已训练到上限';
      box.appendChild(d);
      return;
    }
    shopState.upgradeOffers.forEach((offer) => {
      const cur = getHandStats(offer.key, state.handLevels);
      const nextLevels: HandLevels = {
        ...state.handLevels,
        [offer.key]: Math.min(MAX_HAND_LEVEL, cur.level + 1),
      };
      const next = getHandStats(offer.key, nextLevels);
      const basePrice = upgradePrice(offer.key, state.handLevels);
      const price = handlers.effPrice(basePrice);
      const d = document.createElement('div');
      d.className = 'offer offer-upgrade' + (offer.sold ? ' sold' : '');
      const badge = document.createElement('div');
      badge.className = 'upgrade-badge';
      badge.textContent = 'Lv.' + cur.level;
      const nm = document.createElement('div');
      nm.className = 'oname';
      nm.textContent = HAND_TYPES[offer.key].name + '训练';
      const ds = document.createElement('div');
      ds.className = 'odesc';
      ds.textContent = `Lv.${cur.level} → Lv.${next.level} · ${upgradeGainText(cur, next)}`;
      const bt = document.createElement('button');
      bt.className = 'btn-mini';
      if (offer.sold) bt.textContent = '已训练';
      else bt.innerHTML = `训练 ${priceTag(basePrice)}`;
      bt.disabled = offer.sold || state.gold < price || cur.level >= MAX_HAND_LEVEL;
      bt.onclick = () => handlers.buyUpgrade(offer);
      d.append(badge, nm, ds, bt);
      box.appendChild(d);
    });
  }

  function pixelPad(cv: HTMLCanvasElement) {
    const grid = 16;
    const px = cv.width / grid;
    const g = cv.getContext('2d');
    if (!g) throw new Error('Missing 2D canvas context for shop icon');
    const P = (x: number, y: number, color: string) => {
      g.fillStyle = color;
      g.fillRect(Math.floor(x * px), Math.floor(y * px), Math.ceil(px), Math.ceil(px));
    };
    return { g, P };
  }

  function drawSlotIcon(cv: HTMLCanvasElement) {
    const { g, P } = pixelPad(cv);
    g.fillStyle = '#101024';
    g.fillRect(0, 0, cv.width, cv.height);
    const dash = '#5a5a8a';
    const gold = '#ffd23f';
    for (let x = 2; x <= 13; x++) {
      if (x % 2 === 0) {
        P(x, 2, dash);
        P(x, 13, dash);
      }
    }
    for (let y = 2; y <= 13; y++) {
      if (y % 2 === 0) {
        P(2, y, dash);
        P(13, y, dash);
      }
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

  function drawMysteryIcon(cv: HTMLCanvasElement) {
    const { g, P } = pixelPad(cv);
    g.fillStyle = '#0c0c1c';
    g.fillRect(0, 0, cv.width, cv.height);
    for (let i = 0; i < 40; i++) {
      P((Math.random() * 16) | 0, (Math.random() * 16) | 0, 'rgba(255,59,119,.25)');
    }
    const m = '#ff3b77';
    for (let x = 5; x <= 10; x++) P(x, 3, m);
    P(10, 4, m);
    P(11, 4, m);
    P(11, 5, m);
    P(10, 6, m);
    P(9, 7, m);
    P(8, 8, m);
    P(8, 9, m);
    P(8, 12, m);
    P(4, 4, m);
    P(4, 5, m);
  }

  function drawServiceIcon(cv: HTMLCanvasElement) {
    const { g, P } = pixelPad(cv);
    g.fillStyle = '#101c14';
    g.fillRect(0, 0, cv.width, cv.height);
    const a = '#3df5e0';
    const b = '#a96bff';
    for (let y = 4; y <= 11; y++) {
      for (let x = 5; x <= 10; x++) {
        const edge = y === 4 || y === 11 || x === 5 || x === 10;
        if (edge) P(x, y, y < 8 ? a : b);
      }
    }
    for (let x = 6; x <= 9; x++) P(x, 8, '#e8e8f4');
    P(12, 3, a);
    P(13, 2, a);
    P(2, 12, b);
    P(3, 13, b);
  }

  function drawRiskIcon(cv: HTMLCanvasElement) {
    const { g, P } = pixelPad(cv);
    g.fillStyle = '#1c0c10';
    g.fillRect(0, 0, cv.width, cv.height);
    const w = '#f4ecd9';
    const d = '#180f16';
    const gold = '#ffd23f';
    for (let y = 4; y <= 11; y++) for (let x = 4; x <= 11; x++) P(x, y, w);
    P(4, 4, d);
    P(11, 4, d);
    P(4, 11, d);
    P(11, 11, d);
    P(6, 6, d);
    P(9, 6, d);
    P(7, 8, gold);
    P(8, 8, gold);
    P(6, 10, d);
    P(7, 10, d);
    P(8, 10, d);
    P(9, 10, d);
  }

  function anomalyOffer(
    box: Element,
    icon: (canvas: HTMLCanvasElement) => void,
    name: string,
    desc: string,
    offer: ShopAnomaly,
    soldText: string,
    onBuy: () => void,
    extraDisabled = false
  ) {
    const d = document.createElement('div');
    d.className = 'offer offer-anomaly' + (offer.sold ? ' sold' : '');
    const cv = document.createElement('canvas');
    cv.width = 64;
    cv.height = 64;
    icon(cv);
    const nm = document.createElement('div');
    nm.className = 'oname';
    nm.textContent = name;
    const ds = document.createElement('div');
    ds.className = 'odesc';
    ds.textContent = desc;
    const bt = document.createElement('button');
    bt.className = 'btn-mini';
    bt.textContent = offer.sold ? soldText : `购买 ${offer.price} 金`;
    bt.disabled = offer.sold || state.gold < offer.price || extraDisabled;
    bt.onclick = onBuy;
    d.append(cv, nm, ds, bt);
    box.appendChild(d);
  }

  function renderAnomalies(box: Element) {
    const { mystery, service, risk } = shopState;
    if (!mystery && !service && !risk) return;
    appendShopTitle(box, '异 常 货 架');
    if (mystery) {
      anomalyOffer(
        box,
        drawMysteryIcon,
        '神秘信号',
        '一张未解码的小丑牌。是宝是雷，付款后揭晓。',
        mystery,
        '已解码',
        () => handlers.buyMystery(),
        state.jokers.length >= state.maxJokers
      );
    }
    if (service) {
      anomalyOffer(
        box,
        drawServiceIcon,
        '改造舱',
        '下一关牌堆中 3 张牌随机变异（镀金/裂纹/回声/污染）。',
        service,
        '已预约',
        () => handlers.buyService()
      );
    }
    if (risk) {
      anomalyOffer(
        box,
        drawRiskIcon,
        '故障赌局',
        '投入 3 金：50% 吐出 8 金，50% 机器吞币。',
        risk,
        '已结算',
        () => handlers.buyRisk()
      );
    }
  }

  function renderJokerOffer(box: Element, joker: Joker) {
    const owned = state.jokers.includes(joker);
    const d = document.createElement('div');
    d.className = 'offer' + (owned ? ' sold' : '');
    const cv = document.createElement('canvas');
    cv.width = 64;
    cv.height = 64;
    drawJokerIcon(cv, joker.art);
    const nm = document.createElement('div');
    nm.className = 'oname';
    nm.textContent = joker.name;
    const ds = document.createElement('div');
    ds.className = 'odesc';
    ds.textContent = joker.desc;
    const bt = document.createElement('button');
    bt.className = 'btn-mini';
    if (owned) bt.textContent = '已 售';
    else bt.innerHTML = `购买 ${priceTag(joker.price)}`;
    bt.disabled =
      owned ||
      state.gold < handlers.effPrice(joker.price) ||
      state.jokers.length >= state.maxJokers;
    bt.onclick = () => handlers.buyJoker(joker);
    d.append(cv, nm, ds, bt);
    box.appendChild(d);
  }

  function renderSlotExpansion(box: Element) {
    appendShopTitle(box, '机 台 改 造');
    const canExpand = state.maxJokers < JOKER_SLOTS_CAP;
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
    ds.textContent = canExpand
      ? `小丑槽上限 +1（${state.maxJokers} → ${state.maxJokers + 1}，最多 ${JOKER_SLOTS_CAP}）`
      : `小丑槽已达上限 ${JOKER_SLOTS_CAP}`;
    const bt = document.createElement('button');
    bt.className = 'btn-mini';
    bt.textContent = canExpand ? `购买 ${price} 金` : '已达上限';
    bt.disabled = !canExpand || state.gold < price;
    bt.onclick = () => handlers.buySlot(price);
    d.append(cv, nm, ds, bt);
    box.appendChild(d);
  }

  function renderOwnedJokers() {
    const ownedWrap = $('#shopOwned');
    ownedWrap.innerHTML = '';
    if (!state.jokers.length) return;
    const h = document.createElement('div');
    h.className = 'owned-title';
    h.textContent = `我的小丑 ${state.jokers.length}/${state.maxJokers} · 半价回收，腾位换新`;
    ownedWrap.appendChild(h);
    const row = document.createElement('div');
    row.className = 'owned-row';
    state.jokers.forEach((joker) => {
      const d = document.createElement('div');
      d.className = 'owned-chip';
      const cv = document.createElement('canvas');
      cv.width = 64;
      cv.height = 64;
      drawJokerIcon(cv, joker.art);
      const nm = document.createElement('div');
      nm.className = 'oc-name';
      nm.textContent = joker.name;
      const tip = document.createElement('div');
      tip.className = 'octip';
      tip.textContent = joker.desc;
      const bt = document.createElement('button');
      bt.className = 'btn-mini';
      bt.textContent = `售 ${sellPrice(joker)} 金`;
      bt.onclick = () => handlers.sellJoker(joker);
      d.append(cv, nm, tip, bt);
      row.appendChild(d);
    });
    ownedWrap.appendChild(row);
  }

  function renderShop() {
    const box = $('#shopOffers');
    box.innerHTML = '';
    renderGold();
    if (shopState.discount !== 1) {
      const banner = document.createElement('div');
      banner.className =
        'shop-banner ' + (shopState.discount < 1 ? 'shop-banner-sale' : 'shop-banner-tax');
      banner.textContent =
        shopState.discount < 1
          ? `▚ 价签故障 全场 ${Math.round(shopState.discount * 100)} 折 ▞`
          : '▚ 通胀脉冲 价格 +25% ▞';
      box.appendChild(banner);
    }
    appendShopTitle(box, '怪 诞 小 丑');
    if (!shopState.offers.length) {
      const d = document.createElement('div');
      d.className = 'shop-empty';
      d.textContent = '货架空了……小丑们都被你带走了';
      box.appendChild(d);
    }
    shopState.offers.forEach((joker) => renderJokerOffer(box, joker));
    renderAnomalies(box);
    renderUpgradeOffers(box);
    renderSlotExpansion(box);
    renderOwnedJokers();
    $<HTMLButtonElement>('#btnReroll').disabled = state.gold < 2;
  }

  return { renderShop, renderUpgradeOffers, drawSlotIcon };
}
