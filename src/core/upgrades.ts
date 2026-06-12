/* Hand level and upgrade math. */
import type { HandBaseStats, HandLevels, HandStats, HandTypeKey, HandUpgrade } from '../types';

export const HAND_TYPES = {
  sflush: { name: '同花顺', chips: 100, mult: 8 },
  four: { name: '四条', chips: 60, mult: 7 },
  full: { name: '葫芦', chips: 40, mult: 4 },
  flush: { name: '同花', chips: 35, mult: 4 },
  straight: { name: '顺子', chips: 30, mult: 4 },
  three: { name: '三条', chips: 30, mult: 3 },
  twopair: { name: '两对', chips: 20, mult: 2 },
  pair: { name: '一对', chips: 10, mult: 2 },
  high: { name: '高牌', chips: 5, mult: 1 },
} satisfies Record<HandTypeKey, HandBaseStats>;

export const HAND_ORDER = [
  'sflush',
  'four',
  'full',
  'flush',
  'straight',
  'three',
  'twopair',
  'pair',
  'high',
] as const satisfies readonly HandTypeKey[];

export const MAX_HAND_LEVEL = 8;

export const HAND_UPGRADES = {
  sflush: { chips: 40, mult: 2 },
  four: { chips: 30, mult: 1 },
  full: { chips: 22, mult: 1 },
  flush: { chips: 18, mult: 1 },
  straight: { chips: 18, mult: 1 },
  three: { chips: 15, mult: 1 },
  twopair: { chips: 12, mult: 1 },
  pair: { chips: 10, mult: 1 },
  high: { chips: 10, mult: 0 },
} satisfies Record<HandTypeKey, HandUpgrade>;

const HAND_UPGRADE_PRICE_BONUS = {
  sflush: 2,
  four: 2,
  full: 1,
  flush: 1,
  straight: 1,
  three: 1,
  twopair: 0,
  pair: 0,
  high: 0,
} satisfies Record<HandTypeKey, number>;

export function initHandLevels(): HandLevels {
  const levels = {} as HandLevels;
  HAND_ORDER.forEach((key) => {
    levels[key] = 1;
  });
  return levels;
}

function clampHandLevel(level: unknown): number {
  return Math.min(MAX_HAND_LEVEL, Math.max(1, Number(level) || 1));
}

export function getHandStats(key: HandTypeKey, levels: HandLevels | null = null): HandStats {
  const type = HAND_TYPES[key];
  const upgrade = HAND_UPGRADES[key];
  const level = clampHandLevel(levels && levels[key]);
  return {
    name: type.name,
    level,
    chips: type.chips + upgrade.chips * (level - 1),
    mult: type.mult + upgrade.mult * (level - 1),
  };
}

export function upgradePrice(key: HandTypeKey, levels: HandLevels | null = null): number {
  const stat = getHandStats(key, levels);
  return 3 + stat.level * 2 + (HAND_UPGRADE_PRICE_BONUS[key] || 0);
}
