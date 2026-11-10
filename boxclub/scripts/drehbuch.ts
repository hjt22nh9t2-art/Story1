/**
 * Speichert ein handgeschriebenes Drehbuch als Folge (behält vorhandene Sprachaufnahmen,
 * wenn sich der Text einer Zeile nicht geändert hat).
 *   npx tsx scripts/drehbuch.ts folge-002
 */
import fs from 'node:fs';
import path from 'node:path';
import * as store from '../src/lib/store';
import { EpisodeSchema } from '../src/lib/types';
import { probeDuration } from '../src/lib/providers/tts';

const mod = await import(`../src/drehbuecher/${process.argv[2]}.ts`);
const ep = EpisodeSchema.parse(mod.episode);
const old = store.getEpisode(ep.id);
const oldLines = new Map((old?.scenes ?? []).flatMap((s) => s.lines).map((l) => [l.id, l]));
for (const s of ep.scenes) for (const l of s.lines) {
  const o = oldLines.get(l.id);
  const rel = `episodes/${ep.id}/voice/${l.id}.mp3`;
  if (o?.audio && o.text === l.text) l.audio = o.audio;
  else if (fs.existsSync(path.join(store.MEDIA_DIR, rel))) l.audio = { file: rel, durationSec: probeDuration(path.join(store.MEDIA_DIR, rel)), provider: 'elevenlabs (eleven_v3)' };
}
if (old) { ep.createdAt = old.createdAt; ep.video = old.video; }
if (ep.scenes.every((s) => s.lines.every((l) => l.audio))) ep.status = ep.video ? 'gerendert' : 'vertont';
store.saveEpisode(ep);
fs.writeFileSync(path.join(store.DATA_DIR, 'episodes', `${ep.id}.tts.json`), JSON.stringify(mod.TTS ?? {}, null, 2));
console.log(`${ep.id} gespeichert (${ep.status}), ${ep.scenes.flatMap((s) => s.lines).filter((l) => l.audio).length} Zeilen mit Ton.`);
