const path = require('path');
const stateMod = require(path.join(__dirname, '..', 'src', 'state', 'game-state.js'));
const shopView = require(path.join(__dirname, '..', 'src', 'ui', 'shop-view.js'));
const shopFlow = require(path.join(__dirname, '..', 'src', 'flow', 'shop-flow.js'));
const scoringFlow = require(path.join(__dirname, '..', 'src', 'flow', 'scoring-flow.js'));
const cardsView = require(path.join(__dirname, '..', 'src', 'ui', 'cards-view.js'));
const hudView = require(path.join(__dirname, '..', 'src', 'ui', 'hud-view.js'));
const readoutView = require(path.join(__dirname, '..', 'src', 'ui', 'readout-view.js'));
const modalsView = require(path.join(__dirname, '..', 'src', 'ui', 'modals-view.js'));
const grain = require(path.join(__dirname, '..', 'src', 'systems', 'grain.js'));

let fail = 0;
function has(name, value, type = 'function') {
  if (typeof value !== type) {
    console.error(`FAIL ${name} should be ${type}`);
    fail++;
  } else {
    console.log(`ok ${name}`);
  }
}

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
