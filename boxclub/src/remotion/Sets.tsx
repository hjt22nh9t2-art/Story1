/**
 * Schauplätze als mehrschichtige SVG-Kulissen (2.5D über Parallaxe).
 * Der Vereinszustand fließt ein: Hallenzustand → Risse/Flackern/Farbe,
 * Ausrüstung → Anzahl Sandsäcke, Mitglieder → trainierende Statisten.
 * Koordinatensystem: 1080 × 1920, Boden der Figuren bei y = FLOOR.
 */
import React from 'react';
import type { ClubState } from '../lib/types';

export const FLOOR = 1580;
const INK = '#1a1410';

export interface SetProps { frame: number; club: SetClub }
/** Auszug aus dem Vereinszustand, den die Kulissen brauchen */
export interface SetClub { condition: number; sandbags: number; members: number; clubName: string; hasNewRing: boolean; mirrorOk: boolean }

export function setClubFrom(c: ClubState): SetClub {
  const eq = (id: string) => c.equipment.find((e) => e.id === id);
  return {
    condition: c.facilityCondition,
    sandbags: eq('sandsack')?.count ?? 0,
    members: c.members,
    clubName: c.clubName,
    hasNewRing: (eq('ring')?.condition ?? 0) >= 80,
    mirrorOk: (eq('spiegel')?.condition ?? 0) >= 60,
  };
}

export interface SetLayers { back: React.ReactNode; mid: React.ReactNode; front: React.ReactNode; tint: string }

/* -------------------------------------------------------------- Helfer */

const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

const Defs: React.FC = () => (
  <defs>
    <pattern id="brick" width="120" height="60" patternUnits="userSpaceOnUse">
      <rect width="120" height="60" fill="#7a3f2c" />
      <rect x="2" y="2" width="56" height="26" fill="#8d4a33" />
      <rect x="62" y="2" width="56" height="26" fill="#844530" />
      <rect x="-28" y="32" width="56" height="26" fill="#87472f" />
      <rect x="32" y="32" width="56" height="26" fill="#90503a" />
      <rect x="92" y="32" width="56" height="26" fill="#82432e" />
    </pattern>
    <pattern id="brickNew" width="120" height="60" patternUnits="userSpaceOnUse">
      <rect width="120" height="60" fill="#d8d2c4" />
      <rect x="2" y="2" width="56" height="26" fill="#e9e3d6" />
      <rect x="62" y="2" width="56" height="26" fill="#e4ddcf" />
      <rect x="-28" y="32" width="56" height="26" fill="#e6e0d2" />
      <rect x="32" y="32" width="56" height="26" fill="#ebe5d8" />
      <rect x="92" y="32" width="56" height="26" fill="#e1dbcd" />
    </pattern>
    <pattern id="planks" width="160" height="40" patternUnits="userSpaceOnUse">
      <rect width="160" height="40" fill="#a8774a" />
      <rect x="0" y="0" width="160" height="38" fill="#b5844f" />
      <path d="M40,0 v38 M120,0 v38" stroke="#8e6038" strokeWidth="3" />
    </pattern>
    <pattern id="cobble" width="70" height="40" patternUnits="userSpaceOnUse">
      <rect width="70" height="40" fill="#5c5a58" />
      <rect x="3" y="3" width="30" height="15" rx="6" fill="#6f6c69" />
      <rect x="37" y="3" width="30" height="15" rx="6" fill="#696663" />
      <rect x="-14" y="22" width="30" height="15" rx="6" fill="#6c6966" />
      <rect x="20" y="22" width="30" height="15" rx="6" fill="#73706c" />
      <rect x="54" y="22" width="30" height="15" rx="6" fill="#666360" />
    </pattern>
    <pattern id="wallpaper" width="60" height="60" patternUnits="userSpaceOnUse">
      <rect width="60" height="60" fill="#7d8a63" />
      <path d="M30,8 q8,12 0,22 q-8,-10 0,-22 Z" fill="#6f7c56" />
      <circle cx="0" cy="45" r="4" fill="#6f7c56" />
      <circle cx="60" cy="45" r="4" fill="#6f7c56" />
    </pattern>
    <linearGradient id="shaft" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#fff2c8" stopOpacity="0.55" />
      <stop offset="1" stopColor="#fff2c8" stopOpacity="0" />
    </linearGradient>
    <radialGradient id="lampGlow">
      <stop offset="0" stopColor="#ffe9a8" stopOpacity="0.9" />
      <stop offset="1" stopColor="#ffe9a8" stopOpacity="0" />
    </radialGradient>
    <radialGradient id="spot">
      <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
      <stop offset="1" stopColor="#fff" stopOpacity="0" />
    </radialGradient>
    <linearGradient id="floorFade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#000" stopOpacity="0.35" />
      <stop offset="0.25" stopColor="#000" stopOpacity="0" />
    </linearGradient>
  </defs>
);
export const SetDefs = Defs;

const Dust: React.FC<{ frame: number; n?: number; x0?: number; x1?: number; y0?: number; y1?: number; color?: string }> = ({ frame, n = 26, x0 = -200, x1 = 1280, y0 = 100, y1 = 1500, color = '#fff6d8' }) => (
  <g>
    {Array.from({ length: n }).map((_, i) => {
      const x = x0 + rnd(i) * (x1 - x0) + Math.sin(frame * 0.02 + i) * 20;
      const y = y0 + ((rnd(i + 50) * (y1 - y0) + frame * (0.3 + rnd(i + 9) * 0.6)) % (y1 - y0));
      return <circle key={i} cx={x} cy={y} r={1.5 + rnd(i + 3) * 2.5} fill={color} opacity={0.25 + rnd(i + 7) * 0.35} />;
    })}
  </g>
);

const Crack: React.FC<{ x: number; y: number; s?: number; seed?: number }> = ({ x, y, s = 1, seed = 1 }) => {
  let d = `M${x},${y}`;
  let cx = x, cy = y;
  for (let i = 0; i < 6; i++) { cx += (rnd(seed + i) - 0.4) * 50 * s; cy += 40 * s * (0.6 + rnd(seed + i + 20)); d += ` L${cx},${cy}`; }
  return <path d={d} fill="none" stroke="#3a1d14" strokeWidth={4} strokeLinejoin="round" opacity={0.75} />;
};

const Poster: React.FC<{ x: number; y: number; w?: number; title: string; sub: string; color: string; rot?: number; torn?: boolean }> = ({ x, y, w = 170, title, sub, color, rot = 0, torn }) => (
  <g transform={`rotate(${rot} ${x + w / 2} ${y})`}>
    <rect x={x} y={y} width={w} height={w * 1.4} fill="#efe1bf" stroke={INK} strokeWidth={4} />
    <rect x={x + 10} y={y + 10} width={w - 20} height={w * 0.55} fill={color} />
    <circle cx={x + w * 0.35} cy={y + w * 0.38} r={w * 0.12} fill="#2b1d16" opacity={0.6} />
    <circle cx={x + w * 0.65} cy={y + w * 0.38} r={w * 0.12} fill="#2b1d16" opacity={0.6} />
    <text x={x + w / 2} y={y + w * 0.82} fontFamily="Anton, Impact, sans-serif" fontSize={w * 0.17} textAnchor="middle" fill="#2b1d16">{title}</text>
    <text x={x + w / 2} y={y + w * 1.05} fontFamily="Anton, Impact, sans-serif" fontSize={w * 0.11} textAnchor="middle" fill={color}>{sub}</text>
    {torn && <path d={`M${x + w},${y + w * 1.4} l-30,0 l10,-20 l-14,-12 l20,-18 l14,50 Z`} fill="#7a3f2c" />}
    <circle cx={x + w / 2} cy={y + 8} r={5} fill="#999" stroke={INK} strokeWidth={2} />
  </g>
);

const HangingLamp: React.FC<{ x: number; y: number; frame: number; flicker?: boolean; seed?: number }> = ({ x, y, frame, flicker, seed = 0 }) => {
  const sway = Math.sin(frame * 0.03 + seed) * 2.5;
  const on = !flicker || ((frame + seed * 17) % 97 > 4 && (frame + seed * 17) % 97 !== 9);
  return (
    <g transform={`rotate(${sway} ${x} 0)`}>
      <path d={`M${x},0 L${x},${y}`} stroke="#222" strokeWidth={4} />
      {on && <circle cx={x} cy={y + 40} r={170} fill="url(#lampGlow)" opacity={0.55} />}
      <path d={`M${x - 70},${y + 45} L${x - 26},${y} L${x + 26},${y} L${x + 70},${y + 45} Z`} fill="#2f4d3a" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <ellipse cx={x} cy={y + 46} rx={30} ry={10} fill={on ? '#fff3c4' : '#7d7660'} />
    </g>
  );
};

export const Sandbag: React.FC<{ x: number; frame: number; leaking?: boolean; color?: string; seed?: number; top?: number }> = ({ x, frame, leaking, color = '#7c2b26', seed = 0, top = 360 }) => {
  const swing = Math.sin(frame * 0.05 + seed) * 2;
  return (
    <g transform={`rotate(${swing} ${x} 0)`}>
      <path d={`M${x},0 L${x},${top + 40}`} stroke="#444" strokeWidth={5} />
      <path d={`M${x - 20},${top + 40} L${x - 50},${top + 90} M${x + 20},${top + 40} L${x + 50},${top + 90}`} stroke="#444" strokeWidth={4} />
      <rect x={x - 62} y={top + 85} width={124} height={420} rx={50} fill={color} stroke={INK} strokeWidth={5} />
      <rect x={x - 62} y={top + 140} width={124} height={22} fill="#1a1a1a" opacity={0.5} />
      <rect x={x - 62} y={top + 420} width={124} height={22} fill="#1a1a1a" opacity={0.5} />
      <path d={`M${x - 40},${top + 110} Q${x - 46},${top + 300} ${x - 38},${top + 480}`} stroke="#fff" strokeWidth={8} opacity={0.15} fill="none" />
      {leaking && (
        <g>
          <path d={`M${x + 20},${top + 330} l14,10 l-10,8 Z`} fill="#3a1410" />
          {Array.from({ length: 10 }).map((_, i) => {
            const t = ((frame * 6 + i * 37) % 300);
            return <circle key={i} cx={x + 28 + Math.sin(i) * 3} cy={top + 345 + t * 2.4} r={3} fill="#d9c08a" opacity={t > 270 ? 0 : 0.9} />;
          })}
          <ellipse cx={x + 30} cy={FLOOR - 10} rx={46} ry={12} fill="#d9c08a" stroke="#a88f5d" strokeWidth={3} />
        </g>
      )}
    </g>
  );
};

/** Trainierende Mitglieder als Silhouetten – mehr Mitglieder, mehr Leben in der Halle */
const Extras: React.FC<{ n: number; frame: number; y: number }> = ({ n, frame, y }) => (
  <g opacity={0.55}>
    {Array.from({ length: Math.min(n, 7) }).map((_, i) => {
      const x = -120 + i * 190 + rnd(i) * 40;
      const hop = Math.abs(Math.sin(frame * 0.25 + i)) * 14;
      return (
        <g key={i} transform={`translate(${x},${y - hop}) scale(0.55)`} fill="#3b2a24">
          <circle cx={0} cy={-330} r={42} />
          <rect x={-40} y={-285} width={80} height={170} rx={30} />
          <rect x={-36} y={-125} width={30} height={125} rx={12} />
          <rect x={6} y={-125} width={30} height={125} rx={12} />
          <path d={`M-60,-250 Q0,${40 + Math.sin(frame * 0.25 + i) * 60} 60,-250`} stroke="#3b2a24" strokeWidth={5} fill="none" />
        </g>
      );
    })}
  </g>
);

const RingRopes: React.FC<{ x0: number; x1: number; y: number; gap?: number; colors?: string[] }> = ({ x0, x1, y, gap = 70, colors = ['#c8302a', '#f2f2f2', '#2a54b8'] }) => (
  <g>
    {colors.map((c, i) => (
      <g key={i}>
        <path d={`M${x0},${y + i * gap} Q${(x0 + x1) / 2},${y + i * gap + 12} ${x1},${y + i * gap}`} stroke={INK} strokeWidth={17} fill="none" />
        <path d={`M${x0},${y + i * gap} Q${(x0 + x1) / 2},${y + i * gap + 12} ${x1},${y + i * gap}`} stroke={c} strokeWidth={10} fill="none" />
      </g>
    ))}
  </g>
);

const CornerPost: React.FC<{ x: number; y: number; h: number; color: string }> = ({ x, y, h, color }) => (
  <g>
    <rect x={x - 16} y={y} width={32} height={h} fill="#555" stroke={INK} strokeWidth={4} />
    <rect x={x - 30} y={y + 10} width={60} height={h * 0.62} rx={14} fill={color} stroke={INK} strokeWidth={5} />
    <path d={`M${x - 18},${y + 26} v${h * 0.5}`} stroke="#fff" strokeWidth={6} opacity={0.25} />
  </g>
);

/* -------------------------------------------------------------- Sets */

function halle(frame: number, c: SetClub): SetLayers {
  const worn = c.condition < 60;
  const wall = c.condition >= 75 ? 'url(#brickNew)' : 'url(#brick)';
  const bags = Math.max(0, Math.min(5, c.sandbags));
  return {
    tint: worn ? 'rgba(255,190,120,0.06)' : 'rgba(255,255,255,0)',
    back: (
      <g>
        <rect x={-500} y={0} width={2100} height={FLOOR - 220} fill={wall} />
        <rect x={-500} y={0} width={2100} height={FLOOR - 220} fill="#2a120a" opacity={worn ? 0.18 : 0.05} />
        {/* Oberlichter */}
        {[-260, 160, 580, 1000, 1400].map((x, i) => (
          <g key={i}>
            <path d={`M${x},90 L${x + 160},90 L${x + 160},300 L${x},300 Z`} fill="#c9dcef" stroke={INK} strokeWidth={6} />
            <path d={`M${x + 80},90 V300 M${x},195 H${x + 160}`} stroke={INK} strokeWidth={5} />
            {worn && i === 1 && <path d={`M${x + 90},100 l30,40 l-20,10 l30,50`} stroke={INK} strokeWidth={3} fill="none" />}
            <path d={`M${x},300 L${x + 160},300 L${x + 330},${FLOOR} L${x + 110},${FLOOR} Z`} fill="url(#shaft)" opacity={0.6 + Math.sin(frame * 0.02 + i) * 0.08} />
          </g>
        ))}
        {/* verblichener Wandschriftzug */}
        <text x={540} y={470} fontFamily="Anton, Impact, sans-serif" fontSize={150} textAnchor="middle" fill={c.condition >= 75 ? '#8c1d2c' : '#e9d9b8'} opacity={c.condition >= 75 ? 0.9 : 0.28} letterSpacing={8}>ROSTFAUST</text>
        <text x={540} y={540} fontFamily="Anton, Impact, sans-serif" fontSize={48} textAnchor="middle" fill="#e9d9b8" opacity={0.25}>SEIT 1961</text>
        <Poster x={-200} y={640} title="ROSTFAUST" sub="vs. HAFEN 1987" color="#b8352b" rot={-4} torn={worn} />
        <Poster x={1110} y={620} title="KAMPFABEND" sub="SAMSTAG 20 UHR" color="#2a54b8" rot={3} />
        {worn && <><Crack x={60} y={560} seed={3} /><Crack x={930} y={520} seed={9} s={1.2} /><Crack x={300} y={900} seed={14} s={0.8} /></>}
        {/* Spiegel */}
        <g>
          <rect x={-330} y={820} width={260} height={420} fill="#9fb3bf" stroke="#6b4a2a" strokeWidth={14} />
          <path d={`M-300,850 l60,120`} stroke="#fff" strokeWidth={10} opacity={0.4} />
          {!c.mirrorOk && <path d="M-250,900 l40,80 l-30,40 l50,90 M-210,980 l50,-20" stroke={INK} strokeWidth={4} fill="none" />}
        </g>
        {/* Boden */}
        <path d={`M-500,${FLOOR - 220} L1600,${FLOOR - 220} L1600,1920 L-500,1920 Z`} fill="url(#planks)" />
        <path d={`M-500,${FLOOR - 220} L1600,${FLOOR - 220} L1600,1920 L-500,1920 Z`} fill="url(#floorFade)" />
        <Extras n={Math.max(0, c.members - 1)} frame={frame} y={FLOOR - 230} />
      </g>
    ),
    mid: (
      <g>
        {/* Ring rechts hinten */}
        <g transform="translate(560,0)">
          <path d={`M0,${FLOOR - 330} L760,${FLOOR - 330} L800,${FLOOR - 230} L-40,${FLOOR - 230} Z`} fill={c.hasNewRing ? '#d8dee8' : '#b9b3a6'} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
          <rect x={-40} y={FLOOR - 230} width={840} height={70} fill={c.hasNewRing ? '#1f3f8a' : '#3b3f52'} stroke={INK} strokeWidth={6} />
          <text x={380} y={FLOOR - 180} fontFamily="Anton, Impact, sans-serif" fontSize={44} textAnchor="middle" fill="#e9d9b8" opacity={0.8}>BC ROSTFAUST</text>
          <CornerPost x={0} y={FLOOR - 560} h={240} color="#c8302a" />
          <CornerPost x={760} y={FLOOR - 560} h={240} color="#2a54b8" />
          <RingRopes x0={0} x1={760} y={FLOOR - 530} gap={64} />
        </g>
        {/* Sandsäcke links */}
        {Array.from({ length: bags }).map((_, i) => (
          <Sandbag key={i} x={-260 + i * 170} frame={frame} leaking={i === 1 && c.condition < 60} seed={i * 2} color={i % 2 ? '#2f3a4f' : '#7c2b26'} top={300 + (i % 2) * 30} />
        ))}
        <HangingLamp x={200} y={140} frame={frame} flicker={c.condition < 40} seed={1} />
        <HangingLamp x={860} y={120} frame={frame} seed={4} />
        {/* Bank */}
        <g>
          <rect x={-40} y={FLOOR - 140} width={300} height={34} rx={8} fill="#8a5a33" stroke={INK} strokeWidth={5} />
          <rect x={-20} y={FLOOR - 106} width={20} height={70} fill="#555" stroke={INK} strokeWidth={4} />
          <rect x={220} y={FLOOR - 106} width={20} height={70} fill="#555" stroke={INK} strokeWidth={4} />
          <path d={`M10,${FLOOR - 150} q40,-30 80,0`} stroke="#c8302a" strokeWidth={8} fill="none" />
        </g>
      </g>
    ),
    front: (
      <g>
        <Dust frame={frame} />
        <rect x={-500} y={1800} width={2100} height={160} fill="#000" opacity={0.25} />
      </g>
    ),
  };
}

function ring(frame: number, c: SetClub): SetLayers {
  return {
    tint: 'rgba(255,200,140,0.05)',
    back: (
      <g>
        <rect x={-500} y={0} width={2100} height={1920} fill="#2b2220" />
        <rect x={-500} y={0} width={2100} height={1100} fill="url(#brick)" opacity={0.55} />
        {[-100, 420, 940].map((x, i) => (
          <path key={i} d={`M${x},0 L${x + 140},0 L${x + 420},1500 L${x + 40},1500 Z`} fill="url(#shaft)" opacity={0.45 + Math.sin(frame * 0.03 + i) * 0.06} />
        ))}
        <Poster x={820} y={420} w={150} title="ROSTFAUST" sub="1961" color="#b8352b" rot={4} />
        <Extras n={Math.max(0, c.members - 1)} frame={frame} y={1120} />
        {/* Ringboden */}
        <path d={`M-500,1180 L1600,1180 L1600,1920 L-500,1920 Z`} fill={c.hasNewRing ? '#dfe5ee' : '#c4bdb0'} />
        <path d="M-500,1180 L1600,1180" stroke={INK} strokeWidth={6} />
        {c.condition < 60 && <>
          <ellipse cx={200} cy={1700} rx={120} ry={30} fill="#8f8574" opacity={0.5} />
          <ellipse cx={820} cy={1820} rx={90} ry={22} fill="#7f6f5c" opacity={0.4} />
          <path d="M520,1640 l60,4 l-8,30 l50,10" stroke="#8f8574" strokeWidth={6} fill="none" />
        </>}
        <text x={540} y={1450} fontFamily="Anton, Impact, sans-serif" fontSize={130} textAnchor="middle" fill="#8c1d2c" opacity={0.18} transform="scale(1,0.5) translate(0,1440)">ROSTFAUST</text>
      </g>
    ),
    mid: (
      <g>
        <CornerPost x={-130} y={760} h={430} color="#c8302a" />
        <CornerPost x={1210} y={760} h={430} color="#2a54b8" />
        <RingRopes x0={-130} x1={1210} y={810} gap={110} />
        {/* Glocke */}
        <g transform="translate(1135,640)">
          <path d="M0,0 v40" stroke="#444" strokeWidth={6} />
          <path d="M-46,100 Q-46,40 0,40 Q46,40 46,100 Z" fill="#d9a63a" stroke={INK} strokeWidth={5} />
          <circle cx={0} cy={106} r={10} fill="#8d6a1f" stroke={INK} strokeWidth={3} />
          <path d="M-28,90 Q-26,60 -6,54" stroke="#fff" strokeWidth={6} opacity={0.4} fill="none" />
        </g>
        <HangingLamp x={540} y={60} frame={frame} seed={2} flicker={c.condition < 40} />
      </g>
    ),
    front: (
      <g>
        <Dust frame={frame} n={18} />
        <g opacity={0.95}>
          <RingRopes x0={-400} x1={1480} y={1735} gap={95} colors={['#c8302a', '#f2f2f2']} />
        </g>
      </g>
    ),
  };
}

function strasse(frame: number, c: SetClub): SetLayers {
  const worn = c.condition < 60;
  const missing = c.condition < 40;
  return {
    tint: 'rgba(255,170,90,0.07)',
    back: (
      <g>
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#5b7fa8" />
            <stop offset="0.55" stopColor="#e9a46a" />
            <stop offset="1" stopColor="#f6d39a" />
          </linearGradient>
        </defs>
        <rect x={-500} y={0} width={2100} height={1300} fill="url(#sky)" />
        <circle cx={880} cy={420} r={90} fill="#ffe2a0" opacity={0.9} />
        {/* Hafenkräne in der Ferne – Kranstadt */}
        <g fill="#6d6a7d" opacity={0.75}>
          {[-300, 60, 1200].map((x, i) => (
            <g key={i} transform={`translate(${x},0)`}>
              <rect x={0} y={520} width={22} height={420} />
              <rect x={-120} y={510} width={300} height={18} />
              <path d={`M11,${520} L150,${540}`} stroke="#6d6a7d" strokeWidth={4} />
              <rect x={130} y={528} width={4} height={140 + Math.sin(frame * 0.02 + i) * 6} />
            </g>
          ))}
        </g>
        {/* Vögel */}
        {[0, 1, 2].map((i) => {
          const x = ((frame * 2.2 + i * 260) % 1800) - 400, y = 240 + i * 40 + Math.sin(frame * 0.1 + i) * 10;
          return <path key={i} d={`M${x},${y} q12,-12 24,0 q12,-12 24,0`} stroke="#3a3a48" strokeWidth={4} fill="none" />;
        })}
      </g>
    ),
    mid: (
      <g>
        {/* Depothalle */}
        <rect x={-260} y={640} width={1600} height={720} fill="url(#brick)" stroke={INK} strokeWidth={6} />
        <path d="M-290,640 L540,470 L1370,640 Z" fill="#5b2f22" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        {[-140, 1040].map((x, i) => (
          <g key={i}>
            <path d={`M${x},1000 L${x},800 Q${x + 90},720 ${x + 180},800 L${x + 180},1000 Z`} fill={worn ? '#3d4a55' : '#ffd98a'} stroke={INK} strokeWidth={6} />
            <path d={`M${x + 90},740 V1000 M${x},880 H${x + 180}`} stroke={INK} strokeWidth={5} />
            {worn && i === 0 && <path d={`M${x + 20},820 l50,60 l-20,20`} stroke="#c9dcef" strokeWidth={4} fill="none" />}
          </g>
        ))}
        {/* Schild */}
        <rect x={150} y={690} width={780} height={130} rx={10} fill={worn ? '#d9c9a2' : '#f4ead2'} stroke={INK} strokeWidth={6} />
        <text x={540} y={790} fontFamily="Anton, Impact, sans-serif" fontSize={92} textAnchor="middle" fill="#8c1d2c" opacity={worn ? 0.75 : 1} letterSpacing={4}>
          {missing ? 'BOXCLU  ROSTFAUST' : 'BOXCLUB ROSTFAUST'}
        </text>
        {missing && <path d="M455,700 l10,22" stroke={INK} strokeWidth={3} />}
        {/* Rolltor */}
        <rect x={300} y={880} width={480} height={480} fill="#7f8a8f" stroke={INK} strokeWidth={6} />
        {Array.from({ length: 12 }).map((_, i) => <path key={i} d={`M300,${905 + i * 38} H780`} stroke="#5d676b" strokeWidth={6} />)}
        {worn && <path d="M330,1300 q60,-40 120,10 q60,30 120,-20" stroke="#8c4a2a" strokeWidth={14} fill="none" opacity={0.5} />}
        <text x={540} y={1100} fontFamily="Permanent Marker, Anton, sans-serif" fontSize={54} textAnchor="middle" fill="#f2f2f2" opacity={0.85} transform="rotate(-6 540 1100)">NEU ERÖFFNET!</text>
        <text x={1000} y={1180} fontFamily="Anton, Impact, sans-serif" fontSize={40} fill="#e9d9b8" opacity={0.7}>Nr. 7</text>
        {/* Straße */}
        <path d={`M-500,1360 L1600,1360 L1600,1920 L-500,1920 Z`} fill="url(#cobble)" />
        <path d="M-500,1360 L1600,1360" stroke="#444" strokeWidth={8} />
        <path d="M-500,1700 L1600,1700 M-500,1760 L1600,1760" stroke="#9b9b9b" strokeWidth={10} />
        <path d="M-500,1700 L1600,1700 M-500,1760 L1600,1760" stroke="#3b3b3b" strokeWidth={3} />
      </g>
    ),
    front: (
      <g>
        {/* Laterne */}
        <g transform="translate(1260,0)">
          <rect x={-12} y={700} width={24} height={1220} fill="#2c2f33" stroke={INK} strokeWidth={4} />
          <path d="M-60,700 L60,700 L40,640 L-40,640 Z" fill="#2c2f33" stroke={INK} strokeWidth={4} />
          <circle cx={0} cy={720} r={110} fill="url(#lampGlow)" opacity={0.5 + Math.sin(frame * 0.3) * 0.05} />
        </g>
        <Dust frame={frame} n={12} color="#ffe2a0" />
      </g>
    ),
  };
}

function buero(frame: number, c: SetClub): SetLayers {
  const tick = Math.floor(frame / 30);
  return {
    tint: 'rgba(255,210,140,0.07)',
    back: (
      <g>
        <rect x={-500} y={0} width={2100} height={1920} fill="url(#wallpaper)" />
        <rect x={-500} y={0} width={2100} height={1920} fill="#2b1a0e" opacity={c.condition < 60 ? 0.25 : 0.1} />
        {c.condition < 60 && <path d="M820,0 Q860,200 800,380 Q760,480 820,560" stroke="#5b4a2a" strokeWidth={60} opacity={0.2} fill="none" />}
        {/* Fenster zur Halle mit Jalousie */}
        <rect x={-300} y={380} width={520} height={460} fill="#d9c7a0" stroke="#5b3a1f" strokeWidth={14} />
        {Array.from({ length: 10 }).map((_, i) => <rect key={i} x={-290} y={392 + i * 44} width={500} height={26} fill="#efe3c6" stroke="#a89470" strokeWidth={2} transform={i === 4 ? `rotate(-4 -40 ${400 + i * 44})` : undefined} />)}
        {/* Foto vom Vater */}
        <g transform="translate(400,400) rotate(-3)">
          <rect x={0} y={0} width={230} height={290} fill="#6b4a2a" stroke={INK} strokeWidth={5} />
          <rect x={18} y={18} width={194} height={254} fill="#c9b48a" />
          <circle cx={115} cy={110} r={40} fill="#6e5a3c" />
          <rect x={70} y={150} width={90} height={110} rx={20} fill="#6e5a3c" />
          <circle cx={60} cy={175} r={22} fill="#8b2a22" />
          <circle cx={170} cy={175} r={22} fill="#8b2a22" />
          <text x={115} y={265} fontFamily="Caveat, cursive" fontSize={26} textAnchor="middle" fill="#3b2a1a">Papa 1961</text>
        </g>
        {/* Uhr */}
        <g transform="translate(860,330)">
          <circle r={80} fill="#f4ead2" stroke={INK} strokeWidth={6} />
          <path d={`M0,0 L${Math.sin(tick * 0.105) * 58},${-Math.cos(tick * 0.105) * 58}`} stroke={INK} strokeWidth={4} />
          <path d="M0,0 L30,-30" stroke={INK} strokeWidth={7} />
          <circle r={6} fill={INK} />
        </g>
        {/* Regal mit Ordnern */}
        <g transform="translate(700,640)">
          <rect x={0} y={0} width={420} height={20} fill="#6b4a2a" stroke={INK} strokeWidth={4} />
          {['#8c1d2c', '#2a54b8', '#d9a63a', '#3b5a3a', '#8c1d2c'].map((col, i) => <rect key={i} x={20 + i * 70} y={-170} width={56} height={170} fill={col} stroke={INK} strokeWidth={4} />)}
          <text x={48} y={-60} fontSize={22} fontFamily="Anton" fill="#fff" transform="rotate(-90 48 -60)">RECHNUNGEN</text>
        </g>
        <rect x={-500} y={1280} width={2100} height={640} fill="#5b3f2a" />
      </g>
    ),
    mid: <g />,
    front: (
      <g>
        {/* Schreibtisch im Vordergrund */}
        <rect x={-300} y={1330} width={1700} height={70} fill="#8a5a33" stroke={INK} strokeWidth={7} />
        <rect x={-300} y={1400} width={1700} height={520} fill="#6e4526" stroke={INK} strokeWidth={7} />
        <path d="M-300,1460 H1400" stroke="#5a3a20" strokeWidth={4} />
        {/* Rechnungsstapel */}
        {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={760 + (i % 2) * 6} y={1310 - i * 14} width={220} height={20} fill={i % 2 ? '#f4f4f0' : '#ece6d8'} stroke={INK} strokeWidth={3} transform={`rotate(${(i % 3) - 1} 870 ${1310 - i * 14})`} />)}
        <rect x={830} y={1224} width={90} height={30} fill="#e05a4a" stroke={INK} strokeWidth={3} transform="rotate(-8 875 1238)" />
        <text x={875} y={1246} fontSize={20} fontFamily="Anton" textAnchor="middle" fill="#fff" transform="rotate(-8 875 1238)">MAHNUNG</text>
        {/* Geldkassette */}
        <g transform="translate(120,1250)">
          <rect x={0} y={0} width={190} height={84} rx={8} fill="#3d6b8c" stroke={INK} strokeWidth={5} />
          <rect x={70} y={22} width={50} height={22} rx={4} fill="#d9d9d9" stroke={INK} strokeWidth={3} />
        </g>
        {/* kariertes Heft */}
        <g transform="translate(380,1290) rotate(-6)">
          <rect x={0} y={0} width={200} height={40} fill="#f2f2ea" stroke={INK} strokeWidth={4} />
          <path d="M0,14 H200 M0,26 H200 M40,0 V40 M80,0 V40 M120,0 V40 M160,0 V40" stroke="#9fb6d9" strokeWidth={2} />
        </g>
        {/* Wählscheibentelefon */}
        <g transform="translate(-180,1240)">
          <path d="M0,90 L20,20 L150,20 L170,90 Z" fill="#b8352b" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
          <rect x={-10} y={0} width={190} height={34} rx={17} fill="#b8352b" stroke={INK} strokeWidth={5} />
          <circle cx={85} cy={62} r={22} fill="#f4ead2" stroke={INK} strokeWidth={3} />
        </g>
      </g>
    ),
  };
}

function empfang(frame: number, c: SetClub): SetLayers {
  return {
    tint: 'rgba(255,220,160,0.06)',
    back: (
      <g>
        <rect x={-500} y={0} width={2100} height={1920} fill={c.condition >= 75 ? 'url(#brickNew)' : 'url(#brick)'} />
        <rect x={-500} y={0} width={2100} height={1920} fill="#1b0d08" opacity={0.2} />
        {/* Pokalregal */}
        <g transform="translate(-120,430)">
          {[0, 1].map((r) => <rect key={r} x={0} y={r * 230 + 200} width={560} height={22} fill="#6b4a2a" stroke={INK} strokeWidth={4} />)}
          {[0, 1, 2, 3].map((i) => (
            <g key={i} transform={`translate(${60 + i * 130},${i % 2 ? 60 : 30})`}>
              <path d="M0,0 Q0,90 40,100 Q80,90 80,0 Z" fill="#d9a63a" stroke={INK} strokeWidth={4} />
              <rect x={28} y={100} width={24} height={50} fill="#d9a63a" stroke={INK} strokeWidth={4} />
              <rect x={10} y={150} width={60} height={20} fill="#5b3a1f" stroke={INK} strokeWidth={4} />
            </g>
          ))}
        </g>
        {/* Mitgliedertafel */}
        <g transform="translate(640,420)">
          <rect x={0} y={0} width={360} height={420} fill="#2f3b2f" stroke="#6b4a2a" strokeWidth={14} />
          <text x={180} y={60} fontFamily="Anton" fontSize={40} textAnchor="middle" fill="#f4ead2">MITGLIEDER</text>
          {Array.from({ length: Math.min(8, c.members) }).map((_, i) => <path key={i} d={`M40,${110 + i * 36} h${180 + rnd(i) * 100}`} stroke="#e9e9e0" strokeWidth={5} strokeLinecap="round" opacity={0.8} />)}
          <text x={180} y={400} fontFamily="Anton" fontSize={34} textAnchor="middle" fill="#d9a63a">{c.members}</text>
        </g>
        <rect x={-500} y={1300} width={2100} height={620} fill="#4f3a2a" />
      </g>
    ),
    mid: <g />,
    front: (
      <g>
        <rect x={-300} y={1300} width={1700} height={60} fill="#9a6a3c" stroke={INK} strokeWidth={7} />
        <rect x={-280} y={1360} width={1660} height={560} fill="#7a4f2c" stroke={INK} strokeWidth={7} />
        {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={-240 + i * 330} y={1400} width={290} height={480} fill="none" stroke="#5f3c20" strokeWidth={6} />)}
        {/* Kaffeemaschine */}
        <g transform="translate(860,1120)">
          <rect x={0} y={0} width={150} height={180} rx={10} fill="#3a3a3a" stroke={INK} strokeWidth={5} />
          <rect x={30} y={110} width={90} height={60} fill="#a8c7d9" stroke={INK} strokeWidth={4} opacity={0.8} />
          <path d={`M60,${100 - (frame % 40)} q8,-10 0,-20`} stroke="#fff" strokeWidth={4} opacity={0.5} fill="none" />
        </g>
        <g transform="translate(120,1250)">
          <rect x={0} y={0} width={190} height={60} rx={8} fill="#3d6b8c" stroke={INK} strokeWidth={5} />
        </g>
      </g>
    ),
  };
}

function umkleide(frame: number, c: SetClub): SetLayers {
  const drip = (frame % 45) / 45;
  return {
    tint: 'rgba(160,220,200,0.06)',
    back: (
      <g>
        <rect x={-500} y={0} width={2100} height={1920} fill="#cfd8cf" />
        {Array.from({ length: 40 }).map((_, i) => <rect key={i} x={-500 + (i % 20) * 105} y={Math.floor(i / 20) * 105 + 120} width={100} height={100} fill="#dfe7df" stroke="#b9c4b9" strokeWidth={3} />)}
        {Array.from({ length: 12 }).map((_, i) => (
          <g key={i}>
            <rect x={-420 + i * 170} y={420} width={160} height={900} fill={i % 3 === 1 && c.condition < 60 ? '#5f7f63' : '#4f7a5a'} stroke={INK} strokeWidth={6} />
            {[0, 1, 2, 3, 4].map((k) => <path key={k} d={`M${-390 + i * 170},${470 + k * 18} h100`} stroke="#2f4a35" strokeWidth={5} />)}
            <rect x={-300 + i * 170} y={820} width={14} height={60} rx={6} fill="#c9c9c9" stroke={INK} strokeWidth={3} />
            {c.condition < 60 && i === 4 && <path d={`M${-420 + i * 170},700 l40,40 l-20,30`} stroke={INK} strokeWidth={4} fill="none" />}
          </g>
        ))}
        {/* tropfende Dusche */}
        <g transform="translate(1180,300)">
          <path d="M0,0 v120 h-80" stroke="#8a8f94" strokeWidth={14} fill="none" />
          <ellipse cx={-90} cy={130} rx={50} ry={16} fill="#9aa0a6" stroke={INK} strokeWidth={4} />
          {c.condition < 75 && <ellipse cx={-90} cy={150 + drip * 1100} rx={7} ry={11} fill="#8fd0ff" stroke="#3a7aa8" strokeWidth={2} opacity={drip > 0.95 ? 0 : 1} />}
        </g>
        <rect x={-500} y={1320} width={2100} height={600} fill="#9aa59a" />
      </g>
    ),
    mid: <g />,
    front: (
      <g>
        <rect x={-300} y={1660} width={1700} height={48} rx={8} fill="#a8763f" stroke={INK} strokeWidth={6} />
        <rect x={-200} y={1708} width={30} height={220} fill="#555" />
        <rect x={1200} y={1708} width={30} height={220} fill="#555" />
        <path d="M100,1650 q60,-50 140,-10 q30,20 80,0" stroke="#f2f2f2" strokeWidth={26} fill="none" strokeLinecap="round" />
      </g>
    ),
  };
}

/** Feste Reihenfolge, in der sich die 100 Plätze füllen (verstreut, deterministisch). */
const SEAT_ORDER = (() => {
  const idx = Array.from({ length: 100 }, (_, i) => i);
  return idx.sort((x, y) => rnd(x * 3.7 + 11) - rnd(y * 3.7 + 11));
})();
const FAN_COLORS = ['#c8302a', '#2a54b8', '#d9a63a', '#4f7a5a', '#8c1d2c', '#6b5a45', '#3d6b8c', '#a8763f', '#7a4f8c', '#e6e0d2'];

/** Tribüne mit genau 100 Plätzen (5 Reihen × 20). filled = Anzahl besetzter Plätze. */
export const ArenaSeats: React.FC<{ filled: number; frame: number }> = ({ filled, frame }) => {
  const taken = new Set(SEAT_ORDER.slice(0, Math.max(0, Math.min(100, Math.floor(filled)))));
  const rows: React.ReactNode[] = [];
  for (let r = 0; r < 5; r++) {
    const sp = 46 + r * 4.5;           // Sitzabstand (Perspektive: vorne breiter)
    const y = 690 + r * 92;            // Reihenhöhe
    const sc = 0.74 + r * 0.07;
    const x0 = 540 - (sp * 19) / 2;
    rows.push(<rect key={`st${r}`} x={x0 - 40} y={y + 30 * sc} width={sp * 19 + 80} height={62} fill={r % 2 ? '#24283a' : '#1e2232'} />);
    for (let k = 0; k < 20; k++) {
      const i = r * 20 + k;
      const x = x0 + k * sp;
      const on = taken.has(i);
      const bob = on ? Math.abs(Math.sin(frame * 0.18 + i)) * -4 : 0;
      rows.push(
        <g key={i} transform={`translate(${x} ${y}) scale(${sc})`}>
          {/* Klappsitz */}
          <rect x={-17} y={-6} width={34} height={36} rx={7} fill="#b3262e" stroke={INK} strokeWidth={3} />
          <rect x={-19} y={26} width={38} height={10} rx={4} fill="#8c1d22" stroke={INK} strokeWidth={3} />
          {on && (
            <g transform={`translate(0 ${bob})`}>
              <rect x={-16} y={-14} width={32} height={34} rx={13} fill={FAN_COLORS[i % FAN_COLORS.length]} stroke={INK} strokeWidth={3} />
              <circle cx={0} cy={-28} r={13} fill={['#e9b48e', '#c48a62', '#f0c09a', '#8d5a3c', '#d7a184'][i % 5]} stroke={INK} strokeWidth={3} />
              {i % 7 === 0 && <rect x={-14} y={-44} width={28} height={9} rx={4} fill={FAN_COLORS[(i + 3) % FAN_COLORS.length]} stroke={INK} strokeWidth={2} />}
              {i % 9 === 2 && <path d="M12,-10 L24,-44" stroke={INK} strokeWidth={4} strokeLinecap="round" />}
            </g>
          )}
        </g>,
      );
    }
  }
  return <g>{rows}</g>;
};

function eventhalle(frame: number, opts: SetOpts): SetLayers {
  const filled = opts.seatsFilled ?? 0;
  const full = filled >= 100;
  return {
    tint: 'rgba(120,140,255,0.05)',
    back: (
      <g>
        <rect x={-500} y={0} width={2100} height={1920} fill="#121524" />
        {/* Dachträger */}
        {[-300, 100, 500, 900, 1300].map((x, i) => <path key={i} d={`M${x},0 L${x + 120},260`} stroke="#23283c" strokeWidth={22} />)}
        <path d="M-500,140 H1600" stroke="#23283c" strokeWidth={26} />
        {/* Banner */}
        <rect x={190} y={215} width={700} height={130} rx={10} fill="#8c1d2c" stroke={INK} strokeWidth={6} />
        <text x={540} y={305} fontFamily="Anton, Impact, sans-serif" fontSize={78} textAnchor="middle" fill="#f4ead2" letterSpacing={6}>KAMPFABEND</text>
        <text x={540} y={392} fontFamily="Anton, Impact, sans-serif" fontSize={40} textAnchor="middle" fill="#f08a24" letterSpacing={8}>KRANSTADT ARENA</text>
        {/* Scheinwerferkegel */}
        {[-150, 240, 840, 1230].map((x, i) => (
          <path key={i} d={`M${x},250 L${x + 50},250 L${540 + (i - 1.5) * 90},1250 L${540 + (i - 1.5) * 90 - 150},1250 Z`} fill="#fff" opacity={0.06 + Math.sin(frame * 0.05 + i) * 0.02} />
        ))}
        <ArenaSeats filled={filled} frame={frame} />
        {/* Hallenboden */}
        <path d="M-500,1200 L1600,1200 L1600,1920 L-500,1920 Z" fill="#2c3040" />
        <ellipse cx={540} cy={1430} rx={720} ry={250} fill="url(#spot)" opacity={full ? 0.9 : 0.6} />
      </g>
    ),
    mid: (
      <g>
        {/* Ring in der Mitte, etwas zurückgesetzt */}
        <path d="M120,1240 L960,1240 L1010,1330 L70,1330 Z" fill="#e3e7ef" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        <rect x={70} y={1330} width={940} height={60} fill="#1f3f8a" stroke={INK} strokeWidth={6} />
        <text x={540} y={1374} fontFamily="Anton, Impact, sans-serif" fontSize={38} textAnchor="middle" fill="#f4ead2">BOXCLUB ROSTFAUST</text>
        <CornerPost x={120} y={1030} h={215} color="#c8302a" />
        <CornerPost x={960} y={1030} h={215} color="#2a54b8" />
        <RingRopes x0={120} x1={960} y={1060} gap={58} />
      </g>
    ),
    front: <Dust frame={frame} n={14} color="#dfe6ff" />,
  };
}

function rivalengym(frame: number): SetLayers {
  return {
    tint: 'rgba(120,200,255,0.05)',
    back: (
      <g>
        <rect x={-500} y={0} width={2100} height={1920} fill="#eef2f6" />
        <rect x={-500} y={200} width={2100} height={14} fill="#38c6ff" opacity={0.8 + Math.sin(frame * 0.1) * 0.2} />
        <text x={540} y={450} fontFamily="Anton" fontSize={170} textAnchor="middle" fill="#1f2c4d" letterSpacing={20}>TITAN</text>
        <text x={540} y={520} fontFamily="Anton" fontSize={44} textAnchor="middle" fill="#38c6ff" letterSpacing={10}>BOXING GYM</text>
        {Array.from({ length: 6 }).map((_, i) => <Sandbag key={i} x={-300 + i * 290} frame={frame} color="#1f2c4d" seed={i} top={560} />)}
        <path d="M-500,1300 L1600,1300 L1600,1920 L-500,1920 Z" fill="#2b3036" />
        <path d="M-500,1300 L1600,1300" stroke="#38c6ff" strokeWidth={6} />
      </g>
    ),
    mid: <g />,
    front: <Dust frame={frame} n={10} color="#bfe9ff" />,
  };
}

function grosshalle(frame: number): SetLayers {
  return {
    tint: 'rgba(255,240,210,0.05)',
    back: (
      <g>
        <rect x={-500} y={0} width={2100} height={1300} fill="url(#brickNew)" />
        <rect x={-500} y={0} width={2100} height={1300} fill="#fff" opacity={0.18} />
        {/* große Fensterfront */}
        {[-380, -60, 260, 580, 900, 1220].map((x, i) => (
          <g key={i}>
            <rect x={x} y={120} width={250} height={420} fill="#cfe3f3" stroke={INK} strokeWidth={6} />
            <path d={`M${x + 125},120 V540 M${x},330 H${x + 250}`} stroke={INK} strokeWidth={5} />
            <path d={`M${x},540 L${x + 250},540 L${x + 420},1300 L${x + 160},1300 Z`} fill="url(#shaft)" opacity={0.5 + Math.sin(frame * 0.02 + i) * 0.06} />
          </g>
        ))}
        <text x={540} y={660} fontFamily="Anton, Impact, sans-serif" fontSize={120} textAnchor="middle" fill="#8c1d2c" letterSpacing={10}>ROSTFAUST</text>
        <text x={540} y={720} fontFamily="Anton, Impact, sans-serif" fontSize={40} textAnchor="middle" fill="#1f3f8a" letterSpacing={8}>BOXEN · WING TSUN</text>
        {/* zwei kleine Ringe im Hintergrund */}
        {[-200, 760].map((x, i) => (
          <g key={i} transform={`translate(${x} 0)`}>
            <path d="M0,1180 L520,1180 L545,1240 L-25,1240 Z" fill="#dfe5ee" stroke={INK} strokeWidth={5} />
            <rect x={-25} y={1240} width={570} height={40} fill={i ? '#c8302a' : '#1f3f8a'} stroke={INK} strokeWidth={5} />
            <CornerPost x={0} y={1010} h={170} color="#c8302a" />
            <CornerPost x={520} y={1010} h={170} color="#2a54b8" />
            <RingRopes x0={0} x1={520} y={1030} gap={44} />
          </g>
        ))}
        {/* Sandsack-Reihe */}
        {Array.from({ length: 6 }).map((_, i) => <Sandbag key={i} x={-120 + i * 260} frame={frame} color={i % 2 ? '#2f3a4f' : '#7c2b26'} seed={i + 3} top={760} />)}
        {/* heller Boden mit Matten */}
        <path d="M-500,1300 L1600,1300 L1600,1920 L-500,1920 Z" fill="url(#planks)" />
        <path d="M-200,1360 L700,1360 L760,1520 L-260,1520 Z" fill="#1f3f8a" opacity={0.55} />
      </g>
    ),
    mid: <g />,
    front: <Dust frame={frame} n={12} color="#fff7d0" />,
  };
}

export interface SetOpts { seatsFilled?: number }

export function getSet(location: string, frame: number, club: SetClub, opts: SetOpts = {}): SetLayers {
  switch (location) {
    case 'halle': return halle(frame, club);
    case 'ring': return ring(frame, club);
    case 'strasse': return strasse(frame, club);
    case 'buero': return buero(frame, club);
    case 'empfang': return empfang(frame, club);
    case 'umkleide': return umkleide(frame, club);
    case 'eventhalle': return eventhalle(frame, opts);
    case 'rivalengym': return rivalengym(frame);
    case 'grosshalle': return grosshalle(frame);
    default: return halle(frame, club);
  }
}
