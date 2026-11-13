// TEIL 5/10 – „Das Wrack“
import * as THREE from 'three';
import { createEngine, loadFonts, buildChunks, drawSubtitles, drawTitle, drawEndCard, W, SAFE, COLORS } from '/assets/engine.js';
import { createWorld, islandHeight, SPOTS } from '/assets/world.js';
import { createJonas, createDrowned } from '/assets/figures.js';
import { createCellar } from '/assets/cellar.js';
import { makeOldPhoto } from '/assets/photo.js';
import { addWatt, groundHeight, mudHeight, createBootprints } from '/assets/watt.js';
import { createWreckHull, createWreckInterior, hullPoint, vAtY, BREACH } from '/assets/wreck.js';
import { placeCamera, v3, lerp, easeInOut, smooth } from '/assets/lib.js';

export const DURATION = 60;
const PART = 5;
const STING = 52.3;
const RECAP = [4.6, 13.6];
let E, world, watt, hullW, inside, cellar, photoTex, jE, jI, jC, figC, prints, path, lantern, lanternFig, cTorch;

const FOG_DAY = new THREE.Color(0x2b5459), BG_DAY = new THREE.Color(0x335c62);

export async function init() {
  await loadFonts();
  const timing = await (await fetch('/teil_05/timing.json')).json();
  chunks = buildChunks(timing.woerter);
  E = createEngine();
  const ext = new THREE.Scene(); world = createWorld(ext);
  // ---- Das Foto von 1953 (wie in Teil 4) für den Rückblick
  {
    const keeper = createJonas(); ext.add(keeper.root); keeper.idle(0);
    const tg = islandHeight(SPOTS.tower.x, SPOTS.tower.z + 4.2);
    keeper.root.position.set(SPOTS.tower.x + 0.2, tg, SPOTS.tower.z + 4.3); keeper.root.rotation.y = 0.12;
    const ghost = createDrowned(9); ghost.position.set(SPOTS.tower.x - 0.62, tg - 0.05, SPOTS.tower.z + 3.6); ghost.rotation.y = 0.2; ext.add(ghost);
    const s = world.state; s.lamp = 0; s.houseLight = 0; s.fogDensity = 0.035; s.swell = 0.6;
    const fogDay = new THREE.Color(0x8e9c9a); const bgOld = ext.background.clone(), fogOld = ext.fog.color.clone();
    ext.background = fogDay.clone(); ext.fog.color.copy(fogDay); world.hemi.intensity = 3.2; world.moon.intensity = 3.5;
    world.update(0.5, null); world.fog.visible = false;
    const camP = v3(SPOTS.tower.x + 0.7, tg + 1.7, SPOTS.tower.z + 9.6);
    photoTex = makeOldPhoto(E, ext, { pos: camP, target: v3(SPOTS.tower.x - 0.1, tg + 1.9, SPOTS.tower.z + 3.8), fov: 34, exposure: 1.7 });
    ext.remove(keeper.root); ext.remove(ghost); ext.background = bgOld; ext.fog.color.copy(fogOld); world.fog.visible = true;
  }
  cellar = createCellar({ photoTex });
  jC = createJonas(); cellar.scene.add(jC.root);
  figC = createDrowned(4); figC.traverse((o) => o.layers.set(1)); cellar.scene.add(figC);
  // ---- Watt + Wrack
  watt = addWatt(world);
  hullW = createWreckHull(); ext.add(hullW);
  hullW.position.set(SPOTS.wreck.x, mudHeight(SPOTS.wreck.x, SPOTS.wreck.z) + 0.02, SPOTS.wreck.z);
  hullW.rotation.set(0, -0.85, 0.06); hullW.updateMatrixWorld(true);
  jE = createJonas(); ext.add(jE.root);
  // Weg von der Insel zum Bruch im Rumpf
  const breachL = hullPoint((BREACH.u0 + BREACH.u1) / 2, vAtY(0.1), 0); breachL.z += 0.9;
  const breachW = hullW.localToWorld(breachL.clone());
  path = new THREE.CatmullRomCurve3([v3(13.5, 0, -11), v3(19, 0, -15.5), v3(24.5, 0, -19.5), v3(29.5, 0, -22.4), v3(breachW.x, 0, breachW.z)]);
  prints = createBootprints(path.getSpacedPoints(60)); ext.add(prints);
  // Laterne im Nebel (Ausblick auf Teil 6)
  const lc = document.createElement('canvas'); lc.width = lc.height = 128; const lg = lc.getContext('2d');
  const gr = lg.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,225,180,1)'); gr.addColorStop(0.22, 'rgba(255,160,80,0.6)'); gr.addColorStop(1, 'rgba(255,140,60,0)'); lg.fillStyle = gr; lg.fillRect(0, 0, 128, 128);
  const lt = new THREE.CanvasTexture(lc); lt.colorSpace = THREE.SRGBColorSpace;
  lantern = new THREE.Sprite(new THREE.SpriteMaterial({ map: lt, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false }));
  lantern.visible = false; ext.add(lantern);
  lanternFig = createDrowned(17); lanternFig.visible = false; ext.add(lanternFig);
  // ---- Innenraum
  inside = createWreckInterior();
  jI = createJonas(); inside.scene.add(jI.root);
  cTorch = new THREE.SpotLight(0xffd7a8, 0, 12, 0.4, 0.55, 1.4); cellar.scene.add(cTorch, cTorch.target);
}
let chunks;

// ---------- Hilfen ----------
const HW = (x, y, z) => hullW.localToWorld(v3(x, y, z));       // Wrack-Koordinaten -> Welt
function extDay(t, o = {}) {
  const s = world.state; s.lamp = o.lamp ?? 0.3; s.houseLight = 0.25; s.fogDensity = o.fog ?? 0.024; s.swell = 0.3; s.beamPhase = 0.6;
  world.scene.background.copy(BG_DAY); world.scene.fog.color.copy(FOG_DAY);
  world.hemi.intensity = 2.9; world.moon.intensity = 1.9;
  watt.state.level = o.level ?? -2.75; watt.state.rush = o.rush ?? 0; watt.update(t);
  jE.root.visible = false; lantern.visible = false; lanternFig.visible = false; jE.torchOff();
  prints.userData.reveal(o.prints ?? 1);
}
// Jonas auf dem Weg (k 0..1), mit Einsinken im Schlick
function jonasOnPath(t, k, speed = 1, sink = 0.07) {
  const p = path.getPointAt(Math.min(1, k)); const tan = path.getTangentAt(Math.min(1, k));
  jE.root.visible = true; jE.walk(t, speed, 1); jE.root.position.set(p.x, groundHeight(p.x, p.z) - sink, p.z); jE.root.rotation.y = Math.atan2(tan.x, tan.z);
  return p;
}
// Laterne + Gestalt im Nebel (Richtung Meer, neben dem Wrack)
function lanternPos(p, tan, lev) {
  const side = v3(-tan.z, 0, tan.x); const lp = p.clone().addScaledVector(tan, 19).addScaledVector(side, 19);
  lantern.visible = true; lantern.position.set(lp.x + 0.45, lev + 1.45, lp.z); lantern.scale.setScalar(1.5);
  lanternFig.visible = true; lanternFig.position.set(lp.x, lev - 0.25, lp.z); lanternFig.rotation.y = Math.atan2(p.x - lp.x, p.z - lp.z);
  return lp;
}
const flashback = { exposure: 0.9, chroma: 2.2, flicker: 0.12, vignette: 1.4, bloom: 0.7 };

// Keller (Rückblick)
const PH = v3(0.55, 1.42, -1.05);
function holdPhoto() { const k = cellar.keyPhoto; k.position.copy(PH); k.rotation.set(-0.12, 0.04, 0.02); k.visible = true; }
function photoPt(u, v, dz = 0) { const k = cellar.keyPhoto; k.updateMatrixWorld(true); return k.localToWorld(v3((u - 0.5) * 0.16, (0.5 - v) * 0.1455, dz)); }
const FACE = [0.545, 0.43];
function camOnPhoto(t, uv, dist, fov, shake = 0.5) { E.camera.near = 0.005; const p = photoPt(uv[0], uv[1]); const c = photoPt(uv[0], uv[1], dist * 2.2); placeCamera(E.camera, c, p, fov * 0.5, t, shake); }
function cellarBase(t, o = {}) { E.camera.near = 0.05; cellar.hemi.intensity = 0.6; cellar.doorLight.intensity = 7; cellar.update(t, { bulb: 1, fill: 1, ...o }); jC.root.visible = false; figC.visible = false; cTorch.intensity = 0; holdPhoto(); }

// Innenraum: Buch-Koordinaten (Leserichtung: Kamera auf +z der Buchgruppe)
const BK = (x, y, z) => { inside.book.grp.updateMatrixWorld(true); return inside.book.grp.localToWorld(v3(x, y, z)); };
function inBase(t, o = {}) {
  E.camera.near = 0.03; inside.update(t, { torchOn: 0, ...o }); inside.lidOpen(o.lid ?? 1); jI.root.visible = false; jI.torchOff();
}
function jonasAtBook(t, look = 0.75) {
  const p = BK(0, -0.62, 0.62); jI.root.visible = true; jI.idle(t); jI.root.position.set(p.x, 0, p.z);
  const c = BK(0, 0, 0); jI.root.rotation.y = Math.atan2(c.x - p.x, c.z - p.z); jI.neck.rotation.x = look;
  jI.armL.sh.rotation.x = -0.7; jI.armL.el.rotation.x = -0.6; jI.holdTorch(1, 0.6); jI.armR.sh.rotation.x = -1.0;
  jI.torchLight.intensity = 0; // das Licht kommt vom geführten Spot
  return p;
}
function torchAt(from, to, k = 1) { inside.torch.position.copy(from); inside.torch.target.position.copy(to); inside.torch.intensity = 26 * k; }

const shots = [
  // ---- HOOK: das Logbuch – meine Handschrift
  { a: 0, b: 2.45, scene: 'in', run(t, l) {
      inBase(t); const k = easeInOut(l / 2.45);
      torchAt(BK(0.12, 0.5, 0.35), BK(0.02, 0, -0.02), 0.12);
      placeCamera(E.camera, BK(lerp(-0.1, -0.05, k), lerp(0.36, 0.26, k), lerp(0.22, 0.14, k)), BK(-0.11, 0, -0.02), 40, t, 0.5);
      return { exposure: 1.15 };
    } },
  { a: 2.45, b: 4.6, scene: 'in', run(t, l) {
      inBase(t); const p = jonasAtBook(t, 0.4);
      const face = v3(p.x, 1.78, p.z); const c = BK(0, 0, 0);
      const dir = v3(c.x - p.x, 0, c.z - p.z).normalize();
      torchAt(BK(0.1, 0.45, 0.4), BK(0, 0, 0), 0.3);
      inside.hemi.intensity = 1.2;
      placeCamera(E.camera, face.clone().addScaledVector(dir, 1.25).add(v3(0, -0.55, 0)), face.clone().add(v3(0, -0.1, 0)), 40, t, 0.6);
      return { exposure: 1.3 };
    } },
  // ---- WAS BISHER GESCHAH: das Foto, das Gesicht, die Gestalt im Spiegel
  { a: 4.6, b: 9.5, scene: 'cellar', recap: true, run(t, l) {
      cellarBase(t, { swing: 0.08 }); const k = easeInOut(l / 4.9);
      camOnPhoto(t, [0.5, 0.5], lerp(0.12, 0.2, k), 40, 0.5);
      return flashback;
    } },
  { a: 9.5, b: 11.65, scene: 'cellar', recap: true, run(t, l) {
      cellarBase(t, { swing: 0.08 }); camOnPhoto(t, FACE, lerp(0.075, 0.05, l / 2.15), 40, 0.4);
      return flashback;
    } },
  { a: 11.65, b: 13.6, scene: 'cellar', recap: true, run(t, l) {
      cellarBase(t, { swing: 0.1 }); cellar.keyPhoto.visible = false;
      jC.root.visible = true; jC.idle(t); jC.root.position.set(1.2, 0, -0.2); jC.root.rotation.y = Math.PI / 2 + 0.25;
      figC.visible = true; figC.position.set(0.7, 0, 0.3); figC.rotation.set(0, Math.PI / 2 + 0.3, -0.15);
      placeCamera(E.camera, v3(0.55 + l * 0.05, 1.72, 0.25), v3(1.975, 1.6, 0.12), 38, t, 0.4);
      return flashback;
    } },
  // ---- Am Morgen war Ebbe. Das Meer war weg.
  { a: 13.6, b: 16.3, scene: 'ext', run(t, l) {
      extDay(t, { prints: 0, fog: 0.017, lamp: 0.5 }); const k = easeInOut(l / 2.7);
      placeCamera(E.camera, v3(lerp(8, 10, k), 9.5, lerp(-5.5, -7, k)), v3(36, -2.4, -32), 48, t, 0.6);
      return { exposure: 1.05 };
    } },
  // ---- Nur Schlick. Und Nebel.
  { a: 16.3, b: 18.4, scene: 'ext', run(t, l) {
      extDay(t, { prints: 0 }); const x = lerp(21, 23.5, l / 2.1), z = lerp(-15, -17.3, l / 2.1); const g = mudHeight(x, z);
      placeCamera(E.camera, v3(x, g + 0.55, z), v3(x + 8, g - 0.5, z - 7), 50, t, 0.5);
      return { exposure: 1.1 };
    } },
  // ---- Und draußen im Watt: das Wrack.
  { a: 18.4, b: 20.9, scene: 'ext', run(t, l) {
      extDay(t, { prints: 0, fog: lerp(0.03, 0.024, l / 2.5) }); const k = easeInOut(l / 2.5);
      placeCamera(E.camera, v3(lerp(15, 17, k), 0.2, lerp(-9.5, -11, k)), HW(0, 1.2, 0), 26, t, 0.5);
      return { exposure: 1.1 };
    } },
  // ---- Ich lief los. Meine Stiefel sanken bei jedem Schritt ein.
  { a: 20.9, b: 22.6, scene: 'ext', run(t, l) {
      const k = lerp(0.0, 0.06, l / 1.7); extDay(t, { prints: k });
      const p = jonasOnPath(t, k, 0.9);
      placeCamera(E.camera, v3(p.x - 3.4, p.y + 1.6, p.z + 3.0), v3(p.x + 4, p.y + 0.6, p.z - 4), 44, t, 0.9);
      return { exposure: 1.1 };
    } },
  { a: 22.6, b: 24.6, scene: 'ext', run(t, l) {
      const k = lerp(0.46, 0.5, l / 2.0); extDay(t, { prints: k }); const p = jonasOnPath(t, k, 0.8, 0.12);
      const tan = path.getTangentAt(k); const side = v3(-tan.z, 0, tan.x);
      const c = p.clone().addScaledVector(side, 2.2).addScaledVector(tan, 1.2); c.y = groundHeight(c.x, c.z) + 0.25;
      placeCamera(E.camera, c, v3(p.x, groundHeight(p.x, p.z) + 0.2, p.z), 36, t, 0.6);
      return { exposure: 1.15 };
    } },
  // ---- Der Rumpf war schwarz und voller Muscheln.
  { a: 24.6, b: 27.35, scene: 'ext', run(t, l) {
      extDay(t); const k = easeInOut(l / 2.75);
      const c = HW(lerp(-3.0, -1.0, k), 1.1, 6.2), tg = HW(lerp(-1.5, 0.5, k), 0.6, 2.3);
      E.camera.near = 0.05; placeCamera(E.camera, c, tg, 42, t, 0.6);
      return { exposure: 1.5 };
    } },
  // ---- Drinnen tropfte es.
  { a: 27.35, b: 28.95, scene: 'in', run(t, l) {
      inBase(t); placeCamera(E.camera, v3(lerp(2.2, 1.8, l / 1.6), 1.0, 1.4), v3(-2.5, 1.2, -0.3), 52, t, 0.7);
      return { exposure: 1.25 };
    } },
  // ---- Und auf einer Kiste lag ein Logbuch.
  { a: 28.95, b: 31.15, scene: 'in', run(t, l) {
      inBase(t, { lid: 0 }); const k = easeInOut(smooth(0, 1.2, l));
      const src = v3(0.2, 1.5, 1.2); torchAt(src, v3(lerp(-1.0, -2.2, k), lerp(0.3, 0.62, k), lerp(-0.5, 0.35, k)));
      inside.hemi.intensity = 0.6;
      placeCamera(E.camera, v3(0.0, 1.55, 1.35), v3(lerp(-1.4, -2.2, k), lerp(0.5, 0.62, k), lerp(0.0, 0.35, k)), 40, t, 0.8);
      return { exposure: 1.2 };
    } },
  // ---- Ich schlug es auf.
  { a: 31.15, b: 32.8, scene: 'in', run(t, l) {
      inBase(t, { lid: easeInOut(smooth(0.15, 1.35, l)) }); jonasAtBook(t, 0.8);
      torchAt(BK(0.1, 0.5, 0.45), BK(0, 0, 0), 0.15);
      placeCamera(E.camera, BK(-0.45, 0.42, 0.42), BK(0, 0.02, 0), 40, t, 0.6);
      return { exposure: 1.2 };
    } },
  // ---- Es war meine Schrift. Jeder Buchstabe. Jeder Bogen.
  { a: 32.8, b: 36.9, scene: 'in', run(t, l) {
      inBase(t); torchAt(BK(0.05, 0.5, 0.4), BK(-0.12, 0, 0), 0.12);
      const k = easeInOut(l / 4.1);
      const tx = lerp(-0.2, -0.04, k), tz = lerp(-0.08, 0.04, k);
      placeCamera(E.camera, BK(tx, 0.16, tz + 0.1), BK(tx, 0, tz - 0.01), 40, t, 0.35);
      return { exposure: 1.15 };
    } },
  // ---- Der letzte Eintrag: Heute. 3:33 Uhr. Die Flut kommt.
  { a: 36.9, b: 42.45, scene: 'in', run(t, l) {
      inBase(t); torchAt(BK(-0.05, 0.5, 0.4), BK(0.12, 0, 0), 0.12 - 0.03 * smooth(4.5, 5.5, l) * (Math.sin(t * 40) > 0 ? 1 : 0));
      const k = easeInOut(smooth(0, 5.0, l));
      placeCamera(E.camera, BK(lerp(0.12, 0.12, k), lerp(0.3, 0.17, k), lerp(0.2, 0.08, k)), BK(0.12, 0, lerp(-0.01, -0.0, k)), 40, t, 0.35);
      return { exposure: 1.15, vignette: lerp(1, 1.4, k) };
    } },
  // ---- Dann hörte ich es. Ein Rauschen. (Wasser dringt ein)
  { a: 42.45, b: 44.8, scene: 'in', run(t, l) {
      inBase(t, { jet: smooth(0.6, 1.1, l), flood: smooth(0.8, 2.4, l) * 0.12 });
      const p = jonasAtBook(t, lerp(0.7, -0.1, easeInOut(smooth(0.0, 0.5, l)))); jI.root.rotation.y += smooth(0.3, 1.2, l) * 0.9;
      inside.torch.position.set(p.x, 1.3, p.z); inside.torch.target.position.set(0.2, 0.4, 2.4); inside.torch.intensity = 20;
      placeCamera(E.camera, v3(0.7, 1.25, 1.5), v3(-2.2, lerp(1.4, 1.0, smooth(0.6, 1.6, l)), 0.5), 50, t, lerp(0.6, 1.3, smooth(0.5, 1, l)));
      return { exposure: 1.2 };
    } },
  // ---- Ich rannte hinaus.
  { a: 44.8, b: 46.55, scene: 'ext', run(t, l) {
      const lev = lerp(-2.45, -2.25, l / 1.75); extDay(t, { level: lev, rush: 0.5 });
      const b = HW(0.1, 0, 3.0); const out = path.getPointAt(0.8);
      const k = smooth(0, 1.75, l); const p = b.clone().lerp(out, k);
      jE.root.visible = true; jE.walk(t, 1.9, 1.35); jE.root.position.set(p.x, groundHeight(p.x, p.z) - 0.08, p.z);
      jE.root.rotation.y = Math.atan2(out.x - b.x, out.z - b.z);
      const c = path.getPointAt(0.7); c.y = groundHeight(c.x, c.z) + 1.5;
      placeCamera(E.camera, c, v3(p.x, groundHeight(p.x, p.z) + 1.1, p.z), 42, t, 1.5);
      return { exposure: 1.15 };
    } },
  // ---- Das Wasser kam. Viel zu schnell.
  { a: 46.55, b: 49.45, scene: 'ext', run(t, l) {
      const lev = lerp(-2.4, -1.95, l / 2.9); extDay(t, { level: lev, rush: 1 });
      const k = 0.78 - l * 0.035; const p = jonasOnPath(t, k, 1.6, 0.1); jE.root.rotation.y += Math.PI;
      placeCamera(E.camera, v3(p.x + 6, p.y + 4.0, p.z - 7), v3(p.x + 1, p.y, p.z - 1.5), 50, t, 1.0);
      return { exposure: 1.1 };
    } },
  // ---- Und der Weg zurück … war weg.
  { a: 49.45, b: STING, scene: 'ext', run(t, l) {
      const lev = lerp(-1.95, -1.7, l / 2.85); extDay(t, { level: lev, rush: 0.8, lamp: 0.45 });
      const k = 0.66; const p = path.getPointAt(k); const tan = path.getTangentAt(k);
      jE.root.visible = true; jE.idle(t); jE.root.position.set(p.x, groundHeight(p.x, p.z) - 0.12, p.z); jE.root.rotation.y = Math.atan2(-tan.x, -tan.z);
      const c = p.clone().addScaledVector(tan, 2.2 + l * 0.15); c.y = lev + 1.6;
      placeCamera(E.camera, c, v3(SPOTS.tower.x, 3, SPOTS.tower.z), 40, t, 0.6);
      return { exposure: 1.1 };
    } },
  // ---- SCHRECK: Welle, er dreht sich – eine Laterne im Nebel
  { a: STING, b: 54.6, scene: 'ext', run(t, l) {
      const lev = lerp(-1.7, -1.45, smooth(0, 0.6, l)); extDay(t, { level: lev, rush: 1.3, lamp: 0.45 });
      const k = 0.66; const p = path.getPointAt(k); const tan = path.getTangentAt(k); const side = v3(-tan.z, 0, tan.x);
      jE.root.visible = true; jE.idle(t); jE.root.position.set(p.x, groundHeight(p.x, p.z) - 0.12, p.z);
      jE.root.rotation.y = Math.atan2(-tan.x, -tan.z) + lerp(0, Math.PI, easeInOut(smooth(0.1, 0.6, l)));
      const lp = lanternPos(p, tan, lev);
      lantern.material.opacity = smooth(0.6, 1.2, l);
      const c = p.clone().addScaledVector(side, 2.4).addScaledVector(tan, -0.8); c.y = lev + 0.55 + 0.06 * Math.sin(t * 5);
      const w = easeInOut(smooth(0.35, 0.9, l));
      const look = v3(p.x, lev + 1.4, p.z).lerp(v3(lp.x, lev + 1.3, lp.z), w);
      placeCamera(E.camera, c, look, lerp(44, 38, w), t, l < 0.5 ? 2.2 : 1.0);
      return { exposure: 1.1, flash: Math.max(0, 0.3 - l * 1.5) };
    } },
  // ---- Das Wasser schlägt über der Kamera zusammen
  { a: 54.6, b: 56.8, scene: 'ext', run(t, l) {
      const lev = lerp(-1.45, -1.2, l / 2.2); extDay(t, { level: lev, rush: 1.4, lamp: 0.45 });
      const k = 0.66; const p = path.getPointAt(k); const tan = path.getTangentAt(k);
      const lp = lanternPos(p, tan, lev); lantern.material.opacity = 1;
      const c = p.clone().addScaledVector(tan, 0.4); c.y = lev + lerp(0.3, -0.25, smooth(0.6, 1.1, l)) + 0.05 * Math.sin(t * 6);
      const under = c.y < lev + 0.02;
      if (under) { world.scene.fog.color.set(0x06171a); world.scene.fog.density = 0.35; world.scene.background.set(0x06171a); }
      placeCamera(E.camera, c, v3(lp.x, lev + 1.0, lp.z), 36, t, 1.4);
      return { exposure: under ? 0.9 : 1.1, fade: 1 - smooth(1.1, 2.0, l), flash: (l > 0.55 && l < 0.62) ? 0.25 : 0 };
    } },
];

function drawRecapLabel(ctx, t) {
  if (t < RECAP[0] || t >= RECAP[1]) return;
  const k = Math.min(1, (t - RECAP[0]) / 0.2) * Math.min(1, (RECAP[1] - t) / 0.2);
  ctx.save(); ctx.globalAlpha = k; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const cx = (W - SAFE.right + SAFE.left) / 2 + 30;
  ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(cx - 330, 300, 660, 92);
  ctx.fillStyle = COLORS.subHi; ctx.fillRect(cx - 330, 300, 8, 92);
  ctx.font = '62px Anton'; ctx.fillStyle = '#fff'; ctx.letterSpacing = '4px'; ctx.fillText('WAS BISHER GESCHAH', cx + 4, 348);
  ctx.restore();
}

export function renderFrame(t, type = 'image/jpeg') {
  if (t >= 56.8) {
    drawEndCard(E.ctx, t, { start: 56.8, next: PART + 1, question: 'Wie kommt er zurück?' });
  } else {
    const shot = shots.find((s) => t >= s.a && t < s.b) || shots[shots.length - 1];
    const post = shot.run(t, t - shot.a) || {};
    let scene;
    if (shot.scene === 'ext') { world.update(t, E.camera); watt.update(t); scene = world.scene; if (shot.a === 54.6 && E.camera.position.y < watt.state.level + 0.02) { world.scene.fog.density = 0.35; } }
    else if (shot.scene === 'in') scene = inside.scene;
    else scene = cellar.scene;
    E.render(scene, t, post);
    drawTitle(E.ctx, t, { part: PART, show: [0, 3.0] });
    drawRecapLabel(E.ctx, t);
    drawSubtitles(E.ctx, chunks, t);
  }
  return E.out.toDataURL(type, 0.95);
}

export function renderCover() {
  const shot = shots.find((s) => s.a === STING);
  const T = 53.6; const post = shot.run(T, T - shot.a); post.flash = 0; post.exposure = 1.25;
  world.update(T, E.camera); watt.update(T);
  E.render(world.scene, T, post);
  const c = E.ctx; const cx = 495;
  const g = c.createLinearGradient(0, 0, 0, 700); g.addColorStop(0, 'rgba(0,0,0,0.75)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, 1080, 700);
  const g2 = c.createLinearGradient(0, 1250, 0, 1920); g2.addColorStop(0, 'rgba(0,0,0,0)'); g2.addColorStop(1, 'rgba(0,0,0,0.85)'); c.fillStyle = g2; c.fillRect(0, 1250, 1080, 670);
  c.save(); c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
  c.font = '230px Anton'; c.lineWidth = 26; c.strokeStyle = '#000'; c.strokeText(`TEIL ${PART}/10`, cx, 330); c.fillStyle = '#fff'; c.fillText(`TEIL ${PART}/10`, cx, 330);
  c.fillStyle = '#ffb04a'; c.fillRect(cx - 300, 470, 600, 10);
  c.font = '800 36px Montserrat'; c.letterSpacing = '5px'; c.lineWidth = 10; c.strokeText('DER LEUCHTTURM VON NEBELSAND', cx, 535); c.fillStyle = '#e8f2f2'; c.fillText('DER LEUCHTTURM VON NEBELSAND', cx, 535);
  c.letterSpacing = '0px';
  c.font = '900 80px Montserrat'; c.lineWidth = 18; c.strokeText('DIE FLUT KOMMT.', cx, 1430); c.fillStyle = '#ffb04a'; c.fillText('DIE FLUT KOMMT.', cx, 1430);
  c.font = '900 64px Montserrat'; c.lineWidth = 15; c.strokeText('DER WEG IST WEG.', cx, 1530); c.fillStyle = '#fff'; c.fillText('DER WEG IST WEG.', cx, 1530);
  c.restore();
  return E.out.toDataURL('image/png');
}

// Debug: freie Kamera (nur für Testbilder)
export function debug(which, pos, tgt, fov = 40, t = 30, o = {}) {
  let scene;
  if (which === 'ext') { extDay(t, o); world.update(t, E.camera); watt.update(t); scene = world.scene; E.camera.near = 0.05;
    const P = which === 'ext' && o.hull ? HW(...pos) : v3(...pos), T = o.hull ? HW(...tgt) : v3(...tgt); placeCamera(E.camera, P, T, fov, t, 0); }
  else { inBase(t, o); scene = inside.scene; placeCamera(E.camera, v3(...pos), v3(...tgt), fov, t, 0); }
  E.render(scene, t, { exposure: o.exposure ?? 1.2 });
  return E.out.toDataURL('image/png');
}
