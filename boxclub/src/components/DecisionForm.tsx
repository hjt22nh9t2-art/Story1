'use client';
/** Ergebnis einer Community-Abstimmung eintragen. */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Decision } from '@/lib/types';
import { api } from './client';

export function DecisionForm({ d }: { d: Decision }) {
  const router = useRouter();
  const [winner, setWinner] = useState<string>(d.winner ?? '');
  const [votes, setVotes] = useState<Record<string, number>>(d.votes ?? {});
  const [note, setNote] = useState(d.note ?? '');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const locked = d.status === 'umgesetzt';
  const total = Object.values(votes).reduce((a, b) => a + (b || 0), 0);
  async function save() {
    setBusy(true); setErr('');
    try { await api(`/api/decisions/${d.id}`, 'POST', { winner, votes, note }); router.refresh(); } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  }
  return (
    <div>
      <div className="row between"><b>{d.question}</b><span className={`pill ${d.status}`}>{d.status}</span></div>
      <div className="muted" style={{ fontSize: 12, margin: '4px 0 10px' }}>aus Folge {d.episode}{d.resolvedInEpisode ? ` · umgesetzt in Folge ${d.resolvedInEpisode}` : ''}</div>
      {d.options.map((o) => (
        <label key={o.key} className="row" style={{ marginBottom: 8, alignItems: 'flex-start', cursor: locked ? 'default' : 'pointer' }}>
          <input type="radio" name={`w-${d.id}`} disabled={locked} checked={winner === o.key} onChange={() => setWinner(o.key)} style={{ width: 'auto', marginTop: 4 }} />
          <div style={{ flex: 1 }}>
            <b>{o.key}: {o.label}</b>
            <div className="muted" style={{ fontSize: 12 }}>{o.consequenceHint}</div>
          </div>
          <input type="number" min={0} placeholder="Stimmen" disabled={locked} value={votes[o.key] ?? ''} onChange={(e) => setVotes({ ...votes, [o.key]: Number(e.target.value) })} style={{ width: 110 }} />
          {total > 0 && <span className="muted" style={{ width: 44 }}>{Math.round(((votes[o.key] ?? 0) / total) * 100)} %</span>}
        </label>
      ))}
      {!locked && (
        <>
          <label className="f"><span>Anmerkung für den Autor (optional, z. B. Top-Kommentare)</span><textarea value={note} onChange={(e) => setNote(e.target.value)} /></label>
          <div className="row">
            <button className="btn primary" disabled={!winner || busy} onClick={save}>Ergebnis speichern</button>
            <button className="btn small" type="button" disabled={total === 0} onClick={() => setWinner(Object.entries(votes).sort((a, b) => b[1] - a[1])[0][0])}>Gewinner aus Stimmen</button>
          </div>
        </>
      )}
      {err && <div className="err" style={{ marginTop: 8 }}>{err}</div>}
    </div>
  );
}
