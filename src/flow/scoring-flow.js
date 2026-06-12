/* Hand scoring flow with card, joker and score animations. */
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
      SFX,
      FX,
      elCenter,
      floatText,
      popEl,
      shake,
      flash,
      glitchFx,
      animateNumber,
      renderButtons,
      renderCounts,
      renderGold,
      renderHand,
      renderPlayed,
      resetReadout,
      drawTo,
      levelClear,
      gameOver,
    } = deps;

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
          mult *= e.xmult;
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
        await sleep(290);
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
        await sleep(170);
        for (const j of state.jokers) {
          if (j.perCard) {
            const e = j.perCard(c, ev);
            if (e) await jokerProc(j, e);
          }
        }
      }

      for (const j of state.jokers) {
        if (j.onHand) {
          const e = j.onHand(ev, state.played);
          if (e) await jokerProc(j, e);
        }
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

      const before = state.score;
      const beforeTotal = state.total;
      state.score += total;
      state.total += total;
      await sleep(240);
      await Promise.all([
        animateNumber($('#roundScore'), before, state.score, 450),
        animateNumber($('#totalScore'), beforeTotal, state.total, 450),
      ]);
      popEl($('#roundScore'));
      popEl($('#totalScore'));

      state.played.forEach((c) => c.el.classList.add('out'));
      await sleep(330);
      state.played = [];
      renderPlayed();
      resetReadout();

      if (state.score >= state.target) {
        await levelClear();
        return;
      }
      if (state.handsLeft <= 0) {
        await gameOver();
        return;
      }
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
