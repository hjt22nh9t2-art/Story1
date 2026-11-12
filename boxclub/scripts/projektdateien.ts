/**
 * Aktualisiert die Projektdateien aus dem Seriengedächtnis (data/):
 *   series_state.json, CHARACTERS_AND_VOICES.md, EPISODE_LOG.md
 * (SERIES_BIBLE.md und PRODUCTION_STANDARDS.md werden von Hand gepflegt.)
 *   npx tsx scripts/projektdateien.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import * as store from '../src/lib/store';

const c = store.getClub();
const chars = store.getCharacters();
const eps = store.listEpisodes();
const name = (id: string) => chars.find((x) => x.id === id)?.name ?? id;
const w = (f: string, s: string) => fs.writeFileSync(path.join(store.ROOT, f), s);
const today = new Date().toISOString().slice(0, 10);

/* ---------------------------------------------------------- series_state.json */
const open = c.decisions.filter((d) => d.status !== 'umgesetzt');
const state = {
  stand: { nachFolge: c.lastEpisode, naechsteFolge: c.lastEpisode + 1, aktualisiert: today, kapitel: c.chapter },
  finanzen: { kasse: c.money, einnahmenProMonat: c.monthlyIncome, kostenProMonat: c.monthlyCosts, pachtProMonat: 250, sponsoren: c.sponsors },
  community: {
    follower: c.community.followers, likes: c.community.likes, likeEuroRate: c.community.likeEuroRate, likesGebucht: c.community.likesBooked,
    hinweis: 'Spielerische Mechaniken – keine echten TikTok-Einnahmen. Fehlende Werte = vom Produzenten noch nicht gemeldet.',
  },
  arena: c.upcomingEvent ? { name: c.upcomingEvent.name, boxer: name(c.upcomingEvent.boxerId), tageBisKampf: c.upcomingEvent.daysLeft, plaetzeBesetzt: c.upcomingEvent.seatsFilled, plaetzeGesamt: c.upcomingEvent.seats, kostenBezahlt: c.upcomingEvent.cost } : null,
  verein: { mitglieder: c.members, ruf: c.reputation, hallenzustand: c.facilityCondition, ausruestung: c.equipment.map((e) => ({ id: e.id, name: e.name, anzahl: e.count, zustand: e.condition })) },
  figuren: chars.map((x) => ({ id: x.id, name: x.name, status: x.status, rolle: x.roleTitle, stimme: x.voice.elevenlabsVoiceId, stimmeFest: x.voice.locked, seitFolge: x.firstEpisode })),
  offeneAngebote: c.offers.map((o) => ({ id: o.id, quelle: o.source, inhalt: o.content, status: o.status, storyBedingung: o.storyCondition, notiz: o.note, seitFolge: o.episode })),
  offeneEntscheidungen: open.map((d) => ({ id: d.id, ausFolge: d.episode, frage: d.question, optionen: d.options.map((o) => `${o.key}: ${o.label}`), status: d.status, ergebnis: d.winner, stimmen: d.votes, notiz: d.note })),
  handlungsstraenge: c.storylines.map((s) => ({ id: s.id, titel: s.title, status: s.status, letzterStand: s.updates.at(-1)?.text ?? '' })),
  cliffhanger: c.nextEpisodeNote,
  kennzahlen: c.metrics,
};
w('series_state.json', JSON.stringify(state, null, 2) + '\n');

/* ---------------------------------------------------------- CHARACTERS_AND_VOICES.md */
let cv = `# CHARACTERS AND VOICES – Boxclub Rostfaust\n\nStand nach Folge ${c.lastEpisode} (${today}). Quelle: \`data/characters.json\`. Referenzbilder: \`docs/charakterbibel/\`.\n\n`;
cv += `## Stimmen-Übersicht (verbindlich)\n| Figur | Stimme | Anbieter / Modell | Voice-ID | Status | Hinweis |\n|---|---|---|---|---|---|\n`;
for (const x of chars) { const sp = x.voice.speko; cv += `| ${x.name} | ${sp?.label || (x.voice.note.match(/„([^“]+)“/) ?? [, '–'])[1]} | ${sp ? `${sp.provider} / ${sp.model}` : `elevenlabs / ${x.voice.elevenlabsModel || 'Standard'}`} | \`${sp?.voice || x.voice.elevenlabsVoiceId}\` | ${x.voice.locked ? '🔒 fest' : 'Vorschlag'} | ${x.voice.note} |\n`; }
cv += `\n**Regel:** Stimmen mit 🔒 werden nie ohne ausdrückliche Zustimmung des Produzenten geändert. Prüfung jeder Zeile: Grundtonhöhe (\`scripts/pitch.py\`) + Spracherkennung.\n\n`;
for (const x of chars) {
  const l = x.look;
  cv += `## ${x.name}${x.nickname ? ` „${x.nickname}“` : ''}\n![${x.name}](docs/charakterbibel/${x.id}.png)\n\n`;
  cv += `- **Rolle:** ${x.roleTitle} · **Status:** ${x.status}${x.firstEpisode ? ` (seit Folge ${x.firstEpisode})` : ''}\n- **Daten:** ${x.age} J., ${x.heightCm} cm, ${x.weightKg} kg ${x.weightClass}${x.role === 'boxer' ? ` · Bilanz ${x.record.siege}–${x.record.niederlagen}–${x.record.unentschieden}` : ''}\n`;
  cv += `- **Aussehen (fest):** Haut ${l.skin}, Haare ${l.hair.style} ${l.hair.color}, Bart ${l.facialHair.style}, Nase ${l.nose}, Statur ${l.build}${l.cauliflowerEar ? ', Blumenkohlohr' : ''}; ${l.top.type} ${l.top.color}/${l.top.accent}${l.top.print ? ` „${l.top.print}“` : ''}, ${l.bottom.type} ${l.bottom.color}, Schuhe ${l.shoes}; Accessoires: ${l.accessories.join(', ') || '–'}\n`;
  cv += `- **Persönlichkeit:** ${x.personality}\n- **Sprechstil:** ${x.speechStyle}\n- **Stärken/Schwächen:** ${x.strengths.join(', ')} / ${x.weaknesses.join(', ')}\n- **Ziel:** ${x.goal} · **Spruch:** „${x.catchphrase}“\n- **Hintergrund:** ${x.background}\n\n`;
}
w('CHARACTERS_AND_VOICES.md', cv);

/* ---------------------------------------------------------- EPISODE_LOG.md */
let lg = `# EPISODE LOG – Boxclub Rostfaust\n\nStand ${today}. Alle Folgen in Reihenfolge. Kennzahlen nur, wenn vom Produzenten gemeldet.\n\n`;
lg += `| Folge | Titel | Länge | Status | Hook | Community-Frage → Ergebnis |\n|---|---|---|---|---|---|\n`;
for (const e of eps) {
  const d = c.decisions.find((x) => x.episode === e.number);
  const res = d?.winner ? `${d.winner} (${d.options.find((o) => o.key === d.winner)?.label})${d.status === 'umgesetzt' ? ` – umgesetzt in F${d.resolvedInEpisode}` : ''}` : 'offen';
  lg += `| ${e.number} | ${e.title} | ${e.video?.durationSec ?? '–'} s | ${e.status} | ${e.hook.replace(/\|/g, '/')} | ${e.decision.question} → ${res} |\n`;
}
for (const e of eps) {
  lg += `\n## Folge ${e.number} – ${e.title}\n${e.summary}\n\n- **Cliffhanger:** ${e.cliffhanger}\n- **Abstimmung:** ${e.decision.question} ${e.decision.options.map((o) => `${o.key}: ${o.label}`).join(' · ')}\n- **TikTok-Text:** ${e.socialCaption} ${e.hashtags.join(' ')}\n- **Datei:** ${e.video ? `data/media/${e.video.file}` : '–'}\n`;
}
lg += `\n## Performance-Tracking\n| Folge | Aufrufe | Likes | Kommentare | Geteilt | Neue Follower | Follower gesamt | Ø Wiedergabe | Ø angesehen | Vollständig | Notiz |\n|---|---|---|---|---|---|---|---|---|---|---|\n`;
const v = (x: unknown) => (x === null || x === undefined ? '–' : String(x));
for (const m of c.metrics) lg += `| ${m.episode} | ${v(m.views)} | ${v(m.likes)} | ${v(m.comments)} | ${v(m.shares)} | ${v(m.newFollowers)} | ${v(m.followersTotal)} | ${v(m.avgWatchSec)} | ${v(m.avgWatchedPct)} | ${v(m.fullViewsPct)} | ${m.note} |\n`;
if (!c.metrics.length) lg += `| – | noch keine Zahlen gemeldet | | | | | | | | | |\n`;
lg += `\n**Analyse:** Erst ab mehreren Folgen mit vollständigen Zahlen sinnvoll – keine voreiligen Schlüsse.\n`;
w('EPISODE_LOG.md', lg);
console.log('series_state.json, CHARACTERS_AND_VOICES.md, EPISODE_LOG.md aktualisiert');
