/* HUD counters and action button state. */
((root) => {
  function createHudView(deps) {
    const { $, state, fmt } = deps;

    function renderCounts() {
      $('#levelNum').textContent = state.level;
      $('#targetScore').textContent = fmt(state.target);
      $('#handsLeft').textContent = state.handsLeft;
      $('#discardsLeft').textContent = state.discardsLeft;
      $('#deckLeft').textContent = state.deck.length;
    }

    function renderScore() {
      $('#roundScore').textContent = fmt(state.score);
      $('#totalScore').textContent = fmt(state.total);
    }

    function renderGold() {
      $('#goldVal').textContent = state.gold;
      $('#shopGold').textContent = state.gold;
      $('#shopTotal').textContent = fmt(state.total);
    }

    function renderButtons() {
      const sel = state.hand.filter((c) => c.sel).length;
      $('#btnPlay').disabled = !(state.phase === 'play' && sel > 0);
      $('#btnDiscard').disabled = !(state.phase === 'play' && sel > 0 && state.discardsLeft > 0);
    }

    return { renderCounts, renderScore, renderGold, renderButtons };
  }

  const api = { createHudView };
  root.JokerHudView = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
