/* Hand scoring flow with card, joker, card-state and score animations. */
import type { Card, Joker, JokerEffect, ScoringFlowApi, ScoringFlowDeps } from '../types';

const FALLBACK_JOKER_POINT = { x: 240, y: 140 };
const FALLBACK_CARD_POINT = { x: 240, y: 240 };

export function createScoringFlow(deps: ScoringFlowDeps): ScoringFlowApi {
  const {
    $,
    state,
    MAX_PLAY,
    sleep,
    fmt,
    chipVal,
    evaluateHand,
    stateScoreProc,
    CARD_STATES,
    SFX,
    FX,
    elCenter,
    floatText,
    popEl,
    shake,
    flash,
    glitchFx,
    animateNumber,
    announcer,
    maybeFireEvent,
    renderButtons,
    renderCounts,
    renderGold,
    renderHand,
    renderPlayed,
    renderJokers,
    resetReadout,
    renderStatus,
    drawTo,
    refreshCleared,
    settleLevel,
    gameOver,
  } = deps;

  /* Turn a state-less hand card tainted; returns true when one was infected. */
  function infectHandCard(sourceLabel: string): boolean {
    const open = state.hand.filter((card) => !card.state);
    if (!open.length) return false;
    const card = open[Math.floor(Math.random() * open.length)];
    if (!card) return false;
    card.state = 'tainted';
    renderHand();
    if (card.el) {
      popEl(card.el, 'stflash');
      const point = elCenter(card.el);
      floatText(point.x, point.y - 30, '污染!', 'f-state');
      FX.sparks(point.x, point.y, '#a96bff', 10, 4);
    }
    SFX.taint();
    announcer.announce(`${sourceLabel}：一张手牌被污染`, 'weird');
    return true;
  }

  async function playHand(): Promise<void> {
    if (state.phase !== 'play') return;
    const selected = state.hand.filter((card) => card.sel);
    if (!selected.length || selected.length > MAX_PLAY) {
      SFX.deny();
      return;
    }

    state.phase = 'scoring';
    renderButtons();
    state.handsLeft--;
    renderCounts();

    state.hand = state.hand.filter((card) => !card.sel);
    selected.forEach((card) => {
      card.sel = false;
    });
    state.played = selected;
    renderHand();
    renderPlayed();
    SFX.play();
    shake(1);

    const ev = evaluateHand(state.played, state.handLevels);
    const handName = $('#handName');
    handName.textContent = `${ev.name} Lv.${ev.level}`;
    popEl(handName, 'big');

    let chips = ev.baseChips;
    let mult = ev.baseMult;
    let combo = 0;
    const calc = $('#calc');
    calc.classList.remove('preview');
    const setC = (): void => {
      $('#chipsDisp').textContent = fmt(chips);
      popEl($('#chipsDisp'));
    };
    const setM = (): void => {
      $('#multDisp').textContent = fmt(mult);
      popEl($('#multDisp'));
    };
    setC();
    setM();
    $('#totalDisp').textContent = '';

    /* consume one-shot mult anomalies injected by chaos events */
    const mods = state.mods;
    if (mods.nextHandMult) {
      mult += mods.nextHandMult;
      setM();
      const point = elCenter($('#multDisp'));
      floatText(point.x, point.y - 22, `异常 +${mods.nextHandMult} 倍`, 'f-mult');
      announcer.announce(`倍率异常注入 +${mods.nextHandMult}`, 'weird');
      SFX.taint();
      mods.nextHandMult = 0;
    }
    if (mods.nextHandXMult !== 1) {
      mult = Math.max(1, Math.round(mult * mods.nextHandXMult));
      setM();
      glitchFx();
      const point = elCenter($('#multDisp'));
      floatText(point.x, point.y - 22, `×${mods.nextHandXMult} 异常`, 'f-mult');
      announcer.announce('倍率欠压生效', 'bad');
      mods.nextHandXMult = 1;
    }
    renderStatus?.();

    async function jokerProc(joker: Joker, effect: JokerEffect): Promise<void> {
      if (joker.el) popEl(joker.el, 'jtrig');
      SFX.joker(combo++);
      const point = joker.el ? elCenter(joker.el) : FALLBACK_JOKER_POINT;
      if (effect.chips) {
        chips += effect.chips;
        setC();
        floatText(point.x, point.y + 6, `+${effect.chips}`, 'f-chips');
        FX.sparks(point.x, point.y, '#48a9ff', 8, 4);
      }
      if (effect.mult) {
        mult += effect.mult;
        setM();
        floatText(point.x, point.y + 6, `+${effect.mult} 倍`, 'f-mult');
        FX.sparks(point.x, point.y, '#ff3b77', 8, 4);
      }
      if (effect.xmult) {
        mult = Math.round(mult * effect.xmult);
        setM();
        floatText(point.x, point.y + 6, `×${effect.xmult}!`, 'f-mult f-big');
        SFX.bigmult();
        flash('rgba(255,59,119,.3)');
        shake(2);
        if (effect.glitch) glitchFx();
        FX.sparks(point.x, point.y, '#ff3b77', 18, 6);
      }
      if (effect.gold) {
        state.gold += effect.gold;
        renderGold();
        popEl($('#goldVal'));
        floatText(point.x, point.y + 6, `+${effect.gold} 金`, 'f-gold');
        SFX.coin();
        FX.coins(point.x, point.y, 6);
      }
      if (effect.infect) {
        floatText(point.x, point.y + 6, '扩散!', 'f-state');
        infectHandCard(joker.name);
      }
      await sleep(290);
    }

    /* special card-state proc: distinct rhythm from joker beats */
    async function stateProc(card: Card, baseVal: number): Promise<void> {
      const stateKey = card.state;
      if (!stateKey) return;
      const proc = stateScoreProc(stateKey);
      const meta = CARD_STATES[stateKey];
      if (card.el) popEl(card.el, 'stflash');
      const point = card.el ? elCenter(card.el) : FALLBACK_CARD_POINT;
      if (proc.chips) {
        chips += proc.chips;
        setC();
        floatText(point.x, point.y - 50, `${meta.name} +${proc.chips}`, 'f-chips');
        FX.sparks(point.x, point.y, meta.color, 10, 5);
      }
      if (proc.echo) {
        await sleep(130);
        chips += baseVal;
        setC();
        floatText(point.x, point.y - 50, `回声 +${baseVal}`, 'f-state');
        SFX.echo(combo++);
        FX.sparks(point.x, point.y, meta.color, 8, 4);
      }
      if (proc.gold) {
        state.gold += proc.gold;
        renderGold();
        popEl($('#goldVal'));
        floatText(point.x, point.y - 50, `镀金 +${proc.gold} 金`, 'f-gold');
        SFX.gild();
        FX.coins(point.x, point.y, 5);
      }
      if (proc.mult) {
        mult += proc.mult;
        setM();
        floatText(point.x, point.y - 50, `污染 +${proc.mult} 倍`, 'f-mult');
        SFX.taint();
      }
      if (proc.deckCrack && state.deck.length) {
        state.deck.splice(Math.floor(Math.random() * state.deck.length), 1);
        renderCounts();
        SFX.crack();
        shake(1);
        announcer.announce('牌堆深处传来碎裂声 -1', 'bad');
      }
      if (proc.spreadChance && Math.random() < proc.spreadChance) {
        if (!infectHandCard('污染扩散') && state.gold > 0) {
          state.gold -= 1;
          renderGold();
          floatText(point.x, point.y - 50, '-1 金', 'f-gold');
          announcer.announce('污染渗入投币口 金币-1', 'bad');
        }
      }
      await sleep(150);
    }

    await sleep(380);

    for (const card of ev.scoring) {
      if (card.el) popEl(card.el, 'scored');
      const value = chipVal(card.rank);
      chips += value;
      setC();
      const point = card.el ? elCenter(card.el) : FALLBACK_CARD_POINT;
      floatText(point.x, point.y - 34, `+${value}`, 'f-chips');
      SFX.tick(combo++);
      if (mods.suitBoost && card.suit === mods.suitBoost.suit) {
        chips += mods.suitBoost.chips;
        setC();
        floatText(point.x, point.y - 54, `过热 +${mods.suitBoost.chips}`, 'f-chips');
        FX.sparks(point.x, point.y, '#ff9d3b', 7, 4);
      }
      await sleep(170);
      if (card.state) await stateProc(card, value);
      for (const joker of state.jokers) {
        if (joker.perCard) {
          const effect = joker.perCard(card, ev);
          if (effect) await jokerProc(joker, effect);
        }
      }
    }

    const shattered: Joker[] = [];
    for (const joker of state.jokers) {
      if (joker.onHand) {
        const effect = joker.onHand(ev, state.played);
        if (effect) {
          await jokerProc(joker, effect);
          if (effect.shatter) shattered.push(joker);
        }
      }
    }
    for (const joker of shattered) {
      const index = state.jokers.indexOf(joker);
      if (index < 0) continue;
      const point = joker.el ? elCenter(joker.el) : FALLBACK_JOKER_POINT;
      state.jokers.splice(index, 1);
      SFX.shatter();
      glitchFx();
      shake(2);
      FX.sparks(point.x, point.y, '#e4f0f8', 22, 6);
      floatText(point.x, point.y, '碎裂!', 'f-mult f-big');
      announcer.announce(`${joker.name} 当场碎裂`, 'bad');
      renderJokers();
      await sleep(260);
    }
    await sleep(200);

    const total = Math.floor(chips * mult);
    SFX.mult();
    await sleep(260);
    const totalDisplay = $('#totalDisp');
    await animateNumber(totalDisplay, 0, total, Math.min(900, 300 + total * 0.4), true);
    popEl(totalDisplay, 'slam');
    SFX.settle();
    const heavy =
      mult >= 15 || total >= state.target * 0.8 ? 3 : total >= state.target * 0.35 ? 2 : 1;
    shake(heavy);
    flash('rgba(255,210,63,.22)');
    const totalPoint = elCenter(totalDisplay);
    FX.sparks(totalPoint.x, totalPoint.y, '#ffd23f', 26, 7);
    if (heavy === 3) glitchFx();

    const before = state.score;
    const beforeTotal = state.total;
    const wasCleared = state.cleared;
    state.score += total;
    state.total += total;
    await sleep(240);
    await Promise.all([
      animateNumber($('#roundScore'), before, state.score, 450),
      animateNumber($('#totalScore'), beforeTotal, state.total, 450),
    ]);
    popEl($('#roundScore'));
    popEl($('#totalScore'));

    /* breakthrough beat: the moment cumulative score crosses the target */
    if (!wasCleared && state.total >= state.target) {
      SFX.breakthrough();
      flash('rgba(255,255,255,.45)');
      glitchFx();
      shake(3);
      announcer.splash('目标突破', 'gold');
      const scorePoint = elCenter($('#totalScore'));
      FX.sparks(scorePoint.x, scorePoint.y, '#5dff8f', 30, 8);
      await sleep(420);
      refreshCleared();
    }

    state.played.forEach((card) => card.el?.classList.add('out'));
    await sleep(330);
    state.played = [];
    renderPlayed();
    resetReadout();

    /* Once cleared the level can never be lost: keep playing for cumulative
       score, or auto-settle into the shop when the last hand is spent. */
    if (state.cleared) {
      if (state.handsLeft <= 0) {
        await settleLevel(false);
        return;
      }
      maybeFireEvent('afterScore');
      drawTo();
      state.phase = 'play';
      renderButtons();
      return;
    }
    if (state.handsLeft <= 0) {
      await gameOver();
      return;
    }
    maybeFireEvent('afterScore');
    drawTo();
    state.phase = 'play';
    renderButtons();
  }

  return { playHand };
}
