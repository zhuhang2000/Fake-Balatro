const path = require('path');
const { createJokers } = require(
  path.join(__dirname, '..', '.tmp', 'test-build', 'data', 'jokers.js')
);

let fail = 0;
function ok(name, cond, extra) {
  if (!cond) {
    console.error('FAIL', name, extra === undefined ? '' : extra);
    fail++;
  } else console.log('ok', name);
}

const mock = { gold: 5, handsLeft: 2, discardsLeft: 1 };
const mockRng = {
  rnd: (a, b) => a + Math.random() * (b - a),
  ri: (a, b) => a + Math.floor(Math.random() * (b - a + 1)),
  choice: (items) => items[Math.floor(Math.random() * items.length)],
  shuffle: (items) => items.slice().sort(() => Math.random() - 0.5),
};
const mockCtx = { state: mock, rng: mockRng };

const J = createJokers(() => mock);
const byId = (id) => J.find((j) => j.id === id);
const C = (rank, suit = '♠', state = null) => ({
  id: Math.random(),
  rank,
  suit,
  color: suit === '♥' || suit === '♦' ? 'red' : 'black',
  state,
});
const EV = (scoring) => ({ key: 'high', name: '', level: 1, baseChips: 5, baseMult: 1, scoring });

ok('小丑总数 ≥ 22', J.length >= 22, J.length);
ok('小丑 id 唯一', new Set(J.map((j) => j.id)).size === J.length);
ok(
  '小丑结构齐全',
  J.every((j) => j.id && j.name && j.desc && j.price > 0 && j.art && (j.perCard || j.onHand))
);
ok(
  '描述保持精炼（≤30字）',
  J.every((j) => j.desc.length <= 30),
  J.map((j) => j.desc.length)
);

{
  const j = byId('monochrome');
  const reds = [C(2, '♥'), C(5, '♦'), C(9, '♥')];
  ok('单色剧场：全同色 ×2.5', j.onHand(EV(reds), reds, mockCtx).xmult === 2.5);
  ok('单色剧场：混色不触发', j.onHand(EV([C(2, '♥'), C(5)]), [C(2, '♥'), C(5)], mockCtx) === null);
  ok('单色剧场：单张不触发', j.onHand(EV([C(2)]), [C(2)], mockCtx) === null);
}
{
  const j = byId('fourcolor');
  const four = [C(2, '♠'), C(5, '♥'), C(9, '♦'), C(11, '♣')];
  ok('四象观察者：四花色 +90筹码', j.onHand(EV(four), undefined, mockCtx).chips === 90);
  ok('四象观察者：三花色不触发', j.onHand(EV(four.slice(0, 3)), undefined, mockCtx) === null);
}
{
  const j = byId('evencult');
  ok('偶数教团：4 触发', j.perCard(C(4), undefined, mockCtx).chips === 15);
  ok('偶数教团：Q(12) 触发', j.perCard(C(12), undefined, mockCtx).chips === 15);
  ok('偶数教团：A(14) 不触发', j.perCard(C(14), undefined, mockCtx) === null);
  ok('偶数教团：3 不触发', j.perCard(C(3), undefined, mockCtx) === null);
}
{
  const j = byId('court');
  ok(
    '宫廷暗影：J/Q/K +3倍',
    [11, 12, 13].every((r) => j.perCard(C(r), undefined, mockCtx).mult === 3)
  );
  ok('宫廷暗影：10/A 不触发', j.perCard(C(10), undefined, mockCtx) === null && j.perCard(C(14), undefined, mockCtx) === null);
}
{
  const j = byId('goldmaw');
  mock.gold = 18;
  ok('噬金巨口：≥18金 ×3', j.onHand(undefined, undefined, mockCtx).xmult === 3);
  mock.gold = 17;
  const e = j.onHand(undefined, undefined, mockCtx);
  ok('噬金巨口：<18金 仅+1倍', e.mult === 1 && !e.xmult);
  mock.gold = 5;
}
{
  const j = byId('overclock');
  mock.handsLeft = 3;
  ok('超频核芯：剩3手 +12倍', j.onHand(undefined, undefined, mockCtx).mult === 12);
  mock.handsLeft = 0;
  ok('超频核芯：无剩余不触发', j.onHand(undefined, undefined, mockCtx) === null);
  mock.handsLeft = 2;
}
{
  const j = byId('scavenger');
  mock.discardsLeft = 0;
  ok('拾荒之神：弃牌用尽 +100筹码', j.onHand(undefined, undefined, mockCtx).chips === 100);
  mock.discardsLeft = 1;
  ok('拾荒之神：尚有弃牌不触发', j.onHand(undefined, undefined, mockCtx) === null);
}
{
  const j = byId('glasscrown');
  let always3 = true;
  let sawShatter = false;
  let sawSafe = false;
  for (let i = 0; i < 200; i++) {
    const e = j.onHand(undefined, undefined, mockCtx);
    if (!e || e.xmult !== 3) always3 = false;
    if (e.shatter) sawShatter = true;
    else sawSafe = true;
  }
  ok('玻璃王冠：恒定 ×3', always3);
  ok('玻璃王冠：碎裂与幸存皆会出现', sawShatter && sawSafe);
}
{
  const j = byId('goldtongue');
  const e = j.perCard(C(9, '♠', 'echo'), undefined, mockCtx);
  ok('点金舌头：状态牌 +20筹码+1金', e.chips === 20 && e.gold === 1);
  ok('点金舌头：普通牌不触发', j.perCard(C(9), undefined, mockCtx) === null);
}
{
  const j = byId('patientzero');
  let clean = true;
  for (let i = 0; i < 200; i++) {
    const e = j.onHand(undefined, undefined, mockCtx);
    if (e !== null && e.infect !== true) clean = false;
  }
  ok('零号病人：只产出 null 或 infect', clean);
}

console.log(fail ? `\n${fail} 项失败` : '\n小丑逻辑测试通过');
process.exit(fail ? 1 : 0);
