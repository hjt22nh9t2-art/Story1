"""Schritt 7: Sprechertext erzeugen (ein durchgehender Take = gleichbleibende Stimmfarbe) + Wortzeiten.

Anbieter (STUDIO_TTS):
  elevenlabs – beste deutsche Qualität, liefert Zeichen-Zeitstempel direkt (empfohlen)
  speko      – Speko-Router (z. B. zu ElevenLabs), Wortzeiten über Speko-Transkription
  edge       – kostenlos (Microsoft Edge Neural Voices), liefert Wortgrenzen direkt
  datei      – roh/stimme_take.wav liegt bereits vor (z. B. aus Claude Code über das Speko-MCP), optional roh/transkript.json
Ergebnis: roh/stimme_take.wav (48 kHz mono) + roh/stimme_woerter.json [{text, s, e}] in Take-Zeit.
"""
import base64
import json
import re
import subprocess
import time

from . import config

TAG = re.compile(r'\[[^\]]*\]')


def sprechtext(db, mit_tags=True):
    teile = []
    for s in db['szenen']:
        t = s['text'].strip()
        if not mit_tags:
            t = TAG.sub('', t)
        teile.append(re.sub(r'\s+', ' ', t).strip())
    return '\n\n'.join(teile)


def _zu_wav(src, dst):
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(src), '-ac', '1', '-ar', '48000', '-c:a', 'pcm_s16le', str(dst)], check=True)


def _retry(fn, versuche=4, name='TTS'):
    for v in range(versuche):
        try:
            return fn()
        except Exception as e:  # Netzwerk-/Anbieterfehler: mit Pause erneut versuchen
            if v == versuche - 1:
                raise
            w = 5 * 2 ** v
            print(f'  ! {name} fehlgeschlagen ({e}); neuer Versuch in {w}s')
            time.sleep(w)


# ------------------------------------------------------------------ ElevenLabs
def _elevenlabs(text, roh):
    import requests
    key = config.env('ELEVENLABS_API_KEY')
    url = f'https://api.elevenlabs.io/v1/text-to-speech/{config.ELEVEN_VOICE}/with-timestamps?output_format=mp3_44100_192'
    body = {'text': text, 'model_id': config.ELEVEN_MODEL, 'language_code': 'de',
            'voice_settings': {'stability': 0.5, 'similarity_boost': 0.8, 'style': 0.35, 'use_speaker_boost': True}}

    def call():
        r = requests.post(url, json=body, headers={'xi-api-key': key}, timeout=600)
        if r.status_code >= 400:
            raise RuntimeError(f'ElevenLabs {r.status_code}: {r.text[:300]}')
        return r.json()
    d = _retry(call, name='ElevenLabs')
    (roh / 'stimme.mp3').write_bytes(base64.b64decode(d['audio_base64']))
    _zu_wav(roh / 'stimme.mp3', roh / 'stimme_take.wav')
    al = d.get('alignment') or d.get('normalized_alignment')
    chars, st, en = al['characters'], al['character_start_times_seconds'], al['character_end_times_seconds']
    words, cur, s0, e0, in_tag = [], '', None, None, False
    for c, a, b in zip(chars, st, en):
        if c == '[': in_tag = True
        if in_tag:
            if c == ']': in_tag = False
            continue
        if c.isspace():
            if cur: words.append({'text': cur, 's': s0, 'e': e0}); cur = ''
            continue
        if not cur: s0 = a
        cur += c; e0 = b
    if cur: words.append({'text': cur, 's': s0, 'e': e0})
    return words


# ------------------------------------------------------------------ Edge (kostenlos)
def _edge(text, roh):
    import asyncio
    import edge_tts

    async def run():
        try:
            com = edge_tts.Communicate(text, config.EDGE_VOICE, rate='-4%', pitch='-2Hz', boundary='WordBoundary')
        except TypeError:
            com = edge_tts.Communicate(text, config.EDGE_VOICE, rate='-4%', pitch='-2Hz')
        audio, words = bytearray(), []
        async for ch in com.stream():
            if ch['type'] == 'audio':
                audio += ch['data']
            elif ch['type'] == 'WordBoundary':
                s = ch['offset'] / 1e7; words.append({'text': ch['text'], 's': s, 'e': s + ch['duration'] / 1e7})
        return bytes(audio), words
    audio, words = _retry(lambda: asyncio.run(run()), name='Edge-TTS')
    (roh / 'stimme.mp3').write_bytes(audio)
    _zu_wav(roh / 'stimme.mp3', roh / 'stimme_take.wav')
    return words


# ------------------------------------------------------------------ Speko
def _speko(text, roh):
    import inspect
    from spekoai import Speko
    sp = Speko(api_key=config.env('SPEKO_API_KEY'))
    kw = {'language': 'de'}
    sig = inspect.signature(sp.synthesize).parameters
    if 'voice' in sig: kw['voice'] = config.SPEKO_VOICE
    speech = _retry(lambda: sp.synthesize(text, **kw), name='Speko')
    ext = 'mp3' if 'mpeg' in (speech.content_type or '') else 'wav'
    (roh / f'stimme.{ext}').write_bytes(speech.audio)
    _zu_wav(roh / f'stimme.{ext}', roh / 'stimme_take.wav')
    try:
        res = sp.transcribe((roh / 'stimme_take.wav').read_bytes(), language='de')
        ws = getattr(res, 'words', None) or []
        return [{'text': w.text if hasattr(w, 'text') else w['text'],
                 's': (w.start_ms if hasattr(w, 'start_ms') else w['start_ms']) / 1000,
                 'e': (w.end_ms if hasattr(w, 'end_ms') else w['end_ms']) / 1000} for w in ws]
    except Exception as e:
        print('  ! Speko-Transkription ohne Wortzeiten:', e)
        return []


def _datei(text, roh):
    wav = roh / 'stimme_take.wav'
    if not wav.exists():
        raise FileNotFoundError(f'{wav} fehlt (STUDIO_TTS=datei). Erzeuge den Take z. B. in Claude Code über das Speko-MCP.')
    t = roh / 'transkript.json'
    if t.exists():
        d = json.loads(t.read_text(encoding='utf-8'))
        ws = d.get('words', d) if isinstance(d, dict) else d
        return [{'text': w['text'], 's': w.get('start_ms', w.get('s', 0) * 1000) / 1000, 'e': w.get('end_ms', w.get('e', 0) * 1000) / 1000} for w in ws]
    return []


ANBIETER = {'elevenlabs': (_elevenlabs, True), 'edge': (_edge, False), 'speko': (_speko, False), 'datei': (_datei, False)}


def erzeugen(db, ordner, anbieter=None, log=print):
    roh = ordner / 'roh'; roh.mkdir(parents=True, exist_ok=True)
    anbieter = anbieter or config.TTS
    fn, tags = ANBIETER[anbieter]
    text = sprechtext(db, mit_tags=tags)
    (roh / 'sprechtext.txt').write_text(text, encoding='utf-8')
    log(f'  Stimme über „{anbieter}“ ({len(text)} Zeichen)')
    words = fn(text, roh)
    (roh / 'stimme_woerter.json').write_text(json.dumps(words, ensure_ascii=False), encoding='utf-8')
    return words


def dauer_wav(p):
    out = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(p)], capture_output=True, text=True).stdout
    return float(out.strip())
