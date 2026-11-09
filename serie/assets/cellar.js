// Keller unter dem Wärterhaus (ab Teil 4): Gewölbe, Glühbirne, Regale, Kisten, Spiegel mit Reflexion
import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { PALETTE } from './world.js';
import { makeNoiseTexture, rng, noise2 } from './lib.js';

const std = (o) => new THREE.MeshStandardMaterial(o);

function makeStoneTexture(seed = 71) {
  const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d');
  const r = rng(seed); g.fillStyle = '#2a2826'; g.fillRect(0, 0, 512, 512);
  const rows = 9; const rh = 512 / rows;
  for (let y = 0; y < rows; y++) {
    let x = -r() * 60;
    while (x < 512) {
      const w = 60 + r() * 70; const l = 70 + r() * 50;
      g.fillStyle = `rgb(${l},${l * 0.95},${l * 0.88})`; g.fillRect(x + 3, y * rh + 3, w - 6, rh - 6);
      for (let k = 0; k < 40; k++) { g.fillStyle = `rgba(0,0,0,${r() * 0.15})`; g.fillRect(x + r() * w, y * rh + r() * rh, 3 + r() * 8, 3 + r() * 8); }
      x += w;
    }
  }
  // Salzränder / Feuchtigkeit
  for (let k = 0; k < 18; k++) { const gr = g.createRadialGradient(r() * 512, 512, 10, r() * 512, 512, 200 + r() * 150); gr.addColorStop(0, 'rgba(20,30,30,0.5)'); gr.addColorStop(1, 'rgba(20,30,30,0)'); g.fillStyle = gr; g.fillRect(0, 0, 512, 512); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t;
}

function makeSpeckleTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); const r = rng(5);
  g.fillStyle = '#000'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1800; i++) { g.fillStyle = `rgba(255,255,255,${r() * 0.5})`; g.fillRect(r() * 256, r() * 256, 1 + r() * 2, 1 + r() * 2); }
  const gr = g.createRadialGradient(128, 128, 60, 128, 128, 190); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(255,255,255,0.75)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

export function createCellar({ photoTex = null } = {}) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x030405); scene.fog = new THREE.FogExp2(0x0b0d0c, 0.09);
  const stone = makeStoneTexture(); stone.repeat.set(2, 1);
  const stoneM = std({ color: 0xb0a898, map: stone, roughness: 0.92 });
  const add = (m) => { m.receiveShadow = true; m.castShadow = true; scene.add(m); return m; };
  // Boden
  const floor = add(new THREE.Mesh(new THREE.PlaneGeometry(4, 5), std({ color: 0x6a645a, map: makeNoiseTexture({ seed: 72, base: '#444', var: 40, scaleX: 20, scaleY: 20 }), roughness: 0.85 })));
  floor.rotation.x = -Math.PI / 2; floor.castShadow = false;
  // Wände + Tonnengewölbe
  const wl = add(new THREE.Mesh(new THREE.PlaneGeometry(5, 1.6), stoneM)); wl.rotation.y = Math.PI / 2; wl.position.set(-2, 0.8, 0); wl.castShadow = false;
  const wr = add(new THREE.Mesh(new THREE.PlaneGeometry(5, 1.6), stoneM)); wr.rotation.y = -Math.PI / 2; wr.position.set(2, 0.8, 0); wr.castShadow = false;
  const vaultTex = stone.clone(); vaultTex.repeat.set(3, 2); vaultTex.needsUpdate = true;
  const vault = add(new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 5, 40, 1, true, -Math.PI / 2, Math.PI), std({ color: 0xa09888, map: vaultTex, roughness: 0.95, side: THREE.BackSide })));
  vault.rotation.x = -Math.PI / 2; vault.position.y = 1.6; vault.castShadow = false;
  const endM = stoneM.clone(); endM.map = stone.clone(); endM.map.repeat.set(2, 2); endM.map.needsUpdate = true;
  const wf = add(new THREE.Mesh(new THREE.PlaneGeometry(4, 3.6), endM)); wf.position.set(0, 1.8, -2.5); wf.castShadow = false;
  const wb = add(new THREE.Mesh(new THREE.PlaneGeometry(4, 3.6), endM)); wb.rotation.y = Math.PI; wb.position.set(0, 1.8, 2.5); wb.castShadow = false;
  // Treppe (links, steigt nach +z) + Kellertür oben (bläuliches Licht)
  const wood = makeNoiseTexture({ seed: 73, base: '#3d2f22', var: 25, scaleX: 3, scaleY: 40, streak: 16 });
  const woodM = std({ color: 0x6a523a, map: wood, roughness: 0.75 });
  const stepTops = [];
  for (let i = 0; i < 9; i++) { const st = add(new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.04, 0.26), woodM)); st.position.set(-1.55, 0.22 * (i + 1), 0.2 + i * 0.25); stepTops.push(st.position.clone()); }
  for (const x of [-1.93, -1.17]) { const s = add(new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.12, 2.6), woodM)); s.position.set(x, 1.05, 1.2); s.rotation.x = -Math.atan2(0.22, 0.25); }
  const doorway = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 1.0), new THREE.MeshBasicMaterial({ color: 0x24434c, fog: false })); doorway.position.set(-1.55, 2.4, 2.49); doorway.rotation.y = Math.PI; scene.add(doorway);
  const doorLight = new THREE.SpotLight(0x5f8fa0, 7, 7, 0.7, 0.8, 1.2); doorLight.position.set(-1.55, 2.5, 2.4); doorLight.target.position.set(-1.0, 0, 0.5); scene.add(doorLight, doorLight.target);
  // Glühbirne am Kabel
  const bulbPivot = new THREE.Group(); bulbPivot.position.set(0.1, 3.55, -0.3); scene.add(bulbPivot);
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.9, 6), std({ color: 0x111111 })); cord.position.y = -0.45; bulbPivot.add(cord);
  const socket = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.07, 12), std({ color: 0x2a2520, metalness: 0.5, roughness: 0.5 })); socket.position.y = -0.93; bulbPivot.add(socket);
  const bulbMat = std({ color: 0x222222, emissive: 0xffc27a, emissiveIntensity: 6, roughness: 0.2 });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 12), bulbMat); bulb.scale.y = 1.25; bulb.position.y = -1.0; bulbPivot.add(bulb);
  const bulbLight = new THREE.PointLight(0xffb066, 11, 10, 1.5); bulbLight.position.y = -1.0; bulbLight.castShadow = true; bulbLight.shadow.mapSize.set(512, 512); bulbLight.shadow.bias = -0.003; bulbLight.shadow.radius = 4; bulbPivot.add(bulbLight);
  // Werkbank an der Stirnwand + offene Kiste mit Fotos
  const bench = add(new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 0.7), woodM)); bench.position.set(0.3, 0.85, -2.1);
  for (const [x, z] of [[-0.5, -1.85], [1.1, -1.85], [-0.5, -2.35], [1.1, -2.35]]) { const l = add(new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.85, 0.07), woodM)); l.position.set(x, 0.425, z); }
  const crate = new THREE.Group(); crate.position.set(0.15, 0.89, -2.05); scene.add(crate);
  const crateM = std({ color: 0x8a7050, map: wood, roughness: 0.8 });
  for (const [w, h, d, x, y, z] of [[0.6, 0.02, 0.45, 0, 0.01, 0], [0.6, 0.22, 0.02, 0, 0.11, 0.215], [0.6, 0.22, 0.02, 0, 0.11, -0.215], [0.02, 0.22, 0.45, 0.29, 0.11, 0], [0.02, 0.22, 0.45, -0.29, 0.11, 0]]) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), crateM); p.position.set(x, y, z); p.castShadow = p.receiveShadow = true; crate.add(p);
  }
  const lid = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.02, 0.45), crateM); lid.position.set(0.0, 0.25, -0.36); lid.rotation.x = -1.2; crate.add(lid);
  // lose Fotos in der Kiste
  const photos = []; const r = rng(74);
  const sepia = (seed) => { const c = document.createElement('canvas'); c.width = 240; c.height = 200; const g = c.getContext('2d'); const rr = rng(seed);
    g.fillStyle = '#e8e0cc'; g.fillRect(0, 0, 240, 200); const gr = g.createLinearGradient(0, 0, 0, 170); gr.addColorStop(0, `rgb(${120 + rr() * 40},${105 + rr() * 30},${80})`); gr.addColorStop(1, `rgb(${60 + rr() * 30},${50},${40})`);
    g.fillStyle = gr; g.fillRect(12, 12, 216, 150); g.fillStyle = 'rgba(30,25,20,0.7)'; g.fillRect(60 + rr() * 100, 50 + rr() * 40, 20 + rr() * 40, 60 + rr() * 50);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
  for (let i = 0; i < 7; i++) { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.125), std({ map: sepia(i + 3), roughness: 0.6 })); p.rotation.x = -Math.PI / 2; p.rotation.z = (r() - 0.5) * 1.2; p.position.set((r() - 0.5) * 0.4, 0.03 + i * 0.004, (r() - 0.5) * 0.3); crate.add(p); photos.push(p); }
  // das Foto von 1953 (Spielobjekt): Vorder- und Rückseite
  const keyPhoto = new THREE.Group(); scene.add(keyPhoto);
  const kpFront = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.1455), std({ map: photoTex, roughness: 0.55, color: 0xffffff })); keyPhoto.add(kpFront);
  const kpBack = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.1455), std({ color: 0xd8cfb8, roughness: 0.9 })); kpBack.rotation.y = Math.PI; kpBack.position.z = -0.001; keyPhoto.add(kpBack);
  keyPhoto.position.set(0.12, 0.925, -1.98); keyPhoto.rotation.x = -Math.PI / 2;
  // Regale links (hinten) mit Gläsern, Seil, Boje, Laterne
  const shelfM = std({ color: 0x4a3828, map: wood, roughness: 0.7 });
  for (let k = 0; k < 3; k++) { const s = add(new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.04, 1.6), shelfM)); s.position.set(-1.78, 0.5 + k * 0.55, -1.3); }
  for (let i = 0; i < 9; i++) {
    const k = i % 3; const z = -2.0 + Math.floor(i / 3) * 0.5 + r() * 0.1;
    const jar = add(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.18, 14), std({ color: 0x6f7f5a, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.75 }))); jar.position.set(-1.75, 0.61 + k * 0.55, z);
  }
  const rope = add(new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.04, 8, 24), std({ color: 0x8a7a55, roughness: 1 }))); rope.rotation.x = Math.PI / 2; rope.position.set(-1.5, 0.05, -0.6);
  const buoy = add(new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), std({ color: 0xa5301f, roughness: 0.5 }))); buoy.position.set(0.9, 0.17, -1.6);
  const ring = add(new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.07, 12, 32), std({ color: 0xc8c2b0, roughness: 0.6 }))); ring.position.set(1.95, 1.25, -1.6); ring.rotation.y = Math.PI / 2;
  for (let q = 0; q < 4; q++) { const band = add(new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.072, 12, 6, 0.35), std({ color: 0xa5301f, roughness: 0.6 }))); band.position.copy(ring.position); band.rotation.set(0, Math.PI / 2, q * Math.PI / 2); }
  const lantern = add(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.25, 8), std({ color: 0x3a3a34, metalness: 0.7, roughness: 0.4 }))); lantern.position.set(-1.75, 1.78, -0.8);
  for (let i = 0; i < 3; i++) { const b = add(new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.35, 0.4), crateM)); b.position.set(1.5 - (i % 2) * 0.1, 0.175 + Math.floor(i / 2) * 0.35, 1.6 - i * 0.45); b.rotation.y = r() * 0.4; }
  const chain = add(new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.015, 6, 20), std({ color: 0x5a3a24, metalness: 0.6, roughness: 0.7 }))); chain.position.set(1.95, 1.75, -0.7); chain.rotation.y = Math.PI / 2;
  // Spiegel an der rechten Wand (echte Reflexion); Gestalten auf Ebene 1 sind NUR im Spiegel sichtbar
  const MIRROR = { x: 1.975, y: 1.45, z: 0.12, w: 0.85, h: 1.3 };
  const mirror = new Reflector(new THREE.PlaneGeometry(MIRROR.w, MIRROR.h), { textureWidth: 512, textureHeight: 1024, color: 0xb4c0c0, clipBias: 0.003 });
  mirror.position.set(MIRROR.x, MIRROR.y, MIRROR.z); mirror.rotation.y = -Math.PI / 2; scene.add(mirror);
  mirror.camera.layers.enable(1);
  const dirt = new THREE.Mesh(new THREE.PlaneGeometry(MIRROR.w, MIRROR.h), new THREE.MeshStandardMaterial({ color: 0x8a8576, alphaMap: makeSpeckleTexture(), transparent: true, opacity: 0.22, roughness: 1, depthWrite: false }));
  dirt.position.set(MIRROR.x - 0.004, MIRROR.y, MIRROR.z); dirt.rotation.y = -Math.PI / 2; scene.add(dirt);
  const frameM = std({ color: 0x3a2a1a, roughness: 0.5, metalness: 0.2 });
  for (const [w, h, dy, dz] of [[0.06, MIRROR.h + 0.12, 0, MIRROR.w / 2 + 0.03], [0.06, MIRROR.h + 0.12, 0, -MIRROR.w / 2 - 0.03], [0.06, 0.06, MIRROR.h / 2 + 0.03, 0], [0.06, 0.06, -MIRROR.h / 2 - 0.03, 0]]) {
    const f = add(new THREE.Mesh(new THREE.BoxGeometry(0.04, h, dz === 0 ? MIRROR.w + 0.12 : w), frameM)); f.position.set(MIRROR.x - 0.01, MIRROR.y + dy, MIRROR.z + dz);
  }
  const hemi = new THREE.HemisphereLight(0x4a6670, 0x0d0a08, 0.6); scene.add(hemi);
  // Streulicht der Birne von der hellen Wand am Spiegel (macht Gesicht + Gestalt im Spiegel lesbar)
  const mirrorFill = new THREE.PointLight(0xffb070, 0, 3.2, 1.4); mirrorFill.position.set(1.65, 1.95, -0.05); scene.add(mirrorFill);

  return { scene, bulbPivot, bulb, bulbLight, bulbMat, crate, keyPhoto, mirror, MIRROR, stepTops, doorLight, hemi, photos, mirrorFill,
    update(t, { bulb: b = 1, swing = 0.12, fill = 0 } = {}) {
      bulbPivot.rotation.z = swing * Math.sin(t * 1.9); bulbPivot.rotation.x = swing * 0.5 * Math.sin(t * 1.3 + 1);
      const f = (0.93 + 0.07 * noise2(t * 11, 6)) * b;
      bulbLight.intensity = 11 * f; bulbMat.emissiveIntensity = 0.3 + 6 * f; mirrorFill.intensity = 2.2 * fill * f;
    } };
}
