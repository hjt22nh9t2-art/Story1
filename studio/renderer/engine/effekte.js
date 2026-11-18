// Effekte für wichtige Ereignisse. Jeder Effekt: create(set, opt) -> { update(t, l, d) => post-Änderungen }
// l = lokale Zeit in der Szene, d = Szenendauer
import * as THREE from 'three';
import { rng, smooth, clamp01, noise2, makeFogTexture, lerp } from './lib.js';
import { createParticles, glowSprite } from './orte.js';
import { makeBeamCone } from './figuren.js';

// Prozedurale Flammen-/Rauch-Textur
let _flame = null;
function flameTex() {
  if (_flame) return _flame; const c = document.createElement('canvas'); c.width = 64; c.height = 128; const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 96, 2, 32, 80, 60); gr.addColorStop(0, 'rgba(255,250,220,1)'); gr.addColorStop(0.25, 'rgba(255,190,80,0.9)'); gr.addColorStop(0.6, 'rgba(230,80,20,0.5)'); gr.addColorStop(1, 'rgba(120,20,0,0)');
  g.fillStyle = gr; g.beginPath(); g.ellipse(32, 80, 26, 50, 0, 0, Math.PI * 2); g.fill(); _flame = new THREE.CanvasTexture(c); return _flame;
}

// Wasser-/Schlammfläche, die steigt (Flut). opt.farbe: 'schlamm' | 'wasser'; opt.von/bis: Höhe; opt.welle: Wasserwand-Front
function flut(set, opt = {}) {
  const mud = opt.farbe !== 'wasser';
  const col = new THREE.Color(mud ? 0x4a3a28 : 0x1a3a44);
  const m = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uCol: { value: col }, uFoam: { value: new THREE.Color(mud ? 0x8a7458 : 0x9ab8c0) }, fogColor: { value: new THREE.Color() }, fogDensity: { value: 0 } },
    vertexShader: `uniform float uTime; varying vec3 vW; varying float vF;
      #include <fog_pars_vertex>
      void main(){ vec3 p = position; vec4 w = modelMatrix*vec4(p,1.0);
        float h = sin(w.x*3.0+uTime*4.0)*0.03 + sin(w.z*2.2-uTime*5.0)*0.04 + sin((w.x+w.z)*7.0+uTime*9.0)*0.012; p.z += h; vF = h;
        vec4 mvPosition = modelViewMatrix*vec4(p,1.0); vW = (modelMatrix*vec4(p,1.0)).xyz; gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: `uniform vec3 uCol, uFoam; uniform float uTime; varying vec3 vW; varying float vF;
      #include <fog_pars_fragment>
      float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
      void main(){ vec3 n = normalize(cross(dFdx(vW), dFdy(vW))); if(n.y<0.0) n=-n; vec3 v = normalize(cameraPosition - vW);
        float fr = pow(1.0 - max(dot(n,v),0.0), 4.0);
        float streak = 0.5 + 0.5 * sin(vW.x * 7.0 + sin(vW.z * 1.3 - uTime * 2.0) * 2.0) * sin(vW.z * 2.1 - uTime * 3.0 + vW.x);
        float foam = smoothstep(0.7, 1.0, streak) * 0.35 + smoothstep(0.035, 0.07, vF) * 0.5;
        vec3 l = normalize(vec3(0.2, 1.0, 0.4)); float spec = pow(max(dot(reflect(-l, n), v), 0.0), 40.0);
        vec3 c = mix(uCol * 0.55, uFoam, foam * 0.45) + fr * vec3(0.18, 0.15, 0.12) + spec * 0.6;
        gl_FragColor = vec4(c, 0.96);
        #include <fog_fragment>
      }`,
    fog: true, transparent: true,
  });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(60, 140, 120, 220), m); plane.rotation.x = -Math.PI / 2; plane.position.z = -20; plane.renderOrder = 2; set.scene.add(plane);
  // Front der Flutwelle (schäumende Wand, kommt den Gang entlang)
  const front = new THREE.Mesh(new THREE.PlaneGeometry(8, 3, 30, 12), new THREE.MeshStandardMaterial({ color: mud ? 0x5a4630 : 0x3a6070, roughness: 0.3, metalness: 0.2, transparent: true, opacity: 0.95 }));
  const fp = front.geometry.attributes.position; const base = fp.array.slice();
  set.scene.add(front);
  const spray = createParticles({ count: 400, box: [4, 2.5, 1.5], center: [0, 0, 0], color: mud ? 0xb09a7a : 0xd8e8f0, size: 0.06, opacity: 0.7 }); set.scene.add(spray);
  const von = opt.von ?? -0.1, bis = opt.bis ?? 1.4; const welle = opt.welle ?? false;
  return { objs: [plane, front, spray], update(t, l, d) {
    m.uniforms.uTime.value = t;
    const k = smooth(0, opt.dauer ?? d, l); const h = lerp(von, bis, k);
    plane.position.y = h; plane.visible = h > -0.05;
    front.visible = spray.visible = welle;
    if (welle) {
      const z = lerp(opt.start ?? -16, opt.ziel ?? 12, clamp01(l / (opt.dauer ?? d)));
      front.position.set(0, h * 0.5 + 0.8, z); plane.position.z = z - 70;
      for (let i = 0; i < fp.count; i++) { const x = base[i * 3], y = base[i * 3 + 1]; fp.setXYZ(i, x, y + noise2(x * 2 + t * 3, y * 2) * 0.15, noise2(x * 1.5 - t * 4, y * 1.5 + t * 2) * 0.35 + (y + 1.5) * 0.25); }
      fp.needsUpdate = true; front.geometry.computeVertexNormals();
      spray.position.set(0, h * 0.5 + 0.2, z + 0.4); spray.userData.update(t * 3);
    }
    return {};
  } };
}

function feuer(set, opt = {}) {
  const g = new THREE.Group(); g.position.set(...(opt.pos || [0, 0, -3])); set.scene.add(g); const r = rng(7); const flames = [];
  for (let i = 0; i < 14; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: flameTex(), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); s.userData = { x: (r() - 0.5) * 1.2 * (opt.groesse || 1), ph: r() * 10, sp: 0.8 + r() * 0.8 }; g.add(s); flames.push(s); }
  const light = new THREE.PointLight(0xff7a30, 30 * (opt.groesse || 1), 18, 1.6); light.position.y = 1; g.add(light);
  const embers = createParticles({ count: 200, box: [2, 4, 2], center: [0, 0, 0], color: 0xffa040, size: 0.04, kind: 'glut', opacity: 0.9 }); g.add(embers);
  return { objs: [g], update(t, l, d) { const sz = opt.groesse || 1;
    flames.forEach((f) => { const u = f.userData; const c = ((t * u.sp + u.ph) % 1); f.position.set(u.x * (1 - c * 0.5), c * 1.8 * sz, 0); f.scale.set((0.9 - c * 0.6) * sz, (1.5 - c * 0.8) * sz, 1); f.material.opacity = Math.sin(c * Math.PI); });
    light.intensity = 30 * sz * (0.8 + 0.3 * noise2(t * 8, 1)); embers.userData.update(t); return { flicker: 0.02 }; } };
}

function rauch(set, opt = {}) {
  const tex = makeFogTexture(5); const g = new THREE.Group(); g.position.set(...(opt.pos || [0, 0, -4])); set.scene.add(g); const r = rng(9); const puffs = [];
  for (let i = 0; i < 18; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: opt.farbe || 0x2a2622, transparent: true, depthWrite: false })); s.userData = { ph: r(), x: (r() - 0.5) * 1.5 }; g.add(s); puffs.push(s); }
  return { objs: [g], update(t) { puffs.forEach((p) => { const c = (t * 0.12 + p.userData.ph) % 1; p.position.set(p.userData.x + c * 2, c * 9, 0); p.scale.setScalar(1.5 + c * 7); p.material.opacity = Math.sin(c * Math.PI) * 0.75; }); return {}; } };
}

function explosion(set, opt = {}) {
  const g = new THREE.Group(); g.position.set(...(opt.pos || [0, 0, -8])); set.scene.add(g); const at = opt.zeit ?? 0.3;
  const ball = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), new THREE.MeshBasicMaterial({ color: 0xffa040, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); g.add(ball);
  const light = new THREE.PointLight(0xffa050, 0, 60, 1.4); g.add(light);
  const debris = createParticles({ count: 300, box: [1, 1, 1], center: [0, 0, 0], color: 0xffc070, size: 0.09, kind: 'funken', opacity: 1 }); g.add(debris);
  const smoke = rauch(set, { pos: opt.pos || [0, 0, -8], farbe: 0x1a1816 });
  return { objs: [g, ...smoke.objs], update(t, l) { const k = l - at; if (k < 0) { g.visible = false; smoke.objs[0].visible = false; return {}; }
    g.visible = true; smoke.objs[0].visible = k > 0.3; const e = 1 - Math.exp(-k * 4); ball.scale.setScalar(0.3 + e * 4 * (opt.groesse || 1)); ball.material.opacity = Math.max(0, 1 - k * 0.9);
    light.intensity = Math.max(0, 3000 * Math.exp(-k * 3)); debris.scale.setScalar(1 + k * 8); debris.userData.update(k * 2); smoke.update(t * 1.5);
    return { flash: Math.max(0, 0.9 - k * 3), shake: Math.max(0, 1.6 - k * 1.2), zoomBlur: Math.max(0, 1 - k * 2) }; } };
}

function funken(set, opt = {}) {
  const p = createParticles({ count: 250, box: [1.5, 2.5, 1.5], center: opt.pos || [0, 0.5, -2], color: 0xffc060, size: 0.05, kind: 'funken', opacity: 1 }); set.scene.add(p);
  const l = new THREE.PointLight(0xffb050, 0, 8, 1.7); l.position.set(...(opt.pos || [0, 1, -2])); set.scene.add(l);
  return { objs: [p, l], update(t) { p.userData.update(t * 2.5); l.intensity = 12 * (noise2(t * 20, 2) > 0 ? 1 : 0.2); return {}; } };
}

// Erdbeben/Einsturz: Kamerawackeln + fallende Steine + Staub
function beben(set, opt = {}) {
  const r = rng(13); const g = new THREE.Group(); set.scene.add(g); const rocks = []; const m = new THREE.MeshStandardMaterial({ color: 0x5a4e44, roughness: 1 });
  for (let i = 0; i < 26; i++) { const s = 0.05 + r() * 0.2; const b = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), m); b.castShadow = true; b.userData = { x: (r() - 0.5) * 3, z: (r() - 0.5) * 6 + (opt.z ?? 0), t0: r() * 1.5, h: 2.4 + r() * 0.4 }; g.add(b); rocks.push(b); }
  const dust = createParticles({ count: 500, box: [4, 2.6, 8], center: [0, 0, opt.z ?? 0], color: 0xc8b8a0, size: 0.07, opacity: 0.5 }); set.scene.add(dust);
  return { objs: [g, dust], update(t, l, d) { rocks.forEach((b) => { const u = b.userData; const k = Math.max(0, l - u.t0); const y = Math.max(b.geometry.parameters.radius, u.h - 4.9 * k * k); b.position.set(u.x, y, u.z); b.rotation.set(k * 3, k * 2, 0); });
    dust.userData.update(t); dust.material.opacity = 0.55 * smooth(0, 0.8, l); const s = (opt.staerke ?? 1) * (1 - smooth(d * 0.7, d, l) * 0.6); return { shake: 2.2 * s }; } };
}

// Lichtstrahl von oben (z. B. durch ein Bohrloch) – opt.pos
function lichtstrahl(set, opt = {}) {
  const pos = opt.pos || [0, 2.6, 0]; const cone = makeBeamCone(opt.laenge || 3, opt.breite || 0.5, opt.farbe || 0xfff4dc); cone.position.set(...pos); set.scene.add(cone);
  const sp = new THREE.SpotLight(opt.farbe || 0xfff4dc, 0, 10, 0.35, 0.4, 1.3); sp.position.set(...pos); sp.target.position.set(pos[0], 0, pos[2]); set.scene.add(sp, sp.target);
  const motes = createParticles({ count: 160, box: [0.6, 2.4, 0.6], center: [pos[0], 0.1, pos[2]], color: 0xfff0d0, size: 0.03, opacity: 0.8 }); set.scene.add(motes);
  return { objs: [cone, sp, motes], update(t, l) { const k = smooth(opt.ab ?? 0, (opt.ab ?? 0) + 0.8, l); cone.material.uniforms.uInt.value = 0.9 * k; sp.intensity = 40 * k; motes.material.opacity = 0.8 * k; motes.userData.update(t); return {}; } };
}

function alarm(set, opt = {}) {
  const l = new THREE.SpotLight(0xff2010, 0, 25, 0.5, 0.4, 1.2); const pos = opt.pos || [0, 2.4, -2]; l.position.set(...pos); set.scene.add(l, l.target);
  const glow = glowSprite(0xff2010, 1.2); glow.position.set(...pos); set.scene.add(glow);
  return { objs: [l, glow], update(t) { const a = t * 6; l.target.position.set(pos[0] + Math.cos(a) * 5, 0, pos[2] + Math.sin(a) * 5); const p = 0.5 + 0.5 * Math.sin(a * 2); l.intensity = 120; glow.material.opacity = 0.4 + 0.6 * p; return { red: 0.18 * p }; } };
}

function blitz(set, opt = {}) {
  const l = new THREE.DirectionalLight(0xdfe8ff, 0); l.position.set(10, 30, -10); set.scene.add(l);
  return { objs: [l], update(t, l2) { const f = [0.2, 0.32, 1.6].reduce((a, x) => a + Math.max(0, 1 - Math.abs(l2 - x) * 12), 0); l.intensity = f * 9; return { flash: f * 0.35 }; } };
}

function wasserstrahl(set, opt = {}) {
  const p = createParticles({ count: 700, box: [0.6, 2.5, 3], center: opt.pos || [0, 0, -3], color: 0xa89878, size: 0.06, kind: 'regen', opacity: 0.8 }); set.scene.add(p);
  return { objs: [p], update(t) { p.userData.update(t * 0.6); return {}; } };
}

export const EFFEKTE = { flut, feuer, rauch, explosion, funken, beben, lichtstrahl, alarm, blitz, wasserstrahl,
  // reine Post-/Licht-Effekte (keine Objekte)
  flackern: () => ({ objs: [], state: { flackern: 1 }, update: () => ({}) }),
  dunkel: (set, o = {}) => ({ objs: [], update: (t, l, d) => ({ state: { licht: 1 - smooth(o.ab ?? 0, (o.ab ?? 0) + 1.2, l) } }) }),
  stromausfall: (set, o = {}) => ({ objs: [], update: (t, l) => { const a = o.ab ?? 0.4; const off = l > a + 0.25 ? 0 : (l > a ? (Math.sin(l * 70) > 0 ? 1 : 0) : 1); return { state: { licht: off } }; } }),
};

export function createEffect(name, set, opt = {}) {
  const f = EFFEKTE[name]; if (!f) { console.warn('Unbekannter Effekt', name); return null; }
  return f(set, opt);
}
