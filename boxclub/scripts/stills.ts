/**
 * Testbilder einer Folge: npm run stills -- ep-001 2,10,25   → data/renders/<id>-stills/
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import * as store from '../src/lib/store';
import { compositionProps } from '../src/lib/service';
import { FPS } from '../src/lib/timeline';

const [id, secs = '1,10,20,30'] = process.argv.slice(2);
const ep = store.getEpisode(id)!;
const props = compositionProps(ep, '');
const pub = fs.mkdtempSync(path.join(os.tmpdir(), 'boxclub-pub-'));
for (const rel of props.available) { fs.mkdirSync(path.dirname(path.join(pub, rel)), { recursive: true }); fs.copyFileSync(path.join(store.MEDIA_DIR, rel), path.join(pub, rel)); }
const browser = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const serveUrl = await bundle({ entryPoint: path.join(store.ROOT, 'src/remotion/index.ts'), publicDir: pub });
const composition = await selectComposition({ serveUrl, id: 'BoxclubEpisode', inputProps: props, browserExecutable: fs.existsSync(browser) ? browser : null });
const out = path.join(store.DATA_DIR, 'renders', `${id}-stills`);
fs.mkdirSync(out, { recursive: true });
for (const s of secs.split(',').map(Number)) {
  await renderStill({ serveUrl, composition, inputProps: props, frame: Math.min(composition.durationInFrames - 1, Math.round(s * FPS)), output: path.join(out, `t${s}.png`), browserExecutable: fs.existsSync(browser) ? browser : null, scale: 0.5 });
  console.log('still', s);
}
console.log('Dauer:', (composition.durationInFrames / FPS).toFixed(1), 's');
