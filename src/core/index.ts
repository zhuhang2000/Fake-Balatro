/* Core public API barrel. */
export * from './utils';
export * from './cards';
export * from './upgrades';
export * from './hands';
export * from './card-states';

export const targetFor = (level: number): number =>
  Math.round((250 * Math.pow(1.5, level - 1)) / 10) * 10;

/* Running threshold: total cumulative score required to have cleared `level`.
   Each level adds its own requirement on top of every prior level's, so score
   banked by over-playing an earlier level carries forward toward later ones. */
export const cumulativeTargetFor = (level: number): number => {
  let sum = 0;
  for (let i = 1; i <= level; i++) sum += targetFor(i);
  return Math.round(sum / 10) * 10;
};
