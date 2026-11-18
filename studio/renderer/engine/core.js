// Render-Kern: WebGL-Renderer, Look (Bloom, Grading, Vignette), Untertitel, Texttafeln, Endtafel.
// Deterministisch: gleiches t => gleiches Bild. render.mjs ruft window.renderFrame(t) Frame für Frame auf.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

export const W = 1080, H = 1920, FPS = 30;
// Sicherer Bereich für TikTok: oben Suchleiste, unten Beschreibung/Musik, rechts Buttons
export const SAFE = { top: 170, bottom: 330, left: 70, right: 160 };
export const COLORS = { sub: '#ffffff', hi: '#ffd21f', stroke: '#000000', accent: '#ffd21f', soft: '#e9eef0' };

// Stimmung -> Farbgebung (Schatten-/Lichter-Tönung, Sättigung, Kontrast)
export const MOODS = {
  spannung: { shadow: [0.015, 0.05, 0.07], high: [0.02, 0.01, -0.01], sat: 0.86, contrast: 1.08 },
  ruhig:    { shadow: [0.01, 0.035, 0.05], high: [0.02, 0.015, 0.0], sat: 0.92, contrast: 1.03 },
  schock:   { shadow: [0.05, 0.01, 0.01], high: [0.03, 0.0, -0.02], sat: 0.8, contrast: 1.14 },
  trauer:   { shadow: [0.02, 0.03, 0.06], high: [-0.01, 0.0, 0.02], sat: 0.62, contrast: 1.02 },
  hoffnung: { shadow: [0.01, 0.03, 0.05], high: [0.05, 0.03, 0.0], sat: 0.95, contrast: 1.05 },
  triumph:  { shadow: [0.0, 0.03, 0.05], high: [0.06, 0.04, 0.0], sat: 1.02, contrast: 1.07 },
  rueckblick: { shadow: [0.04, 0.03, 0.01], high: [0.05, 0.03, 0.0], sat: 0.45, contrast: 1.04 },
};

const GradeShader = {
  uniforms: {
    tDiffuse: { value: null }, uTime: { value: 0 }, uRes: { value: new THREE.Vector2(W, H) },
    uVignette: { value: 1 }, uFade: { value: 1 }, uFlash: { value: 0 }, uChroma: { value: 1 }, uFlicker: { value: 0 },
    uShadow: { value: new THREE.Vector3() }, uHigh: { value: new THREE.Vector3() }, uSat: { value: 0.9 }, uContrast: { value: 1.06 },
    uZoomBlur: { value: 0 }, uRed: { value: 0 },
  },
  vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uTime, uVignette, uFade, uFlash, uChroma, uFlicker, uSat, uContrast, uZoomBlur, uRed;
    uniform vec3 uShadow, uHigh; uniform vec2 uRes; varying vec2 vUv;
    float hash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
    vec3 sample3(vec2 uv, vec2 off){ return vec3(texture2D(tDiffuse, uv + off).r, texture2D(tDiffuse, uv).g, texture2D(tDiffuse, uv - off).b); }
    void main(){
      vec2 c = vUv - 0.5; float r2 = dot(c*vec2(0.5625,1.0), c*vec2(0.5625,1.0));
      vec2 off = c * 0.003 * uChroma * (0.3 + r2*4.0);
      vec3 col = sample3(vUv, off);
      if (uZoomBlur > 0.001) {            // Zoom-Unschärfe für Schnitt-Übergänge
        vec3 acc = col; for (int i = 1; i < 8; i++) { float k = 1.0 - float(i) * 0.012 * uZoomBlur; acc += sample3(0.5 + c * k, off); }
        col = acc / 8.0;
      }
      float l = dot(col, vec3(0.299,0.587,0.114));
      col += uShadow * (1.0 - smoothstep(0.0, 0.45, l));
      col += uHigh * smoothstep(0.35, 1.0, l);
      col = mix(vec3(l), col, uSat);
      col = (col - 0.5) * uContrast + 0.5;
      col = mix(col, col * vec3(1.35, 0.35, 0.3), uRed);   // Alarm-Rot
      float v = smoothstep(0.85, 0.18, length(c*vec2(1.0,0.82))*1.25);
      col *= mix(1.0, v, 0.7*uVignette);
      col *= 1.0 - uFlicker * (0.5 + 0.5*hash(vec2(floor(uTime*24.0), 3.1)));
      col = max(col, 0.0) * uFade + vec3(uFlash);
      gl_FragColor = vec4(col, 1.0);
    }`,
};

export async function loadFonts() {
  const base = '/node_modules/@fontsource';
  const faces = [
    new FontFace('Anton', `url(${base}/anton/files/anton-latin-400-normal.woff2)`),
    new FontFace('Montserrat', `url(${base}/montserrat/files/montserrat-latin-700-normal.woff2)`, { weight: '700' }),
    new FontFace('Montserrat', `url(${base}/montserrat/files/montserrat-latin-800-normal.woff2)`, { weight: '800' }),
    new FontFace('Montserrat', `url(${base}/montserrat/files/montserrat-latin-900-normal.woff2)`, { weight: '900' }),
    new FontFace('Caveat', `url(${base}/caveat/files/caveat-latin-700-normal.woff2)`, { weight: '700' }),
  ];
  for (const f of faces) { await f.load(); document.fonts.add(f); }
  await document.fonts.ready;
}

export function createEngine() {
  const glCanvas = document.createElement('canvas'); glCanvas.width = W; glCanvas.height = H;
  const renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1); renderer.setSize(W, H, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const camera = new THREE.PerspectiveCamera(40, W / H, 0.05, 900);
  const rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, rt);
  const renderPass = new RenderPass(new THREE.Scene(), camera); composer.addPass(renderPass);
  const bloom = new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), 0.5, 0.6, 0.86); composer.addPass(bloom);
  composer.addPass(new OutputPass());
  const grade = new ShaderPass(GradeShader); composer.addPass(grade);

  const out = document.createElement('canvas'); out.width = W; out.height = H; document.body.appendChild(out);
  const ctx = out.getContext('2d');

  function render(scene, t, post = {}) {
    renderPass.scene = scene;
    renderer.toneMappingExposure = post.exposure ?? 1.0;
    bloom.strength = post.bloom ?? 0.5;
    const m = MOODS[post.mood] || MOODS.spannung; const u = grade.uniforms;
    u.uTime.value = t; u.uFade.value = post.fade ?? 1; u.uFlash.value = post.flash ?? 0; u.uVignette.value = post.vignette ?? 1;
    u.uChroma.value = post.chroma ?? 1; u.uFlicker.value = post.flicker ?? 0; u.uZoomBlur.value = post.zoomBlur ?? 0; u.uRed.value = post.red ?? 0;
    u.uShadow.value.set(...m.shadow); u.uHigh.value.set(...m.high); u.uSat.value = m.sat; u.uContrast.value = m.contrast;
    composer.render();
    ctx.globalAlpha = 1; ctx.drawImage(glCanvas, 0, 0);
  }
  return { renderer, camera, composer, render, ctx, out, glCanvas };
}

// ---------------------------------------------------------------- Untertitel
// words: [{text, s, e, hi}] (Video-Zeit, hi = wichtiges Wort -> gelb)
export function buildChunks(words, maxWords = 3, maxChars = 18) {
  const chunks = []; let cur = [];
  const flush = () => { if (cur.length) chunks.push(cur); cur = []; };
  words.forEach((w) => {
    const len = cur.reduce((a, x) => a + x.text.length + 1, 0) + w.text.length;
    if (cur.length && (cur.length >= maxWords || len > maxChars)) flush();
    cur.push(w);
    if (/[.!?:,;…–]$/.test(w.text)) flush();
  });
  flush();
  return chunks.map((ws, i) => {
    const next = chunks[i + 1];
    const e = Math.min(ws[ws.length - 1].e + 0.3, next ? next[0].s - 0.03 : 1e9);
    return { words: ws, s: ws[0].s - 0.05, e: Math.max(e, ws[ws.length - 1].e) };
  });
}

export function drawSubtitles(ctx, chunks, t, opts = {}) {
  const ch = chunks.find((c) => t >= c.s && t < c.e); if (!ch) return;
  const size = opts.size ?? 86;
  const cx = (SAFE.left + (W - SAFE.right)) / 2; const maxW = W - SAFE.left - SAFE.right - 30;
  const cy = opts.y ?? 1250;
  const pop = Math.min(1, (t - ch.s) / 0.11); const sc = 0.82 + 0.18 * (1 - Math.pow(1 - pop, 3));
  ctx.save(); ctx.translate(cx, cy); ctx.scale(sc, sc); ctx.globalAlpha = Math.min(1, pop * 1.6);
  ctx.font = `900 ${size}px Montserrat`; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  const space = ctx.measureText(' ').width * 1.2;
  const up = (s) => s.toUpperCase();
  const lines = [[]]; let lw = 0;
  for (const w of ch.words) {
    const ww = ctx.measureText(up(w.text)).width;
    if (lines[lines.length - 1].length && lw + space + ww > maxW) { lines.push([]); lw = 0; }
    lines[lines.length - 1].push({ w, ww }); lw += (lw ? space : 0) + ww;
  }
  // zu breite Einzelzeile verkleinern
  const widest = Math.max(...lines.map((l) => l.reduce((a, x) => a + x.ww, 0) + space * (l.length - 1)));
  if (widest > maxW) { const k = maxW / widest; ctx.scale(k, k); }
  const lh = size * 1.1; let y = -((lines.length - 1) * lh) / 2;
  let active = -1; ch.words.forEach((w, i) => { if (t >= w.s - 0.02) active = i; });
  let idx = 0;
  for (const line of lines) {
    const total = line.reduce((a, x) => a + x.ww, 0) + space * (line.length - 1); let x = -total / 2;
    for (const { w, ww } of line) {
      const isActive = idx === active;
      const k = isActive ? 1 + 0.07 * Math.max(0, 1 - (t - w.s) / 0.18) : 1;
      ctx.save(); ctx.translate(x + ww / 2, y); ctx.scale(k, k); ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 5;
      ctx.lineWidth = size * 0.19; ctx.strokeStyle = COLORS.stroke; ctx.strokeText(up(w.text), 0, 0);
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = w.hi ? COLORS.hi : COLORS.sub;
      ctx.globalAlpha = idx <= active ? 1 : 0.9;
      ctx.fillText(up(w.text), 0, 0);
      ctx.restore(); x += ww + space; idx++;
    }
    y += lh;
  }
  ctx.restore();
}

// ---------------------------------------------------------------- Texttafeln
const CX = (SAFE.left + (W - SAFE.right)) / 2;
function strokeFill(ctx, text, x, y, fill, lw) { ctx.lineWidth = lw; ctx.strokeStyle = '#000'; ctx.strokeText(text, x, y); ctx.fillStyle = fill; ctx.fillText(text, x, y); }
const env = (t, a, b, fi = 0.18, fo = 0.3) => Math.max(0, Math.min(1, (t - a) / fi, (b - t) / fo));

// Hook-Schlagzeile oben (z. B. „14 TAGE LEBENDIG BEGRABEN“)
export function drawHeadline(ctx, t, { text, a = 0, b = 3 }) {
  if (!text || t < a || t > b) return;
  const k = env(t, a, b, 0.12, 0.3); const slam = 1 + 0.3 * Math.pow(1 - Math.min(1, (t - a) / 0.2), 3);
  ctx.save(); ctx.globalAlpha = k; ctx.translate(CX, 400); ctx.scale(slam, slam); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  const words = text.toUpperCase().split(' '); const lines = []; let cur = '';
  ctx.font = '128px Anton';
  for (const w of words) { const test = cur ? cur + ' ' + w : w; if (ctx.measureText(test).width > 800 && cur) { lines.push(cur); cur = w; } else cur = test; }
  lines.push(cur);
  const lh = 138; let y = -((lines.length - 1) * lh) / 2;
  ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 30;
  lines.forEach((l, i) => { strokeFill(ctx, l, 0, y + i * lh, i === lines.length - 1 ? COLORS.hi : '#fff', 20); });
  ctx.restore();
}

// Einblendung: Datum/Ort (Schreibmaschinen-Effekt), Zahl (Zähler), Zitat
export function drawCard(ctx, t, card) {
  if (!card || t < card.a || t > card.b) return;
  const k = env(t, card.a, card.b, 0.2, 0.35);
  ctx.save(); ctx.globalAlpha = k; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  const y0 = 330;
  if (card.art === 'zahl') {
    const m = String(card.text).match(/^([^\d]*)([\d.,]+)(.*)$/);
    let txt = card.text;
    if (m) {
      const target = parseFloat(m[2].replace(/\./g, '').replace(',', '.'));
      const p = Math.min(1, (t - card.a) / 0.9); const v = target * (1 - Math.pow(1 - p, 3));
      const dec = (m[2].split(',')[1] || '').length;
      txt = m[1] + v.toLocaleString('de-DE', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + m[3];
    }
    ctx.font = '170px Anton'; ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 30; strokeFill(ctx, txt, CX, y0, COLORS.hi, 22);
    if (card.sub) { ctx.font = '800 50px Montserrat'; ctx.shadowBlur = 0; strokeFill(ctx, card.sub.toUpperCase(), CX, y0 + 125, '#fff', 12); }
  } else if (card.art === 'zitat') {
    ctx.font = '700 64px Caveat'; ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 25;
    const n = Math.floor(Math.min(1, (t - card.a) / 1.2) * card.text.length);
    strokeFill(ctx, '„' + card.text.slice(0, n) + (n < card.text.length ? '' : '“'), CX, y0, '#fff', 10);
  } else { // datum / ort
    const n = Math.floor(Math.min(1, (t - card.a) / 0.7) * card.text.length);
    const txt = card.text.toUpperCase().slice(0, n);
    ctx.font = '800 62px Montserrat'; ctx.letterSpacing = '6px';
    const w = Math.max(ctx.measureText(card.text.toUpperCase()).width + 80, 300);
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(CX - w / 2, y0 - 56, w, 112);
    ctx.fillStyle = COLORS.hi; ctx.fillRect(CX - w / 2, y0 - 56, 10, 112);
    ctx.fillStyle = '#fff'; ctx.fillText(txt + (n < card.text.length && Math.floor(t * 6) % 2 ? '▌' : ''), CX + 5, y0 + 2);
    if (card.sub) { ctx.letterSpacing = '3px'; ctx.font = '700 38px Montserrat'; strokeFill(ctx, card.sub.toUpperCase(), CX, y0 + 100, '#dfe6e8', 8); }
  }
  ctx.restore();
}

// Endtafel: Frage + Aufforderung (Kommentieren / Folgen)
export function drawEndCard(ctx, t, { start, end, question, cta }) {
  if (t < start) return;
  const k = Math.min(1, (t - start) / 0.4);
  ctx.save(); ctx.globalAlpha = 0.72 * k; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = k;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  ctx.font = '900 66px Montserrat';
  const words = question.toUpperCase().split(' '); const lines = []; let cur = '';
  for (const w of words) { const test = cur ? cur + ' ' + w : w; if (ctx.measureText(test).width > 760 && cur) { lines.push(cur); cur = w; } else cur = test; }
  lines.push(cur);
  const y0 = 760 - (lines.length - 1) * 40;
  lines.forEach((l, i) => strokeFill(ctx, l, CX, y0 + i * 80, i === lines.length - 1 ? COLORS.hi : '#fff', 14));
  ctx.fillStyle = COLORS.hi; ctx.fillRect(CX - 220, y0 + lines.length * 80 + 10, 440, 7);
  ctx.font = '800 46px Montserrat'; ctx.fillStyle = '#fff';
  ctx.fillText(cta || 'Schreib es in die Kommentare 👇', CX, y0 + lines.length * 80 + 90);
  const p = 1 + 0.06 * Math.sin((t - start) * 6);
  ctx.save(); ctx.translate(CX, y0 + lines.length * 80 + 220); ctx.scale(p, p);
  ctx.fillStyle = '#fe2c55'; const bw = 520, bh = 104; ctx.beginPath(); ctx.roundRect(-bw / 2, -bh / 2, bw, bh, 52); ctx.fill();
  ctx.font = '900 46px Montserrat'; ctx.fillStyle = '#fff'; ctx.fillText('FOLGEN FÜR MEHR', 0, 3);
  ctx.restore(); ctx.restore();
}
