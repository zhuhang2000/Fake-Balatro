const path = require('path');
const fs = require('fs');
const shopFlow = require(path.join(__dirname, '..', 'src', 'flow', 'shop-flow.js'));
const scoringFlow = require(path.join(__dirname, '..', 'src', 'flow', 'scoring-flow.js'));
const packageJson = require(path.join(__dirname, '..', 'package.json'));
const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const mainTs = fs.readFileSync(path.join(__dirname, '..', 'src', 'main.ts'), 'utf8');
const ciWorkflow = fs.readFileSync(
  path.join(__dirname, '..', '.github', 'workflows', 'ci.yml'),
  'utf8'
);

let fail = 0;
function has(name, value, type = 'function') {
  if (typeof value !== type) {
    console.error(`FAIL ${name} should be ${type}`);
    fail++;
  } else {
    console.log(`ok ${name}`);
  }
}
function exists(relPath) {
  const fullPath = path.join(__dirname, '..', relPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`FAIL ${relPath} should exist`);
    fail++;
  } else {
    console.log(`ok ${relPath}`);
  }
}
function notExists(relPath) {
  const fullPath = path.join(__dirname, '..', relPath);
  if (fs.existsSync(fullPath)) {
    console.error(`FAIL ${relPath} should not exist`);
    fail++;
  } else {
    console.log(`ok ${relPath} removed`);
  }
}
function includes(name, text, pattern) {
  if (!pattern.test(text)) {
    console.error(`FAIL ${name} should match ${pattern}`);
    fail++;
  } else {
    console.log(`ok ${name}`);
  }
}
function safeRequire(relPath) {
  try {
    return require(path.join(__dirname, '..', relPath));
  } catch (_err) {
    console.error(`FAIL ${relPath} should be require-able`);
    fail++;
    return {};
  }
}

exists('src/types.ts');
exists('src/main.ts');
exists('src/core/utils.ts');
exists('src/core/cards.ts');
exists('src/core/upgrades.ts');
exists('src/core/hands.ts');
exists('src/core/index.ts');
exists('src/state/game-state.ts');
exists('src/data/jokers.ts');
exists('src/core/card-states.ts');
exists('src/data/events.ts');
exists('src/systems/audio.ts');
exists('src/systems/fx.ts');
exists('src/systems/grain.ts');
exists('src/systems/announcer.ts');
exists('src/flow/events-flow.ts');
exists('src/ui/hud-view.ts');
exists('src/ui/readout-view.ts');
exists('src/ui/modals-view.ts');
exists('src/ui/cards-view.ts');
exists('src/ui/shop-view.ts');
notExists('src/main.js');
notExists('src/core/utils.js');
notExists('src/core/cards.js');
notExists('src/core/upgrades.js');
notExists('src/core/hands.js');
notExists('src/core/index.js');
notExists('src/state/game-state.js');
notExists('src/data/jokers.js');
notExists('src/systems/audio.js');
notExists('src/systems/fx.js');
notExists('src/systems/grain.js');
notExists('src/systems/announcer.js');
notExists('src/flow/events-flow.js');
notExists('src/ui/hud-view.js');
notExists('src/ui/readout-view.js');
notExists('src/ui/modals-view.js');
notExists('src/ui/cards-view.js');
notExists('src/ui/shop-view.js');
includes(
  'index module entry',
  indexHtml,
  /<script\s+type="module"\s+src="\/src\/main\.ts"><\/script>/
);
includes('main imports audio module', mainTs, /from '\.\/systems\/audio'/);
includes('main imports visuals module', mainTs, /from '\.\/systems\/fx'/);
includes('main imports grain module', mainTs, /from '\.\/systems\/grain'/);
includes('main imports announcer module', mainTs, /from '\.\/systems\/announcer'/);
includes('main imports events flow module', mainTs, /from '\.\/flow\/events-flow'/);
includes('main imports hud view module', mainTs, /from '\.\/ui\/hud-view'/);
includes('main imports readout view module', mainTs, /from '\.\/ui\/readout-view'/);
includes('main imports modals view module', mainTs, /from '\.\/ui\/modals-view'/);
includes('main imports cards view module', mainTs, /from '\.\/ui\/cards-view'/);
includes('main imports shop view module', mainTs, /from '\.\/ui\/shop-view'/);
if (
  /\.\/(?:systems\/(?:audio|fx|grain|announcer)|flow\/events-flow|ui\/(?:hud-view|readout-view|modals-view|cards-view|shop-view))\.js/.test(
    mainTs
  )
) {
  console.error('FAIL main.ts should not import migrated systems through .js side effects');
  fail++;
} else {
  console.log('ok main.ts imports migrated systems directly');
}
includes('package dev script', packageJson.scripts.dev || '', /\bvite\b/);
includes('package build script', packageJson.scripts.build || '', /\bvite build\b/);
includes('ci test script', ciWorkflow, /\bnpm test\b/);
if (/node\s+tests\/core\.test\.js/.test(ciWorkflow)) {
  console.error('FAIL ci workflow should not bypass npm test');
  fail++;
} else {
  console.log('ok ci workflow uses npm test entrypoint');
}
const stateMod = safeRequire('.tmp/test-build/state/game-state.js');
has('createInitialState', stateMod.createInitialState);
has('createShopState', stateMod.createShopState);
has('sellPrice', stateMod.sellPrice);
has('createShopFlow', shopFlow.createShopFlow);
has('createScoringFlow', scoringFlow.createScoringFlow);
const cardsViewMod = safeRequire('.tmp/test-build/ui/cards-view.js');
has('createCardsView', cardsViewMod.createCardsView);
const shopViewMod = safeRequire('.tmp/test-build/ui/shop-view.js');
has('createShopView', shopViewMod.createShopView);
const hudViewMod = safeRequire('.tmp/test-build/ui/hud-view.js');
has('createHudView', hudViewMod.createHudView);
const readoutViewMod = safeRequire('.tmp/test-build/ui/readout-view.js');
has('createReadoutView', readoutViewMod.createReadoutView);
const modalsViewMod = safeRequire('.tmp/test-build/ui/modals-view.js');
has('createModalsView', modalsViewMod.createModalsView);
const audioMod = safeRequire('.tmp/test-build/systems/audio.js');
has('Snd', audioMod.Snd, 'object');
has('SFX', audioMod.SFX, 'object');
const visualsMod = safeRequire('.tmp/test-build/systems/fx.js');
has('createVisuals', visualsMod.createVisuals);
const grainMod = safeRequire('.tmp/test-build/systems/grain.js');
has('createGrain', grainMod.createGrain);
const announcerMod = safeRequire('.tmp/test-build/systems/announcer.js');
has('createAnnouncer', announcerMod.createAnnouncer);
const eventsFlowMod = safeRequire('.tmp/test-build/flow/events-flow.js');
has('createEventsFlow', eventsFlowMod.createEventsFlow);
const eventsMod = safeRequire('.tmp/test-build/data/events.js');
has('rollEvent', eventsMod.rollEvent);
const coreMod = safeRequire('.tmp/test-build/core/index.js');
has('stateScoreProc', coreMod.stateScoreProc);
has('sprinkleStates', coreMod.sprinkleStates);
has('previewStateChips', coreMod.previewStateChips);

console.log(fail ? `\n${fail} 项失败` : '\n结构测试通过');
process.exit(fail ? 1 : 0);
