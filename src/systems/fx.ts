import type { FxApi, VisualsApi, VisualsDeps } from '../types';

interface BaseParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  gr: number;
  life: number;
}

interface SparkParticle extends BaseParticle {
  type: 'spark';
  col: string;
}

interface CoinParticle extends BaseParticle {
  type: 'coin';
  r: number;
}

interface ConfettiParticle extends BaseParticle {
  type: 'conf';
  r: number;
  col: string;
}

type Particle = SparkParticle | CoinParticle | ConfettiParticle;

export function createVisuals(deps: VisualsDeps): VisualsApi {
  const { $, rnd, ri, choice, fmt, SFX } = deps;
  const parts: Particle[] = [];
  let cv: HTMLCanvasElement | null = null;
  let g: CanvasRenderingContext2D | null = null;

  const FX: FxApi = {
    init() {
      cv = $<HTMLCanvasElement>('#fx');
      g = cv.getContext('2d');
      if (!g) throw new Error('Missing 2D canvas context for #fx');
      const fit = () => {
        if (!cv) return;
        const r = $('#screen').getBoundingClientRect();
        cv.width = r.width;
        cv.height = r.height;
      };
      fit();
      window.addEventListener('resize', fit);
      const loop = () => {
        if (!cv || !g) return;
        g.clearRect(0, 0, cv.width, cv.height);
        for (let i = parts.length - 1; i >= 0; i--) {
          const p = parts[i];
          if (!p) continue;
          p.x += p.vx;
          p.y += p.vy;
          p.vy += p.gr;
          p.vx *= 0.99;
          p.life--;
          if (p.life <= 0 || p.y > cv.height + 20) {
            parts.splice(i, 1);
            continue;
          }
          g.globalAlpha = Math.min(1, p.life / 20);
          if (p.type === 'spark') {
            g.strokeStyle = p.col;
            g.lineWidth = 2;
            g.beginPath();
            g.moveTo(p.x, p.y);
            g.lineTo(p.x - p.vx * 2.2, p.y - p.vy * 2.2);
            g.stroke();
          } else if (p.type === 'coin') {
            g.fillStyle = '#ffd23f';
            g.beginPath();
            g.arc(p.x, p.y, p.r, 0, 7);
            g.fill();
            g.fillStyle = '#a87b12';
            g.fillRect(p.x - 1, p.y - p.r * 0.5, 2, p.r);
          } else {
            g.fillStyle = p.col;
            g.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
          }
        }
        g.globalAlpha = 1;
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    },
    sparks(x, y, col, n = 12, sp = 5) {
      for (let i = 0; i < n; i++) {
        const a = rnd(0, 6.283);
        const v = rnd(1, sp);
        parts.push({
          type: 'spark',
          x,
          y,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v,
          gr: 0.08,
          life: ri(18, 34),
          col,
        });
      }
    },
    coins(x, y, n = 8) {
      for (let i = 0; i < n; i++) {
        parts.push({
          type: 'coin',
          x: x + rnd(-8, 8),
          y,
          vx: rnd(-2.4, 2.4),
          vy: rnd(-5.5, -2),
          gr: 0.22,
          r: rnd(2.5, 4.5),
          life: ri(40, 70),
        });
      }
    },
    confetti() {
      const w = cv?.width ?? 0;
      for (let i = 0; i < 90; i++) {
        parts.push({
          type: 'conf',
          x: rnd(0, w),
          y: rnd(-60, 0),
          vx: rnd(-1, 1),
          vy: rnd(1, 3),
          gr: 0.03,
          r: rnd(2, 4),
          life: ri(80, 160),
          col: choice(['#3df5e0', '#ff3b77', '#ffd23f', '#5dff8f', '#48a9ff'] as const),
        });
      }
    },
  };

  function elCenter(el: Element) {
    const s = $('#screen').getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2 - s.left, y: r.top + r.height / 2 - s.top };
  }

  function floatText(x: number, y: number, txt: string, cls = '') {
    const d = document.createElement('div');
    d.className = 'floater ' + cls;
    d.textContent = txt;
    d.style.left = x + 'px';
    d.style.top = y + 'px';
    $('#screen').appendChild(d);
    setTimeout(() => d.remove(), 950);
  }

  function popEl(el: Element, cls = 'pop') {
    el.classList.remove(cls);
    if (el instanceof HTMLElement) void el.offsetWidth;
    el.classList.add(cls);
  }

  function shake(n = 1) {
    const c = $('#cabinet');
    ['shake1', 'shake2', 'shake3'].forEach((k) => c.classList.remove(k));
    void c.offsetWidth;
    c.classList.add('shake' + Math.min(3, Math.max(1, n)));
  }

  function flash(col = 'rgba(255,255,255,.5)') {
    const f = $('#flash');
    f.style.background = col;
    popEl(f, 'on');
  }

  function glitchFx() {
    popEl($('#screen'), 'glitch');
  }

  function animateNumber(el: Element, from: number, to: number, dur = 500, tick = false) {
    return new Promise<void>((resolve) => {
      const t0 = performance.now();
      let lastTick = 0;
      const step = (t: number) => {
        const k = Math.min(1, (t - t0) / dur);
        const e = 1 - Math.pow(1 - k, 3);
        el.textContent = fmt(Math.floor(from + (to - from) * e));
        if (tick && t - lastTick > 45 && k < 1) {
          lastTick = t;
          SFX.tick(Math.floor(k * 14));
        }
        if (k < 1) {
          requestAnimationFrame(step);
        } else {
          el.textContent = fmt(to);
          resolve();
        }
      };
      requestAnimationFrame(step);
    });
  }

  return { FX, elCenter, floatText, popEl, shake, flash, glitchFx, animateNumber };
}
