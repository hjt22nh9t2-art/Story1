"""Schritte 10 + 12: Rendern (Three.js headless) und finaler MP4-Export (H.264 + AAC, Filmkorn, Mastering)."""
import shutil
import subprocess

from . import config


def rendern(ordner, log=print, extra=None):
    cmd = [config.NODE, str(config.STUDIO / 'renderer' / 'render.mjs'), str(ordner), '--workers', str(config.RENDER_WORKERS)] + (extra or [])
    log('  Rendern:', ' '.join(cmd[1:]))
    p = subprocess.run(cmd, cwd=config.STUDIO)
    if p.returncode not in (0,):
        raise RuntimeError(f'Renderer meldet Fehler (Code {p.returncode}) – siehe Ausgabe oben')


def standbilder(ordner, zeiten, ziel):
    cmd = [config.NODE, str(config.STUDIO / 'renderer' / 'render.mjs'), str(ordner), '--stills', ','.join(f'{t:.2f}' for t in zeiten), '--dir', str(ziel)]
    return subprocess.run(cmd, cwd=config.STUDIO, capture_output=True, text=True).returncode


def cover(ordner):
    cmd = [config.NODE, str(config.STUDIO / 'renderer' / 'render.mjs'), str(ordner), '--cover', str(ordner / 'cover.png')]
    subprocess.run(cmd, cwd=config.STUDIO, check=True, capture_output=True)


def exportieren(ordner, dauer, name, log=print):
    roh = ordner / 'roh'
    # Mastering: feste Verstärkung + Limiter mit Oversampling (kein dynamisches loudnorm – das hebt Stille vor Schreckmomenten an)
    i = messen_lufs(roh / 'mix.wav')
    gain = max(-6.0, min(12.0, config.LUFS_ZIEL - i)) if i is not None else 4.0
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', str(roh / 'mix.wav'), '-af',
                    f'afade=t=in:d=0.015,volume={gain:.2f}dB,aresample=192000,alimiter=limit=0.84:level=false:attack=0.5:release=60,aresample=48000',
                    str(roh / 'master.wav')], check=True)
    ziel = ordner / f'{name}.mp4'
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', str(roh / 'video_stumm.mp4'), '-i', str(roh / 'master.wav'),
                    '-map', '0:v', '-map', '1:a', '-vf', 'noise=c0s=3:c0f=t', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18',
                    '-pix_fmt', 'yuv420p', '-r', str(config.FPS), '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2',
                    '-movflags', '+faststart', '-t', f'{dauer:.3f}', str(ziel)], check=True)
    log('  Export:', ziel.name)
    return ziel


def messen_lufs(p):
    out = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(p), '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    vals = {}
    for line in out.splitlines()[-14:]:
        line = line.strip()
        if line.startswith('I:'): vals['I'] = float(line.split()[1])
        if line.startswith('Peak:'): vals['TP'] = float(line.split()[1])
    return vals.get('I')


def aufraeumen(ordner):
    seg = ordner / 'roh' / 'seg'
    if seg.exists(): shutil.rmtree(seg)
