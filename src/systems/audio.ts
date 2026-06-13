import type { NoiseOptions, SfxApi, SoundApi, ToneOptions } from '../types';

type AudioContextConstructor = new () => AudioContext;
type BrowserWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: AudioContextConstructor;
  };

interface SoundEngine extends SoundApi {
  out: GainNode | null;
  noiseBuf: AudioBuffer | null;
  distCurve: Float32Array<ArrayBuffer> | null;
}

export const Snd: SoundEngine = {
  ctx: null,
  out: null,
  noiseBuf: null,
  distCurve: null,
  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || (window as BrowserWindow).webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    const comp = this.ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 6;
    this.out = this.ctx.createGain();
    this.out.gain.value = 0.55;
    this.out.connect(comp);
    comp.connect(this.ctx.destination);

    const len = this.ctx.sampleRate;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noiseBuf = buf;

    const c = new Float32Array(256);
    for (let i = 0; i < 256; i++) c[i] = Math.tanh(2.5 * (i / 128 - 1));
    this.distCurve = c;
  },
  t() {
    return this.ctx ? this.ctx.currentTime : 0;
  },
  tone(options: ToneOptions = {}) {
    if (!this.ctx || !this.out) return;
    const { f = 440, f2 = null, type = 'square', dur = 0.1, vol = 0.2, at = 0 } = options;
    const t0 = this.t() + at;
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(f, t0);
    if (f2 != null) osc.frequency.exponentialRampToValueAtTime(Math.max(f2, 1), t0 + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(this.out);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  },
  noise(options: NoiseOptions = {}) {
    if (!this.ctx || !this.out || !this.noiseBuf) return;
    const {
      dur = 0.1,
      vol = 0.2,
      at = 0,
      ftype = 'bandpass',
      f = 2000,
      f2 = null,
      q = 1,
    } = options;
    const t0 = this.t() + at;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const fl = this.ctx.createBiquadFilter();
    fl.type = ftype;
    fl.Q.value = q;
    fl.frequency.setValueAtTime(f, t0);
    if (f2 != null) fl.frequency.exponentialRampToValueAtTime(Math.max(f2, 1), t0 + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(fl);
    fl.connect(g);
    g.connect(this.out);
    src.start(t0);
    src.stop(t0 + dur + 0.05);
  },
  joker(n = 0) {
    if (!this.ctx || !this.out || !this.distCurve) return;
    const t0 = this.t();
    const base = 300 * Math.pow(1.1, Math.min(n, 12));
    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(base * 1.7, t0);
    osc.frequency.exponentialRampToValueAtTime(base * 0.55, t0 + 0.22);
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 22;
    const lg = this.ctx.createGain();
    lg.gain.value = base * 0.2;
    lfo.connect(lg);
    lg.connect(osc.frequency);
    const sh = this.ctx.createWaveShaper();
    sh.curve = this.distCurve;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(0.2, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.27);
    osc.connect(sh);
    sh.connect(g);
    g.connect(this.out);
    osc.start(t0);
    lfo.start(t0);
    osc.stop(t0 + 0.3);
    lfo.stop(t0 + 0.3);
  },
};

export const SFX: SfxApi = {
  draw(i = 0) {
    Snd.noise({ dur: 0.06, vol: 0.22, f: 1800 + i * 320, f2: 5200, ftype: 'bandpass', q: 0.8 });
  },
  select(on) {
    Snd.tone({ f: on ? 760 : 540, type: 'triangle', dur: 0.05, vol: 0.15 });
    Snd.noise({ dur: 0.025, vol: 0.08, f: 4200 });
  },
  deny() {
    Snd.tone({ f: 120, type: 'square', dur: 0.09, vol: 0.18 });
    Snd.tone({ f: 113, type: 'square', dur: 0.09, vol: 0.18, at: 0.02 });
  },
  play() {
    Snd.tone({ f: 170, f2: 62, type: 'triangle', dur: 0.16, vol: 0.5 });
    Snd.noise({ dur: 0.05, vol: 0.3, f: 900, ftype: 'lowpass' });
  },
  tick(n = 0) {
    Snd.tone({
      f: 640 * Math.pow(1.0594, Math.min(n, 24)),
      type: 'square',
      dur: 0.05,
      vol: 0.16,
    });
  },
  mult() {
    Snd.tone({ f: 200, f2: 860, type: 'sawtooth', dur: 0.3, vol: 0.26 });
    Snd.tone({ f: 204, f2: 876, type: 'sawtooth', dur: 0.3, vol: 0.18 });
    Snd.tone({ f: 1720, type: 'sine', dur: 0.12, vol: 0.16, at: 0.26 });
  },
  bigmult() {
    SFX.mult();
    Snd.tone({ f: 60, f2: 30, type: 'sine', dur: 0.4, vol: 0.5 });
    Snd.noise({ dur: 0.3, vol: 0.18, f: 300, f2: 80, ftype: 'lowpass' });
  },
  joker(n) {
    Snd.joker(n);
  },
  coin() {
    Snd.tone({ f: 1568, type: 'square', dur: 0.07, vol: 0.14 });
    Snd.tone({ f: 2093, type: 'square', dur: 0.16, vol: 0.14, at: 0.06 });
    Snd.tone({ f: 3136, type: 'sine', dur: 0.2, vol: 0.07, at: 0.06 });
  },
  buy() {
    [392, 523, 659].forEach((f, i) =>
      Snd.tone({ f, type: 'square', dur: 0.08, vol: 0.18, at: i * 0.08 })
    );
    Snd.noise({ dur: 0.12, vol: 0.25, f: 500, f2: 120, ftype: 'lowpass', at: 0.24 });
    Snd.tone({ f: 110, type: 'triangle', dur: 0.12, vol: 0.3, at: 0.24 });
  },
  discard() {
    Snd.noise({ dur: 0.16, vol: 0.25, f: 4200, f2: 600, ftype: 'bandpass' });
  },
  lose() {
    Snd.tone({ f: 220, f2: 34, type: 'sawtooth', dur: 1.0, vol: 0.32 });
    Snd.tone({ f: 110, f2: 28, type: 'triangle', dur: 1.1, vol: 0.32, at: 0.05 });
    Snd.noise({ dur: 0.9, vol: 0.12, f: 1200, f2: 90, ftype: 'lowpass' });
  },
  win() {
    const mel = [523, 659, 784, 1047, 784, 1047, 1319, 1568];
    mel.forEach((f, i) => {
      Snd.tone({ f, type: 'square', dur: 0.1, vol: 0.15, at: i * 0.085 });
      Snd.tone({ f: f / 2, type: 'triangle', dur: 0.12, vol: 0.11, at: i * 0.085 });
    });
  },
  settle() {
    Snd.tone({ f: 90, f2: 45, type: 'sine', dur: 0.25, vol: 0.5 });
    Snd.noise({ dur: 0.18, vol: 0.26, f: 2500, f2: 300 });
  },
  event(kind) {
    if (kind === 'good') {
      [660, 880, 1320].forEach((f, i) =>
        Snd.tone({ f, type: 'triangle', dur: 0.09, vol: 0.16, at: i * 0.07 })
      );
    } else if (kind === 'bad') {
      Snd.tone({ f: 320, f2: 70, type: 'sawtooth', dur: 0.34, vol: 0.24 });
      Snd.tone({ f: 327, f2: 74, type: 'sawtooth', dur: 0.34, vol: 0.16, at: 0.02 });
      Snd.noise({ dur: 0.2, vol: 0.14, f: 800, f2: 120, ftype: 'lowpass' });
    } else {
      Snd.tone({ f: 520, f2: 980, type: 'square', dur: 0.1, vol: 0.14 });
      Snd.tone({ f: 980, f2: 360, type: 'square', dur: 0.14, vol: 0.14, at: 0.09 });
      Snd.noise({ dur: 0.12, vol: 0.1, f: 3000, f2: 600 });
    }
  },
  gild() {
    Snd.tone({ f: 2093, type: 'sine', dur: 0.09, vol: 0.13 });
    Snd.tone({ f: 2637, type: 'sine', dur: 0.16, vol: 0.11, at: 0.05 });
  },
  crack() {
    Snd.noise({ dur: 0.12, vol: 0.32, f: 5200, f2: 900, ftype: 'bandpass', q: 0.6 });
    Snd.tone({ f: 140, f2: 50, type: 'triangle', dur: 0.14, vol: 0.3 });
  },
  echo(n = 0) {
    const f = 900 * Math.pow(1.0594, Math.min(n, 18));
    Snd.tone({ f, type: 'square', dur: 0.06, vol: 0.15 });
    Snd.tone({ f, type: 'square', dur: 0.06, vol: 0.08, at: 0.11 });
  },
  taint() {
    Snd.tone({ f: 420, f2: 180, type: 'sawtooth', dur: 0.18, vol: 0.14 });
    Snd.tone({ f: 433, f2: 170, type: 'sawtooth', dur: 0.18, vol: 0.1, at: 0.01 });
  },
  shatter() {
    Snd.noise({ dur: 0.28, vol: 0.3, f: 6400, f2: 700, ftype: 'bandpass', q: 0.5 });
    Snd.tone({ f: 1800, f2: 220, type: 'square', dur: 0.3, vol: 0.14 });
    Snd.tone({ f: 90, f2: 40, type: 'sine', dur: 0.3, vol: 0.34 });
  },
  breakthrough() {
    Snd.tone({ f: 220, f2: 1760, type: 'sawtooth', dur: 0.4, vol: 0.2 });
    Snd.tone({ f: 110, f2: 880, type: 'square', dur: 0.4, vol: 0.14, at: 0.04 });
    Snd.noise({ dur: 0.32, vol: 0.12, f: 600, f2: 6000 });
  },
  overkill() {
    [261, 392, 523, 784, 1047].forEach((f, i) => {
      Snd.tone({ f, type: 'square', dur: 0.5, vol: 0.12, at: i * 0.03 });
      Snd.tone({ f: f * 1.01, type: 'sawtooth', dur: 0.4, vol: 0.07, at: i * 0.03 });
    });
    Snd.tone({ f: 55, f2: 28, type: 'sine', dur: 0.6, vol: 0.5 });
  },
  edge() {
    Snd.tone({ f: 880, type: 'sine', dur: 0.3, vol: 0.16 });
    Snd.tone({ f: 92, f2: 60, type: 'triangle', dur: 0.4, vol: 0.3, at: 0.05 });
    Snd.noise({ dur: 0.4, vol: 0.08, f: 1400, f2: 200, ftype: 'lowpass' });
  },
};
