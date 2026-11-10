"""Extrahiert Audio + Metadaten aus einer gespeicherten Speko-Antwort (altes und neues Format).
Aufruf: python3 scripts/speko_audio.py <antwort.json> <ziel.wav>   → druckt provider, model, dauer"""
import base64, json, re, shutil, sys

src, dst = sys.argv[1], sys.argv[2]
raw = json.load(open(src))
meta, blob = {}, None
items = raw if isinstance(raw, list) else [{'text': json.dumps(raw)}]
for it in items:
    t = it.get('text', '')
    m = re.search(r'saved to (\S+)', t)
    if t.startswith('[Audio') and m: blob = m.group(1)
    else:
        try: meta = json.loads(t)
        except Exception: pass
if meta.get('audio_base64'):
    open(dst, 'wb').write(base64.b64decode(meta['audio_base64']))
elif blob:
    shutil.copyfile(blob, dst)
else:
    sys.exit('kein Audio gefunden')
print(meta.get('provider', '?'), meta.get('model', '?'), meta.get('duration_seconds', '?'))
