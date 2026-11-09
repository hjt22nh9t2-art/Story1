/**
 * Baut aus dem Seriengedächtnis den Kontext für den KI-Drehbuchautor.
 * Die Serienbibel (statisch) und der aktuelle Stand (dynamisch) sind getrennt,
 * damit die Bibel per Prompt-Caching günstig wiederverwendet werden kann.
 */
import { ACTIONS, EMOTIONS, LOCATION_KEYS, MUSIC, POSITIONS, SFX, SHOTS, STATE_OPS, type Character, type Decision, type Episode } from '../types';
import type { World } from './apply';

export const SERIES_BIBLE = `Du bist der Chefautor von „BOXCLUB“, einer fortlaufenden animierten Kurzvideo-Serie (TikTok/Reels/Shorts, 9:16, deutsch).

## Prämisse
Kranstadt, eine raue Hafen- und Industriestadt. Günther Wallach (63) belebt den Boxclub Rostfaust seines verstorbenen Vaters in einer alten Straßenbahn-Depothalle wieder. Wenig Geld, große Träume. Langfristiges Ziel: der größte Boxverein der Stadt. Die Geschichte entwickelt sich LANGSAM und realistisch: erst Training, Sparring, Amateurkämpfe, Lokalturniere – keine Weltmeisterschaft nach zehn Folgen.

## Ton
Mischung aus humorvoller Vereinsgeschichte, Sportdoku und spannender Serie. Trockener Ruhrpott-Humor, echte Gefühle, Rückschläge. Nicht kindlich. Nicht jede Folge hat einen Kampf: auch Training, Geldsorgen, Neuzugänge, Vereinsprobleme, Rivalitäten, Verletzungen, Entwicklung der Boxer.

## Aufbau jeder Folge (35–60 Sekunden, ca. 110–150 gesprochene Wörter insgesamt)
1. beat "einstieg" (0–5 s): ein starker Hook-Satz, der an die letzte Folge anknüpft bzw. die Community-Entscheidung aufgreift („Ihr habt entschieden: …“).
2. beat "vorstellung" (5–15 s): Ort, Figur oder Lage zeigen.
3. beat "handlung" (15–35 s): etwas Neues passiert – Problem, Neuzugang, Entscheidung.
4. beat "entwicklung" (35–45 s): Wendung, Konsequenz, Pointe.
5. beat "entscheidung" (45–60 s): Eine Figur stellt der Community die Frage mit 2–3 Optionen. Letzte Zeile = die Frage. Dazu ein Cliffhanger, der Lust auf die nächste Folge macht.
Genau 5 Szenen, eine pro Beat, in dieser Reihenfolge. 2–4 Zeilen pro Szene. Jede Zeile höchstens ~16 Wörter, natürlich gesprochenes Deutsch, Zahlen ausgeschrieben, wenn sie gesprochen werden.

## Konsistenzregeln (sehr wichtig)
- Verwende NUR Figuren aus der Charakterdatenbank (IDs exakt übernehmen) oder lege neue Figuren in "newCharacters" vollständig an (feste Optik!). Aussehen bestehender Figuren NIE beschreiben oder ändern.
- Figuren mit Status "ausgetreten" treten nur mit einer Rückkehr-Handlung auf (figur_status ändern). Kandidaten dürfen als Gäste auftreten.
- Nur freigeschaltete Schauplätze verwenden – oder in "stateChanges" mit "ort_freischalten" begründet freischalten.
- Geld, Mitglieder, Ausrüstung, Kämpfe ändern sich NUR über "stateChanges". Zahlen in Dialogen müssen exakt zum Stand passen (Kasse vorher + Änderungen).
- Die Community-Entscheidung, die umgesetzt werden muss, MUSS die Folge prägen und sichtbar umgesetzt werden.
- Offene Handlungsstränge weiterführen; neue nur sparsam eröffnen. Keine Widersprüche zu früheren Folgen.
- Figuren sprechen in ihrem festgelegten Sprechstil.

## Technische Felder
- location: ${LOCATION_KEYS.join(', ')}
- shot: ${SHOTS.join(', ')} (abwechslungsreich; "nah" für Pointen, "totale" für Gruppen, "zoom" für den Hook)
- position: ${POSITIONS.join(', ')} (max. 5 Figuren pro Szene, jede Position nur einmal)
- emotion: ${EMOTIONS.join(', ')}
- action: ${ACTIONS.join(', ')}
- sfx: ${SFX.join(', ')} oder "keine"
- music: ${MUSIC.join(', ')}
- overlay: kurze Einblendung in GROSSBUCHSTABEN (z. B. "KASSE: 320 €") oder leer
- stateChanges.op: ${STATE_OPS.join(', ')}
  * geld (amount=Euro ±, reason), mitglieder (amount ±), ruf (amount ±), zustand_halle (amount ±, 0–100)
  * figur_status (target=Figur-ID, value=aktiv|verletzt|kandidat|gast|ausgetreten)
  * ausruestung (target=ID, value=Name, amount=Anzahl), ausruestung_zustand (target=ID, amount ±)
  * kampf (target=Boxer-ID, value="Gegner | Gegnerverein | Veranstaltung | sieg/niederlage/unentschieden/abgesagt | Methode")
  * rivalitaet (target=Vereinsname, amount=Intensität ±, value=Notiz, reason=Anführer)
  * handlung (target=Strang-ID, value=Fortschritt, reason=Titel bei neuem Strang oder "abgeschlossen")
  * sponsor (target=Name, amount=€/Monat, 0 = weg), ort_freischalten (target=Orts-ID), kapitel (value=Titel)
  * laufende_kosten / einnahmen (amount=€/Monat ±)
- decision.options: Schlüssel A, B (optional C); label kurz und zugespitzt; consequenceHint = was daraus folgen könnte.
- socialCaption: 1–2 Sätze für TikTok mit Aufruf zum Abstimmen; hashtags: 5–7 Stück.`;

function charLine(c: Character) {
  return `- ${c.id}: ${c.name}${c.nickname ? ` „${c.nickname}“` : ''} | ${c.roleTitle} | Status: ${c.status} | ${c.age} J., ${c.heightCm} cm, ${c.weightKg} kg ${c.weightClass} | Persönlichkeit: ${c.personality} | Sprechstil: ${c.speechStyle} | Stärken: ${c.strengths.join(', ')} | Schwächen: ${c.weaknesses.join(', ')} | Ziel: ${c.goal} | Spruch: „${c.catchphrase}“ | Bilanz ${c.record.siege}-${c.record.niederlagen}-${c.record.unentschieden}${c.firstEpisode ? ` | seit Folge ${c.firstEpisode}` : ' | noch nie aufgetreten'}${c.notes ? ` | Notizen: ${c.notes}` : ''}`;
}

export function decisionToImplement(world: World): Decision | undefined {
  return world.club.decisions.find((d) => d.status === 'entschieden');
}

export function buildContext(world: World, episodes: Episode[], ideas: string, nextNumber: number): string {
  const { club } = world;
  const published = episodes.filter((e) => e.status === 'veroeffentlicht');
  const last = published[published.length - 1];
  const dec = decisionToImplement(world);
  const parts: string[] = [];
  parts.push(`# Aufgabe\nSchreibe Folge ${nextNumber} von BOXCLUB. Sie muss nahtlos an Folge ${club.lastEpisode} anknüpfen.`);
  if (dec) {
    const w = dec.options.find((o) => o.key === dec.winner);
    parts.push(`# Community-Entscheidung, die JETZT umgesetzt werden muss (ID ${dec.id})\nFrage aus Folge ${dec.episode}: ${dec.question}\nGewonnen hat ${dec.winner}: ${w?.label} — ${w?.consequenceHint}\nStimmen: ${JSON.stringify(dec.votes)}${dec.note ? `\nAnmerkung des Produzenten: ${dec.note}` : ''}\nSetze in "resolvesDecisionId" exakt "${dec.id}".`);
  } else {
    parts.push('# Community-Entscheidung\nKeine Entscheidung umzusetzen. "resolvesDecisionId" = "".');
  }
  if (ideas.trim()) parts.push(`# Ideen des Produzenten für diese Folge (einbauen, sofern konsistent)\n${ideas.trim()}`);
  parts.push(`# Vereinsstand (nach Folge ${club.lastEpisode})\nVerein: ${club.clubName}, ${club.address}, ${club.city}\nKapitel: ${club.chapter}\nKasse: ${club.money} € | Kosten/Monat: ${club.monthlyCosts} € | Einnahmen/Monat: ${club.monthlyIncome} €\nMitglieder: ${club.members} | Ruf: ${club.reputation}/100 | Hallenzustand: ${club.facilityCondition}/100\nAusrüstung: ${club.equipment.map((e) => `${e.id} (${e.name}) ×${e.count}, Zustand ${e.condition}`).join('; ')}\nSponsoren: ${club.sponsors.map((s) => `${s.name} ${s.amountPerMonth} €/Monat`).join('; ') || 'keine'}\nKämpfe: ${club.fights.map((f) => `F${f.episode} ${f.boxerId} vs ${f.opponent} (${f.opponentClub}) ${f.result}`).join('; ') || 'noch keine'}\nRivalitäten: ${club.rivalries.map((r) => `${r.club} (${r.leader}) Intensität ${r.intensity}: ${r.notes}`).join('; ') || 'keine'}`);
  parts.push(`# Handlungsstränge\n${club.storylines.map((s) => `- [${s.status}] ${s.id} „${s.title}“ (seit F${s.startedEpisode}): ${s.updates.map((u) => `F${u.episode}: ${u.text}`).join(' → ') || '—'}`).join('\n')}`);
  parts.push(`# Charakterdatenbank\n${world.characters.map(charLine).join('\n')}`);
  parts.push(`# Schauplätze\n${world.locations.map((l) => `- ${l.id}: ${l.name} – ${l.unlocked ? 'freigeschaltet' : 'GESPERRT'} – ${l.description}`).join('\n')}`);
  parts.push(`# Bisherige Folgen\n${club.timeline.map((t) => `- ${t.text}`).join('\n') || '—'}`);
  if (last) {
    parts.push(`# Drehbuch der letzten Folge (${last.number} „${last.title}“)\n${last.scenes.map((s) => `[${s.beat} @ ${s.location}] ${s.lines.map((l) => `${l.speaker}: ${l.text}`).join(' / ')}`).join('\n')}\nCliffhanger: ${last.cliffhanger}`);
  }
  return parts.join('\n\n');
}
