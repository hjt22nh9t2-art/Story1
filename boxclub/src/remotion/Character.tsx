/**
 * Parametrisches Figuren-Rig.
 * Jede Figur wird ausschließlich aus ihrem gespeicherten `look` gezeichnet.
 * Gleiche Daten => gleiches Bild, in jeder Folge, für immer.
 * Ursprung (0,0) = Mitte zwischen den Füßen.
 */
import React from 'react';
import type { CharacterLook } from '../lib/types';

export type Emotion = 'neutral' | 'froh' | 'wuetend' | 'traurig' | 'ueberrascht' | 'entschlossen' | 'verlegen' | 'stolz';
export type Action = 'keine' | 'zeigen' | 'schlagen' | 'arme_verschraenkt' | 'kopfschuetteln' | 'jubeln' | 'seufzen' | 'auftritt' | 'pratzen' | 'achselzucken' | 'nicken' | 'faust_heben';

export interface RigProps {
  look: CharacterLook;
  heightCm: number;
  /** Lokaler Frame (für Atmen/Blinzeln) */
  frame: number;
  seed?: number;
  emotion?: Emotion;
  action?: Action;
  /** 0..1 Fortschritt der Aktion (während der eigenen Zeile) */
  actionT?: number;
  /** 0..1 Mundöffnung */
  mouth?: number;
  facing?: 'links' | 'rechts';
  /** Figur ist gerade nicht im Fokus (leicht abgedunkelt) */
  dim?: boolean;
}

const INK = '#1a1410';
const SW = 5;

function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt)));
  r = f(r); g = f(g); b = f(b);
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

const BUILD: Record<CharacterLook['build'], { sh: number; wa: number; hip: number; limb: number; head: number }> = {
  schmal: { sh: 0.27, wa: 0.21, hip: 0.22, limb: 0.055, head: 1 },
  athletisch: { sh: 0.33, wa: 0.23, hip: 0.23, limb: 0.065, head: 1 },
  'stämmig': { sh: 0.34, wa: 0.30, hip: 0.29, limb: 0.072, head: 1.03 },
  schwer: { sh: 0.35, wa: 0.37, hip: 0.31, limb: 0.075, head: 1.05 },
  'muskulös': { sh: 0.42, wa: 0.28, hip: 0.27, limb: 0.085, head: 0.98 },
};

interface ArmPose { s: number; e: number } // Schulter- und Ellbogenwinkel in Grad (0 = hängt, + = nach außen)
interface Pose { left: ArmPose; right: ArmPose; headTilt: number; headX: number; headY: number; shoulderLift: number; bodyX: number; crossed?: boolean; fistsUp?: boolean }

function poseFor(action: Action, t: number, frame: number): Pose {
  const base: Pose = { left: { s: 8, e: 6 }, right: { s: 8, e: 6 }, headTilt: 0, headX: 0, headY: 0, shoulderLift: 0, bodyX: 0 };
  const ease = Math.min(1, t * 4); // schnell in die Pose
  const osc = (f: number, a: number) => Math.sin(frame * f) * a;
  switch (action) {
    case 'zeigen':
      return { ...base, right: { s: 8 + 62 * ease, e: 6 + 4 * ease }, headTilt: 3 * ease };
    case 'jubeln':
      return { ...base, left: { s: 8 + 150 * ease + osc(0.5, 6), e: 20 }, right: { s: 8 + 150 * ease + osc(0.5, 6), e: 20 }, headY: -6 * ease, headTilt: osc(0.25, 2) };
    case 'faust_heben':
      return { ...base, right: { s: 8 + 125 * ease, e: 70 * ease }, headTilt: -3 * ease };
    case 'arme_verschraenkt':
      return { ...base, crossed: true, headTilt: -2 };
    case 'kopfschuetteln':
      return { ...base, headX: osc(0.55, 7) * Math.min(1, t * 3) * (1 - Math.max(0, t - 0.7) * 3), headTilt: osc(0.55, 3) };
    case 'nicken':
      return { ...base, headY: Math.abs(osc(0.45, 7)) * (1 - t) };
    case 'seufzen':
      return { ...base, shoulderLift: -6 * Math.sin(Math.PI * Math.min(1, t * 1.5)), headY: 6 * ease, headTilt: 4 * ease, left: { s: 4, e: 2 }, right: { s: 4, e: 2 } };
    case 'achselzucken': {
      const k = Math.sin(Math.PI * Math.min(1, t * 2.2));
      return { ...base, shoulderLift: 12 * k, left: { s: 28 * k + 8, e: -70 * k }, right: { s: 28 * k + 8, e: -70 * k }, headTilt: 5 * k };
    }
    case 'schlagen':
    case 'pratzen': {
      const c = (frame % 12) / 12;
      const jab = c < 0.35 ? Math.sin((c / 0.35) * Math.PI) : 0;
      const c2 = ((frame + 6) % 12) / 12;
      const jab2 = action === 'pratzen' && c2 < 0.35 ? Math.sin((c2 / 0.35) * Math.PI) : 0;
      return { ...base, fistsUp: true, right: { s: 55 + 35 * jab, e: 110 - 105 * jab }, left: { s: 45 + 40 * jab2, e: 115 - 105 * jab2 }, bodyX: 6 * jab, headTilt: 2 };
    }
    case 'auftritt':
      return { ...base, left: { s: 8 + osc(0.35, 14), e: 10 }, right: { s: 8 - osc(0.35, 14), e: 10 } };
    default:
      return { ...base, left: { s: 8 + osc(0.05, 1.5), e: 6 }, right: { s: 8 - osc(0.05, 1.5), e: 6 } };
  }
}

export const CharacterRig: React.FC<RigProps> = ({ look, heightCm, frame, seed = 0, emotion = 'neutral', action = 'keine', actionT = 0, mouth = 0, facing = 'rechts', dim }) => {
  const H = heightCm * 4.2;
  const B = BUILD[look.build];
  const pose = poseFor(action, actionT, frame + seed * 7);
  const dir = facing === 'rechts' ? 1 : -1;

  // Grundmaße
  const headH = H * 0.25 * B.head * (look.ageLook === 'jung' ? 1.02 : 1);
  const headW = headH * (look.build === 'schwer' || look.build === 'muskulös' ? 0.88 : 0.8);
  const hipY = -H * 0.47;
  const shoulderY = -H + headH * 0.96 + H * 0.03 - pose.shoulderLift;
  const shW = H * B.sh, waW = H * B.wa, hipW = H * B.hip;
  const limb = H * B.limb;
  const breathe = Math.sin((frame + seed * 13) * 0.07) * 2.2;
  const headCx = pose.headX + pose.bodyX;
  const headCy = -H + headH / 2 + pose.headY + breathe * 0.6 - pose.shoulderLift * 0.6;

  const top = look.top, bot = look.bottom;
  const sleeveLong = !['tanktop', 'tshirt'].includes(top.type);
  const sleeveColor = top.type === 'tanktop' ? look.skin : top.color;
  const gloved = action === 'schlagen' || action === 'pratzen' || look.accessories.includes('handschuhe');

  /* ---------------------------------------------------------- Arme */
  const ua = H * 0.165, fa = H * 0.155;
  const arm = (side: -1 | 1, p: ArmPose, front: boolean) => {
    const sx = side * (shW / 2 - limb * 0.35) + pose.bodyX;
    const sy = shoulderY + limb * 0.45 + breathe * 0.5;
    const a1 = (-side * p.s * Math.PI) / 180;
    const ex = sx - Math.sin(a1) * ua, ey = sy + Math.cos(a1) * ua;
    const a2 = a1 + (-side * p.e * Math.PI) / 180;
    const hx = ex - Math.sin(a2) * fa, hy = ey + Math.cos(a2) * fa;
    const upper = `M${sx},${sy} L${ex},${ey}`;
    const lower = `M${ex},${ey} L${hx},${hy}`;
    const sleeveEnd = sleeveLong ? 1 : top.type === 'tshirt' ? 0.55 : 0;
    const smx = sx + (ex - sx) * sleeveEnd, smy = sy + (ey - sy) * sleeveEnd;
    const handR = gloved ? limb * 0.95 : limb * 0.62;
    return (
      <g key={`arm${side}${front}`}>
        {/* Haut-Unterlage */}
        <path d={upper} stroke={INK} strokeWidth={limb + SW * 2} strokeLinecap="round" />
        <path d={lower} stroke={INK} strokeWidth={limb * 0.92 + SW * 2} strokeLinecap="round" />
        <path d={upper} stroke={look.skin} strokeWidth={limb} strokeLinecap="round" />
        <path d={lower} stroke={look.skin} strokeWidth={limb * 0.92} strokeLinecap="round" />
        {sleeveEnd > 0 && (
          <path d={`M${sx},${sy} L${smx},${smy}`} stroke={sleeveColor} strokeWidth={limb * 1.08} strokeLinecap="round" />
        )}
        {sleeveLong && (
          <>
            <path d={lower} stroke={top.color} strokeWidth={limb * 1.0} strokeLinecap="round" />
            {top.type === 'trainingsjacke' && (
              <>
                <path d={upper} stroke={top.accent} strokeWidth={limb * 0.18} strokeLinecap="round" transform={`translate(${side * limb * 0.28},0)`} />
                <path d={lower} stroke={top.accent} strokeWidth={limb * 0.18} strokeLinecap="round" transform={`translate(${side * limb * 0.26},0)`} />
              </>
            )}
            <path d={`M${hx - (hx - ex) * 0.08},${hy - (hy - ey) * 0.08} L${hx},${hy}`} stroke={shade(top.color, -0.25)} strokeWidth={limb * 1.02} strokeLinecap="butt" />
          </>
        )}
        <circle cx={hx} cy={hy} r={handR} fill={gloved ? look.gloves : look.skin} stroke={INK} strokeWidth={SW} />
        {gloved && <path d={`M${hx - handR * 0.6},${hy + handR * 0.55} h${handR * 1.2}`} stroke="#f2f2f2" strokeWidth={handR * 0.35} strokeLinecap="round" />}
        {gloved && <ellipse cx={hx - handR * 0.3} cy={hy - handR * 0.35} rx={handR * 0.3} ry={handR * 0.18} fill="#fff" opacity={0.35} />}
      </g>
    );
  };

  /* --------------------------------------------------------- Beine */
  const legLen = -hipY;
  const legW = limb * 1.25;
  const lx = hipW * 0.28;
  const pants = bot.type === 'boxershorts' ? look.skin : bot.color;
  const legs = (
    <g>
      {[-1, 1].map((s) => {
        const x0 = s * lx + pose.bodyX * 0.3;
        const x1 = s * (lx + 4);
        return (
          <g key={s}>
            <path d={`M${x0},${hipY} L${x1},${-legW * 0.4}`} stroke={INK} strokeWidth={legW + SW * 2} strokeLinecap="round" />
            <path d={`M${x0},${hipY} L${x1},${-legW * 0.4}`} stroke={pants} strokeWidth={legW} strokeLinecap="round" />
            {bot.type === 'trainingshose' && <path d={`M${x0 + s * legW * 0.36},${hipY + 10} L${x1 + s * legW * 0.36},${-legW * 0.7}`} stroke={bot.accent} strokeWidth={legW * 0.13} />}
            {bot.type === 'jeans' && <path d={`M${x0 + s * legW * 0.3},${hipY + 30} L${x1 + s * legW * 0.3},${-legW * 0.7}`} stroke={shade(bot.color, 0.25)} strokeWidth={2} strokeDasharray="6 5" />}
            {bot.type === 'stoffhose' && <path d={`M${x0},${hipY + 20} L${x1},${-legW * 0.7}`} stroke={shade(bot.color, -0.2)} strokeWidth={2} />}
            {/* Schuh */}
            <path
              d={`M${x1 - legW * 0.55},${-2} q0,${-legW * 0.75} ${legW * 0.55},${-legW * 0.75} q${legW * 0.75},0 ${legW * 1.05 * (s === dir ? 1.25 : 0.95)},${legW * 0.55} q0,${legW * 0.2} -${legW * 0.15},${legW * 0.2} Z`}
              transform={s === -1 ? `translate(${2 * x1},0) scale(-1,1)` : undefined}
              fill={look.shoes} stroke={INK} strokeWidth={SW} strokeLinejoin="round"
            />
          </g>
        );
      })}
      {bot.type === 'boxershorts' && (
        <path d={`M${-hipW / 2 - 6},${hipY - 20} L${hipW / 2 + 6},${hipY - 20} L${hipW / 2 + 12},${hipY + H * 0.14} L${4},${hipY + H * 0.14} L0,${hipY + H * 0.06} L${-4},${hipY + H * 0.14} L${-hipW / 2 - 12},${hipY + H * 0.14} Z`}
          fill={bot.color} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      )}
    </g>
  );

  /* --------------------------------------------------------- Torso */
  const tx = pose.bodyX;
  const ty = shoulderY + breathe;
  const belly = look.build === 'schwer' ? waW * 0.18 : 0;
  const torsoPath = `M${tx - shW / 2},${ty + limb * 0.3}
    Q${tx - shW / 2},${ty - 6} ${tx - shW / 2 + limb},${ty - 8}
    L${tx + shW / 2 - limb},${ty - 8}
    Q${tx + shW / 2},${ty - 6} ${tx + shW / 2},${ty + limb * 0.3}
    Q${tx + waW / 2 + belly},${(ty + hipY) / 2 + 20} ${tx + hipW / 2 + 2},${hipY + 8}
    L${tx - hipW / 2 - 2},${hipY + 8}
    Q${tx - waW / 2 - belly},${(ty + hipY) / 2 + 20} ${tx - shW / 2},${ty + limb * 0.3} Z`;
  const torsoFill = top.type === 'tanktop' ? top.color : top.color;
  const torso = (
    <g>
      {/* Hüfte / Hosenbund */}
      <path d={`M${tx - hipW / 2 - 3},${hipY - 18} L${tx + hipW / 2 + 3},${hipY - 18} L${tx + hipW / 2 + 4},${hipY + 26} L${tx - hipW / 2 - 4},${hipY + 26} Z`} fill={bot.type === 'boxershorts' ? bot.color : bot.color} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      {top.type === 'tanktop' && (
        <path d={torsoPath} fill={look.skin} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      )}
      {top.type === 'tanktop' ? (
        <path d={`M${tx - shW / 2 + limb * 0.9},${ty - 6} Q${tx - shW * 0.22},${ty + H * 0.07} ${tx - shW / 2 + limb * 0.6},${ty + H * 0.1}
          Q${tx - waW / 2 - belly},${(ty + hipY) / 2 + 20} ${tx - hipW / 2 - 2},${hipY + 8} L${tx + hipW / 2 + 2},${hipY + 8}
          Q${tx + waW / 2 + belly},${(ty + hipY) / 2 + 20} ${tx + shW / 2 - limb * 0.6},${ty + H * 0.1}
          Q${tx + shW * 0.22},${ty + H * 0.07} ${tx + shW / 2 - limb * 0.9},${ty - 6}
          Q${tx},${ty + H * 0.06} ${tx - shW / 2 + limb * 0.9},${ty - 6} Z`} fill={torsoFill} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      ) : (
        <path d={torsoPath} fill={torsoFill} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      )}
      {/* Schattierung für Tiefe */}
      <path d={`M${tx + dir * shW * 0.18},${ty} Q${tx + dir * (waW / 2 + belly)},${(ty + hipY) / 2 + 20} ${tx + dir * hipW / 2},${hipY + 8} L${tx + dir * (hipW / 2 - 18)},${hipY + 8} Q${tx + dir * (waW / 2 + belly - 26)},${(ty + hipY) / 2 + 10} ${tx + dir * shW * 0.1},${ty + 4} Z`} fill="#000" opacity={0.12} />
      {topDetails(look, tx, ty, shW, waW, hipW, hipY, H, limb, belly)}
      {bot.type === 'latzhose' && (
        <g>
          <path d={`M${tx - waW * 0.36},${ty + H * 0.1} L${tx + waW * 0.36},${ty + H * 0.1} L${tx + hipW / 2 + 2},${hipY + 10} L${tx - hipW / 2 - 2},${hipY + 10} Z`} fill={bot.color} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
          <rect x={tx - waW * 0.17} y={ty + H * 0.13} width={waW * 0.34} height={H * 0.06} rx={6} fill={shade(bot.color, -0.15)} stroke={INK} strokeWidth={3} />
          {[-1, 1].map((s) => (
            <g key={s}>
              <path d={`M${tx + s * waW * 0.3},${ty + H * 0.1} L${tx + s * shW * 0.3},${ty - 6}`} stroke={INK} strokeWidth={limb * 0.42 + 6} />
              <path d={`M${tx + s * waW * 0.3},${ty + H * 0.1} L${tx + s * shW * 0.3},${ty - 6}`} stroke={bot.color} strokeWidth={limb * 0.42} />
              <circle cx={tx + s * waW * 0.3} cy={ty + H * 0.1} r={6} fill="#d8c27a" stroke={INK} strokeWidth={2.5} />
            </g>
          ))}
        </g>
      )}
      {look.accessories.includes('schluesselbund') && (
        <g transform={`translate(${tx + hipW * 0.32},${hipY + 6})`}>
          <path d="M0,0 v18" stroke="#888" strokeWidth={3} />
          <circle cx={0} cy={24} r={9} fill="none" stroke="#9a9a9a" strokeWidth={4} />
          <rect x={-3} y={30} width={6} height={22} fill="#c9b05a" stroke={INK} strokeWidth={2} />
          <rect x={5} y={28} width={6} height={18} fill="#bdbdbd" stroke={INK} strokeWidth={2} transform="rotate(-20 8 28)" />
        </g>
      )}
    </g>
  );

  /* --------------------------------------------------------- Kopf */
  const head = (
    <g transform={`rotate(${pose.headTilt * dir} ${headCx} ${headCy + headH * 0.4})`}>
      <Head look={look} cx={headCx} cy={headCy} w={headW} h={headH} emotion={emotion} mouth={mouth} dir={dir} frame={frame} seed={seed} />
    </g>
  );

  const neck = (
    <path d={`M${headCx},${headCy + headH * 0.35} L${tx},${ty + 6}`} stroke={INK} strokeWidth={headW * 0.42 + SW * 2} strokeLinecap="round" />
  );
  const neckFill = (
    <path d={`M${headCx},${headCy + headH * 0.35} L${tx},${ty + 6}`} stroke={shade(look.skin, -0.12)} strokeWidth={headW * 0.42} strokeLinecap="round" />
  );

  // vorderer / hinterer Arm je nach Blickrichtung
  const back: -1 | 1 = dir === 1 ? -1 : 1;
  const front: -1 | 1 = (-back) as -1 | 1;
  const poseOf = (s: -1 | 1) => (s === 1 ? pose.right : pose.left);
  // Zeigen/Faust immer mit dem Arm in Blickrichtung
  const armPose = (s: -1 | 1) => {
    if (action === 'zeigen' || action === 'faust_heben') return s === dir ? pose.right : pose.left;
    return poseOf(s);
  };

  const crossed = pose.crossed && (
    <g>
      <path d={`M${tx - shW * 0.42},${ty + H * 0.1} Q${tx},${ty + H * 0.2} ${tx + shW * 0.42},${ty + H * 0.1}`} stroke={INK} strokeWidth={limb * 1.1 + SW * 2} strokeLinecap="round" fill="none" />
      <path d={`M${tx - shW * 0.42},${ty + H * 0.1} Q${tx},${ty + H * 0.2} ${tx + shW * 0.42},${ty + H * 0.1}`} stroke={sleeveLong ? top.color : look.skin} strokeWidth={limb * 1.1} strokeLinecap="round" fill="none" />
      <path d={`M${tx + shW * 0.42},${ty + H * 0.16} Q${tx},${ty + H * 0.25} ${tx - shW * 0.42},${ty + H * 0.16}`} stroke={INK} strokeWidth={limb * 1.1 + SW * 2} strokeLinecap="round" fill="none" />
      <path d={`M${tx + shW * 0.42},${ty + H * 0.16} Q${tx},${ty + H * 0.25} ${tx - shW * 0.42},${ty + H * 0.16}`} stroke={sleeveLong ? shade(top.color, -0.08) : look.skin} strokeWidth={limb * 1.1} strokeLinecap="round" fill="none" />
      {[-1, 1].map((s) => (
        <path key={s} d={`M${tx + s * shW / 2},${ty + limb * 0.4} L${tx + s * shW * 0.46},${ty + H * 0.13}`} stroke={sleeveLong ? top.color : look.skin} strokeWidth={limb} strokeLinecap="round" />
      ))}
    </g>
  );

  return (
    <g style={{ filter: dim ? 'brightness(0.82) saturate(0.9)' : undefined }}>
      {/* Bodenschatten */}
      <ellipse cx={0} cy={0} rx={hipW * 0.95} ry={16} fill="#000" opacity={0.28} />
      {!pose.crossed && arm(back, armPose(back), false)}
      {legs}
      {neck}
      {neckFill}
      {torso}
      {accessoryNeck(look, headCx, headCy, headH, tx, ty, shW, H)}
      {pose.crossed ? crossed : arm(front, armPose(front), true)}
      {head}
    </g>
  );
};

/* ----------------------------------------------------------- Oberteil-Details */
function topDetails(look: CharacterLook, tx: number, ty: number, shW: number, waW: number, hipW: number, hipY: number, H: number, limb: number, belly: number) {
  const t = look.top;
  const midY = (ty + hipY) / 2;
  switch (t.type) {
    case 'trainingsjacke':
      return (
        <g>
          <path d={`M${tx},${ty - 4} L${tx},${hipY + 6}`} stroke={shade(t.color, -0.35)} strokeWidth={4} />
          <path d={`M${tx},${ty - 4} L${tx},${hipY + 6}`} stroke="#cfcfcf" strokeWidth={1.5} strokeDasharray="3 4" />
          <path d={`M${tx - 26},${ty - 8} L${tx},${ty + 22} L${tx + 26},${ty - 8}`} fill="none" stroke={INK} strokeWidth={4} />
          <path d={`M${tx - hipW / 2 - 2},${hipY - 2} L${tx + hipW / 2 + 2},${hipY - 2}`} stroke={t.accent} strokeWidth={10} />
          <path d={`M${tx - shW / 2 + 4},${ty + 10} Q${tx - waW / 2 - belly + 8},${midY + 20} ${tx - hipW / 2 + 4},${hipY - 8}`} fill="none" stroke={t.accent} strokeWidth={6} />
          <path d={`M${tx + shW / 2 - 4},${ty + 10} Q${tx + waW / 2 + belly - 8},${midY + 20} ${tx + hipW / 2 - 4},${hipY - 8}`} fill="none" stroke={t.accent} strokeWidth={6} />
          {t.print && <text x={tx - shW * 0.2} y={ty + H * 0.075} fontFamily="Anton, Impact, sans-serif" fontSize={H * 0.032} fill={t.accent} textAnchor="middle">{t.print}</text>}
        </g>
      );
    case 'hoodie':
      return (
        <g>
          <path d={`M${tx - shW * 0.32},${ty - 10} Q${tx},${ty + 34} ${tx + shW * 0.32},${ty - 10}`} fill={shade(t.color, -0.18)} stroke={INK} strokeWidth={4} />
          <path d={`M${tx - 10},${ty + 18} l-4,${H * 0.07} M${tx + 10},${ty + 18} l4,${H * 0.07}`} stroke={t.accent} strokeWidth={4} strokeLinecap="round" />
          <path d={`M${tx - waW * 0.34},${midY + 34} L${tx + waW * 0.34},${midY + 34} L${tx + waW * 0.42},${hipY - 6} L${tx - waW * 0.42},${hipY - 6} Z`} fill={shade(t.color, -0.1)} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
          <path d={`M${tx - hipW / 2 - 2},${hipY + 2} L${tx + hipW / 2 + 2},${hipY + 2}`} stroke={shade(t.color, -0.25)} strokeWidth={12} />
          <circle cx={tx + waW * 0.18} cy={ty + H * 0.07} r={H * 0.018} fill={t.accent} stroke={INK} strokeWidth={3} />
        </g>
      );
    case 'hemd':
      return (
        <g>
          <path d={`M${tx - 30},${ty - 8} L${tx},${ty + 20} L${tx + 30},${ty - 8} L${tx + 14},${ty + 30} L${tx},${ty + 20} L${tx - 14},${ty + 30} Z`} fill={shade(t.color, 0.15)} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
          {[0, 1, 2, 3].map((i) => <circle key={i} cx={tx} cy={ty + 40 + i * H * 0.05} r={4} fill={shade(t.color, -0.4)} />)}
          {[1, 2, 3].map((i) => <path key={i} d={`M${tx - shW / 2 + 10},${ty + i * H * 0.06} L${tx + shW / 2 - 10},${ty + i * H * 0.06}`} stroke={t.accent} strokeWidth={3} opacity={0.6} />)}
        </g>
      );
    case 'sakko':
      return (
        <g>
          <path d={`M${tx - 34},${ty - 8} L${tx},${ty + H * 0.16} L${tx + 34},${ty - 8} Z`} fill={t.accent} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
          <path d={`M${tx - 34},${ty - 8} L${tx - 8},${ty + H * 0.17} L${tx - waW * 0.3},${ty + H * 0.06} Z`} fill={shade(t.color, -0.15)} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
          <path d={`M${tx + 34},${ty - 8} L${tx + 8},${ty + H * 0.17} L${tx + waW * 0.3},${ty + H * 0.06} Z`} fill={shade(t.color, -0.15)} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
          <circle cx={tx} cy={ty + H * 0.2} r={5} fill={INK} />
          <path d={`M${tx - shW * 0.32},${ty + H * 0.08} h22`} stroke="#e8e8e8" strokeWidth={6} strokeLinecap="round" />
        </g>
      );
    case 'tshirt':
      return (
        <g>
          <path d={`M${tx - 26},${ty - 8} Q${tx},${ty + 18} ${tx + 26},${ty - 8}`} fill={shade(t.color, -0.25)} stroke={INK} strokeWidth={4} />
          {t.print && <text x={tx} y={ty + H * 0.11} fontFamily="Anton, Impact, sans-serif" fontSize={H * 0.04} fill={t.accent} textAnchor="middle">{t.print}</text>}
        </g>
      );
    case 'strickjacke':
      return (
        <g>
          <path d={`M${tx},${ty + 10} L${tx},${hipY + 6}`} stroke={INK} strokeWidth={4} />
          {[0, 1, 2].map((i) => <circle key={i} cx={tx + 10} cy={ty + 50 + i * H * 0.06} r={5} fill={t.accent} stroke={INK} strokeWidth={2} />)}
        </g>
      );
    default:
      return null;
  }
}

function accessoryNeck(look: CharacterLook, hx: number, hy: number, hh: number, tx: number, ty: number, shW: number, H: number) {
  const a = look.accessories;
  return (
    <g>
      {a.includes('goldkette') && <path d={`M${tx - shW * 0.16},${ty - 4} Q${tx},${ty + H * 0.07} ${tx + shW * 0.16},${ty - 4}`} fill="none" stroke="#d9b13b" strokeWidth={6} strokeDasharray="7 3" />}
      {a.includes('pfeife') && (
        <g>
          <path d={`M${tx - shW * 0.14},${ty - 4} Q${tx},${ty + H * 0.11} ${tx + shW * 0.14},${ty - 4}`} fill="none" stroke="#e05a1a" strokeWidth={3} />
          <rect x={tx - 12} y={ty + H * 0.085} width={26} height={13} rx={5} fill="#c9c9c9" stroke={INK} strokeWidth={3} />
        </g>
      )}
      {a.includes('kopfhoerer') && (
        <path d={`M${tx - shW * 0.2},${ty + 2} Q${tx},${ty + 34} ${tx + shW * 0.2},${ty + 2}`} fill="none" stroke="#222" strokeWidth={10} strokeLinecap="round" />
      )}
      {a.includes('handtuch') && <path d={`M${tx - shW * 0.4},${ty - 4} Q${tx},${ty + 20} ${tx + shW * 0.4},${ty - 4} l-12,${H * 0.12} M${tx - shW * 0.4},${ty - 4} l10,${H * 0.12}`} fill="none" stroke="#f3f3f3" strokeWidth={16} strokeLinecap="round" />}
    </g>
  );
}

/* ------------------------------------------------------------------ Kopf */
interface HeadProps { look: CharacterLook; cx: number; cy: number; w: number; h: number; emotion: Emotion; mouth: number; dir: number; frame: number; seed: number }

const Head: React.FC<HeadProps> = ({ look, cx, cy, w, h, emotion, mouth, dir, frame, seed }) => {
  const skinD = shade(look.skin, -0.18);
  const jaw = look.build === 'muskulös' || look.build === 'schwer' ? 1.06 : look.ageLook === 'jung' ? 0.94 : 1;
  const top = cy - h / 2, bottom = cy + h / 2;
  const faceShape = `M${cx},${top}
    C${cx + w * 0.62},${top} ${cx + w * 0.56},${cy + h * 0.1} ${cx + w * 0.5 * jaw},${cy + h * 0.2}
    C${cx + w * 0.44 * jaw},${bottom - h * 0.02} ${cx + w * 0.2},${bottom} ${cx},${bottom}
    C${cx - w * 0.2},${bottom} ${cx - w * 0.44 * jaw},${bottom - h * 0.02} ${cx - w * 0.5 * jaw},${cy + h * 0.2}
    C${cx - w * 0.56},${cy + h * 0.1} ${cx - w * 0.62},${top} ${cx},${top} Z`;

  // Blinzeln
  const period = 105 + (seed % 5) * 9;
  const bf = (frame + seed * 31) % period;
  const blink = bf > period - 5 ? (bf > period - 3 ? 0.15 : 0.5) : 1;
  const eyeY = cy - h * 0.02;
  const eyeDX = w * 0.2;
  const look2 = dir * w * 0.035;
  const eyeR = h * 0.085;
  const surprised = emotion === 'ueberrascht';
  const er = surprised ? eyeR * 1.15 : eyeR;

  // Brauen je nach Emotion
  const browAng: Record<Emotion, number> = { neutral: 0, froh: -4, wuetend: 16, traurig: -14, ueberrascht: -8, entschlossen: 10, verlegen: -10, stolz: -3 };
  const browLift: Record<Emotion, number> = { neutral: 0, froh: -3, wuetend: 4, traurig: -2, ueberrascht: -12, entschlossen: 2, verlegen: -5, stolz: -4 };
  const bw = look.brows === 'buschig' ? h * 0.05 : look.brows === 'streng' ? h * 0.04 : h * 0.025;
  const by = eyeY - er - h * 0.06 + browLift[emotion];

  // Mund
  const my = cy + h * 0.27;
  const mw = w * (emotion === 'froh' || emotion === 'stolz' ? 0.3 : 0.24);
  const open = Math.max(0, Math.min(1, mouth));
  let mouthEl: React.ReactNode;
  if (open > 0.08) {
    const oh = h * (0.03 + 0.1 * open);
    mouthEl = (
      <g>
        <path d={`M${cx - mw / 2},${my} Q${cx},${my - oh * 0.35} ${cx + mw / 2},${my} Q${cx},${my + oh * 1.4} ${cx - mw / 2},${my} Z`} fill="#5a1e1e" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        <path d={`M${cx - mw * 0.32},${my + oh * 0.75} Q${cx},${my + oh * 1.15} ${cx + mw * 0.32},${my + oh * 0.75}`} fill="none" stroke="#d9686a" strokeWidth={5} />
        <path d={`M${cx - mw * 0.36},${my + 1} h${mw * 0.72}`} stroke="#fff" strokeWidth={4} />
      </g>
    );
  } else {
    const curve: Record<Emotion, number> = { neutral: 2, froh: 12, wuetend: -6, traurig: -9, ueberrascht: 0, entschlossen: -2, verlegen: 4, stolz: 9 };
    const c = curve[emotion];
    mouthEl = surprised
      ? <ellipse cx={cx} cy={my + 4} rx={mw * 0.18} ry={h * 0.035} fill="#5a1e1e" stroke={INK} strokeWidth={4} />
      : <path d={`M${cx - mw / 2},${my} Q${cx},${my + c} ${cx + mw / 2},${my - (emotion === 'verlegen' ? 5 : 0)}`} fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />;
  }

  // Nase
  const ny = cy + h * 0.12;
  const nx = cx + dir * w * 0.03;
  const noses: Record<CharacterLook['nose'], React.ReactNode> = {
    klein: <path d={`M${nx},${ny - h * 0.07} q${dir * 10},${h * 0.06} 0,${h * 0.075}`} fill="none" stroke={skinD} strokeWidth={5} strokeLinecap="round" />,
    rund: <ellipse cx={nx} cy={ny} rx={w * 0.1} ry={h * 0.065} fill={shade(look.skin, -0.06)} stroke={INK} strokeWidth={4} />,
    breit: <path d={`M${nx - w * 0.12},${ny + h * 0.03} q${w * 0.12},${h * 0.05} ${w * 0.24},0 q-${w * 0.04},-${h * 0.1} -${w * 0.12},-${h * 0.13} q-${w * 0.08},${h * 0.03} -${w * 0.12},${h * 0.13} Z`} fill={shade(look.skin, -0.06)} stroke={INK} strokeWidth={4} strokeLinejoin="round" />,
    krumm: <path d={`M${nx - dir * 4},${ny - h * 0.1} q${dir * 16},${h * 0.03} ${dir * 8},${h * 0.07} q${dir * 14},${h * 0.03} ${dir * 6},${h * 0.07} q${-dir * 10},${h * 0.02} ${-dir * 20},${-h * 0.01} Z`} fill={shade(look.skin, -0.06)} stroke={INK} strokeWidth={4} strokeLinejoin="round" />,
    spitz: <path d={`M${nx},${ny - h * 0.09} L${nx + dir * w * 0.11},${ny + h * 0.04} L${nx - dir * 2},${ny + h * 0.05}`} fill={shade(look.skin, -0.04)} stroke={INK} strokeWidth={4} strokeLinejoin="round" />,
  };

  const ear = (s: number) => {
    const ex = cx + s * w * 0.5 * jaw, ey = cy + h * 0.05;
    return (
      <g key={s}>
        <ellipse cx={ex} cy={ey} rx={w * 0.09} ry={h * 0.11} fill={look.skin} stroke={INK} strokeWidth={SW} />
        <path d={`M${ex + s * 2},${ey - h * 0.05} q${s * w * 0.04},${h * 0.05} 0,${h * 0.09}`} fill="none" stroke={skinD} strokeWidth={4} />
        {look.cauliflowerEar && <circle cx={ex + s * w * 0.02} cy={ey - h * 0.03} r={w * 0.045} fill={shade(look.skin, -0.12)} stroke={INK} strokeWidth={3} />}
      </g>
    );
  };

  const a = look.accessories;
  return (
    <g>
      {hairBack(look, cx, cy, w, h)}
      {ear(-1)}{ear(1)}
      <path d={faceShape} fill={look.skin} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      {/* Wangenschatten */}
      <path d={`M${cx + dir * w * 0.47},${cy - h * 0.1} Q${cx + dir * w * 0.44},${cy + h * 0.36} ${cx + dir * w * 0.05},${bottom - 3}`} fill="none" stroke={skinD} strokeWidth={10} opacity={0.35} strokeLinecap="round" />
      {(emotion === 'verlegen' || emotion === 'froh') && (
        <g opacity={emotion === 'verlegen' ? 0.55 : 0.3}>
          <ellipse cx={cx - w * 0.28} cy={cy + h * 0.15} rx={w * 0.09} ry={h * 0.035} fill="#e5737a" />
          <ellipse cx={cx + w * 0.28} cy={cy + h * 0.15} rx={w * 0.09} ry={h * 0.035} fill="#e5737a" />
        </g>
      )}
      {look.ageLook === 'alt' && (
        <g stroke={skinD} strokeWidth={3.5} fill="none" strokeLinecap="round">
          <path d={`M${cx - w * 0.22},${cy - h * 0.26} q${w * 0.22},-8 ${w * 0.44},0`} />
          <path d={`M${cx - w * 0.17},${cy - h * 0.21} q${w * 0.17},-6 ${w * 0.34},0`} />
          <path d={`M${cx - w * 0.36},${eyeY + 4} l-10,6 M${cx + w * 0.36},${eyeY + 4} l10,6`} />
          <path d={`M${cx - w * 0.18},${cy + h * 0.2} q-8,10 -4,22 M${cx + w * 0.18},${cy + h * 0.2} q8,10 4,22`} />
        </g>
      )}
      {/* Augen */}
      {[-1, 1].map((s) => (
        <g key={s}>
          <ellipse cx={cx + s * eyeDX} cy={eyeY} rx={er * 0.92} ry={er * blink} fill="#fff" stroke={INK} strokeWidth={4} />
          {blink > 0.4 && (
            <g>
              <circle cx={cx + s * eyeDX + look2} cy={eyeY + 2} r={er * 0.5} fill={look.eyeColor} />
              <circle cx={cx + s * eyeDX + look2} cy={eyeY + 2} r={er * 0.27} fill={INK} />
              <circle cx={cx + s * eyeDX + look2 + er * 0.18} cy={eyeY - er * 0.15} r={er * 0.13} fill="#fff" />
            </g>
          )}
          {(look.ageLook === 'alt' || emotion === 'entschlossen' || emotion === 'wuetend') && (
            <path d={`M${cx + s * eyeDX - er},${eyeY - er * 0.55} q${er},${-er * 0.25} ${er * 2},0`} fill="none" stroke={INK} strokeWidth={3} />
          )}
        </g>
      ))}
      {/* Brauen */}
      {[-1, 1].map((s) => (
        <path key={s}
          d={`M${cx + s * (eyeDX - er * 1.05)},${by} L${cx + s * (eyeDX + er * 1.05)},${by - h * 0.012}`}
          transform={`rotate(${s * browAng[emotion] * -1} ${cx + s * eyeDX} ${by})`}
          stroke={look.facialHair.style !== 'keiner' && look.hair.style === 'glatze' ? look.facialHair.color : look.hair.color === '#d9d4cc' ? '#bdb6aa' : shade(look.hair.color, -0.1)}
          strokeWidth={bw} strokeLinecap="round" />
      ))}
      {noses[look.nose]}
      {facialHair(look, cx, cy, w, h, my, mw, open)}
      {mouthEl}
      {look.facialHair.style === 'walross' || look.facialHair.style === 'schnurrbart' ? mustache(look, cx, my, w, h, dir) : null}
      {a.includes('narbe') && <path d={`M${cx - dir * w * 0.32},${cy - h * 0.05} l${dir * 14},${h * 0.13}`} stroke="#b4645a" strokeWidth={4} />}
      {a.includes('pflaster') && <rect x={cx + dir * w * 0.06 - 15} y={cy - h * 0.2} width={30} height={13} rx={4} fill="#f2d3a8" stroke={INK} strokeWidth={3} transform={`rotate(${dir * 20} ${cx} ${cy - h * 0.2})`} />}
      {a.includes('zahnstocher') && open < 0.1 && <path d={`M${cx + dir * mw * 0.45},${my} l${dir * 28},-8`} stroke="#d9b67a" strokeWidth={4} strokeLinecap="round" />}
      {hairFront(look, cx, cy, w, h)}
      {a.includes('stirnband') && <path d={`M${cx - w * 0.52},${top + h * 0.22} Q${cx},${top + h * 0.15} ${cx + w * 0.52},${top + h * 0.22}`} stroke={look.top.accent} strokeWidth={h * 0.07} fill="none" />}
      {a.includes('muetze') && (
        <g>
          <path d={`M${cx - w * 0.56},${top + h * 0.2} Q${cx - w * 0.5},${top - h * 0.12} ${cx},${top - h * 0.12} Q${cx + w * 0.55},${top - h * 0.12} ${cx + w * 0.58},${top + h * 0.18} Z`} fill="#6b5a45" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
          <path d={`M${cx + dir * w * 0.1},${top + h * 0.19} Q${cx + dir * w * 0.6},${top + h * 0.12} ${cx + dir * w * 0.78},${top + h * 0.22} Q${cx + dir * w * 0.5},${top + h * 0.27} ${cx - dir * w * 0.55},${top + h * 0.22}`} fill="#58493a" stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
          <path d={`M${cx - w * 0.3},${top} l${w * 0.6},0`} stroke="#4c3f30" strokeWidth={3} strokeDasharray="4 6" />
        </g>
      )}
      {a.includes('brille') && (
        <g fill="rgba(200,230,255,0.18)" stroke={INK} strokeWidth={4}>
          <rect x={cx - eyeDX - er * 1.25} y={eyeY - er * 1.05} width={er * 2.5} height={er * 2.0} rx={er * 0.5} />
          <rect x={cx + eyeDX - er * 1.25} y={eyeY - er * 1.05} width={er * 2.5} height={er * 2.0} rx={er * 0.5} />
          <path d={`M${cx - eyeDX + er * 1.25},${eyeY - er * 0.2} L${cx + eyeDX - er * 1.25},${eyeY - er * 0.2}`} fill="none" />
        </g>
      )}
      {a.includes('kopfhoerer') && null}
    </g>
  );
};

function mustache(look: CharacterLook, cx: number, my: number, w: number, h: number, dir: number) {
  const c = look.facialHair.color;
  if (look.facialHair.style === 'walross') {
    return (
      <path d={`M${cx},${my - h * 0.085}
        C${cx + w * 0.18},${my - h * 0.12} ${cx + w * 0.36},${my - h * 0.06} ${cx + w * 0.34},${my + h * 0.06}
        C${cx + w * 0.26},${my + h * 0.02} ${cx + w * 0.2},${my + h * 0.04} ${cx + w * 0.12},${my + h * 0.01}
        C${cx + w * 0.06},${my - h * 0.01} ${cx},${my - h * 0.02} ${cx},${my - h * 0.02}
        C${cx},${my - h * 0.02} ${cx - w * 0.06},${my - h * 0.01} ${cx - w * 0.12},${my + h * 0.01}
        C${cx - w * 0.2},${my + h * 0.04} ${cx - w * 0.26},${my + h * 0.02} ${cx - w * 0.34},${my + h * 0.06}
        C${cx - w * 0.36},${my - h * 0.06} ${cx - w * 0.18},${my - h * 0.12} ${cx},${my - h * 0.085} Z`}
        fill={c} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
    );
  }
  return <path d={`M${cx - w * 0.2},${my - h * 0.015} Q${cx},${my - h * 0.09} ${cx + w * 0.2},${my - h * 0.015} Q${cx},${my - h * 0.04} ${cx - w * 0.2},${my - h * 0.015} Z`} fill={c} stroke={INK} strokeWidth={3.5} />;
}

function facialHair(look: CharacterLook, cx: number, cy: number, w: number, h: number, my: number, mw: number, open: number) {
  const c = look.facialHair.color;
  const bottom = cy + h / 2;
  switch (look.facialHair.style) {
    case 'vollbart':
      return (
        <path d={`M${cx - w * 0.5},${cy + h * 0.02}
          C${cx - w * 0.5},${cy + h * 0.3} ${cx - w * 0.32},${bottom + h * 0.1} ${cx},${bottom + h * 0.1}
          C${cx + w * 0.32},${bottom + h * 0.1} ${cx + w * 0.5},${cy + h * 0.3} ${cx + w * 0.5},${cy + h * 0.02}
          C${cx + w * 0.4},${cy + h * 0.16} ${cx + w * 0.2},${my - h * 0.06} ${cx},${my - h * 0.07}
          C${cx - w * 0.2},${my - h * 0.06} ${cx - w * 0.4},${cy + h * 0.16} ${cx - w * 0.5},${cy + h * 0.02} Z`}
          fill={c} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
      );
    case 'kinnbart':
      return <path d={`M${cx - w * 0.14},${my + h * 0.06} Q${cx},${bottom + h * 0.08} ${cx + w * 0.14},${my + h * 0.06} Q${cx},${my + h * 0.1} ${cx - w * 0.14},${my + h * 0.06} Z`} fill={c} stroke={INK} strokeWidth={3.5} />;
    case 'stoppeln':
      return (
        <g fill={c} opacity={0.55}>
          {Array.from({ length: 28 }).map((_, i) => {
            const a = (i / 28) * Math.PI;
            return <circle key={i} cx={cx + Math.cos(a) * w * (0.32 + (i % 3) * 0.04)} cy={cy + h * 0.2 + Math.sin(a) * h * (0.22 + (i % 2) * 0.04)} r={2.2} />;
          })}
        </g>
      );
    case 'walross':
    case 'schnurrbart':
    case 'keiner':
    default:
      void mw; void open;
      return null;
  }
}

function hairBack(look: CharacterLook, cx: number, cy: number, w: number, h: number) {
  const c = look.hair.color;
  const top = cy - h / 2;
  switch (look.hair.style) {
    case 'zopf':
      return <path d={`M${cx + w * 0.3},${top + h * 0.2} q${w * 0.5},${h * 0.2} ${w * 0.3},${h * 0.75}`} stroke={c} strokeWidth={w * 0.18} fill="none" strokeLinecap="round" />;
    case 'afro':
      return <circle cx={cx} cy={top + h * 0.25} r={w * 0.78} fill={c} stroke={INK} strokeWidth={SW} />;
    case 'locken':
      return (
        <g fill={c} stroke={INK} strokeWidth={4}>
          {[-0.45, -0.25, 0, 0.25, 0.45].map((k, i) => <circle key={i} cx={cx + k * w} cy={top + h * 0.1 - Math.cos(k * 2) * h * 0.06} r={w * 0.2} />)}
        </g>
      );
    default:
      return null;
  }
}

function hairFront(look: CharacterLook, cx: number, cy: number, w: number, h: number) {
  const c = look.hair.color;
  const top = cy - h / 2;
  const capOn = look.accessories.includes('muetze');
  switch (look.hair.style) {
    case 'glatze':
      return <ellipse cx={cx - w * 0.15} cy={top + h * 0.12} rx={w * 0.12} ry={h * 0.04} fill="#fff" opacity={0.35} />;
    case 'haarkranz':
      return (
        <g>
          <ellipse cx={cx - w * 0.12} cy={top + h * 0.1} rx={w * 0.14} ry={h * 0.045} fill="#fff" opacity={0.35} />
          {[-1, 1].map((s) => (
            <path key={s} d={`M${cx + s * w * 0.47},${cy - h * 0.16} Q${cx + s * w * 0.66},${cy - h * 0.1} ${cx + s * w * 0.6},${cy + h * 0.02} Q${cx + s * w * 0.66},${cy + h * 0.1} ${cx + s * w * 0.52},${cy + h * 0.16} Q${cx + s * w * 0.47},${cy} ${cx + s * w * 0.47},${cy - h * 0.16} Z`} fill={c} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
          ))}
        </g>
      );
    case 'stoppel':
      return (
        <g>
          <path d={`M${cx - w * 0.53},${cy - h * 0.02} C${cx - w * 0.6},${top - h * 0.06} ${cx + w * 0.6},${top - h * 0.06} ${cx + w * 0.53},${cy - h * 0.02} L${cx + w * 0.48},${cy - h * 0.06} Q${cx + w * 0.42},${top + h * 0.26} ${cx + w * 0.2},${top + h * 0.27} Q${cx},${top + h * 0.3} ${cx - w * 0.2},${top + h * 0.27} Q${cx - w * 0.42},${top + h * 0.26} ${cx - w * 0.48},${cy - h * 0.06} Z`} fill={c} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
          {Array.from({ length: 16 }).map((_, i) => <circle key={i} cx={cx + (((i * 37) % 17) / 17 - 0.5) * w * 0.8} cy={top + h * (0.06 + ((i * 13) % 7) * 0.018)} r={2} fill={shade(c, -0.35)} />)}
        </g>
      );
    case 'kurz':
      if (capOn) return <path d={`M${cx - w * 0.52},${cy - h * 0.05} q-4,-${h * 0.12} 4,-${h * 0.2} M${cx + w * 0.52},${cy - h * 0.05} q4,-${h * 0.12} -4,-${h * 0.2}`} stroke={c} strokeWidth={10} strokeLinecap="round" />;
      return <path d={`M${cx - w * 0.54},${cy - h * 0.02} C${cx - w * 0.62},${top - h * 0.08} ${cx + w * 0.62},${top - h * 0.08} ${cx + w * 0.54},${cy - h * 0.02} L${cx + w * 0.42},${top + h * 0.16} Q${cx},${top + h * 0.08} ${cx - w * 0.42},${top + h * 0.16} Z`} fill={c} stroke={INK} strokeWidth={4} strokeLinejoin="round" />;
    case 'zurueckgegelt':
      return (
        <g>
          <path d={`M${cx - w * 0.54},${cy - h * 0.04} C${cx - w * 0.6},${top - h * 0.12} ${cx + w * 0.6},${top - h * 0.12} ${cx + w * 0.54},${cy - h * 0.04} C${cx + w * 0.4},${top + h * 0.1} ${cx - w * 0.4},${top + h * 0.1} ${cx - w * 0.54},${cy - h * 0.04} Z`} fill={c} stroke={INK} strokeWidth={4} />
          <path d={`M${cx - w * 0.3},${top + h * 0.02} q${w * 0.3},-${h * 0.04} ${w * 0.6},0`} stroke="#fff" strokeWidth={4} opacity={0.35} fill="none" />
        </g>
      );
    case 'seitenscheitel':
      return <path d={`M${cx - w * 0.54},${cy - h * 0.02} C${cx - w * 0.6},${top - h * 0.1} ${cx + w * 0.6},${top - h * 0.1} ${cx + w * 0.54},${cy - h * 0.02} L${cx + w * 0.45},${top + h * 0.2} Q${cx - w * 0.1},${top + h * 0.22} ${cx - w * 0.25},${top + h * 0.08} Q${cx - w * 0.4},${top + h * 0.18} ${cx - w * 0.54},${cy - h * 0.02} Z`} fill={c} stroke={INK} strokeWidth={4} strokeLinejoin="round" />;
    case 'locken':
      return (
        <g fill={c} stroke={INK} strokeWidth={4}>
          {[-0.36, -0.12, 0.12, 0.36].map((k, i) => <circle key={i} cx={cx + k * w} cy={top + h * 0.12} r={w * 0.16} />)}
        </g>
      );
    case 'irokese':
      return <path d={`M${cx - w * 0.1},${top + h * 0.1} L${cx - w * 0.06},${top - h * 0.22} L${cx + w * 0.06},${top - h * 0.22} L${cx + w * 0.1},${top + h * 0.1} Z`} fill={c} stroke={INK} strokeWidth={4} />;
    case 'dutt':
      return (
        <g>
          <circle cx={cx} cy={top - h * 0.06} r={w * 0.17} fill={c} stroke={INK} strokeWidth={4} />
          <path d={`M${cx - w * 0.54},${cy - h * 0.02} C${cx - w * 0.6},${top - h * 0.06} ${cx + w * 0.6},${top - h * 0.06} ${cx + w * 0.54},${cy - h * 0.02} Q${cx},${top + h * 0.12} ${cx - w * 0.54},${cy - h * 0.02} Z`} fill={c} stroke={INK} strokeWidth={4} />
        </g>
      );
    case 'zopf':
    case 'afro':
      return <path d={`M${cx - w * 0.54},${cy - h * 0.02} C${cx - w * 0.6},${top - h * 0.08} ${cx + w * 0.6},${top - h * 0.08} ${cx + w * 0.54},${cy - h * 0.02} Q${cx},${top + h * 0.14} ${cx - w * 0.54},${cy - h * 0.02} Z`} fill={c} stroke={INK} strokeWidth={4} />;
    default:
      return null;
  }
}

/** Kompakte Darstellung einer Figur als eigenständiges SVG (für UI-Karten und Charakterbibel). */
export const CharacterPortrait: React.FC<{ look: CharacterLook; heightCm: number; emotion?: Emotion; action?: Action; size?: number; frame?: number; full?: boolean; mouth?: number }> = ({ look, heightCm, emotion = 'neutral', action = 'keine', size = 220, frame = 0, full = true, mouth = 0 }) => {
  const H = heightCm * 4.2;
  const vb = full ? `${-H * 0.42} ${-H * 1.08} ${H * 0.84} ${H * 1.12}` : `${-H * 0.2} ${-H * 1.06} ${H * 0.4} ${H * 0.36}`;
  return (
    <svg viewBox={vb} width={size} height={full ? size * (1.12 / 0.84) : size * 0.9} style={{ overflow: 'visible' }}>
      <CharacterRig look={look} heightCm={heightCm} frame={frame} emotion={emotion} action={action} actionT={0.6} mouth={mouth} />
    </svg>
  );
};
