/* Special card states: pure rules, no UI. */
import type { Card, CardStateKey, CardStateMeta, CardStateProc, EventRng } from '../types';

export const CARD_STATES: Record<CardStateKey, CardStateMeta> = {
  gilded: {
    key: 'gilded',
    name: '镀金',
    badge: '金',
    desc: '计分时 金币+2',
    color: '#ffd23f',
  },
  cracked: {
    key: 'cracked',
    name: '裂纹',
    badge: '裂',
    desc: '计分时 筹码+40，但震碎牌堆中随机一张牌',
    color: '#bcd0e8',
  },
  echo: {
    key: 'echo',
    name: '回声',
    badge: '回',
    desc: '计分时 额外重复一次自身筹码',
    color: '#3df5e0',
  },
  tainted: {
    key: 'tainted',
    name: '污染',
    badge: '污',
    desc: '计分时 倍率+4，25% 概率污染另一张手牌',
    color: '#a96bff',
  },
};

const PROCS: Record<CardStateKey, CardStateProc> = {
  gilded: { chips: 0, gold: 2, mult: 0, echo: false, deckCrack: false, spreadChance: 0 },
  cracked: { chips: 40, gold: 0, mult: 0, echo: false, deckCrack: true, spreadChance: 0 },
  echo: { chips: 0, gold: 0, mult: 0, echo: true, deckCrack: false, spreadChance: 0 },
  tainted: { chips: 0, gold: 0, mult: 4, echo: false, deckCrack: false, spreadChance: 0.25 },
};

/* Single source of truth for the set of states and their display names, so
   shop/events never hard-code their own key list or name table. */
export const CARD_STATE_KEYS = Object.keys(CARD_STATES) as CardStateKey[];
export const cardStateName = (key: CardStateKey): string => CARD_STATES[key].name;

export const stateScoreProc = (key: CardStateKey): CardStateProc => PROCS[key];

/* Deterministic chip delta a stated card adds on scoring (for previews). */
export function previewStateChips(card: Card, baseVal: number): number {
  if (!card.state) return 0;
  const proc = PROCS[card.state];
  return proc.chips + (proc.echo ? baseVal : 0);
}

/* How many cards get mutated when a fresh level deck is built. */
export function sprinkleCountFor(level: number, rng: EventRng): number {
  return level <= 1 ? rng.ri(0, 1) : rng.ri(1, 3);
}

/* Assign states to `count` random state-less cards; a pending pool
   (e.g. bought from the shop) is consumed first. Returns mutated cards. */
export function sprinkleStates(
  deck: Card[],
  count: number,
  rng: EventRng,
  pending: CardStateKey[] = []
): Card[] {
  const keys = Object.keys(CARD_STATES) as CardStateKey[];
  const total = count + pending.length;
  const mutated: Card[] = [];
  for (let i = 0; i < total; i++) {
    const open = deck.filter((card) => !card.state);
    if (!open.length) break;
    const card = rng.choice(open);
    card.state = pending.length ? (pending.shift() as CardStateKey) : rng.choice(keys);
    mutated.push(card);
  }
  return mutated;
}
