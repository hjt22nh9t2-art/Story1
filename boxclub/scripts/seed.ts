/**
 * Legt die Startwelt an: npm run seed            (nur wenn noch nichts existiert)
 *                        npm run seed -- --reset (ALLES zurücksetzen!)
 */
import fs from 'node:fs';
import path from 'node:path';
import * as store from '../src/lib/store';
import { characters, club, locations } from '../src/seed/world';
import { episode1 } from '../src/seed/episode1';
import { EpisodeSchema } from '../src/lib/types';
import { ensureLibrary } from '../src/lib/audio/synth';

const reset = process.argv.includes('--reset');
if (store.isSeeded() && !reset) {
  console.log('Seriengedächtnis existiert bereits (data/). Zum Zurücksetzen: npm run seed -- --reset');
  process.exit(0);
}
if (reset) {
  for (const d of ['episodes', 'snapshots', 'renders']) fs.rmSync(path.join(store.DATA_DIR, d), { recursive: true, force: true });
  for (const f of ['club.json', 'characters.json', 'locations.json']) fs.rmSync(path.join(store.DATA_DIR, f), { force: true });
}
store.saveClub(club);
store.saveCharacters(characters);
store.saveLocations(locations);
store.saveSnapshot(0);
// Pilotfolge übernehmen – vorhandene Sprachaufnahmen (vorproduziert) werden eingebunden
const ep = EpisodeSchema.parse(structuredClone(episode1));
for (const s of ep.scenes) for (const l of s.lines) {
  const rel = `episodes/${ep.id}/voice/${l.id}.mp3`;
  const abs = path.join(store.MEDIA_DIR, rel);
  if (fs.existsSync(abs)) {
    const { probeDuration } = await import('../src/lib/providers/tts');
    l.audio = { file: rel, durationSec: probeDuration(abs), provider: 'elevenlabs (vorproduziert)' };
  }
}
if (ep.scenes.every((s) => s.lines.every((l) => l.audio))) ep.status = 'vertont';
store.saveEpisode(ep);
ensureLibrary(store.MEDIA_DIR);
console.log(`Startwelt angelegt: ${characters.length} Figuren, ${locations.length} Schauplätze, Folge 1 als ${ep.status}.`);
