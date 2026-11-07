// Gemeinsame Hilfsfunktionen für alle Teile – deterministisch (gleiches t => gleiches Bild)
import * as THREE from 'three';

export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Glatter Wert-Noise 2D (für Gelände, Wellen, Kamera-Wackler)
const P = new Uint8Array(512);
{
  const r = rng(1953);
  const p = [...Array(256).keys()];
  for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
  for (let i = 0; i < 512; i++) P[i] = p[i & 255];
}
const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
function grad(h, x, y) { const u = (h & 1) ? x : -x, v = (h & 2) ? y : -y; return (h & 4) ? u + v * 0.5 : u * 0.5 + v; }
export function noise2(x, y) {
  const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
  x -= Math.floor(x); y -= Math.floor(y);
  const u = fade(x), v = fade(y);
  const a = P[X] + Y, b = P[X + 1] + Y;
  return THREE.MathUtils.lerp(
    THREE.MathUtils.lerp(grad(P[a], x, y), grad(P[b], x - 1, y), u),
    THREE.MathUtils.lerp(grad(P[a + 1], x, y - 1), grad(P[b + 1], x - 1, y - 1), u), v);
}
export function fbm(x, y, oct = 4) {
  let a = 0.5, f = 1, s = 0;
  for (let i = 0; i < oct; i++) { s += a * noise2(x * f, y * f); f *= 2.03; a *= 0.5; }
  return s;
}

export const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const easeInOut = (t) => { t = clamp01(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
export const lerp = (a, b, t) => a + (b - a) * t;
export const v3 = (x, y, z) => new THREE.Vector3(x, y, z);

// Weiche Nebel-/Rauch-Textur (Canvas, fbm-moduliert)
export function makeFogTexture(seed = 7, size = 256) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'); const img = g.createImageData(size, size);
  const r = rng(seed); const ox = r() * 100, oy = r() * 100;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const nx = x / size - 0.5, ny = y / size - 0.5;
    const d = Math.sqrt(nx * nx + ny * ny) * 2;
    const fall = Math.pow(clamp01(1 - d), 1.6);
    const n = 0.55 + 0.6 * fbm(nx * 4 + ox, ny * 4 + oy, 5);
    const a = clamp01(fall * n);
    const i = (y * size + x) * 4;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = 255; img.data[i + 3] = a * 255;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// Prozedurale Holz-/Putz-Texturen
export function makeNoiseTexture({ seed = 3, size = 512, base = '#777', var: vr = 30, scaleX = 8, scaleY = 8, streak = 0 } = {}) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'); const img = g.createImageData(size, size);
  const col = new THREE.Color(base); const r = rng(seed); const o = r() * 50;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let n = fbm(x / size * scaleX + o, y / size * scaleY, 5);
    if (streak) n = n * 0.4 + Math.sin((y / size) * streak * Math.PI * 2 + fbm(x / size * 2, y / size * 20) * 6) * 0.3;
    const k = n * vr;
    const i = (y * size + x) * 4;
    img.data[i] = THREE.MathUtils.clamp(col.r * 255 + k, 0, 255);
    img.data[i + 1] = THREE.MathUtils.clamp(col.g * 255 + k, 0, 255);
    img.data[i + 2] = THREE.MathUtils.clamp(col.b * 255 + k, 0, 255);
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t;
}

// Handkamera-Wackler: kleine, organische Rotation
export function handheld(t, amount = 1) {
  return {
    x: amount * 0.006 * (noise2(t * 0.7, 1.3) + 0.4 * noise2(t * 2.1, 7.7)),
    y: amount * 0.008 * (noise2(t * 0.6, 4.2) + 0.4 * noise2(t * 1.9, 9.1)),
    z: amount * 0.004 * noise2(t * 0.5, 2.8),
  };
}

// Kamera setzen: Position, Ziel, Brennweite, Wackeln
export function placeCamera(cam, pos, target, fov, t, shake = 1) {
  cam.position.copy(pos); cam.fov = fov; cam.updateProjectionMatrix();
  cam.lookAt(target);
  const h = handheld(t, shake);
  cam.rotateX(h.x); cam.rotateY(h.y); cam.rotateZ(h.z);
}
