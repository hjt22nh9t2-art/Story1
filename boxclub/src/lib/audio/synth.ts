/**
 * Prozedurale Audioerzeugung (ohne externe Dienste):
 *  - Musik-Loops für 5 Stimmungen
 *  - 13 Soundeffekte
 *  - Demo-„Brabbelstimmen“ pro Figur, falls keine Text-to-Speech konfiguriert ist
 * Alles deterministisch, damit Renderings reproduzierbar sind.
 */
import fs from 'node:fs';
import path from 'node:path';

export const SR = 44100;
type Buf = Float32Array;

/* --------------------------------------------------------------- Werkzeuge */

let seed = 1;
const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const noise = () => rand() * 2 - 1;
const sec = (s: number) => Math.round(s * SR);
const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

function writeWav(file: string, l: Buf, r?: Buf) {
  const ch = r ? 2 : 1;
  const n = l.length;
  const buf = Buffer.alloc(44 + n * 2 * ch);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 2 * ch, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(ch, 22);
  buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 2 * ch, 28); buf.writeUInt16LE(2 * ch, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(n * 2 * ch, 40);
  let o = 44;
  for (let i = 0; i < n; i++) {
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, l[i])) * 32767), o); o += 2;
    if (r) { buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, r[i])) * 32767), o); o += 2; }
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, buf);
}

function normalize(b: Buf, peak = 0.7) {
  let m = 0;
  for (const v of b) m = Math.max(m, Math.abs(v));
  if (m > 0) for (let i = 0; i < b.length; i++) b[i] *= peak / m;
  return b;
}

function lowpass(b: Buf, cutoff: number) {
  const a = 1 - Math.exp((-2 * Math.PI * cutoff) / SR);
  let y = 0;
  for (let i = 0; i < b.length; i++) { y += a * (b[i] - y); b[i] = y; }
  return b;
}
function highpass(b: Buf, cutoff: number) {
  const a = 1 - Math.exp((-2 * Math.PI * cutoff) / SR);
  let y = 0;
  for (let i = 0; i < b.length; i++) { y += a * (b[i] - y); b[i] = b[i] - y; }
  return b;
}

/** Fügt `src` in `dst` ab Sample `at` ein (mit Umbruch für nahtlose Loops). */
function mixIn(dst: Buf, src: Buf, at: number, gain = 1, wrap = false) {
  for (let i = 0; i < src.length; i++) {
    let j = at + i;
    if (j >= dst.length) { if (!wrap) break; j %= dst.length; }
    dst[j] += src[i] * gain;
  }
}

function env(n: number, a: number, d: number, sustain = 0, rel = 0): Buf {
  const out = new Float32Array(n);
  const A = sec(a), D = sec(d), R = sec(rel);
  for (let i = 0; i < n; i++) {
    let v: number;
    if (i < A) v = i / Math.max(1, A);
    else if (i < A + D) v = 1 - (1 - sustain) * ((i - A) / Math.max(1, D));
    else v = sustain;
    if (R > 0 && i > n - R) v *= (n - i) / R;
    out[i] = v;
  }
  return out;
}

function osc(type: 'sin' | 'saw' | 'sq' | 'tri', freq: number | ((t: number) => number), dur: number, amp = 1): Buf {
  const n = sec(dur);
  const out = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const f = typeof freq === 'function' ? freq(i / SR) : freq;
    ph += f / SR; ph -= Math.floor(ph);
    let v = 0;
    if (type === 'sin') v = Math.sin(2 * Math.PI * ph);
    else if (type === 'saw') v = 2 * ph - 1;
    else if (type === 'sq') v = ph < 0.5 ? 1 : -1;
    else v = 1 - 4 * Math.abs(ph - 0.5);
    out[i] = v * amp;
  }
  return out;
}
const mul = (a: Buf, b: Buf) => { for (let i = 0; i < a.length; i++) a[i] *= b[i] ?? 0; return a; };
const add = (...bs: Buf[]) => { const n = Math.max(...bs.map((b) => b.length)); const o = new Float32Array(n); for (const b of bs) for (let i = 0; i < b.length; i++) o[i] += b[i]; return o; };

/* --------------------------------------------------------------- Instrumente */

const kick = () => mul(osc('sin', (t) => 50 + 120 * Math.exp(-t * 30), 0.35), env(sec(0.35), 0.002, 0.33));
const snare = () => { const n = sec(0.22); const b = new Float32Array(n); for (let i = 0; i < n; i++) b[i] = noise() * 0.7; highpass(b, 900); return mul(add(b, osc('tri', 190, 0.22, 0.4)), env(n, 0.001, 0.2)); };
const hat = (len = 0.05) => { const n = sec(len); const b = new Float32Array(n); for (let i = 0; i < n; i++) b[i] = noise(); highpass(b, 6000); return mul(b, env(n, 0.001, len)); };
const clap = () => { const n = sec(0.18); const b = new Float32Array(n); for (let i = 0; i < n; i++) b[i] = noise() * (i % sec(0.012) < sec(0.004) || i > sec(0.03) ? 1 : 0.2); highpass(b, 1200); lowpass(b, 5000); return mul(b, env(n, 0.001, 0.17)); };
const bass = (m: number, d: number, type: 'saw' | 'sq' | 'sin' = 'saw') => lowpass(mul(osc(type, mtof(m), d, 0.8), env(sec(d), 0.005, d * 0.8, 0.3, 0.03)), 600);
const pluck = (m: number, d: number) => lowpass(mul(add(osc('saw', mtof(m), d, 0.4), osc('sq', mtof(m) * 1.003, d, 0.25)), env(sec(d), 0.003, 0.25, 0.0)), 2600);
const pad = (ms: number[], d: number) => lowpass(mul(add(...ms.map((m, i) => add(osc('saw', mtof(m) * (1 + i * 0.0015), d, 0.18), osc('saw', mtof(m) * 0.997, d, 0.18)))), env(sec(d), 0.4, 0.1, 0.9, 0.5)), 1400);
const keys = (ms: number[], d: number) => add(...ms.map((m) => mul(add(osc('sin', mtof(m), d, 0.35), osc('sin', mtof(m) * 2, d, 0.12), osc('sin', mtof(m) * 3, d, 0.05)), env(sec(d), 0.004, d * 0.95, 0))));
const stab = (ms: number[], d: number) => lowpass(add(...ms.map((m) => mul(add(osc('saw', mtof(m), d, 0.3), osc('saw', mtof(m) * 1.006, d, 0.3)), env(sec(d), 0.01, d * 0.7, 0.2, 0.05)))), 3000);
const pizz = (m: number, d = 0.18) => lowpass(mul(osc('tri', mtof(m), d, 0.9), env(sec(d), 0.002, d * 0.9)), 1800);
const timp = (m: number) => lowpass(mul(osc('sin', (t) => mtof(m) * (1 + 0.05 * Math.exp(-t * 8)), 1.2, 1), env(sec(1.2), 0.003, 1.15)), 400);

/* --------------------------------------------------------------- Musik */

interface Track { bpm: number; bars: number; build: (out: Buf, beat: number) => void }

const TRACKS: Record<string, Track> = {
  aufbruch: {
    bpm: 94, bars: 4,
    build: (o, b) => {
      const prog = [[48, 51, 55], [44, 48, 51], [51, 55, 58], [46, 50, 53]]; // Cm Ab Eb Bb
      for (let bar = 0; bar < 4; bar++) {
        const t0 = bar * 4;
        for (const k of [0, 1.75, 2.5]) mixIn(o, kick(), sec((t0 + k) * b), 0.9);
        for (const s of [1, 3]) mixIn(o, snare(), sec((t0 + s) * b), 0.6);
        for (let h = 0; h < 8; h++) mixIn(o, hat(h % 2 ? 0.03 : 0.06), sec((t0 + h / 2) * b), h % 2 ? 0.15 : 0.25);
        const ch = prog[bar];
        mixIn(o, bass(ch[0] - 12, b * 1.4), sec(t0 * b), 0.55);
        mixIn(o, bass(ch[0] - 12, b * 0.4), sec((t0 + 1.75) * b), 0.45);
        mixIn(o, bass(ch[2] - 12, b * 0.9), sec((t0 + 2.5) * b), 0.45);
        for (const [i, k] of [0.5, 1.5, 2, 3.5].entries()) mixIn(o, pluck(ch[i % 3] + 12, 0.3), sec((t0 + k) * b), 0.22);
      }
    },
  },
  spannung: {
    bpm: 84, bars: 4,
    build: (o, b) => {
      for (let bar = 0; bar < 4; bar++) {
        const t0 = bar * 4;
        mixIn(o, pad(bar % 2 ? [49, 52, 56] : [48, 51, 55], b * 4.2), sec(t0 * b), 0.35);
        for (let e = 0; e < 8; e++) mixIn(o, bass(36 + (bar === 3 && e > 5 ? 1 : 0), b * 0.42, 'sq'), sec((t0 + e / 2) * b), 0.32);
        for (let h = 0; h < 16; h++) mixIn(o, hat(0.025), sec((t0 + h / 4) * b), h % 4 === 0 ? 0.18 : 0.07);
        if (bar % 2 === 1) mixIn(o, timp(36), sec((t0 + 3) * b), 0.5);
        mixIn(o, kick(), sec(t0 * b), 0.6);
      }
    },
  },
  gefuehl: {
    bpm: 72, bars: 4,
    build: (o, b) => {
      const prog = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]; // Am F C G
      for (let bar = 0; bar < 4; bar++) {
        const t0 = bar * 4, ch = prog[bar];
        mixIn(o, keys([ch[0] - 12], b * 4), sec(t0 * b), 0.5);
        for (let k = 0; k < 4; k++) mixIn(o, keys([ch[k % 3] + (k === 3 ? 12 : 0)], b * 1.6), sec((t0 + k) * b), 0.3);
        mixIn(o, pad(ch, b * 4.2), sec(t0 * b), 0.12);
      }
    },
  },
  training: {
    bpm: 122, bars: 4,
    build: (o, b) => {
      const prog = [[45, 48, 52], [45, 48, 52], [41, 45, 48], [43, 47, 50]];
      for (let bar = 0; bar < 4; bar++) {
        const t0 = bar * 4, ch = prog[bar];
        for (let k = 0; k < 4; k++) mixIn(o, kick(), sec((t0 + k) * b), 0.9);
        for (const s of [1, 3]) mixIn(o, clap(), sec((t0 + s) * b), 0.45);
        for (let h = 0; h < 8; h++) mixIn(o, hat(0.04), sec((t0 + h / 2 + 0.5 * (h % 2 ? 0 : 0)) * b), h % 2 ? 0.25 : 0.1);
        for (let s = 0; s < 16; s++) mixIn(o, bass(ch[0] - 12 + (s % 4 === 3 ? 12 : 0), b * 0.22), sec((t0 + s / 4) * b), 0.35);
        mixIn(o, stab(ch.map((m) => m + 12), b * 0.5), sec((t0 + (bar % 2 ? 1.5 : 0)) * b), 0.25);
      }
    },
  },
  komisch: {
    bpm: 112, bars: 4,
    build: (o, b) => {
      const line = [48, 55, 52, 55, 50, 55, 53, 55, 48, 55, 52, 55, 47, 50, 53, 55];
      for (let bar = 0; bar < 4; bar++) {
        const t0 = bar * 4;
        for (let k = 0; k < 4; k++) mixIn(o, pizz(line[(bar * 4 + k) % 16] - 12, 0.22), sec((t0 + k) * b), 0.7);
        for (let k = 0; k < 4; k++) mixIn(o, pizz(line[(bar * 4 + k + 2) % 16] + 12, 0.1), sec((t0 + k + 0.5) * b), 0.35);
        mixIn(o, hat(0.03), sec((t0 + 1) * b), 0.2); mixIn(o, hat(0.03), sec((t0 + 3) * b), 0.2);
        if (bar === 3) mixIn(o, pizz(72, 0.12), sec((t0 + 3.5) * b), 0.5);
      }
    },
  },
};

function renderTrack(name: string) {
  seed = 7 + name.length;
  const t = TRACKS[name];
  const b = 60 / t.bpm;
  const n = sec(t.bars * 4 * b);
  const out = new Float32Array(n);
  // in einen längeren Puffer rendern, Überhang an den Anfang falten (nahtlose Loops)
  const tmp = new Float32Array(n + sec(3));
  t.build(tmp, b);
  for (let i = 0; i < tmp.length; i++) out[i % n] += tmp[i];
  const l = normalize(out, 0.8);
  // etwas Stereo-Breite über ein leicht verzögertes Signal
  const r = new Float32Array(n);
  const d = sec(0.011);
  for (let i = 0; i < n; i++) r[i] = l[(i + n - d) % n] * 0.85 + l[i] * 0.15;
  return { l, r };
}

/* --------------------------------------------------------------- Geräusche */

const SFX: Record<string, () => Buf> = {
  glocke: () => {
    const d = 2.6;
    return normalize(add(...[[1, 1], [2.76, 0.6], [5.4, 0.35], [8.93, 0.2]].map(([k, a]) => mul(osc('sin', 820 * k, d, a), env(sec(d), 0.002, d / (k * 0.6 + 0.4)))), mul(osc('sin', 1640, 0.05, 0.6), env(sec(0.05), 0.001, 0.05))), 0.8);
  },
  schlag: () => { const n = sec(0.3); const b = new Float32Array(n); for (let i = 0; i < n; i++) b[i] = noise(); lowpass(b, 1800); return normalize(add(mul(b, env(n, 0.001, 0.12)), mul(osc('sin', (t) => 90 * Math.exp(-t * 10) + 40, 0.3), env(n, 0.001, 0.28))), 0.85); },
  sandsack: () => { const n = sec(0.45); const b = new Float32Array(n); for (let i = 0; i < n; i++) b[i] = noise(); lowpass(b, 500); return normalize(add(mul(b, env(n, 0.002, 0.3)), mul(osc('sin', (t) => 70 * Math.exp(-t * 6) + 35, 0.45), env(n, 0.002, 0.4))), 0.85); },
  tuer: () => {
    const creak = mul(osc('saw', (t) => 180 + 60 * Math.sin(t * 23) + 40 * t, 0.7, 0.3), env(sec(0.7), 0.1, 0.5, 0.3, 0.1));
    lowpass(creak, 1500);
    const slam = SFX.sandsack();
    const o = new Float32Array(sec(1.2)); mixIn(o, creak, 0); mixIn(o, slam, sec(0.75), 0.9);
    return normalize(o, 0.75);
  },
  kasse: () => { const o = new Float32Array(sec(1.4)); for (let i = 0; i < 6; i++) { const n = sec(0.03); const b = new Float32Array(n); for (let k = 0; k < n; k++) b[k] = noise(); highpass(b, 2000); mixIn(o, mul(b, env(n, 0.001, 0.03)), sec(i * 0.045), 0.5); } mixIn(o, add(mul(osc('sin', 2093, 1.1, 0.6), env(sec(1.1), 0.001, 1.0)), mul(osc('sin', 4186, 0.6, 0.2), env(sec(0.6), 0.001, 0.5))), sec(0.3)); return normalize(o, 0.75); },
  muenzen: () => { const o = new Float32Array(sec(0.9)); for (let i = 0; i < 9; i++) { const f = 3000 + rand() * 3000; mixIn(o, mul(osc('sin', f, 0.25, 0.5), env(sec(0.25), 0.001, 0.2)), sec(rand() * 0.6)); } return normalize(o, 0.6); },
  whoosh: () => { const n = sec(0.45); const b = new Float32Array(n); for (let i = 0; i < n; i++) b[i] = noise(); const o = new Float32Array(n); let y = 0; for (let i = 0; i < n; i++) { const t = i / n; const a = 1 - Math.exp((-2 * Math.PI * (300 + 4000 * Math.sin(Math.PI * t))) / SR); y += a * (b[i] - y); o[i] = y * Math.sin(Math.PI * t); } return normalize(o, 0.6); },
  publikum: () => { const n = sec(3); const o = new Float32Array(n); for (let v = 0; v < 6; v++) { const b = new Float32Array(n); for (let i = 0; i < n; i++) b[i] = noise(); lowpass(b, 600 + v * 250); highpass(b, 200 + v * 80); mixIn(o, b, 0, 0.5); } return normalize(mul(o, env(n, 0.3, 0.2, 0.9, 1.2)), 0.6); },
  pfiff: () => normalize(mul(osc('sin', (t) => 2600 + 180 * Math.sin(t * 2 * Math.PI * 28), 0.6, 1), env(sec(0.6), 0.01, 0.05, 0.9, 0.1)), 0.55),
  telefon: () => { const o = new Float32Array(sec(1.6)); for (let r = 0; r < 2; r++) mixIn(o, mul(add(osc('sin', 440, 0.6, 0.5), osc('sin', 480, 0.6, 0.5)), mul(osc('sq', 20, 0.6, 0.5), env(sec(0.6), 0.01, 0.1, 1))), sec(r * 0.8)); return normalize(o, 0.6); },
  kratzer: () => normalize(lowpass(mul(osc('saw', (t) => 900 * (1 - Math.sin(Math.PI * Math.min(1, t / 0.35))) + 120, 0.45, 1), env(sec(0.45), 0.005, 0.4)), 3000), 0.7),
  trommelwirbel: () => { const o = new Float32Array(sec(1.6)); for (let i = 0; i < 40; i++) mixIn(o, snare(), sec(i * 0.035), 0.2 + (i / 40) * 0.6); mixIn(o, SFX.schlag(), sec(1.4), 0.8); return normalize(o, 0.75); },
  stempel: () => { const n = sec(0.25); return normalize(mul(add(osc('sin', (t) => 140 * Math.exp(-t * 20) + 50, 0.25), lowpass(Float32Array.from({ length: n }, () => noise()), 1200)), env(n, 0.001, 0.2)), 0.8); },
};

/* --------------------------------------------------------------- Brabbelstimme */

/** Erzeugt eine sprachähnliche Silbenfolge in der Tonlage der Figur (Demo ohne TTS). */
export function babble(durationSec: number, pitch: number, seedNum: number): Buf {
  seed = 1000 + seedNum;
  const n = sec(durationSec);
  const o = new Float32Array(n);
  let t = 0;
  const base = 150 * pitch;
  while (t < durationSec - 0.12) {
    const d = 0.08 + rand() * 0.11;
    const f0 = base * (0.9 + rand() * 0.3);
    const formant = [500, 700, 900, 1200, 400][Math.floor(rand() * 5)] * (0.9 + 0.2 * pitch);
    const syl = mul(add(osc('saw', (x) => f0 * (1 - x * 0.6), d, 0.4), osc('sin', formant, d, 0.25)), env(sec(d), 0.01, d * 0.7, 0.2, 0.02));
    lowpass(syl, 1800 + formant);
    mixIn(o, syl, sec(t));
    t += d + (rand() < 0.15 ? 0.09 : 0.02);
  }
  return normalize(o, 0.5);
}

/* --------------------------------------------------------------- Öffentliche API */

export const MUSIC_MOODS = Object.keys(TRACKS);
export const SFX_NAMES = Object.keys(SFX);

/** Legt fehlende Musik- und Geräuschdateien unter mediaDir/audio an. */
export function ensureLibrary(mediaDir: string) {
  for (const m of MUSIC_MOODS) {
    const f = path.join(mediaDir, 'audio', 'music', `${m}.wav`);
    if (!fs.existsSync(f)) { const { l, r } = renderTrack(m); writeWav(f, l, r); }
  }
  for (const s of SFX_NAMES) {
    const f = path.join(mediaDir, 'audio', 'sfx', `${s}.wav`);
    if (!fs.existsSync(f)) { seed = 99 + s.length; writeWav(f, SFX[s]()); }
  }
}

export function ensureBabble(mediaDir: string, speaker: string, durationSec: number, pitch: number) {
  const rel = `audio/babble/${speaker}-${Math.round(durationSec * 10)}.wav`;
  const f = path.join(mediaDir, rel);
  if (!fs.existsSync(f)) writeWav(f, babble(durationSec, pitch, speaker.length * 31 + Math.round(durationSec * 10)));
  return rel;
}
