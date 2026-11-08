// Requisiten ab Teil 2: nasse Fußspuren (barfuß), Pfützen
import * as THREE from 'three';
import { rng } from './lib.js';

let footTex = null;
function makeFootTexture() {
  if (footTex) return footTex;
  const c = document.createElement('canvas'); c.width = 128; c.height = 256; const g = c.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, 128, 256);
  g.filter = 'blur(3px)'; g.fillStyle = '#fff';
  // Ballen + Ferse (rechter Fuß, Zehen oben = +y in Textur)
  g.beginPath(); g.ellipse(68, 92, 30, 40, 0.12, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.ellipse(62, 200, 22, 30, 0.05, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.moveTo(44, 110); g.quadraticCurveTo(46, 160, 44, 190); g.lineTo(80, 190); g.quadraticCurveTo(86, 150, 94, 110); g.fill();
  // Zehen
  [[46, 46, 11], [62, 38, 9], [76, 38, 8.5], [89, 44, 7.5], [99, 54, 6.5]].forEach(([x, y, r]) => { g.beginPath(); g.ellipse(x, y, r, r * 1.25, 0, 0, Math.PI * 2); g.fill(); });
  footTex = new THREE.CanvasTexture(c); return footTex;
}

let puddleTex = null;
function makePuddleTexture() {
  if (puddleTex) return puddleTex;
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, 256, 256); g.filter = 'blur(6px)'; g.fillStyle = '#fff';
  const r = rng(4); g.beginPath();
  for (let i = 0; i <= 24; i++) { const a = i / 24 * Math.PI * 2; const rad = 70 + r() * 40; const x = 128 + Math.cos(a) * rad, y = 128 + Math.sin(a) * rad * 0.8; i ? g.lineTo(x, y) : g.moveTo(x, y); }
  g.fill();
  puddleTex = new THREE.CanvasTexture(c); return puddleTex;
}

const wetMat = (opacity = 0.9) => new THREE.MeshStandardMaterial({
  color: 0x020405, roughness: 0.04, metalness: 0.35, transparent: true, opacity, alphaMap: makeFootTexture(),
  depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
});

// Fußspuren entlang eines Pfades.
// path: Array von THREE.Vector3 (y wird über heightFn bestimmt, falls angegeben)
// opts: { stride: Abstand, width: seitlicher Versatz, size, heightFn(x,z), normalFn, pairAtEnd }
export function createFootprints(path, opts = {}) {
  const { stride = 0.62, width = 0.11, size = 0.27, heightFn = null, lift = 0.012, pairAtEnd = true, seed = 3, opacity = 0.9 } = opts;
  const curve = new THREE.CatmullRomCurve3(path);
  const len = curve.getLength(); const n = Math.max(2, Math.floor(len / stride));
  const grp = new THREE.Group(); grp.name = 'footprints';
  const r = rng(seed);
  const geo = new THREE.PlaneGeometry(size * 0.42, size); geo.rotateX(-Math.PI / 2); // liegt flach, Zehen in -z
  const prints = [];
  for (let i = 0; i <= n; i++) {
    const u = Math.min(1, i / n);
    const p = curve.getPointAt(u); const tan = curve.getTangentAt(u); tan.y = 0; tan.normalize();
    const side = i % 2 === 0 ? 1 : -1;
    const perp = new THREE.Vector3(-tan.z, 0, tan.x);
    const pos = p.clone().addScaledVector(perp, side * width);
    const m = new THREE.Mesh(geo, wetMat(opacity * (0.85 + r() * 0.15)));
    m.position.copy(pos); if (heightFn) m.position.y = heightFn(pos.x, pos.z);
    m.position.y += lift;
    m.rotation.y = Math.atan2(-tan.x, -tan.z) + (r() - 0.5) * 0.15;
    m.scale.x = side; // linker/rechter Fuß gespiegelt
    m.userData.u = u; grp.add(m); prints.push(m);
  }
  if (pairAtEnd) {
    // letzter Schritt: Füße nebeneinander (stehen geblieben)
    const last = prints[prints.length - 1], prev = prints[prints.length - 2];
    const m = new THREE.Mesh(geo, wetMat(opacity)); m.position.copy(prev.position);
    const tan = curve.getTangentAt(1); tan.y = 0; tan.normalize();
    m.position.addScaledVector(tan, last.position.clone().sub(prev.position).dot(tan));
    m.rotation.y = last.rotation.y; m.scale.x = -last.scale.x; m.userData.u = 1; grp.add(m); prints.push(m);
  }
  grp.userData = { curve, prints,
    // Spuren nur bis Anteil k sichtbar (für "erscheinende" Spuren)
    reveal(k) { prints.forEach((m) => { m.visible = m.userData.u <= k + 1e-6; }); },
    shine(level) { prints.forEach((m) => { m.material.roughness = 0.04 + (1 - level) * 0.3; }); } };
  return grp;
}

// Fußspuren Stufe für Stufe (Treppe). steps: [{x, y, z}] Mitte jeder Trittfläche
export function createStairPrints(steps, { dirZ = 1, size = 0.27, width = 0.11, opacity = 0.9 } = {}) {
  const grp = new THREE.Group();
  const geo = new THREE.PlaneGeometry(size * 0.42, size); geo.rotateX(-Math.PI / 2);
  steps.forEach((s, i) => {
    const side = i % 2 === 0 ? 1 : -1;
    const m = new THREE.Mesh(geo, wetMat(opacity));
    m.position.set(s.x + side * width, s.y + 0.012, s.z); m.rotation.y = dirZ > 0 ? Math.PI : 0; m.scale.x = side; grp.add(m);
  });
  return grp;
}

export function createPuddle(radius = 0.4, opacity = 0.85) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(radius * 2, radius * 2), new THREE.MeshStandardMaterial({
    color: 0x020405, roughness: 0.02, metalness: 0.4, transparent: true, opacity, alphaMap: makePuddleTexture(), depthWrite: false,
    polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }));
  m.rotation.x = -Math.PI / 2; return m;
}
