/* Joker.SYS joker catalog and pixel-art renderer. */
import type { GameState, Joker, JokerArt, JokerEye } from '../types';

export function createJokers(getState: () => GameState): Joker[] {
  const state = () => getState();
  return [
    {
      id: 'smile',
      name: '微笑先生',
      price: 4,
      desc: '结算时 倍率+4。他只是一直在笑。',
      art: { bg: '#3a1452', pat: 'stripe', skin: '#f2e3c0', eye: 'dot', mouth: 'grin' },
      onHand: () => ({ mult: 4 }),
    },
    {
      id: 'midnight',
      name: '午夜马戏团',
      price: 5,
      desc: '每张计分的黑色牌（♠/♣）筹码+20。',
      art: { bg: '#0c0c16', pat: 'check', skin: '#bcd0e8', eye: 'x', mouth: 'zigzag' },
      perCard: (c) => (c.color === 'black' ? { chips: 20 } : null),
    },
    {
      id: 'hearteater',
      name: '红心吞噬者',
      price: 5,
      desc: '每张计分的红桃 倍率+4。它饿了。',
      art: {
        bg: '#4a0e1c',
        pat: 'none',
        skin: '#f4b8c4',
        eye: 'slit',
        mouth: 'teeth',
        mark: 'heart',
      },
      perCard: (c) => (c.suit === '♥' ? { mult: 4 } : null),
    },
    {
      id: 'greedeye',
      name: '贪婪之眼',
      price: 6,
      desc: '每张计分的方块 金币+1。',
      art: { bg: '#10331c', pat: 'check', skin: '#cfe8b8', eye: 'cyclops', mouth: 'wave' },
      perCard: (c) => (c.suit === '♦' ? { gold: 1 } : null),
    },
    {
      id: 'dice',
      name: '双面骰子',
      price: 6,
      desc: '结算时 50% 概率 倍率×2，否则只有 倍率+1。',
      art: {
        bg: '#101038',
        pat: 'none',
        skin: '#e8e8f4',
        split: '#b03060',
        eye: 'mixed',
        mouth: 'wave',
      },
      onHand: () => (Math.random() < 0.5 ? { xmult: 2, glitch: true } : { mult: 1 }),
    },
    {
      id: 'counter',
      name: '点钞机',
      price: 5,
      desc: '结算时 每持有4金币 倍率+1。',
      art: { bg: '#0e2e22', pat: 'stripe', skin: '#e8ddb8', eye: 'coin', mouth: 'stitch' },
      onHand: () => {
        const k = Math.floor(state().gold / 4);
        return k > 0 ? { mult: k } : null;
      },
    },
    {
      id: 'hunger',
      name: '饥饿艺术家',
      price: 6,
      desc: '每剩余1次弃牌 倍率+3。忍住别弃。',
      art: {
        bg: '#26262e',
        pat: 'stripe',
        skin: '#dcd4cc',
        eye: 'o',
        mouth: 'frown',
        mark: 'tear',
      },
      onHand: () => (state().discardsLeft > 0 ? { mult: state().discardsLeft * 3 } : null),
    },
    {
      id: 'runner',
      name: '顺子狂人',
      price: 7,
      desc: '打出顺子或同花顺 倍率×3。',
      art: { bg: '#0c2440', pat: 'stripe', skin: '#c8e0f0', eye: 'slit', mouth: 'zigzag' },
      onHand: (ev) => (ev.key === 'straight' || ev.key === 'sflush' ? { xmult: 3 } : null),
    },
    {
      id: 'lastjoke',
      name: '最后的笑话',
      price: 6,
      desc: '本关最后一次出牌 倍率×4。压轴登场。',
      art: { bg: '#020208', pat: 'none', skin: '#f0f0f0', eye: 'x', mouth: 'grin', mark: 'tear' },
      onHand: () => (state().handsLeft === 0 ? { xmult: 4 } : null),
    },
    {
      id: 'ghost',
      name: '像素幽灵',
      price: 5,
      desc: '出牌少于5张时 每少1张 筹码+25。',
      art: { bg: '#0c2a2e', pat: 'check', skin: '#e4f4f8', eye: 'dot', mouth: 'gasp' },
      onHand: (_ev, played) => (played.length < 5 ? { chips: (5 - played.length) * 25 } : null),
    },
    {
      id: 'goldtooth',
      name: '金牙',
      price: 7,
      desc: '每次出牌结算后 金币+1。',
      art: { bg: '#3a1c0c', pat: 'none', skin: '#e8c8a0', eye: 'dot', mouth: 'goldtooth' },
      onHand: () => ({ gold: 1 }),
    },
    {
      id: 'pairking',
      name: '对子之王',
      price: 6,
      desc: '牌型含对子（一对/两对/葫芦）倍率+8。',
      art: {
        bg: '#2e1448',
        pat: 'check',
        skin: '#ecdcc0',
        eye: 'o',
        mouth: 'grin',
        mark: 'crown',
      },
      onHand: (ev) =>
        ev.key === 'pair' || ev.key === 'twopair' || ev.key === 'full' ? { mult: 8 } : null,
    },
    {
      id: 'monochrome',
      name: '单色剧场',
      price: 7,
      desc: '打出的牌全部同色时 倍率×2.5。拒绝混搭。',
      art: {
        bg: '#16161c',
        pat: 'check',
        skin: '#e8e8e8',
        split: '#2c2c34',
        eye: 'slit',
        mouth: 'stitch',
      },
      onHand: (_ev, played) => {
        const first = played[0];
        if (!first || played.length < 2) return null;
        return played.every((c) => c.color === first.color) ? { xmult: 2.5, glitch: true } : null;
      },
    },
    {
      id: 'fourcolor',
      name: '四象观察者',
      price: 6,
      desc: '计分牌含全部 4 种花色时 筹码+90。',
      art: { bg: '#1c1430', pat: 'stripe', skin: '#d8e4f0', eye: 'mixed', mouth: 'gasp' },
      onHand: (ev) => (new Set(ev.scoring.map((c) => c.suit)).size === 4 ? { chips: 90 } : null),
    },
    {
      id: 'evencult',
      name: '偶数教团',
      price: 5,
      desc: '每张计分的偶数点牌（2/4/6/8/10/Q）筹码+15。',
      art: { bg: '#0e2230', pat: 'check', skin: '#c0d8d0', eye: 'o', mouth: 'wave' },
      perCard: (c) => (c.rank % 2 === 0 && c.rank <= 12 ? { chips: 15 } : null),
    },
    {
      id: 'court',
      name: '宫廷暗影',
      price: 6,
      desc: '每张计分的 J/Q/K 倍率+3。王座之下。',
      art: {
        bg: '#241024',
        pat: 'stripe',
        skin: '#d8c0e0',
        eye: 'slit',
        mouth: 'frown',
        mark: 'crown',
      },
      perCard: (c) => (c.rank >= 11 && c.rank <= 13 ? { mult: 3 } : null),
    },
    {
      id: 'goldmaw',
      name: '噬金巨口',
      price: 8,
      desc: '结算时持有 ≥18 金币 倍率×3，否则 倍率+1。',
      art: { bg: '#2e2408', pat: 'none', skin: '#f0dc9c', eye: 'coin', mouth: 'teeth' },
      onHand: () => (state().gold >= 18 ? { xmult: 3, glitch: true } : { mult: 1 }),
    },
    {
      id: 'overclock',
      name: '超频核芯',
      price: 6,
      desc: '每剩余 1 次出牌 倍率+4。先发制人。',
      art: { bg: '#102a14', pat: 'check', skin: '#c8ecc0', eye: 'cyclops', mouth: 'zigzag' },
      onHand: () => (state().handsLeft > 0 ? { mult: state().handsLeft * 4 } : null),
    },
    {
      id: 'scavenger',
      name: '拾荒之神',
      price: 5,
      desc: '弃牌次数用尽时 筹码+100。垃圾即黄金。',
      art: {
        bg: '#2a2014',
        pat: 'stripe',
        skin: '#d4c4a8',
        eye: 'x',
        mouth: 'stitch',
        mark: 'tear',
      },
      onHand: () => (state().discardsLeft === 0 ? { chips: 100 } : null),
    },
    {
      id: 'glasscrown',
      name: '玻璃王冠',
      price: 5,
      desc: '倍率×3，但每次结算后 25% 概率碎裂消失。',
      art: {
        bg: '#101c2e',
        pat: 'none',
        skin: '#e4f0f8',
        split: '#a8c4dc',
        eye: 'x',
        mouth: 'gasp',
        mark: 'crown',
      },
      onHand: () =>
        Math.random() < 0.25 ? { xmult: 3, shatter: true } : { xmult: 3, glitch: true },
    },
    {
      id: 'goldtongue',
      name: '点金舌头',
      price: 6,
      desc: '每张计分的特殊状态牌 筹码+20 金币+1。',
      art: {
        bg: '#33240c',
        pat: 'check',
        skin: '#ecd8b0',
        eye: 'dot',
        mouth: 'goldtooth',
        mark: 'heart',
      },
      perCard: (c) => (c.state ? { chips: 20, gold: 1 } : null),
    },
    {
      id: 'patientzero',
      name: '零号病人',
      price: 4,
      desc: '结算后 35% 概率污染一张手牌（污染牌：倍率+4）。',
      art: {
        bg: '#1a2e10',
        pat: 'stripe',
        skin: '#cce0a8',
        eye: 'mixed',
        mouth: 'zigzag',
        mark: 'tear',
      },
      onHand: () => (Math.random() < 0.35 ? { infect: true } : null),
    },
  ];
}

export function drawJokerIcon(cv: HTMLCanvasElement, art: JokerArt): void {
  const G = 16;
  const px = cv.width / G;
  const g = cv.getContext('2d');
  if (!g) return;
  const P = (x: number, y: number, c: string): void => {
    if (x < 0 || y < 0 || x >= G || y >= G) return;
    g.fillStyle = c;
    g.fillRect(Math.floor(x * px), Math.floor(y * px), Math.ceil(px), Math.ceil(px));
  };
  g.fillStyle = art.bg;
  g.fillRect(0, 0, cv.width, cv.height);
  const lite = 'rgba(255,255,255,.07)';
  if (art.pat === 'stripe')
    for (let y = 0; y < G; y++)
      for (let x = 0; x < G; x++) {
        if ((x + y) % 4 === 0) P(x, y, lite);
      }
  if (art.pat === 'check')
    for (let y = 0; y < G; y++)
      for (let x = 0; x < G; x++) {
        if ((((x >> 1) + (y >> 1)) & 1) === 0) P(x, y, lite);
      }

  const cx = 7.5;
  const cy = 8.2;
  const R = 5.8;
  for (let y = 0; y < G; y++)
    for (let x = 0; x < G; x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= R * R) P(x, y, art.split && x < 8 ? art.split : art.skin);
    }
  const dark = '#180f16';
  const red = '#e03044';
  const gold = '#ffd23f';
  const white = '#fdfdf6';
  const blue = '#5ec8f0';
  const eye = (ex: number, t: JokerEye): void => {
    const y = 6;
    if (t === 'dot') {
      P(ex, y, dark);
      P(ex, y + 1, dark);
    } else if (t === 'x') {
      P(ex - 1, y - 1, dark);
      P(ex + 1, y - 1, dark);
      P(ex, y, dark);
      P(ex - 1, y + 1, dark);
      P(ex + 1, y + 1, dark);
    } else if (t === 'o') {
      P(ex - 1, y - 1, dark);
      P(ex, y - 1, dark);
      P(ex + 1, y - 1, dark);
      P(ex - 1, y, dark);
      P(ex + 1, y, dark);
      P(ex - 1, y + 1, dark);
      P(ex, y + 1, dark);
      P(ex + 1, y + 1, dark);
    } else if (t === 'slit') {
      P(ex - 1, y, dark);
      P(ex, y, dark);
      P(ex + 1, y, dark);
    } else if (t === 'coin') {
      P(ex - 1, y, gold);
      P(ex, y, gold);
      P(ex - 1, y + 1, gold);
      P(ex, y + 1, gold);
    }
  };
  if (art.eye === 'cyclops') {
    for (let x = 6; x <= 9; x++) {
      P(x, 4, dark);
      P(x, 8, dark);
    }
    for (let y = 5; y <= 7; y++) {
      P(5, y, dark);
      P(10, y, dark);
    }
    for (let y = 5; y <= 7; y++) for (let x = 6; x <= 9; x++) P(x, y, white);
    P(7, 6, red);
    P(8, 6, red);
  } else if (art.eye === 'mixed') {
    eye(5, 'x');
    eye(10, 'o');
  } else {
    eye(5, art.eye);
    eye(10, art.eye);
  }

  const my = 11;
  const m = art.mouth;
  if (m === 'grin') {
    P(3, my - 1, dark);
    P(12, my - 1, dark);
    for (let x = 4; x <= 11; x++) P(x, my, dark);
    for (let x = 5; x <= 10; x++) if (x % 2 === 1) P(x, my - 1, white);
  } else if (m === 'zigzag') {
    for (let x = 4; x <= 11; x++) P(x, my - (x & 1), dark);
  } else if (m === 'frown') {
    for (let x = 5; x <= 10; x++) P(x, my, dark);
    P(4, my + 1, dark);
    P(11, my + 1, dark);
  } else if (m === 'wave') {
    for (let x = 4; x <= 11; x++) P(x, my - ((x >> 1) & 1), dark);
  } else if (m === 'teeth') {
    for (let x = 4; x <= 11; x++) P(x, my - 1, dark);
    for (let x = 4; x <= 11; x++) P(x, my, x & 1 ? white : dark);
  } else if (m === 'gasp') {
    P(7, my - 1, dark);
    P(8, my - 1, dark);
    P(7, my, dark);
    P(8, my, dark);
  } else if (m === 'stitch') {
    for (let x = 4; x <= 11; x++) P(x, my, dark);
    [5, 8, 11].forEach((x) => {
      P(x, my - 1, dark);
      P(x, my + 1, dark);
    });
  } else if (m === 'goldtooth') {
    for (let x = 4; x <= 11; x++) P(x, my - 1, dark);
    for (let x = 4; x <= 11; x++) P(x, my, x & 1 ? white : dark);
    P(8, my, gold);
  }
  if (art.mark === 'tear') {
    P(4, 8, blue);
    P(4, 9, blue);
  }
  if (art.mark === 'heart') {
    P(6, 3, red);
    P(8, 3, red);
    P(6, 4, red);
    P(7, 4, red);
    P(8, 4, red);
    P(7, 5, red);
  }
  if (art.mark === 'crown') {
    [5, 7, 9].forEach((x) => P(x, 1, gold));
    for (let x = 5; x <= 9; x++) P(x, 2, gold);
  }
}
