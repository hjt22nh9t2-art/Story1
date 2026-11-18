// Stilisierte Figuren: große Augen, einfache Gesichter, klare Silhouetten.
// Jede Figur wird aus einem festen Steckbrief (drehbuch.json -> figuren) gebaut. Gleicher Steckbrief = gleiche Figur in jeder Szene.
import * as THREE from 'three';
import { noise2, rng, clamp01, lerp, smooth } from './lib.js';

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, ...o });
function cap(r, l, m, seg = 12) { const x = new THREE.Mesh(new THREE.CapsuleGeometry(r, l, 5, seg), m); x.castShadow = true; x.receiveShadow = true; return x; }
function sph(r, m, ws = 20, hs = 14) { const x = new THREE.Mesh(new THREE.SphereGeometry(r, ws, hs), m); x.castShadow = true; return x; }

// Schmutz-Textur (für Bergleute/Arbeiter): Flecken, multipliziert
let _dirt = null;
function dirtTex() {
  if (_dirt) return _dirt;
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, 256, 256); const r = rng(5);
  for (let i = 0; i < 140; i++) { g.fillStyle = `rgba(40,30,20,${0.05 + r() * 0.12})`; g.beginPath(); g.ellipse(r() * 256, r() * 256, 4 + r() * 22, 3 + r() * 14, r() * 3, 0, 7); g.fill(); }
  _dirt = new THREE.CanvasTexture(c); _dirt.wrapS = _dirt.wrapT = THREE.RepeatWrapping; _dirt.colorSpace = THREE.SRGBColorSpace; return _dirt;
}

export const OUTFIT_DEFAULTS = {
  bergmann: { oberteil: '#3d4a52', hose: '#2f3a42', kopf: 'helm', helmFarbe: '#e8e4d8', lampe: true, dreck: 0.7 },
  arbeiter: { oberteil: '#d0662a', hose: '#2c3440', kopf: 'helm', helmFarbe: '#f2c230', lampe: false, dreck: 0.3 },
  zivil: { oberteil: '#5a4a3c', hose: '#2a2e36' },
  anzug: { oberteil: '#23262d', hose: '#1d2027', krawatte: '#7a1f24' },
  uniform: { oberteil: '#3b4636', hose: '#323b2f', kopf: 'kappe', helmFarbe: '#2f382c' },
  kittel: { oberteil: '#e7ecee', hose: '#39404a' },
  pullover: { oberteil: '#7b2f33', hose: '#2b3442' },
  kleid: { oberteil: '#5b2d4a', hose: '#5b2d4a' },
  taucher: { oberteil: '#15181c', hose: '#15181c', kopf: null },
  polizei: { oberteil: '#2a3f5a', hose: '#1f2a3a', kopf: 'kappe', helmFarbe: '#1f2a3a' },
  feuerwehr: { oberteil: '#24272b', hose: '#24272b', kopf: 'helm', helmFarbe: '#c8b020', lampe: false, reflex: true },
  pilot: { oberteil: '#556048', hose: '#4a5340', kopf: 'kappe', helmFarbe: '#3a2e22' },
};

export function createFigure(spec = {}, seed = 1) {
  const o = { typ: 'mann', haut: '#d6a88a', haare: '#3b2a1f', frisur: 'kurz', augen: '#4a3424', outfit: 'zivil', groesse: 1, ...OUTFIT_DEFAULTS[spec.outfit || 'zivil'], ...spec };
  const kid = o.typ === 'kind'; const woman = o.typ === 'frau';
  const S = (kid ? 0.68 : woman ? 0.95 : 1) * (o.groesse || 1);
  const dirt = clamp01(o.dreck || 0);
  const clothM = (c, rough = 0.85) => { const m = mat(c, { roughness: rough }); if (dirt > 0) { m.map = dirtTex(); m.color.lerp(new THREE.Color('#4a4038'), dirt * 0.25); } return m; };
  const topM = clothM(o.oberteil), pantsM = clothM(o.hose), shoeM = mat('#17171a', { roughness: 0.5 });
  const skinM = mat(o.haut, { roughness: 0.6 }); if (dirt > 0.4) skinM.color.lerp(new THREE.Color('#5a4a40'), (dirt - 0.4) * 0.5);
  const hairM = mat(o.haare, { roughness: 0.9 });

  const root = new THREE.Group(); root.name = 'figur_' + (o.id || seed);
  const body = new THREE.Group(); body.scale.setScalar(S); root.add(body);
  const hip = new THREE.Group(); hip.position.y = 0.92; body.add(hip);
  const torso = new THREE.Group(); hip.add(torso);
  const chest = cap(woman ? 0.2 : 0.225, 0.42, topM); chest.scale.set(1.12, 1, 0.8); chest.position.y = 0.33; torso.add(chest);
  const pelvis = cap(0.2, 0.08, pantsM); pelvis.scale.set(1.2, 1, 0.85); pelvis.position.y = 0.0; torso.add(pelvis);
  if (o.outfit === 'kittel' || o.outfit === 'kleid') { const coat = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.36, 0.62, 18, 1, true), topM); coat.material.side = THREE.DoubleSide; coat.position.y = -0.12; coat.scale.z = 0.8; coat.castShadow = true; torso.add(coat); }
  if (o.krawatte) { const tie = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.3, 0.02), mat(o.krawatte)); tie.position.set(0, 0.45, 0.2); torso.add(tie); const shirt = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.32), mat('#e8e8e8')); shirt.position.set(0, 0.47, 0.192); torso.add(shirt); }
  if (o.reflex || o.outfit === 'bergmann') { const band = new THREE.Mesh(new THREE.CylinderGeometry(0.287, 0.287, 0.05, 20, 1, true), mat(o.reflex ? '#d8d070' : '#8a8f88', { emissive: o.reflex ? '#504a10' : '#000' })); band.scale.z = 0.8; band.position.y = 0.2; torso.add(band); }
  if (o.outfit === 'bergmann') { // Gürtel mit Akku für die Helmlampe
    const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.07, 18), mat('#2a1f18')); belt.scale.z = 0.85; belt.position.y = 0.07; torso.add(belt);
    const bat = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.12, 0.06), mat('#1a1a1a')); bat.position.set(0.12, 0.06, -0.21); torso.add(bat);
  }

  // ---- Kopf: groß, rund, große Augen
  const neck = new THREE.Group(); neck.position.y = 0.66; torso.add(neck);
  const neckM = cap(0.06, 0.06, skinM); neckM.position.y = 0.02; neck.add(neckM);
  const head = new THREE.Group(); head.position.y = 0.22; neck.add(head);
  const HR = kid ? 0.22 : 0.2;
  const skull = sph(HR, skinM, 28, 20); skull.scale.set(0.93, 1.06, 0.98); head.add(skull);
  const jaw = sph(HR * 0.82, skinM, 20, 12); jaw.scale.set(0.95, 0.75, 0.95); jaw.position.set(0, -HR * 0.42, HR * 0.08); head.add(jaw);
  const ears = [-1, 1].map((s) => { const e = sph(0.038, skinM, 10, 8); e.scale.set(0.5, 1, 0.8); e.position.set(s * HR * 0.93, -0.01, 0); head.add(e); return e; });
  const nose = sph(0.024, skinM, 10, 8); nose.scale.set(0.9, 1.1, 1.2); nose.position.set(0, -HR * 0.22, HR * 0.97); head.add(nose);
  // Augen
  const whiteM = mat('#f4f1ec', { roughness: 0.25 }); const irisM = mat(o.augen, { roughness: 0.3 }); const pupM = mat('#050505', { roughness: 0.1 });
  const glintM = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const ER = kid ? 0.068 : 0.06;
  const eyes = [-1, 1].map((s) => {
    const g = new THREE.Group(); g.position.set(s * HR * 0.37, 0.015, HR * 0.8); head.add(g);
    const w = new THREE.Mesh(new THREE.SphereGeometry(ER, 20, 16), whiteM); w.scale.set(1, 1.12, 0.62); g.add(w);
    const look = new THREE.Group(); g.add(look);
    const iris = new THREE.Mesh(new THREE.CircleGeometry(ER * 0.62, 20), irisM); iris.position.z = ER * 0.63; look.add(iris);
    const pup = new THREE.Mesh(new THREE.CircleGeometry(ER * 0.33, 16), pupM); pup.position.z = ER * 0.635; look.add(pup);
    const gl = new THREE.Mesh(new THREE.CircleGeometry(ER * 0.12, 8), glintM); gl.position.set(ER * 0.18, ER * 0.2, ER * 0.64); look.add(gl);
    // Oberlid (Hautkappe, rotiert zum Blinzeln)
    const lid = new THREE.Mesh(new THREE.SphereGeometry(ER * 1.07, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), skinM); lid.scale.set(1, 1.12, 0.66); lid.rotation.x = -1.35; g.add(lid);
    const brow = new THREE.Mesh(new THREE.BoxGeometry(ER * 1.7, ER * 0.28, ER * 0.3), hairM); brow.position.set(0, ER * 1.45, ER * 0.25); g.add(brow);
    return { g, look, lid, brow, side: s, pup };
  });
  const mouthM = mat('#3a1416', { roughness: 0.5 });
  const mouth = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 10), mouthM); mouth.scale.set(1.1, 0.18, 0.4); mouth.position.set(0, -HR * 0.55, HR * 0.86); head.add(mouth);
  // Haare / Bart
  const hairG = new THREE.Group(); head.add(hairG);
  if (o.frisur !== 'glatze') {
    const cap1 = new THREE.Mesh(new THREE.SphereGeometry(HR * 1.05, 24, 14, 0, Math.PI * 2, 0, Math.PI * (o.frisur === 'lang' || o.frisur === 'zopf' ? 0.52 : 0.42)), hairM);
    cap1.rotation.x = -0.25; cap1.position.set(0, 0.012, -0.012); cap1.scale.set(0.97, 1.08, 1.02); cap1.castShadow = true; hairG.add(cap1);
    if (o.frisur === 'lang') { const back = cap(HR * 0.85, 0.22, hairM); back.scale.set(1.1, 1, 0.55); back.position.set(0, -0.16, -0.08); hairG.add(back); }
    if (o.frisur === 'zopf') { const z = cap(0.045, 0.28, hairM); z.position.set(0, -0.14, -0.2); z.rotation.x = 0.3; hairG.add(z); }
    if (o.frisur === 'locken') { const r = rng(seed + 3); for (let i = 0; i < 16; i++) { const b = sph(0.05, hairM, 8, 6); const a = r() * Math.PI * 2, e = r() * 0.9; b.position.set(Math.cos(a) * HR * 0.9 * Math.cos(e), HR * 0.5 + Math.sin(e) * HR * 0.5, Math.sin(a) * HR * 0.8 - 0.03); hairG.add(b); } }
  }
  if (o.bart) { const bm = mat(typeof o.bart === 'string' ? o.bart : o.haare, { roughness: 1 }); const beard = new THREE.Mesh(new THREE.SphereGeometry(HR * 0.84, 24, 12, Math.PI * 0.15, Math.PI * 1.7, Math.PI * 0.66, Math.PI * 0.3), bm); beard.rotation.y = Math.PI; beard.position.set(0, -0.03, 0.02); head.add(beard); }
  if (o.brille) { const fm = mat('#111', { metalness: 0.6, roughness: 0.3 }); eyes.forEach((e) => { const r = new THREE.Mesh(new THREE.TorusGeometry(ER * 1.25, 0.006, 6, 20), fm); r.position.copy(e.g.position); r.position.z += 0.022; head.add(r); }); }
  // Kopfbedeckung
  let headLamp = null, lampLens = null, lampCone = null;
  const helmC = o.helmFarbe || '#d8d4c8';
  if (o.kopf === 'helm') {
    const hm = mat(helmC, { roughness: 0.6, metalness: 0.0 }); hm.color.multiplyScalar(0.82); if (dirt) { hm.map = dirtTex(); }
    const shell = new THREE.Mesh(new THREE.SphereGeometry(HR * 1.15, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.5), hm); shell.position.y = 0.04; shell.scale.set(1, 0.95, 1.08); shell.castShadow = true; head.add(shell);
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(HR * 1.32, HR * 1.32, 0.015, 26), hm); brim.position.y = 0.04; brim.scale.z = 1.12; head.add(brim);
    
    if (o.lampe) {
      const lamp = new THREE.Group(); lamp.position.set(0, 0.1, HR * 1.12); head.add(lamp);
      const body2 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.05, 14), mat('#2a2a2a', { metalness: 0.6, roughness: 0.4 })); body2.rotation.x = Math.PI / 2; lamp.add(body2);
      lampLens = new THREE.Mesh(new THREE.CircleGeometry(0.028, 14), new THREE.MeshStandardMaterial({ color: 0x222222, emissive: 0xfff0c8, emissiveIntensity: 0 })); lampLens.position.z = 0.026; lamp.add(lampLens);
      headLamp = new THREE.SpotLight(0xfff0d0, 0, 18, 0.42, 0.55, 1.4); headLamp.position.z = 0.03; lamp.add(headLamp);
      const tgt = new THREE.Object3D(); tgt.position.set(0, -0.4, 3); lamp.add(tgt); headLamp.target = tgt;
      lampCone = makeBeamCone(4, 0.8, 0xfff0d0); lampCone.position.z = 0.03; lampCone.rotation.x = -Math.PI / 2 + 0.13; lamp.add(lampCone); lampCone.visible = false;
    }
  } else if (o.kopf === 'muetze') {
    const bm = mat(o.helmFarbe || '#5a5d62', { roughness: 0.95 });
    const b = new THREE.Mesh(new THREE.SphereGeometry(HR * 1.08, 22, 14, 0, Math.PI * 2, 0, Math.PI * 0.5), bm); b.position.y = 0.03; b.scale.set(1, 1.2, 1.04); head.add(b);
    const cuff = new THREE.Mesh(new THREE.TorusGeometry(HR * 1.04, 0.03, 8, 24), bm); cuff.rotation.x = Math.PI / 2; cuff.position.y = 0.05; head.add(cuff);
  } else if (o.kopf === 'kappe') {
    const km = mat(helmC, { roughness: 0.7 });
    const b = new THREE.Mesh(new THREE.SphereGeometry(HR * 1.07, 22, 12, 0, Math.PI * 2, 0, Math.PI * 0.45), km); b.position.y = 0.04; head.add(b);
    const visor = new THREE.Mesh(new THREE.CylinderGeometry(HR * 0.8, HR * 0.8, 0.012, 20, 1, false, -Math.PI / 2, Math.PI), km); visor.position.set(0, 0.06, HR * 0.75); visor.scale.z = 0.8; head.add(visor);
  } else if (o.kopf === 'hut') {
    const km = mat(helmC, { roughness: 0.8 });
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(HR * 0.85, HR * 0.95, 0.16, 20), km); crown.position.y = HR * 0.95; head.add(crown);
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(HR * 1.6, HR * 1.6, 0.012, 24), km); brim.position.y = HR * 0.6; head.add(brim);
  }

  // ---- Arme
  const mkArm = (side) => {
    const sh = new THREE.Group(); sh.position.set(side * 0.29, 0.58, 0); torso.add(sh);
    const shoulder = sph(0.085, topM, 12, 10); sh.add(shoulder);
    const up = cap(0.07, 0.24, topM); up.position.y = -0.16; sh.add(up);
    const el = new THREE.Group(); el.position.y = -0.33; sh.add(el);
    const lo = cap(0.062, 0.22, topM); lo.position.y = -0.14; el.add(lo);
    const handG = new THREE.Group(); handG.position.y = -0.31; el.add(handG);
    const hand = sph(0.058, o.outfit === 'taucher' || o.outfit === 'feuerwehr' ? topM : skinM, 12, 10); hand.scale.set(0.85, 1.05, 0.7); handG.add(hand);
    const thumb = cap(0.02, 0.04, hand.material, 6); thumb.position.set(-side * 0.045, 0.01, 0.03); thumb.rotation.z = side * 0.6; handG.add(thumb);
    sh.rotation.z = side * 0.1;
    return { sh, el, hand: handG };
  };
  const armL = mkArm(-1), armR = mkArm(1);
  // ---- Beine
  const mkLeg = (side) => {
    const th = new THREE.Group(); th.position.set(side * 0.12, -0.04, 0); hip.add(th);
    const up = cap(0.088, 0.3, pantsM); up.position.y = -0.2; th.add(up);
    const kn = new THREE.Group(); kn.position.y = -0.42; th.add(kn);
    const lo = cap(0.078, 0.3, pantsM); lo.position.y = -0.19; kn.add(lo);
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.11, 0.27), shoeM); boot.geometry.translate(0, 0, 0.04); boot.position.y = -0.42; boot.castShadow = true; kn.add(boot);
    const toe = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), shoeM); toe.scale.set(1, 0.8, 1); toe.position.set(0, -0.475, 0.16); toe.rotation.x = 0; kn.add(toe);
    return { th, kn };
  };
  const legL = mkLeg(-1), legR = mkLeg(1);

  const F = { root, body, hip, torso, neck, head, eyes, mouth, armL, armR, legL, legR, headLamp, lampLens, lampCone, spec: o, S, seed };

  // ---------------------------------------------------- Ausdruck (Augen, Brauen, Mund)
  // ausdruck: neutral | angst | schock | freude | trauer | entschlossen | erschoepft | wut
  F.face = (t, ausdruck = 'neutral', talk = 0, lookAt = null) => {
    const ex = { neutral: [0, 0, 0.2, 0], angst: [0.35, 0.25, 0.35, 0.15], schock: [0.6, 0.35, 0.0, 0.9], freude: [0.15, -0.1, 0.25, 0.25],
      trauer: [0.3, 0.45, 0.45, 0.0], entschlossen: [-0.3, -0.15, 0.3, 0.0], erschoepft: [0, 0.2, 0.62, 0.05], wut: [-0.45, -0.35, 0.25, 0.1] }[ausdruck] || [0, 0, 0.2, 0];
    const [browUp, browTilt, lidBase, mouthOpen] = ex;
    // Blinzeln: alle ~3.5 s, deterministisch je Figur
    const ph = (t + seed * 1.37) % 3.7; const blink = ph < 0.12 ? Math.sin(ph / 0.12 * Math.PI) : 0;
    const lidClose = clamp01(lidBase + blink * (1 - lidBase));
    eyes.forEach((e) => {
      e.lid.rotation.x = lerp(-1.75, 1.25, lidClose) + (ausdruck === 'schock' ? -0.25 : 0);
      e.brow.position.y = ER * 1.45 + browUp * 0.025;
      e.brow.rotation.z = e.side * browTilt * -0.45;
      // Blick: kleine Sakkaden + Ziel
      let lx = 0.12 * noise2(t * 0.6 + seed, 1.7), ly = 0.08 * noise2(t * 0.5 + seed, 5.1);
      if (lookAt) { lx += lookAt.x; ly += lookAt.y; }
      e.look.rotation.set(-ly, lx, 0);
      const pupS = ausdruck === 'schock' || ausdruck === 'angst' ? 0.7 : 1; e.pup.scale.setScalar(pupS);
    });
    const tk = talk > 0 ? talk * clamp01(0.5 + 0.6 * noise2(t * 9, seed) + 0.3 * Math.sin(t * 17)) : 0;
    const open = Math.max(mouthOpen, tk);
    mouth.scale.set(ausdruck === 'freude' ? 1.5 : ausdruck === 'schock' ? 0.8 : 1.1, 0.16 + open * 0.75, 0.4);
    mouth.position.y = -HR * 0.55 - open * 0.012;
    mouth.rotation.z = 0;
  };

  // ---------------------------------------------------- Posen & Bewegungen
  const reset = () => {
    for (const a of [armL, armR]) { a.sh.rotation.set(0, 0, a === armL ? -0.1 : 0.1); a.el.rotation.set(-0.12, 0, 0); a.hand.rotation.set(0, 0, 0); }
    for (const l of [legL, legR]) { l.th.rotation.set(0, 0, 0); l.kn.rotation.set(0, 0, 0); }
    hip.position.set(0, 0.92, 0); hip.rotation.set(0, 0, 0); torso.rotation.set(0, 0, 0); torso.position.set(0, 0, 0); neck.rotation.set(0, 0, 0); head.rotation.set(0, 0, 0);
    body.rotation.set(0, 0, 0); body.position.set(0, 0, 0);
  };
  const breathe = (t, k = 1) => { torso.rotation.x = 0.02 + Math.sin(t * 1.6 + seed) * 0.012 * k; chest.scale.y = 1 + Math.sin(t * 1.6 + seed) * 0.015 * k; };
  const gait = (t, speed, amp, run) => {
    const p = t * (run ? 9.5 : 5.4) * speed + seed;
    const s = Math.sin(p) * (run ? 0.85 : 0.5) * amp;
    legL.th.rotation.x = s; legR.th.rotation.x = -s;
    legL.kn.rotation.x = Math.max(0, -Math.sin(p - 0.9)) * (run ? 1.4 : 0.75) * amp; legR.kn.rotation.x = Math.max(0, Math.sin(p - 0.9)) * (run ? 1.4 : 0.75) * amp;
    armL.sh.rotation.x = -s * (run ? 1.1 : 0.7); armR.sh.rotation.x = s * (run ? 1.1 : 0.7);
    armL.el.rotation.x = run ? -1.3 : -0.3; armR.el.rotation.x = run ? -1.3 : -0.3;
    hip.position.y = 0.92 + Math.abs(Math.cos(p)) * (run ? 0.07 : 0.03) * amp - (run ? 0.04 : 0);
    torso.rotation.x = run ? 0.25 : 0.04; torso.rotation.y = Math.sin(p) * 0.08 * amp;
    neck.rotation.x = run ? -0.15 : 0;
  };

  // aktion: Name, l: lokale Zeit in der Einstellung, d: Dauer, t: globale Zeit
  F.pose = (aktion, t, l = 0, d = 3, opt = {}) => {
    reset();
    const k = clamp01(l / Math.max(0.01, d));
    let ausdruck = opt.ausdruck || 'neutral', talk = 0;
    switch (aktion) {
      case 'laufen': gait(t, opt.tempo ?? 1, 1, false); break;
      case 'rennen': gait(t, opt.tempo ?? 1, 1, true); ausdruck = opt.ausdruck || 'angst'; break;
      case 'schleichen': gait(t, 0.55, 0.6, false); hip.position.y -= 0.08; torso.rotation.x = 0.3; break;
      case 'taumeln': gait(t, 0.5, 0.7, false); torso.rotation.z = Math.sin(t * 2.1) * 0.12; ausdruck = opt.ausdruck || 'erschoepft'; break;
      case 'reden': breathe(t); talk = 1;
        armR.sh.rotation.x = -0.5 - 0.25 * Math.sin(t * 2.3); armR.el.rotation.x = -0.9; armR.sh.rotation.z = 0.25;
        armL.sh.rotation.x = -0.2 - 0.15 * Math.sin(t * 1.7 + 1); armL.el.rotation.x = -0.6;
        head.rotation.y = 0.12 * noise2(t * 0.8, seed); head.rotation.x = 0.05 * Math.sin(t * 3.1); break;
      case 'rufen': breathe(t, 2); talk = 1; ausdruck = opt.ausdruck || 'angst';
        armR.sh.rotation.set(-2.2, 0, 0.3); armR.el.rotation.x = -1.6; armL.sh.rotation.set(-2.2, 0, -0.3); armL.el.rotation.x = -1.6; neck.rotation.x = -0.25; break;
      case 'zeigen': breathe(t); armR.sh.rotation.x = -1.45 * smooth(0, 0.4, l); armR.el.rotation.x = -0.05; talk = opt.talk ?? 0.6; break;
      case 'umsehen': breathe(t); head.rotation.y = 0.8 * Math.sin(l * 1.4); neck.rotation.y = 0.2 * Math.sin(l * 1.4); torso.rotation.y = 0.2 * Math.sin(l * 1.4 - 0.4); ausdruck = opt.ausdruck || 'angst'; break;
      case 'erschrecken': {
        const j = smooth(0, 0.18, l); const back = Math.sin(clamp01(l / 0.5) * Math.PI) * 0.12;
        body.position.z = -back; body.position.y = Math.sin(clamp01(l / 0.35) * Math.PI) * 0.06;
        armL.sh.rotation.set(-1.4 * j, 0, -0.6 * j); armR.sh.rotation.set(-1.4 * j, 0, 0.6 * j); armL.el.rotation.x = armR.el.rotation.x = -1.4 * j;
        torso.rotation.x = -0.2 * j; neck.rotation.x = -0.15 * j; ausdruck = 'schock'; break; }
      case 'fallen': {
        const f = smooth(0, 0.7, l); body.rotation.x = -1.5 * f; body.position.y = 0.15 * f; body.position.z = -0.6 * f;
        armL.sh.rotation.x = armR.sh.rotation.x = -2.5 * (1 - f) - 0.5; legL.th.rotation.x = 0.6 * f; ausdruck = 'schock'; break; }
      case 'liegen': body.rotation.x = -1.5; body.position.y = 0.16; body.position.z = -0.6; armL.sh.rotation.set(-0.3, 0, -0.5); armR.sh.rotation.set(-0.2, 0, 0.6);
        legR.th.rotation.x = 0.2; legR.kn.rotation.x = 0.3; breathe(t, 0.6); ausdruck = opt.ausdruck || 'erschoepft'; break;
      case 'sitzen': breathe(t); hip.position.y = 0.5; legL.th.rotation.x = legR.th.rotation.x = -1.5; legL.kn.rotation.x = legR.kn.rotation.x = 1.45;
        armL.sh.rotation.x = armR.sh.rotation.x = -0.5; armL.el.rotation.x = armR.el.rotation.x = -0.9; break;
      case 'hocken': breathe(t, 1.4); hip.position.y = 0.42; legL.th.rotation.x = legR.th.rotation.x = -2.1; legL.kn.rotation.x = legR.kn.rotation.x = 2.3;
        torso.rotation.x = 0.45; armL.sh.rotation.set(-0.9, 0, 0.4); armR.sh.rotation.set(-0.9, 0, -0.4); armL.el.rotation.x = armR.el.rotation.x = -1.3; neck.rotation.x = 0.3;
        ausdruck = opt.ausdruck || 'erschoepft'; break;
      case 'kauern': hip.position.y = 0.36; legL.th.rotation.x = legR.th.rotation.x = -2.3; legL.kn.rotation.x = legR.kn.rotation.x = 2.5; torso.rotation.x = 0.75;
        armL.sh.rotation.set(-2.6, 0, 0.5); armR.sh.rotation.set(-2.6, 0, -0.5); armL.el.rotation.x = armR.el.rotation.x = -2.0; torso.position.x = Math.sin(t * 30) * 0.004; ausdruck = 'angst'; break;
      case 'knien': breathe(t); hip.position.y = 0.52; legL.th.rotation.x = -1.5; legL.kn.rotation.x = 1.5; legR.th.rotation.x = 0.1; legR.kn.rotation.x = 1.55;
        armL.sh.rotation.x = armR.sh.rotation.x = -0.6; armL.el.rotation.x = armR.el.rotation.x = -0.6; break;
      case 'kriechen': { const p = t * 4 + seed; hip.position.y = 0.45; body.rotation.x = 0; torso.rotation.x = 1.25;
        armL.sh.rotation.x = -1.4 + Math.sin(p) * 0.35; armR.sh.rotation.x = -1.4 - Math.sin(p) * 0.35; armL.el.rotation.x = armR.el.rotation.x = -0.2;
        legL.th.rotation.x = -1.2 + Math.sin(p) * 0.3; legR.th.rotation.x = -1.2 - Math.sin(p) * 0.3; legL.kn.rotation.x = legR.kn.rotation.x = 1.6; neck.rotation.x = -0.9; break; }
      case 'klopfen': { breathe(t); const hit = Math.pow(Math.abs(Math.sin(l * Math.PI * (opt.rate ?? 1.4))), 4);
        armR.sh.rotation.set(-1.9 + hit * 0.7, 0, 0.2); armR.el.rotation.x = -0.9 - hit * 0.5; torso.rotation.y = -0.15; ausdruck = opt.ausdruck || 'entschlossen'; break; }
      case 'graben': { const p = l * 3.2; torso.rotation.x = 0.5 + Math.sin(p) * 0.25; armL.sh.rotation.x = armR.sh.rotation.x = -1.2 + Math.sin(p) * 0.6;
        armL.el.rotation.x = armR.el.rotation.x = -0.6; hip.position.y = 0.85; legL.th.rotation.x = -0.4; legL.kn.rotation.x = 0.6; ausdruck = opt.ausdruck || 'entschlossen'; break; }
      case 'tragen': gait(t, 0.7, 0.7, false); armL.sh.rotation.x = armR.sh.rotation.x = -1.2; armL.el.rotation.x = armR.el.rotation.x = -0.7; armL.sh.rotation.z = 0.3; armR.sh.rotation.z = -0.3; break;
      case 'winken': breathe(t); armR.sh.rotation.set(-2.8, 0, 0.3); armR.el.rotation.set(0, 0, 0.5 * Math.sin(t * 9)); talk = 0.4; ausdruck = opt.ausdruck || 'freude'; break;
      case 'jubeln': { const b = Math.abs(Math.sin(t * 4)); armL.sh.rotation.set(-2.9, 0, -0.35); armR.sh.rotation.set(-2.9, 0, 0.35); armL.el.rotation.x = armR.el.rotation.x = -0.3;
        body.position.y = b * 0.08; talk = 0.8; ausdruck = 'freude'; break; }
      case 'umarmen': breathe(t); armL.sh.rotation.set(-1.4, 0.5, 0.2); armR.sh.rotation.set(-1.4, -0.5, -0.2); armL.el.rotation.set(0, -1.2, 0); armR.el.rotation.set(0, 1.2, 0); ausdruck = opt.ausdruck || 'freude'; break;
      case 'zittern': breathe(t, 2.5); armL.sh.rotation.set(-1.1, 0, 0.7); armR.sh.rotation.set(-1.1, 0, -0.7); armL.el.rotation.x = armR.el.rotation.x = -1.8;
        torso.position.x = Math.sin(t * 40) * 0.006; torso.rotation.x = 0.15; ausdruck = opt.ausdruck || 'angst'; break;
      case 'telefonieren': breathe(t); armR.sh.rotation.set(-0.4, 0, 0.9); armR.el.rotation.set(-2.4, 0, 0); talk = 0.8; head.rotation.z = 0.12; break;
      case 'schieben': gait(t, 0.45, 0.5, false); torso.rotation.x = 0.45; armL.sh.rotation.x = armR.sh.rotation.x = -1.5; armL.el.rotation.x = armR.el.rotation.x = -0.25; ausdruck = opt.ausdruck || 'entschlossen'; break;
      case 'schwimmen': { const p = t * 3; body.rotation.x = -1.3; hip.position.y = 0.3; armL.sh.rotation.x = -2.5 + Math.sin(p) * 1.2; armR.sh.rotation.x = -2.5 - Math.sin(p) * 1.2;
        legL.th.rotation.x = Math.sin(p * 2) * 0.3; legR.th.rotation.x = -Math.sin(p * 2) * 0.3; ausdruck = opt.ausdruck || 'angst'; break; }
      case 'nachdenken': breathe(t); armR.sh.rotation.set(-1.0, 0, 0.5); armR.el.rotation.x = -2.2; armL.sh.rotation.set(-0.5, 0, -0.3); armL.el.rotation.set(-1.4, 0, 0); head.rotation.z = 0.1; head.rotation.x = 0.1; break;
      case 'aufschauen': breathe(t); neck.rotation.x = -0.45 * smooth(0, 0.6, l); head.rotation.x = -0.2 * smooth(0, 0.6, l); break;
      case 'warten': default: breathe(t); head.rotation.y = 0.15 * noise2(t * 0.3, seed); break;
    }
    if (opt.aufrecht) { neck.rotation.x = -(torso.rotation.x + body.rotation.x) * 0.9; head.rotation.x = -0.05; }
    if (opt.blick === 'oben') { neck.rotation.x -= 0.4; }
    if (opt.blick === 'unten') { neck.rotation.x += 0.35; }
    F.face(t, ausdruck, opt.talk ?? talk, opt.lookCam ? { x: 0, y: 0 } : null);
    F.lamp(opt.lampe ?? (o.lampe ? 1 : 0));
    return k;
  };
  // Lichtkegel abschwächen, wenn die Kamera in den Kegel schaut (sonst Überstrahlung)
  F.lampFacing = (camPos) => {
    if (!lampCone || !lampCone.visible) return;
    const p = lampCone.getWorldPosition(new THREE.Vector3()); const ax = new THREE.Vector3(0, -1, 0).applyQuaternion(lampCone.getWorldQuaternion(new THREE.Quaternion()));
    const toCam = camPos.clone().sub(p).normalize(); const d = Math.max(0, ax.dot(toCam));
    lampCone.material.uniforms.uInt.value *= 1 - Math.pow(d, 1.5);
    lampLens.material.emissiveIntensity *= 0.35 + 0.65 * (1 - d);
  };
  F.lamp = (on) => {
    if (!headLamp) return;
    headLamp.intensity = 24 * on; lampLens.material.emissiveIntensity = 2.2 * on;
    lampCone.visible = on > 0.05; lampCone.material.uniforms.uInt.value = 0.35 * on;
  };
  return F;
}

// Volumetrischer Lichtkegel (additiv, weiche Kanten) – für Helmlampen, Scheinwerfer
export function makeBeamCone(L = 5, R = 1, color = 0xffffff) {
  const g = new THREE.ConeGeometry(R, L, 32, 1, true); g.translate(0, -L / 2, 0);
  const m = new THREE.ShaderMaterial({
    uniforms: { uCol: { value: new THREE.Color(color) }, uInt: { value: 0.5 }, uL: { value: L } },
    vertexShader: 'varying vec3 vP; varying vec3 vN; varying vec3 vV; varying float vD; void main(){ vP=position; vN=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.0); vV=normalize(-mv.xyz); vD=length(mv.xyz); gl_Position=projectionMatrix*mv; }',
    fragmentShader: 'uniform vec3 uCol; uniform float uInt, uL; varying vec3 vP; varying vec3 vN; varying vec3 vV; varying float vD; void main(){ float along = clamp(-vP.y/uL,0.0,1.0); float edge = pow(abs(dot(vN, vV)), 1.6); float a = edge * pow(1.0-along, 1.8) * smoothstep(0.08, 0.35, along) * smoothstep(0.6, 3.0, vD) * uInt; gl_FragColor = vec4(uCol*a, a); }',
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(g, m); mesh.renderOrder = 5; return mesh;
}
