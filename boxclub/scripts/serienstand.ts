/**
 * Schreibt SERIENSTAND.md – den aktuellen Stand der Serie als Grundlage für die nächste Folge.
 *   npx tsx scripts/serienstand.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import * as store from '../src/lib/store';

const c = store.getClub();
const chars = store.getCharacters();
const eps = store.listEpisodes();
const name = (id: string) => chars.find((x) => x.id === id)?.name ?? id;
const ev = c.upcomingEvent;
const next = c.lastEpisode + 1;
const open = c.decisions.find((d) => d.status === 'offen' || d.status === 'entschieden');
let md = `# Serienstand – Boxclub Rostfaust\n\nStand nach **Folge ${c.lastEpisode}** · erzeugt ${new Date().toISOString().slice(0, 10)} · Grundlage für **Folge ${next}**\n\n`;
md += `## Verein\n| | |\n|---|---|\n| Kapitel | ${c.chapter} |\n| Kasse | **${c.money} €** |\n| Monatlich | Einnahmen ${c.monthlyIncome} € · Kosten ${c.monthlyCosts} € (davon Pacht 250 €) → ${c.monthlyIncome - c.monthlyCosts} €/Monat |\n| Mitglieder | ${c.members} |\n| Ruf / Hallenzustand | ${c.reputation}/100 · ${c.facilityCondition} % |\n| Ausstattung | ${c.equipment.map((e) => `${e.name} ×${e.count}`).join(', ')} |\n\n`;
if (ev) md += `## Anstehende Veranstaltung\n**${ev.name}** – ${ev.kind} von ${name(ev.boxerId)} in **${ev.daysLeft} Tagen**. Arena: **${ev.seatsFilled}/${ev.seats} Plätze** gefüllt. Kosten: ${ev.cost} € (bereits bezahlt).\nCommunity-Mechanik: 1 neuer Follower = 1 symbolischer Platz (keine echte Auszahlung durch TikTok).\n\n`;
if (open) md += `## Offene Community-Frage (aus Folge ${open.episode})\n**${open.question}**\n${open.options.map((o) => `- ${o.key}: ${o.label} – ${o.consequenceHint}`).join('\n')}\n\n→ Für Folge ${next} brauche ich: das Ergebnis${ev ? ' bzw. die Zahl neuer Follower seit Folge ' + open.episode : ''}.\n\n`;
md += `## Figuren\n| Figur | Rolle | Status | Stimme |\n|---|---|---|---|\n${chars.map((x) => `| ${x.name}${x.nickname ? ` „${x.nickname}“` : ''} | ${x.roleTitle} | ${x.status}${x.firstEpisode ? ` (seit F${x.firstEpisode})` : ''} | ${x.voice.locked ? '🔒 ' : ''}${x.voice.note || x.voice.elevenlabsVoiceId} |`).join('\n')}\n\n`;
md += `## Handlungsstränge\n${c.storylines.map((s) => `- **${s.title}** (${s.status}): ${s.updates.at(-1)?.text ?? '–'}`).join('\n')}\n\n`;
md += `## Bisherige Folgen\n${eps.map((e) => `- **Folge ${e.number} „${e.title}“** (${e.status}${e.video ? `, ${e.video.durationSec} s` : ''}): ${e.summary}`).join('\n')}\n\n`;
md += `## Cliffhanger\n${c.nextEpisodeNote || '–'}\n`;
fs.writeFileSync(path.join(store.ROOT, 'SERIENSTAND.md'), md);
console.log('SERIENSTAND.md geschrieben');
