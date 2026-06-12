const path = require('path');
const fs = require('fs');
const shopView = require(path.join(__dirname, '..', 'src', 'ui', 'shop-view.js'));
const shopFlow = require(path.join(__dirname, '..', 'src', 'flow', 'shop-flow.js'));
const scoringFlow = require(path.join(__dirname, '..', 'src', 'flow', 'scoring-flow.js'));
const cardsView = require(path.join(__dirname, '..', 'src', 'ui', 'cards-view.js'));
const hudView = require(path.join(__dirname, '..', 'src', 'ui', 'hud-view.js'));
const readoutView = require(path.join(__dirname, '..', 'src', 'ui', 'readout-view.js'));
const modalsView = require(path.join(__dirname, '..', 'src', 'ui', 'modals-view.js'));
const grain = require(path.join(__dirname, '..', 'src', 'systems', 'grain.js'));
const packageJson = require(path.join(__dirname, '..', 'package.json'));
const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
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
notExists('src/main.js');
notExists('src/core/utils.js');
notExists('src/core/cards.js');
notExists('src/core/upgrades.js');
notExists('src/core/hands.js');
notExists('src/core/index.js');
notExists('src/state/game-state.js');
notExists('src/data/jokers.js');
includes(
  'index module entry',
  indexHtml,
  /<script\s+type="module"\s+src="\/src\/main\.ts"><\/script>/
);
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
has('createShopView', shopView.createShopView);
has('createShopFlow', shopFlow.createShopFlow);
has('createScoringFlow', scoringFlow.createScoringFlow);
has('createCardsView', cardsView.createCardsView);
has('createHudView', hudView.createHudView);
has('createReadoutView', readoutView.createReadoutView);
has('createModalsView', modalsView.createModalsView);
has('createGrain', grain.createGrain);

console.log(fail ? `\n${fail} 项失败` : '\n结构测试通过');
process.exit(fail ? 1 : 0);
