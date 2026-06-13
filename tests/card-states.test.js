const path = require('path');
const core = require(path.join(__dirname, '..', '.tmp', 'test-build', 'core', 'index.js'));
const {
  CARD_STATES,
  stateScoreProc,
  previewStateChips,
  sprinkleStates,
  sprinkleCountFor,
  makeDeck,
} = core;

let fail = 0;
function ok(name, cond, extra) {
  if (!cond) {
    console.error('FAIL', name, extra === undefined ? '' : extra);
    fail++;
  } else console.log('ok', name);
}
const rig = { rnd: (a) => a, ri: (a) => a, choice: (arr) => arr[0] };
const rigLast = { rnd: (_a, b) => b, ri: (_a, b) => b, choice: (arr) => arr[arr.length - 1] };

const KEYS = Object.keys(CARD_STATES);
ok('状态池含 4 种状态', KEYS.length === 4, KEYS);
ok(
  '状态元数据齐全',
  KEYS.every((k) => {
    const m = CARD_STATES[k];
    return m.key === k && m.name && m.badge && m.desc && m.color;
  })
);

const gild = stateScoreProc('gilded');
ok('镀金：+2金 无筹码', gild.gold === 2 && gild.chips === 0 && !gild.echo && !gild.deckCrack);
const crack = stateScoreProc('cracked');
ok('裂纹：+40筹码 且震碎牌堆', crack.chips === 40 && crack.deckCrack === true && crack.gold === 0);
const echo = stateScoreProc('echo');
ok('回声：重复自身筹码', echo.echo === true && echo.chips === 0 && echo.mult === 0);
const taint = stateScoreProc('tainted');
ok('污染：+4倍率 25%扩散', taint.mult === 4 && taint.spreadChance === 0.25 && !taint.deckCrack);

const mk = (state) => ({ id: 1, rank: 9, suit: '♠', color: 'black', state });
ok('预览：裂纹 +40', previewStateChips(mk('cracked'), 9) === 40);
ok('预览：回声 = 自身筹码', previewStateChips(mk('echo'), 9) === 9);
ok('预览：镀金 0 筹码', previewStateChips(mk('gilded'), 9) === 0);
ok(
  '预览：污染 0 筹码',
  previewStateChips(mk(null), 9) === 0 && previewStateChips(mk('tainted'), 9) === 0
);

{
  const deck = makeDeck();
  const before = deck.length;
  const hit = sprinkleStates(deck, 3, rig);
  ok('撒布：返回 3 张被变异牌', hit.length === 3);
  ok('撒布：牌堆数量不变', deck.length === before);
  ok(
    '撒布：变异牌确有状态',
    hit.every((c) => KEYS.includes(c.state))
  );
  ok('撒布：总状态数 = 3', deck.filter((c) => c.state).length === 3);
}
{
  const deck = makeDeck();
  const pending = ['echo', 'tainted'];
  const hit = sprinkleStates(deck, 1, rigLast, pending);
  ok(
    '撒布：优先消耗预约池',
    hit.length === 3 && hit[0].state === 'echo' && hit[1].state === 'tainted'
  );
  ok('撒布：预约池被清空', pending.length === 0);
}
{
  const tiny = makeDeck().slice(0, 2);
  const hit = sprinkleStates(tiny, 5, rig);
  ok('撒布：无可用牌时安全停止', hit.length === 2 && tiny.every((c) => c.state));
}
ok(
  '撒布数量：第 1 关 0-1 张',
  sprinkleCountFor(1, rig) === 0 && sprinkleCountFor(1, rigLast) === 1
);
ok(
  '撒布数量：第 3 关 1-3 张',
  sprinkleCountFor(3, rig) === 1 && sprinkleCountFor(3, rigLast) === 3
);

console.log(fail ? `\n${fail} 项失败` : '\n特殊牌状态测试通过');
process.exit(fail ? 1 : 0);
