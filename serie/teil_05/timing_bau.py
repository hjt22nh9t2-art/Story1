"""Baut teil_05/timing.json: Take an Pausen schneiden, Pausen neu setzen (Video-Zeit), Wortzeiten umrechnen.
Wortzeiten aus Speko audio.transcribe (word_timestamps, de), Text korrigiert. Aufruf: python3 teil_05/timing_bau.py WORDS.json"""
import json, sys, os
HERE = os.path.dirname(os.path.abspath(__file__))
SIL = [(1.9, 2.66), (4.03, 4.79), (5.8, 6.44), (9.7, 10.3), (12.06, 12.81), (14.21, 15.01), (16.04, 16.48), (17.35, 18.0), (18.57, 19.11), (19.73, 20.52), (21.53, 22.21), (22.79, 23.54), (24.34, 25.03), (27.19, 27.98), (30.35, 31.11), (32.26, 32.72), (34.46, 35.23), (36.13, 36.91), (37.89, 38.59), (39.68, 40.16), (41.07, 41.9), (42.94, 43.45), (43.88, 44.54), (46.04, 46.63), (47.52, 48.27), (49.2, 49.88), (50.62, 51.38), (52.53, 53.3), (54.16, 54.73), (55.55, 56.29), (57.29, 57.87)]
END = 58.54
# Pause NACH Segment i (Video-Sekunden). Standard 0.3 s, hier Sonderfälle
GAP = {0: 0.6, 1: 0.65, 2: 0.25, 5: 0.6, 9: 0.5, 11: 0.5, 16: 0.5, 17: 0.75, 21: 0.35, 22: 0.3, 23: 0.45, 24: 0.6, 26: 0.3, 27: 0.6, 28: 0.4, 29: 0.8, 30: 0.9}
DEFAULT = 0.38
START = 0.25
# Segment-Grenzen im Take (mit 60 ms Luft vor/nach der Sprache)
bounds = []; a = 0.0
for s, e in SIL: bounds.append((a, s + 0.06)); a = e - 0.06
bounds.append((a, END))
segs = []; t = START
for i, (a, b) in enumerate(bounds):
    lead = 0.0 if i == 0 else 0.06
    v0 = t - lead
    segs.append(['J', round(a, 3), round(b, 3), round(v0, 3)])
    t = v0 + (b - a) - 0.06 + GAP.get(i, DEFAULT)
words = json.load(open(sys.argv[1]))
out = []
for txt, s, e in words:
    s /= 1000; e /= 1000; m = (s + e) / 2
    k = next(i for i, (a, b) in enumerate(bounds) if m <= b) 
    a, b = bounds[k]; off = segs[k][3] - a
    out.append({'text': txt, 's': round(max(s, a) + off, 2), 'e': round(min(e, b) + off, 2)})
json.dump({'stimme': 'teil_05/roh/stimme_take.wav', 'sprecher': 'Speko → Soniox „Adrian“ (tts-rt-v2), de',
           'segmente': segs, 'woerter': out}, open(os.path.join(HERE, 'timing.json'), 'w'), ensure_ascii=False, indent=1)
for i, sg in enumerate(segs):
    ws = [w['text'] for w in out if sg[3] <= w['s'] < sg[3] + sg[2] - sg[1] + 0.01]
    print(f"{i:2d} {sg[3]:6.2f}-{sg[3]+sg[2]-sg[1]:6.2f}  {' '.join(ws)}")
