import type { EventKind, ModalsViewApi, ModalsViewDeps, Suit } from '../types';

type StatusTone = 'sys' | 'good' | 'bad' | 'weird' | 'gold' | EventKind;

interface ActiveEffect {
  tone: StatusTone;
  label: string;
  desc: string;
}

interface StatusChip {
  tone: StatusTone;
  label: string;
}

const SUIT_HOT: Record<Suit, string> = { '♠': '黑桃', '♥': '红心', '♦': '方块', '♣': '梅花' };

export function createModalsView(deps: ModalsViewDeps): ModalsViewApi {
  const { $, state, HAND_ORDER, getHandStats, CARD_STATES } = deps;

  function activeEffects(): ActiveEffect[] {
    const out: ActiveEffect[] = [];
    const m = state.mods;
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
        desc: `本关 ${SUIT_HOT[s.suit]}（${s.suit}）参与计分时，每张额外 筹码+${s.chips}。`,
      });
    }
    if (m.nextHandMult) {
      out.push({
        tone: 'good',
        label: `下一手 倍率+${m.nextHandMult}`,
        desc: `下一次出牌结算时，倍率额外 +${m.nextHandMult}（用过即消）。`,
      });
    }
    if (m.nextHandXMult !== 1) {
      out.push({
        tone: m.nextHandXMult < 1 ? 'bad' : 'good',
        label: `下一手 ×${m.nextHandXMult} 倍率`,
        desc: `下一次出牌结算时，倍率将 ×${m.nextHandXMult}（用过即消）。`,
      });
    }
    if (state.pendingMutations.length) {
      out.push({
        tone: 'weird',
        label: `下关变异 ×${state.pendingMutations.length}`,
        desc: `已预约：下一关开局时，牌堆中 ${state.pendingMutations.length} 张牌会被随机注入特殊状态。`,
      });
    }
    return out;
  }

  function renderStatus() {
    const bar = document.querySelector('#statusBar');
    if (!bar) return;
    bar.innerHTML = '';
    const chips: StatusChip[] = activeEffects().map((effect) => ({
      tone: effect.tone,
      label: effect.label,
    }));
    state.eventLog.forEach((event) =>
      chips.push({ tone: event.kind === 'mixed' ? 'weird' : event.kind, label: event.name })
    );
    if (!chips.length) {
      const d = document.createElement('span');
      d.className = 'st-chip st-idle';
      d.textContent = '本关暂无异常 · 点「特殊牌」查看说明';
      bar.appendChild(d);
      return;
    }
    chips.forEach((chip) => {
      const d = document.createElement('span');
      d.className = 'st-chip st-' + chip.tone;
      d.textContent = chip.label;
      bar.appendChild(d);
    });
  }

  function buildStatesModal() {
    const body = document.querySelector('#statesBody');
    if (!body) return;
    body.innerHTML = '';

    const eff = activeEffects();
    const secA = document.createElement('div');
    secA.className = 'states-section';
    const hA = document.createElement('div');
    hA.className = 'states-h';
    hA.textContent = '当 前 生 效';
    secA.appendChild(hA);
    if (!eff.length && !state.eventLog.length) {
      const p = document.createElement('div');
      p.className = 'states-empty';
      p.textContent = '本关暂无生效的事件或修正。';
      secA.appendChild(p);
    } else {
      eff.forEach((effect) => {
        const row = document.createElement('div');
        row.className = 'states-row';
        row.innerHTML = `<span class="st-chip st-${effect.tone}">${effect.label}</span><span class="states-desc">${effect.desc}</span>`;
        secA.appendChild(row);
      });
      state.eventLog.forEach((event) => {
        const tone = event.kind === 'mixed' ? 'weird' : event.kind;
        const row = document.createElement('div');
        row.className = 'states-row';
        row.innerHTML = `<span class="st-chip st-${tone}">${event.name}</span><span class="states-desc">${event.lines.join('；')}</span>`;
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
    Object.values(CARD_STATES).forEach((meta) => {
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

  function showModal(sel: string) {
    $(sel).classList.remove('hidden');
  }

  function hideModal(sel: string) {
    $(sel).classList.add('hidden');
  }

  function hideModals() {
    document.querySelectorAll('.modal').forEach((modal) => modal.classList.add('hidden'));
  }

  function buildHandTable() {
    const tb = $('#handTable');
    tb.innerHTML =
      '<tr><td style="color:var(--text-dim)">牌型</td><td style="color:var(--text-dim)">基础筹码</td><td style="color:var(--text-dim)">基础倍率</td></tr>';
    HAND_ORDER.forEach((key) => {
      const handStats = getHandStats(key, state.handLevels);
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${handStats.name} Lv.${handStats.level}</td><td>${handStats.chips}</td><td>×${handStats.mult}</td>`;
      tb.appendChild(tr);
    });
  }

  return { showModal, hideModal, hideModals, buildHandTable, renderStatus, buildStatesModal };
}
