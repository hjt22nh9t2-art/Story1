// Das Wrack im Watt (ab Teil 5): begehbarer Holzrumpf mit Spanten, Löchern, Muscheln, Bruch zum Hineingehen.
// createWreckHull() für die Außenwelt, createWreckInterior() als eigene Szene (Innenraum, Kiste, Logbuch, Wasser).
import * as THREE from 'three';
import { createLogbook, paperBase } from './interior.js';
import { makeLightCone } from './world.js';
import { rng, noise2, fbm, smooth, makeFogTexture } from './lib.js';

const std = (o) => new THREE.MeshStandardMaterial(o);
export const HULL = { L: 15, B: 5.2, keelY: -1.3, gunY: 2.4 };

// Rumpfpunkt: u 0..1 vom Heck (−x) zum Bug (+x), v 0..1 von Backbord-Reling über Kiel zur Steuerbord-Reling
export function hullPoint(u, v, inset = 0, out = new THREE.Vector3()) {
  const { L, B, keelY } = HULL;
  const x = (u - 0.5) * L; const xn = x / (L / 2);
  const hw = (B / 2) * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(xn), xn > 0 ? 2.0 : 3.2)), 0.55) + 0.04;
  const gun = HULL.gunY + 0.45 * xn * xn;
  const th = (2 * v - 1) * Math.PI / 2;
  const y = keelY + (gun - keelY) * Math.pow(1 - Math.cos(th), 0.8);
  const z = hw * Math.sin(th) * (1 - inset / (hw + 0.01));
  return out.set(x, y + inset * Math.cos(th) * 0.8, z);
}
// v, bei dem der Rumpf (Steuerbord) die Höhe y erreicht
export function vAtY(y) { const k = Math.pow((y - HULL.keelY) / (HULL.gunY - HULL.keelY), 1 / 0.8); return 0.5 + Math.acos(1 - k) / Math.PI; }

// Löcher im Rumpf (u0,u1,v0,v1): der Bruch an Steuerbord, verrottete Planken oben, kleine Lichtschlitze
export const BREACH = { u0: 0.45, u1: 0.565, v0: vAtY(-0.05), v1: vAtY(2.0) };
function holes() {
  const r = rng(91); const list = [[BREACH.u0, BREACH.u1, BREACH.v0, BREACH.v1, 1]];
  for (let i = 0; i < 9; i++) { const u = 0.15 + r() * 0.7; list.push([u, u + 0.03 + r() * 0.08, 0.02 + r() * 0.05, 0.08 + r() * 0.06, 0]); }   // Backbord oben verrottet
  for (let i = 0; i < 5; i++) { const u = 0.2 + r() * 0.6; list.push([u, u + 0.02 + r() * 0.05, 0.9 + r() * 0.03, 0.97 + r() * 0.03, 0]); }
  for (let i = 0; i < 7; i++) { const u = 0.12 + r() * 0.76; const v = r() < 0.5 ? 0.12 + r() * 0.08 : 0.82 + r() * 0.06; list.push([u, u + 0.015 + r() * 0.03, v, v + 0.012, 0]); } // Fugen
  return list;
}

function hullTextures() {
  const W = 2048, H = 1024; const r = rng(17);
  const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  const a = document.createElement('canvas'); a.width = W; a.height = H; const ga = a.getContext('2d');
  g.fillStyle = '#1b1612'; g.fillRect(0, 0, W, H);
  const rows = 26; const rh = H / rows;
  for (let k = 0; k < rows; k++) {
    let x = -r() * 300;
    while (x < W) {
      const w = 260 + r() * 420; const l = 26 + r() * 22;
      g.fillStyle = `rgb(${l * 1.15},${l},${l * 0.82})`; g.fillRect(x, k * rh + 2, w - 4, rh - 4);
      for (let q = 0; q < 26; q++) { g.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '90,80,60'},${r() * 0.18})`; g.fillRect(x + r() * w, k * rh + r() * rh, 30 + r() * 140, 1 + r() * 2); }
      g.fillStyle = 'rgba(0,0,0,0.7)'; g.fillRect(x + w - 4, k * rh, 4, rh);       // Stoß
      for (const nx of [x + 10, x + w - 18]) { g.fillStyle = 'rgba(90,50,30,0.8)'; g.fillRect(nx, k * rh + rh * 0.4, 5, 5); }  // rostige Nägel
      x += w;
    }
    g.fillStyle = 'rgba(0,0,0,0.85)'; g.fillRect(0, k * rh, W, 2);
  }
  // Algen + Seepocken an der Schlicklinie (v ≈ 0.26 und 0.74) und darunter
  const band = (v0) => {
    const y0 = v0 * H;
    for (let i = 0; i < 260; i++) { const x = r() * W, y = y0 + (r() - 0.5) * 220; const gr = g.createRadialGradient(x, y, 0, x, y, 30 + r() * 60);
      gr.addColorStop(0, `rgba(${30 + r() * 20},${50 + r() * 30},${30},0.55)`); gr.addColorStop(1, 'rgba(30,50,30,0)'); g.fillStyle = gr; g.fillRect(x - 90, y - 90, 180, 180); }
    for (let i = 0; i < 3000; i++) { const x = r() * W, y = y0 + (r() - 0.5) * 260 * Math.sqrt(r()); g.fillStyle = `rgba(${170 + r() * 50},${165 + r() * 45},${150 + r() * 40},${0.4 + r() * 0.5})`;
      g.beginPath(); g.arc(x, y, 1 + r() * 2.6, 0, 7); g.fill(); }
    for (let i = 0; i < 1400; i++) { const x = r() * W, y = y0 + (r() - 0.5) * 200 * Math.sqrt(r()); g.fillStyle = `rgba(${12 + r() * 10},${16 + r() * 10},${30 + r() * 20},0.95)`;
      g.beginPath(); g.ellipse(x, y, 3 + r() * 5, 1.6 + r() * 2.4, r() * 3, 0, 7); g.fill(); g.fillStyle = 'rgba(120,140,170,0.35)'; g.fillRect(x - 1, y - 1, 2, 1); }
  };
  band(1 - vAtY(0.3)); band(vAtY(0.3));
  // Alpha: Löcher mit ausgefransten Rändern
  ga.fillStyle = '#fff'; ga.fillRect(0, 0, W, H); ga.fillStyle = '#000';
  for (const [u0, u1, v0, v1, big] of holes()) {
    ga.beginPath(); const n = big ? 40 : 14;
    for (let i = 0; i <= n; i++) { const t = i / n * Math.PI * 2; const j = 1 + (r() - 0.5) * (big ? 0.35 : 0.5);
      const x = ((u0 + u1) / 2 + Math.cos(t) * (u1 - u0) / 2 * j) * W, y = ((v0 + v1) / 2 + Math.sin(t) * (v1 - v0) / 2 * j) * H; i ? ga.lineTo(x, y) : ga.moveTo(x, y); }
    ga.fill();
    if (big) { for (let k = 0; k < 7; k++) { const y = (v0 + (v1 - v0) * r()) * H; ga.fillRect(u0 * W - 60 * r(), y, 120 + 80 * r(), rh * 0.8); } }   // gesplitterte Planken
  }
  const map = new THREE.CanvasTexture(c); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 8;
  const alpha = new THREE.CanvasTexture(a);
  return { map, alpha };
}

function buildHullMesh(tex) {
  const NU = 120, NV = 72; const pos = [], uv = [], idx = []; const p = new THREE.Vector3();
  for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) {
    const u = i / NU, v = j / NV; hullPoint(u, v, 0, p);
    // leichte Verformung: eingedrückte Planken
    p.z += 0.05 * noise2(u * 14, v * 9) * Math.sign(p.z || 1);
    pos.push(p.x, p.y, p.z); uv.push(u, 1 - v);
  }
  for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) { const a = j * (NU + 1) + i, b = a + 1, c = a + NU + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  const m = std({ map: tex.map, alphaMap: tex.alpha, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.45, metalness: 0.05, color: 0xb8b0a4 });
  const mesh = new THREE.Mesh(g, m); mesh.castShadow = mesh.receiveShadow = true; mesh.name = 'hull';
  mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, alphaMap: tex.alpha, alphaTest: 0.5 });
  return mesh;
}

function buildRibs(grp, mat) {
  const r = rng(23);
  for (let k = 0; k < 15; k++) {
    const u = 0.08 + k * 0.06; if (u > 0.95) break;
    const v0 = r() < 0.3 ? 0.1 + r() * 0.15 : 0.0, v1 = r() < 0.3 ? 0.75 + r() * 0.15 : 1.0;
    const pts = []; for (let i = 0; i <= 16; i++) pts.push(hullPoint(u, v0 + (v1 - v0) * i / 16, 0.13));
    const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 32, 0.09, 6), mat); tube.castShadow = tube.receiveShadow = true; grp.add(tube);
    // oben überstehende, abgebrochene Spantenden
    if (v1 === 1.0 && r() < 0.6) { const top = hullPoint(u, 1, 0.13); const s = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.5 + r() * 0.7, 6), mat); s.position.copy(top).add(new THREE.Vector3(0, 0.3, -0.05)); s.rotation.z = (r() - 0.5) * 0.4; grp.add(s); }
  }
  // Kielschwein + Decksbalken + Rest vom Vordeck + Maststumpf
  const keelson = new THREE.Mesh(new THREE.BoxGeometry(HULL.L * 0.85, 0.22, 0.3), mat); keelson.position.set(0, HULL.keelY + 0.25, 0); grp.add(keelson);
  for (const [x, y, len, rz] of [[-3.6, 2.3, 4.6, 0.05], [-0.9, 2.25, 3.2, -0.25], [2.4, 2.45, 4.8, 0.02]]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.2, len), mat); b.position.set(x, y, 0.1); b.rotation.x = rz; b.castShadow = true; grp.add(b);
  }
  const deck = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.1, 3.2), mat); deck.position.set(5.4, 2.62, 0); deck.rotation.z = 0.08; deck.castShadow = deck.receiveShadow = true; grp.add(deck);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 3.4, 8), mat); mast.position.set(1.4, 1.6, -0.4); mast.rotation.set(0.25, 0, 0.42); mast.castShadow = true; grp.add(mast);
  const mast2 = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 2.6, 8), mat); mast2.position.set(-3.2, 0.25, -1.35); mast2.rotation.set(1.25, 0.2, 0.3); grp.add(mast2);
}

// Miesmuscheln als Instanzen außen am Rumpf, dicht über dem Schlick
function buildMussels(count = 1600, seed = 31) {
  const geo = new THREE.SphereGeometry(0.05, 7, 5); geo.scale(1, 0.45, 0.55);
  const mat = std({ color: 0x141a26, roughness: 0.18, metalness: 0.35 });
  const inst = new THREE.InstancedMesh(geo, mat, count); const r = rng(seed); const m = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), p2 = new THREE.Vector3(), s = new THREE.Vector3();
  let n = 0;
  while (n < count) {
    const u = 0.04 + r() * 0.92; const side = r() < 0.5 ? -1 : 1; const y = -0.15 + Math.pow(r(), 1.8) * 1.3;
    let v = vAtY(y); if (side < 0) v = 1 - v;
    if (u > BREACH.u0 - 0.01 && u < BREACH.u1 + 0.01 && side > 0 && y < 2) continue;
    hullPoint(u, v, -0.02, p); hullPoint(u, v + 0.01 * side, -0.02, p2);
    const nrm = new THREE.Vector3(0, 0, side).applyAxisAngle(new THREE.Vector3(1, 0, 0), 0).normalize();
    q.setFromEuler(new THREE.Euler((r() - 0.5) * 1.2, r() * 6.28, (r() - 0.5) * 1.2));
    const k = 0.6 + r() * 0.8; s.set(k, k, k); p.addScaledVector(nrm, 0.02);
    m.compose(p, q, s); inst.setMatrixAt(n++, m);
  }
  inst.castShadow = true; return inst;
}

export function createWreckHull() {
  const grp = new THREE.Group(); grp.name = 'wreckHull';
  const tex = hullTextures();
  grp.add(buildHullMesh(tex));
  const woodM = std({ color: 0x2b231c, roughness: 0.6 });
  buildRibs(grp, woodM); grp.add(buildMussels());
  grp.userData.tex = tex;
  return grp;
}

// ---------- Logbuch in Jonas' Handschrift ----------
export const JONAS_ENTRIES = [
  ['Tag 1', 'Angekommen. Lampe 18:40 an.'],
  ['', '03:33 Licht aus. Es klopft.'],
  ['Tag 2', 'Nasse Spuren. Bis zum Bett.'],
  ['Tag 3', 'Funk: Kutter „Margarete“.'],
  ['', 'Er kennt meinen Namen.'],
  ['Tag 4', 'Foto im Keller. Das bin ich.'],
  ['Tag 5', 'Ebbe. Ich gehe zum Wrack.'],
];
const INK = '#16233d';
function wetStains(g, w, h, seed) {
  const r = rng(seed);
  for (let i = 0; i < 7; i++) { const x = r() * w, y = r() * h, rad = 80 + r() * 260; const gr = g.createRadialGradient(x, y, rad * 0.3, x, y, rad);
    gr.addColorStop(0, 'rgba(70,75,60,0.16)'); gr.addColorStop(0.85, 'rgba(90,70,40,0.25)'); gr.addColorStop(1, 'rgba(90,70,40,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }
}
export function makeJonasPage({ side = 'left', seed = 41 } = {}) {
  const w = 1024, h = 1400; const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  paperBase(g, w, h, seed); wetStains(g, w, h, seed + 3);
  g.fillStyle = INK; const r = rng(seed + 7);
  if (side === 'left') {
    g.font = '700 54px Caveat'; g.fillText('Leuchtfeuer Nebelsand', 60, 100);
    let y = 207;
    for (const [d, txt] of JONAS_ENTRIES.slice(0, 6)) {
      g.save(); g.translate(0, y); g.rotate(-0.018 + (r() - 0.5) * 0.01); g.font = '700 52px Caveat'; g.fillText(d, 30, 0); g.fillText(txt, 190, 0); g.restore(); y += 128;
    }
    g.save(); g.translate(720, 1180); g.rotate(-0.1); g.font = '700 80px Caveat'; g.fillText('J.', 0, 0); g.restore();
  } else {
    const [d, txt] = JONAS_ENTRIES[6];
    g.save(); g.translate(0, 207); g.rotate(-0.018); g.font = '700 52px Caveat'; g.fillText(d, 30, 0); g.fillText(txt, 190, 0); g.restore();
    // der letzte Eintrag: größer, zittrig, doppelt nachgezogen
    g.save(); g.translate(512, 640); g.rotate(-0.045); g.textAlign = 'center';
    for (let k = 0; k < 2; k++) {
      g.globalAlpha = k ? 0.35 : 1; g.font = '700 104px Caveat';
      g.fillText('Heute. 03:33', k * 3, -40 + k); g.font = '700 120px Caveat'; g.fillText('Die Flut kommt.', k * 3, 110 + k);
    }
    g.globalAlpha = 1; g.strokeStyle = INK; g.lineCap = 'round'; const rr = rng(4);
    for (let i = 0; i < 2; i++) { g.lineWidth = 6 - i * 2; g.beginPath(); let x = -330, yy = 160 + i * 24; g.moveTo(x, yy); while (x < 330) { x += 18; g.lineTo(x, yy + (rr() - 0.5) * 8); } g.stroke(); }
    g.restore();
    // verlaufene Tinte, Tropfen
    for (let i = 0; i < 5; i++) { const x = 300 + r() * 450, y = 820 + r() * 380; g.fillStyle = 'rgba(22,35,61,0.35)'; g.beginPath(); g.ellipse(x, y, 5 + r() * 9, 14 + r() * 40, 0, 0, 7); g.fill(); }
    g.save(); g.translate(760, 1180); g.rotate(-0.1); g.font = '700 80px Caveat'; g.fillText('J.', 0, 0); g.restore();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

// ---------- Innenraum ----------
export function createWreckInterior() {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x2c4448); scene.fog = new THREE.FogExp2(0x1d3337, 0.085);
  const hull = createWreckHull(); scene.add(hull);
  // Boden: Schlick im Rumpf (Streifen, der der Rumpfbreite bei y=0 folgt)
  const NU = 80; const pos = [], uv = [], idx = []; const p = new THREE.Vector3(), q = new THREE.Vector3();
  for (let i = 0; i <= NU; i++) { const u = i / NU; hullPoint(u, vAtY(0.0), 0, p); hullPoint(u, 1 - vAtY(0.0), 0, q);
    pos.push(p.x, 0, p.z + 0.05, q.x, 0, q.z - 0.05); uv.push(u * 6, 0, u * 6, 1); }
  for (let i = 0; i < NU; i++) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); fg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); fg.setIndex(idx); fg.computeVertexNormals();
  const floorTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d'); const r = rng(8);
    g.fillStyle = '#3a382f'; g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '15,18,16' : '110,100,80'},${r() * 0.25})`; g.beginPath(); g.ellipse(r() * 512, r() * 512, 4 + r() * 30, 2 + r() * 10, r() * 3, 0, 7); g.fill(); }
    for (let i = 0; i < 400; i++) { g.fillStyle = 'rgba(200,195,180,0.5)'; g.fillRect(r() * 512, r() * 512, 2, 2); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; })();
  const floor = new THREE.Mesh(fg, std({ map: floorTex, roughness: 0.3, metalness: 0.1, color: 0xa0a090 })); floor.receiveShadow = true; scene.add(floor);
  // Pfützen
  const pud = new THREE.Mesh(new THREE.CircleGeometry(1, 24), std({ color: 0x050a0a, roughness: 0.02, metalness: 0.6 })); pud.rotation.x = -Math.PI / 2; pud.scale.set(1.6, 0.7, 1); pud.position.set(1.2, 0.012, -0.6); scene.add(pud);
  // Kiste mit Logbuch (Mitte achtern)
  const crateTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); const r = rng(3);
    g.fillStyle = '#3b2c1f'; g.fillRect(0, 0, 256, 256); for (let y = 0; y < 256; y += 64) { g.fillStyle = 'rgba(0,0,0,0.7)'; g.fillRect(0, y, 256, 4); }
    for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(0,0,0,${r() * 0.25})`; g.fillRect(r() * 256, r() * 256, 40 * r(), 2); }
    g.fillStyle = 'rgba(30,50,35,0.6)'; g.fillRect(0, 200, 256, 56);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const crate = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.62, 0.65), std({ map: crateTex, roughness: 0.7 })); crate.position.set(-2.2, 0.28, 0.35); crate.rotation.set(0.04, 0.25, -0.05); crate.castShadow = crate.receiveShadow = true; scene.add(crate);
  const book = createLogbook();
  const left = makeJonasPage({ side: 'left' }), right = makeJonasPage({ side: 'right', seed: 44 });
  book.left.material.map = left; book.right.material.map = right; book.flipFront.material.map = right; book.flipBack.material.map = left;
  [book.left, book.right].forEach((m) => { m.material.roughness = 0.55; m.material.needsUpdate = true; });
  // Buchdeckel (schließt über der rechten Seite, Gelenk am Rücken)
  const lid = new THREE.Group(); book.grp.add(lid); lid.position.set(0, 0.033, 0);
  const lidB = new THREE.Mesh(new THREE.BoxGeometry(book.W + 0.015, 0.01, book.H + 0.02), std({ color: 0x2a140d, roughness: 0.35 })); lidB.position.x = (book.W + 0.015) / 2; lidB.castShadow = true; lid.add(lidB);
  book.grp.position.set(-2.2, 0.62, 0.35); book.grp.rotation.y = 0.25 + Math.PI / 2; scene.add(book.grp);
  const bookCenter = new THREE.Vector3(); book.grp.updateMatrixWorld(true); book.grp.getWorldPosition(bookCenter);
  // Licht: kaltes Tageslicht durch das offene Deck, dazu Schäfte durch Löcher
  const hemi = new THREE.HemisphereLight(0x6f98a0, 0x101412, 0.9); scene.add(hemi);
  const sky = new THREE.DirectionalLight(0x9fc0c8, 2.6); sky.position.set(-3, 12, -5); sky.target.position.set(0, 0, 0); sky.castShadow = true;
  sky.shadow.mapSize.set(2048, 2048); Object.assign(sky.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 30 }); sky.shadow.bias = -0.0006; scene.add(sky, sky.target);
  const shafts = [];
  for (const [x, z, len, rot] of [[-3.2, -0.6, 4.5, -1.2], [0.4, 0.7, 4.2, -1.35], [3.0, -0.4, 4.4, -1.15], [-0.8, -1.4, 3.6, -1.1]]) {
    const s = makeLightCone(len, 0.55, 0.16, 0xbfdde2); s.position.set(x, 3.4, z); s.rotation.set(0, 0.3, rot); scene.add(s); shafts.push(s);
  }
  // Staub/Nebel im Rumpf
  const ft = makeFogTexture(5); const motes = [];
  for (let i = 0; i < 12; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: ft, color: 0x5f8890, transparent: true, opacity: 0.12, depthWrite: false })); const r = rng(i + 70)(); sp.position.set(-6 + i, 1 + r * 1.2, (r - 0.5) * 2); sp.scale.setScalar(3 + r * 2); scene.add(sp); motes.push(sp); }
  // Taschenlampe (frei geführt, von Jonas' Position)
  const torch = new THREE.SpotLight(0xffd7a8, 0, 14, 0.42, 0.55, 1.3); torch.castShadow = true; torch.shadow.mapSize.set(1024, 1024); scene.add(torch, torch.target);
  // Tropfen von oben
  const dropM = std({ color: 0xbfe0e0, roughness: 0, metalness: 0.4, transparent: true, opacity: 0.85 });
  const drops = []; const rd = rng(12);
  for (let i = 0; i < 14; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 4), dropM); d.scale.y = 2.4; d.userData = { x: -4 + rd() * 8, z: (rd() - 0.5) * 2.4, top: 2.0 + rd() * 0.4, ph: rd(), sp: 0.7 + rd() * 0.6 }; scene.add(d); drops.push(d); }
  // Wasser, das hereinläuft: steigender Spiegel + Strahlen durch den Bruch und die Fugen
  const waterM = std({ color: 0x0c2a2c, roughness: 0.06, metalness: 0.5, transparent: true, opacity: 0.88 });
  const water = new THREE.Mesh(fg.clone(), waterM); water.visible = false; scene.add(water);
  const jetTex = (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 256; const g = c.getContext('2d'); const r = rng(6);
    for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(230,245,245,${0.2 + r() * 0.6})`; g.fillRect(r() * 64, r() * 256, 2 + r() * 6, 20 + r() * 60); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; })();
  const jets = [];
  const jetFrom = [[hullPoint(0.505, vAtY(0.9), 0), 0.55], [hullPoint(0.3, 1 - vAtY(0.7), 0), 0.18], [hullPoint(0.66, vAtY(0.55), 0), 0.22], [hullPoint(0.2, vAtY(0.45), 0), 0.15]];
  for (const [a, wdt] of jetFrom) {
    const inward = new THREE.Vector3(0, 0, -Math.sign(a.z)); const b = a.clone().addScaledVector(inward, 0.9 + wdt); b.y = 0.05; const mid = a.clone().addScaledVector(inward, 0.55); mid.y = a.y * 0.8;
    const tex = jetTex.clone(); tex.needsUpdate = true; tex.repeat.set(1, 2);
    const j = new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(a, mid, b), 20, wdt * 0.3, 8), new THREE.MeshStandardMaterial({ color: 0xcfe6e6, alphaMap: tex, transparent: true, opacity: 0.9, roughness: 0.1, depthWrite: false, emissive: 0x2a4a50 }));
    j.visible = false; scene.add(j); jets.push(j);
  }
  const lidOpen = (k) => { lid.rotation.z = Math.PI * Math.min(1, Math.max(0, k)); lid.visible = k < 0.999; };
  lidOpen(1);
  return { scene, hull, crate, book, bookCenter, hemi, sky, shafts, torch, water, jets, drops, motes, lidOpen,
    update(t, { flood = 0, jet = 0, shaft = 1, torchOn = 0 } = {}) {
      drops.forEach((d) => { const u = d.userData; const f = ((t * u.sp + u.ph) % 1); d.position.set(u.x, u.top * (1 - f * f), u.z); d.visible = f < 0.97; });
      shafts.forEach((s, i) => { s.material.uniforms.uTime.value = t; s.material.uniforms.uInt.value = shaft * (0.8 + 0.2 * Math.sin(t * 0.7 + i)); });
      motes.forEach((m, i) => { m.position.x += Math.sin(t * 0.2 + i) * 0.002; });
      water.visible = flood > 0.001; water.position.y = flood * 0.55 + 0.01 * Math.sin(t * 3);
      jets.forEach((j, i) => { j.visible = jet > 0.01; j.material.alphaMap.offset.y = -t * (2.5 + i * 0.4); j.material.opacity = 0.85 * jet; j.scale.setScalar(1); });
      torch.intensity = 26 * torchOn;
    } };
}
