// DER LEUCHTTURM VON NEBELSAND – Außenwelt (Insel, Turm, Haus, Steg, Boot, Wrack, Meer, Nebel, Lichtkegel)
// Einmal gebaut, in allen 10 Teilen wiederverwendet. Maße in Metern. Meer = y 0.
import * as THREE from 'three';
import { rng, fbm, noise2, clamp01, smooth, makeFogTexture, makeNoiseTexture } from './lib.js';

export const PALETTE = {
  night: 0x06121a,     // Nachtblau
  fog: 0x163a42,       // kaltes Blaugrün
  fogLit: 0x9fc4c4,
  sea: 0x06222a,
  lamp: 0xffa04a,      // warmes Orange (nur Lampenlicht)
  lampHot: 0xffd29a,
  moon: 0x5f8fa8,
  jacket: 0x1f4a33,    // Jonas: dunkelgrüne Regenjacke
  beanie: 0x6d6f72,    // graue Wollmütze
};

export const SPOTS = {
  tower: new THREE.Vector3(-2, 0, -3),
  house: new THREE.Vector3(7, 0, 5),
  jettyStart: new THREE.Vector3(-5, 0, 15),
  jettyEnd: new THREE.Vector3(-5, 0, 33),
  wreck: new THREE.Vector3(38, 0, -34),
};

// Inselhöhe an (x,z)
export function islandHeight(x, z) {
  const r = Math.sqrt(x * x + z * z) * (1 + 0.12 * noise2(Math.atan2(z, x) * 2, 3.1));
  const plateau = 2.6 + 0.35 * fbm(x * 0.12, z * 0.12, 4);
  const shore = smooth(23, 13, r);           // 1 innen, 0 außen
  let h = THREE.MathUtils.lerp(-2.5, plateau, shore);
  h += 0.6 * fbm(x * 0.35 + 10, z * 0.35, 3) * shore;
  // flacher Bauplatz für Turm und Haus
  const flat = (p, rad) => smooth(rad + 3, rad, Math.hypot(x - p.x, z - p.z));
  const ft = flat(SPOTS.tower, 4), fh = flat(SPOTS.house, 5.5);
  h = THREE.MathUtils.lerp(h, 2.9, Math.max(ft, fh));
  return h;
}

function buildIsland() {
  const g = new THREE.PlaneGeometry(64, 64, 160, 160); g.rotateX(-Math.PI / 2);
  const pos = g.attributes.position; const col = [];
  const sand = new THREE.Color(0x8a7f68), grass = new THREE.Color(0x3c4e38), rock = new THREE.Color(0x3b4246), wet = new THREE.Color(0x2a2a26);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i); const y = islandHeight(x, z); pos.setY(i, y);
    const n = fbm(x * 0.4, z * 0.4, 3);
    let c = y < 0.3 ? wet.clone() : y < 1.4 ? sand.clone() : grass.clone();
    if (y > 1.0 && n > 0.18) c.lerp(rock, 0.7);
    if (y > 1.4 && y < 2.0) c.lerp(sand, 0.4);
    c.multiplyScalar(0.85 + 0.3 * n);
    col.push(c.r, c.g, c.b);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 });
  const mesh = new THREE.Mesh(g, m); mesh.receiveShadow = true; mesh.name = 'island';
  return mesh;
}

function buildRocks(seed = 11) {
  const grp = new THREE.Group(); const r = rng(seed);
  const mat = new THREE.MeshStandardMaterial({ color: 0x2b3236, roughness: 0.85, flatShading: true });
  const wetMat = new THREE.MeshStandardMaterial({ color: 0x1c2326, roughness: 0.3, metalness: 0.1, flatShading: true });
  for (let i = 0; i < 70; i++) {
    const a = r() * Math.PI * 2, rad = 17 + r() * 9;
    if (Math.abs(a - Math.PI / 2 - 0.27) < 0.12) continue; // Platz für den Steg
    const geo = new THREE.IcosahedronGeometry(0.6 + r() * 1.8, 1);
    const p = geo.attributes.position;
    for (let k = 0; k < p.count; k++) { const s = 0.75 + r() * 0.5; p.setXYZ(k, p.getX(k) * s, p.getY(k) * s * 0.75, p.getZ(k) * s); }
    geo.computeVertexNormals();
    const x = Math.cos(a) * rad, z = Math.sin(a) * rad;
    const m = new THREE.Mesh(geo, rad > 21 ? wetMat : mat);
    m.position.set(x, Math.max(islandHeight(x, z), -0.8) - 0.2, z);
    m.rotation.set(r() * 3, r() * 3, r() * 3);
    m.castShadow = m.receiveShadow = true; grp.add(m);
  }
  grp.name = 'rocks'; return grp;
}

// Ring-Segment eines Kegelstumpfs (für die Turmstreifen)
function band(r0, r1, y0, y1, color) {
  const g = new THREE.CylinderGeometry(r1, r0, y1 - y0, 48, 1, true);
  g.translate(0, (y0 + y1) / 2, 0);
  return new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0.0, side: THREE.DoubleSide }));
}

function buildTower() {
  const t = new THREE.Group(); t.name = 'tower';
  const H = 20, R0 = 2.7, R1 = 1.85; const N = 7;
  const plaster = makeNoiseTexture({ seed: 4, base: '#bbbbbb', var: 40, scaleX: 20, scaleY: 30 });
  for (let i = 0; i < N; i++) {
    const y0 = (i / N) * H, y1 = ((i + 1) / N) * H;
    const r0 = THREE.MathUtils.lerp(R0, R1, i / N), r1 = THREE.MathUtils.lerp(R0, R1, (i + 1) / N);
    const m = band(r0, r1, y0, y1, i % 2 === 0 ? 0xa3201c : 0xe8e4dc);
    m.material.map = plaster; m.material.color.multiplyScalar(0.9);
    m.castShadow = m.receiveShadow = true; t.add(m);
  }
  // Sockel
  const base = new THREE.Mesh(new THREE.CylinderGeometry(3.3, 3.5, 1.2, 32), new THREE.MeshStandardMaterial({ color: 0x3a3d3f, roughness: 0.9 }));
  base.position.y = 0.3; base.castShadow = base.receiveShadow = true; t.add(base);
  // Tür
  const door = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.1, 0.3), new THREE.MeshStandardMaterial({ color: 0x1d2a26, roughness: 0.7 }));
  door.position.set(0, 1.9, R0 - 0.02); t.add(door);
  // kleine Fenster
  const winMat = new THREE.MeshStandardMaterial({ color: 0x0b1316, roughness: 0.2, emissive: PALETTE.lamp, emissiveIntensity: 0 });
  for (let k = 0; k < 3; k++) {
    const y = 6 + k * 4.5; const rr = THREE.MathUtils.lerp(R0, R1, y / H);
    const w = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.9, 0.3), winMat);
    const a = k * 2.1 + 0.4; w.position.set(Math.sin(a) * rr, y, Math.cos(a) * rr); w.lookAt(0, y, 0); t.add(w);
  }
  // Galerie
  const gallery = new THREE.Mesh(new THREE.CylinderGeometry(2.7, 2.5, 0.35, 40), new THREE.MeshStandardMaterial({ color: 0x222628, roughness: 0.6, metalness: 0.4 }));
  gallery.position.y = H + 0.15; gallery.castShadow = true; t.add(gallery);
  const railMat = new THREE.MeshStandardMaterial({ color: 0x181b1c, roughness: 0.5, metalness: 0.6 });
  const rail = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.05, 6, 48), railMat); rail.rotation.x = Math.PI / 2; rail.position.y = H + 1.3; t.add(rail);
  for (let k = 0; k < 24; k++) {
    const a = k / 24 * Math.PI * 2; const p = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.15, 5), railMat);
    p.position.set(Math.cos(a) * 2.6, H + 0.85, Math.sin(a) * 2.6); t.add(p);
  }
  // Laternenraum
  const lanternBase = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.6, 0.9, 24), new THREE.MeshStandardMaterial({ color: 0xa3201c, roughness: 0.7 }));
  lanternBase.position.y = H + 0.75; t.add(lanternBase);
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x223338, roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.35, emissive: PALETTE.lamp, emissiveIntensity: 0.4, side: THREE.DoubleSide, depthWrite: false });
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.45, 2.2, 16, 1, true), glassMat); glass.position.y = H + 2.3; t.add(glass);
  for (let k = 0; k < 8; k++) {
    const a = k / 8 * Math.PI * 2; const s = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.2, 0.08), railMat);
    s.position.set(Math.cos(a) * 1.47, H + 2.3, Math.sin(a) * 1.47); t.add(s);
  }
  const cap = new THREE.Mesh(new THREE.ConeGeometry(1.75, 1.3, 24), new THREE.MeshStandardMaterial({ color: 0x8e1b18, roughness: 0.6, metalness: 0.2 }));
  cap.position.y = H + 4.05; cap.castShadow = true; t.add(cap);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8), railMat); knob.position.y = H + 4.8; t.add(knob);
  // Lampe
  const lampMat = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: PALETTE.lampHot, emissiveIntensity: 6 });
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.55, 20, 14), lampMat); lamp.position.y = H + 2.25; t.add(lamp);
  t.userData = { H, lampY: H + 2.25, glassMat, lampMat, winMat };
  return t;
}

// Lichtkegel: additiver Shader, weich, leicht verrauscht
function buildBeam(L = 95, R = 9, k = 0.22, color = 0xffc68a) {
  const g = new THREE.ConeGeometry(R, L, 48, 24, true);
  g.translate(0, -L / 2, 0); // Spitze im Ursprung, öffnet nach -y
  g.rotateZ(Math.PI / 2);    // öffnet nach +x
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 }, uInt: { value: 1 }, uK: { value: k }, uColor: { value: new THREE.Color(color) }, uL: { value: L } },
    vertexShader: `
      varying float vAlong; varying vec3 vN; varying vec3 vView; varying vec3 vW;
      uniform float uL;
      void main(){
        vAlong = position.x / uL;
        vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz;
        vN = normalize(mat3(modelMatrix) * normal);
        vView = normalize(cameraPosition - w.xyz);
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: `
      varying float vAlong; varying vec3 vN; varying vec3 vView; varying vec3 vW;
      uniform float uTime; uniform float uInt; uniform float uK; uniform vec3 uColor;
      float h(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,37.719)))*43758.5453); }
      float n3(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
        return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),
                   mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z); }
      void main(){
        float edge = pow(abs(dot(normalize(vN), vView)), 1.6);
        float along = pow(1.0 - clamp(vAlong,0.0,1.0), 1.8) * smoothstep(0.0, 0.04, vAlong);
        float n = 0.55 + 0.6 * n3(vW * 0.18 + vec3(uTime*0.35, 0.0, uTime*0.2)) * n3(vW*0.05 - uTime*0.1);
        float a = edge * along * n * uInt * uK;
        gl_FragColor = vec4(uColor * a, a);
      }`,
  });
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.renderOrder = 10;
  return m;
}

// Volumetrischer Lichtkegel (Leuchtfeuer, Taschenlampe): öffnet entlang +x
export const makeLightCone = (L, R, k, color) => buildBeam(L, R, k, color);

function buildHouse() {
  const h = new THREE.Group(); h.name = 'house';
  const wallTex = makeNoiseTexture({ seed: 9, base: '#9a9a94', var: 35, scaleX: 12, scaleY: 12 });
  const wall = new THREE.Mesh(new THREE.BoxGeometry(6.5, 3.2, 4.8), new THREE.MeshStandardMaterial({ color: 0xcfcbc2, map: wallTex, roughness: 0.95 }));
  wall.position.y = 1.6; wall.castShadow = wall.receiveShadow = true; h.add(wall);
  // Satteldach
  const shape = new THREE.Shape(); shape.moveTo(-2.75, 0); shape.lineTo(2.75, 0); shape.lineTo(0, 2.1); shape.lineTo(-2.75, 0);
  const roofG = new THREE.ExtrudeGeometry(shape, { depth: 7.1, bevelEnabled: false }); roofG.translate(0, 0, -3.55); roofG.rotateY(Math.PI / 2);
  const roof = new THREE.Mesh(roofG, new THREE.MeshStandardMaterial({ color: 0x2a2f33, roughness: 0.7 }));
  roof.position.y = 3.2; roof.castShadow = true; h.add(roof);
  const chim = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.6, 0.6), new THREE.MeshStandardMaterial({ color: 0x4a3a33, roughness: 0.9 }));
  chim.position.set(1.8, 4.6, -0.8); chim.castShadow = true; h.add(chim);
  const winMat = new THREE.MeshStandardMaterial({ color: 0x120c06, emissive: PALETTE.lamp, emissiveIntensity: 1.4, roughness: 0.3 });
  const frameMat = new THREE.MeshStandardMaterial({ color: 0xe9e6de, roughness: 0.8 });
  const addWin = (x, y, z, ry) => {
    const f = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.2, 0.12), frameMat); f.position.set(x, y, z); f.rotation.y = ry; h.add(f);
    const w = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.0), winMat); w.position.set(x, y, z); w.rotation.y = ry;
    w.translateZ(0.07); h.add(w);
  };
  addWin(-1.8, 1.8, 2.41, 0); addWin(1.9, 1.8, 2.41, 0); addWin(3.26, 1.8, 0.6, Math.PI / 2);
  const door = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.1, 0.15), new THREE.MeshStandardMaterial({ color: 0x23352f, roughness: 0.7 }));
  door.position.set(0.1, 1.05, 2.42); h.add(door);
  const porch = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), new THREE.MeshStandardMaterial({ emissive: PALETTE.lamp, emissiveIntensity: 5, color: 0 }));
  porch.position.set(0.9, 2.5, 2.55); h.add(porch);
  h.userData = { winMat };
  return h;
}

function buildJetty() {
  const j = new THREE.Group(); j.name = 'jetty';
  const wood = makeNoiseTexture({ seed: 21, base: '#4a3f33', var: 30, scaleX: 3, scaleY: 30, streak: 12 });
  const plankMat = new THREE.MeshStandardMaterial({ color: 0x8a7a66, map: wood, roughness: 0.85 });
  const postMat = new THREE.MeshStandardMaterial({ color: 0x2f2a24, roughness: 0.6 });
  const a = SPOTS.jettyStart, b = SPOTS.jettyEnd; const len = a.distanceTo(b); const r = rng(5);
  const n = Math.floor(len / 0.45);
  for (let i = 0; i < n; i++) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.08, 0.4), plankMat);
    p.position.set(a.x + (r() - 0.5) * 0.05, 1.5 + (r() - 0.5) * 0.04, a.z + i * 0.45); p.rotation.y = (r() - 0.5) * 0.03;
    p.castShadow = p.receiveShadow = true; j.add(p);
  }
  for (let i = 0; i <= len; i += 3) for (const s of [-1, 1]) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 4, 7), postMat);
    p.position.set(a.x + s * 1.05, -0.3, a.z + i); p.castShadow = true; j.add(p);
  }
  // Laterne am Stegende
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.6, 6), postMat); pole.position.set(a.x + 1, 2.3, b.z - 0.5); j.add(pole);
  return j;
}

export function buildBoat() {
  const b = new THREE.Group(); b.name = 'boat';
  const g = new THREE.BoxGeometry(6, 1.3, 2.2, 16, 3, 6); const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const f = x > 0 ? 1 - Math.pow(x / 3, 2) * 0.95 : 1 - Math.pow(-x / 3, 4) * 0.2;
    const bottom = y < 0 ? 1 - 0.5 * (1 - Math.abs(z) / 1.1) : 1;
    z *= f * (y < 0 ? 0.75 : 1); if (y < 0) y *= bottom * (0.7 + 0.3 * f);
    if (y > 0) y += Math.pow(Math.max(0, x) / 3, 2) * 0.4;
    p.setXYZ(i, x, y, z);
  }
  g.computeVertexNormals();
  const hull = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0x1b2b3d, roughness: 0.55 })); hull.castShadow = true; b.add(hull);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.12, 2.12), new THREE.MeshStandardMaterial({ color: 0xb8b2a6 })); stripe.position.set(-0.4, 0.45, 0); b.add(stripe);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.3, 1.5), new THREE.MeshStandardMaterial({ color: 0xd8d4ca, roughness: 0.8 })); cabin.position.set(-1.2, 1.25, 0); cabin.castShadow = true; b.add(cabin);
  const cw = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.4, 1.3), new THREE.MeshStandardMaterial({ color: 0x0a0a08, emissive: PALETTE.lamp, emissiveIntensity: 0.8 })); cw.position.set(-1.2, 1.5, 0); b.add(cw);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 2.2, 6), new THREE.MeshStandardMaterial({ color: 0x222222 })); mast.position.set(-1.2, 2.9, 0); b.add(mast);
  const navLight = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), new THREE.MeshStandardMaterial({ emissive: PALETTE.lamp, emissiveIntensity: 8, color: 0 })); navLight.position.set(-1.2, 4.0, 0); b.add(navLight);
  return b;
}

export function buildWreck() {
  const w = new THREE.Group(); w.name = 'wreck';
  const mat = new THREE.MeshStandardMaterial({ color: 0x2a231d, roughness: 0.75 });
  for (let i = 0; i < 9; i++) {
    const rib = new THREE.Mesh(new THREE.TorusGeometry(2.4 - Math.abs(i - 4) * 0.15, 0.13, 6, 16, Math.PI * (0.75 - (i % 3) * 0.08)), mat);
    rib.position.set(i * 1.2 - 5, 0.2, 0); rib.rotation.set(0, Math.PI / 2, Math.PI + 0.2 + (i % 2) * 0.1); w.add(rib);
  }
  const keel = new THREE.Mesh(new THREE.BoxGeometry(11, 0.3, 0.4), mat); keel.position.y = -1.9; keel.rotation.z = 0.05; w.add(keel);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 5, 6), mat); mast.position.set(1, 0.8, 0.4); mast.rotation.z = 0.6; w.add(mast);
  w.rotation.z = -0.15; w.position.y = -0.6;
  return w;
}

function buildSea() {
  const g = new THREE.PlaneGeometry(520, 520, 170, 170); g.rotateX(-Math.PI / 2);
  const m = new THREE.MeshStandardMaterial({ color: PALETTE.sea, roughness: 0.28, metalness: 0.35, vertexColors: true });
  const col = new Float32Array(g.attributes.position.count * 3).fill(1);
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mesh = new THREE.Mesh(g, m); mesh.receiveShadow = true; mesh.name = 'sea';
  mesh.userData.base = Float32Array.from(g.attributes.position.array);
  return mesh;
}

function updateSea(sea, t, swell = 1) {
  const pos = sea.geometry.attributes.position, base = sea.userData.base, col = sea.geometry.attributes.color;
  for (let i = 0; i < pos.count; i++) {
    const x = base[i * 3], z = base[i * 3 + 2];
    let y = 0.32 * Math.sin(x * 0.11 + t * 0.9) * Math.cos(z * 0.08 - t * 0.6)
      + 0.18 * Math.sin((x + z) * 0.23 - t * 1.4) + 0.08 * Math.sin(x * 0.7 - z * 0.5 + t * 2.1);
    y *= swell;
    const r = Math.hypot(x, z);
    y *= smooth(14, 26, r) * 0.8 + 0.2;
    pos.setY(i, y);
    const foam = smooth(25, 20, r) * (0.5 + 0.5 * Math.sin(r * 1.3 - t * 1.5));
    const c = 1 + foam * 1.6;
    col.setXYZ(i, c, c * 1.05, c * 1.05);
  }
  pos.needsUpdate = true; col.needsUpdate = true; sea.geometry.computeVertexNormals();
}

// Nebelbänke als weiche Billboards; werden im Lichtkegel heller ("volumetrisch")
function buildFog(count = 70, seed = 33) {
  const grp = new THREE.Group(); grp.name = 'fog';
  const texs = [makeFogTexture(1), makeFogTexture(2), makeFogTexture(3)];
  const r = rng(seed);
  for (let i = 0; i < count; i++) {
    const mat = new THREE.SpriteMaterial({ map: texs[i % 3], color: PALETTE.fog, transparent: true, opacity: 0.3, depthWrite: false, fog: false });
    const s = new THREE.Sprite(mat);
    const a = r() * Math.PI * 2, rad = 6 + Math.pow(r(), 0.8) * 70;
    s.userData = { x: Math.cos(a) * rad, z: Math.sin(a) * rad, y: 0.5 + r() * 9, size: 14 + r() * 26, sp: 0.3 + r() * 0.6, ph: r() * 10, op: 0.18 + r() * 0.2, rot: r() * 6 };
    mat.rotation = s.userData.rot;
    grp.add(s);
  }
  return grp;
}

export function createWorld(scene, opts = {}) {
  scene.background = new THREE.Color(0x10303a);
  scene.fog = new THREE.FogExp2(PALETTE.fog, 0.018);

  const hemi = new THREE.HemisphereLight(0x5f93a0, 0x0c1618, 1.1); scene.add(hemi);
  const fill = new THREE.DirectionalLight(0x3d7080, 0.9); fill.position.set(25, 18, 45); scene.add(fill);
  const moon = new THREE.DirectionalLight(PALETTE.moon, 2.2);
  moon.position.set(-40, 50, -30); moon.castShadow = true;
  moon.shadow.mapSize.set(1024, 1024); Object.assign(moon.shadow.camera, { left: -35, right: 35, top: 35, bottom: -35, near: 1, far: 150 });
  moon.shadow.bias = -0.0008; moon.shadow.radius = 4; scene.add(moon);

  const island = buildIsland(); scene.add(island);
  const rocks = buildRocks(); scene.add(rocks);
  const sea = buildSea(); scene.add(sea);

  const tower = buildTower(); tower.position.copy(SPOTS.tower); tower.position.y = islandHeight(SPOTS.tower.x, SPOTS.tower.z) - 0.2; scene.add(tower);
  const house = buildHouse(); house.position.copy(SPOTS.house); house.position.y = islandHeight(SPOTS.house.x, SPOTS.house.z) - 0.05; house.rotation.y = -0.35; scene.add(house);
  const jetty = buildJetty(); scene.add(jetty);
  const wreck = buildWreck(); wreck.position.copy(SPOTS.wreck); wreck.rotation.y = 0.7; scene.add(wreck);

  const lampWorld = tower.position.clone(); lampWorld.y += tower.userData.lampY;
  const lampLight = new THREE.PointLight(PALETTE.lamp, 40, 30, 1.6); lampLight.position.copy(lampWorld); scene.add(lampLight);
  const houseLight = new THREE.PointLight(PALETTE.lamp, 6, 10, 2); houseLight.position.copy(house.position).add(new THREE.Vector3(0.8, 2.4, 3.3)); scene.add(houseLight);

  const beams = [buildBeam(), buildBeam()]; beams.forEach((b) => { b.position.copy(lampWorld); scene.add(b); });
  beams[1].rotation.y = Math.PI;
  const beamSpot = new THREE.SpotLight(0xffc890, 900, 120, 0.11, 0.6, 1.4); beamSpot.position.copy(lampWorld); scene.add(beamSpot); scene.add(beamSpot.target);

  // Glanz direkt an der Lampe
  const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,230,190,1)'); gr.addColorStop(0.2, 'rgba(255,170,90,0.6)'); gr.addColorStop(1, 'rgba(255,140,60,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false }));
  glow.position.copy(lampWorld); glow.scale.setScalar(6); scene.add(glow);

  const fog = buildFog(opts.fogCount ?? 70); scene.add(fog);

  const state = { lamp: 1, beamSpeed: (Math.PI * 2) / 9, beamPhase: 0, swell: 1, houseLight: 1, fogDensity: 0.018 };

  function update(t, cam) {
    updateSea(sea, t, state.swell);
    const ang = state.beamPhase + t * state.beamSpeed;
    beams[0].rotation.set(0, ang, -0.04); beams[1].rotation.set(0, ang + Math.PI, -0.04);
    const L = state.lamp;
    beams.forEach((b) => { b.material.uniforms.uTime.value = t; b.material.uniforms.uInt.value = L; b.visible = L > 0.01; });
    const dir = new THREE.Vector3(Math.cos(ang), -0.04, -Math.sin(ang));
    beamSpot.target.position.copy(lampWorld).addScaledVector(dir, 50); beamSpot.intensity = 900 * L;
    lampLight.intensity = 40 * L; tower.userData.lampMat.emissiveIntensity = 0.2 + 6 * L; tower.userData.glassMat.emissiveIntensity = 0.05 + 0.5 * L;
    houseLight.intensity = 6 * state.houseLight; house.userData.winMat.emissiveIntensity = 1.4 * state.houseLight;
    scene.fog.density = state.fogDensity;
    // Glanz: heller, wenn der Kegel zur Kamera zeigt
    let face = 0;
    if (cam) {
      const toCam = cam.position.clone().sub(lampWorld).normalize();
      const d = Math.max(dir.dot(toCam), -dir.dot(toCam));
      face = Math.pow(Math.max(0, d), 12);
      glow.scale.setScalar((4 + 22 * face) * (0.3 + 0.7 * L));
    }
    glow.material.opacity = L * (0.6 + 0.4 * face);
    // Nebel driften + im Kegel aufhellen
    const fogC = new THREE.Color(PALETTE.fog), lit = new THREE.Color(PALETTE.fogLit);
    fog.children.forEach((s) => {
      const u = s.userData;
      const x = u.x + Math.sin(t * 0.05 * u.sp + u.ph) * 6 + t * 0.6 * u.sp, z = u.z + Math.cos(t * 0.04 + u.ph) * 4;
      s.position.set(((x + 80) % 160 + 160) % 160 - 80, u.y + Math.sin(t * 0.2 + u.ph) * 0.3, z);
      s.scale.setScalar(u.size);
      s.material.rotation = u.rot + t * 0.01 * u.sp;
      const rel = s.position.clone().sub(lampWorld); rel.y *= 0.3; const dist = rel.length(); rel.normalize();
      const hit = Math.pow(Math.max(0, Math.max(rel.dot(dir), -rel.dot(dir))), 30) * smooth(90, 10, dist) * L;
      s.material.color.copy(fogC).lerp(lit, Math.min(1, hit * 1.2));
      s.material.opacity = u.op * (1 + hit * 1.5);
    });
  }

  return { scene, island, rocks, sea, tower, house, jetty, wreck, beams, beamSpot, lampLight, lampWorld, glow, fog, moon, hemi, state, update,
    beamDir: (t) => { const a = state.beamPhase + t * state.beamSpeed; return new THREE.Vector3(Math.cos(a), -0.04, -Math.sin(a)); } };
}
