// Figuren: Jonas (stilisiert, Gesicht nur angedeutet), sein nasser Doppelgänger, die Ertrunkenen
import * as THREE from 'three';
import { PALETTE, makeLightCone } from './world.js';
import { makeFogTexture, rng } from './lib.js';

const cap = (r, l, mat) => { const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, l, 6, 14), mat); m.castShadow = true; m.receiveShadow = true; return m; };

// Gelenk-Hierarchie: hip -> torso -> neck/head, shoulders -> upper -> lower
export function createJonas({ wet = false } = {}) {
  const jacketMat = new THREE.MeshStandardMaterial({ color: wet ? 0x0f2a1d : PALETTE.jacket, roughness: wet ? 0.15 : 0.55, metalness: wet ? 0.25 : 0.05 });
  const trouserMat = new THREE.MeshStandardMaterial({ color: wet ? 0x15171b : 0x24272d, roughness: wet ? 0.25 : 0.85 });
  const bootMat = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.4 });
  const skinMat = new THREE.MeshStandardMaterial({ color: wet ? 0x8f9a9a : 0xc9a68c, roughness: wet ? 0.3 : 0.65 });
  const beanieMat = new THREE.MeshStandardMaterial({ color: wet ? 0x3c3e40 : PALETTE.beanie, roughness: wet ? 0.35 : 0.95 });
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x0b0b0b, roughness: 0.2 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x2b2d30, roughness: 0.35, metalness: 0.8 });

  const root = new THREE.Group(); root.name = wet ? 'jonasWet' : 'jonas';
  const hip = new THREE.Group(); hip.position.y = 0.95; root.add(hip);
  const torso = new THREE.Group(); hip.add(torso);
  const body = cap(0.25, 0.5, jacketMat); body.scale.set(1.18, 1, 0.82); body.position.y = 0.36; torso.add(body);
  // Jackensaum + Kragen + Reißverschluss
  const hem = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.33, 0.18, 18), jacketMat); hem.scale.z = 0.8; hem.position.y = 0.02; hem.castShadow = true; torso.add(hem);
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.06, 8, 18), jacketMat); collar.rotation.x = Math.PI / 2; collar.position.y = 0.76; torso.add(collar);
  const zip = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.62, 0.01), metal); zip.position.set(0, 0.4, 0.215); torso.add(zip);
  const pocketL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.02), jacketMat); pocketL.position.set(-0.15, 0.18, 0.2); torso.add(pocketL);
  const pocketR = pocketL.clone(); pocketR.position.x = 0.15; torso.add(pocketR);

  const neck = new THREE.Group(); neck.position.y = 0.78; torso.add(neck);
  const head = new THREE.Group(); head.position.y = 0.16; neck.add(head);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.15, 24, 18), skinMat); skull.scale.set(0.95, 1.12, 1); skull.castShadow = true; head.add(skull);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.06, 8), skinMat); nose.rotation.x = Math.PI / 2; nose.position.set(0, -0.01, 0.15); head.add(nose);
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 6), eyeMat); eyeL.position.set(-0.05, 0.025, 0.135); head.add(eyeL);
  const eyeR = eyeL.clone(); eyeR.position.x = 0.05; head.add(eyeR);
  const brow = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.015, 0.02), new THREE.MeshStandardMaterial({ color: 0x3a2a20 })); brow.position.set(0, 0.06, 0.135); head.add(brow);
  const beard = new THREE.Mesh(new THREE.SphereGeometry(0.135, 16, 10, 0, Math.PI * 2, Math.PI * 0.55, Math.PI * 0.4), new THREE.MeshStandardMaterial({ color: 0x3b2c22, roughness: 1 }));
  beard.position.set(0, 0.0, 0.02); head.add(beard);
  // Wollmütze mit Umschlag
  const beanie = new THREE.Mesh(new THREE.SphereGeometry(0.162, 22, 14, 0, Math.PI * 2, 0, Math.PI * 0.52), beanieMat); beanie.position.y = 0.035; beanie.scale.set(1, 1.15, 1.04); beanie.castShadow = true; head.add(beanie);
  const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.155, 0.035, 10, 26), beanieMat); cuff.rotation.x = Math.PI / 2; cuff.position.y = 0.05; cuff.scale.set(1, 1.04, 1); head.add(cuff);

  const mkArm = (side) => {
    const sh = new THREE.Group(); sh.position.set(side * 0.33, 0.66, 0); torso.add(sh);
    const up = cap(0.075, 0.3, jacketMat); up.position.y = -0.18; sh.add(up);
    const el = new THREE.Group(); el.position.y = -0.38; sh.add(el);
    const lo = cap(0.068, 0.28, jacketMat); lo.position.y = -0.16; el.add(lo);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), skinMat); hand.scale.set(0.8, 1.1, 0.9); hand.position.y = -0.36; el.add(hand);
    sh.rotation.z = side * 0.08;
    return { sh, el, hand };
  };
  const armL = mkArm(-1), armR = mkArm(1);
  // Taschenlampe in der rechten Hand
  const torch = new THREE.Group();
  const tb = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.26, 12), metal); tb.rotation.x = Math.PI / 2; torch.add(tb);
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.034, 14), new THREE.MeshStandardMaterial({ emissive: PALETTE.lampHot, emissiveIntensity: 0, color: 0x111111 }));
  lens.position.z = 0.131; torch.add(lens);
  torch.position.set(0, -0.38, 0.06); armR.el.add(torch);
  const torchLight = new THREE.SpotLight(0xffd7a8, 0, 25, 0.38, 0.5, 1.5); torchLight.position.set(0, 0, 0.14); torch.add(torchLight);
  const torchTarget = new THREE.Object3D(); torchTarget.position.set(0, 0, 3); torch.add(torchTarget); torchLight.target = torchTarget;

  const mkLeg = (side) => {
    const th = new THREE.Group(); th.position.set(side * 0.13, 0, 0); hip.add(th);
    const up = cap(0.095, 0.34, trouserMat); up.position.y = -0.22; th.add(up);
    const kn = new THREE.Group(); kn.position.y = -0.45; th.add(kn);
    const lo = cap(0.085, 0.32, trouserMat); lo.position.y = -0.2; kn.add(lo);
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.13, 0.3), bootMat); boot.position.set(0, -0.44, 0.05); boot.castShadow = true; kn.add(boot);
    return { th, kn };
  };
  const legL = mkLeg(-1), legR = mkLeg(1);

  // Tropfen für den nassen Doppelgänger
  let drips = null;
  if (wet) {
    drips = new THREE.Group();
    const dm = new THREE.MeshStandardMaterial({ color: 0x9fc4c4, roughness: 0, metalness: 0.5, transparent: true, opacity: 0.8 });
    const r = rng(77);
    for (let i = 0; i < 26; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 4), dm); d.scale.y = 2; d.userData = { x: (r() - 0.5) * 0.6, z: (r() - 0.5) * 0.35, y0: 0.6 + r() * 0.9, ph: r() }; drips.add(d); }
    root.add(drips);
  }

  // Volumetrischer Kegel der Taschenlampe (ab Teil 2)
  const torchCone = makeLightCone(6, 1.25, 0.32, 0xffd9b0); torchCone.rotation.y = -Math.PI / 2; torchCone.position.z = 0.13; torch.add(torchCone);
  torchCone.material.uniforms.uInt.value = 0; torchCone.visible = false;
  const J = { root, hip, torso, neck, head, armL, armR, legL, legR, torch, torchLight, lens, drips, torchCone };

  // Posen/Animation
  J.walk = (t, speed = 1, amp = 1) => {
    const p = t * 5.2 * speed;
    const s = Math.sin(p) * 0.5 * amp;
    legL.th.rotation.x = s; legR.th.rotation.x = -s;
    legL.kn.rotation.x = Math.max(0, -Math.sin(p - 0.8)) * 0.7 * amp; legR.kn.rotation.x = Math.max(0, Math.sin(p - 0.8)) * 0.7 * amp;
    armL.sh.rotation.x = -s * 0.7; armR.sh.rotation.x = s * 0.7;
    armL.el.rotation.x = -0.25; armR.el.rotation.x = -0.25;
    hip.position.y = 0.95 + Math.abs(Math.cos(p)) * 0.035 * amp;
    torso.rotation.y = Math.sin(p) * 0.06 * amp; torso.rotation.x = 0.05;
  };
  J.idle = (t) => {
    legL.th.rotation.x = legR.th.rotation.x = 0; legL.kn.rotation.x = legR.kn.rotation.x = 0;
    hip.position.y = 0.95; torso.rotation.set(0.02 + Math.sin(t * 1.4) * 0.012, 0, 0);
    armL.sh.rotation.x = 0.05; armR.sh.rotation.x = 0.05; armL.el.rotation.x = -0.15; armR.el.rotation.x = -0.15;
  };
  J.holdTorch = (on = 1, cone = 0) => { armR.sh.rotation.x = -0.9; armR.el.rotation.x = -0.5; torchLight.intensity = 60 * on; lens.material.emissiveIntensity = 8 * on;
    torchCone.visible = cone > 0; torchCone.material.uniforms.uInt.value = cone * on; };
  J.torchOff = () => { torchLight.intensity = 0; lens.material.emissiveIntensity = 0; torchCone.visible = false; };
  J.sit = () => {
    hip.position.y = 0.55; legL.th.rotation.x = legR.th.rotation.x = -1.5; legL.kn.rotation.x = legR.kn.rotation.x = 1.5;
  };
  J.sleepAtTable = (t) => {
    J.sit(); torso.rotation.x = 1.05; neck.rotation.x = 0.25; head.rotation.y = 0.6;
    armL.sh.rotation.set(-1.9, 0, -0.5); armL.el.rotation.x = -1.6; armR.sh.rotation.set(-1.7, 0, 0.6); armR.el.rotation.x = -1.7;
    torso.position.y = Math.sin(t * 1.2) * 0.008;
  };
  J.lookUp = (k) => { neck.rotation.x = -0.35 * k; };
  J.updateDrips = (t) => {
    if (!drips) return;
    drips.children.forEach((d) => { const u = d.userData; const f = (t * 0.9 + u.ph) % 1; d.position.set(u.x, u.y0 * (1 - f) , u.z); d.material.opacity = 0.8 * (1 - f); });
  };
  return J;
}

// Die Ertrunkenen: dunkle, nasse Silhouetten – nie ganz zu sehen
export function createDrowned(seed = 1) {
  const r = rng(seed);
  const mat = new THREE.MeshStandardMaterial({ color: 0x020506, roughness: 0.18, metalness: 0.3, transparent: true, opacity: 0.92 });
  const g = new THREE.Group(); g.name = 'drowned';
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.26, 1.0, 5, 10), mat);
  const p = body.geometry.attributes.position;
  for (let i = 0; i < p.count; i++) { const y = p.getY(i); const k = 1 + (r() - 0.5) * 0.18; p.setXYZ(i, p.getX(i) * k * (y < -0.2 ? 1.25 : 1), y, p.getZ(i) * k * 0.8); }
  body.geometry.computeVertexNormals(); body.position.y = 0.85; g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), mat); head.position.y = 1.72; head.scale.set(0.95, 1.15, 1); g.add(head);
  // nasse, hängende Haare/Fetzen
  for (let i = 0; i < 6; i++) { const s = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.45 + r() * 0.3, 4), mat); s.rotation.x = Math.PI; s.position.set((r() - 0.5) * 0.25, 1.55, (r() - 0.5) * 0.2); g.add(s); }
  const armL = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.8, 4, 8), mat); armL.position.set(-0.33, 1.05, 0); armL.rotation.z = 0.08; g.add(armL);
  const armR = armL.clone(); armR.position.x = 0.33; armR.rotation.z = -0.08; g.add(armR);
  g.userData.mat = mat;
  return g;
}

// Weicher Schatten-Umriss (Billboard) für Silhouetten hinter Milchglas/im Nebel
export function createShadowCard() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 512; const x = c.getContext('2d');
  x.filter = 'blur(10px)'; x.fillStyle = '#000';
  x.beginPath(); x.ellipse(128, 120, 46, 58, 0, 0, Math.PI * 2); x.fill();
  x.beginPath(); x.moveTo(40, 512); x.quadraticCurveTo(50, 220, 128, 180); x.quadraticCurveTo(206, 220, 216, 512); x.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(new THREE.PlaneGeometry(1, 2), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, opacity: 0 }));
}
