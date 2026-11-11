'use client';
/** Drehbuch-Editor einer Folge inkl. Vorschau, Prüfung, Vertonung, Rendern und Veröffentlichen. */
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ACTIONS, BEATS, EMOTIONS, MUSIC, POSITIONS, SFX, SHOTS, STATE_OPS, type Episode, type Line, type Scene } from '@/lib/types';
import { buildTimeline } from '@/lib/timeline';
import { EpisodePlayer } from './EpisodePlayer';
import { api } from './client';

interface CharRef { id: string; name: string; status: string }
interface LocRef { id: string; name: string; unlocked: boolean }
interface Validation { ok: boolean; errors: string[]; warnings: string[]; estimatedSec: number; moneyAfter: number }
interface RenderStatus { state: string; progress: number; message: string }

let uid = 0;
const newId = (p: string) => `${p}${Date.now().toString(36)}${uid++}`;

export function EpisodeEditor({ initial, characters, locations, tts, isNext }: { initial: Episode; characters: CharRef[]; locations: LocRef[]; tts: string; isNext: boolean }) {
  const router = useRouter();
  const [ep, setEp] = useState<Episode>(initial);
  const [dirty, setDirty] = useState(false);
  const [version, setVersion] = useState(0);
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [val, setVal] = useState<Validation | null>(null);
  const [render, setRender] = useState<RenderStatus | null>(null);
  const published = ep.status === 'veroeffentlicht';
  const est = buildTimeline(ep).totalSec;
  const cname = (id: string) => characters.find((c) => c.id === id)?.name ?? id;

  const update = (patch: Partial<Episode>) => { setEp({ ...ep, ...patch }); setDirty(true); };
  const updScene = (i: number, patch: Partial<Scene>) => update({ scenes: ep.scenes.map((s, k) => (k === i ? { ...s, ...patch } : s)) });
  const updLine = (si: number, li: number, patch: Partial<Line>) => updScene(si, { lines: ep.scenes[si].lines.map((l, k) => (k === li ? { ...l, ...patch } : l)) });

  async function act<T>(label: string, fn: () => Promise<T>, ok?: (r: T) => string) {
    setBusy(label); setErr(''); setMsg('');
    try { const r = await fn(); if (ok) setMsg(ok(r)); return r; } catch (e) { setErr((e as Error).message); } finally { setBusy(''); }
  }
  const save = () => act('Speichern', async () => { const r = await api<Episode>(`/api/episodes/${ep.id}`, 'PUT', ep); setEp(r); setDirty(false); setVersion((v) => v + 1); await check(); return r; }, () => 'Gespeichert.');
  const check = async () => { const v = await api<Validation>(`/api/episodes/${ep.id}/check`, 'POST'); setVal(v); return v; };
  const voice = (force = false) => act('Vertonen', async () => { const r = await api<{ episode: Episode; voiced: number }>(`/api/episodes/${ep.id}/voice`, 'POST', { force }); setEp(r.episode); setVersion((v) => v + 1); return r; }, (r) => `${r.voiced} Zeilen vertont.`);
  const startRender = () => act('Rendern', async () => { const r = await api<RenderStatus>(`/api/episodes/${ep.id}/render`, 'POST'); setRender(r); return r; });
  const publish = () => confirm('Folge veröffentlichen? Danach werden alle Zustandsänderungen ins Seriengedächtnis geschrieben und die neue Abstimmung eröffnet.') && act('Veröffentlichen', async () => { const r = await api<{ episode: Episode; log: string[] }>(`/api/episodes/${ep.id}/publish`, 'POST'); setEp(r.episode); router.refresh(); return r; }, (r) => `Veröffentlicht! ${r.log.join(' · ')}`);
  const del = () => confirm('Entwurf wirklich löschen?') && act('Löschen', async () => { await api(`/api/episodes/${ep.id}`, 'DELETE'); router.push('/generator'); });

  useEffect(() => { check().catch(() => {}); api<RenderStatus | null>(`/api/episodes/${ep.id}/render`).then(setRender).catch(() => {}); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!render || !['laeuft', 'wartet'].includes(render.state)) return;
    const t = setInterval(async () => {
      const r = await api<RenderStatus>(`/api/episodes/${ep.id}/render`).catch(() => null);
      if (r) setRender(r);
      if (r?.state === 'fertig') { const e = await api<Episode>(`/api/episodes/${ep.id}`); setEp(e); router.refresh(); }
    }, 2000);
    return () => clearInterval(t);
  }, [render, ep.id, router]);

  const voiced = ep.scenes.flatMap((s) => s.lines).filter((l) => l.audio).length;
  const totalLines = ep.scenes.flatMap((s) => s.lines).length;
  const rendering = render && ['laeuft', 'wartet'].includes(render.state);

  return (
    <div className="grid" style={{ gridTemplateColumns: '360px 1fr', alignItems: 'start' }}>
      {/* ---------------- linke Spalte: Vorschau & Aktionen */}
      <div className="sticky grid">
        <EpisodePlayer id={ep.id} version={version} width={340} />
        <div className="muted" style={{ fontSize: 12 }}>Vorschau zeigt den gespeicherten Stand{dirty ? ' – ungespeicherte Änderungen!' : ''}. Länge ca. {est.toFixed(0)} s · {voiced}/{totalLines} Zeilen vertont</div>
        <div className="card grid" style={{ gap: 8 }}>
          <button className="btn" disabled={!dirty || !!busy} onClick={save}>💾 Speichern</button>
          <button className="btn" disabled={dirty || !!busy || tts === 'none'} title={tts === 'none' ? 'Keine TTS konfiguriert – Demo-Brabbelstimme wird verwendet' : ''} onClick={() => voice(false)}>🎙 Vertonen ({tts === 'none' ? 'nicht konfiguriert' : tts})</button>
          {voiced > 0 && tts !== 'none' && <button className="btn small" disabled={dirty || !!busy} onClick={() => confirm('Alle Zeilen neu vertonen?') && voice(true)}>Alle neu vertonen</button>}
          <button className="btn blue" disabled={dirty || !!busy || !!rendering} onClick={startRender}>🎬 MP4 rendern</button>
          {render && (
            <div>
              <div className="bar"><div style={{ width: `${Math.round(render.progress * 100)}%` }} /></div>
              <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>{render.state}: {render.message} {Math.round(render.progress * 100)} %</div>
            </div>
          )}
          {ep.video && <a className="btn gold" href={`/api/media/${ep.video.file}?download`}>⬇ MP4 herunterladen ({ep.video.durationSec} s)</a>}
          {!published && <button className="btn primary" disabled={dirty || !!busy || !isNext || (val ? !val.ok : false)} onClick={publish}>✅ Veröffentlichen</button>}
          {!published && <button className="btn small" disabled={!!busy} onClick={del}>Entwurf löschen</button>}
        </div>
        {busy && <div className="warn">{busy} …</div>}
        {err && <div className="err">{err}</div>}
        {msg && <div className="ok">{msg}</div>}
        {val && (
          <div className="card">
            <div className="label">Konsistenzprüfung</div>
            {val.ok ? <div className="ok" style={{ marginTop: 6 }}>Keine Widersprüche zum Seriengedächtnis.</div> : <div className="err" style={{ marginTop: 6 }}>{val.errors.map((e, i) => <div key={i}>• {e}</div>)}</div>}
            {val.warnings.length > 0 && <div className="warn" style={{ marginTop: 6 }}>{val.warnings.map((e, i) => <div key={i}>• {e}</div>)}</div>}
            {!published && <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>Kasse nach dieser Folge: {val.moneyAfter} €</div>}
          </div>
        )}
      </div>

      {/* ---------------- rechte Spalte: Drehbuch */}
      <div className="grid">
        <div className="row between">
          <h1>Folge {ep.number}: <input value={ep.title} onChange={(e) => update({ title: e.target.value })} style={{ width: 360, fontFamily: 'Anton', fontSize: 26 }} /></h1>
          <span className={`pill ${ep.status}`}>{ep.status}</span>
        </div>
        <div className="muted" style={{ fontSize: 12 }}>Autor: {ep.generator}{ep.resolvesDecisionId ? ` · setzt Entscheidung ${ep.resolvesDecisionId} um` : ''}{ep.userIdeas ? ` · Ideen: ${ep.userIdeas}` : ''}</div>
        {published && <div className="warn">Diese Folge ist veröffentlicht. Texte und Inszenierung dürfen noch angepasst werden (z. B. für ein Neu-Rendering), die Zustandsänderungen sind gesperrt.</div>}

        <div className="card grid g2">
          <label className="f"><span>Hook (erster Satz)</span><textarea value={ep.hook} onChange={(e) => update({ hook: e.target.value })} /></label>
          <label className="f"><span>Zusammenfassung (fürs Seriengedächtnis)</span><textarea value={ep.summary} onChange={(e) => update({ summary: e.target.value })} /></label>
          <label className="f"><span>Cliffhanger</span><textarea value={ep.cliffhanger} onChange={(e) => update({ cliffhanger: e.target.value })} /></label>
          <label className="f"><span>Social-Media-Text &amp; Hashtags</span><textarea value={`${ep.socialCaption}\n${ep.hashtags.join(' ')}`} onChange={(e) => { const [cap, ...rest] = e.target.value.split('\n'); update({ socialCaption: cap, hashtags: rest.join(' ').split(/\s+/).filter(Boolean) }); }} /></label>
        </div>

        {ep.scenes.map((s, si) => (
          <div key={s.id} className="scene">
            <div className="row between">
              <h3 style={{ margin: 0 }}>Szene {si + 1}</h3>
              <div className="row">
                <button className="btn small" disabled={si === 0} onClick={() => { const a = [...ep.scenes]; [a[si - 1], a[si]] = [a[si], a[si - 1]]; update({ scenes: a }); }}>↑</button>
                <button className="btn small" disabled={si === ep.scenes.length - 1} onClick={() => { const a = [...ep.scenes]; [a[si + 1], a[si]] = [a[si], a[si + 1]]; update({ scenes: a }); }}>↓</button>
                <button className="btn small" disabled={ep.scenes.length <= 1} onClick={() => update({ scenes: ep.scenes.filter((_, k) => k !== si) })}>Szene löschen</button>
              </div>
            </div>
            <div className="grid g4" style={{ marginTop: 8 }}>
              <label className="f"><span>Beat</span><select value={s.beat} onChange={(e) => updScene(si, { beat: e.target.value as Scene['beat'] })}>{BEATS.map((b) => <option key={b}>{b}</option>)}</select></label>
              <label className="f"><span>Schauplatz</span><select value={s.location} onChange={(e) => updScene(si, { location: e.target.value as Scene['location'] })}>{locations.map((l) => <option key={l.id} value={l.id}>{l.name}{l.unlocked ? '' : ' (gesperrt)'}</option>)}</select></label>
              <label className="f"><span>Kamera</span><select value={s.shot} onChange={(e) => updScene(si, { shot: e.target.value as Scene['shot'] })}>{SHOTS.map((b) => <option key={b}>{b}</option>)}</select></label>
              <label className="f"><span>Musik</span><select value={s.music} onChange={(e) => updScene(si, { music: e.target.value as Scene['music'] })}>{MUSIC.map((b) => <option key={b}>{b}</option>)}</select></label>
            </div>
            <div className="grid g2">
              <label className="f"><span>Einblendung (Overlay)</span><input value={s.overlay} onChange={(e) => updScene(si, { overlay: e.target.value })} /></label>
              <label className="f"><span>Regieanweisung</span><input value={s.direction} onChange={(e) => updScene(si, { direction: e.target.value })} /></label>
            </div>
            <div className="label">Besetzung</div>
            <div className="row" style={{ margin: '6px 0 10px' }}>
              {s.cast.map((c, ci) => (
                <div key={ci} className="row" style={{ background: '#0f0d11', padding: 6, borderRadius: 8, gap: 4 }}>
                  <b style={{ fontSize: 13 }}>{cname(c.characterId)}</b>
                  <select value={c.position} style={{ width: 110 }} onChange={(e) => updScene(si, { cast: s.cast.map((x, k) => (k === ci ? { ...x, position: e.target.value as typeof c.position } : x)) })}>{POSITIONS.map((p) => <option key={p}>{p}</option>)}</select>
                  <select value={c.facing} style={{ width: 80 }} onChange={(e) => updScene(si, { cast: s.cast.map((x, k) => (k === ci ? { ...x, facing: e.target.value as 'links' | 'rechts' } : x)) })}><option>links</option><option>rechts</option></select>
                  <button className="btn small" onClick={() => updScene(si, { cast: s.cast.filter((_, k) => k !== ci) })}>×</button>
                </div>
              ))}
              {s.cast.length < 5 && (
                <select value="" style={{ width: 200 }} onChange={(e) => { if (!e.target.value) return; const used = new Set(s.cast.map((c) => c.position)); const pos = POSITIONS.find((p) => !used.has(p)) ?? 'mitte'; updScene(si, { cast: [...s.cast, { characterId: e.target.value, position: pos, facing: 'rechts', action: 'keine' }] }); }}>
                  <option value="">＋ Figur hinzufügen</option>
                  {characters.filter((c) => !s.cast.some((x) => x.characterId === c.id)).map((c) => <option key={c.id} value={c.id}>{c.name} ({c.status})</option>)}
                </select>
              )}
            </div>
            <div className="label">Dialog</div>
            {s.lines.map((l, li) => (
              <div key={l.id} className="linee" style={{ marginTop: 6 }}>
                <select value={l.speaker} onChange={(e) => updLine(si, li, { speaker: e.target.value })}>
                  {s.cast.map((c) => <option key={c.characterId} value={c.characterId}>{cname(c.characterId)}</option>)}
                  {!s.cast.some((c) => c.characterId === l.speaker) && <option value={l.speaker}>{cname(l.speaker)} (nicht in Szene)</option>}
                </select>
                <div>
                  <textarea value={l.text} style={{ minHeight: 44 }} onChange={(e) => updLine(si, li, { text: e.target.value })} />
                  {l.audio && <audio src={`/api/media/${l.audio.file}`} controls preload="none" style={{ height: 28, width: '100%' }} />}
                </div>
                <select value={l.emotion} onChange={(e) => updLine(si, li, { emotion: e.target.value as Line['emotion'] })}>{EMOTIONS.map((x) => <option key={x}>{x}</option>)}</select>
                <select value={l.action} onChange={(e) => updLine(si, li, { action: e.target.value as Line['action'] })}>{ACTIONS.map((x) => <option key={x}>{x}</option>)}</select>
                <select value={l.sfx ?? ''} onChange={(e) => updLine(si, li, { sfx: (e.target.value || null) as Line['sfx'] })}><option value="">– kein SFX</option>{SFX.map((x) => <option key={x}>{x}</option>)}</select>
                <button className="btn small" disabled={s.lines.length <= 1} onClick={() => updScene(si, { lines: s.lines.filter((_, k) => k !== li) })}>×</button>
              </div>
            ))}
            <button className="btn small" style={{ marginTop: 6 }} disabled={!s.cast.length} onClick={() => updScene(si, { lines: [...s.lines, { id: newId('l'), speaker: s.cast[0]?.characterId ?? '', text: '…', emotion: 'neutral', action: 'keine', sfx: null, pauseAfter: 0.2, delayBefore: 0, audio: null }] })}>＋ Zeile</button>
          </div>
        ))}
        <button className="btn" onClick={() => update({ scenes: [...ep.scenes, { id: newId('s'), beat: 'handlung', location: 'halle', shot: 'halbnah', music: 'aufbruch', overlay: '', direction: '', seats: null, props: [], setOverrides: {}, cast: [], lines: [{ id: newId('l'), speaker: '', text: '…', emotion: 'neutral', action: 'keine', sfx: null, pauseAfter: 0.2, delayBefore: 0, audio: null }] }] })}>＋ Szene hinzufügen</button>

        <div className="card">
          <h3>Community-Entscheidung am Ende</h3>
          <label className="f"><span>Frage</span><input value={ep.decision.question} onChange={(e) => update({ decision: { ...ep.decision, question: e.target.value } })} disabled={published} /></label>
          {ep.decision.options.map((o, i) => (
            <div key={o.key} className="grid g2" style={{ gridTemplateColumns: '40px 1fr 1fr 32px' }}>
              <b style={{ fontFamily: 'Anton', fontSize: 24 }}>{o.key}</b>
              <input value={o.label} disabled={published} onChange={(e) => update({ decision: { ...ep.decision, options: ep.decision.options.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)) } })} />
              <input value={o.consequenceHint} disabled={published} placeholder="mögliche Folgen" onChange={(e) => update({ decision: { ...ep.decision, options: ep.decision.options.map((x, k) => (k === i ? { ...x, consequenceHint: e.target.value } : x)) } })} />
              <button className="btn small" disabled={published || ep.decision.options.length <= 2} onClick={() => update({ decision: { ...ep.decision, options: ep.decision.options.filter((_, k) => k !== i).map((x, k) => ({ ...x, key: (['A', 'B', 'C', 'D'] as const)[k] })) } })}>×</button>
            </div>
          ))}
          {!published && ep.decision.options.length < 4 && <button className="btn small" style={{ marginTop: 8 }} onClick={() => update({ decision: { ...ep.decision, options: [...ep.decision.options, { key: (['A', 'B', 'C', 'D'] as const)[ep.decision.options.length], label: '', consequenceHint: '', plan: '' }] } })}>＋ Option {(['A', 'B', 'C', 'D'])[ep.decision.options.length]}</button>}
        </div>

        <div className="card">
          <h3>Zustandsänderungen (werden beim Veröffentlichen angewendet)</h3>
          <table><thead><tr><th>Operation</th><th>Betrag</th><th>Ziel</th><th>Wert</th><th>Grund</th><th /></tr></thead><tbody>
            {ep.stateChanges.map((c, i) => (
              <tr key={i}>
                <td><select value={c.op} disabled={published} onChange={(e) => update({ stateChanges: ep.stateChanges.map((x, k) => (k === i ? { ...x, op: e.target.value as typeof c.op } : x)) })}>{STATE_OPS.map((o) => <option key={o}>{o}</option>)}</select></td>
                <td><input type="number" value={c.amount} disabled={published} style={{ width: 90 }} onChange={(e) => update({ stateChanges: ep.stateChanges.map((x, k) => (k === i ? { ...x, amount: Number(e.target.value) } : x)) })} /></td>
                <td><input value={c.target} disabled={published} onChange={(e) => update({ stateChanges: ep.stateChanges.map((x, k) => (k === i ? { ...x, target: e.target.value } : x)) })} /></td>
                <td><input value={c.value} disabled={published} onChange={(e) => update({ stateChanges: ep.stateChanges.map((x, k) => (k === i ? { ...x, value: e.target.value } : x)) })} /></td>
                <td><input value={c.reason} disabled={published} onChange={(e) => update({ stateChanges: ep.stateChanges.map((x, k) => (k === i ? { ...x, reason: e.target.value } : x)) })} /></td>
                <td>{!published && <button className="btn small" onClick={() => update({ stateChanges: ep.stateChanges.filter((_, k) => k !== i) })}>×</button>}</td>
              </tr>
            ))}
          </tbody></table>
          {!published && <button className="btn small" style={{ marginTop: 8 }} onClick={() => update({ stateChanges: [...ep.stateChanges, { op: 'geld', amount: 0, target: '', value: '', reason: '' }] })}>＋ Änderung</button>}
        </div>
      </div>
    </div>
  );
}
