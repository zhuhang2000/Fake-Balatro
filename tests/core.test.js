const path = require('path');
const core = require(path.join(__dirname, '..', '.tmp', 'test-build', 'core', 'index.js'));
const { evaluateHand, chipVal, makeDeck, targetFor, initHandLevels, getHandStats, HAND_UPGRADES } =
  core;

let fail = 0;
const C = (rank, suit = '♠') => ({
  id: Math.random(),
  rank,
  suit,
  color: suit === '♥' || suit === '♦' ? 'red' : 'black',
});
function t(name, cards, key, n) {
  const ev = evaluateHand(cards);
  if (ev.key !== key || ev.scoring.length !== n) {
    console.error('FAIL', name, '→', ev.key, ev.scoring.length);
    fail++;
  } else console.log('ok', name);
}
t('高牌', [C(2), C(5, '♥'), C(7), C(9, '♦'), C(13)], 'high', 1);
t('一对', [C(5), C(5, '♥'), C(9), C(2, '♦'), C(3)], 'pair', 2);
t('两对', [C(5), C(5, '♥'), C(9), C(9, '♦'), C(3)], 'twopair', 4);
t('三条', [C(7), C(7, '♥'), C(7, '♦'), C(2), C(3, '♥')], 'three', 3);
t('顺子', [C(5), C(6, '♥'), C(7), C(8, '♦'), C(9)], 'straight', 5);
t('A低顺子', [C(14), C(2, '♥'), C(3), C(4, '♦'), C(5)], 'straight', 5);
t('A高顺子', [C(10), C(11, '♥'), C(12), C(13, '♦'), C(14)], 'straight', 5);
t('同花', [C(2, '♥'), C(5, '♥'), C(7, '♥'), C(9, '♥'), C(13, '♥')], 'flush', 5);
t('葫芦', [C(8), C(8, '♥'), C(8, '♦'), C(13), C(13, '♥')], 'full', 5);
t('四条', [C(9), C(9, '♥'), C(9, '♦'), C(9, '♣'), C(2)], 'four', 4);
t('同花顺', [C(5, '♥'), C(6, '♥'), C(7, '♥'), C(8, '♥'), C(9, '♥')], 'sflush', 5);
t('4张连牌≠顺子', [C(5), C(6, '♥'), C(7), C(8, '♦')], 'high', 1);
t('2张对子', [C(4), C(4, '♥')], 'pair', 2);
t('单张', [C(11)], 'high', 1);
t('4张同点', [C(9), C(9, '♥'), C(9, '♦'), C(9, '♣')], 'four', 4);
if (chipVal(14) !== 11 || chipVal(13) !== 10 || chipVal(10) !== 10 || chipVal(7) !== 7) {
  console.error('FAIL chipVal');
  fail++;
} else console.log('ok 筹码值 A=11 K=10 7=7');
if (makeDeck().length !== 52) {
  console.error('FAIL deck');
  fail++;
} else console.log('ok 52张牌');
console.log('目标分数 L1,L2,L3,L8 =', [1, 2, 3, 8].map(targetFor).join(','));
if (targetFor(1) !== 250) {
  console.error('FAIL target');
  fail++;
}
const ev = evaluateHand([C(5), C(5, '♥'), C(9), C(2, '♦'), C(3)]);
const total = (ev.baseChips + ev.scoring.reduce((s, c) => s + chipVal(c.rank), 0)) * ev.baseMult;
if (total !== 40) {
  console.error('FAIL 计分示例', total);
  fail++;
} else console.log('ok 计分示例 一对5 = 40');
if (typeof initHandLevels !== 'function' || typeof getHandStats !== 'function' || !HAND_UPGRADES) {
  console.error('FAIL 牌型升级 API 未导出');
  fail++;
} else {
  const levels = initHandLevels();
  const pairLv1 = getHandStats('pair', levels);
  if (pairLv1.chips !== 10 || pairLv1.mult !== 2 || pairLv1.level !== 1) {
    console.error('FAIL 一对 Lv.1 默认值', pairLv1);
    fail++;
  } else console.log('ok 一对 Lv.1 默认值不变');

  levels.pair = 2;
  const pairLv2 = getHandStats('pair', levels);
  if (pairLv2.chips !== 20 || pairLv2.mult !== 3 || pairLv2.level !== 2) {
    console.error('FAIL 一对 Lv.2 升级值', pairLv2);
    fail++;
  } else console.log('ok 一对 Lv.2 = 20筹码 3倍率');

  const pairEv = evaluateHand([C(5), C(5, '♥'), C(9), C(2, '♦'), C(3)], levels);
  const pairTotal =
    (pairEv.baseChips + pairEv.scoring.reduce((s, c) => s + chipVal(c.rank), 0)) * pairEv.baseMult;
  if (pairEv.level !== 2 || pairTotal !== 90) {
    console.error('FAIL 升级后一对计分', pairEv.level, pairTotal);
    fail++;
  } else console.log('ok 升级后一对计分 = 90');

  levels.straight = 2;
  const pairAfterStraight = getHandStats('pair', levels);
  if (pairAfterStraight.chips !== 20 || pairAfterStraight.mult !== 3) {
    console.error('FAIL 顺子升级不应影响一对', pairAfterStraight);
    fail++;
  } else console.log('ok 顺子升级不影响一对');
}
console.log(fail ? `\n${fail} 项失败` : '\n全部测试通过');
process.exit(fail ? 1 : 0);
