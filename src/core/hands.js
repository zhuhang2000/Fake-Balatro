/* Poker hand evaluation. */
((root) => {
  const cardsApi = typeof require !== 'undefined' ? require('./cards.js') : root.JokerCards;
  const upgrades = typeof require !== 'undefined' ? require('./upgrades.js') : root.JokerUpgrades;
  const { chipVal } = cardsApi;
  const { HAND_TYPES, HAND_ORDER, getHandStats } = upgrades;

  function evaluateHand(cards, levels = null) {
    const n = cards.length;
    const byRank = {};
    cards.forEach((c) => {
      (byRank[c.rank] = byRank[c.rank] || []).push(c);
    });
    const groups = Object.values(byRank).sort(
      (a, b) => b.length - a.length || b[0].rank - a[0].rank
    );
    const isFlush = n === 5 && cards.every((c) => c.suit === cards[0].suit);
    let isStraight = false;
    if (n === 5 && groups.length === 5) {
      const rs = cards.map((c) => c.rank).sort((a, b) => a - b);
      if (rs[4] - rs[0] === 4) isStraight = true;
      else if (rs.join() === '2,3,4,5,14') isStraight = true;
    }
    let key, scoring;
    if (isStraight && isFlush) {
      key = 'sflush';
      scoring = cards.slice();
    } else if (groups[0].length === 4) {
      key = 'four';
      scoring = groups[0].slice();
    } else if (groups[0].length === 3 && groups[1] && groups[1].length >= 2) {
      key = 'full';
      scoring = cards.slice();
    } else if (isFlush) {
      key = 'flush';
      scoring = cards.slice();
    } else if (isStraight) {
      key = 'straight';
      scoring = cards.slice();
    } else if (groups[0].length === 3) {
      key = 'three';
      scoring = groups[0].slice();
    } else if (groups[0].length === 2 && groups[1] && groups[1].length === 2) {
      key = 'twopair';
      scoring = [...groups[0], ...groups[1]];
    } else if (groups[0].length === 2) {
      key = 'pair';
      scoring = groups[0].slice();
    } else {
      key = 'high';
      scoring = [cards.slice().sort((a, b) => b.rank - a.rank)[0]];
    }

    const set = new Set(scoring.map((c) => c.id));
    scoring = cards.filter((c) => set.has(c.id));
    const t = getHandStats(key, levels);
    return { key, name: t.name, level: t.level, baseChips: t.chips, baseMult: t.mult, scoring };
  }

  const api = { HAND_TYPES, HAND_ORDER, chipVal, evaluateHand };
  root.JokerHands = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
