// Watt bei Ebbe (ab Teil 5): Schlickfläche mit Rippelmarken und Prielen, Flutwasser mit Schaumkante,
// Stiefelabdrücke. Arbeitet mit createWorld(): Insel/Turm/Haus bleiben, das Meer wird durch die Flut ersetzt.
import * as THREE from 'three';
import { islandHeight } from './world.js';
import { rng, fbm, noise2, smooth } from './lib.js';

export const FLAT = { cx: 20, cz: -18, size: 300 };   // Ausdehnung von Schlick und Flutwasser

// Höhe des Schlicks: fällt von der Insel weg sanft ab, Priele als gewundene Rinnen
export function mudHeight(x, z) {
  const r = Math.hypot(x, z);
  let h = -1.75 - 0.011 * Math.max(0, r - 18);
  h += 0.12 * fbm(x * 0.05 + 3, z * 0.05 - 7, 3) + 0.03 * noise2(x * 0.6, z * 0.6);
  const ch = Math.abs(fbm(x * 0.018 + 11, z * 0.018 + 4, 3) + 0.15 * noise2(x * 0.09, z * 0.09));
  h -= 0.85 * smooth(0.07, 0.0, ch) * smooth(18, 28, r);
  return h;
}
// Oberfläche, auf der man läuft (Insel oder Schlick)
export const groundHeight = (x, z) => Math.max(islandHeight(x, z), mudHeight(x, z));

// Rippelmarken als Normal-/Rauheitskarte (kachelbar)
function makeRippleMaps(size = 512) {
  const hgt = new Float32Array(size * size); const r = rng(55);
  const o = r() * 10;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const u = x / size, v = y / size;
    const warp = 0.9 * Math.sin((u + 0.3 * Math.sin(v * 6.283 * 2 + o)) * 6.283) + 0.6 * Math.sin(v * 6.283 * 3 + u * 6.283);
    const s = Math.sin((v * 14 + warp * 0.6) * 6.283);
    hgt[y * size + x] = Math.pow(0.5 + 0.5 * s, 1.6) + 0.15 * Math.sin((u * 37 + v * 11) * 6.283) * Math.sin(v * 23 * 6.283);
  }
  const nc = document.createElement('canvas'); nc.width = nc.height = size; const ng = nc.getContext('2d'); const nd = ng.createImageData(size, size);
  const rc = document.createElement('canvas'); rc.width = rc.height = size; const rg = rc.getContext('2d'); const rd = rg.createImageData(size, size);
  const H = (x, y) => hgt[((y + size) % size) * size + ((x + size) % size)];
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const dx = (H(x + 1, y) - H(x - 1, y)) * 2.2, dy = (H(x, y + 1) - H(x, y - 1)) * 2.2;
    const l = Math.hypot(dx, dy, 1); const i = (y * size + x) * 4;
    nd.data[i] = (-dx / l * 0.5 + 0.5) * 255; nd.data[i + 1] = (dy / l * 0.5 + 0.5) * 255; nd.data[i + 2] = (1 / l * 0.5 + 0.5) * 255; nd.data[i + 3] = 255;
    // Täler bleiben nass (glatt), Kämme trocknen (rauer)
    const rough = 0.12 + 0.55 * H(x, y);
    rd.data[i] = rd.data[i + 1] = rd.data[i + 2] = Math.min(255, rough * 255); rd.data[i + 3] = 255;
  }
  ng.putImageData(nd, 0, 0); rg.putImageData(rd, 0, 0);
  const n = new THREE.CanvasTexture(nc), ro = new THREE.CanvasTexture(rc);
  [n, ro].forEach((t) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(70, 70); t.anisotropy = 8; });
  return { normal: n, rough: ro };
}

function buildMud() {
  const N = 330; const g = new THREE.PlaneGeometry(FLAT.size, FLAT.size, N, N); g.rotateX(-Math.PI / 2);
  const pos = g.attributes.position; const col = [];
  const mud = new THREE.Color(0x3a3a33), dark = new THREE.Color(0x1d211f), sandy = new THREE.Color(0x6b6553), weed = new THREE.Color(0x26301f);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) + FLAT.cx, z = pos.getZ(i) + FLAT.cz;
    const y = mudHeight(x, z); pos.setY(i, y);
    const n = fbm(x * 0.08, z * 0.08, 3), n2 = noise2(x * 0.5, z * 0.5);
    const c = mud.clone().lerp(sandy, Math.max(0, n) * 0.9).lerp(dark, smooth(-2.0, -2.6, y + 0.2 * n2) * 0.8);
    if (fbm(x * 0.15 + 9, z * 0.15, 2) > 0.25) c.lerp(weed, 0.5);
    c.multiplyScalar(0.9 + 0.2 * n2); col.push(c.r, c.g, c.b);
  }
  g.translate(FLAT.cx, 0, FLAT.cz);
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.computeVertexNormals();
  const maps = makeRippleMaps();
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, roughnessMap: maps.rough, normalMap: maps.normal, normalScale: new THREE.Vector2(0.9, 0.9), metalness: 0.08 });
  const mesh = new THREE.Mesh(g, m); mesh.receiveShadow = true; mesh.name = 'mud';
  return mesh;
}

// Höhenkarte des Schlicks für den Wasser-Shader (Schaumkante dort, wo das Wasser flach ist)
function mudHeightTexture(res = 512) {
  const d = new Float32Array(res * res);
  for (let y = 0; y < res; y++) for (let x = 0; x < res; x++) {
    const wx = FLAT.cx + (x / (res - 1) - 0.5) * FLAT.size, wz = FLAT.cz + (y / (res - 1) - 0.5) * FLAT.size;
    d[y * res + x] = groundHeight(wx, wz);
  }
  const t = new THREE.DataTexture(d, res, res, THREE.RedFormat, THREE.FloatType);
  t.minFilter = t.magFilter = THREE.LinearFilter; t.needsUpdate = true; return t;
}

function buildFlood() {
  const g = new THREE.PlaneGeometry(FLAT.size, FLAT.size, 360, 360); g.rotateX(-Math.PI / 2); g.translate(FLAT.cx, 0, FLAT.cz);
  const m = new THREE.MeshStandardMaterial({ color: 0x0b2a2e, roughness: 0.12, metalness: 0.4 });
  const U = { uLevel: { value: -3 }, uTime: { value: 0 }, uRush: { value: 0 }, uMud: { value: mudHeightTexture() },
    uFlat: { value: new THREE.Vector3(FLAT.cx, FLAT.cz, FLAT.size) }, uDir: { value: new THREE.Vector2(-0.55, 0.83) } };
  m.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, U);
    const common = `uniform float uLevel, uTime, uRush; uniform sampler2D uMud; uniform vec3 uFlat; uniform vec2 uDir; varying float vDepth; varying vec2 vXZ;
      float wv(vec2 p){ float t=uTime; vec2 d=uDir;
        float a = 0.05*sin(dot(p,vec2(0.37,0.11))+t*1.3) + 0.035*sin(dot(p,vec2(-0.21,0.43))-t*1.7) + 0.02*sin(dot(p,vec2(0.9,-0.7))+t*2.9);
        float s = dot(p,d);                               // Flutwellen laufen Richtung Insel
        a += uRush*(0.14*sin(s*0.45 - t*4.2) + 0.06*sin(s*1.3 - t*6.0 + p.x*0.2));
        return a; }`;
    s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\n' + common)
      .replace('#include <beginnormal_vertex>', `vec3 objectNormal = vec3(0.0,1.0,0.0);
        { vec2 p = position.xz; float e = 0.35; float hx = wv(p+vec2(e,0.0))-wv(p-vec2(e,0.0)); float hz = wv(p+vec2(0.0,e))-wv(p-vec2(0.0,e));
          objectNormal = normalize(vec3(-hx/(2.0*e), 1.0, -hz/(2.0*e))); }`)
      .replace('#include <begin_vertex>', `vec3 transformed = position; transformed.y = uLevel + wv(position.xz);
        vec2 uvm = (position.xz - uFlat.xy) / uFlat.z + 0.5; vDepth = transformed.y - texture2D(uMud, uvm).r; vXZ = position.xz;`);
    s.fragmentShader = s.fragmentShader.replace('#include <common>', `#include <common>
        uniform float uTime, uRush; varying float vDepth; varying vec2 vXZ;
        float hh(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
        float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(hh(i),hh(i+vec2(1,0)),f.x),mix(hh(i+vec2(0,1)),hh(i+vec2(1,1)),f.x),f.y); }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        float n = vn(vXZ*1.7 + uTime*vec2(0.3,-0.5)) * vn(vXZ*0.6 - uTime*0.2);
        float edge = smoothstep(0.05 + 0.08*uRush, 0.0, vDepth) * (0.35 + 0.8*n);
        float streak = uRush * smoothstep(0.62, 0.9, vn(vXZ*vec2(0.4,2.0) + uTime*vec2(0.0,-1.5))) * 0.35;
        float foam = clamp(edge + streak, 0.0, 0.75);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.42,0.52,0.52), foam);`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = mix(roughnessFactor, 0.7, clamp(smoothstep(0.08,0.0,vDepth)*0.8,0.0,1.0));`);
  };
  m.customProgramCacheKey = () => 'flood5';
  const mesh = new THREE.Mesh(g, m); mesh.name = 'flood'; mesh.receiveShadow = true; mesh.frustumCulled = false;
  mesh.userData.U = U;
  return mesh;
}

// Stiefelabdruck (Profilsohle), Spitze in -z
let bootTex = null;
function makeBootTexture() {
  if (bootTex) return bootTex;
  const c = document.createElement('canvas'); c.width = 128; c.height = 320; const g = c.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, 128, 320); g.filter = 'blur(2px)';
  g.fillStyle = '#fff';
  g.beginPath(); g.ellipse(64, 95, 46, 80, 0, 0, Math.PI * 2); g.fill();       // Vorderfuß
  g.beginPath(); g.ellipse(62, 250, 38, 52, 0, 0, Math.PI * 2); g.fill();      // Absatz
  g.fillRect(34, 120, 58, 120);
  g.filter = 'none'; g.fillStyle = 'rgba(0,0,0,0.55)';                          // Profilrillen
  for (let y = 30; y < 300; y += 22) { if (y > 175 && y < 200) continue; g.fillRect(18, y, 92, 7); }
  bootTex = new THREE.CanvasTexture(c); return bootTex;
}

// Abdrücke im Schlick: dunkle, nasse Mulden, in denen Wasser steht
export function createBootprints(path, { stride = 0.7, width = 0.14, size = 0.33, seed = 5 } = {}) {
  const curve = new THREE.CatmullRomCurve3(path); const n = Math.max(2, Math.floor(curve.getLength() / stride));
  const geo = new THREE.PlaneGeometry(size * 0.42, size); geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshStandardMaterial({ color: 0x0a0f0e, roughness: 0.05, metalness: 0.45, transparent: true, opacity: 0.92, alphaMap: makeBootTexture(),
    depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
  const grp = new THREE.Group(); const r = rng(seed); const prints = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n; const p = curve.getPointAt(u); const tan = curve.getTangentAt(u); tan.y = 0; tan.normalize();
    const side = i % 2 ? -1 : 1; const perp = new THREE.Vector3(-tan.z, 0, tan.x);
    const m = new THREE.Mesh(geo, mat); m.position.copy(p).addScaledVector(perp, side * width);
    m.position.y = groundHeight(m.position.x, m.position.z) + 0.03;
    m.rotation.y = Math.atan2(-tan.x, -tan.z) + (r() - 0.5) * 0.12; m.scale.x = side; m.userData.u = u;
    grp.add(m); prints.push(m);
  }
  grp.userData = { curve, prints, reveal(k) { prints.forEach((m) => { m.visible = m.userData.u <= k + 1e-6; }); } };
  return grp;
}

// Watt in eine bestehende Welt (createWorld) einsetzen
export function addWatt(world) {
  const mud = buildMud(); world.scene.add(mud);
  const flood = buildFlood(); world.scene.add(flood);
  world.sea.visible = false; world.wreck.visible = false;
  const state = { level: -2.9, rush: 0 };
  return { mud, flood, state,
    update(t) { const U = flood.userData.U; U.uLevel.value = state.level; U.uTime.value = t; U.uRush.value = state.rush; } };
}
