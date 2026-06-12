/* Shared utility helpers. */
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
