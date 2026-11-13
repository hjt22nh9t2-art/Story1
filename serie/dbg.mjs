// node dbg.mjs teil_05 out.png '[["ext",[x,y,z],[x,y,z],fov,t,{opts}], ...]'
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const [ep, outPrefix, json] = process.argv.slice(2); const views = JSON.parse(json);
const root = path.dirname(new URL(import.meta.url).pathname);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.json': 'application/json' };
const server = http.createServer((req, res) => { const p = path.join(root, decodeURIComponent(req.url.split('?')[0]));
  if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res); });
await new Promise((r) => server.listen(0, r));
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage(); page.on('pageerror', (e) => console.log('[err]', e.message)); page.on('console', (m) => { if (m.type() === 'error') console.log('[c]', m.text()); });
await page.goto(`http://localhost:${server.address().port}/player.html?ep=${ep}`);
await page.waitForFunction(() => window.ready || window.initError, null, { timeout: 120000 });
const e = await page.evaluate(() => window.initError); if (e) { console.log(e); process.exit(1); }
for (let i = 0; i < views.length; i++) { const d = await page.evaluate((v) => window.mod.debug(...v), views[i]); fs.writeFileSync(`${outPrefix}_${i}.png`, Buffer.from(d.split(',')[1], 'base64')); }
await browser.close(); server.close();
