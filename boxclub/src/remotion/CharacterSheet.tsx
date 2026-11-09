/** Referenzblatt einer Figur für die visuelle Charakterbibel (PNG via renderStill). */
import React from 'react';
import { AbsoluteFill } from 'remotion';
import type { Character } from '../lib/types';
import { CharacterRig, type Action, type Emotion } from './Character';

export interface CharacterSheetProps { character: Character; [key: string]: unknown }

const VIEWS: { e: Emotion; a: Action; label: string; mouth: number }[] = [
  { e: 'neutral', a: 'keine', label: 'Neutral (Referenz)', mouth: 0 },
  { e: 'froh', a: 'zeigen', label: 'Froh · zeigt', mouth: 0.6 },
  { e: 'wuetend', a: 'faust_heben', label: 'Wütend · Faust', mouth: 0.3 },
  { e: 'traurig', a: 'seufzen', label: 'Traurig · seufzt', mouth: 0 },
  { e: 'ueberrascht', a: 'achselzucken', label: 'Überrascht', mouth: 0.8 },
];

export const CharacterSheet: React.FC<CharacterSheetProps> = ({ character: c }) => {
  if (!c) return <AbsoluteFill style={{ background: '#f4ead2' }} />;
  const H = c.heightCm * 4.2;
  const swatches: [string, string][] = [
    ['Haut', c.look.skin], ['Haare', c.look.hair.color], ['Oberteil', c.look.top.color], ['Akzent', c.look.top.accent],
    ['Hose', c.look.bottom.color], ['Schuhe', c.look.shoes], ['Augen', c.look.eyeColor], ['Handschuhe', c.look.gloves],
  ];
  return (
    <AbsoluteFill style={{ background: '#f4ead2', fontFamily: 'Montserrat, sans-serif', color: '#1a1410' }}>
      <div style={{ position: 'absolute', left: 50, top: 30, fontFamily: 'Anton, Impact, sans-serif', fontSize: 64 }}>{c.name}{c.nickname ? ` „${c.nickname}“` : ''}</div>
      <div style={{ position: 'absolute', left: 52, top: 112, fontWeight: 800, fontSize: 26 }}>{c.roleTitle} · {c.age} J. · {c.heightCm} cm · {c.weightKg} kg {c.weightClass ? `· ${c.weightClass}` : ''}</div>
      <svg viewBox={`-200 ${-H * 1.12} 1700 ${H * 1.22}`} width={1700} height={760} style={{ position: 'absolute', left: 50, top: 170 }}>
        {/* Größenraster */}
        {[0, 50, 100, 150, 200].map((cm) => (
          <g key={cm}><path d={`M-200,${-cm * 4.2} H1500`} stroke="#c9b98f" strokeWidth={2} strokeDasharray="8 8" /><text x={-195} y={-cm * 4.2 - 6} fontSize={22} fill="#8a7a55">{cm} cm</text></g>
        ))}
        {VIEWS.map((v, i) => (
          <g key={i} transform={`translate(${120 + i * 300} 0)`}>
            <CharacterRig look={c.look} heightCm={c.heightCm} frame={10} emotion={v.e} action={v.a} actionT={0.7} mouth={v.mouth} />
            <text x={0} y={H * 0.075} textAnchor="middle" fontFamily="Montserrat, sans-serif" fontWeight={800} fontSize={H * 0.032} fill="#1a1410">{v.label}</text>
          </g>
        ))}
      </svg>
      <div style={{ position: 'absolute', left: 50, top: 950, display: 'flex', gap: 18 }}>
        {swatches.map(([n, col]) => (
          <div key={n} style={{ textAlign: 'center', fontSize: 18, fontWeight: 800 }}>
            <div style={{ width: 90, height: 60, background: col, border: '4px solid #1a1410', borderRadius: 8 }} />
            {n}<br /><span style={{ fontWeight: 400 }}>{col}</span>
          </div>
        ))}
      </div>
      <div style={{ position: 'absolute', right: 50, top: 950, width: 560, fontSize: 20, lineHeight: 1.35 }}>
        <b>Fest:</b> {c.look.hair.style}, Bart: {c.look.facialHair.style}, Nase: {c.look.nose}, Statur: {c.look.build}
        {c.look.cauliflowerEar ? ', Blumenkohlohr' : ''}{c.look.accessories.length ? `, ${c.look.accessories.join(', ')}` : ''}.<br />
        <b>Kleidung:</b> {c.look.top.type}{c.look.top.print ? ` mit „${c.look.top.print}“` : ''}, {c.look.bottom.type}.
      </div>
    </AbsoluteFill>
  );
};
