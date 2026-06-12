/* Playing card model and deck helpers. */
import type { Card, CardColor, Rank, Suit } from '../types';

const SUITS = [
  { s: '♠', c: 'black' },
  { s: '♥', c: 'red' },
  { s: '♦', c: 'red' },
  { s: '♣', c: 'black' },
] as const satisfies readonly { readonly s: Suit; readonly c: CardColor }[];

export const SUIT_ORDER: Record<Suit, number> = { '♠': 0, '♥': 1, '♦': 2, '♣': 3 };

export const rankName = (rank: Rank): string =>
  rank === 14 ? 'A' : rank === 13 ? 'K' : rank === 12 ? 'Q' : rank === 11 ? 'J' : String(rank);

export const chipVal = (rank: Rank): number => (rank === 14 ? 11 : rank > 10 ? 10 : rank);

export function makeDeck(): Card[] {
  const deck: Card[] = [];
  let uid = 0;
  for (const suit of SUITS) {
    for (let rank = 2; rank <= 14; rank++) {
      deck.push({ id: uid++, suit: suit.s, color: suit.c, rank: rank as Rank, sel: false });
    }
  }
  return deck;
}
