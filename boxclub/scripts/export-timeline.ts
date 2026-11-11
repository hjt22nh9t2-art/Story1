/**
 * Exportiert die Zeitachse einer Folge als JSON für den Audio-Mischer.
 *   npx tsx scripts/export-timeline.ts ep-003  → data/renders/ep-003-timeline.json
 */
import fs from 'node:fs';
import path from 'node:path';
import * as store from '../src/lib/store';
import { prepareAudio } from '../src/lib/service';
import { buildTimeline, estimateLineSec } from '../src/lib/timeline';

export function exportTimeline(id: string) {
  const ep = store.getEpisode(id);
  if (!ep) throw new Error(`Folge ${id} nicht gefunden`);
  prepareAudio(ep);
  const tl = buildTimeline(ep);
  const lines = tl.lines.map((l) => ({
    id: l.line.id, speaker: l.line.speaker, start: l.start, end: l.end, sfx: l.line.sfx,
    file: l.line.audio ? path.join(store.MEDIA_DIR, l.line.audio.file) : path.join(store.MEDIA_DIR, `audio/babble/${l.line.speaker}-${Math.round(estimateLineSec(l.line.text) * 10)}.wav`),
    real: !!l.line.audio,
  }));
  const events: { name: string; t: number; reason: string }[] = [];
  for (const l of tl.lines) if (l.line.sfx) events.push({ name: l.line.sfx, t: Math.max(0, l.start - 0.13), reason: `Zeile ${l.line.id}` });
  tl.scenes.forEach((s, i) => {
    if (i > 0) events.push({ name: 'whoosh', t: Math.max(0, s.start - 0.1), reason: `Schnitt zu ${s.scene.id}` });
    for (const p of s.scene.props ?? []) {
      if (p.hitAt !== null && p.hitAt !== undefined) events.push({ name: 'schlag', t: s.start + p.hitAt, reason: `Treffer Sandsack ${s.scene.id}` });
      if (p.fallAt !== null && p.fallAt !== undefined) {
        events.push({ name: 'quietschen', t: s.start + Math.max(0, p.fallAt - 0.35), reason: `Kette reißt ${s.scene.id}` });
        events.push({ name: 'krach', t: s.start + p.fallAt + 0.36, reason: `Aufprall Sandsack ${s.scene.id}` });
      }
    }
  });
  const out = {
    id, totalSec: tl.totalSec, endCardStart: tl.endCardStart,
    scenes: tl.scenes.map((s) => ({ id: s.scene.id, start: s.start, end: s.end, music: s.scene.music, location: s.scene.location })),
    lines, events: events.sort((a, b) => a.t - b.t),
    musicDir: path.join(store.MEDIA_DIR, 'audio/music'), sfxDir: path.join(store.MEDIA_DIR, 'audio/sfx'),
  };
  const f = path.join(store.DATA_DIR, 'renders', `${id}-timeline.json`);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, JSON.stringify(out, null, 1));
  return f;
}

if (process.argv[1]?.endsWith('export-timeline.ts')) console.log(exportTimeline(process.argv[2]));
