import Link from 'next/link';
import * as store from '@/lib/store';
import { getConfig } from '@/lib/providers/config';
import { DecisionForm } from '@/components/DecisionForm';
import { GenerateForm } from './GenerateForm';

export const dynamic = 'force-dynamic';

export default function Generator() {
  const club = store.getClub();
  const eps = store.listEpisodes();
  const draft = eps.find((e) => e.status !== 'veroeffentlicht');
  const open = club.decisions.filter((d) => d.status === 'offen');
  const decided = club.decisions.find((d) => d.status === 'entschieden');
  const cfg = getConfig();
  return (
    <div className="grid">
      <h1>Episoden-Generator</h1>
      <div className="card">
        <div className="label">Ablauf</div>
        <ol style={{ margin: '8px 0 0', lineHeight: 1.7 }}>
          <li>Abstimmungsergebnis der letzten Folge eintragen</li>
          <li>Optional eigene Ideen notieren → „Neue Episode erstellen“</li>
          <li>Drehbuch prüfen &amp; anpassen → vertonen → rendern</li>
          <li>Veröffentlichen: Seriengedächtnis wird fortgeschrieben</li>
        </ol>
      </div>
      {draft && (
        <div className="warn">Folge {draft.number} „{draft.title}“ ist noch nicht veröffentlicht ({draft.status}). <Link href={`/episoden/${draft.id}`}>Zum Entwurf →</Link></div>
      )}
      {open.map((d) => <div key={d.id} className="card"><div className="label">Schritt 1 · Community-Entscheidung eintragen</div><div style={{ marginTop: 10 }}><DecisionForm d={d} /></div></div>)}
      {decided && <div className="ok">Umzusetzen: <b>{decided.question}</b> → {decided.winner}: {decided.options.find((o) => o.key === decided.winner)?.label}</div>}
      {!draft && (
        <div className="card">
          <div className="label">Schritt 2 · Folge {club.lastEpisode + 1} erstellen</div>
          <GenerateForm disabled={open.length > 0} defaultProvider={cfg.story} claudeAvailable={cfg.keys.anthropic} />
        </div>
      )}
    </div>
  );
}
