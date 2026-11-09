import Link from 'next/link';
import * as store from '@/lib/store';
import { DecisionForm } from '@/components/DecisionForm';
import { ClubTools } from './ClubTools';

export const dynamic = 'force-dynamic';

export default function Verein() {
  const club = store.getClub();
  const chars = store.getCharacters();
  const name = (id: string) => chars.find((c) => c.id === id)?.name ?? id;
  const staff = chars.filter((c) => ['gruender', 'trainer', 'mitarbeiter'].includes(c.role) && c.status !== 'ausgetreten');
  const fighters = chars.filter((c) => c.role === 'boxer');
  return (
    <div className="grid">
      <h1>{club.clubName}</h1>
      <div className="muted">{club.founded} · {club.address}, {club.city} · Stand nach Folge {club.lastEpisode} · {club.chapter}</div>
      <div className="grid g4">
        <div className="card"><div className="label">Kasse</div><div className="stat">{club.money.toLocaleString('de-DE')} €</div></div>
        <div className="card"><div className="label">Monatlich</div><div className="stat" style={{ fontSize: 24 }}>+{club.monthlyIncome} € / −{club.monthlyCosts} €</div></div>
        <div className="card"><div className="label">Mitglieder</div><div className="stat">{club.members}</div></div>
        <div className="card"><div className="label">Ruf</div><div className="stat">{club.reputation}/100</div></div>
      </div>
      <div className="grid g2">
        <div className="card">
          <h3>Zustand der Halle: {club.facilityCondition} %</h3>
          <div className="bar"><div style={{ width: `${club.facilityCondition}%` }} /></div>
          <h3 style={{ marginTop: 16 }}>Ausstattung</h3>
          <table><thead><tr><th>Gerät</th><th>Anzahl</th><th>Zustand</th></tr></thead><tbody>
            {club.equipment.map((e) => <tr key={e.id}><td>{e.name} <span className="muted">({e.id})</span></td><td>{e.count}</td><td style={{ width: 140 }}><div className="bar"><div style={{ width: `${e.condition}%` }} /></div></td></tr>)}
          </tbody></table>
        </div>
        <div className="card">
          <h3>Trainer &amp; Mitarbeiter</h3>
          <ul>{staff.map((c) => <li key={c.id}><Link href={`/charaktere/${c.id}`}>{c.name}</Link> – {c.roleTitle}</li>)}</ul>
          <h3>Kämpfer</h3>
          <table><thead><tr><th>Name</th><th>Klasse</th><th>Status</th><th>Bilanz</th></tr></thead><tbody>
            {fighters.map((c) => <tr key={c.id}><td><Link href={`/charaktere/${c.id}`}>{c.name}</Link></td><td>{c.weightClass}</td><td><span className={`pill ${c.status}`}>{c.status}</span></td><td>{c.record.siege}–{c.record.niederlagen}–{c.record.unentschieden}</td></tr>)}
          </tbody></table>
          <h3 style={{ marginTop: 14 }}>Sponsoren</h3>
          {club.sponsors.length ? <ul>{club.sponsors.map((s) => <li key={s.name}>{s.name}: {s.amountPerMonth} €/Monat (seit F{s.since})</li>)}</ul> : <p className="muted">Noch keine.</p>}
        </div>
      </div>
      <div className="grid g2">
        <div className="card">
          <h3>Kämpfe &amp; Ergebnisse</h3>
          {club.fights.length ? <table><thead><tr><th>Folge</th><th>Boxer</th><th>Gegner</th><th>Ergebnis</th></tr></thead><tbody>
            {club.fights.map((f) => <tr key={f.id}><td>{f.episode}</td><td>{name(f.boxerId)}</td><td>{f.opponent} ({f.opponentClub}) – {f.event}</td><td>{f.result} {f.method}</td></tr>)}
          </tbody></table> : <p className="muted">Noch keine Kämpfe.</p>}
          <h3 style={{ marginTop: 14 }}>Rivalitäten</h3>
          {club.rivalries.length ? <ul>{club.rivalries.map((r) => <li key={r.id}><b>{r.club}</b> ({r.leader}) – Intensität {r.intensity}/10: {r.notes}</li>)}</ul> : <p className="muted">Noch keine.</p>}
        </div>
        <div className="card">
          <h3>Handlungsstränge</h3>
          {club.storylines.map((s) => (
            <div key={s.id} style={{ marginBottom: 10 }}>
              <b>{s.title}</b> <span className={`pill ${s.status === 'offen' ? 'offen' : 'umgesetzt'}`}>{s.status}</span>
              <ul style={{ margin: '4px 0' }}>{s.updates.map((u, i) => <li key={i} className="muted"><b>F{u.episode}:</b> {u.text}</li>)}</ul>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <h3>Community-Entscheidungen</h3>
        <div className="grid g2">{[...club.decisions].reverse().map((d) => <div key={d.id} className="scene"><DecisionForm d={d} /></div>)}</div>
        {!club.decisions.length && <p className="muted">Die erste Abstimmung entsteht beim Veröffentlichen von Folge 1.</p>}
      </div>
      <ClubTools club={{ clubName: club.clubName, city: club.city, address: club.address, founded: club.founded }} equipment={club.equipment.map((e) => ({ id: e.id, name: e.name }))} snapshots={store.listSnapshots()} lastEpisode={club.lastEpisode} />
    </div>
  );
}
