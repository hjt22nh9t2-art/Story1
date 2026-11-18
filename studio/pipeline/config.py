"""Zentrale Einstellungen. Werte können über Umgebungsvariablen oder die Datei studio/.env überschrieben werden."""
import os
from pathlib import Path

STUDIO = Path(__file__).resolve().parent.parent
FOLGEN = STUDIO / 'folgen'
PROMPTS = STUDIO / 'prompts'
MUSIK = STUDIO / 'musik'
ARCHIV = STUDIO / 'archiv.json'


def _load_env():
    f = STUDIO / '.env'
    if f.exists():
        for line in f.read_text(encoding='utf-8').splitlines():
            line = line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            k, v = line.split('=', 1)
            os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


_load_env()


def env(k, d=None):
    return os.environ.get(k, d)


# ---------------------------------------------------------------- Video (verbindlich)
W, H, FPS = 1080, 1920, 30
MIN_DAUER = 60.0          # Kein Video darf kürzer sein (harte Regel)
ZIEL_DAUER = (75.0, 120.0)  # ideale Länge
OUTRO_DAUER = 3.2          # Endtafel mit Frage nach der letzten Erzählzeile
VORLAUF = 0.25            # Stille vor dem ersten Wort

# ---------------------------------------------------------------- KI-Text (Recherche, Drehbuch, Kritik)
LLM_MODEL = env('STUDIO_LLM_MODEL', 'claude-opus-5-5')
LLM_MODEL_GUENSTIG = env('STUDIO_LLM_MODEL_GUENSTIG', 'claude-sonnet-5-5')

# ---------------------------------------------------------------- Stimme
# TTS-Anbieter: elevenlabs | speko | edge | datei (fertige WAV liegt schon in roh/stimme_take.wav)
TTS = env('STUDIO_TTS', 'elevenlabs' if env('ELEVENLABS_API_KEY') else ('speko' if env('SPEKO_API_KEY') else 'edge'))
ELEVEN_VOICE = env('ELEVENLABS_VOICE_ID', '5faieqDE3osz75KiOI2M')   # „Thomas – Authentic & Natural“ (deutsch)
ELEVEN_MODEL = env('ELEVENLABS_MODEL', 'eleven_v3')
EDGE_VOICE = env('EDGE_VOICE', 'de-DE-FlorianMultilingualNeural')
SPEKO_VOICE = env('SPEKO_VOICE', ELEVEN_VOICE)

# ---------------------------------------------------------------- Rendern
RENDER_WORKERS = int(env('STUDIO_WORKERS', str(max(1, min(4, (os.cpu_count() or 4) - 1)))))
NODE = env('NODE', 'node')

# ---------------------------------------------------------------- Ton (Pegel in dBFS RMS)
STIMME_DB = -18.0
MUSIK_UNTER_STIMME_DB = 17.0   # Musik liegt so viel unter der Stimme
LUFS_ZIEL = -14.0
