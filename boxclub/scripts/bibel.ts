/**
 * Erzeugt die visuelle Charakterbibel: docs/charakterbibel/<id>.png + docs/CHARAKTERBIBEL.md
 *   npm run bibel
 */
import fs from 'node:fs';
import path from 'node:path';
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import * as store from '../src/lib/store';

const outDir = path.join(store.ROOT, 'docs', 'charakterbibel');
fs.mkdirSync(outDir, { recursive: true });
const browser = fs.existsSync('/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell') ? '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell' : null;
const serveUrl = await bundle({ entryPoint: path.join(store.ROOT, 'src/remotion/index.ts') });
const chars = store.getCharacters();
let md = `# Charakterbibel – BOXCLUB\n\nAutomatisch erzeugt aus \`data/characters.json\` (${new Date().toISOString().slice(0, 10)}).\nDie Bilder werden aus denselben Daten gezeichnet wie die Animation – sie sind die verbindliche Referenz.\n\n`;
for (const c of chars) {
  const inputProps = { character: c };
  const composition = await selectComposition({ serveUrl, id: 'CharacterSheet', inputProps, browserExecutable: browser });
  await renderStill({ serveUrl, composition, inputProps, output: path.join(outDir, `${c.id}.png`), browserExecutable: browser });
  console.log('✓', c.name);
  md += `## ${c.name}${c.nickname ? ` „${c.nickname}“` : ''}\n\n![${c.name}](charakterbibel/${c.id}.png)\n\n| | |\n|---|---|\n| Rolle | ${c.roleTitle} (${c.role}) |\n| Status | ${c.status}${c.firstEpisode ? ` · seit Folge ${c.firstEpisode}` : ''}${c.lookLocked ? ' · Aussehen gesperrt' : ''} |\n| Alter / Größe / Gewicht | ${c.age} J. · ${c.heightCm} cm · ${c.weightKg} kg ${c.weightClass} |\n| Persönlichkeit | ${c.personality} |\n| Hintergrund | ${c.background} |\n| Sprechstil | ${c.speechStyle} |\n| Stärken | ${c.strengths.join(', ')} |\n| Schwächen | ${c.weaknesses.join(', ')} |\n| Ziel | ${c.goal} |\n| Spruch | „${c.catchphrase}“ |\n| Bilanz | ${c.record.siege}–${c.record.niederlagen}–${c.record.unentschieden} |\n| Kleidung | ${c.look.top.type} ${c.look.top.color}/${c.look.top.accent}${c.look.top.print ? ` „${c.look.top.print}“` : ''}, ${c.look.bottom.type} ${c.look.bottom.color}, Schuhe ${c.look.shoes} |\n| Kopf | Haut ${c.look.skin}, Haare ${c.look.hair.style} ${c.look.hair.color}, Bart ${c.look.facialHair.style}, Nase ${c.look.nose}, Augen ${c.look.eyeColor}${c.look.cauliflowerEar ? ', Blumenkohlohr' : ''} |\n| Accessoires | ${c.look.accessories.join(', ') || '–'} |\n| Stimme | ElevenLabs \`${c.voice.elevenlabsVoiceId || '–'}\` · OpenAI \`${c.voice.openaiVoice}\` |\n\n`;
}
fs.writeFileSync(path.join(store.ROOT, 'docs', 'CHARAKTERBIBEL.md'), md);
console.log('docs/CHARAKTERBIBEL.md geschrieben');
