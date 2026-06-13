import type { HudViewApi, HudViewDeps } from '../types';

export function createHudView(deps: HudViewDeps): HudViewApi {
  const { $, state, fmt } = deps;

  function renderCounts() {
    $('#levelNum').textContent = String(state.level);
    $('#targetScore').textContent = fmt(state.target);
    $('#handsLeft').textContent = String(state.handsLeft);
    $('#discardsLeft').textContent = String(state.discardsLeft);
    $('#deckLeft').textContent = String(state.deck.length);
  }

  function renderScore() {
    $('#roundScore').textContent = fmt(state.score);
    $('#totalScore').textContent = fmt(state.total);
  }

  function renderGold() {
    $('#goldVal').textContent = String(state.gold);
    $('#shopGold').textContent = String(state.gold);
    $('#shopTotal').textContent = fmt(state.total);
  }

  function renderButtons() {
    const sel = state.hand.filter((card) => card.sel).length;
    $<HTMLButtonElement>('#btnPlay').disabled = !(state.phase === 'play' && sel > 0);
    $<HTMLButtonElement>('#btnDiscard').disabled = !(
      state.phase === 'play' &&
      sel > 0 &&
      state.discardsLeft > 0
    );
    const settle = document.querySelector('#btnSettle');
    if (settle) settle.classList.toggle('hidden', !(state.cleared && state.phase === 'play'));
  }

  return { renderCounts, renderScore, renderGold, renderButtons };
}
