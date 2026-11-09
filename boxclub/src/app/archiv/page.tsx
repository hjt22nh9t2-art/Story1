import Link from 'next/link';
import * as store from '@/lib/store';

export const dynamic = 'force-dynamic';

export default function Archiv() {
  const eps = store.listEpisodes().reverse();
  return (
    <div className="grid">
      <h1>Videoarchiv</h1>
      <div className="grid g3">
        {eps.map((e) => (
          <div key={e.id} className="card">
            <div className="row between"><b>Folge {e.number}</b><span className={`pill ${e.status}`}>{e.status}</span></div>
            <h3 style={{ margin: '6px 0' }}>{e.title}</h3>
            <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>
              {e.publishedAt ? `Veröffentlicht ${new Date(e.publishedAt).toLocaleDateString('de-DE')}` : `Erstellt ${new Date(e.createdAt).toLocaleDateString('de-DE')}`}
              {e.video ? ` · ${e.video.durationSec} s` : ''}
            </div>
            {e.video ? (
              <video src={`/api/media/${e.video.file}`} poster={`/api/media/${e.video.poster}`} controls preload="none" style={{ width: '100%', aspectRatio: '9/16', background: '#000', borderRadius: 10 }} />
            ) : <div className="muted" style={{ aspectRatio: '9/16', display: 'grid', placeItems: 'center', background: '#000', borderRadius: 10 }}>noch nicht gerendert</div>}
            <div className="row" style={{ marginTop: 10 }}>
              <Link className="btn small" href={`/episoden/${e.id}`}>Details</Link>
              {e.video && <a className="btn small gold" href={`/api/media/${e.video.file}?download`}>MP4 herunterladen</a>}
            </div>
            {e.socialCaption && <p className="muted" style={{ fontSize: 12 }}>{e.socialCaption} {e.hashtags.join(' ')}</p>}
          </div>
        ))}
      </div>
      {!eps.length && <p className="muted">Noch keine Folgen.</p>}
    </div>
  );
}
