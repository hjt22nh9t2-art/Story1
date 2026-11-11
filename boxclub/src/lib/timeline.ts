/**
 * Zeitplanung einer Folge. Wird identisch im Browser-Player und im Renderer
 * verwendet, damit Vorschau und fertiges MP4 exakt übereinstimmen.
 */
import type { Episode, Line, Scene } from './types';

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;
/** Haltezeit für die Entscheidungstafel am Ende */
export const END_CARD_SEC = 3.2;
export const SCENE_GAP_SEC = 0.08;

export function estimateLineSec(text: string): number {
  const words = text.trim().split(/\s+/).length;
  const pauses = (text.match(/[.,;:!?…–-]/g) || []).length;
  return Math.max(1.1, words * 0.37 + pauses * 0.12 + 0.2);
}

export function lineDuration(l: Line): number {
  return l.audio?.durationSec ?? estimateLineSec(l.text);
}

export interface TimedLine { line: Line; sceneIndex: number; start: number; end: number; startFrame: number; endFrame: number }
export interface TimedScene { scene: Scene; index: number; start: number; end: number; startFrame: number; durationFrames: number; lines: TimedLine[] }
export interface EpisodeTimeline { scenes: TimedScene[]; lines: TimedLine[]; endCardStart: number; totalSec: number; totalFrames: number }

export function buildTimeline(ep: Pick<Episode, 'scenes'>): EpisodeTimeline {
  let t = 0.35; // kurzer Vorlauf
  const scenes: TimedScene[] = [];
  const all: TimedLine[] = [];
  ep.scenes.forEach((scene, si) => {
    const sStart = si === 0 ? 0 : t;
    const lines: TimedLine[] = [];
    for (const line of scene.lines) {
      t += line.delayBefore ?? 0;
      const d = lineDuration(line);
      const tl: TimedLine = { line, sceneIndex: si, start: t, end: t + d, startFrame: Math.round(t * FPS), endFrame: Math.round((t + d) * FPS) };
      lines.push(tl); all.push(tl);
      t += d + line.pauseAfter;
    }
    t += SCENE_GAP_SEC;
    scenes.push({ scene, index: si, start: sStart, end: t, startFrame: Math.round(sStart * FPS), durationFrames: Math.round((t - sStart) * FPS), lines });
  });
  // Entscheidungstafel erst, wenn die letzte Zeile zu Ende gesprochen ist
  const lastEnd = all.length ? all[all.length - 1].end : t;
  const endCardStart = lastEnd + 0.25;
  const totalSec = endCardStart + END_CARD_SEC;
  // letzte Szene bis zum Ende verlängern
  const last = scenes[scenes.length - 1];
  if (last) { last.end = totalSec; last.durationFrames = Math.round(totalSec * FPS) - last.startFrame; }
  return { scenes, lines: all, endCardStart, totalSec, totalFrames: Math.round(totalSec * FPS) };
}

/** Untertitel-Häppchen (max. 4 Wörter), Zeit anteilig nach Zeichenlänge verteilt. */
export function subtitleChunks(tl: TimedLine, maxWords = 4) {
  const words = tl.line.text.split(/\s+/).filter(Boolean);
  const total = words.reduce((s, w) => s + w.length + 1, 0);
  const dur = tl.end - tl.start;
  let acc = 0;
  const timed = words.map((w) => {
    const s = tl.start + (acc / total) * dur;
    acc += w.length + 1;
    return { word: w, start: s, end: tl.start + (acc / total) * dur };
  });
  const chunks: { words: typeof timed; start: number; end: number }[] = [];
  let cur: typeof timed = [];
  for (const w of timed) {
    cur.push(w);
    const brk = /[.,!?…:–]$/.test(w.word);
    if (cur.length >= maxWords || brk) { chunks.push({ words: cur, start: cur[0].start, end: w.end }); cur = []; }
  }
  if (cur.length) chunks.push({ words: cur, start: cur[0].start, end: cur[cur.length - 1].end });
  return chunks;
}
