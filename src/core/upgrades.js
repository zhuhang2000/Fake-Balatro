/* Hand level and upgrade math. */
((root) => {
  const HAND_TYPES = {
    sflush: { name: '同花顺', chips: 100, mult: 8 },
    four: { name: '四条', chips: 60, mult: 7 },
    full: { name: '葫芦', chips: 40, mult: 4 },
    flush: { name: '同花', chips: 35, mult: 4 },
    straight: { name: '顺子', chips: 30, mult: 4 },
    three: { name: '三条', chips: 30, mult: 3 },
    twopair: { name: '两对', chips: 20, mult: 2 },
    pair: { name: '一对', chips: 10, mult: 2 },
    high: { name: '高牌', chips: 5, mult: 1 },
  };
  const HAND_ORDER = [
    'sflush',
    'four',
    'full',
    'flush',
    'straight',
    'three',
    'twopair',
    'pair',
    'high',
  ];
  const MAX_HAND_LEVEL = 8;
  const HAND_UPGRADES = {
    sflush: { chips: 40, mult: 2 },
    four: { chips: 30, mult: 1 },
    full: { chips: 22, mult: 1 },
    flush: { chips: 18, mult: 1 },
    straight: { chips: 18, mult: 1 },
    three: { chips: 15, mult: 1 },
    twopair: { chips: 12, mult: 1 },
    pair: { chips: 10, mult: 1 },
    high: { chips: 10, mult: 0 },
  };
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
  };

  function initHandLevels() {
    const levels = {};
    HAND_ORDER.forEach((k) => {
      levels[k] = 1;
    });
    return levels;
  }
  function clampHandLevel(level) {
    return Math.min(MAX_HAND_LEVEL, Math.max(1, Number(level) || 1));
  }
  function getHandStats(key, levels = null) {
    const t = HAND_TYPES[key];
    const up = HAND_UPGRADES[key];
    const level = clampHandLevel(levels && levels[key]);
    return {
      name: t.name,
      level,
      chips: t.chips + up.chips * (level - 1),
      mult: t.mult + up.mult * (level - 1),
    };
  }
  function upgradePrice(key, levels = null) {
    const stat = getHandStats(key, levels);
    return 3 + stat.level * 2 + (HAND_UPGRADE_PRICE_BONUS[key] || 0);
  }

  const api = {
    HAND_TYPES,
    HAND_ORDER,
    MAX_HAND_LEVEL,
    HAND_UPGRADES,
    HAND_UPGRADE_PRICE_BONUS,
    initHandLevels,
    getHandStats,
    upgradePrice,
  };
  root.JokerUpgrades = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
