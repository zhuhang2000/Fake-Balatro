/* Game state factories and shared state constants. */
((root) => {
  const Core = typeof require !== 'undefined' ? require('../core/index.js') : root.JokerCore;
  const { initHandLevels } = Core;

  const HANDS_PER = 4;
  const DISCARDS_PER = 3;
  const HAND_SIZE = 8;
  const MAX_PLAY = 5;
  const JOKER_SLOTS_BASE = 5;
  const JOKER_SLOTS_CAP = 7;
  const sellPrice = (j) => Math.max(1, Math.floor(j.price / 2));

  function createInitialState() {
    return {
      level: 1,
      target: 0,
      score: 0,
      total: 0,
      gold: 4,
      handsLeft: 0,
      discardsLeft: 0,
      deck: [],
      hand: [],
      played: [],
      jokers: [],
      maxJokers: JOKER_SLOTS_BASE,
      handLevels: initHandLevels(),
      phase: 'boot',
      sort: 'rank',
      endless: false,
    };
  }

  function createShopState() {
    return { offers: [], upgradeOffers: [] };
  }

  const api = {
    HANDS_PER,
    DISCARDS_PER,
    HAND_SIZE,
    MAX_PLAY,
    JOKER_SLOTS_BASE,
    JOKER_SLOTS_CAP,
    sellPrice,
    createInitialState,
    createShopState,
  };

  root.JokerGameState = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
