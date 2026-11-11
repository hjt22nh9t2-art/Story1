/**
 * Rendert eine Folge als MP4 (1080×1920, H.264/AAC) mit Remotion + FFmpeg.
 *   npm run render -- ep-001
 * Fortschritt: data/renders/<id>.json, Log: data/renders/<id>.log
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import * as store from '../src/lib/store';
import { compositionProps, writeRenderStatus, type RenderStatus } from '../src/lib/service';
import { loadEnv } from '../src/lib/providers/config';
import { exportTimeline } from './export-timeline';

loadEnv();
const id = process.argv[2];
if (!id) { console.error('Aufruf: npm run render -- ep-001'); process.exit(1); }
const ep = store.getEpisode(id);
if (!ep) { console.error(`Folge ${id} nicht gefunden`); process.exit(1); }

const started = new Date().toISOString();
const status = (s: Partial<RenderStatus>) => {
  writeRenderStatus(id, { state: 'laeuft', progress: 0, message: '', startedAt: started, ...s });
  if (s.message) console.log(`[${id}] ${s.message} ${s.progress !== undefined ? Math.round(s.progress * 100) + '%' : ''}`);
};

/** Chromium: vorinstallierte Headless-Shell nutzen, sonst lädt Remotion selbst eine herunter. */
function browserExecutable(): string | null {
  if (process.env.REMOTION_BROWSER) return process.env.REMOTION_BROWSER;
  const c = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
  if (fs.existsSync(c)) return c;
  const base = '/opt/pw-browsers';
  if (fs.existsSync(base)) for (const d of fs.readdirSync(base)) {
    const p = path.join(base, d, 'chrome-headless-shell-linux64', 'chrome-headless-shell');
    if (fs.existsSync(p)) return p;
  }
  return null;
}

try {
  status({ progress: 0.01, message: 'Bereite Audio vor …' });
  const props = compositionProps(ep, '');

  // Nur benötigte Medien in ein temporäres public-Verzeichnis verlinken
  const pub = fs.mkdtempSync(path.join(os.tmpdir(), 'boxclub-pub-'));
  for (const rel of props.available) {
    const dst = path.join(pub, rel);
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(path.join(store.MEDIA_DIR, rel), dst);
  }

  status({ progress: 0.03, message: 'Bündle Komposition …' });
  const serveUrl = await bundle({ entryPoint: path.join(store.ROOT, 'src/remotion/index.ts'), publicDir: pub });
  const browser = browserExecutable();
  const composition = await selectComposition({ serveUrl, id: 'BoxclubEpisode', inputProps: props, browserExecutable: browser });

  const outDir = store.episodeMediaDir(id);
  const raw = path.join(os.tmpdir(), `${id}-raw.mp4`);
  status({ progress: 0.05, message: `Rendere ${composition.durationInFrames} Frames …` });
  await renderMedia({
    serveUrl, composition, inputProps: props, codec: 'h264', outputLocation: raw, browserExecutable: browser,
    crf: 18, imageFormat: 'jpeg', jpegQuality: 92, muted: true, // Ton kommt aus dem eigenen Mischer (scripts/mix.py)
    concurrency: Math.max(1, Math.min(8, os.cpus().length)),
    chromiumOptions: { gl: 'swangle' },
    onProgress: ({ progress }) => status({ progress: 0.05 + progress * 0.85, message: 'Rendere …' }),
  });

  status({ progress: 0.9, message: 'Audio-Mischung (Sprache vorrangig, Ducking, Begrenzer) …' });
  const tlFile = exportTimeline(id);
  const master = path.join(store.DATA_DIR, 'renders', `${id}-master.wav`);
  console.log(execFileSync('python3', [path.join(store.ROOT, 'scripts/mix.py'), tlFile, master]).toString());
  status({ progress: 0.95, message: 'FFmpeg: Ton anlegen + Faststart …' });
  const file = `episodes/${id}/boxclub_folge_${String(ep.number).padStart(3, '0')}.mp4`;
  const poster = `episodes/${id}/poster.jpg`;
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', raw, '-i', master, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-shortest', '-movflags', '+faststart', path.join(store.MEDIA_DIR, file)]);
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-ss', '3.5', '-i', path.join(store.MEDIA_DIR, file), '-frames:v', '1', '-q:v', '3', path.join(store.MEDIA_DIR, poster)]);
  const dur = parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', path.join(store.MEDIA_DIR, file)]).toString());
  fs.rmSync(raw, { force: true });
  fs.rmSync(pub, { recursive: true, force: true });
  void outDir;

  const fresh = store.getEpisode(id)!;
  fresh.video = { file, poster, renderedAt: new Date().toISOString(), durationSec: Math.round(dur * 10) / 10 };
  if (fresh.status !== 'veroeffentlicht') fresh.status = 'gerendert';
  store.saveEpisode(fresh);
  writeRenderStatus(id, { state: 'fertig', progress: 1, message: `Fertig: ${file} (${dur.toFixed(1)} s)`, startedAt: started, finishedAt: new Date().toISOString() });
  console.log(`[${id}] fertig -> data/media/${file}`);
  process.exit(0);
} catch (e) {
  console.error(e);
  writeRenderStatus(id, { state: 'fehler', progress: 0, message: (e as Error).message.slice(0, 500), startedAt: started, finishedAt: new Date().toISOString() });
  process.exit(1);
}
