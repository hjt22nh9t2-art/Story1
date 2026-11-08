// TEIL 2/10 – „Die Spuren“
import * as THREE from 'three';
import { createEngine, loadFonts, buildChunks, drawSubtitles, drawTitle, drawEndCard, W, SAFE, COLORS } from '/assets/engine.js';
import { createWorld, islandHeight } from '/assets/world.js';
import { createJonas } from '/assets/figures.js';
import { createWatchRoom, createHallway, createBedroom } from '/assets/interior.js';
import { createFootprints, createStairPrints, createPuddle } from '/assets/props.js';
import { placeCamera, v3, lerp, easeInOut, smooth, noise2 } from '/assets/lib.js';

export const DURATION = 60;
const PART = 2;
let E, world, room, hall, bedroom, jExt, jHall, jBed, chunks;
let extTorch, hallTorch, bedTorch, extPrints, D, N, SIDE, SHORE;
const STING = 52.8;
const RECAP = [3.6, 10.0];

function torchSpot(scene, shadow = false) {
  const s = new THREE.SpotLight(0xffd7a8, 0, 22, 0.36, 0.55, 1.4); s.castShadow = shadow;
  if (shadow) { s.shadow.mapSize.set(512, 512); s.shadow.bias = -0.002; s.shadow.radius = 3; }
  scene.add(s, s.target); return s;
}
function aim(spot, from, to, intensity = 45) { spot.position.copy(from); spot.target.position.copy(to); spot.intensity = intensity; }

export async function init() {
  await loadFonts();
  const timing = await (await fetch('/teil_02/timing.json')).json();
  chunks = buildChunks(timing.woerter);
  E = createEngine();
  const ext = new THREE.Scene(); world = createWorld(ext);
  jExt = createJonas(); ext.add(jExt.root); extTorch = torchSpot(ext, false);
  room = createWatchRoom();
  hall = createHallway(); jHall = createJonas(); hall.scene.add(jHall.root); hallTorch = torchSpot(hall.scene, true);
  bedroom = createBedroom(); jBed = createJonas(); bedroom.scene.add(jBed.root); bedTorch = torchSpot(bedroom.scene, true);

  // Haustür in Weltkoordinaten
  ext.updateMatrixWorld(true);
  const doorW = world.house.localToWorld(v3(0.1, 0, 2.42));
  N = v3(0, 0, 1).applyQuaternion(world.house.quaternion).setY(0).normalize();
  SIDE = v3(N.z, 0, -N.x);
  D = doorW.clone().addScaledVector(N, 0.25); D.y = islandHeight(D.x, D.z);
  SHORE = v3(2.6, 0, 22.0);
  const path = [SHORE.clone(), v3(3.6, 0, 18.5), v3(4.4, 0, 14.5), D.clone().addScaledVector(N, 3.0), D.clone().addScaledVector(N, 0.9), D.clone().addScaledVector(N, 0.05)];
  extPrints = createFootprints(path, { heightFn: (x, z) => Math.max(islandHeight(x, z), -0.25), stride: 0.66, pairAtEnd: false, seed: 5, lift: 0.07, size: 0.3 });
  ext.add(extPrints);
  // Spuren in Flur (von der Tür zur Treppe) + auf den Stufen
  const hp = createFootprints([v3(0.15, 0, -4.6), v3(0.1, 0, -3.6), v3(-0.05, 0, -2.0), v3(-0.6, 0, -0.6), v3(-0.95, 0, 0.25)], { stride: 0.62, pairAtEnd: false, seed: 6 });
  hall.scene.add(hp);
  hall.scene.add(createStairPrints(hall.stepTops, { dirZ: 1 }));
  // Spuren oben: vom Absatz ins Zimmer bis neben das Bett
  const bp = createFootprints([v3(0.05, 0, 4.3), v3(0.05, 0, 2.0), v3(0.0, 0, 0.45), v3(-0.25, 0, -0.65), v3(-0.56, 0, -0.95)], { stride: 0.6, pairAtEnd: true, seed: 7 });
  bedroom.scene.add(bp);
  const pud = createPuddle(0.32, 0.8); pud.position.set(-0.6, 0.006, -0.97); bedroom.scene.add(pud);
}

const G = (x, z) => islandHeight(x, z);
function extNight(t) {
  const s = world.state; s.lamp = 0; s.houseLight = 0; s.fogDensity = 0.022; s.swell = 1; s.beamPhase = 0;
  world.hemi.intensity = 0.95; world.moon.intensity = 2.0;
  jExt.root.visible = false; jExt.torchOff(); extTorch.intensity = 0;
}
const torchWobble = (t, a = 1) => ({ x: a * 0.05 * noise2(t * 1.7, 3), y: a * 0.06 * noise2(t * 1.3, 8) });
const flashback = { exposure: 0.9, chroma: 2.2, flicker: 0.12, vignette: 1.4, bloom: 0.7 };

const shots = [
  // ---- HOOK: Tür geht auf – niemand da
  { a: 0, b: 2.4, scene: 'hall', run(t, l) {
      hall.update(l, { light: 1, doorOpen: easeInOut(smooth(0.05, 1.3, l)), warmLevel: 0 });
      jHall.root.visible = true; jHall.idle(t); jHall.holdTorch(1, 0.9); jHall.root.position.set(0.15, 0, -3.05); jHall.root.rotation.y = Math.PI;
      const w = torchWobble(t); jHall.torso.rotation.y = w.y;
      hallTorch.intensity = 0;
      placeCamera(E.camera, v3(0.6, 1.72, lerp(-1.0, -1.5, l / 2.4)), v3(0, 1.3, -6), 46, t, 1.0);
      return { exposure: 1.15 };
    } },
  { a: 2.4, b: 3.6, scene: 'ext', run(t, l) {
      extNight(t); jExt.root.visible = true; jExt.idle(t); jExt.holdTorch(1, 1);
      jExt.root.position.copy(D).addScaledVector(N, -0.1); jExt.root.rotation.y = Math.atan2(N.x, N.z);
      const c = D.clone().addScaledVector(N, 4.6 - l * 0.4).addScaledVector(SIDE, 0.6); c.y += 1.5;
      placeCamera(E.camera, c, D.clone().add(v3(0, 1.4, 0)), 44, t, 0.9);
      return { exposure: 1.15 };
    } },
  // ---- WAS BISHER GESCHAH
  { a: 3.6, b: 5.1, scene: 'room', recap: true, run(t, l) {
      room.update(t, { lampLevel: 0.8 }); room.book.right.material.map = room.book.lastTex; room.book.flip(1);
      placeCamera(E.camera, v3(0.08, 1.12 - l * 0.04, -0.98), v3(0.075, 0.82, -1.115), 34, t, 0.5); E.camera.rotateZ(-0.06);
      return flashback;
    } },
  { a: 5.1, b: 6.9, scene: 'room', recap: true, run(t, l) {
      room.update(t, { lampLevel: 0.6 }); room.radio.clockTex.userData.draw('3:33', l < 0.1 ? 1 : 0); room.scene.updateMatrixWorld(true);
      const fp = room.radio.face.getWorldPosition(v3(0, 0, 0)); const n = v3(0, 0, 1).applyQuaternion(room.radio.face.getWorldQuaternion(new THREE.Quaternion()));
      placeCamera(E.camera, fp.clone().addScaledVector(n, 0.32 - l * 0.03), fp, 30, t, 0.4);
      return flashback;
    } },
  { a: 6.9, b: 8.0, scene: 'ext', recap: true, run(t, l) {
      extNight(t); world.state.lamp = l < 0.25 ? 1 : l < 0.7 ? (Math.sin(t * 60) > 0.2 ? 0.8 : 0.05) : 0;
      placeCamera(E.camera, v3(-13, 5, 19), v3(-2, 19, -3), 50, t, 0.7);
      return flashback;
    } },
  { a: 8.0, b: 10.0, scene: 'hall', recap: true, run(t, l) {
      hall.update(l, { light: 0.6, figure: 0.7, feet: 1, knocks: [0.5, 1.1, 1.7], warmLevel: 0 }); jHall.root.visible = false; hallTorch.intensity = 0;
      placeCamera(E.camera, v3(0.25, 1.55, -0.4 - l * 0.2), v3(0, 1.2, -3.97), 44, t, 0.8);
      return flashback;
    } },
  // ---- Draußen: nur Nebel
  { a: 10.0, b: 14.2, scene: 'ext', run(t, l) {
      extNight(t); jExt.root.visible = true; jExt.idle(t); jExt.holdTorch(1, 1);
      const p = D.clone().addScaledVector(N, 1.8); jExt.root.position.copy(p); jExt.root.position.y = G(p.x, p.z);
      jExt.root.rotation.y = Math.atan2(N.x, N.z); jExt.torso.rotation.y = 0.45 * Math.sin(l * 0.9 - 0.6);
      const c = D.clone().addScaledVector(N, 0.25 + l * 0.08).addScaledVector(SIDE, 0.25); c.y = G(c.x, c.z) + 2.05;
      placeCamera(E.camera, c, p.clone().addScaledVector(N, 12).add(v3(0, 0.2, 0)), 52, t, 0.9);
      return { exposure: 1.2 };
    } },
  // ---- Lampe auf den Boden
  { a: 14.2, b: 15.95, scene: 'ext', run(t, l) {
      extNight(t); jExt.root.visible = true; jExt.idle(t); jExt.holdTorch(1, 1);
      const p = D.clone().addScaledVector(N, 1.4); jExt.root.position.copy(p); jExt.root.position.y = G(p.x, p.z); jExt.root.rotation.y = Math.atan2(N.x, N.z);
      const k = easeInOut(l / 1.75); jExt.armR.sh.rotation.x = lerp(-0.9, -0.25, k); jExt.neck.rotation.x = lerp(0, 0.45, k);
      const c = p.clone().addScaledVector(N, -0.9).addScaledVector(SIDE, 0.55); c.y = p.y + 1.95;
      const tgt = p.clone().addScaledVector(N, lerp(6, 2.2, k)); tgt.y = p.y + lerp(1.2, 0, k);
      placeCamera(E.camera, c, tgt, 48, t, 0.9);
      return { exposure: 1.2 };
    } },
  // ---- Fußspuren. Nass. Barfuß.
  { a: 15.95, b: 19.5, scene: 'ext', run(t, l) {
      extNight(t); world.state.fogDensity = 0.02;
      const u = lerp(0.84, 0.95, l / 3.55); const p = extPrints.userData.curve.getPointAt(u); p.y = G(p.x, p.z);
      const tan = extPrints.userData.curve.getTangentAt(u).setY(0).normalize();
      const c = p.clone().addScaledVector(tan, -0.9).add(v3(0.35, 0.55, 0)); c.y = G(c.x, c.z) + 0.5;
      const w = torchWobble(t, 0.6);
      aim(extTorch, p.clone().addScaledVector(tan, -2.2).add(v3(0.3, 1.6, 0)), p.clone().addScaledVector(tan, 0.6).add(v3(w.x, 0, w.y)), 9);
      placeCamera(E.camera, c, p.clone().addScaledVector(tan, 0.8), 40, t, 0.7);
      return { exposure: 1.3 };
    } },
  // ---- vom Wasser herauf … direkt zu meiner Tür
  { a: 19.5, b: 22.8, scene: 'ext', run(t, l) {
      extNight(t); world.state.fogDensity = 0.024;
      const c = D.clone().addScaledVector(N, 0.7).addScaledVector(SIDE, 0.35); c.y = G(c.x, c.z) + lerp(0.5, 0.42, l / 3.3);
      const tgt = SHORE.clone().add(v3(0, 0.9, 0));
      aim(extTorch, D.clone().addScaledVector(N, 0.2).add(v3(0, 1.7, 0)), D.clone().addScaledVector(N, 5.5), 22);
      placeCamera(E.camera, c, tgt, 46, t, 0.6);
      return { exposure: 1.3 };
    } },
  // ---- und sie gingen nicht zurück (von oben, an Jonas vorbei)
  { a: 22.8, b: 25.4, scene: 'ext', run(t, l) {
      extNight(t); jExt.root.visible = true; jExt.idle(t); jExt.holdTorch(1, 0.7);
      const p = D.clone().addScaledVector(N, 0.7).addScaledVector(SIDE, 0.55); jExt.root.position.copy(p); jExt.root.position.y = G(p.x, p.z);
      jExt.root.rotation.y = Math.atan2(N.x, N.z) + Math.PI * 0.85; jExt.armR.sh.rotation.x = -0.35;
      const ctr = D.clone().addScaledVector(N, 1.3); ctr.y = G(ctr.x, ctr.z);
      const c = ctr.clone().addScaledVector(N, 2.6 - l * 0.15).addScaledVector(SIDE, 0.2); c.y += 3.4;
      aim(extTorch, p.clone().add(v3(0, 1.6, 0)), ctr.clone().addScaledVector(N, 1.0), 12);
      placeCamera(E.camera, c, ctr.clone().addScaledVector(N, 0.4), 52, t, 0.5);
      return { exposure: 1.25 };
    } },
  // ---- Sie führten an mir vorbei. Ins Haus.
  { a: 25.4, b: 27.8, scene: 'hall', run(t, l) {
      hall.update(l, { light: 1, doorOpen: 1, warmLevel: 0 });
      jHall.root.visible = true; jHall.idle(t); jHall.holdTorch(1, 0.9);
      jHall.root.position.set(0.25, 0, -4.35 + smooth(0.8, 2.4, l) * 0.6); jHall.root.rotation.y = lerp(Math.PI, 0.1, easeInOut(smooth(0.2, 1.4, l)));
      jHall.armR.sh.rotation.x = -0.4;
      hallTorch.intensity = 0;
      placeCamera(E.camera, v3(0.35, 0.55, -1.2), v3(0.05, 0.9, -4.5), 50, t, 0.7);
      return { exposure: 1.2 };
    } },
  // ---- Ich folgte ihnen durch den Flur
  { a: 27.8, b: 31.3, scene: 'hall', run(t, l) {
      hall.update(l, { light: 1, doorOpen: 1, warmLevel: 0 });
      const k = l / 3.5; const z = lerp(-3.3, -0.9, k);
      jHall.root.visible = true; jHall.walk(t, 0.55, 0.8); jHall.holdTorch(1, 1); jHall.armR.sh.rotation.x = -0.55;
      jHall.root.position.set(lerp(0.15, -0.2, k), 0, z); jHall.root.rotation.y = lerp(0, -0.35, k);
      placeCamera(E.camera, v3(0.5, 2.05, z - 2.3), v3(-0.5, 0.6, z + 2.0), 56, t, 1.0);
      return { exposure: 1.2 };
    } },
  // ---- Die Treppe hinauf. Stufe für Stufe.
  { a: 31.3, b: 34.2, scene: 'hall', run(t, l) {
      hall.update(l, { light: 0.8, doorOpen: 1, warmLevel: 0 });
      const st = hall.stepTops; const fi = Math.min(st.length - 1, l / 2.9 * 6); const i0 = Math.floor(fi), f = fi - i0;
      const sA = st[Math.max(0, i0 - 1)] || { y: 0, z: 0.1 }, sB = st[i0];
      jHall.root.visible = true; jHall.walk(t, 0.5, 0.9); jHall.holdTorch(1, 1); jHall.armR.sh.rotation.x = -1.1;
      jHall.root.position.set(-0.95, lerp(i0 === 0 ? 0 : sA.y, sB.y, f) - 0.03, lerp(i0 === 0 ? 0.1 : sA.z, sB.z, f)); jHall.root.rotation.y = 0;
      aim(hallTorch, v3(0.3, 1.0, -1.2), v3(-0.95, 1.6, 2.4), 8);
      placeCamera(E.camera, v3(-0.1, 0.4, -0.9), v3(-0.95, 2.2, 3.2), 54, t, 0.8);
      return { exposure: 1.25 };
    } },
  // ---- Oben knarrte etwas. Dann war es still. (Blick die Treppe hinauf)
  { a: 34.2, b: 38.3, scene: 'bed', run(t, l) {
      bedroom.update(t, { doorOpen: 0.1 + 0.12 * smooth(0.3, 1.6, l) });
      jBed.root.visible = false;
      const k = easeInOut(smooth(0, 2.6, l));
      aim(bedTorch, v3(0.15, lerp(0.9, 1.4, k), lerp(5.4, 4.6, k)), v3(0, 0.9, 2.0), 6);
      placeCamera(E.camera, v3(0.1, lerp(0.95, 1.45, k), lerp(5.3, 4.5, k)), v3(0, 1.05, 2.0), 44, t, 1.0);
      return { exposure: 1.2 };
    } },
  // ---- „Du bist allein.“ Jonas oben an der Treppe (Gegenlicht)
  { a: 38.3, b: 42.5, scene: 'bed', run(t, l) {
      bedroom.update(t, { doorOpen: 0.22 });
      const k = smooth(0, 2.2, l);
      jBed.root.visible = true; jBed.walk(t, 0.45, 0.7 * (1 - k)); jBed.holdTorch(1, 1);
      const w = torchWobble(t, 1.6); jBed.armR.sh.rotation.x = -1.0 + w.x; jBed.torso.rotation.y = w.y;
      jBed.root.position.set(0.05, lerp(-0.5, 0, k), lerp(4.4, 3.3, k)); jBed.root.rotation.y = Math.PI;
      aim(bedTorch, v3(0.25, 1.4, 3.4), v3(0, 1.0, 2.0), 4 * (1 + 0.3 * noise2(t * 5, 2)));
      placeCamera(E.camera, v3(0.4, 1.55, 5.6 - l * 0.1), v3(0, 1.15, 2.0), 46, t, 0.8);
      return { exposure: 1.1 };
    } },
  // ---- Die Spuren führten in mein Schlafzimmer (Tür auf)
  { a: 42.5, b: 45.3, scene: 'bed', run(t, l) {
      const k = easeInOut(smooth(0.2, 1.6, l));
      bedroom.update(t, { doorOpen: lerp(0.22, 0.95, k) }); jBed.root.visible = false;
      const c = v3(0.15, 1.6, lerp(3.3, 2.35, easeInOut(l / 2.8)));
      const w = torchWobble(t, 0.8);
      aim(bedTorch, c.clone().add(v3(0.25, -0.2, 0)), v3(-0.3 + w.x, 0, -0.5 + w.y), 16);
      placeCamera(E.camera, c, v3(-0.35, 0.5, -0.8), 48, t, 0.9);
      return { exposure: 1.2 };
    } },
  // ---- Und dort … hörten sie auf. (tief an den Spuren entlang)
  { a: 45.3, b: 48.7, scene: 'bed', run(t, l) {
      bedroom.update(t, { doorOpen: 0.95 }); jBed.root.visible = false;
      const k = easeInOut(l / 3.4); const c = v3(lerp(0.3, 0.15, k), lerp(0.75, 0.6, k), lerp(1.4, 0.35, k));
      aim(bedTorch, v3(0.4, 1.5, lerp(1.8, 0.9, k)), v3(-0.5, 0, -0.9), 24);
      placeCamera(E.camera, c, v3(-0.5, 0.0, -0.9), 50, t, 0.7);
      return { exposure: 1.2 };
    } },
  // ---- Direkt neben meinem Bett. (von oben) – die Decke sinkt ein
  { a: 48.7, b: STING, scene: 'bed', run(t, l) {
      const dent = smooth(51.3, 52.6, t);
      bedroom.update(t, { doorOpen: 0.95, dent, stain: smooth(51.6, 52.8, t) * 0.6 }); jBed.root.visible = false;
      const k = easeInOut(l / 4.1);
      aim(bedTorch, v3(0.5, 1.7, 0.4), v3(-0.7, 0.2, -1.0), 32);
      placeCamera(E.camera, v3(lerp(0.25, 0.1, k), lerp(2.45, 2.2, k), lerp(0.1, -0.15, k)), v3(-0.6, 0.0, -0.95), 58, t, 0.5);
      return { exposure: 1.2 };
    } },
  // ---- CLIFFHANGER: Schreck – jemand sitzt auf dem Bett (unsichtbar)
  { a: STING, b: 56.8, scene: 'bed', run(t, l) {
      const st = smooth(STING, 55.5, t);
      bedroom.update(t, { doorOpen: 0.95, dent: 1, stain: 0.6 + 0.4 * st }); jBed.root.visible = false;
      const flick = (l < 0.6 && Math.sin(t * 70) > 0.3) ? 0.25 : 1;
      aim(bedTorch, v3(0.4, 1.6, -0.2), v3(-0.88, 0.55, -0.95), 10 * flick);
      const push = Math.min(1, l / 0.15) * 0.35 + l * 0.05;
      placeCamera(E.camera, v3(0.25 - push * 0.6, 1.4 - push * 0.25, -0.3 - push * 0.25), v3(-0.88, 0.55, -0.95), 46, t, l < 1.2 ? 1.8 : 0.7);
      const fade = t > 56.2 ? Math.max(0, 1 - (t - 56.2) / 0.5) : 1;
      return { exposure: 1.15, fade, flash: Math.max(0, 0.3 - l * 1.6) };
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
    drawEndCard(E.ctx, t, { start: 56.8, next: PART + 1, question: 'Wer saß auf dem Bett?' });
  } else {
    const shot = shots.find((s) => t >= s.a && t < s.b) || shots[shots.length - 1];
    const post = shot.run(t, t - shot.a) || {};
    let scene;
    if (shot.scene === 'ext') { world.update(t, E.camera); scene = world.scene; }
    else if (shot.scene === 'room') scene = room.scene;
    else if (shot.scene === 'hall') scene = hall.scene;
    else scene = bedroom.scene;
    E.render(scene, t, post);
    drawTitle(E.ctx, t, { part: PART, show: [0, 3.0] });
    drawRecapLabel(E.ctx, t);
    drawSubtitles(E.ctx, chunks, t);
  }
  return E.out.toDataURL(type, 0.95);
}

export function renderCover() {
  const shot = shots[shots.length - 2];
  const post = shot.run(52.4, 52.4 - shot.a); post.exposure = 1.45;
  placeCamera(E.camera, v3(0.1, 1.55, -0.1), v3(-0.6, 0.15, -1.0), 50, 0, 0);
  E.render(bedroom.scene, 52.4, post);
  const c = E.ctx; const cx = 495;
  const g = c.createLinearGradient(0, 0, 0, 700); g.addColorStop(0, 'rgba(0,0,0,0.75)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, 1080, 700);
  const g2 = c.createLinearGradient(0, 1250, 0, 1920); g2.addColorStop(0, 'rgba(0,0,0,0)'); g2.addColorStop(1, 'rgba(0,0,0,0.85)'); c.fillStyle = g2; c.fillRect(0, 1250, 1080, 670);
  c.save(); c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
  c.font = '230px Anton'; c.lineWidth = 26; c.strokeStyle = '#000'; c.strokeText(`TEIL ${PART}/10`, cx, 330); c.fillStyle = '#fff'; c.fillText(`TEIL ${PART}/10`, cx, 330);
  c.fillStyle = '#ffb04a'; c.fillRect(cx - 300, 470, 600, 10);
  c.font = '800 36px Montserrat'; c.letterSpacing = '5px'; c.lineWidth = 10; c.strokeText('DER LEUCHTTURM VON NEBELSAND', cx, 535); c.fillStyle = '#e8f2f2'; c.fillText('DER LEUCHTTURM VON NEBELSAND', cx, 535);
  c.letterSpacing = '0px';
  c.font = '900 84px Montserrat'; c.lineWidth = 18; c.strokeText('NASSE SPUREN.', cx, 1430); c.fillStyle = '#ffb04a'; c.fillText('NASSE SPUREN.', cx, 1430);
  c.font = '900 64px Montserrat'; c.lineWidth = 15; c.strokeText('BIS AN MEIN BETT.', cx, 1530); c.fillStyle = '#fff'; c.fillText('BIS AN MEIN BETT.', cx, 1530);
  c.restore();
  return E.out.toDataURL('image/png');
}
