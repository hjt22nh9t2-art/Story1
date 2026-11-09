/**
 * Text-to-Speech-Anbieter (modular). Neue Anbieter: Funktion mit gleicher Signatur
 * ergänzen und in `synthesizeLine` eintragen.
 *
 *  - ElevenLabs:  POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}   (Header: xi-api-key)
 *  - OpenAI:      POST https://api.openai.com/v1/audio/speech                    (Header: Authorization: Bearer)
 *  - none:        keine echte Stimme – stattdessen Demo-Brabbelstimme + Untertitel
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import type { Character } from '../types';
import { getConfig, type TtsProvider } from './config';

export interface TtsResult { file: string; durationSec: number; provider: string }

async function elevenlabs(text: string, c: Character | undefined): Promise<Buffer> {
  const cfg = getConfig();
  const voice = c?.voice.elevenlabsVoiceId || process.env.ELEVENLABS_DEFAULT_VOICE;
  if (!voice) throw new Error(`Keine ElevenLabs-Voice-ID für ${c?.name ?? 'Erzähler'} hinterlegt (Charakterverwaltung → Stimme).`);
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice)}?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY!, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify({
      text,
      model_id: cfg.elevenlabsModel,
      voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.35, use_speaker_boost: true },
    }),
  });
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return Buffer.from(await res.arrayBuffer());
}

async function openai(text: string, c: Character | undefined): Promise<Buffer> {
  const cfg = getConfig();
  const res = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: cfg.openaiTtsModel,
      voice: c?.voice.openaiVoice || 'onyx',
      input: text,
      instructions: `Sprich Deutsch. ${c?.voice.instructions ?? ''} Sprechstil: ${c?.speechStyle ?? ''}`.slice(0, 900),
      response_format: 'mp3',
    }),
  });
  if (!res.ok) throw new Error(`OpenAI TTS ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return Buffer.from(await res.arrayBuffer());
}

export function probeDuration(file: string): number {
  const out = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', file]).toString().trim();
  return Math.round(parseFloat(out) * 100) / 100;
}

/** Erzeugt die Sprachdatei für eine Zeile und legt sie unter mediaDir/relDir ab. */
export async function synthesizeLine(opts: { text: string; character?: Character; mediaDir: string; relFile: string; provider?: TtsProvider }): Promise<TtsResult | null> {
  const provider = opts.provider ?? getConfig().tts;
  if (provider === 'none') return null;
  const audio = provider === 'elevenlabs' ? await elevenlabs(opts.text, opts.character) : await openai(opts.text, opts.character);
  const abs = path.join(opts.mediaDir, opts.relFile);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, audio);
  return { file: opts.relFile, durationSec: probeDuration(abs), provider };
}
