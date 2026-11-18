// Schauplätze (Sets). Jedes Set: { scene, marks, bounds, update(t, s), lights } – Bühne um den Ursprung, Boden y = 0.
// Ort-Typen: stollen, tunnel, hoehle, werk, strasse, halle, raum, wald, meer, schnee, wueste
// zeit: nacht | daemmerung | tag   ·   wetter: klar | nebel | regen | schnee | sturm
import * as THREE from 'three';
import { rng, fbm, noise2, makeNoiseTexture, makeFogTexture, clamp01 } from './lib.js';
import { makeBeamCone } from './figuren.js';

const M = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...o });
const box = (w, h, d, m, x = 0, y = 0, z = 0) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; return b; };
const cyl = (r1, r2, h, m, seg = 12) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), m); c.castShadow = c.receiveShadow = true; return c; };

const texCache = {};
const tex = (key, o) => texCache[key] || (texCache[key] = makeNoiseTexture(o));
export const TEX = {
  rock: () => tex('rock', { seed: 11, base: '#5c5248', var: 70, scaleX: 10, scaleY: 10 }),
  rockDark: () => tex('rockD', { seed: 12, base: '#3b342e', var: 55, scaleX: 12, scaleY: 12 }),
  wood: () => tex('wood', { seed: 13, base: '#5a4330', var: 40, scaleX: 3, scaleY: 30, streak: 6 }),
  concrete: () => tex('conc', { seed: 14, base: '#7d7b76', var: 34, scaleX: 14, scaleY: 14 }),
  asphalt: () => tex('asph', { seed: 15, base: '#2c2d30', var: 22, scaleX: 30, scaleY: 30 }),
  mud: () => tex('mud', { seed: 16, base: '#4a3e30', var: 40, scaleX: 8, scaleY: 8 }),
  grass: () => tex('grass', { seed: 17, base: '#3d4a2c', var: 40, scaleX: 16, scaleY: 16 }),
  snow: () => tex('snow', { seed: 18, base: '#dfe6ee', var: 14, scaleX: 6, scaleY: 6 }),
  sand: () => tex('sand', { seed: 19, base: '#c49a62', var: 26, scaleX: 9, scaleY: 9 }),
  brick: () => { if (texCache.brick) return texCache.brick; const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d'); const r = rng(4);
    g.fillStyle = '#3a2f2a'; g.fillRect(0, 0, 512, 512);
    for (let y = 0; y < 16; y++) for (let x = -1; x < 9; x++) { const v = 90 + r() * 50; g.fillStyle = `rgb(${v + 30},${v * 0.55},${v * 0.42})`; g.fillRect(x * 64 + (y % 2) * 32 + 2, y * 32 + 2, 60, 28); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return (texCache.brick = t); },
};
const rep = (t, x, y) => { const c = t.clone(); c.needsUpdate = true; c.repeat.set(x, y); return c; };

// Verdrängte Fels-Fläche (für Stollen/Höhlen)
function rockPlane(w, h, sx, sy, amp, seed, m) {
  const g = new THREE.PlaneGeometry(w, h, sx, sy); const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, fbm(x * 0.6 + seed, y * 0.6, 4) * amp + fbm(x * 2.5, y * 2.5 + seed, 2) * amp * 0.3); }
  g.computeVertexNormals(); const mesh = new THREE.Mesh(g, m); mesh.receiveShadow = true; mesh.castShadow = true; return mesh;
}

// Glühbirne mit Lichthof
function glowSprite(color = 0xffc070, size = 1) {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.2, 'rgba(255,255,255,0.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); s.scale.setScalar(size); return s;
}
export { glowSprite };

// Schwebende Partikel (Staub/Asche/Schnee/Regen) als Points – deterministisch über t
export function createParticles({ count = 600, box: b = [12, 6, 20], center = [0, 2, 0], color = 0xd8d0c0, size = 0.03, kind = 'staub', opacity = 0.6 } = {}) {
  const geo = new THREE.BufferGeometry(); const r = rng(count + 7); const base = new Float32Array(count * 3), pos = new Float32Array(count * 3), ph = new Float32Array(count);
  for (let i = 0; i < count; i++) { base[i * 3] = (r() - 0.5) * b[0]; base[i * 3 + 1] = r() * b[1]; base[i * 3 + 2] = (r() - 0.5) * b[2]; ph[i] = r() * 100; }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d'); const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32);
  const m = new THREE.PointsMaterial({ color, size: kind === 'regen' ? size * 0.6 : size, map: new THREE.CanvasTexture(c), transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true });
  const pts = new THREE.Points(geo, m); pts.position.set(...center); pts.frustumCulled = false;
  pts.userData.update = (t) => {
    for (let i = 0; i < count; i++) {
      let x = base[i * 3], y = base[i * 3 + 1], z = base[i * 3 + 2]; const p = ph[i];
      if (kind === 'schnee') { y = ((y - t * 0.8 - p) % b[1] + b[1]) % b[1]; x += Math.sin(t * 0.7 + p) * 0.4 + t * 0.6; x = ((x + b[0] / 2) % b[0] + b[0]) % b[0] - b[0] / 2; }
      else if (kind === 'regen') { y = ((y - t * 9 - p) % b[1] + b[1]) % b[1]; x += t * 0.8; x = ((x + b[0] / 2) % b[0] + b[0]) % b[0] - b[0] / 2; }
      else if (kind === 'funken' || kind === 'glut') { y = ((y + t * 0.9 + p) % b[1] + b[1]) % b[1]; x += Math.sin(t * 2 + p) * 0.3; }
      else { x += Math.sin(t * 0.13 + p) * 0.5; y += Math.sin(t * 0.17 + p * 1.3) * 0.25; z += Math.cos(t * 0.11 + p) * 0.5; }
      pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
    }
    geo.attributes.position.needsUpdate = true;
  };
  return pts;
}

// Nebelschwaden (Billboards)
function fogCards(scene, n, area, y, color, opacity, seed = 3) {
  const t = makeFogTexture(seed); const r = rng(seed); const g = new THREE.Group();
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: t, color, transparent: true, opacity: opacity * (0.5 + r() * 0.5), depthWrite: false, fog: true }));
    const s = 6 + r() * 10; m.scale.set(s * 1.6, s * 0.6, 1); m.position.set((r() - 0.5) * area[0], y + r() * 2, (r() - 0.5) * area[1]); m.userData.ph = r() * 10; m.userData.op = m.material.opacity; g.add(m);
  }
  g.userData.update = (t, cam) => { const dir = cam ? new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion) : null; const k = dir ? clamp01((0.55 + dir.y) / 0.3) * clamp01((7 - cam.position.y) / 3) : 1;
    g.visible = k > 0.02; g.children.forEach((m) => { if (cam) m.quaternion.copy(cam.quaternion); m.material.opacity = m.userData.op * k; m.position.x += Math.sin(t * 0.05 + m.userData.ph) * 0.004; }); };
  scene.add(g); return g;
}

// Himmel: Verlauf + Sterne/Mond
function skyDome(scene, top, bottom, { stars = 0, moon = null } = {}) {
  const c = document.createElement('canvas'); c.width = 4; c.height = 256; const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, top); gr.addColorStop(0.55, bottom); gr.addColorStop(1, bottom); g.fillStyle = gr; g.fillRect(0, 0, 4, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const dome = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), new THREE.MeshBasicMaterial({ map: t, side: THREE.BackSide, fog: false, depthWrite: false }));
  dome.renderOrder = -10; scene.add(dome);
  if (stars) { const r = rng(9); const p = []; for (let i = 0; i < stars; i++) { const a = r() * Math.PI * 2, e = 0.15 + r() * 1.2; p.push(Math.cos(a) * Math.cos(e) * 380, Math.sin(e) * 380, Math.sin(a) * Math.cos(e) * 380); }
    const g2 = new THREE.BufferGeometry(); g2.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); scene.add(new THREE.Points(g2, new THREE.PointsMaterial({ color: 0xcfd8e8, size: 1.3, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.8 }))); }
  if (moon) { const m = glowSprite(0xdfe8ff, 60); m.position.set(...moon); m.material.fog = false; scene.add(m); const core = glowSprite(0xffffff, 14); core.position.set(...moon); core.material.fog = false; scene.add(core); }
  return dome;
}

const LIGHTING = {
  nacht: { bg: '#0b1620', fog: '#132430', hemi: ['#6a8ca6', '#161a1e', 1.25], key: ['#9fc0e0', 1.8], fogD: 0.02, sky: ['#02070d', '#13232f'], stars: 900, exposure: 1.15 },
  daemmerung: { bg: '#2a2a38', fog: '#3a3640', hemi: ['#8a90a8', '#201814', 1.0], key: ['#ffb070', 2.2], fogD: 0.02, sky: ['#1c2440', '#b06a48'], stars: 120, exposure: 1.0 },
  tag: { bg: '#8fa3b0', fog: '#9fb0b8', hemi: ['#c8dcec', '#4a4436', 1.6], key: ['#fff1dc', 3.0], fogD: 0.012, sky: ['#4f7ea8', '#c9d8e0'], stars: 0, exposure: 0.85 },
  innen: { bg: '#0a0a0a', fog: '#0a0a0a', hemi: ['#6a6a70', '#141210', 0.4], key: ['#ffe4c0', 0.0], fogD: 0.03, sky: null, exposure: 1.1 },
};

function baseSet(o = {}) {
  const zeit = o.zeit || 'nacht'; const L = LIGHTING[o.innen ? 'innen' : zeit] || LIGHTING.nacht;
  const scene = new THREE.Scene(); scene.background = new THREE.Color(L.bg);
  let fogD = L.fogD * (o.wetter === 'nebel' ? 1.5 : o.wetter === 'sturm' ? 1.6 : o.wetter === 'schnee' ? 1.7 : 1) * (o.fogMul ?? 1);
  scene.fog = new THREE.FogExp2(L.fog, fogD);
  const hemi = new THREE.HemisphereLight(L.hemi[0], L.hemi[1], L.hemi[2]); scene.add(hemi);
  const key = new THREE.DirectionalLight(L.key[0], L.key[1]); key.position.set(-12, 22, 10); key.castShadow = L.key[1] > 0;
  key.shadow.mapSize.set(1024, 1024); const sc = key.shadow.camera; sc.left = -18; sc.right = 18; sc.top = 18; sc.bottom = -18; sc.near = 1; sc.far = 80; key.shadow.bias = -0.0005; key.shadow.normalBias = 0.03;
  scene.add(key, key.target);
  if (!o.innen && L.sky) skyDome(scene, L.sky[0], L.sky[1], { stars: o.wetter === 'klar' || !o.wetter ? L.stars : 0, moon: zeit === 'nacht' ? [-120, 140, -260] : null });
  const updaters = [];
  if (o.wetter === 'regen' || o.wetter === 'sturm') { const p = createParticles({ count: 1800, box: [16, 10, 18], center: [0, 0, 0], kind: 'regen', size: 0.05, color: 0xaabbcc, opacity: 0.5 }); scene.add(p); updaters.push(p.userData.update); }
  if (o.wetter === 'schnee') { const p = createParticles({ count: 1500, box: [16, 9, 18], center: [0, 0, 0], kind: 'schnee', size: 0.06, color: 0xffffff, opacity: 0.85 }); scene.add(p); updaters.push(p.userData.update); }
  return { scene, hemi, key, L, zeit, wetter: o.wetter || 'klar', updaters, fogBase: fogD, exposure: L.exposure };
}

function finish(B, extra) {
  // Figuren-Licht: weiches Führungslicht von der Kamera aus + Kantenlicht von hinten (Lesbarkeit der Figuren)
  const charKey = new THREE.SpotLight(0xffe6cc, 0, 14, 0.5, 0.9, 1.3); const charRim = new THREE.SpotLight(0x9ec4ff, 0, 12, 0.6, 0.8, 1.3);
  B.scene.add(charKey, charKey.target, charRim, charRim.target);
  const kindLevel = extra.kind === 'innen' ? 1 : 0.8;
  B.charLight = (cam, focus, level = 1) => {
    const off = new THREE.Vector3(-0.8, 0.9, 0).applyQuaternion(cam.quaternion);
    charKey.position.copy(cam.position).add(off); charKey.target.position.copy(focus); const dk = cam.position.distanceTo(focus); charKey.intensity = 3.2 * Math.pow(Math.max(dk, 0.8), 1.3) * level * kindLevel;
    const back = focus.clone().sub(cam.position).setY(0).normalize();
    charRim.position.copy(focus).add(back.multiplyScalar(2.2)).add(new THREE.Vector3(0.6, 1.6, 0)); charRim.target.position.copy(focus); charRim.intensity = 14 * level * kindLevel;
  };
  const S = { ...B, ...extra };
  S.update = (t, cam, st = {}) => {
    B.updaters.forEach((u) => u(t, cam, st));
    extra.onUpdate?.(t, cam, st);
  };
  return S;
}

// ======================================================================= STOLLEN / TUNNEL
// Langer Gang entlang der z-Achse (z = +12 … −60). stil: 'bergwerk' (Fels + Holz-Türstöcke + Gleise) | 'beton' (Industrie-Tunnel)
function buildTunnel(o) {
  const B = baseSet({ ...o, innen: true }); const { scene } = B; const style = o.ort === 'tunnel' ? 'beton' : 'bergwerk';
  const Wd = style === 'beton' ? 4.4 : 3.4, Ht = style === 'beton' ? 3.6 : 2.7, z0 = 14, z1 = -62, len = z0 - z1, zc = (z0 + z1) / 2;
  B.hemi.intensity = 0.7; B.hemi.color.set('#9a8c78'); B.hemi.groundColor.set('#1a140f');
  if (style === 'bergwerk') {
    const rm = M(0x8a7a68, { map: rep(TEX.rock(), 6, 1.5), roughness: 0.95 });
    const wl = rockPlane(len, Ht + 0.6, 160, 12, 0.22, 1, rm); wl.rotation.y = Math.PI / 2; wl.position.set(-Wd / 2, Ht / 2, zc); scene.add(wl);
    const wr = rockPlane(len, Ht + 0.6, 160, 12, 0.22, 5, rm); wr.rotation.y = -Math.PI / 2; wr.position.set(Wd / 2, Ht / 2, zc); scene.add(wr);
    const ce = rockPlane(Wd + 0.6, len, 10, 160, 0.18, 9, M(0x6a5d50, { map: rep(TEX.rockDark(), 1, 6) })); ce.rotation.x = Math.PI / 2; ce.position.set(0, Ht, zc); scene.add(ce);
    const fl = rockPlane(Wd + 0.4, len, 12, 160, 0.04, 3, M(0x4a4036, { map: rep(TEX.mud(), 1, 12), roughness: 0.7 })); fl.rotation.x = -Math.PI / 2; fl.position.set(0, 0, zc); scene.add(fl);
    // Türstöcke (Holzausbau) + Verzug
    const wm = M(0x7a5c40, { map: rep(TEX.wood(), 1, 1) }); const r = rng(21);
    for (let z = z0 - 1; z > z1; z -= 1.7) {
      const tilt = (r() - 0.5) * 0.05;
      const pl = box(0.2, Ht, 0.2, wm, -Wd / 2 + 0.22, Ht / 2, z); pl.rotation.z = 0.06 + tilt; scene.add(pl);
      const pr = box(0.2, Ht, 0.2, wm, Wd / 2 - 0.22, Ht / 2, z); pr.rotation.z = -0.06 - tilt; scene.add(pr);
      const cap1 = box(Wd - 0.1, 0.22, 0.24, wm, 0, Ht - 0.12, z); cap1.rotation.z = tilt * 0.5; scene.add(cap1);
      for (let k = -1; k <= 1; k++) scene.add(box(0.1, 0.06, 1.7, wm, k * 0.9, Ht - 0.0, z - 0.85));
    }
    // Gleise + Schwellen
    const steel = M(0x5a5550, { metalness: 0.8, roughness: 0.45 }); const sl = M(0x3b2e22, { map: rep(TEX.wood(), 1, 1) });
    for (const x of [-0.3, 0.3]) scene.add(box(0.05, 0.07, len, steel, x, 0.1, zc));
    for (let z = z0; z > z1; z -= 0.6) scene.add(box(0.95, 0.06, 0.16, sl, 0, 0.04, z));
    // Kabel an der Wand + Grubenlampen
    const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, len, 6), M(0x111111)); cable.rotation.x = Math.PI / 2; cable.position.set(-Wd / 2 + 0.35, Ht - 0.3, zc); cable.castShadow = false; scene.add(cable);
  } else {
    const cm = M(0x9a968e, { map: rep(TEX.concrete(), 8, 2) });
    const arch = new THREE.Mesh(new THREE.CylinderGeometry(Wd / 2, Wd / 2, len, 40, 1, true, -Math.PI / 2, Math.PI), cm); arch.material.side = THREE.DoubleSide;
    arch.rotation.set(-Math.PI / 2, 0, 0); arch.position.set(0, Ht - Wd / 2, zc); arch.receiveShadow = true; scene.add(arch);
    const wl = box(0.1, Ht - Wd / 2 + 0.05, len, cm, -Wd / 2, (Ht - Wd / 2) / 2, zc); const wr = wl.clone(); wr.position.x = Wd / 2; scene.add(wl, wr);
    const fl = box(Wd, 0.1, len, M(0x3a3a3a, { map: rep(TEX.asphalt(), 2, 20), roughness: 0.55 }), 0, -0.05, zc); scene.add(fl);
    const pipeM = M(0x4f5a5c, { metalness: 0.7, roughness: 0.4 });
    for (const [x, y, r2] of [[-Wd / 2 + 0.25, 2.2, 0.12], [-Wd / 2 + 0.25, 1.85, 0.08], [Wd / 2 - 0.3, 2.4, 0.16]]) { const p = cyl(r2, r2, len, pipeM, 10); p.rotation.x = Math.PI / 2; p.position.set(x, y, zc); scene.add(p); }
    const walk = box(0.8, 0.25, len, M(0x6a6862), Wd / 2 - 0.4, 0.12, zc); scene.add(walk);
  }
  // Lampen
  const lampZ = []; for (let z = z0 - 3; z > z1; z -= 7) lampZ.push(z);
  const lamps = lampZ.map((z, i) => {
    const g = new THREE.Group(); g.position.set(style === 'beton' ? 0 : Wd / 2 - 0.45, Ht - 0.35, z);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(style === 'beton' ? 0.08 : 0.06, 10, 8), new THREE.MeshStandardMaterial({ color: 0x222222, emissive: style === 'beton' ? 0xd8ecff : 0xffc27a, emissiveIntensity: 6 }));
    if (style === 'beton') bulb.scale.set(1, 0.6, 10);
    g.add(bulb); const glow = glowSprite(style === 'beton' ? 0xc8e0ff : 0xffb060, 1.2); g.add(glow);
    let light = null; if (i < 6) { light = new THREE.PointLight(style === 'beton' ? 0xd8ecff : 0xffb46a, 9, 11, 1.6); g.add(light); if (i === 2) { light.castShadow = true; light.shadow.mapSize.set(512, 512); } }
    scene.add(g); return { g, bulb, glow, light, z };
  });
  const dust = createParticles({ count: 500, box: [Wd, Ht, 30], center: [0, 0, -6], color: 0xd8c8b0, size: 0.025, opacity: 0.55 }); scene.add(dust); B.updaters.push(dust.userData.update);
  const marks = { mitte: [0, 0, 0], links: [-0.55, 0, 0.25], rechts: [0.55, 0, -0.2], vorne: [0, 0, 4], hinten: [0, 0, -7], fern: [0, 0, -22], ende: [0, 0, -40], eingang: [0, 0, 10] };
  return finish(B, {
    marks, lamps, kind: 'innen', bounds: { x: [-Wd / 2 + 0.35, Wd / 2 - 0.35], y: [0.25, Ht - 0.3], z: [z1 + 2, z0 - 1] }, axis: 'z', width: Wd, height: Ht,
    onUpdate(t, cam, st) {
      const lvl = st.licht ?? 1; const fl = st.flackern ?? 0;
      lamps.forEach((l, i) => { let v = lvl; if (fl) v *= (noise2(t * 14 + i * 3.3, i) > -0.15 ? 1 : 0.08);
        l.bulb.material.emissiveIntensity = 6 * v; l.glow.material.opacity = v; if (l.light) l.light.intensity = 9 * v; });
    },
  });
}

// ======================================================================= HÖHLE / HOHLRAUM
function buildCave(o) {
  const B = baseSet({ ...o, innen: true }); const { scene } = B; B.hemi.intensity = 0.55; B.hemi.color.set('#8a8070');
  const rm = M(0x7a6c5e, { map: rep(TEX.rock(), 3, 3), roughness: 0.95, side: THREE.BackSide });
  const g = new THREE.SphereGeometry(5, 64, 40); const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const v = new THREE.Vector3().fromBufferAttribute(p, i); const n = 1 + fbm(v.x * 0.35 + 3, v.y * 0.35 + v.z * 0.35, 4) * 0.35 + fbm(v.x * 1.4, v.z * 1.4 + v.y, 2) * 0.08;
    v.multiplyScalar(n); v.x *= 1.2; v.z *= 1.5; v.y = v.y * 0.42 + 1.0; if (v.y < 0) v.y = -0.05 + fbm(v.x, v.z, 2) * 0.05; p.setXYZ(i, v.x, v.y, v.z); }
  g.computeVertexNormals(); const cave = new THREE.Mesh(g, rm); cave.receiveShadow = true; scene.add(cave);
  const fl = rockPlane(16, 16, 60, 60, 0.12, 4, M(0x51473c, { map: rep(TEX.mud(), 3, 3) })); fl.rotation.x = -Math.PI / 2; fl.position.y = 0.0; scene.add(fl);
  // Geröll + Stützen
  const r = rng(31); const rk = M(0x5e5246, { map: rep(TEX.rockDark(), 1, 1) });
  for (let i = 0; i < 26; i++) { const s = 0.15 + r() * 0.5; const m = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), rk); const a = r() * Math.PI * 2, d = 2.6 + r() * 2.5; m.position.set(Math.cos(a) * d * 1.2, s * 0.4, Math.sin(a) * d * 1.3); m.rotation.set(r() * 3, r() * 3, r() * 3); m.castShadow = m.receiveShadow = true; scene.add(m); }
  const wm = M(0x5a4430, { map: rep(TEX.wood(), 1, 1) });
  for (const [x, z, rz] of [[-2.6, -2.2, 0.15], [2.4, -2.8, -0.25], [-3.0, 1.8, 0.4]]) { const b = box(0.18, 2.4, 0.18, wm, x, 1.1, z); b.rotation.z = rz; scene.add(b); }
  const water = new THREE.Mesh(new THREE.CircleGeometry(2.2, 40), new THREE.MeshStandardMaterial({ color: 0x1a1612, roughness: 0.05, metalness: 0.6 })); water.rotation.x = -Math.PI / 2; water.position.set(1.4, 0.03, 1.8); water.scale.set(1.3, 0.8, 1); scene.add(water);
  const dust = createParticles({ count: 300, box: [8, 3, 8], center: [0, 0, 0], color: 0xd8c8b0, size: 0.022, opacity: 0.5 }); scene.add(dust); B.updaters.push(dust.userData.update);
  const ambient = new THREE.PointLight(0xffd8a0, 0, 12, 1.2); ambient.position.set(0.3, 2.9, -1.2); scene.add(ambient);
  const marks = { mitte: [0, 0, 0], links: [-0.6, 0, 0.25], rechts: [0.6, 0, -0.2], hinten: [0, 0, -2.5], vorne: [0, 0, 2.2], wand: [0, 0, -3.6] };
  return finish(B, { marks, kind: 'innen', bounds: { x: [-3.8, 3.8], y: [0.3, 2.0], z: [-4.2, 4.6] }, ambient,
    onUpdate(t, cam, st) { ambient.intensity = 35 * (st.licht ?? 0.35); B.hemi.intensity = 0.35 + 0.9 * (st.licht ?? 0.35); } });
}

// ======================================================================= WERK (Industrie-Gelände draußen: Förderturm, Hallen, Scheinwerfer)
function headframe() {
  const g = new THREE.Group(); const sm = M(0x5a3a2c, { metalness: 0.6, roughness: 0.55 });
  const H2 = 22; const legs = [[-2.5, -2.5], [2.5, -2.5], [-2.5, 2.5], [2.5, 2.5]];
  legs.forEach(([x, z]) => { const l = box(0.35, H2, 0.35, sm, x * 0.75, H2 / 2, z * 0.75); l.rotation.z = -x * 0.012; l.rotation.x = z * 0.012; g.add(l); });
  for (let y = 2; y < H2; y += 2.4) { const s = 1 - y / H2 * 0.25; for (const [w, d, x, z] of [[5 * s * 0.75 * 2 / 2, 0.15, 0, 1.87 * s], [5 * s * 0.75 * 2 / 2, 0.15, 0, -1.87 * s]]) g.add(box(w * 1.0, 0.15, d, sm, x, y, z));
    g.add(box(0.15, 0.15, 3.7 * s, sm, 1.87 * s, y, 0)); g.add(box(0.15, 0.15, 3.7 * s, sm, -1.87 * s, y, 0));
    const d1 = box(0.1, 3.4, 0.1, sm, 1.87 * s, y + 1.2, 0); d1.rotation.x = 0.85; g.add(d1); const d2 = d1.clone(); d2.position.x = -1.87 * s; g.add(d2); }
  // Seilscheiben oben
  for (const z of [-0.8, 0.8]) { const w = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.12, 8, 28), sm); w.position.set(0, H2 + 0.6, z); w.castShadow = true; g.add(w);
    for (let k = 0; k < 6; k++) { const sp = box(0.06, 3, 0.06, sm, 0, H2 + 0.6, z); sp.rotation.z = k * Math.PI / 6; g.add(sp); } }
  g.add(box(4.2, 0.4, 3, sm, 0, H2 - 0.2, 0));
  const strut = box(0.4, 26, 0.4, sm, 0, 11, 9); strut.rotation.x = -0.42; g.add(strut);
  return g;
}
function shed(w, h, d, wallC, roofC, windows = true, seed = 1) {
  const g = new THREE.Group(); const r = rng(seed);
  g.add(box(w, h, d, M(wallC, { map: rep(TEX.brick(), w / 3, h / 3), roughness: 0.9 }), 0, h / 2, 0));
  const roof = box(w + 0.4, 0.3, d + 0.4, M(roofC, { roughness: 0.7 }), 0, h + 0.15, 0); g.add(roof);
  if (windows) { const wm = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0xffb860, emissiveIntensity: 1.6 }); const dm = new THREE.MeshStandardMaterial({ color: 0x0c0c0e, roughness: 0.3 });
    for (let x = -w / 2 + 1.2; x < w / 2 - 0.8; x += 2.0) for (let y = 1.6; y < h - 0.8; y += 2.6) { const on = r() > 0.45; const win = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.3), on ? wm : dm); win.position.set(x, y, d / 2 + 0.01); g.add(win); } }
  return g;
}
function buildWerk(o) {
  const B = baseSet(o); const { scene } = B;
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(260, 260, 1, 1), M(0x4a4238, { map: rep(TEX.mud(), 40, 40), roughness: 0.92 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const road = box(5, 0.02, 120, M(0x2c2c2e, { map: rep(TEX.asphalt(), 2, 30), roughness: 0.4 }), 0, 0.01, -20); scene.add(road);
  const hf = headframe(); hf.position.set(-9, 0, -24); scene.add(hf);
  const sheds = [[10, 0, -22, 14, 8, 10, 1], [-22, 0, -14, 10, 6, 14, 2], [16, 0, -40, 18, 11, 12, 3], [-12, 0, -44, 16, 7, 10, 4]];
  sheds.forEach(([x, y, z, w, h, d, s]) => { const sh = shed(w, h, d, s % 2 ? 0x8a5a48 : 0x6e5448, 0x2a2a2c, true, s); sh.position.set(x, y, z); sh.rotation.y = x > 0 ? -0.2 : 0.25; scene.add(sh); });
  const chim = cyl(1.0, 1.4, 34, M(0x6a4a3c, { map: rep(TEX.brick(), 2, 8) }), 16); chim.position.set(24, 17, -60); scene.add(chim);
  // Zaun
  const fm = M(0x3a3a3a, { metalness: 0.5 });
  for (let x = -30; x < 30; x += 3) { scene.add(box(0.08, 2, 0.08, fm, x, 1, 12)); scene.add(box(3, 0.05, 0.05, fm, x + 1.5, 1.9, 12)); scene.add(box(3, 0.05, 0.05, fm, x + 1.5, 1.0, 12)); }
  // Flutlichtmasten
  const floods = [[6, -6], [-7, -10], [3, -30]].map(([x, z], i) => {
    const pole = cyl(0.12, 0.16, 12, fm, 8); pole.position.set(x, 6, z); scene.add(pole);
    const head = box(1.4, 0.6, 0.4, M(0x222222), x, 12, z); scene.add(head);
    const glow = glowSprite(0xfff0d8, 5); glow.position.set(x, 12, z + 0.3); scene.add(glow);
    const sp = new THREE.SpotLight(0xfff0d8, 400, 60, 0.6, 0.6, 1.6); sp.position.set(x, 12, z); sp.target.position.set(x * 0.3, 0, z + 8); if (i === 0) { sp.castShadow = true; sp.shadow.mapSize.set(1024, 1024); } scene.add(sp, sp.target);
    const cone = makeBeamCone(16, 6, 0xfff0d8); cone.position.set(x, 12, z); cone.lookAt(x * 0.3, 0, z + 8); cone.rotateX(-Math.PI / 2); cone.material.uniforms.uInt.value = 0.16; scene.add(cone);
    return { sp, glow, cone };
  });
  if (B.zeit === 'tag') floods.forEach((f) => { f.sp.intensity = 0; f.glow.visible = false; f.cone.visible = false; });
  const fog = fogCards(scene, 16, [80, 70], 0.5, B.L.fog, 0.35); B.updaters.push(fog.userData.update);
  const dust = createParticles({ count: 400, box: [26, 9, 30], center: [0, 0, 0], color: 0xe8e0d0, size: 0.04, opacity: 0.4 }); scene.add(dust); B.updaters.push(dust.userData.update);
  const marks = { mitte: [0, 0, 0], links: [-0.6, 0, 0.25], rechts: [0.6, 0, -0.2], vorne: [0, 0, 5], hinten: [0, 0, -9], turm: [-6, 0, -18], halle: [8, 0, -14], tor: [0, 0, 11], fern: [0, 0, -30] };
  return finish(B, { marks, kind: 'aussen', bounds: null, floods, headframe: hf });
}

// ======================================================================= STRASSE (Stadt, nass)
function buildStrasse(o) {
  const B = baseSet(o); const { scene } = B;
  const road = box(9, 0.1, 160, M(0x1d1e21, { map: rep(TEX.asphalt(), 3, 50), roughness: 0.22, metalness: 0.25 }), 0, -0.05, -40); scene.add(road);
  for (const s of [-1, 1]) { scene.add(box(3, 0.22, 160, M(0x5a5a58, { map: rep(TEX.concrete(), 2, 60) }), s * 6, 0.06, -40)); }
  const lineM = new THREE.MeshBasicMaterial({ color: 0xbbbbaa }); for (let z = 30; z > -110; z -= 6) { const l = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 2.6), lineM); l.rotation.x = -Math.PI / 2; l.position.set(0, 0.011, z); scene.add(l); }
  const r = rng(51); const lamps = [];
  for (const s of [-1, 1]) for (let z = 18; z > -110; z -= r() * 4 + 9) {
    const w = 7 + r() * 5, h = 9 + r() * 14, d = 9; const b = shed(w, h, d, [0x6a5248, 0x5a5a60, 0x7a6a58, 0x4a4a52][Math.floor(r() * 4)], 0x222224, true, Math.floor(r() * 1000));
    b.position.set(s * (7.5 + d / 2), 0, z - w / 2); b.rotation.y = -s * Math.PI / 2; scene.add(b); z -= w;
  }
  for (const s of [-1, 1]) for (let z = 14; z > -90; z -= 16) {
    const pole = cyl(0.07, 0.09, 5.2, M(0x2a2a2a, { metalness: 0.6 }), 8); pole.position.set(s * 5, 2.6, z + s * 4); scene.add(pole);
    const arm = box(1.2, 0.06, 0.06, M(0x2a2a2a), s * 4.5, 5.2, z + s * 4); scene.add(arm);
    const glow = glowSprite(0xffb46a, 2.6); glow.position.set(s * 4, 5.1, z + s * 4); scene.add(glow);
    if (lamps.length < 5) { const pl = new THREE.PointLight(0xffb46a, 30, 18, 1.7); pl.position.set(s * 4, 5.0, z + s * 4); scene.add(pl); lamps.push(pl); }
  }
  const fog = fogCards(scene, 12, [30, 90], 0.3, B.L.fog, 0.3); B.updaters.push(fog.userData.update);
  const marks = { mitte: [0, 0, 0], links: [-0.6, 0, 0.25], rechts: [0.6, 0, -0.2], vorne: [0, 0, 5], hinten: [0, 0, -9], gehweg: [5.5, 0, 0], fern: [0, 0, -35] };
  return finish(B, { marks, kind: 'aussen', bounds: null });
}

// ======================================================================= HALLE (Fabrik innen)
function buildHalle(o) {
  const B = baseSet({ ...o, innen: true }); const { scene } = B; B.hemi.intensity = 0.5;
  const Wd = 22, Ln = 50, Ht = 11;
  scene.add(box(Wd, 0.2, Ln, M(0x55534e, { map: rep(TEX.concrete(), 6, 14), roughness: 0.6 }), 0, -0.1, -10));
  const wm = M(0x6a5a50, { map: rep(TEX.brick(), 8, 4) }); scene.add(box(0.4, Ht, Ln, wm, -Wd / 2, Ht / 2, -10), box(0.4, Ht, Ln, wm, Wd / 2, Ht / 2, -10), box(Wd, Ht, 0.4, wm, 0, Ht / 2, -35));
  const sm = M(0x3c4448, { metalness: 0.7, roughness: 0.5 });
  for (let z = 12; z > -34; z -= 6) for (const x of [-7, 7]) { scene.add(box(0.4, Ht, 0.4, sm, x, Ht / 2, z)); } for (let z = 12; z > -34; z -= 6) scene.add(box(Wd, 0.5, 0.3, sm, 0, Ht - 0.4, z));
  // Oberlichter (Mond/Tag fällt als Strahl)
  const skyM = new THREE.MeshStandardMaterial({ color: 0x223344, emissive: B.zeit === 'tag' ? 0xcfe0f0 : 0x2a3a50, emissiveIntensity: 1.2 });
  for (let z = 9; z > -32; z -= 6) { const s = new THREE.Mesh(new THREE.PlaneGeometry(4, 3), skyM); s.rotation.x = Math.PI / 2; s.position.set(0, Ht - 0.05, z); scene.add(s);
    const beam = makeBeamCone(Ht, 2.4, B.zeit === 'tag' ? 0xfff4e0 : 0x8ab0d8); beam.position.set(0, Ht, z); beam.rotation.z = 0.25; beam.material.uniforms.uInt.value = 0.18; scene.add(beam); }
  // Maschinen
  const r = rng(61); const mm = [M(0x4a5a52, { metalness: 0.5, roughness: 0.5 }), M(0x6a5030, { metalness: 0.4 }), M(0x3a3e44, { metalness: 0.6 })];
  for (let i = 0; i < 9; i++) { const x = (i % 2 ? 1 : -1) * (3.5 + r() * 4), z = 6 - i * 4.6; const w = 2 + r() * 2, h = 1.4 + r() * 2.6;
    const m = box(w, h, 2 + r() * 1.5, mm[i % 3], x, h / 2, z); scene.add(m); const p = cyl(0.15, 0.15, Ht - h, sm, 8); p.position.set(x, h + (Ht - h) / 2, z); scene.add(p); }
  const cat = box(1.6, 0.12, Ln - 4, M(0x3a3a3a, { metalness: 0.6 }), -Wd / 2 + 1.2, 5, -10); scene.add(cat);
  const lamps = [];
  for (let z = 8; z > -30; z -= 9) for (const x of [-4, 4]) { const shade = new THREE.Mesh(new THREE.ConeGeometry(0.6, 0.4, 16, 1, true), M(0x2a2a2a, { side: THREE.DoubleSide })); shade.position.set(x, 7, z); scene.add(shade);
    const glow = glowSprite(0xffd8a0, 1.6); glow.position.set(x, 6.8, z); scene.add(glow);
    if (lamps.length < 5) { const sp = new THREE.SpotLight(0xffd8a0, 90, 16, 0.7, 0.6, 1.5); sp.position.set(x, 6.8, z); sp.target.position.set(x, 0, z); if (!lamps.length) sp.castShadow = true; scene.add(sp, sp.target); lamps.push({ sp, glow }); } }
  const dust = createParticles({ count: 600, box: [16, 9, 30], center: [0, 0, -8], color: 0xe0d8c8, size: 0.035, opacity: 0.45 }); scene.add(dust); B.updaters.push(dust.userData.update);
  const marks = { mitte: [0, 0, 0], links: [-0.6, 0, 0.25], rechts: [0.6, 0, -0.2], vorne: [0, 0, 5], hinten: [0, 0, -9], maschine: [-3, 0, -3], fern: [0, 0, -24] };
  return finish(B, { marks, kind: 'innen', bounds: { x: [-10, 10], y: [0.3, 10], z: [-33, 14] },
    onUpdate(t, cam, st) { const v = st.licht ?? 1; const fl = st.flackern ?? 0; lamps.forEach((l, i) => { let k = v; if (fl) k *= noise2(t * 12 + i, i) > -0.1 ? 1 : 0.1; l.sp.intensity = 90 * k; l.glow.material.opacity = k; }); } });
}

// ======================================================================= RAUM (Büro, Labor, Wohnung, Kontrollraum)
function buildRaum(o) {
  const B = baseSet({ ...o, innen: true }); const { scene } = B; B.hemi.intensity = 0.55;
  const v = o.variante || 'buero'; const Wd = 8, Dp = 8, Ht = 3.2;
  const wallC = { buero: 0x8a8578, labor: 0xc8ccc8, wohnung: 0x8a6f5a, kontrollraum: 0x4a5056 }[v] || 0x8a8578;
  const floorM = v === 'wohnung' ? M(0x6a4a30, { map: rep(TEX.wood(), 4, 4), roughness: 0.6 }) : M(0x5a5a58, { map: rep(TEX.concrete(), 4, 4), roughness: 0.55 });
  scene.add(box(Wd, 0.1, Dp, floorM, 0, -0.05, 0));
  const wm = M(wallC, { map: rep(TEX.concrete(), 3, 2), roughness: 0.9 });
  scene.add(box(Wd, Ht, 0.15, wm, 0, Ht / 2, -Dp / 2), box(0.15, Ht, Dp, wm, -Wd / 2, Ht / 2, 0), box(0.15, Ht, Dp, wm, Wd / 2, Ht / 2, 0), box(Wd, 0.1, Dp, M(0x3a3a3a), 0, Ht, 0));
  // Fenster (Nachtlicht/Tageslicht von außen)
  const winM = new THREE.MeshStandardMaterial({ color: 0x0a1018, emissive: B.zeit === 'tag' ? 0xbcd4ec : 0x1a2c44, emissiveIntensity: 1.3 });
  for (const x of [-1.8, 1.8]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.5), winM); w.position.set(x, 1.8, -Dp / 2 + 0.09); scene.add(w);
    scene.add(box(1.7, 0.06, 0.12, M(0x2a2a2a), x, 1.8, -Dp / 2 + 0.1), box(0.06, 1.6, 0.12, M(0x2a2a2a), x, 1.8, -Dp / 2 + 0.1)); }
  const moonL = new THREE.SpotLight(B.zeit === 'tag' ? 0xeaf2ff : 0x7a9cc8, B.zeit === 'tag' ? 60 : 25, 14, 0.7, 0.6, 1.2); moonL.position.set(0, 2.3, -Dp / 2 - 1); moonL.target.position.set(0, 0, 1); moonL.castShadow = true; moonL.shadow.mapSize.set(1024, 1024); scene.add(moonL, moonL.target);
  // Möbel
  const desk = new THREE.Group(); const dm = M(v === 'labor' ? 0xd8dcd8 : 0x4a3424, { map: v === 'labor' ? null : rep(TEX.wood(), 1, 1) });
  desk.add(box(2.2, 0.08, 1.0, dm, 0, 0.78, 0)); for (const [x, z] of [[-1, -0.4], [1, -0.4], [-1, 0.4], [1, 0.4]]) desk.add(box(0.07, 0.78, 0.07, dm, x, 0.39, z));
  desk.position.set(1.6, 0, -2.2); scene.add(desk);
  const lampG = new THREE.Group(); lampG.position.set(2.3, 0.82, -2.4); scene.add(lampG);
  lampG.add(cyl(0.1, 0.12, 0.03, M(0x222222))); const neck2 = cyl(0.015, 0.015, 0.45, M(0x222222)); neck2.position.y = 0.22; lampG.add(neck2);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.16, 14, 1, true), M(0x2a4a3a, { side: THREE.DoubleSide })); shade.position.y = 0.46; lampG.add(shade);
  const deskLight = new THREE.PointLight(0xffc888, 6, 6, 1.6); deskLight.position.set(2.3, 1.15, -2.3); scene.add(deskLight);
  const g2 = glowSprite(0xffc070, 0.5); g2.position.set(2.3, 1.2, -2.4); scene.add(g2);
  if (v === 'kontrollraum' || v === 'labor') { const scrM = new THREE.MeshStandardMaterial({ color: 0x050a08, emissive: 0x3aa070, emissiveIntensity: 1.2 });
    for (let i = 0; i < 4; i++) { const s = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.6), scrM); s.position.set(-2.8 + i * 1.0, 1.5, -Dp / 2 + 0.1); scene.add(s); }
    scene.add(box(4.4, 0.9, 0.8, M(0x3a3e44, { metalness: 0.5 }), -1.3, 0.45, -3.4)); }
  if (v === 'wohnung') { const sofa = box(2.2, 0.5, 0.9, M(0x5a2a2a), -2, 0.35, 0.8); scene.add(sofa, box(2.2, 0.6, 0.25, M(0x5a2a2a), -2, 0.75, 1.15)); }
  const shelf = box(0.4, 2.2, 1.6, M(0x3a2a20), -Wd / 2 + 0.3, 1.1, -1.5); scene.add(shelf);
  const r = rng(71); for (let i = 0; i < 18; i++) scene.add(box(0.28, 0.25 + r() * 0.1, 0.06, M([0x7a2a2a, 0x2a4a6a, 0x5a5a2a, 0x3a3a3a][i % 4]), -Wd / 2 + 0.35, 0.4 + Math.floor(i / 6) * 0.65, -2.1 + (i % 6) * 0.22));
  const dust = createParticles({ count: 250, box: [6, 3, 6], center: [0, 0, 0], color: 0xfff0d8, size: 0.02, opacity: 0.4 }); scene.add(dust); B.updaters.push(dust.userData.update);
  const marks = { mitte: [0, 0, 0], links: [-0.6, 0, 0.25], rechts: [0.6, 0, -0.2], vorne: [0, 0, 2], hinten: [0, 0, -2.6], tisch: [1.6, 0, -1.4], fenster: [-1.8, 0, -3.2] };
  return finish(B, { marks, kind: 'innen', bounds: { x: [-3.7, 3.7], y: [0.3, 3.0], z: [-3.7, 3.8] },
    onUpdate(t, cam, st) { const v2 = st.licht ?? 1; deskLight.intensity = 6 * v2; g2.material.opacity = v2; } });
}

// ======================================================================= WALD
function buildWald(o) {
  const B = baseSet({ ...o, fogMul: 1.4 }); const { scene } = B;
  const g = new THREE.PlaneGeometry(220, 220, 90, 90); const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); const d = Math.hypot(x, y); p.setZ(i, fbm(x * 0.03, y * 0.03, 4) * 6 * clamp01((d - 12) / 40)); }
  g.computeVertexNormals(); const ground = new THREE.Mesh(g, M(0x2e3324, { map: rep(TEX.grass(), 30, 30), roughness: 0.95 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const r = rng(81); const bark = M(0x3a2c22, { map: rep(TEX.wood(), 1, 3) }); const leaf = [M(0x1e2e1e), M(0x24361f), M(0x1a2818)];
  const trunkG = new THREE.CylinderGeometry(0.18, 0.32, 10, 8); const coneG = new THREE.ConeGeometry(2.0, 5.5, 9);
  for (let i = 0; i < 220; i++) { const a = r() * Math.PI * 2, d = 3.5 + Math.pow(r(), 0.7) * 70; const x = Math.cos(a) * d, z = Math.sin(a) * d - 10; if (Math.abs(x) < 2.2 && z > -40) continue;
    const s = 0.7 + r() * 0.8; const tr = new THREE.Mesh(trunkG, bark); tr.position.set(x, 5 * s, z); tr.scale.setScalar(s); tr.castShadow = true; scene.add(tr);
    for (let k = 0; k < 3; k++) { const c = new THREE.Mesh(coneG, leaf[(i + k) % 3]); c.position.set(x, (5 + k * 2.4) * s, z); c.scale.setScalar(s * (1.2 - k * 0.28)); c.castShadow = true; scene.add(c); } }
  const path = box(2, 0.02, 80, M(0x3a3024, { map: rep(TEX.mud(), 1, 20) }), 0, 0.01, -20); scene.add(path);
  const fog = fogCards(scene, 20, [50, 60], 0.2, B.L.fog, 0.4, 7); B.updaters.push(fog.userData.update);
  const marks = { mitte: [0, 0, 0], links: [-0.6, 0, 0.25], rechts: [0.6, 0, -0.2], vorne: [0, 0, 5], hinten: [0, 0, -9], fern: [0, 0, -28], lichtung: [0, 0, -14] };
  return finish(B, { marks, kind: 'aussen', bounds: null });
}

// ======================================================================= MEER (Wasser + Boot/Deck)
const waterShader = (color, deep) => new THREE.ShaderMaterial({
  uniforms: { uTime: { value: 0 }, uCol: { value: new THREE.Color(color) }, uDeep: { value: new THREE.Color(deep) }, uSky: { value: new THREE.Color(0x8aa0b0) }, uAmp: { value: 1 },
    fogColor: { value: new THREE.Color() }, fogDensity: { value: 0 } },
  vertexShader: `uniform float uTime, uAmp; varying vec3 vW; varying float vH;
    float w(vec2 p){ return sin(p.x*0.35+uTime*1.1)*0.35 + sin(p.y*0.27-uTime*0.9)*0.3 + sin((p.x+p.y)*0.8+uTime*1.7)*0.08; }
    #include <fog_pars_vertex>
    void main(){ vec3 p = position; vec4 wp = modelMatrix*vec4(p,1.0); float h = w(wp.xz)*uAmp; p.z += h; vH = h; vec4 mvPosition = modelViewMatrix*vec4(p,1.0); vW = (modelMatrix*vec4(p,1.0)).xyz; gl_Position = projectionMatrix*mvPosition;
      #include <fog_vertex>
    }`,
  fragmentShader: `uniform vec3 uCol, uDeep, uSky; uniform float uTime, uAmp; varying vec3 vW; varying float vH;
    #include <fog_pars_fragment>
    void main(){ vec3 dx = dFdx(vW), dy = dFdy(vW); vec3 n = normalize(cross(dx, dy)); if(n.y<0.0) n=-n; vec3 v = normalize(cameraPosition - vW);
      float fr = pow(1.0 - max(dot(n, v), 0.0), 4.0); vec3 c = mix(uDeep, uCol, 0.4 + vH*0.5); c = mix(c, uSky, fr*0.8);
      float foam = smoothstep(0.42, 0.6, vH/max(uAmp,0.01)); c += foam*0.25; gl_FragColor = vec4(c, 1.0);
      #include <fog_fragment>
    }`,
  fog: true, extensions: { derivatives: true },
});
function buildMeer(o) {
  const B = baseSet(o); const { scene } = B; const night = B.zeit === 'nacht';
  const wm = waterShader(night ? 0x16303a : 0x2e5a6a, night ? 0x050c10 : 0x0e2a34); wm.uniforms.uSky.value.set(night ? 0x2a3a48 : 0xb8c8d0);
  wm.uniforms.uAmp.value = o.wetter === 'sturm' ? 2.4 : 1;
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(400, 400, 160, 160), wm); sea.rotation.x = -Math.PI / 2; sea.position.y = -0.6; scene.add(sea);
  // Boot / Deck (Bühne)
  const boat = new THREE.Group(); scene.add(boat);
  const hull = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 1.6, 2.2, 24, 1, false), M(0x6a2a24, { roughness: 0.6 })); hull.scale.set(1, 1, 3.2); hull.position.y = -1.0; hull.castShadow = true; boat.add(hull);
  const deck = box(4.6, 0.12, 15, M(0x6a5040, { map: rep(TEX.wood(), 4, 1) }), 0, 0.05, 0); boat.add(deck);
  const cabin = box(3, 2.2, 3.2, M(0xd8d4c8), 0, 1.15, -4); boat.add(cabin);
  const winM = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0xffc070, emissiveIntensity: night ? 2 : 0.3 }); const w1 = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.6), winM); w1.position.set(0, 1.6, -2.39); boat.add(w1);
  const mast = cyl(0.08, 0.1, 8, M(0x3a3a3a), 8); mast.position.set(0, 4, -4); boat.add(mast);
  for (const s of [-1, 1]) { boat.add(box(0.08, 0.7, 14, M(0x9a9a9a, { metalness: 0.6 }), s * 2.25, 0.4, 0)); }
  const lantern = glowSprite(0xffc070, 1.8); lantern.position.set(0, 3.4, -2.3); boat.add(lantern);
  const lantL = new THREE.PointLight(0xffb060, night ? 14 : 0, 14, 1.6); lantL.position.copy(lantern.position); boat.add(lantL);
  const spray = createParticles({ count: 500, box: [14, 5, 22], center: [0, -0.5, 0], color: 0xc8d8e0, size: 0.04, opacity: 0.35, kind: o.wetter === 'sturm' ? 'regen' : 'staub' }); scene.add(spray); B.updaters.push(spray.userData.update);
  const marks = { mitte: [0, 0.11, 0], links: [-0.6, 0.11, 0.25], rechts: [0.6, 0.11, -0.2], vorne: [0, 0.11, 4.5], hinten: [0, 0.11, -1.8], bug: [0, 0.11, 6.5], reling: [1.8, 0.11, 1] };
  return finish(B, { marks, kind: 'aussen', bounds: null, boat, rootForFigures: boat,
    onUpdate(t, cam, st) { wm.uniforms.uTime.value = t; const a = wm.uniforms.uAmp.value; boat.rotation.z = Math.sin(t * 0.8) * 0.04 * a; boat.rotation.x = Math.sin(t * 0.63 + 1) * 0.025 * a; boat.position.y = Math.sin(t * 0.9) * 0.12 * a; } });
}

// ======================================================================= SCHNEE (Berg)
function buildSchnee(o) {
  const B = baseSet({ ...o, wetter: o.wetter || 'schnee' }); const { scene } = B;
  const g = new THREE.PlaneGeometry(300, 300, 120, 120); const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); const d = Math.hypot(x, y);
    p.setZ(i, fbm(x * 0.02, y * 0.02, 5) * 10 * clamp01((d - 10) / 30) + Math.max(0, -y - 30) * 0.5 + fbm(x * 0.2, y * 0.2, 2) * 0.3); }
  g.computeVertexNormals(); const ground = new THREE.Mesh(g, M(0xe8eef4, { map: rep(TEX.snow(), 20, 20), roughness: 0.75 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const r = rng(91); const rk = M(0x3a3a40, { map: rep(TEX.rockDark(), 1, 1) });
  for (let i = 0; i < 50; i++) { const s = 0.5 + r() * 3; const m = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 1), rk); const a = r() * Math.PI * 2, d = 6 + r() * 60; m.position.set(Math.cos(a) * d, s * 0.3, Math.sin(a) * d - 10); m.scale.y = 0.7; m.castShadow = true; scene.add(m); }
  for (let i = 0; i < 6; i++) { const peak = new THREE.Mesh(new THREE.ConeGeometry(40 + r() * 30, 60 + r() * 50, 7), M(0xd0d8e0, { roughness: 0.9 })); peak.position.set((r() - 0.5) * 300, 20, -140 - r() * 80); scene.add(peak); }
  const fog = fogCards(scene, 14, [60, 60], 0.5, 0xffffff, 0.35, 11); B.updaters.push(fog.userData.update);
  const marks = { mitte: [0, 0, 0], links: [-0.6, 0, 0.25], rechts: [0.6, 0, -0.2], vorne: [0, 0, 5], hinten: [0, 0, -9], fern: [0, 0, -30] };
  return finish(B, { marks, kind: 'aussen', bounds: null });
}

// ======================================================================= WÜSTE
function buildWueste(o) {
  const B = baseSet({ ...o, fogMul: 0.6 }); const { scene } = B;
  const g = new THREE.PlaneGeometry(400, 400, 140, 140); const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); const d = Math.hypot(x, y); p.setZ(i, (Math.sin(x * 0.04 + fbm(x * 0.01, y * 0.01) * 4) * 4 + fbm(x * 0.015, y * 0.015, 3) * 8) * clamp01((d - 12) / 40)); }
  g.computeVertexNormals(); const ground = new THREE.Mesh(g, M(0xc8a070, { map: rep(TEX.sand(), 30, 30), roughness: 0.95 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  if (B.zeit !== 'nacht') { B.key.color.set('#ffe0b0'); B.key.intensity = 3.6; }
  const r = rng(95); const rk = M(0x8a6040);
  for (let i = 0; i < 20; i++) { const s = 0.4 + r() * 2.5; const m = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), rk); const a = r() * Math.PI * 2, d = 8 + r() * 60; m.position.set(Math.cos(a) * d, s * 0.3, Math.sin(a) * d); m.castShadow = true; scene.add(m); }
  const dust = createParticles({ count: 500, box: [30, 4, 30], center: [0, 0, 0], color: 0xf0d8b0, size: 0.04, opacity: 0.35 }); scene.add(dust); B.updaters.push(dust.userData.update);
  const marks = { mitte: [0, 0, 0], links: [-0.6, 0, 0.25], rechts: [0.6, 0, -0.2], vorne: [0, 0, 5], hinten: [0, 0, -9], fern: [0, 0, -30] };
  return finish(B, { marks, kind: 'aussen', bounds: null });
}

export const ORTE = { stollen: buildTunnel, tunnel: buildTunnel, hoehle: buildCave, werk: buildWerk, strasse: buildStrasse, halle: buildHalle, raum: buildRaum, wald: buildWald, meer: buildMeer, schnee: buildSchnee, wueste: buildWueste };
export function buildSet(o) { const f = ORTE[o.ort] || buildWerk; const S = f(o); S.ort = o.ort; return S; }
