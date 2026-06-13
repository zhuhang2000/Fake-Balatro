import type { Card, ReadoutViewApi, ReadoutViewDeps } from '../types';

export function createReadoutView(deps: ReadoutViewDeps): ReadoutViewApi {
  const { $, state, fmt, chipVal, evaluateHand, previewStateChips, popEl, renderButtons } = deps;

  function resetReadout() {
    $('#handName').textContent = '— 选择最多 5 张牌 —';
    $('#calc').classList.add('preview');
    $('#chipsDisp').textContent = '0';
    $('#multDisp').textContent = '0';
    $('#totalDisp').textContent = '';
  }

  function updatePreview() {
    const sel = state.hand.filter((card) => card.sel);
    $('#selCount').textContent = String(sel.length);
    if (!sel.length) {
      resetReadout();
      renderButtons();
      return;
    }
    const ev = evaluateHand(sel, state.handLevels);
    const boost = state.mods.suitBoost;
    const chips =
      ev.baseChips +
      ev.scoring.reduce((sum: number, card: Card) => {
        const value = chipVal(card.rank);
        const hot = boost && card.suit === boost.suit ? boost.chips : 0;
        return sum + value + hot + (previewStateChips ? previewStateChips(card, value) : 0);
      }, 0);
    let mult = ev.baseMult;
    mult += state.mods.nextHandMult;
    if (state.mods.nextHandXMult !== 1) {
      mult = Math.max(1, Math.round(mult * state.mods.nextHandXMult));
    }
    const hn = $('#handName');
    hn.textContent = `${ev.name} Lv.${ev.level}`;
    popEl(hn, 'bump');
    $('#calc').classList.add('preview');
    $('#chipsDisp').textContent = fmt(chips);
    $('#multDisp').textContent = fmt(mult);
    $('#totalDisp').textContent = fmt(chips * mult);
    renderButtons();
  }

  return { resetReadout, updatePreview };
}
