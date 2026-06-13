/* JOKER.SYS chaos event pool: weighted in-run random events. */
import { CARD_STATE_KEYS, cardStateName } from '../core/card-states';
import type {
  Card,
  ChaosEvent,
  EventOutcome,
  EventRng,
  EventTrigger,
  GameState,
  Suit,
} from '../types';

const SUITS: readonly Suit[] = ['♠', '♥', '♦', '♣'];

const roundTarget = (n: number): number => Math.max(10, Math.round(n / 10) * 10);
const statelessHand = (state: GameState): Card[] => state.hand.filter((card) => !card.state);
const cardLabel = (card: Card): string =>
  `${card.suit}${card.rank === 14 ? 'A' : card.rank === 13 ? 'K' : card.rank === 12 ? 'Q' : card.rank === 11 ? 'J' : card.rank}`;

function mutateHandCards(state: GameState, rng: EventRng, count: number): string[] {
  const lines: string[] = [];
  for (let i = 0; i < count; i++) {
    const open = statelessHand(state);
    if (!open.length) break;
    const card = rng.choice(open);
    const key = rng.choice(CARD_STATE_KEYS);
    card.state = key;
    lines.push(`${cardLabel(card)} 被注入【${cardStateName(key)}】`);
  }
  return lines;
}

export const EVENTS: ChaosEvent[] = [
  {
    id: 'quota_surge',
    name: '配额上调',
    kind: 'bad',
    weight: 3,
    trigger: 'levelStart',
    canFire: () => true,
    apply(state): EventOutcome {
      state.target = roundTarget(state.target * 1.12);
      return { lines: ['总部传真：目标 +12%', '别问总部是谁'] };
    },
  },
  {
    id: 'quota_glitch',
    name: '评分短路',
    kind: 'good',
    weight: 2,
    trigger: 'levelStart',
    canFire: () => true,
    apply(state): EventOutcome {
      state.target = roundTarget(state.target * 0.9);
      return { lines: ['评分核心冒烟：目标 -10%', '请勿上报'] };
    },
  },
  {
    id: 'suit_fever',
    name: '花色过热',
    kind: 'good',
    weight: 3,
    trigger: 'levelStart',
    canFire: () => true,
    apply(state, rng): EventOutcome {
      const suit = rng.choice(SUITS);
      state.mods.suitBoost = { suit, chips: 18 };
      return { lines: [`本关 ${suit} 计分时 筹码+18`, '过热属正常现象'] };
    },
  },
  {
    id: 'gold_static',
    name: '静电落金',
    kind: 'good',
    weight: 2,
    trigger: 'levelStart',
    canFire: () => true,
    apply(state, rng): EventOutcome {
      const n = rng.ri(3, 5);
      state.gold += n;
      return { lines: [`投币口倒流：金币+${n}`] };
    },
  },
  {
    id: 'gold_leak',
    name: '金币泄漏',
    kind: 'bad',
    weight: 2,
    trigger: 'levelStart',
    canFire: (state) => state.gold > 0,
    apply(state, rng): EventOutcome {
      const n = Math.min(state.gold, rng.ri(2, 4));
      state.gold -= n;
      return { lines: [`机箱底部发现裂缝：金币-${n}`] };
    },
  },
  {
    id: 'spare_fuse',
    name: '备用保险丝',
    kind: 'good',
    weight: 2,
    trigger: 'levelStart',
    canFire: () => true,
    apply(state): EventOutcome {
      state.discardsLeft += 1;
      return { lines: ['检修舱弹出：弃牌+1'] };
    },
  },
  {
    id: 'fuse_burn',
    name: '保险丝烧毁',
    kind: 'bad',
    weight: 2,
    trigger: 'levelStart',
    canFire: (state) => state.discardsLeft >= 2,
    apply(state): EventOutcome {
      state.discardsLeft -= 1;
      return { lines: ['一股焦味：弃牌-1'] };
    },
  },
  {
    id: 'hand_blessing',
    name: '发牌员的恶趣味',
    kind: 'mixed',
    weight: 2,
    trigger: 'levelStart',
    canFire: (state) => statelessHand(state).length > 0,
    apply(state, rng): EventOutcome {
      const lines = mutateHandCards(state, rng, rng.ri(1, 2));
      return { lines: lines.length ? lines : ['发牌员眨了眨眼'] };
    },
  },
  {
    id: 'mult_overdrive',
    name: '倍率过载',
    kind: 'good',
    weight: 2,
    trigger: 'levelStart',
    canFire: () => true,
    apply(state): EventOutcome {
      state.mods.nextHandMult += 5;
      return { lines: ['下一手 倍率+5', '电压不稳 抓紧机会'] };
    },
  },
  {
    id: 'mult_brownout',
    name: '倍率欠压',
    kind: 'bad',
    weight: 2,
    trigger: 'levelStart',
    canFire: () => true,
    apply(state): EventOutcome {
      state.mods.nextHandXMult = 0.5;
      return { lines: ['下一手 倍率减半', '建议先弃牌避险'] };
    },
  },
  {
    id: 'echo_signal',
    name: '回声信号',
    kind: 'good',
    weight: 3,
    trigger: 'afterScore',
    canFire: (state) => statelessHand(state).length > 0,
    apply(state, rng): EventOutcome {
      const card = rng.choice(statelessHand(state));
      card.state = 'echo';
      return { lines: [`${cardLabel(card)} 开始自我复读【回声】`] };
    },
  },
  {
    id: 'static_jackpot',
    name: '静电小奖',
    kind: 'good',
    weight: 2,
    trigger: 'afterScore',
    canFire: () => true,
    apply(state): EventOutcome {
      state.gold += 2;
      return { lines: ['零钱槽抖了一下：金币+2'] };
    },
  },
  {
    id: 'tainted_feed',
    name: '污染补偿',
    kind: 'mixed',
    weight: 2,
    trigger: 'afterScore',
    canFire: (state) => statelessHand(state).length > 0,
    apply(state, rng): EventOutcome {
      const card = rng.choice(statelessHand(state));
      card.state = 'tainted';
      state.gold += 2;
      return { lines: [`${cardLabel(card)} 被【污染】`, '系统赔付：金币+2'] };
    },
  },
  {
    id: 'overdrive_pulse',
    name: '过载脉冲',
    kind: 'risk',
    weight: 2,
    trigger: 'afterScore',
    canFire: (state) => state.handsLeft > 0,
    apply(state, rng): EventOutcome {
      if (rng.rnd(0, 1) < 0.6) {
        state.mods.nextHandMult += 6;
        return { lines: ['脉冲命中：下一手 倍率+6'] };
      }
      state.mods.nextHandXMult = 0.5;
      return { lines: ['脉冲失控：下一手 倍率减半'] };
    },
  },
];

/* Weighted pick among events valid for this trigger; null when none qualify. */
export function rollEvent(
  events: readonly ChaosEvent[],
  state: GameState,
  trigger: EventTrigger,
  rng: EventRng
): ChaosEvent | null {
  const pool = events.filter((ev) => ev.trigger === trigger && ev.canFire(state));
  if (!pool.length) return null;
  const total = pool.reduce((sum, ev) => sum + ev.weight, 0);
  let pick = rng.rnd(0, total);
  for (const ev of pool) {
    pick -= ev.weight;
    if (pick <= 0) return ev;
  }
  return pool[pool.length - 1] ?? null;
}
