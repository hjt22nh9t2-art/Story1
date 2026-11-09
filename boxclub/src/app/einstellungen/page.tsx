import { getConfig } from '@/lib/providers/config';

export const dynamic = 'force-dynamic';

const Row = ({ name, ok, desc }: { name: string; ok: boolean; desc: string }) => (
  <tr><td><code>{name}</code></td><td>{ok ? <span className="pill aktiv">gesetzt</span> : <span className="pill ausgetreten">fehlt</span>}</td><td className="muted">{desc}</td></tr>
);

export default function Settings() {
  const c = getConfig();
  return (
    <div className="grid">
      <h1>Einstellungen &amp; Anbieter</h1>
      <div className="grid g3">
        <div className="card"><div className="label">Drehbuch-Autor</div><div className="stat">{c.story === 'claude' ? 'Claude' : 'Demo'}</div><div className="muted">{c.story === 'claude' ? c.claudeModel : 'regelbasiert, ohne KI'}</div></div>
        <div className="card"><div className="label">Stimmen (TTS)</div><div className="stat">{c.tts === 'none' ? 'Demo' : c.tts}</div><div className="muted">{c.tts === 'elevenlabs' ? c.elevenlabsModel : c.tts === 'openai' ? c.openaiTtsModel : 'Brabbelstimme + Untertitel'}</div></div>
        <div className="card"><div className="label">Bild-KI</div><div className="stat">{c.image === 'none' ? 'aus' : c.image}</div><div className="muted">{c.image === 'openai' ? c.openaiImageModel : 'nur für Konzeptbilder nötig'}</div></div>
      </div>
      <div className="card">
        <h3>API-Schlüssel (Datei <code>.env.local</code> im Projektordner)</h3>
        <table><tbody>
          <Row name="ANTHROPIC_API_KEY" ok={c.keys.anthropic} desc="Claude schreibt die Fortsetzungen (console.anthropic.com → API Keys)." />
          <Row name="ELEVENLABS_API_KEY" ok={c.keys.elevenlabs} desc="Deutsche Sprecherstimmen (elevenlabs.io → Profile → API Keys). Voice-IDs je Figur in der Charakterverwaltung." />
          <Row name="OPENAI_API_KEY" ok={c.keys.openai} desc="Alternative Stimmen (gpt-4o-mini-tts) und KI-Konzeptbilder (gpt-image-1)." />
        </tbody></table>
        <p className="muted">Optional: <code>STORY_PROVIDER</code> (claude|demo), <code>TTS_PROVIDER</code> (elevenlabs|openai|none), <code>IMAGE_PROVIDER</code> (openai|none), <code>CLAUDE_MODEL</code>, <code>ELEVENLABS_MODEL</code>, <code>OPENAI_TTS_MODEL</code>, <code>OPENAI_IMAGE_MODEL</code>. Nach Änderungen den Server neu starten. Details in der README.</p>
      </div>
    </div>
  );
}
