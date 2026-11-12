/**
 * Wendet die Zustandsänderungen einer Folge auf das Seriengedächtnis an.
 * Reine Funktion – bekommt den Stand, liefert den neuen Stand.
 */
import { CHAR_STATUS, type Character, type ClubState, type Episode, type Location, type StateChange } from '../types';

export interface World { club: ClubState; characters: Character[]; locations: Location[] }

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const slug = (s: string) => s.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'x';

export function applyChange(w: World, ch: StateChange, ep: number): string {
  const c = w.club;
  switch (ch.op) {
    case 'geld': c.money = Math.round((c.money + ch.amount) * 100) / 100; return `Kasse ${ch.amount >= 0 ? '+' : ''}${ch.amount} € (${ch.reason || 'ohne Grund'})`;
    case 'mitglieder': c.members = Math.max(0, c.members + Math.round(ch.amount)); return `Mitglieder ${ch.amount >= 0 ? '+' : ''}${ch.amount}`;
    case 'ruf': c.reputation = clamp(c.reputation + ch.amount, 0, 100); return `Ruf ${ch.amount >= 0 ? '+' : ''}${ch.amount}`;
    case 'zustand_halle': c.facilityCondition = clamp(c.facilityCondition + ch.amount, 0, 100); return `Hallenzustand ${ch.amount >= 0 ? '+' : ''}${ch.amount}`;
    case 'laufende_kosten': c.monthlyCosts = Math.max(0, c.monthlyCosts + ch.amount); return `Monatliche Kosten ${ch.amount >= 0 ? '+' : ''}${ch.amount} €`;
    case 'einnahmen': c.monthlyIncome = Math.max(0, c.monthlyIncome + ch.amount); return `Monatliche Einnahmen ${ch.amount >= 0 ? '+' : ''}${ch.amount} €`;
    case 'kapitel': c.chapter = ch.value; return `Neues Kapitel: ${ch.value}`;
    case 'figur_status': {
      const f = w.characters.find((x) => x.id === ch.target);
      if (!f) throw new Error(`figur_status: Figur ${ch.target} unbekannt`);
      if (!(CHAR_STATUS as readonly string[]).includes(ch.value)) throw new Error(`figur_status: Status „${ch.value}“ ungültig`);
      f.status = ch.value as Character['status'];
      return `${f.name} ist jetzt ${ch.value}`;
    }
    case 'ausruestung': {
      const id = ch.target || slug(ch.value);
      const e = c.equipment.find((x) => x.id === id);
      if (e) e.count = Math.max(0, e.count + Math.round(ch.amount || 1));
      else c.equipment.push({ id, name: ch.value || id, count: Math.max(1, Math.round(ch.amount || 1)), condition: 100 });
      return `Ausrüstung: ${ch.value || id} ${ch.amount >= 0 ? '+' : ''}${ch.amount || 1}`;
    }
    case 'ausruestung_zustand': {
      const e = c.equipment.find((x) => x.id === ch.target);
      if (!e) throw new Error(`ausruestung_zustand: ${ch.target} unbekannt`);
      e.condition = clamp(e.condition + ch.amount, 0, 100);
      return `${e.name}: Zustand ${e.condition}`;
    }
    case 'kampf': {
      // value: "Gegner | Gegnerverein | Veranstaltung | sieg|niederlage|unentschieden|abgesagt | Methode"
      const [opponent = '?', opponentClub = '?', event = '?', resultRaw = 'abgesagt', method = ''] = ch.value.split('|').map((s) => s.trim());
      const result = (['sieg', 'niederlage', 'unentschieden', 'abgesagt'].includes(resultRaw) ? resultRaw : 'abgesagt') as 'sieg' | 'niederlage' | 'unentschieden' | 'abgesagt';
      c.fights.push({ id: `k${c.fights.length + 1}`, episode: ep, boxerId: ch.target, opponent, opponentClub, event, result, method });
      const f = w.characters.find((x) => x.id === ch.target);
      if (f && result === 'sieg') f.record.siege++;
      if (f && result === 'niederlage') f.record.niederlagen++;
      if (f && result === 'unentschieden') f.record.unentschieden++;
      return `Kampf: ${f?.name ?? ch.target} vs. ${opponent} → ${result}`;
    }
    case 'rivalitaet': {
      let r = c.rivalries.find((x) => x.club === ch.target);
      if (!r) { r = { id: slug(ch.target), club: ch.target, leader: ch.reason, intensity: 0, since: ep, notes: '' }; c.rivalries.push(r); }
      r.intensity = clamp(r.intensity + ch.amount, 0, 10);
      if (ch.value) r.notes = ch.value;
      return `Rivalität mit ${ch.target}: Intensität ${r.intensity}`;
    }
    case 'handlung': {
      const id = ch.target || slug(ch.reason || ch.value);
      let s = c.storylines.find((x) => x.id === id);
      if (!s) { s = { id, title: ch.reason && ch.reason !== 'abgeschlossen' ? ch.reason : id, status: 'offen', startedEpisode: ep, updates: [] }; c.storylines.push(s); }
      if (ch.value) s.updates.push({ episode: ep, text: ch.value });
      if (ch.reason === 'abgeschlossen') s.status = 'abgeschlossen';
      return `Handlung „${s.title}“: ${ch.value}`;
    }
    case 'sponsor': {
      const i = c.sponsors.findIndex((x) => x.name === ch.target);
      if (ch.amount <= 0 && i >= 0) { c.monthlyIncome -= c.sponsors[i].amountPerMonth; c.sponsors.splice(i, 1); return `Sponsor ${ch.target} weg`; }
      if (i >= 0) { c.monthlyIncome += ch.amount - c.sponsors[i].amountPerMonth; c.sponsors[i].amountPerMonth = ch.amount; }
      else { c.sponsors.push({ name: ch.target, amountPerMonth: ch.amount, since: ep }); c.monthlyIncome += ch.amount; }
      return `Sponsor ${ch.target}: ${ch.amount} €/Monat`;
    }
    case 'veranstaltung': {
      // value: "Name | Orts-ID | Art | Boxer-ID | Plätze | Tage"   amount = Kosten
      const [name = 'Veranstaltung', locationId = 'eventhalle', kind = 'Kampf', boxerId = '', seats = '100', days = '5'] = ch.value.split('|').map((x) => x.trim());
      if (ch.reason === 'abgeschlossen') { c.upcomingEvent = null; return `Veranstaltung beendet: ${name}`; }
      c.upcomingEvent = { name, locationId, kind, boxerId, seats: Number(seats) || 100, seatsFilled: 0, daysLeft: Number(days) || 5, cost: ch.amount, announcedEpisode: ep, note: ch.reason };
      return `Veranstaltung angesetzt: ${name} in ${days} Tagen (${seats} Plätze)`;
    }
    case 'plaetze': {
      if (!c.upcomingEvent) throw new Error('plaetze: keine Veranstaltung angesetzt');
      c.upcomingEvent.seatsFilled = clamp(Math.round(ch.amount), 0, c.upcomingEvent.seats);
      return `Arena: ${c.upcomingEvent.seatsFilled}/${c.upcomingEvent.seats} Plätze gefüllt (${ch.reason || 'Community'})`;
    }
    case 'countdown': {
      if (!c.upcomingEvent) throw new Error('countdown: keine Veranstaltung angesetzt');
      c.upcomingEvent.daysLeft = Math.max(0, Math.round(ch.amount));
      return `Noch ${c.upcomingEvent.daysLeft} Tage bis ${c.upcomingEvent.name}`;
    }
    case 'follower': {
      c.community.followers = Math.round(ch.amount);
      return `Community: ${c.community.followers} Follower (${ch.reason || 'Meldung Produzent'})`;
    }
    case 'likes': {
      c.community.likes = Math.round(ch.amount);
      return `Community: ${c.community.likes} Likes (${ch.reason || 'Meldung Produzent'})`;
    }
    case 'kennzahlen': {
      // value = JSON mit views, likes, comments, shares, newFollowers, followersTotal, avgWatchSec, avgWatchedPct, fullViewsPct, note
      const m = JSON.parse(ch.value || '{}');
      c.metrics = c.metrics.filter((x) => x.episode !== ch.amount);
      c.metrics.push({ episode: ch.amount, reportedAt: new Date().toISOString(), views: null, likes: null, comments: null, shares: null, newFollowers: null, followersTotal: null, avgWatchSec: null, avgWatchedPct: null, fullViewsPct: null, note: '', ...m });
      c.metrics.sort((a, b) => a.episode - b.episode);
      return `Kennzahlen für Folge ${ch.amount} gespeichert`;
    }
    case 'angebot': {
      // target = ID, value = JSON {source, content, status, storyCondition, note}
      const v = JSON.parse(ch.value || '{}');
      const i = c.offers.findIndex((o) => o.id === ch.target);
      const next = { id: ch.target, source: '', content: '', status: 'offen' as const, storyCondition: '', note: '', ...(i >= 0 ? c.offers[i] : {}), ...v, episode: i >= 0 ? c.offers[i].episode : ep };
      if (i >= 0) c.offers[i] = next; else c.offers.push(next);
      return `Angebot ${ch.target}: ${next.status}${next.storyCondition ? ` (Story-Bedingung: ${next.storyCondition})` : ''}`;
    }
    case 'ort_freischalten': {
      const l = w.locations.find((x) => x.id === ch.target);
      if (!l) throw new Error(`ort_freischalten: Ort ${ch.target} unbekannt`);
      l.unlocked = true;
      return `Neuer Schauplatz: ${l.name}`;
    }
  }
}

/** Alle Figuren, die in einer Folge zu sehen sind. */
export function castOf(ep: Pick<Episode, 'scenes'>): Set<string> {
  const s = new Set<string>();
  for (const sc of ep.scenes) { for (const c of sc.cast) s.add(c.characterId); for (const l of sc.lines) if (l.speaker !== 'erzaehler') s.add(l.speaker); }
  return s;
}

/** Veröffentlichung: Änderungen anwenden, Figuren sperren, Entscheidungen fortschreiben. */
export function publishEpisode(world: World, ep: Episode): { world: World; log: string[] } {
  const w: World = structuredClone(world);
  const log: string[] = [];
  for (const ch of ep.stateChanges) log.push(applyChange(w, ch, ep.number));
  for (const id of castOf(ep)) {
    const f = w.characters.find((x) => x.id === id);
    if (f) { if (f.firstEpisode === null) f.firstEpisode = ep.number; f.lookLocked = true; }
  }
  if (ep.resolvesDecisionId) {
    const d = w.club.decisions.find((x) => x.id === ep.resolvesDecisionId);
    if (d) { d.status = 'umgesetzt'; d.resolvedInEpisode = ep.number; }
  }
  w.club.decisions.push({ id: `d-${String(ep.number).padStart(3, '0')}`, episode: ep.number, question: ep.decision.question, options: ep.decision.options, status: 'offen', winner: null, votes: {}, note: '', resolvedInEpisode: null });
  w.club.timeline.push({ episode: ep.number, text: `Folge ${ep.number} „${ep.title}“: ${ep.summary}` });
  w.club.lastEpisode = ep.number;
  w.club.nextEpisodeNote = ep.cliffhanger;
  return { world: w, log };
}
