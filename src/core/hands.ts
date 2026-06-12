/* Poker hand evaluation. */
import type { Card, HandEval, HandLevels, HandTypeKey, Rank } from '../types';
import { chipVal } from './cards';
import { HAND_ORDER, HAND_TYPES, getHandStats } from './upgrades';

export { chipVal, HAND_ORDER, HAND_TYPES };

export function evaluateHand(cards: Card[], levels: HandLevels | null = null): HandEval {
  if (!cards.length) {
    const stats = getHandStats('high', levels);
    return {
      key: 'high',
      name: stats.name,
      level: stats.level,
      baseChips: stats.chips,
      baseMult: stats.mult,
      scoring: [],
    };
  }

  const byRank = new Map<Rank, Card[]>();
  cards.forEach((card) => {
    const group = byRank.get(card.rank) || [];
    group.push(card);
    byRank.set(card.rank, group);
  });
  const groups = Array.from(byRank.values()).sort(
    (a, b) => b.length - a.length || (b[0]?.rank || 0) - (a[0]?.rank || 0)
  );

  const firstCard = cards[0];
  const isFlush =
    cards.length === 5 && !!firstCard && cards.every((card) => card.suit === firstCard.suit);
  let isStraight = false;
  if (cards.length === 5 && groups.length === 5) {
    const ranks = cards.map((card) => card.rank).sort((a, b) => a - b);
    const low = ranks[0] as Rank;
    const high = ranks[4] as Rank;
    if (high - low === 4) isStraight = true;
    else if (ranks.join() === '2,3,4,5,14') isStraight = true;
  }

  const firstGroup = groups[0] || [];
  const secondGroup = groups[1] || [];
  let key: HandTypeKey;
  let scoring: Card[];
  if (isStraight && isFlush) {
    key = 'sflush';
    scoring = cards.slice();
  } else if (firstGroup.length === 4) {
    key = 'four';
    scoring = firstGroup.slice();
  } else if (firstGroup.length === 3 && secondGroup.length >= 2) {
    key = 'full';
    scoring = cards.slice();
  } else if (isFlush) {
    key = 'flush';
    scoring = cards.slice();
  } else if (isStraight) {
    key = 'straight';
    scoring = cards.slice();
  } else if (firstGroup.length === 3) {
    key = 'three';
    scoring = firstGroup.slice();
  } else if (firstGroup.length === 2 && secondGroup.length === 2) {
    key = 'twopair';
    scoring = [...firstGroup, ...secondGroup];
  } else if (firstGroup.length === 2) {
    key = 'pair';
    scoring = firstGroup.slice();
  } else {
    key = 'high';
    scoring = [cards.slice().sort((a, b) => b.rank - a.rank)[0] as Card];
  }

  const scoringIds = new Set(scoring.map((card) => card.id));
  const orderedScoring = cards.filter((card) => scoringIds.has(card.id));
  const stats = getHandStats(key, levels);
  return {
    key,
    name: stats.name,
    level: stats.level,
    baseChips: stats.chips,
    baseMult: stats.mult,
    scoring: orderedScoring,
  };
}
