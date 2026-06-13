/* Modal visibility, hand table, live status bar and card-state codex. */
((root) => {
  function createModalsView(deps) {
    const { $, state, HAND_ORDER, getHandStats, CARD_STATES } = deps;

    const SUIT_HOT = { '♠': '黑桃', '♥': '红心', '♦': '方块', '♣': '梅花' };

    /* Collect every modifier currently shaping the run, as {tone,label,desc}. */
    function activeEffects() {
      const out = [];
      const m = state.mods || {};
      if (state.cleared) {
        out.push({
          tone: 'good',
          label: '✓ 已达标',
          desc: '本关目标已达成：可继续打完出牌冲高累计分，或点「结算进店」跳关换取额外金币。',
        });
      }
      if (m.suitBoost) {
        const s = m.suitBoost;
        out.push({
          tone: 'gold',
          label: `${s.suit} 过热 +${s.chips}`,
          desc: `本关 ${SUIT_HOT[s.suit] || s.suit}（${s.suit}）参与计分时，每张额外 筹码+${s.chips}。`,
        });
      }
      if (m.nextHandMult) {
        out.push({
          tone: 'good',
          label: `下一手 倍率+${m.nextHandMult}`,
          desc: `下一次出牌结算时，倍率额外 +${m.nextHandMult}（用过即消）。`,
        });
      }
      if (m.nextHandXMult && m.nextHandXMult !== 1) {
        out.push({
          tone: m.nextHandXMult < 1 ? 'bad' : 'good',
          label: `下一手 ×${m.nextHandXMult} 倍率`,
          desc: `下一次出牌结算时，倍率将 ×${m.nextHandXMult}（用过即消）。`,
        });
      }
      if (state.pendingMutations && state.pendingMutations.length) {
        out.push({
          tone: 'weird',
          label: `下关变异 ×${state.pendingMutations.length}`,
          desc: `已预约：下一关开局时，牌堆中 ${state.pendingMutations.length} 张牌会被随机注入特殊状态。`,
        });
      }
      return out;
    }

    /* Persistent on-screen strip: a glance at what's bending this round. */
    function renderStatus() {
      const bar = document.querySelector('#statusBar');
      if (!bar) return;
      bar.innerHTML = '';
      const chips = [];
      activeEffects().forEach((e) => chips.push({ tone: e.tone, label: e.label }));
      const log = state.eventLog || [];
      log.forEach((ev) =>
        chips.push({ tone: ev.kind === 'mixed' ? 'weird' : ev.kind, label: ev.name })
      );
      if (!chips.length) {
        const d = document.createElement('span');
        d.className = 'st-chip st-idle';
        d.textContent = '本关暂无异常 · 点「特殊牌」查看说明';
        bar.appendChild(d);
        return;
      }
      chips.forEach((c) => {
        const d = document.createElement('span');
        d.className = 'st-chip st-' + (c.tone || 'sys');
        d.textContent = c.label;
        bar.appendChild(d);
      });
    }

    /* Fill the codex modal on demand so "current effects" stay fresh. */
    function buildStatesModal() {
      const body = document.querySelector('#statesBody');
      if (!body) return;
      body.innerHTML = '';

      const eff = activeEffects();
      const log = state.eventLog || [];
      const secA = document.createElement('div');
      secA.className = 'states-section';
      const hA = document.createElement('div');
      hA.className = 'states-h';
      hA.textContent = '当 前 生 效';
      secA.appendChild(hA);
      if (!eff.length && !log.length) {
        const p = document.createElement('div');
        p.className = 'states-empty';
        p.textContent = '本关暂无生效的事件或修正。';
        secA.appendChild(p);
      } else {
        eff.forEach((e) => {
          const row = document.createElement('div');
          row.className = 'states-row';
          row.innerHTML = `<span class="st-chip st-${e.tone}">${e.label}</span><span class="states-desc">${e.desc}</span>`;
          secA.appendChild(row);
        });
        log.forEach((ev) => {
          const tone = ev.kind === 'mixed' ? 'weird' : ev.kind;
          const row = document.createElement('div');
          row.className = 'states-row';
          row.innerHTML = `<span class="st-chip st-${tone}">${ev.name}</span><span class="states-desc">${(ev.lines || []).join('；')}</span>`;
          secA.appendChild(row);
        });
      }
      body.appendChild(secA);

      const secB = document.createElement('div');
      secB.className = 'states-section';
      const hB = document.createElement('div');
      hB.className = 'states-h';
      hB.textContent = '特 殊 牌 图 鉴';
      secB.appendChild(hB);
      const keys = CARD_STATES ? Object.keys(CARD_STATES) : [];
      keys.forEach((k) => {
        const meta = CARD_STATES[k];
        const row = document.createElement('div');
        row.className = 'states-row';
        const badge = document.createElement('span');
        badge.className = 'st-codex-badge';
        badge.textContent = meta.badge;
        badge.style.color = meta.color;
        badge.style.borderColor = meta.color;
        const txt = document.createElement('span');
        txt.className = 'states-desc';
        txt.innerHTML = `<b style="color:${meta.color}">${meta.name}</b> — ${meta.desc}`;
        row.append(badge, txt);
        secB.appendChild(row);
      });
      body.appendChild(secB);
    }

    function showModal(sel) {
      $(sel).classList.remove('hidden');
    }

    function hideModal(sel) {
      $(sel).classList.add('hidden');
    }

    function hideModals() {
      document.querySelectorAll('.modal').forEach((m) => m.classList.add('hidden'));
    }

    function buildHandTable() {
      const tb = $('#handTable');
      tb.innerHTML =
        '<tr><td style="color:var(--text-dim)">牌型</td><td style="color:var(--text-dim)">基础筹码</td><td style="color:var(--text-dim)">基础倍率</td></tr>';
      HAND_ORDER.forEach((k) => {
        const t = getHandStats(k, state.handLevels);
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${t.name} Lv.${t.level}</td><td>${t.chips}</td><td>×${t.mult}</td>`;
        tb.appendChild(tr);
      });
    }

    return { showModal, hideModal, hideModals, buildHandTable, renderStatus, buildStatesModal };
  }

  const api = { createModalsView };
  root.JokerModalsView = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
