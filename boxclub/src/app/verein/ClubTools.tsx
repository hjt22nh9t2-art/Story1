'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/components/client';
import { STATE_OPS } from '@/lib/types';

export function ClubTools({ club, equipment, snapshots, lastEpisode }: { club: { clubName: string; city: string; address: string; founded: string }; equipment: { id: string; name: string }[]; snapshots: number[]; lastEpisode: number }) {
  const router = useRouter();
  const [base, setBase] = useState(club);
  const [ch, setCh] = useState({ op: 'geld', amount: 0, target: '', value: '', reason: '' });
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const run = async (fn: () => Promise<unknown>, ok: string) => { setErr(''); setMsg(''); try { await fn(); setMsg(ok); router.refresh(); } catch (e) { setErr((e as Error).message); } };
  return (
    <div className="grid g2">
      <div className="card">
        <h3>Stammdaten</h3>
        {(['clubName', 'city', 'address', 'founded'] as const).map((k) => (
          <label key={k} className="f"><span>{{ clubName: 'Vereinsname', city: 'Stadt', address: 'Adresse', founded: 'Gründung' }[k]}</span><input value={base[k]} onChange={(e) => setBase({ ...base, [k]: e.target.value })} /></label>
        ))}
        <button className="btn" onClick={() => run(() => api('/api/club', 'PUT', base), 'Gespeichert.')}>Speichern</button>
      </div>
      <div className="card">
        <h3>Korrekturbuchung</h3>
        <p className="muted" style={{ fontSize: 13 }}>Normalerweise ändert sich der Verein nur durch Folgen. Für Korrekturen (z. B. Tippfehler im Kontostand) hier buchen – wird in der Chronik vermerkt.</p>
        <div className="grid g2">
          <label className="f"><span>Operation</span><select value={ch.op} onChange={(e) => setCh({ ...ch, op: e.target.value })}>{STATE_OPS.map((o) => <option key={o}>{o}</option>)}</select></label>
          <label className="f"><span>Betrag / Delta</span><input type="number" value={ch.amount} onChange={(e) => setCh({ ...ch, amount: Number(e.target.value) })} /></label>
          <label className="f"><span>Ziel (ID)</span><input list="eqids" value={ch.target} onChange={(e) => setCh({ ...ch, target: e.target.value })} /><datalist id="eqids">{equipment.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</datalist></label>
          <label className="f"><span>Wert / Text</span><input value={ch.value} onChange={(e) => setCh({ ...ch, value: e.target.value })} /></label>
        </div>
        <label className="f"><span>Grund</span><input value={ch.reason} onChange={(e) => setCh({ ...ch, reason: e.target.value })} /></label>
        <button className="btn" onClick={() => run(() => api('/api/club/change', 'POST', ch), 'Gebucht.')}>Buchen</button>
        <h3 style={{ marginTop: 18 }}>Sicherungspunkte</h3>
        <p className="muted" style={{ fontSize: 13 }}>Nach jeder Folge wird der komplette Stand gesichert ({snapshots.map((s) => `F${s}`).join(', ')}).</p>
        <button className="btn" disabled={lastEpisode < 2} onClick={() => confirm(`Veröffentlichung von Folge ${lastEpisode} zurücknehmen und Stand nach Folge ${lastEpisode - 1} wiederherstellen?`) && run(() => api('/api/episodes/unpublish', 'POST'), 'Zurückgenommen.')}>Letzte Veröffentlichung zurücknehmen</button>
      </div>
      {(msg || err) && <div className={err ? 'err' : 'ok'}>{err || msg}</div>}
    </div>
  );
}
