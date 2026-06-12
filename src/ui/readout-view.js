/* Selected-hand preview readout. */
((root) => {
  function createReadoutView(deps) {
    const { $, state, fmt, chipVal, evaluateHand, popEl, renderButtons } = deps;

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
      const chips = ev.baseChips + ev.scoring.reduce((s, c) => s + chipVal(c.rank), 0);
      const hn = $('#handName');
      hn.textContent = `${ev.name} Lv.${ev.level}`;
      popEl(hn, 'bump');
      $('#calc').classList.add('preview');
      $('#chipsDisp').textContent = fmt(chips);
      $('#multDisp').textContent = fmt(ev.baseMult);
      $('#totalDisp').textContent = fmt(chips * ev.baseMult);
      renderButtons();
    }

    return { resetReadout, updatePreview };
  }

  const api = { createReadoutView };
  root.JokerReadoutView = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
