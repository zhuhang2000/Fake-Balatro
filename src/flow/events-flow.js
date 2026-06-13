/* Chaos event orchestration: gates, rolls and full sensory feedback. */
((root) => {
  function createEventsFlow(deps) {
    const {
      state,
      events,
      rollEvent,
      rng,
      announcer,
      SFX,
      flash,
      shake,
      glitchFx,
      renderCounts,
      renderGold,
      renderHand,
      renderStatus,
    } = deps;

    const GATES = { levelStart: 0.34, afterScore: 0.14 };
    const TONES = { good: 'good', bad: 'bad', mixed: 'weird', risk: 'weird' };

    function feedback(kind) {
      SFX.event(kind);
      if (kind === 'good') {
        flash('rgba(93,255,143,.2)');
        shake(1);
      } else if (kind === 'bad') {
        flash('rgba(255,64,64,.28)');
        shake(2);
        glitchFx();
      } else {
        flash('rgba(255,59,119,.22)');
        shake(2);
        glitchFx();
      }
    }

    /* Roll the gate, fire one event, render its consequences. Returns the event or null. */
    function maybeFire(trigger) {
      const gate = GATES[trigger] || 0;
      if (Math.random() >= gate) return null;
      const ev = rollEvent(events, state, trigger, rng);
      if (!ev) return null;
      const outcome = ev.apply(state, rng);
      const tone = TONES[ev.kind] || 'weird';
      announcer.splash(ev.name, tone);
      feedback(ev.kind);
      outcome.lines.forEach((line) => announcer.announce(line, tone));
      if (!state.eventLog) state.eventLog = [];
      state.eventLog.push({ name: ev.name, kind: ev.kind, lines: outcome.lines.slice() });
      renderCounts();
      renderGold();
      renderHand();
      if (renderStatus) renderStatus();
      return ev;
    }

    return { maybeFire };
  }

  const api = { createEventsFlow };
  root.JokerEventsFlow = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
