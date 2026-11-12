/**
 * Folge 4 – „Unser erster Sponsor?!“
 * Grundlage: zwei Zuschauer-Kommentare unter Folge 3 (als UNBESTÄTIGTE Angebote dargestellt).
 * Die Bedingung „erst ein Sieg“ ist eine fiktive Story-Wendung, keine Aussage eines echten Kommentators.
 * Hauptaufforderung: Like + Folgen (1 Like = 2 € symbolisch, 1 Follower = 1 Arena-Platz, Ziel 50).
 * Die Equipment-Abstimmung (Folge 3) läuft weiter und wird NICHT entschieden.
 */
import type { EpisodeInput } from '../lib/types';

type LineIn = EpisodeInput['scenes'][number]['lines'][number];
type L = LineIn & { tts?: string };
const L = (id: string, speaker: string, text: string, extra: Partial<L> = {}): L => ({ id, speaker, text, emotion: 'neutral', action: 'keine', sfx: null, pauseAfter: 0.12, ...extra });
export const TTS: Record<string, string> = {};
const line = (l: L) => { if (l.tts) TTS[l.id] = l.tts; const { tts, ...rest } = l; void tts; return { ...rest, audio: null }; };

const FOLLOWER = 35;   // Meldung des Produzenten vor Folge 4
const KASSE = 300;     // gespeicherter Kassenstand (Likes noch nicht gebucht – keine genaue Zahl)

export const episode = {
  id: 'ep-004',
  number: 4,
  title: 'Unser erster Sponsor?!',
  status: 'entwurf',
  createdAt: new Date().toISOString(),
  generator: 'Claude im Chat (nach Vorgabe des Produzenten)',
  userIdeas: 'Zwei Sponsor-Kommentare unter Folge 3, Paule skeptisch, Traum vom renovierten Club, Wendung: Bedingung, Community-Aufruf Likes/Follower.',
  resolvesDecisionId: null,
  titleCard: 'klein',
  hook: 'Günther liest einen Kommentar: Jemand will Sandsäcke, Pratzen, Handschuhe und die Renovierung bezahlen?!',
  summary:
    'Unter Folge 3 tauchen zwei Angebote in den Kommentaren auf: Ein Zuschauer bietet 5 Sandsäcke, 3 Pratzen, 4 Paar Handschuhe und die Renovierung an, ein anderer stellt 10.000 € plus 1.000 € pro Sieg in Aussicht. Günther träumt schon vom renovierten Club, Paule bleibt skeptisch: Bestätigt ist nichts. Dann kommt (in der Geschichte) eine Nachricht: Der Sponsor hat eine Bedingung – Emre muss erst seinen ersten Kampf gewinnen. Günther ruft die Community auf: Arena 35/100, Ziel 50 Follower bis zum Kampf, jedes Like bringt symbolisch 2 € in die Kasse.',
  scenes: [
    {
      id: 's1', beat: 'einstieg', location: 'halle', shot: 'totale', music: 'aufbruch', overlay: '',
      direction: 'Hook: Günther starrt auf sein Handy, eine Kommentar-Karte springt ins Bild.',
      comment: { author: 'Ein Zuschauer', text: 'Ich spende euch 5 Sandsäcke, 3 Pratzen, 4 Paar Handschuhe – und die Renovierung!', tag: 'KOMMENTAR – NOCH NICHT BESTÄTIGT' },
      cast: [
        { characterId: 'guenther-wallach', position: 'mitte', facing: 'rechts' },
        { characterId: 'paule-kruse', position: 'ganz_rechts', facing: 'links' },
      ],
      lines: [
        line(L('l1', 'guenther-wallach', 'Warte mal … jemand will uns fünf Sandsäcke, Pratzen, Handschuhe und sogar die Renovierung bezahlen?!', { emotion: 'ueberrascht', action: 'jubeln', pauseAfter: 0.2, tts: '[excited] Warte mal … jemand will uns fünf Sandsäcke, Pratzen, Handschuhe und sogar die Renovierung bezahlen?!' })),
      ],
    },
    {
      id: 's2', beat: 'vorstellung', location: 'halle', shot: 'halbnah', music: 'komisch', overlay: '',
      direction: 'Paule bremst, Günther schwärmt schon.',
      cast: [
        { characterId: 'guenther-wallach', position: 'links', facing: 'rechts' },
        { characterId: 'paule-kruse', position: 'rechts', facing: 'links' },
      ],
      lines: [
        line(L('l2', 'paule-kruse', 'Günni, erst mal abwarten. Bis jetzt ist das nur ein Kommentar.', { emotion: 'neutral', action: 'kopfschuetteln', tts: '[dry] Günni, erst mal abwarten. Bis jetzt ist das nur ein Kommentar.' })),
        line(L('l3', 'guenther-wallach', 'Ich seh’s schon vor mir: neue Wände, neues Licht, ein Ring wie im Fernsehen!', { emotion: 'froh', action: 'zeigen', tts: '[dreamy] Ich seh’s schon vor mir: neue Wände, neues Licht, ein Ring wie im Fernsehen!' })),
        line(L('l4', 'paule-kruse', 'Ich seh nur den Haken, an dem gestern noch der Sandsack hing.', { emotion: 'neutral', action: 'zeigen', pauseAfter: 0.2, tts: '[dry] Ich seh nur den Haken, an dem gestern noch der Sandsack hing.' })),
      ],
    },
    {
      id: 's3', beat: 'handlung', location: 'buero', shot: 'halbnah', music: 'spannung', overlay: '',
      direction: 'Rosa kommt mit dem Handy ins Büro: das zweite Angebot.',
      comment: { author: 'Ein anderer Zuschauer', text: '10.000 € für den Verein – und 1.000 € für jeden Sieg!', tag: 'KOMMENTAR – NOCH NICHT BESTÄTIGT' },
      cast: [
        { characterId: 'rosa-brandt', position: 'links', facing: 'rechts' },
        { characterId: 'guenther-wallach', position: 'mitte', facing: 'links' },
        { characterId: 'paule-kruse', position: 'rechts', facing: 'links' },
      ],
      lines: [
        line(L('l5', 'rosa-brandt', 'Moment, hier ist noch eine! Zehntausend Euro – und tausend für jeden Sieg!', { emotion: 'ueberrascht', action: 'zeigen', sfx: 'muenzen' })),
        line(L('l6', 'guenther-wallach', 'Zehntausend! Paule, wie viele Sandsäcke sind das?', { emotion: 'froh', action: 'jubeln', tts: '[excited] Zehntausend! Paule, wie viele Sandsäcke sind das?' })),
        line(L('l7', 'paule-kruse', 'Ungefähr alle. Aber bestätigt ist davon noch gar nichts.', { emotion: 'neutral', action: 'achselzucken', pauseAfter: 0.2, tts: '[dry] Ungefähr alle. Aber bestätigt ist davon noch gar nichts.' })),
      ],
    },
    {
      id: 's4', beat: 'entwicklung', location: 'halle', shot: 'schwenk', music: 'gefuehl', overlay: '',
      direction: 'TRAUM: renovierte Halle, fünf neue Sandsäcke, neuer Ring, Emre trainiert mit Rosa an den Pratzen.',
      fx: 'traum',
      setOverrides: { sandbags: 5, condition: 100, hasNewRing: true, mirrorOk: true },
      cast: [
        { characterId: 'emre-yildiz', position: 'links', facing: 'rechts', action: 'schlagen' },
        { characterId: 'rosa-brandt', position: 'rechts', facing: 'links', action: 'pratzen' },
      ],
      lines: [
        line(L('l8', 'guenther-wallach', 'Stellt euch das vor: neue Sandsäcke, neue Pratzen, frische Farbe …', { emotion: 'froh', action: 'keine', tts: '[dreamy] Stellt euch das vor: neue Sandsäcke, neue Pratzen, frische Farbe …' })),
        line(L('l9', 'emre-yildiz', 'Und endlich Handschuhe ohne Loch!', { emotion: 'froh', action: 'schlagen', sfx: 'schlag', tts: 'Und endlich Handschuhe ohne Loch!' })),
        line(L('l10', 'rosa-brandt', 'Schneller, Emre! Links, rechts, Haken!', { emotion: 'entschlossen', action: 'pratzen', sfx: 'pfiff', pauseAfter: 0.15 })),
      ],
    },
    {
      id: 's5', beat: 'entwicklung', location: 'halle', shot: 'totale', music: 'komisch', overlay: 'ZURÜCK IN DER REALITÄT',
      direction: 'Plattenkratzer – die Halle ist wieder dieselbe alte Halle.',
      cast: [
        { characterId: 'emre-yildiz', position: 'ganz_links', facing: 'rechts' },
        { characterId: 'guenther-wallach', position: 'mitte', facing: 'rechts' },
        { characterId: 'paule-kruse', position: 'rechts', facing: 'links' },
      ],
      lines: [
        line(L('l11', 'paule-kruse', 'Und jetzt zurück in die Realität.', { emotion: 'neutral', action: 'achselzucken', sfx: 'kratzer', pauseAfter: 0.25, tts: '[dry] Und jetzt zurück in die Realität.' })),
      ],
    },
    {
      id: 's6', beat: 'handlung', location: 'buero', shot: 'nah', music: 'spannung', overlay: 'BEDINGUNG?!',
      direction: 'Wendung (fiktiv): Paule liest eine Nachricht des Sponsors.',
      cast: [
        { characterId: 'paule-kruse', position: 'links', facing: 'rechts' },
        { characterId: 'guenther-wallach', position: 'rechts', facing: 'links' },
      ],
      lines: [
        line(L('l12', 'paule-kruse', 'Leute … gerade kam eine Nachricht. Der Sponsor hat eine Bedingung!', { emotion: 'ueberrascht', action: 'zeigen', sfx: 'telefon', tts: '[surprised] Leute … gerade kam eine Nachricht. Der Sponsor hat eine Bedingung!' })),
        line(L('l13', 'guenther-wallach', 'Welche Bedingung?!', { emotion: 'ueberrascht', action: 'keine', tts: '[shocked] Welche Bedingung?!' })),
        line(L('l14', 'paule-kruse', 'Erst wenn Emre seinen ersten Kampf gewinnt.', { emotion: 'neutral', action: 'keine', sfx: 'trommelwirbel', pauseAfter: 0.25, tts: '[seriously] Erst wenn Emre seinen ersten Kampf gewinnt.' })),
      ],
    },
    {
      id: 's7', beat: 'entwicklung', location: 'ring', shot: 'nah', music: 'gefuehl', overlay: 'NOCH 4 TAGE',
      direction: 'Emre schluckt. Rosa macht klar: Jetzt wird trainiert.',
      cast: [
        { characterId: 'emre-yildiz', position: 'links', facing: 'rechts' },
        { characterId: 'rosa-brandt', position: 'rechts', facing: 'links' },
      ],
      lines: [
        line(L('l15', 'emre-yildiz', 'In vier Tagen? Kein Druck, oder?', { emotion: 'verlegen', action: 'achselzucken' })),
        line(L('l16', 'rosa-brandt', 'Druck macht Diamanten. Training. Jetzt!', { emotion: 'entschlossen', action: 'arme_verschraenkt', pauseAfter: 0.2 })),
      ],
    },
    {
      id: 's8', beat: 'entscheidung', location: 'eventhalle', shot: 'totale', music: 'aufbruch', overlay: '',
      direction: 'Community-Aufruf in der Arena: 35 von 100 Plätzen, Ziel 50, Vereinskasse mit Like-Regel.',
      seats: { from: FOLLOWER, to: FOLLOWER, total: 100, hud: true, goal: 50 },
      kasse: { amount: KASSE, perLike: 2 },
      cast: [
        { characterId: 'guenther-wallach', position: 'links', facing: 'rechts' },
        { characterId: 'paule-kruse', position: 'rechts', facing: 'links' },
      ],
      lines: [
        line(L('l17', 'guenther-wallach', 'Und jetzt ihr! Fünfunddreißig Plätze in unserer Arena sind schon besetzt.', { emotion: 'froh', action: 'zeigen', sfx: 'publikum', tts: '[excited] Und jetzt ihr! Fünfunddreißig Plätze in unserer Arena sind schon besetzt.' })),
        line(L('l18', 'guenther-wallach', 'Ziel bis zum Kampf: fünfzig Follower! Und jedes Like bringt zwei Euro in die Kasse.', { emotion: 'entschlossen', action: 'faust_heben', tts: '[determined] Ziel bis zum Kampf: fünfzig Follower! Und jedes Like bringt zwei Euro in die Kasse.' })),
        line(L('l19', 'paule-kruse', 'Symbolisch, Günni.', { emotion: 'neutral', action: 'achselzucken', tts: '[dry] Symbolisch, Günni.' })),
        line(L('l20', 'guenther-wallach', 'Wenn Emre endlich richtig trainieren soll: Like da lassen und folgen!', { emotion: 'froh', action: 'zeigen', pauseAfter: 0.3, tts: '[warmly] Wenn Emre endlich richtig trainieren soll: Like da lassen und folgen!' })),
      ],
    },
  ],
  decision: {
    question: 'Schaffen wir 50 Follower bis zum Kampf?',
    options: [
      { key: 'A', label: 'Ja – 50 Follower bis zum Kampf', consequenceHint: 'Halbe Arena voll – Emre boxt vor echtem Publikum.', plan: 'arena:ziel50' },
      { key: 'B', label: 'Noch nicht – unter 50', consequenceHint: 'Emre boxt trotzdem – aber vor vielen leeren Plätzen.', plan: 'arena:unter50' },
    ],
  },
  endCard: {
    type: 'arena',
    headline: 'ZIEL: 50 FOLLOWER BIS ZUM KAMPF',
    lines: ['➕ 1 neuer Follower = 1 Platz in der Arena', '❤️ 1 Like = 2 € für die Vereinskasse (symbolisch)'],
    seatsFilled: FOLLOWER,
    seatsTotal: 100,
    seatsGoal: 50,
  },
  cliffhanger: 'Der (Story-)Sponsor will erst einen Sieg sehen – und Emre hat nur noch vier Tage. Schafft die Community 50 Follower bis zum Kampf?',
  stateChanges: [
    { op: 'follower', amount: FOLLOWER, reason: 'Meldung des Produzenten vor Folge 4' },
    { op: 'plaetze', amount: FOLLOWER, reason: '35 Follower = 35 von 100 Plätzen' },
    { op: 'angebot', target: 'o-001', value: JSON.stringify({ source: 'Kommentar unter Folge 3 (Zuschauer)', content: '5 Sandsäcke, 3 Pratzen, 4 Paar Boxhandschuhe und Renovierung des Boxclubs', status: 'offen', storyCondition: 'Story-Wendung (fiktiv): erst wenn Emre seinen ersten Kampf gewinnt', note: 'Nicht bestätigt. Keine Ausrüstung eingetroffen.' }) },
    { op: 'angebot', target: 'o-002', value: JSON.stringify({ source: 'Kommentar unter Folge 3 (Zuschauer)', content: '10.000 € plus 1.000 € pro Sieg (in Aussicht gestellt)', status: 'offen', storyCondition: 'Story-Wendung (fiktiv): erst wenn Emre seinen ersten Kampf gewinnt', note: 'Nicht bestätigt. Kein Geld eingegangen.' }) },
    { op: 'handlung', target: 'sponsor-angebote', value: 'Zwei Angebote aus den Kommentaren (Ausrüstung + Renovierung; 10.000 € + 1.000 €/Sieg). Beide unbestätigt. Story-Bedingung: erst ein Sieg von Emre.', reason: 'Unser erster Sponsor?!' },
    { op: 'handlung', target: 'entwicklung-emre-yildiz', value: 'Druck wächst: Der (Story-)Sponsor will erst einen Sieg sehen. Rosa: „Druck macht Diamanten.“' },
    { op: 'handlung', target: 'kampfabend', value: 'Noch 4 Tage. Arena 35/100. Community-Ziel: 50 Follower bis zum Kampf.' },
  ],
  newCharacterIds: [],
  socialCaption: 'Folge 4: Unser erster Sponsor?! 😳🥊 Zwei Angebote aus euren Kommentaren – aber es gibt einen Haken. Hilf uns: Like = 2 € für die Vereinskasse (symbolisch), Follow = ein Platz in unserer Arena. Ziel: 50 bis zum Kampf!',
  hashtags: ['#boxclubrostfaust', '#boxen', '#sponsor', '#animationserie', '#teil4'],
} satisfies EpisodeInput;
