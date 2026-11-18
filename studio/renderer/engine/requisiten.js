// Requisiten: wiederverwendbare Objekte. Jedes Objekt ist eine Group, optional mit userData.update(t, l, d, opt).
import * as THREE from 'three';
import { rng, smooth, clamp01, makeNoiseTexture } from './lib.js';
import { glowSprite, TEX } from './orte.js';
import { makeBeamCone } from './figuren.js';

const M = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, ...o });
const box = (w, h, d, m, x = 0, y = 0, z = 0) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; return b; };
const cyl = (r1, r2, h, m, seg = 16) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), m); c.castShadow = c.receiveShadow = true; return c; };
const steel = () => M(0x5a5e62, { metalness: 0.75, roughness: 0.4 });
const rusty = () => M(0x6a4a38, { metalness: 0.5, roughness: 0.7 });

function textCanvasTex(lines, { w = 512, h = 640, bg = '#e8e0cc', font = '700 54px Caveat', color = '#1a1a40', lh = 64 } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, w, h); const r = rng(3);
  for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(90,70,40,${r() * 0.06})`; g.fillRect(r() * w, r() * h, 2 + r() * 8, 2 + r() * 8); }
  for (let y = 70; y < h; y += lh) { g.fillStyle = 'rgba(80,110,160,0.25)'; g.fillRect(20, y + 12, w - 40, 2); }
  g.font = font; g.fillStyle = color; lines.forEach((l, i) => g.fillText(l, 36, 70 + i * lh));
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export const REQUISITEN = {
  // Grubenwagen auf Schienen
  lore() { const g = new THREE.Group(); const m = rusty(); g.add(box(0.9, 0.55, 1.4, m, 0, 0.55, 0));
    const inner = box(0.8, 0.1, 1.3, M(0x2a2420), 0, 0.78, 0); g.add(inner);
    const ore = new THREE.Mesh(new THREE.DodecahedronGeometry(0.45, 1), M(0x6a4030, { roughness: 1 })); ore.scale.set(0.9, 0.35, 1.4); ore.position.y = 0.85; g.add(ore);
    for (const [x, z] of [[-0.35, -0.45], [0.35, -0.45], [-0.35, 0.45], [0.35, 0.45]]) { const w = cyl(0.14, 0.14, 0.06, steel()); w.rotation.z = Math.PI / 2; w.position.set(x, 0.18, z); g.add(w); } return g; },
  kiste() { const g = new THREE.Group(); g.add(box(0.7, 0.55, 0.5, M(0x7a5a38, { map: TEX.wood() }), 0, 0.275, 0)); return g; },
  fass() { const g = new THREE.Group(); const b = cyl(0.3, 0.3, 0.9, M(0x2a4a5a, { metalness: 0.5, roughness: 0.5 })); b.position.y = 0.45; g.add(b);
    for (const y of [0.15, 0.75]) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.305, 0.02, 6, 24), steel()); r.rotation.x = Math.PI / 2; r.position.y = y; g.add(r); } return g; },
  laterne() { const g = new THREE.Group(); g.add(box(0.16, 0.03, 0.16, M(0x222222), 0, 0.015, 0)); const glass = cyl(0.06, 0.06, 0.18, new THREE.MeshStandardMaterial({ color: 0x332211, emissive: 0xffa040, emissiveIntensity: 3 })); glass.position.y = 0.12; g.add(glass);
    const glow = glowSprite(0xffa050, 0.9); glow.position.y = 0.13; g.add(glow); const l = new THREE.PointLight(0xffa050, 5, 6, 1.7); l.position.y = 0.2; g.add(l);
    g.userData.update = (t) => { const f = 0.85 + 0.15 * Math.sin(t * 13) * Math.sin(t * 7.1); l.intensity = 5 * f; glow.material.opacity = f; }; return g; },
  // Zettel mit Text (opt.text: Zeilen getrennt durch |)
  zettel(opt = {}) { const g = new THREE.Group(); const lines = String(opt.text || 'Wir leben').split('|');
    const p = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.375), new THREE.MeshStandardMaterial({ map: textCanvasTex(lines), roughness: 0.9, side: THREE.DoubleSide })); p.position.y = 0.0; g.add(p); g.userData.isPaper = true; return g; },
  // Bohrgerät (Bohrturm über einem Loch) – opt.dreh: dreht sich
  bohrgeraet() { const g = new THREE.Group(); const m = M(0xc89a2a, { metalness: 0.4, roughness: 0.5 }); const sm = steel();
    for (const [x, z] of [[-1.2, -1.2], [1.2, -1.2], [-1.2, 1.2], [1.2, 1.2]]) { const l = box(0.14, 8.5, 0.14, m, x * 0.6, 4.2, z * 0.6); l.rotation.z = -x * 0.07; l.rotation.x = z * 0.07; g.add(l); }
    for (let y = 1; y < 8; y += 1.4) { g.add(box(1.6 - y * 0.08, 0.08, 0.08, m, 0, y, 0.72 - y * 0.04)); g.add(box(1.6 - y * 0.08, 0.08, 0.08, m, 0, y, -0.72 + y * 0.04)); }
    g.add(box(1.4, 0.4, 1.4, m, 0, 8.4, 0)); g.add(box(3.2, 0.9, 2.0, M(0x3a4a3a, { metalness: 0.4 }), 2.4, 0.45, 0));
    const pipe = cyl(0.12, 0.12, 8, sm); pipe.position.y = 4; g.add(pipe); const head = cyl(0.3, 0.3, 0.6, sm, 8); head.position.y = 1.2; g.add(head);
    g.add(box(4, 0.15, 4, M(0x4a4038), 0, 0.07, 0));
    const work = new THREE.SpotLight(0xfff0d8, 60, 16, 0.8, 0.6, 1.5); work.position.set(0, 7.5, 1); work.target.position.set(0, 0, 0); g.add(work, work.target);
    const wg = glowSprite(0xfff0d8, 1.6); wg.position.set(0, 7.5, 0.8); g.add(wg);
    g.userData.update = (t, l, d, opt) => { const s = opt.dreh === false ? 0 : 1; pipe.rotation.y = t * 6 * s; head.rotation.y = t * 6 * s; head.position.y = 1.2 - (s ? ((t * 0.2) % 1) * 0.4 : 0); }; return g; },
  // Rettungskapsel (Dahlbusch-Bombe-ähnlich): schmaler Zylinder am Seil. opt.hoehe animiert
  kapsel() { const g = new THREE.Group(); const m = M(0xb8b8b0, { metalness: 0.7, roughness: 0.35 });
    const body = cyl(0.19, 0.19, 2.2, m, 20); body.position.y = 1.1; g.add(body); const nose = new THREE.Mesh(new THREE.ConeGeometry(0.19, 0.4, 20), m); nose.position.y = 2.4; g.add(nose);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.19, 0.3, 20), m); tail.rotation.x = Math.PI; tail.position.y = -0.15; g.add(tail);
    for (const y of [0.5, 1.1, 1.7]) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.195, 0.015, 6, 24), M(0x8a2a20)); r.rotation.x = Math.PI / 2; r.position.y = y; g.add(r); }
    const rope = cyl(0.015, 0.015, 30, M(0x222222), 6); rope.position.y = 2.6 + 15; g.add(rope); return g; },
  fernsehkamera() { const g = new THREE.Group(); const m = M(0x2a2a2c, { metalness: 0.5 });
    for (let i = 0; i < 3; i++) { const l = cyl(0.025, 0.025, 1.5, m, 6); const a = i * Math.PI * 2 / 3; l.position.set(Math.cos(a) * 0.3, 0.72, Math.sin(a) * 0.3); l.rotation.set(Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35); g.add(l); }
    g.add(box(0.35, 0.4, 0.7, m, 0, 1.6, 0)); const lens = cyl(0.11, 0.13, 0.35, M(0x111111), 16); lens.rotation.x = Math.PI / 2; lens.position.set(0, 1.6, 0.5); g.add(lens);
    const tally = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff2020 })); tally.position.set(0.1, 1.85, 0.2); g.add(tally); return g; },
  auto(opt = {}) { const g = new THREE.Group(); const c = M(opt.farbe || 0x3a4a5a, { metalness: 0.6, roughness: 0.35 });
    g.add(box(1.8, 0.7, 4.2, c, 0, 0.6, 0)); const top = box(1.6, 0.6, 2.2, c, 0, 1.25, -0.2); g.add(top);
    const glass = new THREE.MeshStandardMaterial({ color: 0x0a0e12, metalness: 0.9, roughness: 0.05 }); g.add(box(1.62, 0.45, 2.0, glass, 0, 1.27, -0.2));
    for (const [x, z] of [[-0.85, -1.3], [0.85, -1.3], [-0.85, 1.3], [0.85, 1.3]]) { const w = cyl(0.34, 0.34, 0.24, M(0x111111), 16); w.rotation.z = Math.PI / 2; w.position.set(x, 0.34, z); g.add(w); }
    for (const x of [-0.6, 0.6]) { const hl = glowSprite(0xfff4d8, 1.2); hl.position.set(x, 0.65, 2.12); g.add(hl); }
    const sp = new THREE.SpotLight(0xfff4d8, 50, 30, 0.5, 0.5, 1.4); sp.position.set(0, 0.7, 2.2); sp.target.position.set(0, 0, 12); g.add(sp, sp.target); return g; },
  absperrung() { const g = new THREE.Group(); const m = M(0xd8d8d0); const r = M(0xc02020);
    for (const x of [-1, 1]) g.add(box(0.08, 1, 0.08, M(0x333333), x, 0.5, 0)); for (let i = 0; i < 5; i++) g.add(box(0.42, 0.18, 0.05, i % 2 ? m : r, -0.84 + i * 0.42, 0.85, 0)); return g; },
  trage() { const g = new THREE.Group(); const m = M(0x4a5a3a); g.add(box(0.6, 0.05, 2, m, 0, 0.5, 0)); for (const x of [-0.33, 0.33]) g.add(box(0.04, 0.04, 2.5, M(0x777777, { metalness: 0.7 }), x, 0.52, 0)); return g; },
  schreibtisch() { const g = new THREE.Group(); const m = M(0x4a3424, { map: TEX.wood() }); g.add(box(1.8, 0.07, 0.9, m, 0, 0.76, 0)); for (const [x, z] of [[-0.8, -0.35], [0.8, -0.35], [-0.8, 0.35], [0.8, 0.35]]) g.add(box(0.06, 0.76, 0.06, m, x, 0.38, z)); return g; },
  funkgeraet() { const g = new THREE.Group(); g.add(box(0.6, 0.35, 0.35, M(0x3a3e36, { metalness: 0.4 }), 0, 0.175, 0)); const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.1), new THREE.MeshStandardMaterial({ color: 0x111, emissive: 0xffa040, emissiveIntensity: 1.5 })); sc.position.set(-0.08, 0.24, 0.176); g.add(sc);
    for (const x of [0.15, 0.24]) { const k = cyl(0.03, 0.03, 0.04, M(0x111111)); k.rotation.x = Math.PI / 2; k.position.set(x, 0.12, 0.19); g.add(k); } return g; },
  felsbrocken(opt = {}) { const g = new THREE.Group(); const r = rng(opt.seed || 3); const m = M(0x5a4e44, { map: TEX.rock() }); for (let i = 0; i < 7; i++) { const s = 0.25 + r() * 0.5; const b = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), m); b.position.set((r() - 0.5) * 1.6, s * 0.5, (r() - 0.5) * 1.2); b.rotation.set(r() * 3, r() * 3, 0); b.castShadow = true; g.add(b); } return g; },
  leiter() { const g = new THREE.Group(); const m = M(0x6a5a40, { map: TEX.wood() }); for (const x of [-0.25, 0.25]) g.add(box(0.06, 4, 0.06, m, x, 2, 0)); for (let y = 0.3; y < 4; y += 0.35) g.add(box(0.5, 0.04, 0.04, m, 0, y, 0)); return g; },
  boot() { const g = new THREE.Group(); const hull = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.5, 0.7, 20, 1, true), M(0x6a3a24, { side: THREE.DoubleSide })); hull.scale.z = 2.6; hull.position.y = 0.35; g.add(hull); g.add(box(1.5, 0.05, 3.8, M(0x5a4030), 0, 0.2, 0)); return g; },
  schild(opt = {}) { const g = new THREE.Group(); g.add(box(0.06, 1.6, 0.06, M(0x333333), 0, 0.8, 0)); const p = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.55), new THREE.MeshStandardMaterial({ map: textCanvasTex([String(opt.text || 'GEFAHR')], { w: 512, h: 300, bg: '#e8c020', font: '900 90px Montserrat', color: '#111', lh: 100 }), roughness: 0.6 })); p.position.y = 1.5; g.add(p); return g; },
  feuerstelle() { const g = new THREE.Group(); const r = rng(5); for (let i = 0; i < 8; i++) { const s = cyl(0.04, 0.05, 0.6, M(0x2a1a10), 6); s.rotation.set(Math.PI / 2 - 0.3, i * 0.8, 0); s.position.set(Math.cos(i) * 0.15, 0.08, Math.sin(i) * 0.15); g.add(s); } return g; },
  telefon() { const g = new THREE.Group(); g.add(box(0.22, 0.08, 0.2, M(0x111111), 0, 0.04, 0)); const h = box(0.22, 0.05, 0.05, M(0x111111), 0, 0.11, 0); g.add(h); return g; },
  monitor() { const g = new THREE.Group(); g.add(box(0.7, 0.45, 0.05, M(0x111111), 0, 0.5, 0)); const s = new THREE.Mesh(new THREE.PlaneGeometry(0.64, 0.39), new THREE.MeshStandardMaterial({ color: 0x050505, emissive: 0x4a90c0, emissiveIntensity: 1.2 })); s.position.set(0, 0.5, 0.03); g.add(s); g.add(box(0.06, 0.25, 0.06, M(0x222222), 0, 0.15, 0)); return g; },
  scheinwerfer() { const g = new THREE.Group(); const pole = cyl(0.04, 0.05, 2.2, M(0x333333), 8); pole.position.y = 1.1; g.add(pole); const h = box(0.5, 0.4, 0.3, M(0x222222), 0, 2.25, 0); g.add(h);
    const gl = glowSprite(0xfff0d8, 1.5); gl.position.set(0, 2.25, 0.2); g.add(gl); const sp = new THREE.SpotLight(0xfff0d8, 80, 20, 0.6, 0.5, 1.5); sp.position.set(0, 2.25, 0.2); sp.target.position.set(0, 0, 6); g.add(sp, sp.target);
    const cone = makeBeamCone(7, 2.2, 0xfff0d8); cone.position.set(0, 2.25, 0.2); cone.rotation.x = -Math.PI / 2 + 0.33; cone.material.uniforms.uInt.value = 0.2; g.add(cone); return g; },
};

export function createProp(name, opt = {}) {
  const f = REQUISITEN[name]; if (!f) { console.warn('Unbekannte Requisite', name); return null; }
  const g = f(opt); g.name = 'prop_' + name; return g;
}
