/**
 * Konsistenzprüfung: verhindert Widersprüche zum Seriengedächtnis.
 * Fehler blockieren die Veröffentlichung, Warnungen sind Hinweise.
 */
import type { Episode } from '../types';
import { buildTimeline } from '../timeline';
import { applyChange, castOf, type World } from './apply';

export interface ValidationResult { ok: boolean; errors: string[]; warnings: string[]; estimatedSec: number; moneyAfter: number }

export function validateEpisode(ep: Episode, world: World, opts: { isNext?: boolean } = {}): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const chars = new Map(world.characters.map((c) => [c.id, c]));
  const { club } = world;

  if (opts.isNext !== false && ep.number !== club.lastEpisode + 1) errors.push(`Folgennummer ${ep.number} passt nicht: zuletzt veröffentlicht wurde Folge ${club.lastEpisode}.`);

  // Zustandsänderungen testweise anwenden – wer erst in dieser Folge dazukommt, ist danach gültig
  const trial: World = structuredClone(world);
  for (const ch of ep.stateChanges) {
    try { applyChange(trial, ch, ep.number); } catch (e) { errors.push(`Zustandsänderung ungültig: ${(e as Error).message}`); }
  }
  const unlockedAfter = new Set(trial.locations.filter((l) => l.unlocked).map((l) => l.id));

  for (const id of castOf(ep)) {
    const c = chars.get(id);
    if (!c) { errors.push(`Unbekannte Figur „${id}“. Bitte zuerst in der Charakterverwaltung anlegen.`); continue; }
    const after = trial.characters.find((x) => x.id === id)!;
    if (c.status === 'ausgetreten' && after.status === 'ausgetreten') errors.push(`${c.name} ist ausgetreten und kann ohne Rückkehr-Handlung nicht auftreten.`);
  }
  ep.scenes.forEach((s, i) => {
    if (!unlockedAfter.has(s.location)) errors.push(`Szene ${i + 1}: Schauplatz „${s.location}“ ist noch nicht freigeschaltet.`);
    for (const l of s.lines) if (l.speaker !== 'erzaehler' && !s.cast.some((c) => c.characterId === l.speaker)) warnings.push(`Szene ${i + 1}: ${chars.get(l.speaker)?.name ?? l.speaker} spricht, steht aber nicht in der Besetzung.`);
    if (s.cast.length > 5) errors.push(`Szene ${i + 1}: maximal 5 Figuren gleichzeitig.`);
    const pos = s.cast.map((c) => c.position);
    if (new Set(pos).size !== pos.length) warnings.push(`Szene ${i + 1}: zwei Figuren stehen auf derselben Position.`);
  });

  // Entscheidung der Community
  const decided = club.decisions.filter((d) => d.status === 'entschieden');
  if (decided.length && !ep.resolvesDecisionId) errors.push(`Die Community-Entscheidung „${decided[0].question}“ (Folge ${decided[0].episode}) muss in dieser Folge umgesetzt werden.`);
  if (ep.resolvesDecisionId) {
    const d = club.decisions.find((x) => x.id === ep.resolvesDecisionId);
    if (!d) errors.push(`Entscheidung ${ep.resolvesDecisionId} existiert nicht.`);
    else if (d.status !== 'entschieden') errors.push(`Entscheidung „${d.question}“ ist noch nicht entschieden (Ergebnis zuerst eintragen).`);
  }
  const open = club.decisions.filter((d) => d.status === 'offen');
  if (open.length) warnings.push(`Offene Abstimmung aus Folge ${open[0].episode}: Ergebnis noch nicht eingetragen.`);

  if (ep.decision.options.length < 2 || ep.decision.options.length > 3) errors.push('Am Ende braucht es 2–3 Entscheidungsmöglichkeiten.');
  const beats = ep.scenes.map((s) => s.beat);
  if (beats[0] !== 'einstieg') warnings.push('Die erste Szene sollte der Einstieg (Hook) sein.');
  if (beats[beats.length - 1] !== 'entscheidung') warnings.push('Die letzte Szene sollte die Community-Entscheidung enthalten.');

  const tl = buildTimeline(ep);
  if (tl.totalSec < 33) warnings.push(`Geschätzte Länge ${tl.totalSec.toFixed(0)} s – Ziel sind 35–60 s.`);
  if (tl.totalSec > 62) warnings.push(`Geschätzte Länge ${tl.totalSec.toFixed(0)} s – Ziel sind 35–60 s. Dialoge kürzen.`);
  if (trial.club.money < 0) warnings.push(`Vereinskasse nach dieser Folge: ${trial.club.money} € (im Minus).`);

  return { ok: errors.length === 0, errors, warnings, estimatedSec: tl.totalSec, moneyAfter: trial.club.money };
}
