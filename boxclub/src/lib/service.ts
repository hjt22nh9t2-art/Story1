/**
 * Anwendungslogik, die von API-Routen und Skripten gemeinsam genutzt wird.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import * as store from './store';
import { EpisodeSchema, type Episode } from './types';
import { ensureBabble, ensureLibrary } from './audio/synth';
import { estimateLineSec } from './timeline';
import { publishEpisode } from './story/apply';
import { loadWorld } from './story/generate';
import { validateEpisode } from './story/validate';
import { synthesizeLine } from './providers/tts';
import { getConfig } from './providers/config';
import { setClubFrom } from '../remotion/Sets';

/* ------------------------------------------------------------ Medien */

export function listMedia(prefixes: string[]): string[] {
  const out: string[] = [];
  const walk = (rel: string) => {
    const abs = path.join(store.MEDIA_DIR, rel);
    if (!fs.existsSync(abs)) return;
    for (const e of fs.readdirSync(abs, { withFileTypes: true })) {
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) walk(r); else out.push(r);
    }
  };
  prefixes.forEach(walk);
  return out;
}

/** Musik/Geräusche anlegen und für unvertonte Zeilen Demo-Brabbelstimmen erzeugen. */
export function prepareAudio(ep: Episode) {
  ensureLibrary(store.MEDIA_DIR);
  const chars = new Map(store.getCharacters().map((c) => [c.id, c]));
  for (const s of ep.scenes) for (const l of s.lines) {
    if (l.audio) continue;
    ensureBabble(store.MEDIA_DIR, l.speaker, Math.round(estimateLineSec(l.text) * 10) / 10, chars.get(l.speaker)?.voice.demoPitch ?? 1);
  }
}

/** Alles, was der Player bzw. Renderer für eine Folge braucht. */
export function compositionProps(ep: Episode, assetBase: string) {
  prepareAudio(ep);
  return {
    episode: ep,
    // veröffentlichte Folgen mit dem damaligen Figurenstand rendern (Konsistenz bei Neu-Render)
    characters: (store.readSnapshot(ep.number) && ep.status === 'veroeffentlicht' ? store.readSnapshot(ep.number)!.characters : store.getCharacters()),
    // Kulisse so, wie der Verein VOR dieser Folge aussah – auch beim erneuten Rendern alter Folgen
    club: setClubFrom((store.readSnapshot(ep.number - 1) ?? { club: store.getClub() }).club),
    assetBase,
    available: listMedia(['audio', `episodes/${ep.id}/voice`]),
  };
}

/* ------------------------------------------------------------ Episoden */

export function updateEpisode(id: string, patch: Partial<Episode>): Episode {
  const old = store.getEpisode(id);
  if (!old) throw new Error('Folge nicht gefunden');
  if (old.status === 'veroeffentlicht' && (patch.stateChanges || patch.scenes)) {
    // Veröffentlichte Folgen: nur Texte/Inszenierung, keine Zustandsänderungen
    if (patch.stateChanges && JSON.stringify(patch.stateChanges) !== JSON.stringify(old.stateChanges)) throw new Error('Zustandsänderungen einer veröffentlichten Folge sind gesperrt.');
  }
  const next = EpisodeSchema.parse({ ...old, ...patch, id: old.id, number: old.number });
  // geänderter Text => alte Sprachaufnahme verwerfen
  const oldLines = new Map(old.scenes.flatMap((s) => s.lines).map((l) => [l.id, l]));
  for (const s of next.scenes) for (const l of s.lines) {
    const o = oldLines.get(l.id);
    if (l.audio && (!o || o.text !== l.text || o.speaker !== l.speaker)) l.audio = null;
  }
  if (next.status === 'vertont' && next.scenes.some((s) => s.lines.some((l) => !l.audio))) next.status = 'entwurf';
  if (next.status === 'gerendert' && JSON.stringify(old.scenes) !== JSON.stringify(next.scenes)) next.status = next.scenes.every((s) => s.lines.every((l) => l.audio)) ? 'vertont' : 'entwurf';
  store.saveEpisode(next);
  return next;
}

export function checkEpisode(id: string) {
  const ep = store.getEpisode(id);
  if (!ep) throw new Error('Folge nicht gefunden');
  if (ep.status === 'veroeffentlicht') return { ok: true, errors: [], warnings: ['Bereits veröffentlicht.'], estimatedSec: 0, moneyAfter: store.getClub().money };
  return validateEpisode(ep, loadWorld());
}

export function publish(id: string) {
  const ep = store.getEpisode(id);
  if (!ep) throw new Error('Folge nicht gefunden');
  if (ep.status === 'veroeffentlicht') throw new Error('Folge ist bereits veröffentlicht.');
  const world = loadWorld();
  const v = validateEpisode(ep, world);
  if (!v.ok) throw new Error(`Konsistenzprüfung fehlgeschlagen:\n- ${v.errors.join('\n- ')}`);
  const { world: next, log } = publishEpisode(world, ep);
  store.saveClub(next.club);
  store.saveCharacters(next.characters);
  store.saveLocations(next.locations);
  ep.status = 'veroeffentlicht';
  ep.publishedAt = new Date().toISOString();
  store.saveEpisode(ep);
  store.saveSnapshot(ep.number);
  return { episode: ep, log };
}

/** Letzte veröffentlichte Folge zurücknehmen (Stand vor der Folge wiederherstellen). */
export function unpublishLast() {
  const club = store.getClub();
  const n = club.lastEpisode;
  if (n < 1) throw new Error('Nichts zum Zurücknehmen.');
  const ep = store.getEpisode(store.epId(n))!;
  if (n === 1) throw new Error('Folge 1 kann nicht zurückgenommen werden – nutze "npm run seed -- --reset".');
  store.restoreSnapshot(n - 1);
  ep.status = ep.video ? 'gerendert' : 'entwurf';
  ep.publishedAt = null;
  store.saveEpisode(ep);
  return ep;
}

export function setDecisionResult(decisionId: string, winner: 'A' | 'B' | 'C', votes: Record<string, number>, note: string) {
  const club = store.getClub();
  const d = club.decisions.find((x) => x.id === decisionId);
  if (!d) throw new Error('Entscheidung nicht gefunden');
  if (d.status === 'umgesetzt') throw new Error('Diese Entscheidung wurde bereits in einer Folge umgesetzt.');
  if (!d.options.some((o) => o.key === winner)) throw new Error('Ungültige Option');
  d.winner = winner; d.votes = votes; d.note = note; d.status = 'entschieden';
  store.saveClub(club);
  return d;
}

/* ------------------------------------------------------------ Vertonung */

export async function voiceEpisode(id: string, opts: { force?: boolean } = {}) {
  const ep = store.getEpisode(id);
  if (!ep) throw new Error('Folge nicht gefunden');
  const cfg = getConfig();
  if (cfg.tts === 'none') throw new Error('Keine Text-to-Speech konfiguriert (ELEVENLABS_API_KEY oder OPENAI_API_KEY). Im Demo-Modus wird eine Brabbelstimme verwendet.');
  const chars = new Map(store.getCharacters().map((c) => [c.id, c]));
  let done = 0;
  for (const s of ep.scenes) for (const l of s.lines) {
    if (l.audio && !opts.force) continue;
    const r = await synthesizeLine({ text: l.text, character: chars.get(l.speaker), mediaDir: store.MEDIA_DIR, relFile: `episodes/${id}/voice/${l.id}.mp3` });
    if (r) { l.audio = r; done++; }
  }
  if (ep.status === 'entwurf') ep.status = 'vertont';
  store.saveEpisode(ep);
  return { episode: ep, voiced: done, provider: cfg.tts };
}

/* ------------------------------------------------------------ Rendern */

const RENDER_DIR = () => path.join(store.DATA_DIR, 'renders');
export interface RenderStatus { state: 'wartet' | 'laeuft' | 'fertig' | 'fehler'; progress: number; message: string; startedAt: string; finishedAt?: string }

export function renderStatus(id: string): RenderStatus | null {
  const f = path.join(RENDER_DIR(), `${id}.json`);
  return fs.existsSync(f) ? (JSON.parse(fs.readFileSync(f, 'utf8')) as RenderStatus) : null;
}
export function writeRenderStatus(id: string, s: RenderStatus) {
  fs.mkdirSync(RENDER_DIR(), { recursive: true });
  fs.writeFileSync(path.join(RENDER_DIR(), `${id}.json`), JSON.stringify(s));
}

export function startRender(id: string) {
  const cur = renderStatus(id);
  if (cur?.state === 'laeuft') throw new Error('Rendern läuft bereits.');
  writeRenderStatus(id, { state: 'wartet', progress: 0, message: 'Starte …', startedAt: new Date().toISOString() });
  const child = spawn(process.execPath, [path.join(store.ROOT, 'node_modules', 'tsx', 'dist', 'cli.mjs'), path.join(store.ROOT, 'scripts', 'render.ts'), id], {
    cwd: store.ROOT, detached: true, stdio: ['ignore', fs.openSync(path.join(RENDER_DIR(), `${id}.log`), 'w'), fs.openSync(path.join(RENDER_DIR(), `${id}.log`), 'a')],
    env: { ...process.env, BOXCLUB_ROOT: store.ROOT },
  });
  child.unref();
}
