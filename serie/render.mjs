// Headless-Renderer: node render.mjs teil_01 [--workers 3] [--from 0 --to 60] [--step 1] [--out pfad]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const args = process.argv.slice(2);
const ep = args[0] || 'teil_01';
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const workers = +opt('workers', 3), FPS = 30;
const from = +opt('from', 0), to = +opt('to', 60), step = +opt('step', 1);
const outPath = opt('out', `${ep}/roh/video_stumm.mp4`);
const stills = opt('stills', null); // Komma-Liste von Sekunden -> PNGs

const root = path.dirname(new URL(import.meta.url).pathname);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.woff2': 'font/woff2', '.woff': 'font/woff', '.json': 'application/json', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-sandbox'] });
async function openPage() {
  const page = await browser.newPage({ viewport: { width: 400, height: 600 } });
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('[page]', m.text()); });
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await page.goto(`http://localhost:${port}/player.html?ep=${ep}`);
  await page.waitForFunction(() => window.ready || window.initError, null, { timeout: 120000 });
  const err = await page.evaluate(() => window.initError); if (err) throw new Error(err);
  return page;
}

if (opt('cover', null)) {
  const page = await openPage();
  const data = await page.evaluate(() => window.renderCover());
  fs.writeFileSync(opt('cover'), Buffer.from(data.split(',')[1], 'base64'));
  console.log('cover ->', opt('cover')); await browser.close(); server.close(); process.exit(0);
}

if (stills) {
  const page = await openPage(); fs.mkdirSync(`${ep}/roh/stills`, { recursive: true });
  for (const s of stills.split(',').map(Number)) {
    const t0 = Date.now();
    const data = await page.evaluate((t) => window.renderFrame(t, 'image/png'), s);
    fs.writeFileSync(`${ep}/roh/stills/f_${s.toFixed(2)}.png`, Buffer.from(data.split(',')[1], 'base64'));
    console.log('still', s, (Date.now() - t0) + 'ms');
  }
  await browser.close(); server.close(); process.exit(0);
}

const frames = []; for (let f = Math.round(from * FPS); f < Math.round(to * FPS); f += step) frames.push(f);
const CH = 60; const chunks = [];
for (let i = 0; i < frames.length; i += CH) chunks.push({ id: String(frames[i]).padStart(5, '0'), frames: frames.slice(i, i + CH) });
const segDir = `${ep}/roh/seg`; fs.mkdirSync(segDir, { recursive: true });
const todo = chunks.filter((c) => !fs.existsSync(`${segDir}/seg_${c.id}.mp4`));
console.log(`${chunks.length - todo.length}/${chunks.length} Blöcke schon fertig`);
const t0 = Date.now(); let done = 0; const total = todo.reduce((a, c) => a + c.frames.length, 0);
await Promise.all(Array.from({ length: workers }, async () => {
  if (!todo.length) return;
  const page = await openPage();
  while (todo.length) {
    const c = todo.shift(); const tmp = `${segDir}/tmp_${c.id}.mp4`;
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS / step), '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '12', '-pix_fmt', 'yuv420p', tmp], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (const f of c.frames) {
      const data = await page.evaluate((t) => window.renderFrame(t, 'image/jpeg'), f / FPS);
      if (!ff.stdin.write(Buffer.from(data.split(',')[1], 'base64'))) await new Promise((r) => ff.stdin.once('drain', r));
      done++; if (done % 30 === 0) { const el = (Date.now() - t0) / 1000; console.log(`${done}/${total} frames, ${(el / done * 1000).toFixed(0)} ms/frame, ETA ${((total - done) * el / done / 60).toFixed(1)} min`); }
    }
    ff.stdin.end(); await new Promise((r) => ff.on('close', r));
    fs.renameSync(tmp, `${segDir}/seg_${c.id}.mp4`);
  }
}));
fs.writeFileSync(`${segDir}/list.txt`, chunks.map((c) => `file 'seg_${c.id}.mp4'`).join('\n'));
await new Promise((r) => spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', `${segDir}/list.txt`, '-c', 'copy', outPath], { stdio: 'inherit' }).on('close', r));
console.log('fertig:', outPath, ((Date.now() - t0) / 60000).toFixed(1), 'min');
await browser.close(); server.close();
