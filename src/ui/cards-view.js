/* Hand, played-card and joker bar rendering. */
((root) => {
  function createCardsView(deps) {
    const { $, state, SUIT_ORDER, rankName, drawJokerIcon, sellPrice, CARD_STATES, handlers } =
      deps;

    function cardEl(c) {
      const d = document.createElement('div');
      d.className = 'card ' + c.color + (c.sel ? ' sel' : '');
      if (c.state) d.classList.add('st-' + c.state);
      d.dataset.id = c.id;
      d.innerHTML =
        `<div class="corner tl"><b>${rankName(c.rank)}</b><i>${c.suit}</i></div>` +
        `<div class="pip">${c.suit}</div>` +
        `<div class="corner br"><b>${rankName(c.rank)}</b><i>${c.suit}</i></div>`;
      if (c.state && CARD_STATES) {
        const meta = CARD_STATES[c.state];
        const b = document.createElement('div');
        b.className = 'stbadge';
        b.textContent = meta.badge;
        b.title = `${meta.name}：${meta.desc}`;
        d.appendChild(b);
      }
      c.el = d;
      return d;
    }

    function sortHand() {
      if (state.sort === 'rank') {
        state.hand.sort((a, b) => b.rank - a.rank || SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit]);
      } else {
        state.hand.sort((a, b) => SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit] || b.rank - a.rank);
      }
    }

    function renderHand(fresh = []) {
      const area = $('#handArea');
      area.innerHTML = '';
      const fset = new Set(fresh.map((c) => c.id));
      let fi = 0;
      state.hand.forEach((c) => {
        const d = cardEl(c);
        if (fset.has(c.id)) {
          d.classList.add('deal');
          d.style.animationDelay = fi++ * 60 + 'ms';
        }
        area.appendChild(d);
      });
      $('#selCount').textContent = state.hand.filter((c) => c.sel).length;
    }

    function renderPlayed() {
      const area = $('#playArea');
      area.innerHTML = '';
      state.played.forEach((c, i) => {
        const d = cardEl(c);
        d.classList.add('deal');
        d.style.animationDelay = i * 50 + 'ms';
        area.appendChild(d);
      });
    }

    function renderJokers() {
      const bar = $('#jokerBar');
      bar.innerHTML = '';
      for (let i = 0; i < state.maxJokers; i++) {
        const j = state.jokers[i];
        if (j) {
          const d = document.createElement('div');
          d.className = 'joker';
          const cv = document.createElement('canvas');
          cv.width = 64;
          cv.height = 64;
          drawJokerIcon(cv, j.art);
          const nm = document.createElement('div');
          nm.className = 'jname';
          nm.textContent = j.name;
          const tip = document.createElement('div');
          tip.className = 'tip';
          tip.textContent = j.desc;
          const ts = document.createElement('div');
          ts.className = 'tip-sell';
          ts.textContent = `点「售」出售，回收 ${sellPrice(j)} 金`;
          tip.appendChild(ts);
          const sb = document.createElement('button');
          sb.className = 'jsell';
          sb.textContent = '售';
          sb.title = `出售 +${sellPrice(j)} 金`;
          sb.onclick = (e) => {
            e.stopPropagation();
            handlers.sellJoker(j);
          };
          d.append(cv, nm, tip, sb);
          j.el = d;
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

  const api = { createCardsView };
  root.JokerCardsView = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
