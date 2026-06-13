import type { AnnouncerApi, AnnouncerDeps, AnnouncerTone } from '../types';

interface AnnounceItem {
  text: string;
  tone: AnnouncerTone;
  hold: number;
}

const GLYPHS = '█▓▒░<>/\\#%&@*+=?!01';

export function createAnnouncer(deps: AnnouncerDeps): AnnouncerApi {
  const { $ } = deps;
  const queue: AnnounceItem[] = [];
  let busy = false;
  let splashTimer: number | null = null;

  function scrambleIn(el: Element, text: string, done: () => void) {
    let revealed = 0;
    const timer = window.setInterval(() => {
      revealed = Math.min(text.length, revealed + 1 + (Math.random() < 0.4 ? 1 : 0));
      let out = text.slice(0, revealed);
      for (let i = revealed; i < text.length; i++) {
        out += Math.random() < 0.6 ? GLYPHS[(Math.random() * GLYPHS.length) | 0] : text[i];
      }
      el.textContent = out;
      if (revealed >= text.length) {
        window.clearInterval(timer);
        el.textContent = text;
        done();
      }
    }, 26);
  }

  function pump() {
    if (busy || !queue.length) return;
    busy = true;
    const item = queue.shift();
    if (!item) return;
    const { text, tone, hold } = item;
    const el = $('#ticker');
    el.className = 'show t-' + tone;
    scrambleIn(el, '>> ' + text, () => {
      window.setTimeout(() => {
        el.classList.remove('show');
        window.setTimeout(() => {
          busy = false;
          pump();
        }, 180);
      }, hold);
    });
  }

  function announce(text: string, tone: AnnouncerTone = 'sys', hold = 1400) {
    if (queue.length > 4) queue.shift();
    queue.push({ text, tone, hold });
    pump();
  }

  function splash(title: string, tone: AnnouncerTone = 'weird') {
    const el = $('#eventSplash');
    const txt = $('#eventSplashText');
    txt.textContent = title;
    txt.className = 'es-text es-' + tone;
    el.classList.remove('on');
    void el.offsetWidth;
    el.classList.add('on');
    if (splashTimer) window.clearTimeout(splashTimer);
    splashTimer = window.setTimeout(() => el.classList.remove('on'), 950);
  }

  return { announce, splash };
}
