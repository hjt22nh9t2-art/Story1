'use client';
/** Figur anlegen/bearbeiten mit Live-Vorschau des Rigs. */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ACCESSORIES, AGE_LOOKS, BOTTOMS, BROWS, BUILDS, CHAR_STATUS, EMOTIONS, FACIAL_HAIR, HAIR_STYLES, NOSES, ROLES, TOPS, type Character,
} from '@/lib/types';
import { CharacterPortrait, type Emotion } from '@/remotion/Character';
import { api } from './client';

const slug = (s: string) => s.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/ı/g, 'i').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function CharacterEditor({ initial, isNew, appearances }: { initial: Character; isNew: boolean; appearances: number[] }) {
  const router = useRouter();
  const [c, setC] = useState<Character>(initial);
  const [emotion, setEmotion] = useState<Emotion>('neutral');
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof Character>(k: K, v: Character[K]) => setC({ ...c, [k]: v });
  const setLook = (patch: Partial<Character['look']>) => setC({ ...c, look: { ...c.look, ...patch } });
  const lookChanged = JSON.stringify(c.look) !== JSON.stringify(initial.look) || c.heightCm !== initial.heightCm;

  async function save() {
    setErr(''); setMsg(''); setBusy(true);
    try {
      let reason = '';
      if (!isNew && initial.lookLocked && lookChanged) {
        reason = prompt(`${c.name} ist seit Folge ${initial.firstEpisode} zu sehen. Ein neues Aussehen braucht einen Story-Grund (gilt ab der nächsten Folge):`) ?? '';
        if (!reason) { setBusy(false); return; }
      }
      const body = { ...c, id: isNew ? c.id || slug(c.name) : c.id, lookChangeReason: reason };
      const saved = await api<Character>(isNew ? '/api/characters' : `/api/characters/${c.id}`, isNew ? 'POST' : 'PUT', body);
      setMsg('Gespeichert.');
      if (isNew) router.push(`/charaktere/${saved.id}`); else { setC(saved); router.refresh(); }
    } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  }
  async function concept() {
    setErr(''); setBusy(true);
    try { const r = await api<Character>(`/api/characters/${c.id}/image`, 'POST'); setC(r); } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  }

  const txt = (k: keyof Character, label: string, area = false) => (
    <label className="f"><span>{label}</span>{area ? <textarea value={String(c[k] ?? '')} onChange={(e) => set(k, e.target.value as never)} /> : <input value={String(c[k] ?? '')} onChange={(e) => set(k, e.target.value as never)} />}</label>
  );
  const num = (k: 'age' | 'heightCm' | 'weightKg', label: string) => <label className="f"><span>{label}</span><input type="number" value={c[k]} onChange={(e) => set(k, Number(e.target.value))} /></label>;
  const sel = <T extends string>(label: string, val: T, opts: readonly T[], on: (v: T) => void) => <label className="f"><span>{label}</span><select value={val} onChange={(e) => on(e.target.value as T)}>{opts.map((o) => <option key={o}>{o}</option>)}</select></label>;
  const col = (label: string, val: string, on: (v: string) => void) => <label className="f"><span>{label}</span><div className="row" style={{ flexWrap: 'nowrap' }}><input type="color" value={val} onChange={(e) => on(e.target.value)} style={{ width: 46, padding: 2 }} /><input value={val} onChange={(e) => on(e.target.value)} /></div></label>;

  return (
    <div className="grid" style={{ gridTemplateColumns: 'minmax(260px, 340px) 1fr', alignItems: 'start' }}>
      <div className="card sticky" style={{ textAlign: 'center' }}>
        <CharacterPortrait look={c.look} heightCm={c.heightCm} size={280} emotion={emotion} frame={20} mouth={emotion === 'ueberrascht' ? 0.7 : 0} />
        <div className="row" style={{ justifyContent: 'center', marginTop: 8 }}>
          {EMOTIONS.map((e) => <button key={e} className={`btn small ${e === emotion ? 'gold' : ''}`} onClick={() => setEmotion(e)}>{e}</button>)}
        </div>
        {initial.lookLocked && <div className="warn" style={{ marginTop: 12, textAlign: 'left', fontSize: 13 }}>🔒 Aussehen gesperrt (seit Folge {initial.firstEpisode}). Änderungen nur mit Story-Grund.{c.lookHistory.length ? <ul>{c.lookHistory.map((h, i) => <li key={i}>ab F{h.episode}: {h.reason}</li>)}</ul> : null}</div>}
        {appearances.length > 0 && <p className="muted" style={{ fontSize: 13 }}>Auftritte: Folge {appearances.join(', ')}</p>}
        {c.conceptImage && <img src={`/api/media/${c.conceptImage}`} alt="KI-Konzeptbild" style={{ width: '100%', borderRadius: 10, marginTop: 10 }} />}
        {!isNew && <button className="btn small" style={{ marginTop: 10 }} disabled={busy} onClick={concept}>KI-Konzeptbild erzeugen</button>}
      </div>
      <div className="grid">
        <div className="row between"><h1>{isNew ? 'Neue Figur' : c.name}</h1><button className="btn primary" disabled={busy || !c.name} onClick={save}>Speichern</button></div>
        {err && <div className="err">{err}</div>}{msg && <div className="ok">{msg}</div>}
        <div className="card">
          <h3>Identität &amp; Rolle</h3>
          <div className="grid g3">
            {txt('name', 'Name')}{txt('nickname', 'Spitzname')}
            <label className="f"><span>ID {isNew ? '(leer = aus Name)' : '(fest)'}</span><input value={c.id} disabled={!isNew} onChange={(e) => set('id', slug(e.target.value))} placeholder={slug(c.name)} /></label>
            {sel('Rolle', c.role, ROLES, (v) => set('role', v))}{txt('roleTitle', 'Funktion im Verein')}{sel('Status', c.status, CHAR_STATUS, (v) => set('status', v))}
            {num('age', 'Alter')}{num('heightCm', 'Größe (cm)')}{num('weightKg', 'Gewicht (kg)')}
            {txt('weightClass', 'Gewichtsklasse')}{txt('catchphrase', 'Spruch')}{txt('goal', 'Ziel')}
          </div>
          {c.role === 'boxer' && (
            <div className="grid g4">
              {(['technik', 'kraft', 'kondition', 'disziplin'] as const).map((k) => (
                <label key={k} className="f"><span>{k} (1–10)</span><input type="number" min={1} max={10} value={c.stats?.[k] ?? 5} onChange={(e) => set('stats', { technik: 5, kraft: 5, kondition: 5, disziplin: 5, ...c.stats, [k]: Number(e.target.value) })} /></label>
              ))}
            </div>
          )}
        </div>
        <div className="card">
          <h3>Persönlichkeit</h3>
          <div className="grid g2">{txt('personality', 'Persönlichkeit', true)}{txt('background', 'Hintergrundgeschichte', true)}{txt('speechStyle', 'Sprechstil', true)}{txt('notes', 'Notizen (für den Autor)', true)}</div>
          <div className="grid g2">
            <label className="f"><span>Stärken (Komma-getrennt)</span><input value={c.strengths.join(', ')} onChange={(e) => set('strengths', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))} /></label>
            <label className="f"><span>Schwächen (Komma-getrennt)</span><input value={c.weaknesses.join(', ')} onChange={(e) => set('weaknesses', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))} /></label>
          </div>
        </div>
        <div className="card">
          <h3>Aussehen (Charakterbibel)</h3>
          <div className="grid g4">
            {col('Haut', c.look.skin, (v) => setLook({ skin: v }))}
            {sel('Frisur', c.look.hair.style, HAIR_STYLES, (v) => setLook({ hair: { ...c.look.hair, style: v } }))}
            {col('Haarfarbe', c.look.hair.color, (v) => setLook({ hair: { ...c.look.hair, color: v } }))}
            {sel('Bart', c.look.facialHair.style, FACIAL_HAIR, (v) => setLook({ facialHair: { ...c.look.facialHair, style: v } }))}
            {col('Bartfarbe', c.look.facialHair.color, (v) => setLook({ facialHair: { ...c.look.facialHair, color: v } }))}
            {sel('Brauen', c.look.brows, BROWS, (v) => setLook({ brows: v }))}
            {col('Augen', c.look.eyeColor, (v) => setLook({ eyeColor: v }))}
            {sel('Nase', c.look.nose, NOSES, (v) => setLook({ nose: v }))}
            {sel('Statur', c.look.build, BUILDS, (v) => setLook({ build: v }))}
            {sel('Alterslook', c.look.ageLook, AGE_LOOKS, (v) => setLook({ ageLook: v }))}
            <label className="f"><span>Blumenkohlohr</span><select value={c.look.cauliflowerEar ? 'ja' : 'nein'} onChange={(e) => setLook({ cauliflowerEar: e.target.value === 'ja' })}><option>nein</option><option>ja</option></select></label>
            {sel('Oberteil', c.look.top.type, TOPS, (v) => setLook({ top: { ...c.look.top, type: v } }))}
            {col('Oberteil-Farbe', c.look.top.color, (v) => setLook({ top: { ...c.look.top, color: v } }))}
            {col('Akzentfarbe', c.look.top.accent, (v) => setLook({ top: { ...c.look.top, accent: v } }))}
            <label className="f"><span>Aufdruck (max. 12)</span><input maxLength={12} value={c.look.top.print} onChange={(e) => setLook({ top: { ...c.look.top, print: e.target.value } })} /></label>
            {sel('Hose', c.look.bottom.type, BOTTOMS, (v) => setLook({ bottom: { ...c.look.bottom, type: v } }))}
            {col('Hosenfarbe', c.look.bottom.color, (v) => setLook({ bottom: { ...c.look.bottom, color: v } }))}
            {col('Hosen-Akzent', c.look.bottom.accent, (v) => setLook({ bottom: { ...c.look.bottom, accent: v } }))}
            {col('Schuhe', c.look.shoes, (v) => setLook({ shoes: v }))}
            {col('Boxhandschuhe', c.look.gloves, (v) => setLook({ gloves: v }))}
          </div>
          <div className="label" style={{ marginTop: 6 }}>Accessoires</div>
          <div className="row">{ACCESSORIES.map((a) => (
            <label key={a} className="row" style={{ gap: 4 }}><input type="checkbox" style={{ width: 'auto' }} checked={c.look.accessories.includes(a)} onChange={(e) => setLook({ accessories: e.target.checked ? [...c.look.accessories, a] : c.look.accessories.filter((x) => x !== a) })} />{a}</label>
          ))}</div>
        </div>
        <div className="card">
          <h3>Stimme</h3>
          <div className="grid g4">
            <label className="f"><span>ElevenLabs Voice-ID</span><input value={c.voice.elevenlabsVoiceId} onChange={(e) => set('voice', { ...c.voice, elevenlabsVoiceId: e.target.value })} /></label>
            <label className="f"><span>OpenAI-Stimme</span><select value={c.voice.openaiVoice} onChange={(e) => set('voice', { ...c.voice, openaiVoice: e.target.value })}>{['alloy', 'ash', 'ballad', 'coral', 'echo', 'fable', 'nova', 'onyx', 'sage', 'shimmer', 'verse'].map((v) => <option key={v}>{v}</option>)}</select></label>
            <label className="f"><span>Demo-Tonhöhe</span><input type="number" step={0.05} value={c.voice.demoPitch} onChange={(e) => set('voice', { ...c.voice, demoPitch: Number(e.target.value) })} /></label>
            <label className="f"><span>Sprechanweisung (OpenAI)</span><input value={c.voice.instructions} onChange={(e) => set('voice', { ...c.voice, instructions: e.target.value })} /></label>
          </div>
        </div>
      </div>
    </div>
  );
}
