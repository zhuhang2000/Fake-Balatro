import type {
  AnnouncerTone,
  EventKind,
  EventTrigger,
  EventsFlowApi,
  EventsFlowDeps,
} from '../types';

const GATES: Record<EventTrigger, number> = { levelStart: 0.34, afterScore: 0.14 };
const TONES: Record<EventKind, AnnouncerTone> = {
  good: 'good',
  bad: 'bad',
  mixed: 'weird',
  risk: 'weird',
};

export function createEventsFlow(deps: EventsFlowDeps): EventsFlowApi {
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

  function feedback(kind: EventKind) {
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

  function maybeFire(trigger: EventTrigger) {
    const gate = GATES[trigger];
    if (rng.rnd(0, 1) >= gate) return null;
    const ev = rollEvent(events, state, trigger, rng);
    if (!ev) return null;
    const outcome = ev.apply(state, rng);
    const tone = TONES[ev.kind];
    announcer.splash(ev.name, tone);
    feedback(ev.kind);
    outcome.lines.forEach((line) => announcer.announce(line, tone));
    state.eventLog.push({ name: ev.name, kind: ev.kind, lines: outcome.lines.slice() });
    renderCounts();
    renderGold();
    renderHand();
    renderStatus?.();
    return ev;
  }

  return { maybeFire };
}
