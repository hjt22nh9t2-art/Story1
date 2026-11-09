import Link from 'next/link';
import * as store from '@/lib/store';
import { getConfig } from '@/lib/providers/config';
import { CharacterSvg } from '@/components/CharacterSvg';

export const dynamic = 'force-dynamic';

export default function Dashboard() {
  if (!store.isSeeded()) return <div className="err">Noch keine Daten. Bitte im Projektordner <code>npm run seed</code> ausführen.</div>;
  const club = store.getClub();
  const eps = store.listEpisodes();
  const chars = store.getCharacters();
  const cfg = getConfig();
  const published = eps.filter((e) => e.status === 'veroeffentlicht');
  const draft = eps.find((e) => e.status !== 'veroeffentlicht');
  const current = draft ?? published[published.length - 1];
  const open = club.decisions.find((d) => d.status === 'offen');
  const decided = club.decisions.find((d) => d.status === 'entschieden');
  const boxers = chars.filter((c) => c.role === 'boxer' && c.status === 'aktiv');
  return (
    <div className="grid">
      <div className="row between">
        <div><h1>{club.clubName}</h1><div className="muted">{club.chapter} · {club.address}, {club.city}</div></div>
        <Link href="/generator" className="btn primary big">＋ Neue Episode erstellen</Link>
      </div>

      <div className="grid g4">
        <div className="card"><div className="label">Veröffentlichte Folgen</div><div className="stat">{published.length}</div></div>
        <div className="card"><div className="label">Vereinskasse</div><div className="stat" style={{ color: club.money < 200 ? '#ff7a6a' : undefined }}>{club.money.toLocaleString('de-DE')} €</div><div className="muted" style={{ fontSize: 12 }}>{club.monthlyIncome - club.monthlyCosts >= 0 ? '+' : ''}{club.monthlyIncome - club.monthlyCosts} € / Monat</div></div>
        <div className="card"><div className="label">Mitglieder</div><div className="stat">{club.members}</div><div className="muted" style={{ fontSize: 12 }}>{boxers.length} aktive Boxer</div></div>
        <div className="card"><div className="label">Ruf · Halle</div><div className="stat">{club.reputation} · {club.facilityCondition}%</div></div>
      </div>

      <div className="grid g2">
        <div className="card hero">
          <div className="label">Aktuelle Episode</div>
          {current ? (
            <>
              <h2 style={{ marginTop: 6 }}>Folge {current.number}: {current.title} <span className={`pill ${current.status}`}>{current.status}</span></h2>
              <p>{current.summary}</p>
              <div className="row">
                <Link className="btn" href={`/episoden/${current.id}`}>Öffnen / bearbeiten</Link>
                {current.video && <a className="btn" href={`/api/media/${current.video.file}?download`}>MP4 herunterladen</a>}
              </div>
            </>
          ) : <p>Noch keine Folge.</p>}
        </div>
        <div className="card">
          <div className="label">Nächste geplante Episode</div>
          <h2 style={{ marginTop: 6 }}>Folge {club.lastEpisode + 1}</h2>
          {draft ? <p>Entwurf „{draft.title}“ ist in Arbeit ({draft.status}). Veröffentlichen, bevor die nächste Folge entsteht.</p>
            : open ? <p>Wartet auf das Abstimmungsergebnis: <b>{open.question}</b> → <Link href="/generator">Ergebnis eintragen</Link></p>
            : decided ? <p>Community hat entschieden: <b>{decided.options.find((o) => o.key === decided.winner)?.label}</b>. Bereit für „Neue Episode erstellen“.</p>
            : <p>Bereit.</p>}
          {club.nextEpisodeNote && <p className="muted">Cliffhanger: {club.nextEpisodeNote}</p>}
          <div className="muted" style={{ fontSize: 12 }}>Autor: {cfg.story === 'claude' ? `Claude (${cfg.claudeModel})` : 'Demo-Autor (ohne KI)'} · Stimmen: {cfg.tts === 'none' ? 'Demo-Brabbelstimme' : cfg.tts}</div>
        </div>
      </div>

      <div className="grid g2">
        <div className="card">
          <h3>Letzte Entwicklungen</h3>
          <ul className="timeline">{[...club.timeline].reverse().slice(0, 6).map((t, i) => <li key={i}><span className="muted">F{t.episode}</span> {t.text}</li>)}</ul>
          {!club.timeline.length && <p className="muted">Noch nichts veröffentlicht.</p>}
        </div>
        <div className="card">
          <h3>Ensemble</h3>
          <div className="row" style={{ alignItems: 'flex-end', gap: 4 }}>
            {chars.filter((c) => c.status === 'aktiv').map((c) => (
              <Link key={c.id} href={`/charaktere/${c.id}`} title={c.name} style={{ textAlign: 'center', textDecoration: 'none' }}>
                <CharacterSvg look={c.look} heightCm={c.heightCm} size={70} />
                <div style={{ fontSize: 11 }}>{c.name.split(' ')[0]}</div>
              </Link>
            ))}
          </div>
          <h3 style={{ marginTop: 14 }}>Offene Handlungsstränge</h3>
          <ul>{club.storylines.filter((s) => s.status === 'offen').map((s) => <li key={s.id}><b>{s.title}</b> <span className="muted">{s.updates.at(-1)?.text}</span></li>)}</ul>
        </div>
      </div>
    </div>
  );
}
