/* Selected-hand preview readout. */
((root) => {
  function createReadoutView(deps) {
    const { $, state, fmt, chipVal, evaluateHand, previewStateChips, popEl, renderButtons } = deps;

    function resetReadout() {
      $('#handName').textContent = '— 选择最多 5 张牌 —';
      $('#calc').classList.add('preview');
      $('#chipsDisp').textContent = '0';
      $('#multDisp').textContent = '0';
      $('#totalDisp').textContent = '';
    }

    function updatePreview() {
      const sel = state.hand.filter((c) => c.sel);
      $('#selCount').textContent = sel.length;
      if (!sel.length) {
        resetReadout();
        renderButtons();
        return;
      }
      const ev = evaluateHand(sel, state.handLevels);
      const boost = state.mods && state.mods.suitBoost;
      const chips =
        ev.baseChips +
        ev.scoring.reduce((s, c) => {
          const v = chipVal(c.rank);
          const hot = boost && c.suit === boost.suit ? boost.chips : 0;
          return s + v + hot + (previewStateChips ? previewStateChips(c, v) : 0);
        }, 0);
      let mult = ev.baseMult;
      if (state.mods) {
        mult += state.mods.nextHandMult;
        if (state.mods.nextHandXMult !== 1)
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

  const api = { createReadoutView };
  root.JokerReadoutView = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
