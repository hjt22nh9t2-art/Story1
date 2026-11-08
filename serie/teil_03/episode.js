// TEIL 3/10 – „Das Funkgerät“
import * as THREE from 'three';
import { createEngine, loadFonts, buildChunks, drawSubtitles, drawTitle, drawEndCard, W, SAFE, COLORS } from '/assets/engine.js';
import { createWorld, islandHeight } from '/assets/world.js';
import { createJonas, createGhostBoat } from '/assets/figures.js';
import { createWatchRoom, createHallway, createBedroom } from '/assets/interior.js';
import { createFootprints, createStairPrints, createPuddle } from '/assets/props.js';
import { placeCamera, v3, lerp, easeInOut, smooth, noise2 } from '/assets/lib.js';

export const DURATION = 60;
const PART = 3;
let E, world, room, hall, bedroom, jIn, ghostBoat, chunks, bedTorch, hallTorch;
const STING = 54.9;
const RECAP = [3.0, 9.8];

function torchSpot(scene) { const s = new THREE.SpotLight(0xffd7a8, 0, 22, 0.36, 0.55, 1.4); scene.add(s, s.target); return s; }
function aim(spot, from, to, i) { spot.position.copy(from); spot.target.position.copy(to); spot.intensity = i; }

export async function init() {
  await loadFonts();
  const timing = await (await fetch('/teil_03/timing.json')).json();
  chunks = buildChunks(timing.woerter);
  E = createEngine();
  const ext = new THREE.Scene(); world = createWorld(ext);
  ghostBoat = createGhostBoat(); ext.add(ghostBoat);
  room = createWatchRoom(); jIn = createJonas(); room.scene.add(jIn.root);
  room.book.right.userData.orig = room.book.right.material.map;
  // Rückblick-Sets aus Teil 2
  hall = createHallway(); hallTorch = torchSpot(hall.scene);
  hall.scene.add(createFootprints([v3(0.15, 0, -4.6), v3(0.1, 0, -3.6), v3(-0.05, 0, -2.0), v3(-0.6, 0, -0.6), v3(-0.95, 0, 0.25)], { stride: 0.62, pairAtEnd: false, seed: 6 }));
  hall.scene.add(createStairPrints(hall.stepTops, { dirZ: 1 }));
  bedroom = createBedroom(); bedTorch = torchSpot(bedroom.scene);
  bedroom.scene.add(createFootprints([v3(0.05, 0, 4.3), v3(0.05, 0, 2.0), v3(0.0, 0, 0.45), v3(-0.25, 0, -0.65), v3(-0.56, 0, -0.95)], { stride: 0.6, pairAtEnd: true, seed: 7 }));
  const pud = createPuddle(0.32, 0.8); pud.position.set(-0.6, 0.006, -0.97); bedroom.scene.add(pud);
}

function extNight(t) {
  const s = world.state; s.lamp = 0; s.houseLight = 0; s.fogDensity = 0.026; s.swell = 1.2; s.beamPhase = 0;
  world.hemi.intensity = 0.9; world.moon.intensity = 1.9; ghostBoat.visible = false;
}
function seatJonas(t) { jIn.root.visible = true; jIn.idle(t); jIn.sit(); jIn.root.position.set(0, 0, -0.42); jIn.root.rotation.y = Math.PI; }
function roomBase(t, o = {}) { room.update(t, { beam: 0, lampLevel: 0.75, ...o }); room.book.right.material.map = room.book.right.userData.orig; room.book.flip(0); jIn.root.visible = false; }
const flashback = { exposure: 0.9, chroma: 2.2, flicker: 0.12, vignette: 1.4, bloom: 0.7 };
const faceOf = (obj) => { room.scene.updateMatrixWorld(true); return { p: obj.getWorldPosition(v3(0, 0, 0)), n: v3(0, 0, 1).applyQuaternion(obj.getWorldQuaternion(new THREE.Quaternion())) }; };

const shots = [
  // ---- HOOK: Funkgerät, panischer Ruf
  { a: 0, b: 3.0, scene: 'room', run(t, l) {
      roomBase(t, { tune: 1, lampLevel: 0.5 });
      const R = room.radio.grp; room.scene.updateMatrixWorld(true);
      placeCamera(E.camera, R.localToWorld(v3(0.12 - l * 0.02, 0.3, 0.85 - l * 0.12)), R.localToWorld(v3(0.04, 0.12, 0)), 36, t, 2.2);
      return { exposure: 1.1, chroma: 1.8, flash: Math.max(0, 0.2 - l * 1.5) };
    } },
  // ---- WAS BISHER GESCHAH
  { a: 3.0, b: 5.6, scene: 'bed', recap: true, run(t, l) {
      bedroom.update(t, { doorOpen: 0.95 }); aim(bedTorch, v3(0.5, 1.7, 0.4), v3(-0.7, 0.2, -1.0), 32);
      placeCamera(E.camera, v3(0.2 - l * 0.03, 2.4, 0.0), v3(-0.6, 0.0, -0.95), 58, t, 0.5);
      return flashback;
    } },
  { a: 5.6, b: 7.4, scene: 'hall', recap: true, run(t, l) {
      hall.update(l, { light: 0.8, doorOpen: 1, warmLevel: 0 }); aim(hallTorch, v3(0.3, 1.0, -1.2), v3(-0.95, 1.6, 2.4), 10);
      placeCamera(E.camera, v3(-0.1, 0.4, -0.9 + l * 0.1), v3(-0.95, 2.2, 3.2), 54, t, 0.8);
      return flashback;
    } },
  { a: 7.4, b: 9.8, scene: 'bed', recap: true, run(t, l) {
      bedroom.update(t, { doorOpen: 0.95, dent: 1, stain: 1 }); aim(bedTorch, v3(0.4, 1.6, -0.2), v3(-0.88, 0.55, -0.95), 10);
      placeCamera(E.camera, v3(0.0 - l * 0.05, 1.3, -0.45), v3(-0.88, 0.55, -0.95), 46, t, 0.8);
      return flashback;
    } },
  // ---- Ich habe die ganze Nacht kein Auge zugemacht.
  { a: 9.8, b: 12.4, scene: 'room', run(t, l) {
      roomBase(t, { lampLevel: 0.6, radio: 0.3 }); seatJonas(t); jIn.torso.rotation.x = 0.1; jIn.neck.rotation.x = 0.25; jIn.head.rotation.y = 0.3;
      placeCamera(E.camera, v3(2.0 - l * 0.12, 1.8, 0.45), v3(0.05, 1.05, -0.9), 42, t, 0.6);
      return { exposure: 1.05 };
    } },
  // ---- Dann, um 3:33 Uhr …
  { a: 12.4, b: 14.6, scene: 'room', run(t, l) {
      roomBase(t, { radio: 0.3 }); room.radio.clockTex.userData.draw('3:33', l < 0.12 ? 1 : 0);
      const { p, n } = faceOf(room.radio.face);
      placeCamera(E.camera, p.clone().addScaledVector(n, 0.36 - l * 0.03).add(v3(0, 0.02, 0)), p, 30, t, 0.4);
      return { exposure: 1.05 };
    } },
  // ---- … wieder das Funkgerät
  { a: 14.6, b: 17.0, scene: 'room', run(t, l) {
      const on = smooth(0.0, 0.25, l) * (0.6 + 0.4 * Math.abs(Math.sin(t * 13)));
      roomBase(t, { radio: 0.3 + 1.2 * on, tune: on });
      const R = room.radio.grp; room.scene.updateMatrixWorld(true);
      placeCamera(E.camera, R.localToWorld(v3(0.2, 0.3, 0.8 - l * 0.15)), R.localToWorld(v3(0.05, 0.12, 0)), 38, t, 1.4);
      return { exposure: 1.05 };
    } },
  // ---- FISCHER: „Hier ist die Margarete! Wir sehen die Felsen nicht!“
  { a: 17.0, b: 20.5, scene: 'ext', run(t, l) {
      extNight(t); ghostBoat.visible = true;
      const k = l / 3.5; ghostBoat.position.set(lerp(-31, -29, k), 0.2 + 0.18 * Math.sin(t * 1.6), lerp(23.5, 21.5, k));
      ghostBoat.rotation.set(0.06 * Math.sin(t * 1.3), 0.6, 0.09 * Math.sin(t * 1.1)); ghostBoat.userData.update(t);
      placeCamera(E.camera, v3(-37.5, 1.1 + 0.25 * Math.sin(t * 1.2), 31), v3(-27, 2.0, 19), 44, t, 2.0);
      return { exposure: 1.2, chroma: 1.6 };
    } },
  // ---- Ich griff zum Mikrofon.
  { a: 20.5, b: 23.2, scene: 'room', run(t, l) {
      roomBase(t, { radio: 1.2, tune: 0.6 }); seatJonas(t);
      const k = easeInOut(smooth(0.1, 1.0, l)); jIn.torso.rotation.x = 0.2 * k; jIn.armR.sh.rotation.set(-1.25 * k, 0, 0.25 * k); jIn.armR.el.rotation.x = -1.3 * k; jIn.head.rotation.y = -0.25 * k;
      placeCamera(E.camera, v3(1.4, 1.55, -0.05 - l * 0.08), v3(0.15, 1.15, -1.0), 42, t, 0.9);
      return { exposure: 1.1 };
    } },
  // ---- „Das Leuchtfeuer ist kaputt … Wo sind Sie?“ – der dunkle Turm vom Meer aus
  { a: 23.2, b: 26.0, scene: 'ext', run(t, l) {
      extNight(t); world.state.fogDensity = 0.022;
      placeCamera(E.camera, v3(-15 + l * 0.4, 2.2, 25), v3(-2, 16, -3), 46, t, 0.8);
      return { exposure: 1.2 };
    } },
  // ---- FISCHER: „Nördlich vom Wrack … das Wasser ist so kalt …“
  { a: 26.0, b: 29.3, scene: 'ext', run(t, l) {
      extNight(t); world.state.fogDensity = 0.016; world.state.swell = 0.6; ghostBoat.visible = true; world.moon.intensity = 2.6;
      ghostBoat.position.set(41, -0.2 - l * 0.12, -45); ghostBoat.rotation.set(0.25, 1.2, 0.18); ghostBoat.userData.update(t, 1 - smooth(1.5, 3.2, l));
      const k = easeInOut(l / 3.3);
      placeCamera(E.camera, v3(lerp(27, 29, k), 0.9, lerp(-21, -23, k)), v3(39, 0.8, -37), 42, t, 0.7);
      return { exposure: 1.25 };
    } },
  // ---- Draußen war es ganz still. Jonas am Fenster.
  { a: 29.3, b: 34.5, scene: 'room', run(t, l) {
      roomBase(t, { radio: 0.6 }); jIn.root.visible = true; jIn.idle(t); jIn.root.position.set(0.12, 0, -2.45); jIn.root.rotation.y = Math.PI;
      const k = easeInOut(l / 5.2);
      placeCamera(E.camera, v3(lerp(0.75, 0.55, k), 1.75, lerp(-0.9, -1.35, k)), v3(0.0, 1.6, -3.12), 44, t, 0.6);
      return { exposure: 1.1 };
    } },
  // ---- Ich suchte im Logbuch … (Seiten fliegen)
  { a: 34.5, b: 38.0, scene: 'room', run(t, l) {
      roomBase(t); const cyc = (l * 1.7) % 1; room.book.flip(easeInOut(cyc));
      placeCamera(E.camera, v3(0.05, 1.3, -0.82), v3(-0.03, 0.82, -1.12), 40, t, 0.9);
      return { exposure: 1.05 };
    } },
  // ---- Ich fand ihn. Ganz hinten. In roter Tinte.
  { a: 38.0, b: 41.1, scene: 'room', run(t, l) {
      roomBase(t); room.book.right.material.map = room.book.redTex; room.book.flip(easeInOut(smooth(0.15, 0.85, l)));
      const k = easeInOut(l / 3.1);
      placeCamera(E.camera, v3(lerp(0.4, 0.15, k), lerp(1.55, 1.2, k), lerp(-0.45, -0.85, k)), v3(0.05, 0.83, -1.13), 42, t, 0.7);
      return { exposure: 1.1 };
    } },
  // ---- „Fischkutter Margarete. Gesunken … Keine Überlebenden.“ – rote Schrift, extreme Nahaufnahme
  { a: 41.1, b: 44.6, scene: 'room', run(t, l) {
      roomBase(t, { lampLevel: 0.8 + 0.2 * Math.abs(noise2(t * 3, 5)) }); room.book.right.material.map = room.book.redTex; room.book.flip(1);
      const k = l / 3.5;
      placeCamera(E.camera, v3(lerp(0.0, 0.1, k), 1.03, lerp(-1.1, -1.08, k)), v3(lerp(0.03, 0.1, k), 0.837, lerp(-1.16, -1.12, k)), 36, t, 0.4);
      E.camera.rotateZ(-0.05);
      return { exposure: 1.1, vignette: 1.3 };
    } },
  // ---- „Keine Überlebenden.“ – der Kutter sinkt, die Laterne erlischt unter Wasser
  { a: 44.6, b: 47.9, scene: 'ext', run(t, l) {
      extNight(t); world.state.fogDensity = 0.02; world.state.swell = 0.8; ghostBoat.visible = true;
      const k = smooth(0.0, 3.0, l);
      ghostBoat.position.set(-29, 0.2 - 3.2 * k * k, 21.5); ghostBoat.rotation.set(0.1 + 0.5 * k, 0.6, 0.2 + 0.35 * k);
      ghostBoat.userData.update(t, 1 - smooth(1.6, 3.0, l));
      placeCamera(E.camera, v3(-36.5, 1.0 + 0.2 * Math.sin(t * 1.2), 29.5), v3(-29, 0.6 - k * 0.8, 21.5), 40, t, 0.8);
      return { exposure: 1.2 };
    } },
  // ---- Das Rauschen wurde leiser. Dann war es ganz still.
  { a: 47.9, b: 51.6, scene: 'room', run(t, l) {
      const fade = 1 - smooth(48.3, 50.6, t);
      roomBase(t, { radio: 0.2 + 1.0 * fade, tune: 0.4 * fade, lampLevel: 0.6 });
      const R = room.radio.grp; room.scene.updateMatrixWorld(true);
      placeCamera(E.camera, R.localToWorld(v3(0.15, 0.3, 0.85 - l * 0.08)), R.localToWorld(v3(0.04, 0.12, 0)), 38, t, 0.5);
      return { exposure: 1.0 };
    } },
  // ---- CLIFFHANGER: „Jonas … warum hast du es ausgemacht?“ – hinter Jonas, im Fenster erscheint eine Gestalt
  { a: 51.6, b: STING, scene: 'room', run(t, l) {
      const whisper = smooth(52.1, 52.4, t) * (1 - smooth(54.7, 54.9, t));
      roomBase(t, { radio: 0.2 + 1.4 * whisper * (0.6 + 0.4 * Math.abs(Math.sin(t * 9))), tune: whisper, lampLevel: 0.55, ghost: smooth(52.3, 54.2, t) * 0.75 });
      seatJonas(t); jIn.neck.rotation.x = 0.1; jIn.head.rotation.y = -0.15;
      const k = easeInOut(l / 3.3);
      placeCamera(E.camera, v3(0.28, lerp(1.6, 1.62, k), lerp(0.45, 0.15, k)), v3(0.02, 1.55, -3.12), 40, t, 0.4);
      return { exposure: 1.1 };
    } },
  // ---- SCHRECK: Handabdruck an der Scheibe
  { a: STING, b: 56.8, scene: 'room', run(t, l) {
      roomBase(t, { radio: 1.2, lampLevel: l < 0.5 ? (Math.sin(t * 70) > 0 ? 0.2 : 0.7) : 0.5, ghost: 0.95, hand: smooth(STING, STING + 0.06, t) });
      const push = Math.min(1, l / 0.15) * 0.35 + l * 0.05;
      placeCamera(E.camera, v3(0.06, 1.68, -1.75 - push), v3(0.04, 1.72, -3.12), 40, t, l < 1.0 ? 2.0 : 0.6);
      const fade = t > 56.2 ? Math.max(0, 1 - (t - 56.2) / 0.5) : 1;
      return { exposure: 1.15, fade, flash: Math.max(0, 0.35 - l * 1.8) };
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
    drawEndCard(E.ctx, t, { start: 56.8, next: PART + 1, question: 'Woher kennt er seinen Namen?' });
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
  const post = shot.run(54.6, 54.6 - shot.a); post.exposure = 1.35;
  E.render(room.scene, 54.6, post);
  const c = E.ctx; const cx = 495;
  const g = c.createLinearGradient(0, 0, 0, 700); g.addColorStop(0, 'rgba(0,0,0,0.75)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, 1080, 700);
  const g2 = c.createLinearGradient(0, 1250, 0, 1920); g2.addColorStop(0, 'rgba(0,0,0,0)'); g2.addColorStop(1, 'rgba(0,0,0,0.85)'); c.fillStyle = g2; c.fillRect(0, 1250, 1080, 670);
  c.save(); c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
  c.font = '230px Anton'; c.lineWidth = 26; c.strokeStyle = '#000'; c.strokeText(`TEIL ${PART}/10`, cx, 330); c.fillStyle = '#fff'; c.fillText(`TEIL ${PART}/10`, cx, 330);
  c.fillStyle = '#ffb04a'; c.fillRect(cx - 300, 470, 600, 10);
  c.font = '800 36px Montserrat'; c.letterSpacing = '5px'; c.lineWidth = 10; c.strokeText('DER LEUCHTTURM VON NEBELSAND', cx, 535); c.fillStyle = '#e8f2f2'; c.fillText('DER LEUCHTTURM VON NEBELSAND', cx, 535);
  c.letterSpacing = '0px';
  c.font = '900 80px Montserrat'; c.lineWidth = 18; c.strokeText('FUNKSPRUCH', cx, 1430); c.fillStyle = COLORS.radioHi; c.fillText('FUNKSPRUCH', cx, 1430);
  c.font = '900 64px Montserrat'; c.lineWidth = 15; c.strokeText('VON EINEM TOTEN.', cx, 1530); c.fillStyle = '#fff'; c.fillText('VON EINEM TOTEN.', cx, 1530);
  c.restore();
  return E.out.toDataURL('image/png');
}
