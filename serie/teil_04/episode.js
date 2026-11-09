// TEIL 4/10 – „Das Foto“
import * as THREE from 'three';
import { createEngine, loadFonts, buildChunks, drawSubtitles, drawTitle, drawEndCard, W, SAFE, COLORS } from '/assets/engine.js';
import { createWorld, islandHeight, SPOTS } from '/assets/world.js';
import { createJonas, createDrowned, createGhostBoat } from '/assets/figures.js';
import { createWatchRoom } from '/assets/interior.js';
import { createCellar } from '/assets/cellar.js';
import { makeOldPhoto } from '/assets/photo.js';
import { placeCamera, v3, lerp, easeInOut, smooth, noise2 } from '/assets/lib.js';

export const DURATION = 60;
const PART = 4;
let E, world, room, cellar, jC, ghostBoat, chunks, figC, photoTex, cTorch;
const STING = 51.2;
const RECAP = [5.0, 13.4];

export async function init() {
  await loadFonts();
  const timing = await (await fetch('/teil_04/timing.json')).json();
  chunks = buildChunks(timing.woerter);
  E = createEngine();
  // ---- Außenwelt (für das Foto + Rückblick)
  const ext = new THREE.Scene(); world = createWorld(ext);
  ghostBoat = createGhostBoat(); ext.add(ghostBoat); ghostBoat.visible = false;
  // ---- Das Foto von 1953: der Wärter (sieht aus wie Jonas) vor dem Turm, hinter ihm eine Gestalt
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
  // ---- Wachraum (Rückblick)
  room = createWatchRoom();
  // ---- Keller
  cellar = createCellar({ photoTex });
  jC = createJonas(); cellar.scene.add(jC.root);
  figC = createDrowned(4); figC.traverse((o) => o.layers.set(1)); cellar.scene.add(figC); figC.visible = false;
  cTorch = new THREE.SpotLight(0xffd7a8, 0, 12, 0.4, 0.55, 1.4); cellar.scene.add(cTorch, cTorch.target);
}

function extNight() {
  const s = world.state; s.lamp = 0; s.houseLight = 0; s.fogDensity = 0.02; s.swell = 0.8; s.beamPhase = 0;
  world.hemi.intensity = 0.9; world.moon.intensity = 1.9; ghostBoat.visible = false;
}
const flashback = { exposure: 0.9, chroma: 2.2, flicker: 0.12, vignette: 1.4, bloom: 0.7 };

// Foto vor der Kamera halten: Fotomitte P, Kamera schaut entlang -z darauf
const PH = v3(0.55, 1.42, -1.05);
function holdPhoto(tilt = 0) { const k = cellar.keyPhoto; k.position.copy(PH); k.rotation.set(-0.12 + tilt, 0.04, 0.02); k.visible = true; }
// Punkt (u,v) auf dem Foto (0..1, Ursprung oben links) in Weltkoordinaten
function photoPt(u, v, dz = 0) { const k = cellar.keyPhoto; k.updateMatrixWorld(true); return k.localToWorld(v3((u - 0.5) * 0.16, (0.5 - v) * 0.1455, dz)); }
const FACE = [0.545, 0.43];   // Gesicht des Wärters (u, v)
const FIG = [0.40, 0.50];    // Gestalt hinter der Schulter
function camOnPhoto(t, uv, dist, fov, shake = 0.5) { E.camera.near = 0.005; const p = photoPt(uv[0], uv[1]); const c = photoPt(uv[0], uv[1], dist * 2.2); placeCamera(E.camera, c, p, fov * 0.5, t, shake); }

function cellarBase(t, o = {}) { E.camera.near = 0.05; cellar.hemi.intensity = 0.6; cellar.doorLight.intensity = 7; cellar.update(t, { bulb: 1, fill: t > 43.4 ? 1 : 0, ...o }); jC.root.visible = false; figC.visible = false; cTorch.intensity = 0; holdPhoto(); }

const shots = [
  // ---- HOOK: das Gesicht auf dem Foto
  { a: 0, b: 3.0, scene: 'cellar', run(t, l) {
      cellarBase(t, { swing: 0.08 });
      camOnPhoto(t, [lerp(0.5, FACE[0], l / 3), lerp(0.4, FACE[1], l / 3)], lerp(0.16, 0.085, easeInOut(l / 3)), 40, 0.4);
      return { exposure: 1.2 };
    } },
  { a: 3.0, b: 5.0, scene: 'cellar', run(t, l) {
      cellarBase(t, { swing: 0.08 });
      camOnPhoto(t, [lerp(0.3, 0.42, l / 2), 0.92], 0.075, 38, 0.4);
      return { exposure: 1.2 };
    } },
  // ---- WAS BISHER GESCHAH
  { a: 5.0, b: 8.5, scene: 'room', recap: true, run(t, l) {
      room.update(t, { beam: 0, lampLevel: 0.6, radio: 1.3, tune: 1 });
      const R = room.radio.grp; room.scene.updateMatrixWorld(true);
      placeCamera(E.camera, R.localToWorld(v3(0.12, 0.3, 0.85 - l * 0.08)), R.localToWorld(v3(0.04, 0.12, 0)), 36, t, 1.5);
      return flashback;
    } },
  { a: 8.5, b: 11.6, scene: 'ext', recap: true, run(t, l) {
      extNight(); ghostBoat.visible = true; const k = smooth(0, 3.0, l);
      ghostBoat.position.set(-29, 0.2 - 3.2 * k * k, 21.5); ghostBoat.rotation.set(0.1 + 0.5 * k, 0.6, 0.2 + 0.35 * k); ghostBoat.userData.update(t, 1 - smooth(1.6, 3.0, l));
      placeCamera(E.camera, v3(-36.5, 1.0, 29.5), v3(-29, 0.6 - k * 0.8, 21.5), 40, t, 0.8);
      return flashback;
    } },
  { a: 11.6, b: 13.4, scene: 'room', recap: true, run(t, l) {
      room.update(t, { beam: 0, lampLevel: 0.5, ghost: 0.95, hand: 1, radio: 1 });
      placeCamera(E.camera, v3(0.06, 1.68, -2.0 - l * 0.08), v3(0.04, 1.72, -3.12), 40, t, 0.8);
      return flashback;
    } },
  // ---- Ich wollte Antworten. Also ging ich in den Keller.
  { a: 13.4, b: 16.7, scene: 'cellar', run(t, l) {
      cellarBase(t, { bulb: 0, swing: 0 }); cellar.keyPhoto.visible = true; cellar.keyPhoto.position.set(0.12, 0.925, -1.98); cellar.keyPhoto.rotation.set(-Math.PI / 2, 0, 0.3);
      const st = cellar.stepTops; const k = Math.min(1, l / 3.2) * (st.length - 1); const i0 = st.length - 1 - Math.floor(k), f = k - Math.floor(k);
      const a = st[Math.max(0, i0)], b = st[Math.max(0, i0 - 1)];
      jC.root.visible = true; jC.walk(t, 0.5, 0.8); jC.holdTorch(1, 1); jC.armR.sh.rotation.x = -0.6;
      jC.root.position.set(-1.55, lerp(a.y, b.y, f) + 0.02, lerp(a.z, b.z, f)); jC.root.rotation.y = Math.PI;
      cTorch.position.set(-1.4, jC.root.position.y + 1.4, jC.root.position.z - 0.2); cTorch.target.position.set(-1.0, 0, -0.8); cTorch.intensity = 14; cellar.hemi.intensity = 1.6; cellar.doorLight.intensity = 16;
      placeCamera(E.camera, v3(0.6, 1.0, -0.6), v3(-1.5, 1.4, 1.5), 50, t, 0.8);
      return { exposure: 1.8 };
    } },
  // ---- „Eine Glühbirne.“
  { a: 16.7, b: 18.4, scene: 'cellar', run(t, l) {
      const on = l < 0.2 ? 0 : l < 0.55 ? (Math.sin(t * 55) > 0.3 ? 1 : 0.05) : 1;
      cellarBase(t, { bulb: on, swing: 0.15 * smooth(0.2, 0.6, l) });
      cellar.scene.updateMatrixWorld(true); const bp = cellar.bulb.getWorldPosition(v3(0, 0, 0));
      placeCamera(E.camera, v3(0.35, 1.75, 0.5), bp, 40, t, 0.6);
      return { exposure: 1.1 };
    } },
  // ---- Kisten. Salz und Rost.
  { a: 18.4, b: 20.9, scene: 'cellar', run(t, l) {
      cellarBase(t, { swing: 0.12 }); cellar.keyPhoto.position.set(0.12, 0.925, -1.98); cellar.keyPhoto.rotation.set(-Math.PI / 2, 0, 0.3);
      const k = easeInOut(l / 2.5);
      placeCamera(E.camera, v3(0.4, 1.5, 1.6), v3(lerp(-1.7, 1.6, k), lerp(1.0, 1.2, k), lerp(-1.2, -1.4, k)), 48, t, 0.6);
      return { exposure: 1.4 };
    } },
  // ---- In einer Kiste lagen alte Fotos.
  { a: 20.9, b: 23.4, scene: 'cellar', run(t, l) {
      cellarBase(t, { swing: 0.1 }); cellar.keyPhoto.position.set(0.12, 0.925, -1.98); cellar.keyPhoto.rotation.set(-Math.PI / 2, 0, 0.3);
      placeCamera(E.camera, v3(0.15, 1.75 - l * 0.08, -1.55), v3(0.15, 0.9, -2.05), 46, t, 0.5);
      return { exposure: 1.2 };
    } },
  // ---- Eins war beschriftet: Nebelsand, Oktober 1953.
  { a: 23.4, b: 28.0, scene: 'cellar', run(t, l) {
      cellarBase(t, { swing: 0.08 });
      const k = easeInOut(smooth(1.6, 4.4, l));
      camOnPhoto(t, [lerp(0.35, 0.5, k), lerp(0.92, 0.5, k)], lerp(0.075, 0.2, k), 40, 0.4);
      return { exposure: 1.2 };
    } },
  // ---- Der Wärter von damals stand vor dem Turm. Grüne Jacke. Graue Mütze.
  { a: 28.0, b: 32.7, scene: 'cellar', run(t, l) {
      cellarBase(t, { swing: 0.08 });
      const k = easeInOut(l / 4.7);
      camOnPhoto(t, [lerp(0.5, 0.52, k), lerp(0.45, 0.42, k)], lerp(0.2, 0.13, k), 40, 0.4);
      return { exposure: 1.2 };
    } },
  // ---- Ich hielt die Lampe näher. (über Jonas' Schulter)
  { a: 32.7, b: 34.4, scene: 'cellar', run(t, l) {
      cellarBase(t, { swing: 0.18 });
      jC.root.visible = true; jC.idle(t); jC.root.position.set(0.55, 0, -0.45); jC.root.rotation.y = Math.PI - 0.5; jC.neck.rotation.x = 0.45;
      jC.armL.sh.rotation.x = -1.0; jC.armR.sh.rotation.x = -1.0; jC.armL.el.rotation.x = -0.5; jC.armR.el.rotation.x = -0.5;
      cellar.keyPhoto.position.set(0.4, 1.3, -0.82 + l * 0.05); cellar.keyPhoto.rotation.set(-0.6, -0.5, 0);
      placeCamera(E.camera, v3(-0.35, 1.45, -1.75), v3(0.55, 1.45, -0.5), 44, t, 0.7);
      return { exposure: 1.2 };
    } },
  // ---- Er hatte mein Gesicht.
  { a: 34.4, b: 37.0, scene: 'cellar', run(t, l) {
      cellarBase(t, { swing: 0.08 });
      camOnPhoto(t, FACE, lerp(0.07, 0.045, easeInOut(l / 2.6)), 40, 0.3);
      return { exposure: 1.2, vignette: 1.3 };
    } },
  // ---- Dann sah ich es. Hinter ihm. Im Nebel. Eine Gestalt …
  { a: 37.0, b: 43.4, scene: 'cellar', run(t, l) {
      cellarBase(t, { swing: 0.06 });
      const k = easeInOut(smooth(0.3, 4.5, l));
      camOnPhoto(t, [lerp(FACE[0], (FACE[0] + FIG[0]) / 2, k), lerp(FACE[1], 0.5, k)], lerp(0.06, 0.08, k), 40, 0.3);
      return { exposure: 1.2, vignette: 1.4 };
    } },
  // ---- Mir wurde kalt. Ich drehte mich zum Spiegel an der Wand.
  { a: 43.4, b: 46.4, scene: 'cellar', run(t, l) {
      cellarBase(t, { swing: 0.12 }); cellar.keyPhoto.visible = false;
      const k = easeInOut(smooth(1.0, 2.6, l));
      jC.root.visible = true; jC.idle(t); jC.root.position.set(1.2, 0, -0.2); jC.root.rotation.y = lerp(Math.PI, Math.PI / 2 + 0.25, k);
      figC.visible = true; figC.position.set(0.55, 0, 0.35); figC.rotation.y = Math.PI / 2;
      placeCamera(E.camera, v3(-0.9, 1.65, 1.6), v3(1.5, 1.35, -0.1), 46, t, 0.6);
      return { exposure: 1.2 };
    } },
  // ---- Und da stand sie. Direkt hinter mir. (Spiegel)
  { a: 46.4, b: STING, scene: 'cellar', run(t, l) {
      cellarBase(t, { swing: 0.1 }); cellar.keyPhoto.visible = false;
      jC.root.visible = true; jC.idle(t); jC.root.position.set(1.2, 0, -0.2); jC.root.rotation.y = Math.PI / 2 + 0.25;
      figC.visible = true; figC.position.set(0.55, 0, 0.35); figC.rotation.y = Math.PI / 2 + 0.15;
      const k = easeInOut(l / 4.8);
      placeCamera(E.camera, v3(lerp(-0.1, 0.25, k), 1.72, lerp(0.3, 0.25, k)), v3(1.975, 1.55, 0.12), 40, t, 0.3);
      return { exposure: 1.2 };
    } },
  // ---- SCHRECK: sie kommt näher
  { a: STING, b: 52.6, scene: 'cellar', run(t, l) {
      const fl = l < 0.6 ? (Math.sin(t * 60) > 0 ? 1 : 0.15) : 1;
      cellarBase(t, { swing: 0.2, bulb: fl }); cellar.keyPhoto.visible = false;
      jC.root.visible = true; jC.idle(t); jC.root.position.set(1.2, 0, -0.2); jC.root.rotation.y = Math.PI / 2 + 0.25;
      const k = smooth(STING, STING + 0.5, t);
      figC.visible = true; figC.position.set(lerp(0.55, 0.72, k), 0, lerp(0.35, 0.33, k)); figC.rotation.set(0, Math.PI / 2 + 0.15, -0.12 * k);
      const push = Math.min(1, l / 0.15);
      placeCamera(E.camera, v3(lerp(0.25, 0.75, push), 1.72, 0.25), v3(1.975, 1.6, 0.12), 38, t, 1.6);
      return { exposure: 1.2, flash: Math.max(0, 0.35 - l * 2) };
    } },
  // ---- Herumwirbeln: hinter ihm ist niemand
  { a: 52.6, b: 54.3, scene: 'cellar', run(t, l) {
      cellarBase(t, { swing: 0.22 }); cellar.keyPhoto.visible = false;
      jC.root.visible = true; jC.idle(t); jC.root.position.set(1.2, 0, -0.2); jC.root.rotation.y = lerp(Math.PI / 2, -Math.PI / 2 + 0.3, easeInOut(smooth(0, 0.3, l)));
      figC.visible = false;
      const yaw = lerp(0, Math.PI * 0.95, easeInOut(smooth(0, 0.28, l)));
      const c = v3(0.45, 1.7, 0.25); const dir = v3(Math.cos(yaw), -0.1, Math.sin(yaw) * 0.6);
      placeCamera(E.camera, c, c.clone().add(dir), 46, t, l < 0.4 ? 2.2 : 0.9);
      return { exposure: 1.2 };
    } },
  // ---- Zurück zum Spiegel: sie steht direkt an seiner Schulter – dann platzt die Birne
  { a: 54.3, b: 56.8, scene: 'cellar', run(t, l) {
      const pop = t >= 55.9; const bulb = pop ? 0 : (t > 55.6 ? (Math.sin(t * 80) > 0 ? 1.5 : 0.2) : 1);
      cellarBase(t, { swing: 0.15, bulb }); cellar.keyPhoto.visible = false;
      jC.root.visible = true; jC.idle(t); jC.root.position.set(1.2, 0, -0.2); jC.root.rotation.y = Math.PI / 2 + 0.25;
      figC.visible = true; figC.position.set(0.76, 0, 0.3); figC.rotation.set(0, Math.PI / 2 + 0.3, -0.18);
      const arm = figC.children[figC.children.length - 1]; arm.rotation.set(-1.1, 0, -0.5); arm.position.set(0.33, 1.25, 0.25);
      placeCamera(E.camera, v3(0.6 + l * 0.06, 1.72, 0.25), v3(1.975, 1.62, 0.12), 36, t, 0.4);
      const fade = pop ? Math.max(0, 1 - (t - 55.9) / 0.35) : 1;
      return { exposure: 1.2, fade, flash: (t > 55.88 && t < 55.95) ? 0.6 : 0 };
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
    drawEndCard(E.ctx, t, { start: 56.8, next: PART + 1, question: 'Wer steht hinter ihm?' });
  } else {
    const shot = shots.find((s) => t >= s.a && t < s.b) || shots[shots.length - 1];
    const post = shot.run(t, t - shot.a) || {};
    let scene;
    if (shot.scene === 'ext') { world.update(t, E.camera); scene = world.scene; }
    else if (shot.scene === 'room') scene = room.scene;
    else scene = cellar.scene;
    E.render(scene, t, post);
    drawTitle(E.ctx, t, { part: PART, show: [0, 3.0] });
    drawRecapLabel(E.ctx, t);
    drawSubtitles(E.ctx, chunks, t);
  }
  return E.out.toDataURL(type, 0.95);
}

export function renderCover() {
  const shot = shots.find((s) => s.a === 46.4);
  const post = shot.run(50.6, 50.6 - shot.a); post.exposure = 1.35;
  E.render(cellar.scene, 50.6, post);
  const c = E.ctx; const cx = 495;
  const g = c.createLinearGradient(0, 0, 0, 700); g.addColorStop(0, 'rgba(0,0,0,0.75)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, 1080, 700);
  const g2 = c.createLinearGradient(0, 1250, 0, 1920); g2.addColorStop(0, 'rgba(0,0,0,0)'); g2.addColorStop(1, 'rgba(0,0,0,0.85)'); c.fillStyle = g2; c.fillRect(0, 1250, 1080, 670);
  c.save(); c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
  c.font = '230px Anton'; c.lineWidth = 26; c.strokeStyle = '#000'; c.strokeText(`TEIL ${PART}/10`, cx, 330); c.fillStyle = '#fff'; c.fillText(`TEIL ${PART}/10`, cx, 330);
  c.fillStyle = '#ffb04a'; c.fillRect(cx - 300, 470, 600, 10);
  c.font = '800 36px Montserrat'; c.letterSpacing = '5px'; c.lineWidth = 10; c.strokeText('DER LEUCHTTURM VON NEBELSAND', cx, 535); c.fillStyle = '#e8f2f2'; c.fillText('DER LEUCHTTURM VON NEBELSAND', cx, 535);
  c.letterSpacing = '0px';
  c.font = '900 80px Montserrat'; c.lineWidth = 18; c.strokeText('FOTO VON 1953.', cx, 1430); c.fillStyle = '#ffb04a'; c.fillText('FOTO VON 1953.', cx, 1430);
  c.font = '900 64px Montserrat'; c.lineWidth = 15; c.strokeText('DAS BIN ICH.', cx, 1530); c.fillStyle = '#fff'; c.fillText('DAS BIN ICH.', cx, 1530);
  c.restore();
  return E.out.toDataURL('image/png');
}

// Debug: das erzeugte Foto als PNG
export function photoPNG() { return photoTex.image.toDataURL('image/png'); }
