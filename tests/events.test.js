const path = require('path');
const { EVENTS, rollEvent } = require(
  path.join(__dirname, '..', '.tmp', 'test-build', 'data', 'events.js')
);
const { createInitialState } = require(
  path.join(__dirname, '..', '.tmp', 'test-build', 'state', 'game-state.js')
);
const { makeDeck } = require(path.join(__dirname, '..', '.tmp', 'test-build', 'core', 'index.js'));

let fail = 0;
function ok(name, cond, extra) {
  if (!cond) {
    console.error('FAIL', name, extra === undefined ? '' : extra);
    fail++;
  } else console.log('ok', name);
}
const rig = { rnd: (a) => a, ri: (a) => a, choice: (arr) => arr[0] };
const KINDS = ['good', 'bad', 'mixed', 'risk'];
const TRIGGERS = ['levelStart', 'afterScore'];
const STATE_KEYS = ['gilded', 'cracked', 'echo', 'tainted'];

function freshState() {
  const s = createInitialState();
  s.target = 300;
  s.gold = 5;
  s.handsLeft = 4;
  s.discardsLeft = 3;
  s.phase = 'play';
  s.deck = makeDeck();
  s.hand = s.deck.splice(0, 8);
  return s;
}

ok('事件池非空', EVENTS.length >= 12, EVENTS.length);
ok('事件 id 唯一', new Set(EVENTS.map((e) => e.id)).size === EVENTS.length);
ok(
  '事件结构合法',
  EVENTS.every(
    (e) =>
      typeof e.id === 'string' &&
      e.name &&
      KINDS.includes(e.kind) &&
      TRIGGERS.includes(e.trigger) &&
      e.weight > 0 &&
      typeof e.canFire === 'function' &&
      typeof e.apply === 'function'
  )
);
ok(
  '正面与负面事件并存',
  EVENTS.some((e) => e.kind === 'good') && EVENTS.some((e) => e.kind === 'bad')
);
ok(
  '两个触发时机均有事件',
  TRIGGERS.every((t) => EVENTS.some((e) => e.trigger === t))
);

for (const ev of EVENTS) {
  const s = freshState();
  if (!ev.canFire(s)) {
    console.log('skip(canFire=false)', ev.id);
    continue;
  }
  const out = ev.apply(s, rig);
  const valid =
    out &&
    Array.isArray(out.lines) &&
    out.lines.length > 0 &&
    out.lines.every((l) => typeof l === 'string' && l.length > 0);
  ok(`事件 ${ev.id} 产出播报文案`, valid, out);
  const sane =
    s.gold >= 0 &&
    s.discardsLeft >= 0 &&
    s.target >= 10 &&
    s.mods.nextHandXMult > 0 &&
    s.hand.every((c) => !c.state || STATE_KEYS.includes(c.state)) &&
    s.hand.length === 8;
  ok(`事件 ${ev.id} 不破坏状态`, sane, {
    gold: s.gold,
    discards: s.discardsLeft,
    target: s.target,
  });
}

{
  const s = freshState();
  s.gold = 0;
  const leak = EVENTS.find((e) => e.id === 'gold_leak');
  ok('金币泄漏：没钱时不触发', leak && !leak.canFire(s));
}
{
  const s = freshState();
  s.discardsLeft = 1;
  const burn = EVENTS.find((e) => e.id === 'fuse_burn');
  ok('保险丝烧毁：弃牌不足时不触发', burn && !burn.canFire(s));
}
{
  const s = freshState();
  const ev = rollEvent(EVENTS, s, 'levelStart', rig);
  ok('权重抽取返回本时机事件', !!ev && ev.trigger === 'levelStart');
  const none = rollEvent(EVENTS, s, 'nonexistent', rig);
  ok('无候选时返回 null', none === null);
}
{
  const s = freshState();
  const surge = EVENTS.find((e) => e.id === 'quota_surge');
  const before = s.target;
  surge.apply(s, rig);
  ok('配额上调：目标变高且取整到10', s.target > before && s.target % 10 === 0, s.target);
}

console.log(fail ? `\n${fail} 项失败` : '\n随机事件测试通过');
process.exit(fail ? 1 : 0);
