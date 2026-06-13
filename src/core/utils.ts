/* Shared utility helpers. */
import type { GameRng } from '../types';

export const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
export const rnd = (a: number, b: number): number => a + Math.random() * (b - a);
export const ri = (a: number, b: number): number => Math.floor(rnd(a, b + 1));
export const choice = <T>(items: readonly T[]): T =>
  items[Math.floor(Math.random() * items.length)] as T;
export const fmt = (n: number): string => Number(n).toLocaleString('en-US');

export function shuffle<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const left = items[i] as T;
    const right = items[j] as T;
    items[i] = right;
    items[j] = left;
  }
  return items;
}

/* Build the single game RNG from one [0,1) source. Default is Math.random;
   pass a seeded generator to make an entire run reproducible. Every flow draws
   randomness through the object this returns. */
export function createRng(source: () => number = Math.random): GameRng {
  const r = (a: number, b: number): number => a + source() * (b - a);
  return {
    rnd: r,
    ri: (a: number, b: number): number => Math.floor(r(a, b + 1)),
    choice: <T>(items: readonly T[]): T => items[Math.floor(source() * items.length)] as T,
    shuffle: <T>(items: T[]): T[] => {
      for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(source() * (i + 1));
        const left = items[i] as T;
        const right = items[j] as T;
        items[i] = right;
        items[j] = left;
      }
      return items;
    },
  };
}
