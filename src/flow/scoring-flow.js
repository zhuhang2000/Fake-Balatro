/* Hand scoring flow with card, joker, card-state and score animations. */
((root) => {
  function createScoringFlow(deps) {
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
    function infectHandCard(sourceLabel) {
      const open = state.hand.filter((c) => !c.state);
      if (!open.length) return false;
      const card = open[(Math.random() * open.length) | 0];
      card.state = 'tainted';
      renderHand();
      if (card.el) {
        popEl(card.el, 'stflash');
        const p = elCenter(card.el);
        floatText(p.x, p.y - 30, '污染!', 'f-state');
        FX.sparks(p.x, p.y, '#a96bff', 10, 4);
      }
      SFX.taint();
      announcer.announce(`${sourceLabel}：一张手牌被污染`, 'weird');
      return true;
    }

    async function playHand() {
      if (state.phase !== 'play') return;
      const sel = state.hand.filter((c) => c.sel);
      if (!sel.length || sel.length > MAX_PLAY) {
        SFX.deny();
        return;
      }

      state.phase = 'scoring';
      renderButtons();
      state.handsLeft--;
      renderCounts();

      state.hand = state.hand.filter((c) => !c.sel);
      sel.forEach((c) => (c.sel = false));
      state.played = sel;
      renderHand();
      renderPlayed();
      SFX.play();
      shake(1);

      const ev = evaluateHand(state.played, state.handLevels);
      const hn = $('#handName');
      hn.textContent = `${ev.name} Lv.${ev.level}`;
      popEl(hn, 'big');

      let chips = ev.baseChips;
      let mult = ev.baseMult;
      let combo = 0;
      const calc = $('#calc');
      calc.classList.remove('preview');
      const setC = () => {
        $('#chipsDisp').textContent = fmt(chips);
        popEl($('#chipsDisp'));
      };
      const setM = () => {
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
        const p = elCenter($('#multDisp'));
        floatText(p.x, p.y - 22, `异常 +${mods.nextHandMult} 倍`, 'f-mult');
        announcer.announce(`倍率异常注入 +${mods.nextHandMult}`, 'weird');
        SFX.taint();
        mods.nextHandMult = 0;
      }
      if (mods.nextHandXMult !== 1) {
        mult = Math.max(1, Math.round(mult * mods.nextHandXMult));
        setM();
        glitchFx();
        const p = elCenter($('#multDisp'));
        floatText(p.x, p.y - 22, `×${mods.nextHandXMult} 异常`, 'f-mult');
        announcer.announce('倍率欠压生效', 'bad');
        mods.nextHandXMult = 1;
      }
      if (renderStatus) renderStatus();

      async function jokerProc(j, e) {
        if (j.el) popEl(j.el, 'jtrig');
        SFX.joker(combo++);
        const p = j.el ? elCenter(j.el) : { x: 240, y: 140 };
        if (e.chips) {
          chips += e.chips;
          setC();
          floatText(p.x, p.y + 6, '+' + e.chips, 'f-chips');
          FX.sparks(p.x, p.y, '#48a9ff', 8, 4);
        }
        if (e.mult) {
          mult += e.mult;
          setM();
          floatText(p.x, p.y + 6, '+' + e.mult + ' 倍', 'f-mult');
          FX.sparks(p.x, p.y, '#ff3b77', 8, 4);
        }
        if (e.xmult) {
          mult = Math.round(mult * e.xmult);
          setM();
          floatText(p.x, p.y + 6, '×' + e.xmult + '!', 'f-mult f-big');
          SFX.bigmult();
          flash('rgba(255,59,119,.3)');
          shake(2);
          if (e.glitch) glitchFx();
          FX.sparks(p.x, p.y, '#ff3b77', 18, 6);
        }
        if (e.gold) {
          state.gold += e.gold;
          renderGold();
          popEl($('#goldVal'));
          floatText(p.x, p.y + 6, '+' + e.gold + ' 金', 'f-gold');
          SFX.coin();
          FX.coins(p.x, p.y, 6);
        }
        if (e.infect) {
          floatText(p.x, p.y + 6, '扩散!', 'f-state');
          infectHandCard(j.name);
        }
        await sleep(290);
      }

      /* special card-state proc: distinct rhythm from joker beats */
      async function stateProc(c, baseVal) {
        const proc = stateScoreProc(c.state);
        const meta = CARD_STATES[c.state];
        if (c.el) popEl(c.el, 'stflash');
        const p = c.el ? elCenter(c.el) : { x: 240, y: 240 };
        if (proc.chips) {
          chips += proc.chips;
          setC();
          floatText(p.x, p.y - 50, `${meta.name} +${proc.chips}`, 'f-chips');
          FX.sparks(p.x, p.y, meta.color, 10, 5);
        }
        if (proc.echo) {
          await sleep(130);
          chips += baseVal;
          setC();
          floatText(p.x, p.y - 50, `回声 +${baseVal}`, 'f-state');
          SFX.echo(combo++);
          FX.sparks(p.x, p.y, meta.color, 8, 4);
        }
        if (proc.gold) {
          state.gold += proc.gold;
          renderGold();
          popEl($('#goldVal'));
          floatText(p.x, p.y - 50, `镀金 +${proc.gold} 金`, 'f-gold');
          SFX.gild();
          FX.coins(p.x, p.y, 5);
        }
        if (proc.mult) {
          mult += proc.mult;
          setM();
          floatText(p.x, p.y - 50, `污染 +${proc.mult} 倍`, 'f-mult');
          SFX.taint();
        }
        if (proc.deckCrack && state.deck.length) {
          state.deck.splice((Math.random() * state.deck.length) | 0, 1);
          renderCounts();
          SFX.crack();
          shake(1);
          announcer.announce('牌堆深处传来碎裂声 -1', 'bad');
        }
        if (proc.spreadChance && Math.random() < proc.spreadChance) {
          if (!infectHandCard('污染扩散') && state.gold > 0) {
            state.gold -= 1;
            renderGold();
            floatText(p.x, p.y - 50, '-1 金', 'f-gold');
            announcer.announce('污染渗入投币口 金币-1', 'bad');
          }
        }
        await sleep(150);
      }

      await sleep(380);

      for (const c of ev.scoring) {
        popEl(c.el, 'scored');
        const v = chipVal(c.rank);
        chips += v;
        setC();
        const p = elCenter(c.el);
        floatText(p.x, p.y - 34, '+' + v, 'f-chips');
        SFX.tick(combo++);
        if (mods.suitBoost && c.suit === mods.suitBoost.suit) {
          chips += mods.suitBoost.chips;
          setC();
          floatText(p.x, p.y - 54, `过热 +${mods.suitBoost.chips}`, 'f-chips');
          FX.sparks(p.x, p.y, '#ff9d3b', 7, 4);
        }
        await sleep(170);
        if (c.state) await stateProc(c, v);
        for (const j of state.jokers) {
          if (j.perCard) {
            const e = j.perCard(c, ev);
            if (e) await jokerProc(j, e);
          }
        }
      }

      const shattered = [];
      for (const j of state.jokers) {
        if (j.onHand) {
          const e = j.onHand(ev, state.played);
          if (e) {
            await jokerProc(j, e);
            if (e.shatter) shattered.push(j);
          }
        }
      }
      for (const j of shattered) {
        const idx = state.jokers.indexOf(j);
        if (idx < 0) continue;
        const p = j.el ? elCenter(j.el) : { x: 240, y: 140 };
        state.jokers.splice(idx, 1);
        SFX.shatter();
        glitchFx();
        shake(2);
        FX.sparks(p.x, p.y, '#e4f0f8', 22, 6);
        floatText(p.x, p.y, '碎裂!', 'f-mult f-big');
        announcer.announce(`${j.name} 当场碎裂`, 'bad');
        renderJokers();
        await sleep(260);
      }
      await sleep(200);

      const total = Math.floor(chips * mult);
      SFX.mult();
      await sleep(260);
      const td = $('#totalDisp');
      await animateNumber(td, 0, total, Math.min(900, 300 + total * 0.4), true);
      popEl(td, 'slam');
      SFX.settle();
      const heavy =
        mult >= 15 || total >= state.target * 0.8 ? 3 : total >= state.target * 0.35 ? 2 : 1;
      shake(heavy);
      flash('rgba(255,210,63,.22)');
      const pc = elCenter(td);
      FX.sparks(pc.x, pc.y, '#ffd23f', 26, 7);
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
        const ps = elCenter($('#totalScore'));
        FX.sparks(ps.x, ps.y, '#5dff8f', 30, 8);
        await sleep(420);
        refreshCleared();
      }

      state.played.forEach((c) => c.el.classList.add('out'));
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

  const api = { createScoringFlow };
  root.JokerScoringFlow = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
