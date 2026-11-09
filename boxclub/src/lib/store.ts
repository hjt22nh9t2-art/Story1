/**
 * Seriengedächtnis: persistente JSON-Speicherung unter data/.
 *
 * data/
 *   club.json            – aktueller Vereinsstand (Finanzen, Mitglieder, Ausstattung …)
 *   characters.json      – Charakterdatenbank
 *   locations.json       – Schauplätze
 *   episodes/ep-001.json – jede Folge mit Drehbuch, Entscheidung, Zustandsänderungen
 *   snapshots/           – kompletter Stand nach jeder veröffentlichten Folge (für Rücksprung)
 *   media/               – Stimmen, Musik, Geräusche, Videos, Bilder
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  CharactersSchema, ClubStateSchema, EpisodeSchema, LocationsSchema,
  type Character, type ClubState, type Episode, type Location,
} from './types';

export const ROOT = process.env.BOXCLUB_ROOT || process.cwd();
export const DATA_DIR = process.env.BOXCLUB_DATA || path.join(ROOT, 'data');
export const MEDIA_DIR = path.join(DATA_DIR, 'media');
const EP_DIR = path.join(DATA_DIR, 'episodes');
const SNAP_DIR = path.join(DATA_DIR, 'snapshots');

function ensureDirs() {
  for (const d of [DATA_DIR, MEDIA_DIR, EP_DIR, SNAP_DIR]) fs.mkdirSync(d, { recursive: true });
}

function readJson<T>(file: string, fallback?: T): T {
  if (!fs.existsSync(file)) {
    if (fallback !== undefined) return fallback;
    throw new Error(`Datei fehlt: ${path.relative(ROOT, file)} – bitte zuerst "npm run seed" ausführen.`);
  }
  return JSON.parse(fs.readFileSync(file, 'utf8')) as T;
}

/** Atomisches Schreiben: erst temporäre Datei, dann umbenennen. */
function writeJson(file: string, data: unknown) {
  ensureDirs();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2) + '\n');
  fs.renameSync(tmp, file);
}

export const epId = (n: number) => `ep-${String(n).padStart(3, '0')}`;

/* --------------------------------------------------------------- Lesen */

export function getClub(): ClubState {
  return ClubStateSchema.parse(readJson(path.join(DATA_DIR, 'club.json')));
}
export function getCharacters(): Character[] {
  return CharactersSchema.parse(readJson(path.join(DATA_DIR, 'characters.json')));
}
export function getCharacter(id: string): Character | undefined {
  return getCharacters().find((c) => c.id === id);
}
export function getLocations(): Location[] {
  return LocationsSchema.parse(readJson(path.join(DATA_DIR, 'locations.json')));
}
export function listEpisodes(): Episode[] {
  ensureDirs();
  return fs
    .readdirSync(EP_DIR)
    .filter((f) => /^ep-\d+\.json$/.test(f))
    .map((f) => EpisodeSchema.parse(readJson(path.join(EP_DIR, f))))
    .sort((a, b) => a.number - b.number);
}
export function getEpisode(id: string): Episode | undefined {
  const f = path.join(EP_DIR, `${id}.json`);
  if (!/^ep-\d+$/.test(id) || !fs.existsSync(f)) return undefined;
  return EpisodeSchema.parse(readJson(f));
}

/* ------------------------------------------------------------ Schreiben */

export function saveClub(c: ClubState) { writeJson(path.join(DATA_DIR, 'club.json'), ClubStateSchema.parse(c)); }
export function saveCharacters(cs: Character[]) {
  const ids = new Set<string>();
  for (const c of cs) { if (ids.has(c.id)) throw new Error(`Doppelte Figur-ID: ${c.id}`); ids.add(c.id); }
  writeJson(path.join(DATA_DIR, 'characters.json'), CharactersSchema.parse(cs));
}
export function saveLocations(ls: Location[]) { writeJson(path.join(DATA_DIR, 'locations.json'), LocationsSchema.parse(ls)); }
export function saveEpisode(e: Episode) { writeJson(path.join(EP_DIR, `${e.id}.json`), EpisodeSchema.parse(e)); }
export function deleteEpisode(id: string) {
  const f = path.join(EP_DIR, `${id}.json`);
  if (fs.existsSync(f)) fs.unlinkSync(f);
  fs.rmSync(path.join(MEDIA_DIR, 'episodes', id), { recursive: true, force: true });
}

/* ------------------------------------------------------------- Snapshots */

export function saveSnapshot(episodeNumber: number) {
  writeJson(path.join(SNAP_DIR, `nach-${epId(episodeNumber)}.json`), {
    episode: episodeNumber,
    savedAt: new Date().toISOString(),
    club: getClub(),
    characters: getCharacters(),
    locations: getLocations(),
  });
}
export function listSnapshots(): number[] {
  ensureDirs();
  return fs.readdirSync(SNAP_DIR).map((f) => /^nach-ep-(\d+)\.json$/.exec(f)?.[1]).filter(Boolean).map(Number).sort((a, b) => a - b);
}
export function readSnapshot(episodeNumber: number): { club: ClubState; characters: Character[]; locations: Location[] } | null {
  const f = path.join(SNAP_DIR, `nach-${epId(episodeNumber)}.json`);
  if (!fs.existsSync(f)) return null;
  const s = readJson<{ club: unknown; characters: unknown; locations: unknown }>(f);
  return { club: ClubStateSchema.parse(s.club), characters: CharactersSchema.parse(s.characters), locations: LocationsSchema.parse(s.locations) };
}
export function restoreSnapshot(episodeNumber: number) {
  const s = readJson<{ club: ClubState; characters: Character[]; locations: Location[] }>(path.join(SNAP_DIR, `nach-${epId(episodeNumber)}.json`));
  saveClub(s.club); saveCharacters(s.characters); saveLocations(s.locations);
}

export function isSeeded() { return fs.existsSync(path.join(DATA_DIR, 'club.json')); }

export function episodeMediaDir(id: string) {
  const d = path.join(MEDIA_DIR, 'episodes', id);
  fs.mkdirSync(d, { recursive: true });
  return d;
}
