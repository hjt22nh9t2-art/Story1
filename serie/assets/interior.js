// Innenräume: Wachraum im Turm (Logbuch, Öllampe, Funkgerät, Uhr) und Flur im Wärterhaus (Tür, Treppe)
import * as THREE from 'three';
import { PALETTE } from './world.js';
import { makeNoiseTexture, rng, noise2, smooth } from './lib.js';

const std = (o) => new THREE.MeshStandardMaterial(o);

// ---------- Logbuch-Seiten ----------
export const LOG_ENTRIES = [
  ['12. Okt.', 'NW 6, Sicht 2 sm. Lampe 18:40 an.'],
  ['', 'Kutter "Greta" passiert 21:15.'],
  ['13. Okt.', 'W 5. Nebel ab Mitternacht.'],
  ['', 'Funk: nur Rauschen. 02:10'],
  ['14. Okt.', 'NW 7. Lampe geprüft, Docht neu.'],
  ['', 'Ebbe 04:52. Wrack sichtbar.'],
  ['15. Okt.', 'Klopfen gehört. 03:33.'],
  ['', 'Niemand an der Tür.'],
  ['16. Okt.', 'Wieder 03:33. Nasse Spuren.'],
];

function paperBase(g, w, h, seed) {
  const r = rng(seed);
  const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#d9ccad'); gr.addColorStop(1, '#c4b38f');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(90,70,40,${r() * 0.06})`; g.fillRect(r() * w, r() * h, 2 + r() * 6, 2 + r() * 6); }
  // Wasserflecken
  for (let i = 0; i < 4; i++) { const x = r() * w, y = r() * h, rad = 40 + r() * 120; const rg = g.createRadialGradient(x, y, rad * 0.6, x, y, rad);
    rg.addColorStop(0, 'rgba(120,95,55,0.0)'); rg.addColorStop(0.9, 'rgba(120,95,55,0.18)'); rg.addColorStop(1, 'rgba(120,95,55,0)'); g.fillStyle = rg; g.fillRect(0, 0, w, h); }
  g.strokeStyle = 'rgba(70,90,120,0.35)'; g.lineWidth = 2;
  for (let y = 150; y < h - 40; y += 64) { g.beginPath(); g.moveTo(40, y); g.lineTo(w - 30, y); g.stroke(); }
  g.strokeStyle = 'rgba(160,40,40,0.4)'; g.beginPath(); g.moveTo(170, 0); g.lineTo(170, h); g.stroke();
}

export function makeLogPage({ entries = LOG_ENTRIES, last = false, seed = 1, title = 'Leuchtfeuer Nebelsand – Logbuch' } = {}) {
  const w = 1024, h = 1400; const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  paperBase(g, w, h, seed);
  g.fillStyle = '#1f2a3d'; g.textBaseline = 'alphabetic';
  if (!last) {
    g.font = '700 54px Caveat'; g.fillText(title, 60, 100);
    let y = 207; const r = rng(seed + 5);
    for (const [d, txt] of entries) {
      g.save(); g.translate(0, y); g.rotate((r() - 0.5) * 0.012);
      g.font = '700 50px Caveat'; g.fillText(d, 30, 0); g.fillText(txt, 190, 0); g.restore(); y += 128;
    }
  } else {
    // Die letzte Seite: nur ein Satz, zittrige Hand, dreimal unterstrichen
    g.save(); g.translate(512, 700); g.rotate(-0.05);
    g.font = '700 108px Caveat'; g.textAlign = 'center'; g.fillStyle = '#141a26';
    const txt1 = 'Mach das Licht', txt2 = 'nicht aus.';
    for (let k = 0; k < 2; k++) { g.globalAlpha = k ? 0.35 : 1; g.fillText(txt1, k * 2, -40 + k); g.fillText(txt2, k * 2, 80 + k); }
    g.globalAlpha = 1; g.strokeStyle = '#141a26'; g.lineCap = 'round';
    const r = rng(9);
    for (let i = 0; i < 3; i++) { g.lineWidth = 6 - i; g.beginPath(); let x = -260, yy = 120 + i * 22; g.moveTo(x, yy); while (x < 260) { x += 20; g.lineTo(x, yy + (r() - 0.5) * 7); } g.stroke(); }
    g.restore();
    g.font = '700 46px Caveat'; g.fillStyle = 'rgba(31,42,61,0.8)'; g.fillText('17. Okt.  03:33', 60, 160);
    // Tintenklecks
    g.fillStyle = 'rgba(15,20,30,0.85)'; g.beginPath(); g.arc(770, 980, 16, 0, 7); g.fill(); g.beginPath(); g.arc(795, 1000, 6, 0, 7); g.fill();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

function bentPage(w, h, dir) {
  const g = new THREE.PlaneGeometry(w, h, 24, 2); const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i); const u = (x / w + 0.5); const k = dir > 0 ? u : 1 - u; p.setZ(i, Math.sin(k * Math.PI) * 0.012 + (1 - k) * 0.004); }
  g.computeVertexNormals(); return g;
}

export function createLogbook() {
  const grp = new THREE.Group(); grp.name = 'logbook';
  const W = 0.24, H = 0.32;
  const cover = new THREE.Mesh(new THREE.BoxGeometry(W * 2 + 0.03, 0.02, H + 0.02), std({ color: 0x3a1d14, roughness: 0.6 })); cover.position.y = -0.006; cover.castShadow = true; grp.add(cover);
  const stack = new THREE.Mesh(new THREE.BoxGeometry(W * 2, 0.025, H - 0.01), std({ color: 0xcfc2a3, roughness: 0.9 })); stack.position.y = 0.012; grp.add(stack);
  const left = new THREE.Mesh(bentPage(W, H, -1), std({ map: makeLogPage({ seed: 3 }), roughness: 0.9 }));
  left.rotation.x = -Math.PI / 2; left.position.set(-W / 2, 0.027, 0); grp.add(left);
  const right = new THREE.Mesh(bentPage(W, H, 1), std({ map: makeLogPage({ seed: 4, entries: LOG_ENTRIES.slice(4) }), roughness: 0.9 }));
  right.rotation.x = -Math.PI / 2; right.position.set(W / 2, 0.027, 0); grp.add(right);
  // Blätternde Seite (Gelenk am Buchrücken)
  const hinge = new THREE.Group(); hinge.position.set(0, 0.03, 0); grp.add(hinge);
  const flipFront = new THREE.Mesh(new THREE.PlaneGeometry(W, H), std({ map: right.material.map, roughness: 0.9 }));
  flipFront.rotation.x = -Math.PI / 2; flipFront.position.x = W / 2; hinge.add(flipFront);
  const flipBack = new THREE.Mesh(new THREE.PlaneGeometry(W, H), std({ map: makeLogPage({ seed: 8, entries: LOG_ENTRIES.slice(2, 7) }), roughness: 0.9 }));
  flipBack.rotation.x = Math.PI / 2; flipBack.rotation.z = Math.PI; flipBack.position.x = W / 2; flipBack.position.y = -0.001; hinge.add(flipBack);
  const lastTex = makeLogPage({ last: true, seed: 12 });
  const book = { grp, left, right, hinge, W, H, lastTex,
    flip: (k) => { hinge.rotation.z = Math.PI * Math.min(1, Math.max(0, k)); hinge.visible = k > 0.001 && k < 0.999; },
    showLast: () => { right.material.map = lastTex; right.material.needsUpdate = true; },
  };
  book.flip(0);
  return book;
}

// ---------- Radiowecker mit orangen Ziffern ----------
function makeClockTex() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 256; const g = c.getContext('2d');
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.userData.draw = (txt, glitch = 0) => {
    g.fillStyle = '#070504'; g.fillRect(0, 0, 512, 256);
    g.font = '700 190px "Montserrat"'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.shadowColor = '#ff7a1a'; g.shadowBlur = 26; g.fillStyle = `rgba(255,150,60,${1 - glitch * 0.6})`;
    g.fillText(txt, 256 + glitch * 6, 136); g.shadowBlur = 0;
    g.fillStyle = 'rgba(255,255,255,0.04)'; for (let y = 0; y < 256; y += 6) g.fillRect(0, y, 512, 2);
    t.needsUpdate = true;
  };
  t.userData.draw('3:31');
  return t;
}

export function createRadio() {
  const grp = new THREE.Group(); grp.name = 'radio';
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.22, 0.2), std({ color: 0x2c2a26, roughness: 0.55, metalness: 0.3 })); body.position.y = 0.11; body.castShadow = true; grp.add(body);
  const grille = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.14), std({ color: 0x0d0d0c, roughness: 0.9, map: makeNoiseTexture({ seed: 2, base: '#111', var: 25, scaleX: 60, scaleY: 60 }) })); grille.position.set(-0.11, 0.11, 0.101); grp.add(grille);
  const dial = new THREE.Mesh(new THREE.PlaneGeometry(0.17, 0.05), std({ color: 0x221a10, emissive: 0xff9a40, emissiveIntensity: 0.35 })); dial.position.set(0.09, 0.16, 0.101); grp.add(dial);
  const knobM = std({ color: 0x9a9890, roughness: 0.3, metalness: 0.8 });
  for (const x of [0.05, 0.14]) { const k = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.02, 14), knobM); k.rotation.x = Math.PI / 2; k.position.set(x, 0.07, 0.11); grp.add(k); }
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.008, 8, 6), std({ color: 0x220000, emissive: 0xff3b1a, emissiveIntensity: 4 })); led.position.set(0.18, 0.16, 0.102); grp.add(led);
  const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.5, 4), knobM); ant.position.set(0.17, 0.42, -0.05); ant.rotation.z = -0.35; grp.add(ant);
  const mic = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.09, 0.03), std({ color: 0x1a1a1a, roughness: 0.4 })); mic.position.set(-0.28, 0.05, 0.05); mic.rotation.set(-1.2, 0.3, 0); grp.add(mic);
  // Uhr
  const clockTex = makeClockTex();
  const clockBody = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 0.09), std({ color: 0x1c1b19, roughness: 0.5 })); clockBody.position.set(0.36, 0.05, 0.05); clockBody.rotation.y = -0.35; grp.add(clockBody);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.17, 0.085), new THREE.MeshBasicMaterial({ map: clockTex, toneMapped: false })); face.position.set(0, 0, 0.046); clockBody.add(face);
  return { grp, led, dial, clockTex, clockBody, face };
}

export function createOilLamp() {
  const grp = new THREE.Group(); grp.name = 'oillamp';
  const brass = std({ color: 0x8a6a2a, roughness: 0.35, metalness: 0.85 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.08, 20), brass); base.position.y = 0.04; grp.add(base);
  const tank = new THREE.Mesh(new THREE.SphereGeometry(0.075, 20, 14), brass); tank.scale.y = 0.6; tank.position.y = 0.11; grp.add(tank);
  const glass = new THREE.Mesh(new THREE.LatheGeometry([0.03, 0.05, 0.06, 0.05, 0.035, 0.035].map((r, i) => new THREE.Vector2(r, i * 0.04)), 20),
    std({ color: 0xffe0b0, transparent: true, opacity: 0.25, roughness: 0.05, emissive: 0xff9a40, emissiveIntensity: 0.6, side: THREE.DoubleSide, depthWrite: false }));
  glass.position.y = 0.15; grp.add(glass);
  const flame = new THREE.Mesh(new THREE.SphereGeometry(0.014, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffc070 })); flame.scale.y = 2.2; flame.position.y = 0.2; grp.add(flame);
  const light = new THREE.PointLight(PALETTE.lamp, 3.2, 7, 1.6); light.position.y = 0.22; light.castShadow = true; light.shadow.mapSize.set(512, 512); light.shadow.bias = -0.002; light.shadow.radius = 6; grp.add(light);
  return { grp, light, flame, glass,
    flicker: (t, level = 1) => { const f = 0.85 + 0.1 * noise2(t * 6, 1) + 0.05 * noise2(t * 17, 3); light.intensity = 3.2 * f * level; flame.scale.set(1, 2.2 * f, 1); flame.visible = level > 0.05; glass.material.emissiveIntensity = 0.6 * f * level; } };
}

// ---------- Wachraum ----------
export function createWatchRoom() {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x05090b); scene.fog = new THREE.FogExp2(0x0a1416, 0.06);
  const plaster = makeNoiseTexture({ seed: 31, base: '#8f9290', var: 45, scaleX: 14, scaleY: 9 }); plaster.repeat.set(3, 1.5);
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 4, 40, 1, true), std({ color: 0xb8bab4, map: plaster, roughness: 0.95, side: THREE.BackSide }));
  wall.position.y = 2; wall.receiveShadow = true; scene.add(wall);
  const wood = makeNoiseTexture({ seed: 12, base: '#4b3a2a', var: 28, scaleX: 3, scaleY: 40, streak: 16 }); wood.repeat.set(2, 2);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(3.2, 40), std({ color: 0x9a8670, map: wood, roughness: 0.8 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const ceil = new THREE.Mesh(new THREE.CircleGeometry(3.2, 40), std({ color: 0x2a2c2c, roughness: 1 })); ceil.rotation.x = Math.PI / 2; ceil.position.y = 3.6; scene.add(ceil);
  // Balken
  for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.18, 0.2), std({ color: 0x2b2118, map: wood })); b.position.set(0, 3.5, -1.5 + i * 1.5); scene.add(b); }
  // Fenster (Blick nach draußen, Leuchtfeuer streicht vorbei)
  const winGrp = new THREE.Group(); winGrp.position.set(0, 1.7, -3.12); scene.add(winGrp);
  const outside = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.2), new THREE.MeshBasicMaterial({ color: 0x0d2730 })); winGrp.add(outside);
  const frameM = std({ color: 0xd6d3c8, roughness: 0.8 });
  for (const [w, h, x, y] of [[1.05, 0.08, 0, 0.62], [1.05, 0.08, 0, -0.62], [0.08, 1.3, 0.5, 0], [0.08, 1.3, -0.5, 0], [0.04, 1.2, 0, 0], [0.9, 0.04, 0, 0]]) {
    const f = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.1), frameM); f.position.set(x, y, 0.04); winGrp.add(f);
  }
  const sill = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.06, 0.35), frameM); sill.position.set(0, -0.68, 0.12); winGrp.add(sill);
  // Tisch
  const tableM = std({ color: 0x6a4e36, map: wood, roughness: 0.7 });
  const table = new THREE.Group(); table.position.set(0, 0, -1.2); scene.add(table);
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.06, 0.85), tableM); top.position.y = 0.78; top.castShadow = top.receiveShadow = true; table.add(top);
  for (const [x, z] of [[-0.68, -0.36], [0.68, -0.36], [-0.68, 0.36], [0.68, 0.36]]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.76, 0.06), tableM); l.position.set(x, 0.38, z); l.castShadow = true; table.add(l); }
  const book = createLogbook(); book.grp.position.set(-0.05, 0.81, 0.08); book.grp.rotation.y = 0.08; table.add(book.grp);
  const lamp = createOilLamp(); lamp.grp.position.set(-0.52, 0.81, -0.18); table.add(lamp.grp);
  const radio = createRadio(); radio.grp.position.set(0.42, 0.81, -0.22); radio.grp.rotation.y = -0.25; table.add(radio.grp);
  // Füller + Becher
  const pen = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.14, 8), std({ color: 0x111111, metalness: 0.6, roughness: 0.3 })); pen.rotation.set(Math.PI / 2, 0, 0.6); pen.position.set(0.32, 0.815, 0.18); table.add(pen);
  const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.1, 16), std({ color: 0xd9d4c5, roughness: 0.5 })); mug.position.set(-0.4, 0.86, 0.22); mug.castShadow = true; table.add(mug);
  // Stuhl
  const chair = new THREE.Group(); chair.position.set(0, 0, -0.45); scene.add(chair);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.05, 0.45), tableM); seat.position.y = 0.47; seat.castShadow = true; chair.add(seat);
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.55, 0.04), tableM); back.position.set(0, 0.75, 0.22); back.castShadow = true; chair.add(back);
  for (const [x, z] of [[-0.21, -0.2], [0.21, -0.2], [-0.21, 0.2], [0.21, 0.2]]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.47, 0.04), tableM); l.position.set(x, 0.235, z); chair.add(l); }
  // Ölzeug des Vorgängers am Haken
  const coat = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.75, 4, 12), std({ color: 0x8a6f1c, roughness: 0.35 })); coat.scale.z = 0.5; coat.position.set(-2.6, 1.55, -1.6); coat.rotation.y = 0.9; coat.castShadow = true; scene.add(coat);
  const hat = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), std({ color: 0x7a6118, roughness: 0.35 })); hat.position.set(-2.62, 2.15, -1.58); scene.add(hat);
  // Regal mit Gläsern/Büchern
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.04, 0.3), tableM); shelf.position.set(2.2, 1.9, -2.0); shelf.rotation.y = -0.85; scene.add(shelf);
  const r = rng(40);
  for (let i = 0; i < 7; i++) { const bk = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22 + r() * 0.08, 0.18), std({ color: new THREE.Color().setHSL(0.05 + r() * 0.1, 0.4, 0.15 + r() * 0.1), roughness: 0.8 }));
    bk.position.set(-0.45 + i * 0.08, 0.13, 0); shelf.add(bk); }
  // Treppenöffnung
  const hole = new THREE.Mesh(new THREE.CircleGeometry(0.7, 24), new THREE.MeshBasicMaterial({ color: 0x000000 })); hole.rotation.x = -Math.PI / 2; hole.position.set(1.6, 0.005, 1.2); scene.add(hole);

  const hemi = new THREE.HemisphereLight(0x4d7480, 0x100c09, 0.7); scene.add(hemi);
  const moonIn = new THREE.SpotLight(0x5d8fa8, 6, 12, 0.6, 0.8, 1.2); moonIn.position.set(0, 2.2, -3.4); moonIn.target.position.set(0, 0.6, 0); scene.add(moonIn, moonIn.target);
  // Lichtkegel des Leuchtfeuers fegt durchs Fenster
  const sweep = new THREE.SpotLight(0xffc890, 0, 14, 0.3, 0.7, 1.0); sweep.position.set(0, 2.0, -3.6); scene.add(sweep, sweep.target);

  const jonas = null;
  return { scene, table, book, lamp, radio, chair, outside, sweep, moonIn, winGrp, hemi, coat,
    update(t, { beamPeriod = 9, lampLevel = 1, beam = 1 } = {}) {
      lamp.flicker(t, lampLevel);
      const ph = ((t / beamPeriod) % 1); const hit = Math.pow(Math.max(0, Math.cos((ph - 0.5) * Math.PI * 2)), 40) * beam;
      outside.material.color.setRGB(0.05 + hit * 0.9, 0.15 + hit * 0.7, 0.19 + hit * 0.45);
      sweep.intensity = hit * 60; sweep.target.position.set(Math.sin(ph * Math.PI * 2) * 3, 0.5, 1);
      radio.led.material.emissiveIntensity = 2 + 3 * Math.max(0, noise2(t * 9, 4));
      radio.dial.material.emissiveIntensity = 0.3 + 0.12 * noise2(t * 3, 2);
    } };
}

// ---------- Flur im Wärterhaus (Haustür) ----------
function makeFrostTex() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 384; const g = c.getContext('2d');
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.userData.draw = (light = 1, figure = 0, fx = 0) => {
    g.filter = 'none';
    const gr = g.createLinearGradient(0, 0, 0, 384); gr.addColorStop(0, `rgba(${60 * light},${110 * light},${130 * light},1)`); gr.addColorStop(1, `rgba(${25 * light},${55 * light},${70 * light},1)`);
    g.fillStyle = gr; g.fillRect(0, 0, 256, 384);
    if (figure > 0) {
      g.filter = 'blur(14px)'; g.globalAlpha = figure; g.fillStyle = '#010304';
      g.beginPath(); g.ellipse(128 + fx, 120, 44, 56, 0, 0, 7); g.fill();
      g.beginPath(); g.moveTo(10 + fx, 400); g.quadraticCurveTo(30 + fx, 200, 128 + fx, 175); g.quadraticCurveTo(226 + fx, 200, 246 + fx, 400); g.fill();
      g.globalAlpha = 1;
    }
    g.filter = 'none';
    const r = rng(3); for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(255,255,255,${r() * 0.05})`; g.fillRect(r() * 256, r() * 384, 3, 3); }
    t.needsUpdate = true;
  };
  t.userData.draw(1, 0);
  return t;
}

function makeGapTex() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 16; const g = c.getContext('2d');
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.userData.draw = (light = 1, feet = 0) => {
    g.clearRect(0, 0, 512, 16);
    const gr = g.createLinearGradient(0, 0, 512, 0); gr.addColorStop(0, `rgba(80,140,170,0)`); gr.addColorStop(0.15, `rgba(120,180,200,${light})`); gr.addColorStop(0.85, `rgba(120,180,200,${light})`); gr.addColorStop(1, 'rgba(80,140,170,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 512, 16);
    if (feet > 0) { g.fillStyle = `rgba(0,0,0,${feet})`; g.filter = 'blur(6px)'; g.fillRect(170, 0, 60, 16); g.fillRect(285, 0, 60, 16); g.filter = 'none'; }
    t.needsUpdate = true;
  };
  t.userData.draw(1, 0); return t;
}

export function createHallway() {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x020405); scene.fog = new THREE.FogExp2(0x061014, 0.08);
  const plaster = makeNoiseTexture({ seed: 51, base: '#7d817f', var: 40, scaleX: 10, scaleY: 10 }); plaster.repeat.set(2, 1);
  const wallM = std({ color: 0x9da3a0, map: plaster, roughness: 0.95 });
  const wood = makeNoiseTexture({ seed: 52, base: '#3d2f22', var: 25, scaleX: 3, scaleY: 40, streak: 16 }); wood.repeat.set(3, 3);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(4, 7), std({ color: 0x7d6a55, map: wood, roughness: 0.75 })); floor.rotation.x = -Math.PI / 2; floor.position.z = -1; floor.receiveShadow = true; scene.add(floor);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(4, 3), wallM); back.position.set(0, 1.5, -4); scene.add(back);
  const left = new THREE.Mesh(new THREE.PlaneGeometry(7, 3), wallM); left.rotation.y = Math.PI / 2; left.position.set(-1.5, 1.5, -1); left.receiveShadow = true; scene.add(left);
  const right = new THREE.Mesh(new THREE.PlaneGeometry(7, 3), wallM); right.rotation.y = -Math.PI / 2; right.position.set(1.5, 1.5, -1); scene.add(right);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(4, 7), std({ color: 0x1b1d1d })); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, 2.7, -1); scene.add(ceil);
  // Holzvertäfelung
  const wain = std({ color: 0x2c3a35, roughness: 0.6 });
  for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.0, 7), wain); p.position.set(s * 1.48, 0.5, -1); scene.add(p); }
  // Tür (Drehpunkt am Scharnier)
  const doorPivot = new THREE.Group(); doorPivot.position.set(-0.5, 0, -3.97); scene.add(doorPivot);
  const doorM = std({ color: 0x24382f, roughness: 0.55, map: makeNoiseTexture({ seed: 53, base: '#555', var: 30, scaleX: 2, scaleY: 30, streak: 8 }) });
  const door = new THREE.Group(); door.position.x = 0.5; doorPivot.add(door);
  const slab = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.1, 0.06), doorM); slab.position.y = 1.05; slab.castShadow = true; door.add(slab);
  for (const [w, h, x, y] of [[0.34, 0.5, -0.2, 0.55], [0.34, 0.5, 0.2, 0.55]]) { const p = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.02), doorM); p.position.set(x, y, 0.035); door.add(p); }
  const frost = makeFrostTex();
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.75), new THREE.MeshBasicMaterial({ map: frost, toneMapped: false })); glass.position.set(0, 1.55, 0.035); door.add(glass);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 10), std({ color: 0x8a6a2a, metalness: 0.9, roughness: 0.3 })); knob.position.set(0.38, 1.0, 0.07); door.add(knob);
  const frameM = std({ color: 0xcfcac0, roughness: 0.8 });
  for (const [w, h, x, y] of [[0.1, 2.2, -0.55, 1.1], [0.1, 2.2, 0.55, 1.1], [1.2, 0.1, 0, 2.15]]) { const f = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.1), frameM); f.position.set(x, y, -3.95); scene.add(f); }
  // Lichtspalt unter der Tür
  const gapTex = makeGapTex();
  const gap = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.25), new THREE.MeshBasicMaterial({ map: gapTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  gap.rotation.x = -Math.PI / 2; gap.position.set(0, 0.004, -3.82); scene.add(gap);
  // Wasser, das unter der Tür hereinläuft
  const water = new THREE.Mesh(new THREE.CircleGeometry(1, 40), std({ color: 0x050a0c, roughness: 0.02, metalness: 0.6, transparent: true, opacity: 0.9 }));
  water.rotation.x = -Math.PI / 2; water.position.set(0, 0.006, -3.9); water.scale.set(0.001, 0.001, 1); scene.add(water);
  // Garderobe
  const hook = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.06, 0.06), wain); hook.position.set(1.44, 1.75, -2.5); hook.rotation.y = Math.PI / 2; scene.add(hook);
  const jacket = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.6, 4, 10), std({ color: PALETTE.jacket, roughness: 0.55 })); jacket.scale.z = 0.5; jacket.position.set(1.32, 1.3, -2.3); jacket.rotation.y = Math.PI / 2; scene.add(jacket);
  // Staub
  const dustG = new THREE.BufferGeometry(); const N = 110; const dp = new Float32Array(N * 3); const r = rng(8);
  for (let i = 0; i < N; i++) { dp[i * 3] = (r() - 0.5) * 1.3; dp[i * 3 + 1] = 2.1 + r() * 0.1; dp[i * 3 + 2] = -3.85 + r() * 0.3; }
  dustG.setAttribute('position', new THREE.BufferAttribute(dp, 3)); dustG.userData.base = Float32Array.from(dp); dustG.userData.v = Array.from({ length: N }, () => 0.4 + r() * 0.8);
  const dust = new THREE.Points(dustG, new THREE.PointsMaterial({ color: 0x8fb0b8, size: 0.007, transparent: true, opacity: 0.45, depthWrite: false })); scene.add(dust);

  const hemi = new THREE.HemisphereLight(0x3a5e6a, 0x080605, 0.75); scene.add(hemi);
  const fillH = new THREE.PointLight(0x4f8090, 2.5, 7, 1.5); fillH.position.set(-1.0, 2.2, -1.5); scene.add(fillH);
  const doorLight = new THREE.SpotLight(0x6fa0b8, 4, 8, 0.7, 0.9, 1.2); doorLight.position.set(0, 1.6, -4.4); doorLight.target.position.set(0, 0, 0); scene.add(doorLight, doorLight.target);
  const warm = new THREE.PointLight(PALETTE.lamp, 1.2, 6, 2); warm.position.set(0.8, 2.3, 1.5); scene.add(warm);

  return { scene, doorPivot, door, frost, gapTex, water, dust, doorLight, warm, hemi,
    knocks: [], // Zeiten in Szene-Lokalzeit
    update(t, { light = 1, figure = 0, feet = 0, water: wl = 0, knocks = [], warmLevel = 1 } = {}) {
      let jolt = 0, dustAmt = 0;
      for (const k of knocks) { const d = t - k; if (d >= 0) { jolt += Math.exp(-d * 18) * Math.sin(d * 90) * (d < 0.4 ? 1 : 0); dustAmt = Math.max(dustAmt, d < 1.6 ? 1 - d / 1.6 : 0); } }
      doorPivot.rotation.y = jolt * 0.006; door.position.z = jolt * 0.008;
      frost.userData.draw(light, figure, Math.sin(t * 0.7) * 6);
      gapTex.userData.draw(light * 0.9, feet);
      water.scale.set(Math.max(0.001, wl * 0.9), Math.max(0.001, wl * 0.6), 1);
      doorLight.intensity = 4 * light; warm.intensity = 1.2 * warmLevel;
      // Staub rieselt nach jedem Klopfen
      const pos = dust.geometry.attributes.position, b = dust.geometry.userData.base, v = dust.geometry.userData.v;
      const firstKnock = knocks.length ? knocks.filter((k) => k <= t).pop() : undefined;
      for (let i = 0; i < pos.count; i++) {
        const d = firstKnock === undefined ? -1 : t - firstKnock;
        const y = d < 0 ? -10 : b[i * 3 + 1] - d * v[i] * 0.9 - d * d * 0.2;
        pos.setXYZ(i, b[i * 3] + Math.sin(i + t) * 0.02, y, b[i * 3 + 2] + (d > 0 ? d * 0.15 : 0));
      }
      pos.needsUpdate = true; dust.material.opacity = 0.45 * dustAmt;
      hemi.intensity = 0.75 * (0.5 + 0.5 * light);
    } };
}
