/* Terminal-style glitch ticker and event splash overlay. */
((root) => {
  function createAnnouncer(deps) {
    const { $ } = deps;
    const GLYPHS = '█▓▒░<>/\\#%&@*+=?!01';
    const queue = [];
    let busy = false;
    let splashTimer = null;

    function scrambleIn(el, text, done) {
      let revealed = 0;
      const timer = setInterval(() => {
        revealed = Math.min(text.length, revealed + 1 + (Math.random() < 0.4 ? 1 : 0));
        let out = text.slice(0, revealed);
        for (let i = revealed; i < text.length; i++) {
          out += Math.random() < 0.6 ? GLYPHS[(Math.random() * GLYPHS.length) | 0] : text[i];
        }
        el.textContent = out;
        if (revealed >= text.length) {
          clearInterval(timer);
          el.textContent = text;
          done();
        }
      }, 26);
    }

    function pump() {
      if (busy || !queue.length) return;
      busy = true;
      const { text, tone, hold } = queue.shift();
      const el = $('#ticker');
      el.className = 'show t-' + tone;
      scrambleIn(el, '>> ' + text, () => {
        setTimeout(() => {
          el.classList.remove('show');
          setTimeout(() => {
            busy = false;
            pump();
          }, 180);
        }, hold);
      });
    }

    /* tone: sys | good | bad | weird | gold */
    function announce(text, tone = 'sys', hold = 1400) {
      if (queue.length > 4) queue.shift();
      queue.push({ text, tone, hold });
      pump();
    }

    /* Big center-screen glitch title, auto-fades. */
    function splash(title, tone = 'weird') {
      const el = $('#eventSplash');
      const txt = $('#eventSplashText');
      txt.textContent = title;
      txt.className = 'es-text es-' + tone;
      el.classList.remove('on');
      void el.offsetWidth;
      el.classList.add('on');
      if (splashTimer) clearTimeout(splashTimer);
      splashTimer = setTimeout(() => el.classList.remove('on'), 950);
    }

    return { announce, splash };
  }

  const api = { createAnnouncer };
  root.JokerAnnouncer = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
