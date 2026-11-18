// Headless-Renderer: node renderer/render.mjs <folge-ordner> [--workers 3] [--from 0 --to <dauer>] [--stills 1,5,9] [--cover pfad]
// Rendert plan.json Frame für Frame (Three.js in Chromium/SwiftShader) und schreibt roh/video_stumm.mp4.
// Fortsetzbar: fertige Blöcke (je 60 Frames) in roh/seg werden übersprungen.
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const folge = path.resolve(args[0]);
const rel = path.relative(root, folge).split(path.sep).join('/');
const plan = JSON.parse(fs.readFileSync(path.join(folge, 'plan.json'), 'utf8'));
const FPS = plan.fps || 30;
const workers = +opt('workers', 3), from = +opt('from', 0), to = +opt('to', plan.dauer), step = +opt('step', 1);
const roh = path.join(folge, 'roh'); fs.mkdirSync(roh, { recursive: true });
const outPath = opt('out', path.join(roh, 'video_stumm.mp4'));

const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.woff2': 'font/woff2', '.json': 'application/json', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream', 'cache-control': 'no-store' }); fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;
// STUDIO_GPU=1: echte Grafikkarte nutzen (auf dem eigenen Rechner um ein Vielfaches schneller); sonst CPU-Rendering (SwiftShader)
const gpu = process.env.STUDIO_GPU === '1';
const browser = await chromium.launch(gpu
  ? { headless: true, args: ['--ignore-gpu-blocklist', '--enable-gpu', '--use-angle=default', '--enable-features=Vulkan'] }
  : { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-sandbox'] });
let pageErrors = 0;
async function openPage() {
  const page = await browser.newPage({ viewport: { width: 400, height: 600 } });
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('[page]', m.text()); });
  page.on('pageerror', (e) => { pageErrors++; console.log('[pageerror]', e.message); });
  await page.goto(`http://localhost:${port}/renderer/player.html?plan=/${rel}/plan.json`);
  await page.waitForFunction(() => window.ready || window.initError, null, { timeout: 300000 });
  const err = await page.evaluate(() => window.initError); if (err) throw new Error(err);
  return page;
}
const done = async (code = 0) => { await browser.close(); server.close(); process.exit(code); };

if (opt('cover', null)) {
  const page = await openPage(); const data = await page.evaluate(() => window.renderCover());
  fs.writeFileSync(opt('cover'), Buffer.from(data.split(',')[1], 'base64')); console.log('cover ->', opt('cover')); await done();
}
if (opt('stills', null)) {
  const page = await openPage(); const dir = opt('dir', path.join(roh, 'stills')); fs.mkdirSync(dir, { recursive: true });
  for (const s of opt('stills').split(',').map(Number)) {
    const t0 = Date.now(); const data = await page.evaluate((t) => window.renderFrame(t, 'image/jpeg'), s);
    fs.writeFileSync(path.join(dir, `f_${s.toFixed(2)}.jpg`), Buffer.from(data.split(',')[1], 'base64')); console.log('still', s, (Date.now() - t0) + 'ms');
  }
  await done(pageErrors ? 3 : 0);
}

const frames = []; for (let f = Math.round(from * FPS); f < Math.round(to * FPS); f += step) frames.push(f);
const CH = 60; const chunks = [];
for (let i = 0; i < frames.length; i += CH) chunks.push({ id: String(frames[i]).padStart(5, '0'), frames: frames.slice(i, i + CH) });
const segDir = path.join(roh, 'seg'); fs.mkdirSync(segDir, { recursive: true });
const todo = chunks.filter((c) => !fs.existsSync(path.join(segDir, `seg_${c.id}.mp4`)));
console.log(`${chunks.length - todo.length}/${chunks.length} Blöcke schon fertig`);
const t0 = Date.now(); let n = 0; const total = todo.reduce((a, c) => a + c.frames.length, 0);
await Promise.all(Array.from({ length: Math.min(workers, todo.length) }, async () => {
  const page = await openPage();
  while (todo.length) {
    const c = todo.shift(); const tmp = path.join(segDir, `tmp_${c.id}.mp4`);
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS / step), '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '14', '-pix_fmt', 'yuv420p', tmp], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (const f of c.frames) {
      const data = await page.evaluate((t) => window.renderFrame(t, 'image/jpeg'), f / FPS);
      if (!ff.stdin.write(Buffer.from(data.split(',')[1], 'base64'))) await new Promise((r) => ff.stdin.once('drain', r));
      n++; if (n % 60 === 0) { const el = (Date.now() - t0) / 1000; console.log(`${n}/${total} Frames, ${(el / n * 1000).toFixed(0)} ms/Frame, Rest ${((total - n) * el / n / 60).toFixed(1)} min`); }
    }
    ff.stdin.end(); await new Promise((r) => ff.on('close', r));
    fs.renameSync(tmp, path.join(segDir, `seg_${c.id}.mp4`));
  }
}));
fs.writeFileSync(path.join(segDir, 'list.txt'), chunks.map((c) => `file 'seg_${c.id}.mp4'`).join('\n'));
await new Promise((r) => spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(segDir, 'list.txt'), '-c', 'copy', outPath], { stdio: 'inherit' }).on('close', r));
console.log('fertig:', outPath, ((Date.now() - t0) / 60000).toFixed(1), 'min');
await done(pageErrors ? 3 : 0);
