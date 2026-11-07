// TEIL 1/10 – „Die Ankunft“
import * as THREE from 'three';
import { createEngine, loadFonts, buildChunks, drawSubtitles, drawTitle, drawEndCard } from '/assets/engine.js';
import { createWorld, buildBoat, islandHeight, SPOTS } from '/assets/world.js';
import { createJonas, createDrowned } from '/assets/figures.js';
import { createWatchRoom, createHallway } from '/assets/interior.js';
import { placeCamera, v3, lerp, easeInOut, smooth, clamp01, noise2 } from '/assets/lib.js';

export const DURATION = 60;
let E, world, room, hall, jonasExt, jonasIn, boat, drowned = [], chunks, timing;
const KNOCKS = [52.6, 53.3, 54.0];
const STING = 54.9;

export async function init() {
  await loadFonts();
  timing = await (await fetch('/teil_01/timing.json')).json();
  chunks = buildChunks(timing.woerter);
  E = createEngine();
  const ext = new THREE.Scene();
  world = createWorld(ext);
  boat = buildBoat(); ext.add(boat);
  jonasExt = createJonas(); ext.add(jonasExt.root);
  for (let i = 0; i < 4; i++) { const d = createDrowned(i + 3); ext.add(d); drowned.push(d); }
  room = createWatchRoom();
  jonasIn = createJonas(); room.scene.add(jonasIn.root);
  hall = createHallway();
  room.book.right.userData.orig = room.book.right.material.map;
}

const ground = (x, z) => islandHeight(x, z);
function setDrowned(visible, list) {
  drowned.forEach((d, i) => { const p = list && list[i]; d.visible = visible && !!p; if (p) { d.position.set(p[0], p[1], p[2]); d.rotation.y = p[3] || 0; } });
}
function boatAt(x, z, t, ry = Math.PI / 2) {
  boat.visible = true; boat.position.set(x, 0.25 + 0.12 * Math.sin(t * 1.3), z);
  boat.rotation.set(0.03 * Math.sin(t * 1.1), ry, 0.04 * Math.sin(t * 0.9 + 1)); boat.updateMatrixWorld(true);
}
function extDefaults(t) {
  const s = world.state; s.lamp = 1; s.houseLight = 1; s.fogDensity = 0.018; s.swell = 1; s.beamPhase = 0;
  world.hemi.intensity = 1.1; world.moon.intensity = 2.2;
  boat.visible = false; jonasExt.root.visible = false; jonasExt.torchLight.intensity = 0; jonasExt.lens.material.emissiveIntensity = 0;
  setDrowned(false);
  boatAt(-7.6, 34.5, t, Math.PI / 2 + 0.05);
}
// Phase so wählen, dass der Kegel zur Zeit tHit in Richtung Punkt p zeigt
function beamToward(p, tHit) {
  const d = p.clone().sub(world.lampWorld); const a = Math.atan2(-d.z, d.x);
  world.state.beamPhase = a - tHit * world.state.beamSpeed;
}

// ------------------------------------------------------------------ Shots
const shots = [
  // 0 HOOK: Turm von unten, Kegel streicht direkt über die Kamera; Silhouette im Wasser
  { a: 0.0, b: 2.3, scene: 'ext', run(t, l) {
      extDefaults(t);
      const cam = v3(lerp(-13, -11.5, l / 2.3), 1.3, lerp(31, 28, l / 2.3));
      beamToward(cam, 1.05);
      setDrowned(true, [[-9.5, -0.55, 25.5, 0.6]]);
      placeCamera(E.camera, cam, v3(-2.5, 17, -3), 42, t, 1.1);
      return { exposure: 1.1 };
    } },
  // 1 HOOK: Haustür von innen – es klopft
  { a: 2.3, b: 4.7, scene: 'hall', run(t, l) {
      hall.update(l, { light: 0.9, figure: 0.35, feet: 0.8, knocks: [0.06], warmLevel: 0.6 });
      placeCamera(E.camera, v3(0.55, 1.65, lerp(0.6, -0.2, easeInOut(l / 2.4))), v3(0, 1.25, -3.97), 44, t, 0.8);
      return { exposure: 1.15, flash: Math.max(0, 0.18 - l * 1.2) };
    } },
  // 2 Insel von oben – der einzige Mensch
  { a: 4.7, b: 7.3, scene: 'ext', run(t, l) {
      extDefaults(t); world.state.fogDensity = 0.011;
      const a = 0.9 + l * 0.05; const cam = v3(Math.cos(a) * 62, 38 - l * 1.2, Math.sin(a) * 62);
      jonasExt.root.visible = true; jonasExt.idle(t); jonasExt.root.position.set(4, ground(4, 9), 9); jonasExt.root.rotation.y = 2.6;
      placeCamera(E.camera, cam, v3(0, 2, 2), 52, t, 0.5);
      return { exposure: 1.2 };
    } },
  // 3 Postboot kommt an (seitlich)
  { a: 7.3, b: 9.5, scene: 'ext', run(t, l) {
      extDefaults(t); world.state.fogDensity = 0.016; world.hemi.intensity = 1.4;
      const z = lerp(62, 56, l / 2.2); boatAt(-7.6, z, t);
      jonasExt.root.visible = true; jonasExt.idle(t);
      jonasExt.root.position.copy(boat.localToWorld(v3(1.4, 0.55, 0))); jonasExt.root.rotation.y = Math.PI;
      placeCamera(E.camera, v3(7, 2.4, z + 9), v3(-7.6, 2.4, z - 2), 46, t, 1);
      return { exposure: 1.2 };
    } },
  // 4 Über die Schulter: Jonas sieht die Insel
  { a: 9.5, b: 11.7, scene: 'ext', run(t, l) {
      extDefaults(t); world.state.fogDensity = 0.02;
      const z = lerp(50, 46, l / 2.2); boatAt(-7.6, z, t);
      jonasExt.root.visible = true; jonasExt.idle(t); jonasExt.lookUp(0.6);
      const jp = boat.localToWorld(v3(1.4, 0.55, 0)); jonasExt.root.position.copy(jp); jonasExt.root.rotation.y = Math.PI;
      beamToward(v3(-7.6, 2, z), 1.4);
      placeCamera(E.camera, jp.clone().add(v3(1.3, 1.55, 2.0)), v3(-3, 6, -3), 48, t, 1);
      return { exposure: 1.15 };
    } },
  // 5 „Ein Leuchtturm.“ – Untersicht
  { a: 11.7, b: 12.4, scene: 'ext', run(t, l) {
      extDefaults(t); beamToward(v3(10, 20, 10), 12.0);
      placeCamera(E.camera, v3(1.0, 3.4, 1.8 + l), v3(-2, 23, -3), 62, t, 0.8);
      return {};
    } },
  // 6 „Ein Haus.“
  { a: 12.4, b: 13.25, scene: 'ext', run(t, l) {
      extDefaults(t);
      placeCamera(E.camera, v3(-0.5 - l * 0.6, 4.4, 19), v3(6.4, 4.4, 5.5), 42, t, 0.8);
      return {};
    } },
  // 7 „Ein Steg.“ – Jonas kommt den Steg entlang
  { a: 13.25, b: 14.15, scene: 'ext', run(t, l) {
      extDefaults(t);
      jonasExt.root.visible = true; jonasExt.walk(t, 0.9); jonasExt.root.position.set(-5, 1.55, 26 - l * 1.2); jonasExt.root.rotation.y = Math.PI;
      placeCamera(E.camera, v3(-4.4, 1.9, 17.5), v3(-5, 2.1, 27), 36, t, 0.9);
      return {};
    } },
  // 8 „Und Nebel, der nie verschwindet.“ – Kran über dem Meer
  { a: 14.15, b: 17.25, scene: 'ext', run(t, l) {
      extDefaults(t); world.state.fogDensity = 0.026;
      const k = easeInOut(l / 3.1);
      placeCamera(E.camera, v3(-34 + k * 4, 4 + k * 9, 42 - k * 4), v3(-2, 12, -3), 38, t, 0.6);
      return { exposure: 1.2 };
    } },
  // 9 Jonas geht mit Taschenlampe zum Turm (von hinten)
  { a: 17.25, b: 20.35, scene: 'ext', run(t, l) {
      extDefaults(t); world.state.fogDensity = 0.022;
      const k = l / 3.1; const x = lerp(3.2, -0.2, k), z = lerp(8.5, 2.2, k);
      jonasExt.root.visible = true; jonasExt.walk(t, 0.75); jonasExt.holdTorch(1);
      jonasExt.root.position.set(x, ground(x, z), z); jonasExt.root.rotation.y = Math.atan2(-2 - x, -0.3 - z);
      placeCamera(E.camera, v3(x + 2.0, ground(x, z) + 2.3, z + 4.6), v3(-2, ground(-2, 0) + 3.2, -0.3), 48, t, 1.1);
      return { exposure: 1.1 };
    } },
  // 10 Wachraum: Dolly auf das Logbuch
  { a: 20.35, b: 23.0, scene: 'room', run(t, l) {
      room.update(t, {}); jonasIn.root.visible = false; room.book.right.material.map = room.book.right.userData.orig; room.book.flip(0);
      const k = easeInOut(l / 2.65);
      placeCamera(E.camera, v3(lerp(1.5, 0.55, k), lerp(1.75, 1.32, k), lerp(1.2, -0.45, k)), v3(-0.05, 0.82, -1.12), 46, t, 0.8);
      return {};
    } },
  // 11 Seiten: Wind, Schiffe, Uhrzeiten – Blättern
  { a: 23.0, b: 25.85, scene: 'room', run(t, l) {
      room.update(t, {}); jonasIn.root.visible = false; room.book.right.material.map = room.book.right.userData.orig;
      room.book.flip(smooth(1.2, 2.2, l));
      placeCamera(E.camera, v3(0.05 + l * 0.03, 1.32 - l * 0.03, -0.78), v3(-0.03, 0.82, -1.12), 40, t, 0.6);
      return {};
    } },
  // 12 Über die Schulter: die letzte Seite
  { a: 25.85, b: 29.9, scene: 'room', run(t, l) {
      room.update(t, {}); room.book.right.material.map = room.book.lastTex; room.book.flip(smooth(0.1, 0.9, l));
      jonasIn.root.visible = true; jonasIn.idle(t); jonasIn.root.position.set(-0.15, 0, -0.42); jonasIn.root.rotation.y = Math.PI;
      jonasIn.torso.rotation.x = 0.25; jonasIn.neck.rotation.x = 0.35; jonasIn.armR.sh.rotation.x = -0.6;
      const k = easeInOut(l / 4.05);
      placeCamera(E.camera, v3(lerp(0.75, 0.45, k), lerp(1.95, 1.6, k), lerp(0.25, -0.35, k)), v3(0.0, 0.85, -1.12), 44, t, 0.9);
      return {};
    } },
  // 13 „Mach das Licht nicht aus.“ – extreme Nahaufnahme
  { a: 29.9, b: 32.9, scene: 'room', run(t, l) {
      room.update(t, { lampLevel: 0.75 + 0.25 * Math.abs(noise2(t * 4, 9)) }); room.book.right.material.map = room.book.lastTex; room.book.flip(1); jonasIn.root.visible = false;
      const k = l / 3.0;
      placeCamera(E.camera, v3(0.08, 1.12 - k * 0.07, -0.98), v3(0.075, 0.82, -1.115), 34, t, 0.5);
      E.camera.rotateZ(-0.08 + k * 0.05);
      return { vignette: 1.3 };
    } },
  // 14 Draußen: Leuchtfeuer in der Nacht – im Kegel: Gestalten im Wasser
  { a: 32.9, b: 36.9, scene: 'ext', run(t, l) {
      extDefaults(t); world.state.fogDensity = 0.024;
      setDrowned(true, [[-20, -0.55, 13.5, 0.9], [-23, -0.75, 9.5, 1.0], [-18.5, -0.9, 18.5, 1.3], [-26, -1.0, 5, 0.8]]);
      beamToward(v3(-24, 0, 7), 2.4 + 32.9);
      const k = easeInOut(l / 4);
      placeCamera(E.camera, v3(-15 - k * 0.8, 1.3, 24 - k * 1.2), v3(-21, 2.0, 11), 42, t, 0.8);
      return { exposure: 1.15 };
    } },
  // 15 Jonas schläft am Tisch
  { a: 36.9, b: 40.65, scene: 'room', run(t, l) {
      room.update(t, { lampLevel: 0.55 }); room.book.flip(1);
      jonasIn.root.visible = true; jonasIn.idle(t); jonasIn.root.position.set(0, 0, -0.42); jonasIn.root.rotation.y = Math.PI; jonasIn.sleepAtTable(t);
      if (l > 2.6) { jonasIn.head.rotation.y = 0.6 - smooth(2.6, 3.4, l) * 0.4; jonasIn.neck.rotation.x = 0.25 - smooth(2.6, 3.4, l) * 0.3; }
      const k = easeInOut(l / 3.75);
      placeCamera(E.camera, v3(lerp(2.1, 1.6, k), lerp(1.95, 1.65, k), lerp(0.55, 0.15, k)), v3(0, 0.95, -1.0), 46, t, 0.7);
      return { exposure: 0.95 };
    } },
  // 16 Funkgerät: nur Rauschen
  { a: 40.65, b: 42.35, scene: 'room', run(t, l) {
      room.update(t, { lampLevel: 0.55 }); jonasIn.root.visible = false;
      room.scene.updateMatrixWorld(true);
      const R = room.radio.grp;
      placeCamera(E.camera, R.localToWorld(v3(0.15, 0.32, 0.85 - l * 0.12)), R.localToWorld(v3(0.05, 0.1, 0)), 40, t, 1.8);
      return { exposure: 1.0, chroma: 2 };
    } },
  // 17 Die Uhr: 3:32
  { a: 42.35, b: 46.25, scene: 'room', run(t, l) {
      room.update(t, { lampLevel: 0.55 }); jonasIn.root.visible = false; room.radio.clockTex.userData.draw('3:32');
      room.scene.updateMatrixWorld(true); const fp = room.radio.face.getWorldPosition(v3(0, 0, 0)); const n = v3(0, 0, 1).applyQuaternion(room.radio.face.getWorldQuaternion(new THREE.Quaternion()));
      placeCamera(E.camera, fp.clone().addScaledVector(n, 0.55 - l * 0.06).add(v3(0, 0.06, 0)), fp, 32, t, 0.6);
      return { exposure: 1.0 };
    } },
  // 18 Jonas' Gesicht – „Dann …“
  { a: 46.25, b: 47.05, scene: 'room', run(t, l) {
      room.update(t, { lampLevel: 0.6 }); jonasIn.root.visible = true; jonasIn.idle(t); jonasIn.sit();
      jonasIn.root.position.set(0, 0, -0.42); jonasIn.root.rotation.y = Math.PI; jonasIn.torso.rotation.x = 0.15; jonasIn.head.rotation.y = 0.45; jonasIn.neck.rotation.x = 0.15;
      room.radio.clockTex.userData.draw('3:32'); room.scene.updateMatrixWorld(true);
      placeCamera(E.camera, v3(1.55 - l * 0.15, 1.75, 0.05), v3(0.1, 1.15, -0.9), 40, t, 0.5);
      return { exposure: 1.1 };
    } },
  // 19 3:33 – harter Schnitt, Ziffern springen
  { a: 47.05, b: 49.9, scene: 'room', run(t, l) {
      room.update(t, { lampLevel: 0.6 }); jonasIn.root.visible = false;
      const g = l < 0.18 ? 1 : 0; room.radio.clockTex.userData.draw('3:33', g);
      room.scene.updateMatrixWorld(true); const fp = room.radio.face.getWorldPosition(v3(0, 0, 0)); const n = v3(0, 0, 1).applyQuaternion(room.radio.face.getWorldQuaternion(new THREE.Quaternion()));
      const z = 0.3 - Math.min(1, l / 0.15) * 0.08 - l * 0.02;
      placeCamera(E.camera, fp.clone().addScaledVector(n, z), fp, 30, t, 0.4);
      return { exposure: 1.05, flash: Math.max(0, 0.25 - l * 2) };
    } },
  // 20 Draußen: das Licht geht aus
  { a: 49.9, b: 51.6, scene: 'ext', run(t, l) {
      extDefaults(t); world.state.fogDensity = 0.022; beamToward(v3(-13, 5, 19), 50.55);
      const off = t < 50.3 ? 1 : t < 50.95 ? (Math.sin(t * 60) > 0.2 ? 0.8 : 0.05) * (1 - (t - 50.3) / 0.65) : 0;
      world.state.lamp = off; world.state.houseLight = t < 50.95 ? 1 : 0.0; world.hemi.intensity = 1.1 * (0.55 + 0.45 * off); world.moon.intensity = 2.2 * (0.6 + 0.4 * off);
      placeCamera(E.camera, v3(-13, 5, 19), v3(-2, 19, -3), 50, t, 0.7);
      return { exposure: 1.1 };
    } },
  // 21 Dunkelheit. Dreimal Klopfen. Etwas steht hinter der Tür.
  { a: 51.6, b: 56.8, scene: 'hall', run(t, l) {
      const fig = t >= STING ? 0.95 : smooth(53.6, 54.6, t) * 0.25;
      hall.update(l, { light: 0.55, feet: smooth(52.0, 52.5, t), water: smooth(53.3, 56.5, t), figure: fig, knocks: KNOCKS.map((k) => k - 51.6), warmLevel: 0 });
      const k = easeInOut(l / 5.2); let zc = lerp(0.9, -0.6, k);
      if (t >= STING) zc -= Math.min(1, (t - STING) / 0.12) * 0.9;
      placeCamera(E.camera, v3(0.25, 1.55, zc), v3(0, 1.2, -3.97), 44, t, t >= STING ? 1.6 : 0.6);
      const fade = t > 56.2 ? Math.max(0, 1 - (t - 56.2) / 0.5) : 1;
      return { exposure: 1.1, fade, flash: t >= STING ? Math.max(0, 0.35 - (t - STING) * 2) : 0 };
    } },
];

export function renderFrame(t, type = 'image/jpeg') {
  if (t >= 56.8) {
    drawEndCard(E.ctx, t, { start: 56.8, next: 2, question: 'Was ist hinter der Tür?' });
  } else {
    const shot = shots.find((s) => t >= s.a && t < s.b) || shots[shots.length - 1];
    const l = t - shot.a;
    let scene;
    const post = shot.run(t, l) || {};
    if (shot.scene === 'ext') { world.update(t, E.camera); jonasExt.updateDrips(t); scene = world.scene; }
    else if (shot.scene === 'room') scene = room.scene;
    else scene = hall.scene;
    E.render(scene, t, post);
    drawTitle(E.ctx, t, { part: 1, show: [0, 3.0] });
    drawSubtitles(E.ctx, chunks, t);
  }
  return E.out.toDataURL(type, 0.95);
}

// Thumbnail / Cover (1080×1920): Tür mit Silhouette + Titel
export function renderCover() {
  const shot = shots[shots.length - 1];
  const post = shot.run(55.7, 55.7 - shot.a); post.flash = 0; post.fade = 1; post.exposure = 1.45;
  placeCamera(E.camera, v3(0.25, 1.5, -0.2), v3(0, 1.3, -3.97), 46, 0, 0);
  E.render(hall.scene, 55.7, post);
  const c = E.ctx; const cx = 495;
  const g = c.createLinearGradient(0, 0, 0, 700); g.addColorStop(0, 'rgba(0,0,0,0.75)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, 1080, 700);
  const g2 = c.createLinearGradient(0, 1250, 0, 1920); g2.addColorStop(0, 'rgba(0,0,0,0)'); g2.addColorStop(1, 'rgba(0,0,0,0.85)'); c.fillStyle = g2; c.fillRect(0, 1250, 1080, 670);
  c.save(); c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
  c.font = '230px Anton'; c.lineWidth = 26; c.strokeStyle = '#000'; c.strokeText('TEIL 1/10', cx, 330); c.fillStyle = '#fff'; c.fillText('TEIL 1/10', cx, 330);
  c.fillStyle = '#ffb04a'; c.fillRect(cx - 300, 470, 600, 10);
  c.font = '800 36px Montserrat'; c.letterSpacing = '5px'; c.lineWidth = 10; c.strokeText('DER LEUCHTTURM VON NEBELSAND', cx, 535); c.fillStyle = '#e8f2f2'; c.fillText('DER LEUCHTTURM VON NEBELSAND', cx, 535);
  c.letterSpacing = '0px';
  c.font = '900 92px Montserrat'; c.lineWidth = 18; c.strokeText('3:33 UHR.', cx, 1430); c.fillStyle = '#ffb04a'; c.fillText('3:33 UHR.', cx, 1430);
  c.font = '900 70px Montserrat'; c.lineWidth = 15; c.strokeText('ES KLOPFT DREIMAL.', cx, 1530); c.fillStyle = '#fff'; c.fillText('ES KLOPFT DREIMAL.', cx, 1530);
  c.restore();
  return E.out.toDataURL('image/png');
}
