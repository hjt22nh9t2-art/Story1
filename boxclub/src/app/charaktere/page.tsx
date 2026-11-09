import Link from 'next/link';
import * as store from '@/lib/store';
import { CharacterSvg } from '@/components/CharacterSvg';

export const dynamic = 'force-dynamic';

export default function Charaktere() {
  const chars = store.getCharacters();
  return (
    <div className="grid">
      <div className="row between"><h1>Charaktere</h1><Link className="btn primary" href="/charaktere/neu">＋ Neue Figur</Link></div>
      <div className="grid g3">
        {chars.map((c) => (
          <Link key={c.id} href={`/charaktere/${c.id}`} className="card charcard">
            <CharacterSvg look={c.look} heightCm={c.heightCm} size={110} />
            <div>
              <h3 style={{ marginBottom: 4 }}>{c.name}{c.nickname ? <span className="muted"> „{c.nickname}“</span> : null}</h3>
              <div style={{ fontWeight: 700 }}>{c.roleTitle}</div>
              <div className="muted" style={{ fontSize: 13 }}>{c.age} J. · {c.heightCm} cm · {c.weightKg} kg {c.weightClass}</div>
              <div className="row" style={{ marginTop: 6 }}>
                <span className={`pill ${c.status}`}>{c.status}</span>
                {c.lookLocked && <span className="pill" title="Aussehen gesperrt – seit Folge {c.firstEpisode} im Einsatz">🔒 seit F{c.firstEpisode}</span>}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
