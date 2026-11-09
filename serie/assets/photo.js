// Alte Fotografien aus der 3D-Welt (ab Teil 4): rendert eine Szene, macht daraus einen verblassten
// Farbabzug von 1953 (entsättigt, warm, Korn, Kratzer, weißer Rand, handschriftliche Beschriftung).
import * as THREE from 'three';
import { rng } from './lib.js';

// engine: createEngine()-Objekt; scene/camera: was fotografiert wird
export function makeOldPhoto(engine, scene, { pos, target, fov = 30, caption = 'Nebelsand, Okt. 1953', seed = 1953, exposure = 1.0 } = {}) {
  const { renderer, glCanvas } = engine;
  const W = glCanvas.width, H = glCanvas.height;
  const band = Math.round(W * 0.75);           // 4:3-Ausschnitt aus der Bildmitte
  const cam = new THREE.PerspectiveCamera(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(fov) / 2) * H / band) * 180 / Math.PI, W / H, 0.05, 600);
  cam.position.copy(pos); cam.lookAt(target);
  const prevExp = renderer.toneMappingExposure; renderer.toneMappingExposure = exposure;
  renderer.setRenderTarget(null); renderer.render(scene, cam);
  renderer.toneMappingExposure = prevExp;
  const img = document.createElement('canvas'); img.width = W; img.height = band;
  const ig = img.getContext('2d'); ig.drawImage(glCanvas, 0, (H - band) / 2, W, band, 0, 0, W, band);
  // Verblassen
  const d = ig.getImageData(0, 0, W, band); const p = d.data; const r = rng(seed);
  for (let i = 0; i < p.length; i += 4) {
    const x = (i / 4) % W, y = Math.floor(i / 4 / W);
    let R = p[i], G = p[i + 1], B = p[i + 2];
    const l = 0.3 * R + 0.59 * G + 0.11 * B;
    R = l + (R - l) * 0.45; G = l + (G - l) * 0.45; B = l + (B - l) * 0.45;           // entsättigt
    R = R * 1.08 + 18; G = G * 1.0 + 12; B = B * 0.82 + 4;                           // warm, Schwarz angehoben
    const vx = x / W - 0.5, vy = y / band - 0.5; const v = 1 - Math.min(1, (vx * vx + vy * vy) * 1.9);
    const n = (r() - 0.5) * 34;
    p[i] = Math.min(255, R * (0.55 + 0.45 * v) + n); p[i + 1] = Math.min(255, G * (0.55 + 0.45 * v) + n); p[i + 2] = Math.min(255, B * (0.55 + 0.45 * v) + n);
  }
  ig.putImageData(d, 0, 0);
  // leichte Unschärfe + Kratzer + Staub
  const soft = document.createElement('canvas'); soft.width = W; soft.height = band; const sg = soft.getContext('2d'); sg.filter = 'blur(1.6px)'; sg.drawImage(img, 0, 0);
  sg.filter = 'none'; sg.strokeStyle = 'rgba(240,230,210,0.18)';
  for (let k = 0; k < 4; k++) { sg.lineWidth = 0.6 + r() * 1.0; sg.beginPath(); const x0 = r() * W; sg.moveTo(x0, 0); sg.bezierCurveTo(x0 + r() * 60 - 30, band * 0.3, x0 + r() * 80 - 40, band * 0.7, x0 + r() * 60 - 30, band); sg.stroke(); }
  for (let k = 0; k < 90; k++) { sg.fillStyle = r() < 0.3 ? 'rgba(250,245,230,0.3)' : 'rgba(20,15,10,0.4)'; sg.beginPath(); sg.arc(r() * W, r() * band, 0.5 + r() * 1.6, 0, 7); sg.fill(); }
  // Abzug mit Rand + Beschriftung
  const BW = 70, BB = 230; const out = document.createElement('canvas'); out.width = W + BW * 2; out.height = band + BW + BB;
  const og = out.getContext('2d'); og.fillStyle = '#e9e1cc'; og.fillRect(0, 0, out.width, out.height);
  for (let k = 0; k < 2500; k++) { og.fillStyle = `rgba(120,95,60,${r() * 0.06})`; og.fillRect(r() * out.width, r() * out.height, 3, 3); }
  og.drawImage(soft, BW, BW);
  og.font = '700 92px Caveat'; og.fillStyle = 'rgba(40,40,70,0.85)'; og.save(); og.translate(BW + 30, band + BW + 140); og.rotate(-0.02); og.fillText(caption, 0, 0); og.restore();
  // Gebrauchsspuren: Ecke geknickt, Fleck
  og.fillStyle = 'rgba(160,130,80,0.18)'; og.beginPath(); og.arc(out.width - 180, 140, 110, 0, 7); og.fill();
  const t = new THREE.CanvasTexture(out); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  t.userData = { aspect: out.width / out.height, imgRect: { x: BW / out.width, y: BW / out.height, w: W / out.width, h: band / out.height } };
  return t;
}
