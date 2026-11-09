'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/components/client';
import type { Episode } from '@/lib/types';

export function GenerateForm({ disabled, defaultProvider, claudeAvailable }: { disabled: boolean; defaultProvider: string; claudeAvailable: boolean }) {
  const router = useRouter();
  const [ideas, setIdeas] = useState('');
  const [provider, setProvider] = useState(defaultProvider);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  async function go() {
    setBusy(true); setErr('');
    try {
      const r = await api<{ episode: Episode }>('/api/episodes/generate', 'POST', { ideas, provider });
      router.push(`/episoden/${r.episode.id}`);
    } catch (e) { setErr((e as Error).message); setBusy(false); }
  }
  return (
    <div style={{ marginTop: 10 }}>
      <label className="f"><span>Eigene Ideen für diese Folge (optional)</span>
        <textarea value={ideas} onChange={(e) => setIdeas(e.target.value)} placeholder="z. B. Paule erzählt endlich, woher er Bruno kennt. Ein Lokalreporter taucht auf." /></label>
      <div className="row">
        <select value={provider} onChange={(e) => setProvider(e.target.value)} style={{ width: 280 }}>
          <option value="claude" disabled={!claudeAvailable}>KI-Autor: Claude {claudeAvailable ? '' : '(API-Schlüssel fehlt)'}</option>
          <option value="demo">Demo-Autor (regelbasiert, ohne KI)</option>
        </select>
        <button className="btn primary big" disabled={disabled || busy} onClick={go}>{busy ? 'Autor schreibt … (bis zu 2 Min.)' : '＋ Neue Episode erstellen'}</button>
      </div>
      {disabled && <p className="muted">Erst das Abstimmungsergebnis eintragen.</p>}
      {err && <div className="err" style={{ marginTop: 10 }}>{err}</div>}
    </div>
  );
}
