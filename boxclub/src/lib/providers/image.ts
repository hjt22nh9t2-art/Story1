/**
 * Bild-KI (optional) für Konzeptbilder, Cover und neue Schauplatz-Ideen.
 * WICHTIG: Für die Animation selbst werden KEINE KI-Bilder verwendet – Figuren
 * und Kulissen kommen aus dem parametrischen Rig, damit sie über hunderte
 * Folgen exakt gleich bleiben. KI-Bilder dienen als Inspiration/Thumbnail.
 *
 *  - OpenAI: POST https://api.openai.com/v1/images/generations (model gpt-image-1, liefert b64_json)
 */
import fs from 'node:fs';
import path from 'node:path';
import type { Character } from '../types';
import { getConfig } from './config';

export const STYLE_PROMPT =
  'Stil: hochwertige 2D/2.5D-Cartoon-Animation für eine Erwachsenen-Comedy-Serie, klare dunkle Konturen, leicht überzeichnete Proportionen, ausdrucksstarkes Gesicht, warme entsättigte Farben, Boxclub in einer alten Backsteinhalle im Ruhrgebiet, filmisches Licht, kein Kinderlook, keine Schrift.';

export function characterPrompt(c: Character) {
  const l = c.look;
  return `${STYLE_PROMPT}\nGanzkörper-Referenzbild, neutraler Hintergrund. Figur: ${c.name} (${c.age} Jahre, ${c.heightCm} cm, Statur ${l.build}). Haut ${l.skin}, Haare ${l.hair.style} ${l.hair.color}, Bart ${l.facialHair.style}, Nase ${l.nose}${l.cauliflowerEar ? ', Blumenkohlohr' : ''}. Kleidung: ${l.top.type} in ${l.top.color} mit Akzent ${l.top.accent}${l.top.print ? ` und Aufdruck „${l.top.print}“` : ''}, ${l.bottom.type} in ${l.bottom.color}, Schuhe ${l.shoes}. Accessoires: ${l.accessories.join(', ') || 'keine'}. Persönlichkeit: ${c.personality}`;
}

export async function generateImage(prompt: string, mediaDir: string, relFile: string): Promise<string> {
  const cfg = getConfig();
  if (cfg.image === 'none') throw new Error('Kein Bildanbieter konfiguriert (OPENAI_API_KEY fehlt). Siehe Einstellungen.');
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: cfg.openaiImageModel, prompt, size: '1024x1536', n: 1 }),
  });
  if (!res.ok) throw new Error(`OpenAI Images ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const json = (await res.json()) as { data: { b64_json?: string }[] };
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) throw new Error('OpenAI lieferte kein Bild zurück.');
  const abs = path.join(mediaDir, relFile);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, Buffer.from(b64, 'base64'));
  return relFile;
}
