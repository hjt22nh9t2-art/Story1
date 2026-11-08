// Render-Engine der Serie: Renderer, Look (Bloom, Farbe, Korn, Vignette), Untertitel & Texttafeln.
// Ein Teil (episode.js) liefert Shots; render.mjs ruft window.renderFrame(t) Frame für Frame auf.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

export const W = 1080, H = 1920, FPS = 30;
export const SAFE = { bottom: 250, right: 150, left: 60, top: 170 };
export const COLORS = { sub: '#ffffff', subHi: '#ffb04a', stroke: '#000000', radio: '#cfeef6', radioHi: '#7fd8ff' }; // radio = Stimmen aus dem Funkgerät

const GradeShader = {
  uniforms: {
    tDiffuse: { value: null }, uTime: { value: 0 }, uRes: { value: new THREE.Vector2(W, H) },
    uVignette: { value: 1.0 }, uGrain: { value: 1.0 }, uFade: { value: 1.0 }, uFlash: { value: 0 }, uChroma: { value: 1.0 }, uFlicker: { value: 0 },
  },
  vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uTime, uVignette, uGrain, uFade, uFlash, uChroma, uFlicker; uniform vec2 uRes; varying vec2 vUv;
    float hash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
    void main(){
      vec2 c = vUv - 0.5; float r2 = dot(c*vec2(0.5625,1.0), c*vec2(0.5625,1.0));
      vec2 off = c * 0.0035 * uChroma * (0.3 + r2*4.0);
      vec3 col = vec3(texture2D(tDiffuse, vUv + off).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - off).b);
      // Split-Toning: Schatten Blaugrün, Lichter warm lassen
      float l = dot(col, vec3(0.299,0.587,0.114));
      vec3 shadowTint = vec3(0.02, 0.075, 0.085);
      col = mix(col, col + shadowTint, (1.0 - smoothstep(0.0, 0.45, l)) * 0.9);
      col = mix(vec3(l), col, 0.88);                 // leicht entsättigt
      col = pow(col, vec3(1.06));                    // etwas mehr Kontrast
      // Vignette
      float v = smoothstep(0.85, 0.18, length(c*vec2(1.0,0.82))*1.25);
      col *= mix(1.0, v, 0.75*uVignette);
      // Filmkorn (animiert)
      float g = hash(vUv*uRes + fract(uTime*7.13)*100.0) - 0.5;
      col += g * 0.075 * uGrain * (0.6 + 0.8*(1.0-l));
      col *= 1.0 - uFlicker * (0.5 + 0.5*hash(vec2(uTime, 3.1)));
      col = col * uFade + vec3(uFlash);
      gl_FragColor = vec4(col, 1.0);
    }`,
};

export async function loadFonts() {
  const base = '/node_modules/@fontsource';
  const faces = [
    new FontFace('Anton', `url(${base}/anton/files/anton-latin-400-normal.woff2)`),
    new FontFace('Montserrat', `url(${base}/montserrat/files/montserrat-latin-800-normal.woff2)`, { weight: '800' }),
    new FontFace('Montserrat', `url(${base}/montserrat/files/montserrat-latin-900-normal.woff2)`, { weight: '900' }),
    new FontFace('Montserrat', `url(${base}/montserrat/files/montserrat-latin-700-normal.woff2)`, { weight: '700' }),
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

  const camera = new THREE.PerspectiveCamera(40, W / H, 0.05, 600);
  const rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, rt);
  const renderPass = new RenderPass(new THREE.Scene(), camera); composer.addPass(renderPass);
  const bloom = new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), 0.55, 0.7, 0.78); composer.addPass(bloom);
  composer.addPass(new OutputPass());
  const grade = new ShaderPass(GradeShader); composer.addPass(grade);

  const out = document.createElement('canvas'); out.width = W; out.height = H; document.body.appendChild(out);
  const ctx = out.getContext('2d');

  function render(scene, t, post = {}) {
    renderPass.scene = scene;
    renderer.toneMappingExposure = post.exposure ?? 1.0;
    bloom.strength = post.bloom ?? 0.55;
    const u = grade.uniforms;
    u.uTime.value = t; u.uFade.value = post.fade ?? 1; u.uFlash.value = post.flash ?? 0; u.uVignette.value = post.vignette ?? 1;
    u.uGrain.value = post.grain ?? 0; // Filmkorn kommt beim Export (ffmpeg noise) – komprimiert sauberer u.uChroma.value = post.chroma ?? 1; u.uFlicker.value = post.flicker ?? 0;
    composer.render();
    ctx.globalAlpha = 1; ctx.drawImage(glCanvas, 0, 0);
  }
  function black() { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); }
  return { renderer, camera, composer, render, black, ctx, out, glCanvas };
}

// ---------- Untertitel: Wort-für-Wort-Hervorhebung ----------
// words: [{text, s, e}] in Sekunden (Video-Zeit)
export function buildChunks(words, maxWords = 3, maxChars = 20) {
  const chunks = []; let cur = [];
  const flush = () => { if (cur.length) chunks.push(cur); cur = []; };
  words.forEach((w, i) => {
    const len = cur.reduce((a, x) => a + x.text.length + 1, 0) + w.text.length;
    if (cur.length && (cur.length >= maxWords || len > maxChars)) flush();
    cur.push(w);
    if (/[.!?:,…]$/.test(w.text) && !/^\d+:\d+$/.test(w.text)) flush();
  });
  flush();
  return chunks.map((ws, i) => ({ words: ws, s: ws[0].s - 0.04, e: Math.min(ws[ws.length - 1].e + 0.35, chunks[i + 1] ? chunks[i + 1][0].s - 0.04 : 1e9) }))
    .map((c, i, arr) => ({ ...c, e: arr[i + 1] ? Math.min(c.e, arr[i + 1].s) : c.e }));
}

export function drawSubtitles(ctx, chunks, t, opts = {}) {
  const ch = chunks.find((c) => t >= c.s && t < c.e); if (!ch) return;
  const size = opts.size ?? 84; const cx = (SAFE.left + (W - SAFE.right)) / 2; const maxW = W - SAFE.left - SAFE.right - 40;
  const cy = opts.y ?? (H - SAFE.bottom - 260);
  const pop = Math.min(1, (t - ch.s) / 0.12); const sc = 0.86 + 0.14 * (1 - Math.pow(1 - pop, 3));
  ctx.save(); ctx.translate(cx, cy); ctx.scale(sc, sc);
  ctx.font = `900 ${size}px Montserrat`; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  const space = ctx.measureText(' ').width * 1.25;
  // Zeilen umbrechen
  const lines = [[]]; let lw = 0;
  for (const w of ch.words) { const ww = ctx.measureText(w.text).width; if (lines[lines.length - 1].length && lw + space + ww > maxW) { lines.push([]); lw = 0; } lines[lines.length - 1].push({ w, ww }); lw += (lw ? space : 0) + ww; }
  const lh = size * 1.12; let y = -((lines.length - 1) * lh) / 2;
  // Index des aktuell gesprochenen Worts
  let active = -1; ch.words.forEach((w, i) => { if (t >= w.s - 0.02) active = i; });
  let idx = 0;
  for (const line of lines) {
    const total = line.reduce((a, x) => a + x.ww, 0) + space * (line.length - 1); let x = -total / 2;
    for (const { w, ww } of line) {
      const hi = idx === active; const past = idx < active;
      ctx.save(); ctx.translate(x + ww / 2, y); if (hi) ctx.scale(1.05, 1.05);
      ctx.shadowColor = 'rgba(0,0,0,0.65)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 4;
      ctx.lineWidth = size * 0.17; ctx.strokeStyle = COLORS.stroke; ctx.textAlign = 'center'; ctx.strokeText(w.text, 0, 0);
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = w.f ? (hi ? COLORS.radioHi : COLORS.radio) : (hi ? COLORS.subHi : past ? '#ffffff' : 'rgba(255,255,255,0.92)'); ctx.fillText(w.text, 0, 0);
      ctx.restore(); x += ww + space; idx++;
    }
    y += lh;
  }
  ctx.restore();
}

// ---------- Texttafeln ----------
export function drawTitle(ctx, t, { part = 1, of = 10, show = [0, 3], series = 'DER LEUCHTTURM VON NEBELSAND' } = {}) {
  const [a, b] = show; if (t < a || t > b) return;
  const k = Math.min(1, (t - a) / 0.15) * Math.min(1, (b - t) / 0.3);
  const slam = 1 + 0.25 * Math.pow(1 - Math.min(1, (t - a) / 0.22), 3);
  ctx.save(); ctx.globalAlpha = k; ctx.translate((W - SAFE.right + SAFE.left) / 2 + 30, 360); ctx.scale(slam, slam);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = '180px Anton'; ctx.lineJoin = 'round'; ctx.lineWidth = 22; ctx.strokeStyle = '#000'; ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 30;
  const txt = `TEIL ${part}/${of}`; ctx.strokeText(txt, 0, 0); ctx.shadowBlur = 0; ctx.fillStyle = '#fff'; ctx.fillText(txt, 0, 0);
  // orange Linie + Serientitel
  ctx.fillStyle = COLORS.subHi; ctx.fillRect(-250, 108, 500, 8);
  ctx.font = '800 34px Montserrat'; ctx.letterSpacing = '5px'; ctx.lineWidth = 10; ctx.strokeText(series, 0, 165); ctx.fillStyle = '#e8f2f2'; ctx.fillText(series, 0, 165);
  ctx.restore();
}

export function drawEndCard(ctx, t, { start, next, question }) {
  if (t < start) return;
  const k = Math.min(1, (t - start) / 0.35);
  ctx.save(); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = k; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const cx = (W - SAFE.right + SAFE.left) / 2 + 30;
  ctx.font = '120px Anton'; ctx.fillStyle = '#fff'; ctx.fillText(`FOLGE FÜR TEIL ${next}`, cx, 760);
  ctx.font = '150px "Noto Color Emoji"'; ctx.fillText('👁', cx, 940);
  ctx.fillStyle = COLORS.subHi; ctx.fillRect(cx - 230, 1060, 460, 6);
  ctx.font = '800 58px Montserrat'; ctx.fillStyle = '#e8f2f2'; ctx.fillText(question, cx, 1160);
  ctx.font = '700 46px Montserrat'; ctx.fillStyle = '#9fb7b7'; ctx.fillText('Schreib’s in die Kommentare', cx, 1240);
  ctx.restore();
}
