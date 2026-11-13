/**
 * Die Remotion-Komposition einer BOXCLUB-Folge (1080 × 1920, 30 fps).
 * Identisch im Browser-Player (Vorschau) und beim MP4-Rendern.
 */
import React from 'react';
import { AbsoluteFill, Audio, Easing, Sequence, interpolate, staticFile, useCurrentFrame } from 'remotion';
import type { Character, Episode } from '../lib/types';
import { FPS, buildTimeline, subtitleChunks, type TimedLine, type TimedScene } from '../lib/timeline';
import { CharacterRig, type Action, type Emotion } from './Character';
import { FLOOR, Sandbag, SetDefs, getSet, type SetClub } from './Sets';

export interface EpisodeProps {
  episode: Episode;
  characters: Character[];
  club: SetClub;
  /** '' = Remotion-staticFile (Rendern), sonst URL-Präfix (z. B. /api/media) */
  assetBase: string;
  /** vorhandene Audiodateien (relativ zu data/media) */
  available: string[];
  [key: string]: unknown;
}

const POS_X: Record<string, number> = { ganz_links: 130, links: 335, mitte: 540, rechts: 745, ganz_rechts: 950 };
const SPEAKER_COLORS = ['#ffd23f', '#7fe3ff', '#ff9bd2', '#b4ff8a', '#ffb36b'];

export function asset(base: string, p: string) {
  return base ? `${base}/${p}` : staticFile(p);
}

const rnd = (i: number) => { const x = Math.sin(i * 91.7 + 17.3) * 43758.5453; return x - Math.floor(x); };

/* ----------------------------------------------------------------- Kamera */
interface Cam { x: number; y: number; z: number }

function speakerHeadY(c: Character | undefined, scale: number) {
  const H = (c?.heightCm ?? 175) * 4.2 * scale;
  return FLOOR - H * 0.86;
}

function cameraFor(ts: TimedScene, localSec: number, castX: Record<string, number>, chars: Map<string, Character>, scale: number, speakerId: string | null): Cam {
  const dur = ts.end - ts.start;
  const p = Math.min(1, Math.max(0, localSec / dur));
  const ids = Object.keys(castX);
  const center = ids.length ? ids.reduce((s, id) => s + castX[id], 0) / ids.length : 540;
  const sx = speakerId && castX[speakerId] !== undefined ? castX[speakerId] : center;
  const sc = speakerId ? chars.get(speakerId) : undefined;
  const headY = speakerHeadY(sc, scale);
  const smooth = (a: number, b: number, w: number) => a + (b - a) * w;
  switch (ts.scene.shot) {
    case 'totale':
      return { x: smooth(540, center, 0.3), y: 960 + 20, z: 1 + p * 0.05 };
    case 'halbnah':
      return { x: smooth(center, sx, 0.45), y: smooth(1060, headY + 260, 0.6), z: 1.28 + p * 0.06 };
    case 'nah':
      return { x: sx, y: headY + 190, z: 1.62 + p * 0.05 };
    case 'schwenk':
      return { x: interpolate(p, [0, 1], [center - 170, center + 150]), y: 1010, z: 1.18 };
    case 'zoom':
      return { x: smooth(540, sx, p), y: interpolate(p, [0, 1], [960, headY + 230], { easing: Easing.inOut(Easing.cubic) }), z: interpolate(p, [0, 1], [1.0, 1.45], { easing: Easing.inOut(Easing.cubic) }) };
    case 'dolly':
    default:
      return { x: smooth(center, sx, 0.35) + Math.sin(localSec * 0.6) * 20, y: smooth(1040, headY + 260, 0.5), z: 1.16 + p * 0.16 };
  }
}

/* ------------------------------------------------------------------ Szene */

const SceneView: React.FC<{ ts: TimedScene; props: EpisodeProps; chars: Map<string, Character>; next: TimedScene | undefined }> = ({ ts, props, chars }) => {
  const f = useCurrentFrame(); // lokal in der Sequence
  const gf = f + ts.startFrame;
  const gsec = gf / FPS;
  const localSec = f / FPS;
  const scale = ts.scene.cast.length >= 5 ? 0.7 : ts.scene.cast.length === 4 ? 0.78 : ts.scene.cast.length === 3 ? 0.9 : 1;

  const castX: Record<string, number> = {};
  ts.scene.cast.forEach((c) => { castX[c.characterId] = POS_X[c.position] ?? 540; });

  // aktuelle Zeile (oder die letzte gesprochene)
  const current = ts.lines.find((l) => gsec >= l.start && gsec < l.end + l.line.pauseAfter) ?? null;
  const lastSpoken = [...ts.lines].reverse().find((l) => gsec >= l.start) ?? null;
  const speakerId = (current ?? lastSpoken)?.line.speaker ?? null;

  // weiche Kamerafahrt zwischen Sprechern: Mittelwert über 10 Frames
  const camAt = (sec: number) => {
    const cl = ts.lines.find((l) => sec >= l.start && sec < l.end + l.line.pauseAfter) ?? [...ts.lines].reverse().find((l) => sec >= l.start) ?? ts.lines[0];
    return cameraFor(ts, sec - ts.start, castX, chars, scale, cl?.line.speaker ?? null);
  };
  let cam: Cam = { x: 0, y: 0, z: 0 };
  const N = 8;
  for (let i = 0; i < N; i++) {
    const c = camAt(Math.max(ts.start, gsec - i * 0.06));
    cam = { x: cam.x + c.x / N, y: cam.y + c.y / N, z: cam.z + c.z / N };
  }
  // Szenenübergang: Wischschwenk
  const tIn = interpolate(f, [0, 9], [1, 0], { extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  cam.x += tIn * 260 * (ts.index % 2 ? -1 : 1);
  // Handkamera
  cam.x += Math.sin(gf * 0.037) * 4 + Math.sin(gf * 0.11) * 1.5;
  cam.y += Math.cos(gf * 0.029) * 3;

  const layer = (k: number) => {
    const z = 1 + (cam.z - 1) * k;
    const fx = 540 + (cam.x - 540) * k;
    const fy = 960 + (cam.y - 960) * k;
    return `translate(540 960) scale(${z}) translate(${-fx} ${-fy})`;
  };

  // Arena-Plätze: von → bis über die Szene (ab 0,6 s, weich)
  const seats = ts.scene.seats;
  const seatsFilled = seats ? interpolate(localSec, [0.6, Math.max(1.2, (ts.end - ts.start) * 0.85)], [seats.from, seats.to], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad) }) : undefined;
  const ov = ts.scene.setOverrides ?? {};
  const setClub = {
    ...props.club,
    ...(ov.sandbags !== undefined ? { sandbags: ov.sandbags } : {}),
    ...(ov.condition !== undefined ? { condition: ov.condition } : {}),
    ...(ov.hasNewRing !== undefined ? { hasNewRing: ov.hasNewRing } : {}),
    ...(ov.mirrorOk !== undefined ? { mirrorOk: ov.mirrorOk } : {}),
  };
  const dream = ts.scene.fx === 'traum';
  const set = getSet(ts.scene.location, gf, setClub, { seatsFilled });

  return (
    <AbsoluteFill>
      <svg viewBox="0 0 1080 1920" width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
        <SetDefs />
        <g transform={layer(0.72)}>{set.back}</g>
        <g transform={layer(1)}>
          {set.mid}
          {(ts.scene.props ?? []).map((pr, k) => <PropSandbag key={k} p={pr} localSec={localSec} gf={gf} />)}
          {ts.scene.cast.map((c, i) => {
            const ch = chars.get(c.characterId);
            if (!ch) return null;
            const own = ts.lines.filter((l) => l.line.speaker === c.characterId);
            const speaking = own.find((l) => gsec >= l.start && gsec < l.end);
            const lastOwn = [...own].reverse().find((l) => gsec >= l.start);
            const emotion: Emotion = (speaking ?? lastOwn)?.line.emotion ?? 'neutral';
            let action: Action = 'keine';
            let actionT = 0;
            if (speaking) {
              action = speaking.line.action;
              actionT = (gsec - speaking.start) / Math.max(0.5, speaking.end - speaking.start);
            } else if (lastOwn && gsec - lastOwn.end < 0.6 && ['zeigen', 'arme_verschraenkt', 'faust_heben', 'jubeln'].includes(lastOwn.line.action)) {
              action = lastOwn.line.action; actionT = 1;
            } else if (lastOwn?.line.action === 'arme_verschraenkt') {
              action = 'arme_verschraenkt'; actionT = 1;
            } else if (c.action && c.action !== 'keine') {
              // Daueraktion aus der Besetzung (z. B. trainiert im Hintergrund)
              action = c.action; actionT = c.action === 'auftritt' ? localSec / 1.2 : 0.7;
            }
            let mouth = 0;
            if (speaking) {
              const lf = gf - speaking.startFrame;
              const syl = Math.abs(Math.sin(lf * 0.85 + i));
              mouth = syl * (0.45 + 0.55 * rnd(Math.floor(lf / 4) + i * 13));
              if (speaking.endFrame - gf < 3) mouth *= 0.3;
            }
            // Blickrichtung: zum Sprecher
            let facing = c.facing;
            if (speakerId && speakerId !== c.characterId && castX[speakerId] !== undefined) facing = castX[speakerId] > castX[c.characterId] ? 'rechts' : 'links';
            const isFocus = !speakerId || speakerId === c.characterId;
            const x = castX[c.characterId];
            // Auftritt: von außen hereinlaufen
            let dx = 0;
            if (action === 'auftritt') dx = interpolate(actionT, [0, 0.5], [x < 540 ? -700 : 700, 0], { extrapolateRight: 'clamp', easing: Easing.out(Easing.quad) });
            const bob = speaking ? Math.abs(Math.sin(gf * 0.18)) * -4 : 0;
            return (
              <g key={c.characterId} transform={`translate(${x + dx} ${FLOOR + bob}) scale(${scale})`}>
                <CharacterRig look={ch.look} heightCm={ch.heightCm} frame={gf} seed={i + 1} emotion={emotion} action={action} actionT={actionT} mouth={mouth} facing={facing} dim={!isFocus && ts.scene.cast.length > 1} />
              </g>
            );
          })}
        </g>
        <g transform={layer(1.3)}>{set.front}</g>
      </svg>
      {/* Farbstimmung + Vignette */}
      <AbsoluteFill style={{ background: set.tint, mixBlendMode: 'soft-light' }} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)' }} />
      {/* Weißblitz beim Schnitt */}
      <AbsoluteFill style={{ background: '#fff', opacity: interpolate(f, [0, 5], [ts.index === 0 ? 0 : 0.35, 0], { extrapolateRight: 'clamp' }) }} />
      {ts.scene.overlay && <OverlayStamp text={ts.scene.overlay} f={f - (ts.index === 0 ? 84 : 12)} />}
      {seats && seats.hud && seatsFilled !== undefined && <SeatHud filled={seatsFilled} total={seats.total} goal={seats.goal ?? null} f={f} />}
      {ts.scene.kasse && <KasseHud amount={ts.scene.kasse.amount} from={ts.scene.kasse.from ?? null} likeGoal={ts.scene.kasse.likeGoal ?? null} perLike={ts.scene.kasse.perLike} f={f} top={seats?.hud ? 760 : 470} />}
      {ts.scene.comment && <CommentCard c={ts.scene.comment} f={f} />}
      {dream && <DreamFx f={f} />}
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------- Requisiten */

const BAG_TOP = 600; // Kettenende; Sack reicht von y≈685 bis y≈1105
const PropSandbag: React.FC<{ p: { x: number; fallAt: number | null; fallen: boolean; color: string; hitAt: number | null }; localSec: number; gf: number }> = ({ p, localSec, gf }) => {
  const fallDur = 0.36;
  const tFall = p.fallAt === null ? -1 : localSec - p.fallAt;
  // liegt am Boden
  const lying = p.fallen || (p.fallAt !== null && tFall >= fallDur + 0.22);
  if (lying) {
    const settle = p.fallen ? 1 : Math.min(1, (tFall - fallDur - 0.22) / 0.15);
    return (
      <g>
        <path d={`M${p.x},0 L${p.x},${BAG_TOP - 160}`} stroke="#444" strokeWidth={5} />
        <path d={`M${p.x},${BAG_TOP - 160} l-8,26 l10,18`} stroke="#444" strokeWidth={4} fill="none" />
        <ellipse cx={p.x + 120} cy={FLOOR - 4} rx={250} ry={26} fill="#d9c08a" stroke="#a88f5d" strokeWidth={3} />
        <g transform={`translate(${p.x + 120} ${FLOOR - 62 - (1 - settle) * 6})`}>
          <rect x={-210} y={-62} width={420} height={124} rx={56} fill={p.color} stroke="#1a1410" strokeWidth={5} />
          <rect x={-150} y={-62} width={22} height={124} fill="#1a1410" opacity={0.5} />
          <rect x={128} y={-62} width={22} height={124} fill="#1a1410" opacity={0.5} />
          <path d="M150,-20 l30,8 l-24,14 l26,10" stroke="#3a1410" strokeWidth={6} fill="none" />
          {Array.from({ length: 8 }).map((_, i) => <circle key={i} cx={200 + (i % 4) * 9} cy={-6 + Math.floor(i / 4) * 14} r={5} fill="#d9c08a" />)}
        </g>
      </g>
    );
  }
  if (p.fallAt !== null && tFall >= 0) {
    // Fall + Aufprall-Kippen
    const tf = Math.min(tFall, fallDur);
    const dy = 0.5 * ((2 * (FLOOR - 1105)) / (fallDur * fallDur)) * tf * tf;
    const tip = tFall > fallDur ? Math.min(1, (tFall - fallDur) / 0.22) : 0;
    const burst = tFall > fallDur ? tFall - fallDur : 0;
    return (
      <g>
        <path d={`M${p.x},0 L${p.x},${BAG_TOP - 160}`} stroke="#444" strokeWidth={5} />
        <g transform={`translate(0 ${dy}) rotate(${tip * 90} ${p.x + 62} ${1105})`}>
          <Sandbag x={p.x} frame={0} color={p.color} top={BAG_TOP} />
        </g>
        {burst > 0 && Array.from({ length: 22 }).map((_, i) => {
          const a = (i / 22) * Math.PI;
          const r = burst * (260 + (i % 5) * 60);
          return <circle key={i} cx={p.x + 60 + Math.cos(a) * r} cy={FLOOR - 20 - Math.sin(a) * r * 0.55 + burst * burst * 900} r={7 - (i % 3)} fill="#d9c08a" opacity={Math.max(0, 1 - burst * 2.2)} />;
        })}
        {burst > 0 && <ellipse cx={p.x + 80} cy={FLOOR - 30} rx={120 + burst * 500} ry={40 + burst * 120} fill="#e8d9b0" opacity={Math.max(0, 0.6 - burst * 1.3)} />}
      </g>
    );
  }
  // hängt (ggf. schwingt nach einem Treffer)
  const th = p.hitAt === null ? -1 : localSec - p.hitAt;
  const swing = th >= 0 ? Math.sin(th * 7) * 9 * Math.exp(-th * 1.4) : Math.sin(gf * 0.05) * 1.5;
  return <g transform={`rotate(${swing} ${p.x} 0)`}><Sandbag x={p.x} frame={0} color={p.color} top={BAG_TOP} /></g>;
};

/* ---------------------------------------------------------- Einblendungen */

const OverlayStamp: React.FC<{ text: string; f: number }> = ({ text, f }) => {
  if (f < 0) return null;
  const s = interpolate(f, [0, 6, 10], [2.2, 0.92, 1], { extrapolateRight: 'clamp' });
  const o = interpolate(f, [0, 4], [0, 1], { extrapolateRight: 'clamp' });
  return (
    <div style={{ position: 'absolute', top: 300, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: o }}>
      <div style={{ transform: `scale(${s}) rotate(-3deg)`, background: '#f4ead2', color: '#8c1d2c', border: '8px solid #8c1d2c', borderRadius: 14, padding: '14px 34px', fontFamily: 'Anton, Impact, sans-serif', fontSize: 62, letterSpacing: 3, boxShadow: '0 10px 0 rgba(0,0,0,0.35)', maxWidth: 900, textAlign: 'center', lineHeight: 1.1, whiteSpace: 'pre-line' }}>
        {text}
      </div>
    </div>
  );
};

/** Sitzplatz-Zähler „ARENA 37/100“ – 1 neuer Follower = 1 Platz */
const SeatHud: React.FC<{ filled: number; total: number; goal?: number | null; f: number }> = ({ filled, total, goal = null, f }) => {
  const o = interpolate(f, [8, 16], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const n = Math.round(filled);
  const pct = Math.min(1, n / total);
  return (
    <div style={{ position: 'absolute', top: 470, left: 90, right: 170, opacity: o, fontFamily: 'Montserrat, sans-serif', color: '#fff' }}>
      <div style={{ background: 'rgba(12,10,14,0.82)', border: '5px solid #f4ead2', borderRadius: 22, padding: '18px 26px', boxShadow: '0 10px 0 rgba(0,0,0,0.35)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 50, letterSpacing: 2 }}>ARENA</div>
          <div style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 64, color: n >= total ? '#7dff9b' : '#ffd23f' }}>{n} / {total}</div>
        </div>
        <div style={{ position: 'relative', height: 26, background: '#2a2530', borderRadius: 99, overflow: 'visible', border: '3px solid #000', margin: '8px 0 10px' }}>
          <div style={{ width: `${pct * 100}%`, height: '100%', background: 'linear-gradient(90deg, #c8302a, #ffd23f)' }} />
          {goal !== null && <div style={{ position: 'absolute', left: `${(goal / total) * 100}%`, top: -6, bottom: -6, width: 6, background: '#7dff9b', transform: 'translateX(-3px)', borderRadius: 3 }} />}
        </div>
        <div style={{ fontWeight: 900, fontSize: 34 }}>{goal !== null && n < goal ? `Ziel ${goal}: noch ${goal - n} Follower! 🎯` : '1 neuer Follower = 1 Platz 🥊'}</div>
      </div>
    </div>
  );
};

/** Vereinskasse (symbolisch) – zeigt nur den gespeicherten Kassenstand + die Like-Regel */
const KasseHud: React.FC<{ amount: number; from?: number | null; likeGoal?: number | null; perLike: number; f: number; top: number }> = ({ amount, from = null, likeGoal = null, perLike, f, top }) => {
  const o = interpolate(f, [10, 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  // Hochzählen nur zwischen zwei gespeicherten (echten) Ständen
  const shown = from === null ? amount : Math.round(interpolate(f, [24, 66], [from, amount], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.quad) }));
  const plus = from !== null && f > 66 ? amount - from : 0;
  return (
    <div style={{ position: 'absolute', top, left: 90, right: 170, opacity: o, fontFamily: 'Montserrat, sans-serif', color: '#1a1410' }}>
      <div style={{ background: '#f4ead2', border: '5px solid #8c1d2c', borderRadius: 22, padding: '14px 24px', boxShadow: '0 10px 0 rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', gap: 20, position: 'relative', overflow: 'visible' }}>
        <div style={{ fontSize: 70 }}>💰</div>
        <div style={{ flex: 1, paddingRight: 70 }}>
          <div style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 40, color: '#8c1d2c', letterSpacing: 1 }}>VEREINSKASSE: {shown} €{plus > 0 && <span style={{ color: '#2f7a46', fontSize: 34 }}> (+{plus} €)</span>}</div>
          <div style={{ fontWeight: 900, fontSize: 32 }}>❤️ 1 Like = +{perLike} € (symbolisch)</div>
          {likeGoal !== null && <div style={{ fontWeight: 900, fontSize: 30, color: '#2f7a46' }}>🎯 Ziel: {likeGoal} Likes = +{likeGoal * perLike} €</div>}
        </div>
        {/* fallende Münzen */}
        {Array.from({ length: 6 }).map((_, i) => {
          const t = ((f + i * 9) % 54) / 54;
          return <div key={i} style={{ position: 'absolute', right: 18 + (i % 3) * 26, top: -50 + t * 110, opacity: t < 0.85 ? 1 : 0, fontSize: 30 }}>🪙</div>;
        })}
      </div>
    </div>
  );
};

/** Kommentar-Karte im Stil eines Social-Kommentars – anonym, klar als unbestätigt markiert */
const CommentCard: React.FC<{ c: { author: string; text: string; tag: string }; f: number }> = ({ c, f }) => {
  const s = interpolate(f, [4, 12], [0.6, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(2)) });
  const o = interpolate(f, [4, 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <div style={{ position: 'absolute', top: 360, left: 80, right: 160, opacity: o, transform: `scale(${s})`, transformOrigin: 'left top', fontFamily: 'Montserrat, sans-serif' }}>
      <div style={{ background: '#fff', borderRadius: 26, padding: '22px 26px', boxShadow: '0 14px 0 rgba(0,0,0,0.3)', border: '4px solid #1a1410' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
          <div style={{ width: 54, height: 54, borderRadius: 99, background: '#9aa0a6', border: '3px solid #1a1410' }} />
          <div style={{ fontWeight: 800, fontSize: 30, color: '#555' }}>{c.author}</div>
          <div style={{ marginLeft: 'auto', fontSize: 34 }}>💬</div>
        </div>
        <div style={{ fontWeight: 900, fontSize: 40, color: '#1a1410', lineHeight: 1.18 }}>{c.text}</div>
        <div style={{ marginTop: 12, display: 'inline-block', background: '#ffd23f', color: '#1a1410', fontWeight: 900, fontSize: 24, padding: '4px 12px', borderRadius: 8 }}>{c.tag}</div>
      </div>
    </div>
  );
};

/** Traumsequenz: weiches Licht, Funkeln, Rahmen */
const DreamFx: React.FC<{ f: number }> = ({ f }) => (
  <AbsoluteFill style={{ pointerEvents: 'none' }}>
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 45%, rgba(255,255,255,0) 50%, rgba(255,240,200,0.75) 100%)' }} />
    <AbsoluteFill style={{ background: 'rgba(255,220,160,0.10)', mixBlendMode: 'screen' }} />
    {Array.from({ length: 18 }).map((_, i) => {
      const x = (i * 137) % 1000 + 40, y = ((i * 251) % 1500) + 150 - ((f * (1 + (i % 3))) % 200);
      const a = 0.4 + 0.6 * Math.abs(Math.sin(f * 0.15 + i));
      return <div key={i} style={{ position: 'absolute', left: x, top: y, fontSize: 30 + (i % 3) * 12, opacity: a, color: '#fff7d0' }}>✦</div>;
    })}
    <div style={{ position: 'absolute', top: 210, right: 150, transform: 'rotate(4deg)', fontFamily: 'Anton, Impact, sans-serif', fontSize: 48, color: '#8c1d2c', background: '#fff7e0', padding: '4px 18px', borderRadius: 10, border: '4px solid #8c1d2c' }}>TRAUM 💭</div>
  </AbsoluteFill>
);

const Bug: React.FC<{ ep: Episode }> = ({ ep }) => (
  <div style={{ position: 'absolute', top: 150, left: 48, display: 'flex', alignItems: 'center', gap: 14, fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 30, color: '#fff', textShadow: '0 3px 8px rgba(0,0,0,0.7)' }}>
    <div style={{ background: '#8c1d2c', border: '4px solid #f4ead2', borderRadius: 12, padding: '4px 14px', fontFamily: 'Anton, Impact, sans-serif', fontWeight: 400, fontSize: 34, letterSpacing: 2 }}>BOXCLUB</div>
    <div>FOLGE {ep.number}</div>
  </div>
);

const TitleCard: React.FC<{ ep: Episode }> = ({ ep }) => {
  const f = useCurrentFrame();
  if (ep.titleCard === 'klein') {
    const ok = interpolate(f, [0, 6, 70, 80], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    return (
      <div style={{ position: 'absolute', top: 214, left: 48, opacity: ok, display: 'flex', gap: 10, alignItems: 'center' }}>
        <div style={{ background: '#f4ead2', color: '#1a1410', fontFamily: 'Anton, Impact, sans-serif', fontSize: 34, padding: '2px 14px', letterSpacing: 3 }}>FOLGE {ep.number}</div>
        <div style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 44, color: '#fff', WebkitTextStroke: '6px #1a1410', paintOrder: 'stroke fill', textTransform: 'uppercase' }}>{ep.title}</div>
      </div>
    );
  }
  const o = interpolate(f, [0, 6, 64, 78], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const y = interpolate(f, [0, 10], [-40, 0], { extrapolateRight: 'clamp', easing: Easing.out(Easing.back(2)) });
  return (
    <div style={{ position: 'absolute', top: 260, left: 0, right: 0, textAlign: 'center', opacity: o, transform: `translateY(${y}px)` }}>
      <div style={{ display: 'inline-block', background: '#f4ead2', color: '#1a1410', fontFamily: 'Anton, Impact, sans-serif', fontSize: 46, padding: '4px 24px', letterSpacing: 6, transform: 'rotate(-2deg)' }}>FOLGE {ep.number}</div>
      <div style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 132, color: '#fff', lineHeight: 1.05, marginTop: 10, textTransform: 'uppercase', WebkitTextStroke: '10px #1a1410', paintOrder: 'stroke fill', textShadow: '0 12px 0 rgba(0,0,0,0.35)', padding: '0 60px' }}>{ep.title}</div>
    </div>
  );
};

const Subtitles: React.FC<{ lines: TimedLine[]; chars: Map<string, Character>; until: number }> = ({ lines, chars, until }) => {
  const frame = useCurrentFrame();
  const sec = frame / FPS;
  if (sec >= until) return null;
  const tl = lines.find((l) => sec >= l.start && sec < l.end + 0.15);
  if (!tl) return null;
  const chunks = subtitleChunks(tl);
  const chunk = chunks.find((c, i) => sec >= c.start && (sec < c.end || i === chunks.length - 1)) ?? chunks[0];
  const ch = chars.get(tl.line.speaker);
  const pop = interpolate(sec - chunk.start, [0, 0.08], [0.85, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const colorIdx = ch ? Math.abs([...ch.id].reduce((s, c) => s + c.charCodeAt(0), 0)) % SPEAKER_COLORS.length : 0;
  return (
    <div style={{ position: 'absolute', left: 60, right: 140, top: 1255, textAlign: 'center' }}>
      <div style={{ display: 'inline-block', fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 30, color: '#1a1410', background: SPEAKER_COLORS[colorIdx], padding: '4px 16px', borderRadius: 10, marginBottom: 12, transform: 'rotate(-1.5deg)' }}>
        {ch ? (ch.nickname && !ch.nickname.includes(' ') && ch.role !== 'gruender' ? ch.nickname : ch.name.split(' ')[0]) : 'Erzähler'}
      </div>
      <div style={{ transform: `scale(${pop})`, fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 78, lineHeight: 1.12, color: '#fff', WebkitTextStroke: '13px #111', paintOrder: 'stroke fill', textTransform: 'uppercase' }}>
        {chunk.words.map((w, i) => (
          <span key={i} style={{ color: sec >= w.start ? (sec < w.end + 0.05 ? SPEAKER_COLORS[0] : '#fff') : 'rgba(255,255,255,0.92)' }}>{w.word}{i < chunk.words.length - 1 ? ' ' : ''}</span>
        ))}
      </div>
    </div>
  );
};

/** Endtafel „Arena füllen“ – Mitmach-Aufruf statt Abstimmung */
const ArenaEndCard: React.FC<{ ep: Episode }> = ({ ep }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 8], [0, 1], { extrapolateRight: 'clamp' });
  const ec = ep.endCard;
  const filled = Math.round(ec.seatsFilled);
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <AbsoluteFill style={{ background: 'rgba(10,8,8,0.97)' }} />
      <div style={{ position: 'absolute', top: 330, left: 70, right: 150, fontFamily: 'Montserrat, sans-serif', color: '#fff', textAlign: 'center' }}>
        <div style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 50, color: '#ffd23f', letterSpacing: 3 }}>{ec.headline || 'HILF UNS!'}</div>
        <div style={{ fontWeight: 900, fontSize: 66, lineHeight: 1.08, margin: '10px 0 26px' }}>{ep.decision.question}</div>
        {/* 10 × 10 Mini-Arena */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(20, 1fr)', gap: 7, width: 760, margin: '0 auto', padding: 18, background: '#1e2232', borderRadius: 18, border: '5px solid #f4ead2' }}>
          {Array.from({ length: ec.seatsTotal }).map((_, i) => {
            const on = i < filled;
            const pop = interpolate(f, [10 + (i % 20), 16 + (i % 20)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
            const inGoal = !on && ec.seatsGoal !== null && i < ec.seatsGoal;
            return <div key={i} style={{ height: 22, borderRadius: 5, background: on ? '#ffd23f' : '#b3262e', border: inGoal ? '3px solid #7dff9b' : '2px solid #000', transform: `scale(${0.6 + pop * 0.4})` }} />;
          })}
        </div>
        <div style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 64, marginTop: 14 }}>{filled} / {ec.seatsTotal} PLÄTZE</div>
        {ec.seatsGoal !== null && filled < ec.seatsGoal && <div style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 46, color: '#7dff9b', marginTop: 2 }}>ZIEL {ec.seatsGoal}: NOCH {ec.seatsGoal - filled} FOLLOWER</div>}
        {ec.lines.map((l, i) => (
          <div key={i} style={{ fontWeight: i === 0 ? 900 : 800, fontSize: i === 0 ? 44 : 38, color: i === 0 ? '#fff' : '#f4ead2', marginTop: 12, lineHeight: 1.15 }}>{l}</div>
        ))}
        <div style={{ marginTop: 26, display: 'inline-block', fontFamily: 'Anton, Impact, sans-serif', fontSize: 58, color: '#1a1410', background: '#ffd23f', padding: '6px 26px', borderRadius: 12, transform: `rotate(-2deg) scale(${interpolate(f, [20, 28], [0.6, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(2)) })})` }}>FOLGE {ep.number + 1} KOMMT BALD!</div>
      </div>
    </AbsoluteFill>
  );
};

const EndCard: React.FC<{ ep: Episode }> = ({ ep }) => {
  if (ep.endCard?.type === 'arena') return <ArenaEndCard ep={ep} />;
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 8], [0, 1], { extrapolateRight: 'clamp' });
  const colors: Record<string, string> = { A: '#c8302a', B: '#2a54b8', C: '#d9a63a', D: '#3f8f5c' };
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <AbsoluteFill style={{ background: 'rgba(10,8,8,0.95)' }} />
      <div style={{ position: 'absolute', top: ep.decision.options.length > 3 ? 330 : 420, left: 70, right: 150, fontFamily: 'Montserrat, sans-serif', color: '#fff' }}>
        <div style={{ fontFamily: 'Anton, Impact, sans-serif', fontSize: 48, color: '#ffd23f', letterSpacing: 4 }}>DU ENTSCHEIDEST</div>
        <div style={{ fontWeight: 900, fontSize: 70, lineHeight: 1.08, margin: '12px 0 40px' }}>{ep.decision.question}</div>
        {ep.decision.options.map((op, i) => {
          const s = interpolate(f, [6 + i * 6, 14 + i * 6], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.8)) });
          return (
            <div key={op.key} style={{ display: 'flex', alignItems: 'center', gap: 26, marginBottom: ep.decision.options.length > 3 ? 22 : 30, transform: `scale(${s})`, transformOrigin: 'left center' }}>
              <div style={{ width: 120, height: 120, borderRadius: 24, background: colors[op.key], border: '6px solid #f4ead2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Anton, Impact, sans-serif', fontSize: 80 }}>{op.key}</div>
              <div style={{ fontWeight: 800, fontSize: 46, lineHeight: 1.15, flex: 1 }}>{op.label}</div>
            </div>
          );
        })}
        {(ep.endCard?.lines?.length ?? 0) > 0
          ? ep.endCard!.lines.map((t, i) => <div key={i} style={{ marginTop: i === 0 ? 30 : 10, fontWeight: 800, fontSize: i === 0 ? 40 : 34, color: '#f4ead2' }}>{t}{i === 0 ? ' 👇' : ''}</div>)
          : <div style={{ marginTop: 30, fontWeight: 800, fontSize: 40, color: '#f4ead2' }}>Schreib {ep.decision.options.map((o) => o.key).join(', ').replace(/, ([^,]*)$/, ' oder $1')} in die Kommentare 👇</div>}
        <div style={{ marginTop: 18, fontFamily: 'Anton, Impact, sans-serif', fontSize: 40, color: '#ffd23f', letterSpacing: 3 }}>FORTSETZUNG FOLGT – FOLGE {ep.number + 1}</div>
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ Audio */

const MUSIC_VOL = 0.16;

const AudioTracks: React.FC<{ props: EpisodeProps; scenes: TimedScene[]; lines: TimedLine[]; totalFrames: number }> = ({ props, scenes, lines, totalFrames }) => {
  const has = (p: string) => props.available.includes(p);
  const src = (p: string) => asset(props.assetBase, p);
  // Musik: zusammenhängende Szenen mit gleicher Stimmung als ein Block
  const blocks: { mood: string; from: number; to: number }[] = [];
  scenes.forEach((s) => {
    const last = blocks[blocks.length - 1];
    if (last && last.mood === s.scene.music) last.to = s.startFrame + s.durationFrames;
    else blocks.push({ mood: s.scene.music, from: s.startFrame, to: s.startFrame + s.durationFrames });
  });
  return (
    <>
      {blocks.map((b, i) => {
        const file = `audio/music/${b.mood}.wav`;
        if (!has(file)) return null;
        const len = Math.min(totalFrames, b.to + 15) - b.from;
        return (
          <Sequence key={`m${i}`} from={b.from} durationInFrames={Math.max(1, len)}>
            <Audio src={src(file)} loop volume={(f) => {
              const fadeIn = interpolate(f, [0, 12], [0, 1], { extrapolateRight: 'clamp' });
              const fadeOut = interpolate(f, [len - 15, len], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
              // Ducking während gesprochen wird
              const gs = (f + b.from) / FPS;
              const talking = lines.some((l) => gs >= l.start - 0.05 && gs < l.end + 0.05);
              return MUSIC_VOL * fadeIn * fadeOut * (talking ? 0.55 : 1);
            }} />
          </Sequence>
        );
      })}
      {lines.map((l) => {
        const out: React.ReactNode[] = [];
        if (l.line.audio && has(l.line.audio.file)) {
          out.push(<Sequence key={`v${l.line.id}`} from={l.startFrame} durationInFrames={Math.max(1, l.endFrame - l.startFrame + 6)}><Audio src={src(l.line.audio.file)} volume={1} /></Sequence>);
        } else {
          const babble = `audio/babble/${l.line.speaker}-${Math.round((l.end - l.start) * 10)}.wav`;
          if (has(babble)) out.push(<Sequence key={`b${l.line.id}`} from={l.startFrame} durationInFrames={Math.max(1, l.endFrame - l.startFrame)}><Audio src={src(babble)} volume={0.55} /></Sequence>);
        }
        if (l.line.sfx && has(`audio/sfx/${l.line.sfx}.wav`)) {
          out.push(<Sequence key={`s${l.line.id}`} from={Math.max(0, l.startFrame - 4)} durationInFrames={FPS * 3}><Audio src={src(`audio/sfx/${l.line.sfx}.wav`)} volume={0.18} /></Sequence>);
        }
        return out;
      })}
      {scenes.slice(1).map((s) => has('audio/sfx/whoosh.wav') ? <Sequence key={`w${s.index}`} from={Math.max(0, s.startFrame - 3)} durationInFrames={20}><Audio src={src('audio/sfx/whoosh.wav')} volume={0.08} /></Sequence> : null)}
    </>
  );
};

/* ------------------------------------------------------------- Komposition */

export const EpisodeComposition: React.FC<EpisodeProps> = (props) => {
  const { episode } = props;
  const tl = React.useMemo(() => buildTimeline(episode), [episode]);
  const chars = React.useMemo(() => new Map(props.characters.map((c) => [c.id, c])), [props.characters]);
  const endFrom = Math.round(tl.endCardStart * FPS);
  return (
    <AbsoluteFill style={{ background: '#111' }}>
      {tl.scenes.map((ts, i) => (
        <Sequence key={ts.scene.id} from={ts.startFrame} durationInFrames={Math.max(1, ts.durationFrames)}>
          <SceneView ts={ts} props={props} chars={chars} next={tl.scenes[i + 1]} />
        </Sequence>
      ))}
      <Bug ep={episode} />
      <Sequence from={0} durationInFrames={80}><TitleCard ep={episode} /></Sequence>
      <Subtitles lines={tl.lines} chars={chars} until={tl.endCardStart} />
      <Sequence from={endFrom}><EndCard ep={episode} /></Sequence>
      <AudioTracks props={props} scenes={tl.scenes} lines={tl.lines} totalFrames={tl.totalFrames} />
    </AbsoluteFill>
  );
};

export function episodeDuration(ep: Episode) {
  return Math.max(30, buildTimeline(ep).totalFrames);
}
