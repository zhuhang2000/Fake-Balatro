/* Core public API barrel. */
export * from './utils';
export * from './cards';
export * from './upgrades';
export * from './hands';

export const targetFor = (level: number): number =>
  Math.round((250 * Math.pow(1.5, level - 1)) / 10) * 10;
