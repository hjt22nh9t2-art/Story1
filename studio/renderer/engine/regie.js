// Regie: setzt plan.json (Szenen, Einstellungen, Figuren, Effekte, Wörter) Frame für Frame in Bilder um.
import * as THREE from 'three';
import { createEngine, loadFonts, buildChunks, drawSubtitles, drawHeadline, drawCard, drawEndCard, W, H } from './core.js';
import { buildSet } from './orte.js';
import { createFigure } from './figuren.js';
import { createProp } from './requisiten.js';
import { createEffect } from './effekte.js';
import { handheld, smooth, easeInOut, lerp, clamp01, noise2, v3 } from './lib.js';

let E, plan, chunks; const sets = {}; const scenes = [];

function setKey(s) { return [s.ort, s.zeit || 'nacht', s.wetter || 'klar', s.variante || ''].join('|'); }

function markPos(set, m, idx = 0) {
  if (Array.isArray(m)) return v3(m[0], m.length > 2 ? m[1] : 0, m.length > 2 ? m[2] : m[1]);
  const p = set.marks[m] || set.marks.mitte || [0, 0, 0];
  return v3(p[0], p[1], p[2]);
}

// ---------------------------------------------------------------- Aufbau einer Szene
function prepareScene(sc, i) {
  const key = setKey(sc);
  if (!sets[key]) sets[key] = buildSet({ ort: sc.ort, zeit: sc.zeit, wetter: sc.wetter, variante: sc.variante });
  const set = sets[key];
  const layer = new THREE.Group(); layer.name = 'szene_' + i; layer.visible = false;
  (set.rootForFigures || set.scene).add(layer);
  const figs = (sc.figuren || []).map((f, k) => {
    const spec = plan.figuren[f.id] || { id: f.id }; const F = createFigure({ id: f.id, ...spec }, hashId(f.id));
    layer.add(F.root);
    // gleiche Marke mehrfach belegt -> seitlich versetzen
    const sameMark = (sc.figuren || []).slice(0, k).filter((g) => JSON.stringify(g.von || g.mark) === JSON.stringify(f.von || f.mark)).length;
    const off = sameMark ? v3((sameMark % 2 ? 1 : -1) * 0.75 * Math.ceil(sameMark / 2), 0, -0.35 * sameMark) : v3(0, 0, 0);
    return { F, cfg: f, from: markPos(set, f.von || f.mark || 'mitte').add(off), to: f.nach ? markPos(set, f.nach).add(off) : null };
  });
  const props = (sc.requisiten || []).map((p) => {
    const o = createProp(p.name, p); if (!o) return null;
    const pos = markPos(set, p.pos || p.mark || 'hinten'); o.position.copy(pos);
    if (p.rot != null) o.rotation.y = p.rot; if (p.groesse) o.scale.setScalar(p.groesse);
    layer.add(o); return { o, cfg: p, pos };
  }).filter(Boolean);
  const fx = (sc.effekte || []).map((e) => {
    const name = typeof e === 'string' ? e : e.name; const opt = typeof e === 'string' ? {} : e;
    const ef = createEffect(name, set, opt); if (!ef) return null;
    ef.objs.forEach((o) => { o.parent && o.parent.remove(o); layer.add(o); });
    return ef;
  }).filter(Boolean);
  scenes[i] = { sc, set, layer, figs, props, fx };
}
function hashId(s) { let h = 7; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h % 997 + 1; }

// ---------------------------------------------------------------- Figuren pro Frame
function updateFigures(S, t, l, d, cam) {
  for (const { F, cfg, from, to } of S.figs) {
    const dauer = cfg.dauer ?? d; const start = cfg.ab ?? 0;
    const k = to ? easeInOut(clamp01((l - start) / dauer)) : 0;
    const p = to ? from.clone().lerp(to, k) : from.clone();
    F.root.position.copy(p);
    const moving = to && l >= start && l <= start + dauer;
    let yaw;
    if (to && (moving || cfg.blick == null)) { const dx = to.x - from.x, dz = to.z - from.z; yaw = Math.atan2(dx, dz); }
    else if (cfg.blick === 'kamera') { yaw = 0; }
    else if (typeof cfg.blick === 'number') yaw = cfg.blick;
    else if (typeof cfg.blick === 'string' && cfg.blick.startsWith('zu:')) { const o = S.figs.find((g) => g.cfg.id === cfg.blick.slice(3)); yaw = o ? Math.atan2(o.F.root.position.x - p.x, o.F.root.position.z - p.z) : 0; }
    else if (cfg.blick === 'weg') yaw = Math.PI;
    else if (cfg.blick === 'links') yaw = -Math.PI / 2; else if (cfg.blick === 'rechts') yaw = Math.PI / 2;
    else yaw = S.set.axis === 'z' ? 0 : 0;
    F.root.rotation.y = yaw;
    let akt = cfg.aktion || (to ? 'laufen' : 'warten');
    if (to && !moving && (akt === 'laufen' || akt === 'rennen' || akt === 'schleichen' || akt === 'taumeln')) akt = cfg.danach || 'warten';
    // Aktionsfolge: aktion2 ab Zeitpunkt
    if (cfg.aktion2 && l >= (cfg.ab2 ?? d * 0.5)) { akt = cfg.aktion2; F.pose(akt, t, l - (cfg.ab2 ?? d * 0.5), d, { ausdruck: cfg.ausdruck2 || cfg.ausdruck, blick: cfg.kopf, lampe: cfg.lampe }); }
    else F.pose(akt, t, l - start, dauer, { ausdruck: cfg.ausdruck, tempo: cfg.tempo, blick: cfg.kopf, lampe: cfg.lampe, talk: cfg.spricht ? 1 : undefined, aufrecht: cfg.blick === 'kamera' && !['liegen', 'fallen', 'kriechen'].includes(akt) });
    if (S.set.ort === 'meer' || p.y > 0.01) {} // Boot: y aus Marke
  }
  for (const pr of S.props) {
    const a = pr.cfg.anim; pr.o.userData.update?.(t, l, d, pr.cfg);
    if (!a) continue;
    if (a === 'hochziehen') { const k = smooth(pr.cfg.ab ?? 0, (pr.cfg.ab ?? 0) + (pr.cfg.dauer ?? d), l); pr.o.position.y = pr.pos.y + lerp(pr.cfg.vonY ?? -3, pr.cfg.bisY ?? 4, k); }
    if (a === 'herablassen') { const k = smooth(pr.cfg.ab ?? 0, (pr.cfg.ab ?? 0) + (pr.cfg.dauer ?? d), l); pr.o.position.y = pr.pos.y + lerp(pr.cfg.vonY ?? 4, pr.cfg.bisY ?? 0, k); }
    if (a === 'fahren') { const k = clamp01((l - (pr.cfg.ab ?? 0)) / (pr.cfg.dauer ?? d)); pr.o.position.z = pr.pos.z + lerp(0, pr.cfg.strecke ?? 10, k); }
    if (a === 'schweben') { pr.o.position.y = pr.pos.y + Math.sin(t * 1.3) * 0.05; pr.o.rotation.z = Math.sin(t * 0.9) * 0.08; }
    if (a === 'wackeln') { pr.o.rotation.z = Math.sin(t * 25) * 0.04; }
  }
}

// ---------------------------------------------------------------- Kamera
function figHead(fig) { fig.F.root.updateMatrixWorld(true); return fig.F.head.getWorldPosition(v3(0, 0, 0)); }
function focusOf(S, shot) {
  const z = shot.ziel;
  if (z && typeof z === 'string' && z.startsWith('prop:')) { const p = S.props.find((x) => x.cfg.name === z.slice(5)); if (p) { p.o.updateMatrixWorld(true); const b = new THREE.Box3().setFromObject(p.o); const c = p.o.getWorldPosition(v3(0, 0, 0)); c.y = Math.min(b.min.y + 1.2, (b.min.y + b.max.y) / 2); return c; } }
  if (Array.isArray(z)) return v3(z[0], z[1], z[2]);
  if (z && S.set.marks[z]) return markPos(S.set, z).add(v3(0, 1.2, 0));
  const figs = z ? S.figs.filter((f) => f.cfg.id === z) : S.figs;
  if (!figs.length) { return S.set.marks.mitte ? markPos(S.set, 'mitte').add(v3(0, 1.3, 0)) : v3(0, 1.3, 0); }
  const c = v3(0, 0, 0); figs.forEach((f) => c.add(figHead(f))); return c.multiplyScalar(1 / figs.length);
}
function figForward(S, shot) { const f = (shot.ziel && S.figs.find((x) => x.cfg.id === shot.ziel)) || S.figs.find((x) => x.to) || S.figs[0]; if (!f) return v3(0, 0, 1); return v3(Math.sin(f.F.root.rotation.y), 0, Math.cos(f.F.root.rotation.y)); }

const NAH = ['gesicht', 'nah', 'zoom_schock', 'vertigo', 'pov'];
const WELT = ['weit', 'totale', 'vogel'];
function cameraFor(S, shot, l, d, t) {
  // Nahe Einstellungen ohne Ziel: auf die erste Figur (sonst landet die Kamera zwischen/in den Figuren)
  if (!shot.ziel && S.figs.length > 1 && NAH.includes(shot.kamera)) shot = { ...shot, ziel: S.figs[0].cfg.id };
  const foc = focusOf(S, shot); const k = easeInOut(clamp01(l / d)); let yaw = shot.yaw ?? 0;
  // Figuren-Einstellungen: yaw relativ zur Blickrichtung der Hauptfigur (0 = frontal)
  const zielIstFigur = !shot.ziel || S.figs.some((x) => x.cfg.id === shot.ziel);
  const main = (shot.ziel && S.figs.find((x) => x.cfg.id === shot.ziel)) || S.figs[0];
  if (main && zielIstFigur && !WELT.includes(shot.kamera) && !shot.weltYaw) yaw += main.F.root.rotation.y;
  if (S.set.axis === 'z') { const back = Math.cos(yaw) < 0; const off = Math.max(-0.45, Math.min(0.45, Math.atan2(Math.sin(yaw), Math.abs(Math.cos(yaw))))); yaw = back ? Math.PI - off : off; }
  const dir = (a) => v3(Math.sin(a), 0, Math.cos(a));
  let pos, tgt = foc.clone(), fov = 40, shake = 0.6;
  const art = shot.kamera || 'halbtotale';
  switch (art) {
    case 'weit': pos = foc.clone().add(dir(yaw).multiplyScalar(lerp(26, 22, k))).add(v3(0, 9, 0)); fov = 42; shake = 0.3; break;
    case 'totale': pos = foc.clone().add(dir(yaw).multiplyScalar(lerp(9, 7.5, k))).add(v3(0, 2.0, 0)); fov = 44; break;
    case 'halbtotale': pos = foc.clone().add(dir(yaw).multiplyScalar(lerp(4.6, 4.0, k))).add(v3(0, 0.25, 0)); fov = 42; break;
    case 'nah': pos = foc.clone().add(dir(yaw).multiplyScalar(lerp(2.4, 2.1, k))).add(v3(0, 0.05, 0)); tgt = foc.clone().add(v3(0, -0.2, 0)); fov = 36; shake = 0.5; break;
    case 'gesicht': pos = foc.clone().add(dir(yaw).multiplyScalar(lerp(1.75, 1.5, k))).add(v3(0, -0.02, 0)); tgt = foc.clone().add(v3(0, -0.06, 0)); fov = 30; shake = 0.4; break;
    case 'detail': pos = foc.clone().add(dir(yaw).multiplyScalar(lerp(2.0, 1.6, k))).add(v3(0, 0.3, 0)); fov = 34; shake = 0.35; break;
    case 'frosch': pos = foc.clone().add(dir(yaw).multiplyScalar(2.6)).setY(0.3); tgt = foc.clone().add(v3(0, 0.5 + k * 0.2, 0)); fov = 48; break;
    case 'vogel': if (S.set.bounds) { pos = foc.clone().add(dir(yaw).multiplyScalar(lerp(3.4, 3.0, k))).setY(S.set.bounds.y[1]); tgt = foc.clone().add(v3(0, -0.6, 0)); fov = 50; shake = 0.3; break; }
      pos = foc.clone().add(v3(0.01, lerp(7, 5.5, k), 1.2)); tgt = foc.clone().setY(0); fov = 46; shake = 0.3; break;
    case 'verfolgung': { const fw = figForward(S, shot); pos = foc.clone().sub(fw.clone().multiplyScalar(2.8)).add(v3(0.35, 0.15, 0)); tgt = foc.clone().add(fw.clone().multiplyScalar(4)); fov = 46; shake = 1.1; break; }
    case 'vorlauf': { const fw = figForward(S, shot); pos = foc.clone().add(fw.clone().multiplyScalar(3.0)).add(v3(0.2, 0.1, 0)); fov = 40; shake = 0.9; break; }
    case 'seitlich': { const fw = figForward(S, shot); const side = v3(fw.z, 0, -fw.x); pos = foc.clone().add(side.multiplyScalar(4.2)).add(v3(0, 0.1, 0)); fov = 40; break; }
    case 'orbit': { const a = yaw + lerp(-0.5, 0.5, k); pos = foc.clone().add(dir(a).multiplyScalar(3.6)).add(v3(0, 0.5, 0)); fov = 42; shake = 0.4; break; }
    case 'kranfahrt': pos = foc.clone().add(dir(yaw).multiplyScalar(lerp(3.5, 6, k))).add(v3(0, lerp(-0.6, 4.5, k), 0)); fov = 44; shake = 0.3; break;
    case 'abwaerts': pos = foc.clone().add(dir(yaw).multiplyScalar(lerp(6, 3.5, k))).add(v3(0, lerp(4.5, 0.2, k), 0)); fov = 44; shake = 0.3; break;
    case 'zoom_schock': { const q = 1 - Math.pow(1 - clamp01(l / 0.3), 3); pos = foc.clone().add(dir(yaw).multiplyScalar(lerp(4.4, 1.7, q))).add(v3(0, 0.1, 0)); fov = lerp(44, 34, q); shake = l < 0.4 ? 2.0 : 0.8; break; }
    case 'vertigo': { const dist = lerp(1.7, 3.8, k); pos = foc.clone().add(dir(yaw).multiplyScalar(dist)); fov = 2 * Math.atan(0.55 / dist) * 180 / Math.PI * 1.15; shake = 0.3; break; }
    case 'schulter': { const a = S.figs[0], b = S.figs[1] || S.figs[0]; const pa = figHead(a), pb = figHead(b); const dv = pb.clone().sub(pa).setY(0).normalize();
      pos = pa.clone().sub(dv.clone().multiplyScalar(1.7)).add(v3(dv.z * 0.75, 0.3, -dv.x * 0.75)); tgt = pb.clone().add(v3(0, -0.15, 0)); fov = 42; shake = 0.5; break; }
    case 'pov': { const f = S.figs.find((x) => x.cfg.id === shot.ziel) || S.figs[0]; const hp = f ? figHead(f) : foc; const fw = f ? v3(Math.sin(f.F.root.rotation.y), 0, Math.cos(f.F.root.rotation.y)) : v3(0, 0, -1);
      pos = hp.clone().add(fw.clone().multiplyScalar(0.25)); tgt = hp.clone().add(fw.multiplyScalar(5)).add(v3(0, -0.4, 0)); fov = 55; shake = 1.4; if (f) f.F.head.visible = false; break; }
    default: pos = foc.clone().add(dir(yaw).multiplyScalar(4)).add(v3(0, 0.3, 0));
  }
  // Bildgestaltung im Hochformat: Abstand so wählen, dass alle Zielfiguren nebeneinander ins schmale Bild passen
  if (['totale', 'halbtotale', 'nah', 'orbit', 'kranfahrt', 'frosch', 'abwaerts'].includes(art) && S.figs.length > 1 && !shot.ziel) {
    const ps = S.figs.map((f) => f.F.root.position); const camDir = pos.clone().sub(tgt).setY(0); const dist = camDir.length(); camDir.normalize();
    const side = v3(camDir.z, 0, -camDir.x); const proj = ps.map((p) => p.clone().sub(foc).dot(side)); const spread = Math.max(...proj) - Math.min(...proj);
    const hf = Math.atan(Math.tan(fov * Math.PI / 360) * W / H); const need = (spread / 2 + 0.45) / Math.tan(hf);
    if (need > dist) pos.add(camDir.multiplyScalar(need - dist));
  }
  if (shot.hoehe != null) pos.y += shot.hoehe;
  if (shot.fov) fov = shot.fov;
  // im Innenraum innerhalb der Wände bleiben
  const b = S.set.bounds; if (b) { pos.x = Math.min(b.x[1], Math.max(b.x[0], pos.x)); pos.y = Math.min(b.y[1], Math.max(b.y[0], pos.y)); pos.z = Math.min(b.z[1], Math.max(b.z[0], pos.z)); }
  else pos.y = Math.max(0.25, pos.y);
  return { pos, tgt, fov, shake };
}

// ---------------------------------------------------------------- Init & Frame
export async function init(planUrl) {
  await loadFonts();
  plan = await (await fetch(planUrl)).json();
  chunks = buildChunks(plan.woerter || []);
  E = createEngine();
  plan.szenen.forEach((sc, i) => prepareScene(sc, i));
}

function sceneAt(t) { let i = plan.szenen.findIndex((s) => t >= s.a && t < s.b); if (i < 0) i = t < plan.szenen[0].a ? 0 : plan.szenen.length - 1; return i; }

export function renderFrame(t, type = 'image/jpeg') {
  const i = sceneAt(t); const S = scenes[i]; const sc = S.sc; const l = t - sc.a; const d = sc.b - sc.a;
  // Sichtbarkeit: nur die Ebene dieser Szene
  scenes.forEach((x) => { if (x.set === S.set) x.layer.visible = x === S; });
  S.figs.forEach((f) => { f.F.head.visible = true; });
  const shot = (sc.shots || []).find((s) => t >= s.a && t < s.b) || (sc.shots || [])[0] || { a: sc.a, b: sc.b, kamera: 'halbtotale' };
  const sl = t - shot.a, sd = shot.b - shot.a;
  // Effekte (können Licht-Zustand und Post ändern)
  let post = { mood: sc.stimmung || 'spannung', exposure: (S.set.exposure ?? 1) * (sc.belichtung ?? 1) }; let state = { licht: sc.licht ?? 1 }; let shakeFx = 0;
  // vorläufige Kamera für Blickrichtung der Figuren
  updateFigures(S, t, l, d, E.camera.position);
  for (const ef of S.fx) { if (ef.state) Object.assign(state, ef.state); const r = ef.update(t, l, d) || {};
    if (r.state) { if (r.state.licht != null) r.state.licht *= (sc.licht ?? 1); Object.assign(state, r.state); } if (r.flash) post.flash = Math.max(post.flash || 0, r.flash); if (r.shake) shakeFx = Math.max(shakeFx, r.shake);
    if (r.zoomBlur) post.zoomBlur = Math.max(post.zoomBlur || 0, r.zoomBlur); if (r.red) post.red = r.red; if (r.flicker) post.flicker = r.flicker; }
  if (state.flackern) post.flicker = 0.08;
  S.set.update(t, E.camera, state);
  const cam = cameraFor(S, shot, sl, sd, t);
  if (WELT.includes(shot.kamera) || shot.weltYaw) S.figs.forEach((f) => { if (f.cfg.blick === 'kamera' && !f.to) f.F.root.rotation.y = Math.atan2(cam.pos.x - f.F.root.position.x, cam.pos.z - f.F.root.position.z); });
  E.camera.position.copy(cam.pos); E.camera.fov = cam.fov; E.camera.near = cam.fov < 33 ? 0.02 : 0.05; E.camera.updateProjectionMatrix(); E.camera.lookAt(cam.tgt);
  const h = handheld(t, cam.shake + shakeFx); E.camera.rotateX(h.x); E.camera.rotateY(h.y); E.camera.rotateZ(h.z);
  if (shakeFx > 0) { E.camera.rotateZ(noise2(t * 30, 4) * 0.01 * shakeFx); E.camera.position.y += noise2(t * 25, 8) * 0.03 * shakeFx; }
  // Übergänge
  const ub = sc.uebergang || 'schnitt'; const next = plan.szenen[i + 1];
  if (ub === 'blitz' && l < 0.3) post.flash = Math.max(post.flash || 0, 0.85 * (1 - l / 0.3));
  if (ub === 'schwarz' && l < 0.4) post.fade = smooth(0, 0.4, l);
  if (ub === 'zoom' && l < 0.22) post.zoomBlur = Math.max(post.zoomBlur || 0, 1.4 * (1 - l / 0.22));
  if (next && next.uebergang === 'schwarz' && sc.b - t < 0.3) post.fade = Math.min(post.fade ?? 1, (sc.b - t) / 0.3);
  if (next && next.uebergang === 'zoom' && sc.b - t < 0.12) post.zoomBlur = Math.max(post.zoomBlur || 0, 1.2 * (1 - (sc.b - t) / 0.12));
  if (shot.kamera === 'zoom_schock' && sl < 0.25) post.zoomBlur = Math.max(post.zoomBlur || 0, 0.9 * (1 - sl / 0.25));
  // Wiederholung/Rückblick etc.
  if (sc.stimmung === 'rueckblick') { post.flicker = Math.max(post.flicker || 0, 0.05); post.vignette = 1.4; }
  S.set.charLight?.(E.camera, focusOf(S, shot), sc.figurenlicht ?? 1);
  S.figs.forEach((f) => f.F.lampFacing(E.camera.position));
  E.render(S.set.scene, t, post);
  // 2D-Ebenen
  const ctx = E.ctx;
  if (plan.headline) drawHeadline(ctx, t, plan.headline);
  if (sc.einblendung) drawCard(ctx, t, sc.einblendung);
  if (!plan.outro || t < plan.outro.start) drawSubtitles(ctx, chunks, t);
  if (plan.outro && t >= plan.outro.start) { drawEndCard(ctx, t, { ...plan.outro, question: plan.outro.frage || plan.outro.question || "" }); drawSubtitles(ctx, chunks, t, { y: 1460, size: 64 }); }
  return E.out.toDataURL(type, 0.93);
}

export function debugInfo(t) { renderFrame(t); const S = scenes[sceneAt(t)]; return { props: S.props.map((p) => [p.cfg.name, p.o.position.toArray(), new THREE.Box3().setFromObject(p.o).min.toArray(), new THREE.Box3().setFromObject(p.o).max.toArray()]), tgt: (() => { const sh = (S.sc.shots || []).find((x) => t >= x.a && t < x.b); return [sh, focusOf(S, sh).toArray()]; })(), cam: E.camera.position.toArray(), fov: E.camera.fov, figs: scenes[sceneAt(t)].figs.map((f) => f.F.root.position.toArray()), info: E.renderer.info.render }; }

export function renderCover() {
  const t = plan.cover?.t ?? 1.0; renderFrame(t, 'image/png');
  const c = E.ctx; const g = c.createLinearGradient(0, 0, 0, 900); g.addColorStop(0, 'rgba(0,0,0,0.8)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, W, 900);
  drawHeadline(c, 1, { text: plan.cover?.text || plan.headline?.text || plan.titel, a: 0, b: 2 });
  return E.out.toDataURL('image/png');
}
