/**
 * Anbieter-Konfiguration aus Umgebungsvariablen (.env.local).
 * Fehlt ein Schlüssel, fällt das System automatisch in den Demo-Modus zurück.
 */
import fs from 'node:fs';
import path from 'node:path';

let loaded = false;
/** Lädt .env.local / .env auch außerhalb von Next (z. B. im Render-Skript). */
export function loadEnv() {
  if (loaded) return;
  loaded = true;
  for (const f of ['.env.local', '.env']) {
    const p = path.join(process.env.BOXCLUB_ROOT || process.cwd(), f);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
}

export type StoryProvider = 'claude' | 'demo';
export type TtsProvider = 'elevenlabs' | 'openai' | 'none';
export type ImageProvider = 'openai' | 'none';

export interface ProviderConfig {
  story: StoryProvider;
  tts: TtsProvider;
  image: ImageProvider;
  claudeModel: string;
  elevenlabsModel: string;
  openaiTtsModel: string;
  openaiImageModel: string;
  keys: { anthropic: boolean; elevenlabs: boolean; openai: boolean };
}

export function getConfig(): ProviderConfig {
  loadEnv();
  const e = process.env;
  const keys = { anthropic: !!e.ANTHROPIC_API_KEY, elevenlabs: !!e.ELEVENLABS_API_KEY, openai: !!e.OPENAI_API_KEY };
  const want = (v: string | undefined, ok: Record<string, boolean>, fallback: string) => (v && ok[v] ? v : fallback);
  const story = want(e.STORY_PROVIDER, { claude: keys.anthropic, demo: true }, keys.anthropic ? 'claude' : 'demo') as StoryProvider;
  const tts = want(e.TTS_PROVIDER, { elevenlabs: keys.elevenlabs, openai: keys.openai, none: true }, keys.elevenlabs ? 'elevenlabs' : keys.openai ? 'openai' : 'none') as TtsProvider;
  const image = want(e.IMAGE_PROVIDER, { openai: keys.openai, none: true }, keys.openai ? 'openai' : 'none') as ImageProvider;
  return {
    story, tts, image, keys,
    claudeModel: e.CLAUDE_MODEL || 'claude-opus-5-5',
    elevenlabsModel: e.ELEVENLABS_MODEL || 'eleven_v3',
    openaiTtsModel: e.OPENAI_TTS_MODEL || 'gpt-4o-mini-tts',
    openaiImageModel: e.OPENAI_IMAGE_MODEL || 'gpt-image-1',
  };
}
