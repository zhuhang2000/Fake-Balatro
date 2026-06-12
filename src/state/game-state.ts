import { initHandLevels } from '../core';
/* Game state factories and shared state constants. */
import type { GameState, Joker, ShopState } from '../types';

export const HANDS_PER = 4;
export const DISCARDS_PER = 3;
export const HAND_SIZE = 8;
export const MAX_PLAY = 5;
export const JOKER_SLOTS_BASE = 5;
export const JOKER_SLOTS_CAP = 7;

export const sellPrice = (joker: Pick<Joker, 'price'>): number =>
  Math.max(1, Math.floor(joker.price / 2));

export function createInitialState(): GameState {
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

export function createShopState(): ShopState {
  return { offers: [], upgradeOffers: [] };
}
