/* Playing card model and deck helpers. */
((root) => {
  const SUITS = [
    { s: '♠', c: 'black' },
    { s: '♥', c: 'red' },
    { s: '♦', c: 'red' },
    { s: '♣', c: 'black' },
  ];
  const SUIT_ORDER = { '♠': 0, '♥': 1, '♦': 2, '♣': 3 };
  const rankName = (r) =>
    r === 14 ? 'A' : r === 13 ? 'K' : r === 12 ? 'Q' : r === 11 ? 'J' : String(r);
  const chipVal = (r) => (r === 14 ? 11 : r > 10 ? 10 : r);
  function makeDeck() {
    const d = [];
    let uid = 0;
    for (const su of SUITS)
      for (let r = 2; r <= 14; r++)
        d.push({ id: uid++, suit: su.s, color: su.c, rank: r, sel: false });
    return d;
  }

  const api = { SUITS, SUIT_ORDER, rankName, chipVal, makeDeck };
  root.JokerCards = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
