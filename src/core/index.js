/* Core public API barrel. */
((root) => {
  const utils = typeof require !== 'undefined' ? require('./utils.js') : root.JokerCoreUtils;
  const cards = typeof require !== 'undefined' ? require('./cards.js') : root.JokerCards;
  const upgrades = typeof require !== 'undefined' ? require('./upgrades.js') : root.JokerUpgrades;
  const hands = typeof require !== 'undefined' ? require('./hands.js') : root.JokerHands;

  const targetFor = (l) => Math.round((250 * Math.pow(1.5, l - 1)) / 10) * 10;
  const api = Object.assign({}, utils, cards, upgrades, hands, { targetFor });

  root.JokerCore = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
