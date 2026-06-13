import type { Card, CardsViewApi, CardsViewDeps } from '../types';

export function createCardsView(deps: CardsViewDeps): CardsViewApi {
  const { $, state, SUIT_ORDER, rankName, drawJokerIcon, sellPrice, CARD_STATES, handlers } = deps;

  function cardEl(card: Card) {
    const d = document.createElement('div');
    d.className = 'card ' + card.color + (card.sel ? ' sel' : '');
    if (card.state) d.classList.add('st-' + card.state);
    // biome-ignore lint/complexity/useLiteralKeys: DOMStringMap requires index access under TS noPropertyAccessFromIndexSignature
    d.dataset['id'] = String(card.id);
    d.innerHTML =
      `<div class="corner tl"><b>${rankName(card.rank)}</b><i>${card.suit}</i></div>` +
      `<div class="pip">${card.suit}</div>` +
      `<div class="corner br"><b>${rankName(card.rank)}</b><i>${card.suit}</i></div>`;
    if (card.state) {
      const meta = CARD_STATES[card.state];
      const b = document.createElement('div');
      b.className = 'stbadge';
      b.textContent = meta.badge;
      b.title = `${meta.name}：${meta.desc}`;
      d.appendChild(b);
    }
    card.el = d;
    return d;
  }

  function sortHand() {
    if (state.sort === 'rank') {
      state.hand.sort((a, b) => b.rank - a.rank || SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit]);
    } else {
      state.hand.sort((a, b) => SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit] || b.rank - a.rank);
    }
  }

  function renderHand(fresh: Card[] = []) {
    const area = $('#handArea');
    area.innerHTML = '';
    const freshIds = new Set(fresh.map((card) => card.id));
    let freshIndex = 0;
    state.hand.forEach((card) => {
      const d = cardEl(card);
      if (freshIds.has(card.id)) {
        d.classList.add('deal');
        d.style.animationDelay = freshIndex++ * 60 + 'ms';
      }
      area.appendChild(d);
    });
    $('#selCount').textContent = String(state.hand.filter((card) => card.sel).length);
  }

  function renderPlayed() {
    const area = $('#playArea');
    area.innerHTML = '';
    state.played.forEach((card, index) => {
      const d = cardEl(card);
      d.classList.add('deal');
      d.style.animationDelay = index * 50 + 'ms';
      area.appendChild(d);
    });
  }

  function renderJokers() {
    const bar = $('#jokerBar');
    bar.innerHTML = '';
    for (let i = 0; i < state.maxJokers; i++) {
      const joker = state.jokers[i];
      if (joker) {
        const d = document.createElement('div');
        d.className = 'joker';
        const cv = document.createElement('canvas');
        cv.width = 64;
        cv.height = 64;
        drawJokerIcon(cv, joker.art);
        const nm = document.createElement('div');
        nm.className = 'jname';
        nm.textContent = joker.name;
        const tip = document.createElement('div');
        tip.className = 'tip';
        tip.textContent = joker.desc;
        const ts = document.createElement('div');
        ts.className = 'tip-sell';
        ts.textContent = `点「售」出售，回收 ${sellPrice(joker)} 金`;
        tip.appendChild(ts);
        const sb = document.createElement('button');
        sb.className = 'jsell';
        sb.textContent = '售';
        sb.title = `出售 +${sellPrice(joker)} 金`;
        sb.onclick = (event) => {
          event.stopPropagation();
          handlers.sellJoker(joker);
        };
        d.append(cv, nm, tip, sb);
        joker.el = d;
        bar.appendChild(d);
      } else {
        const d = document.createElement('div');
        d.className = 'joker-slot';
        d.textContent = '空';
        bar.appendChild(d);
      }
    }
  }

  return { cardEl, sortHand, renderHand, renderPlayed, renderJokers };
}
