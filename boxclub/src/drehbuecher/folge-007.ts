/**
 * Folge 7 – „Eine Halle für 50.000 Euro?!“
 * Vorgabe des Produzenten: neue Kommentare werden IN DER SERIENHANDLUNG umgesetzt (fiktiv).
 *   - Vexo_on_MTB 🌲🚲: Miete + Ring bezahlt, dreimal so große, fertig eingerichtete Halle mit Gym, Kurier mit goldenem Koffer (50.000 €)
 *   - Faro_wpt: „und morgen sollten die 40 k ankommen“ → nur ANGEKÜNDIGT (nicht eingegangen); dazu der Kommentar „b“ (keine Zusage)
 * Getrennte Konten ab dieser Folge: Vereinskonto (Serien-Grundbestand) · Like-Kasse (symbolisch) · Story-Fonds (fiktive Koffer).
 * Like-Kasse: 46 (F4) + 25 (F5) + 36 (F6) Likes = 107 × 2 € = 214 €. Follower: 50 → Arena 50/100, Ziel 75.
 * Kampf-Strang beginnt: KEIN Gegner, KEIN Termin. Örlando (d-005/d-006 offen) und Sifu bleiben getrennte Figuren.
 */
import type { EpisodeInput } from '../lib/types';

type LineIn = EpisodeInput['scenes'][number]['lines'][number];
type L = LineIn & { tts?: string };
const L = (id: string, speaker: string, text: string, extra: Partial<L> = {}): L => ({ id, speaker, text, emotion: 'neutral', action: 'keine', sfx: null, pauseAfter: 0.1, ...extra });
export const TTS: Record<string, string> = {};
const line = (l: L) => { if (l.tts) TTS[l.id] = l.tts; const { tts, ...rest } = l; void tts; return { ...rest, audio: null }; };

const FOLLOWER_ALT = 43;
const FOLLOWER = 50;
const LIKES_F6 = 36;
const LIKEKASSE_ALT = (46 + 25) * 2; // 142 € (Folge 4 + 5)
const LIKEKASSE = LIKEKASSE_ALT + LIKES_F6 * 2; // 214 €

const G = 'guenther-wallach', P = 'paule-kruse', R = 'rosa-brandt', E = 'emre-yildiz', K = 'kurier';
const NEU = { condition: 100, sandbags: 5, hasNewRing: true, mirrorOk: true };
const VEXO_TEXT = '„Die Miete und den Ring bezahle ich Miete ist gezahlt eine dreifache so große Halle mit gym ist alles eingerichtet Miete zahle ich geht rüber ist schon alles fertig da wartet jemand auf mit einem goldenen Koffer mit 50k“';

export const episode = {
  id: 'ep-007',
  number: 7,
  title: 'Eine Halle für 50.000 Euro?!',
  status: 'entwurf',
  createdAt: new Date().toISOString(),
  generator: 'Claude im Chat (nach Vorgabe des Produzenten)',
  userIdeas: 'Umzug in dreimal so große Halle mit Gym (Vexo_on_MTB: Miete + Ring bezahlt, goldener Koffer 50k), Faro_wpt kündigt 40k für morgen an (+ Kommentar „b“), Emres Kampfvorbereitung beginnt, CTA „KAMPF“.',
  resolvesDecisionId: null,
  titleCard: 'klein',
  hook: 'Günther platzt in die renovierte Halle: „Leute! Wir ziehen um!“ – Paule: „Was?! Schon wieder?“',
  summary:
    'Günther platzt herein: Rostfaust zieht um! Vexo_on_MTB hat geschrieben, dass Miete und Ring bezahlt sind und eine dreimal so große, fertig eingerichtete Halle mit Gym wartet. Paule will das mit eigenen Augen sehen. Die Türen gehen auf: riesige Halle, Ring, Sandsack-Reihe, Laufbänder, Hantelbank. Dort wartet ein wortloser Kurier mit einem goldenen Koffer – 50.000 Euro (in der Geschichte). Dann schreibt Faro_wpt, dass morgen noch 40.000 Euro kommen sollen – und danach nur „b“. Emre steht zum ersten Mal in der neuen Halle. Paule: „Jetzt müssen wir zeigen, was wir können.“ Günther: „Es wird Zeit, Emre auf seinen ersten Kampf vorzubereiten.“ Emre: „Meinen ersten Kampf?“ Die Arena hat 50 von 100 Plätzen, nächstes Ziel 75. Wer bereit ist, schreibt KAMPF.',
  scenes: [
    {
      id: 's1', beat: 'einstieg', location: 'halle', shot: 'totale', music: 'aufbruch', overlay: '',
      direction: 'Hook: Günther platzt in die (renovierte) alte Halle.',
      setOverrides: NEU,
      cast: [
        { characterId: G, position: 'links', facing: 'rechts', action: 'auftritt' },
        { characterId: P, position: 'rechts', facing: 'links' },
      ],
      lines: [
        line(L('l1', G, 'Leute! Wir ziehen um!', { emotion: 'ueberrascht', action: 'jubeln', sfx: 'tuer' })),
        line(L('l2', P, 'Was?! Schon wieder?', { emotion: 'ueberrascht', action: 'arme_verschraenkt' })),
        line(L('l3', G, 'Eine dreimal so große Halle! Und die Miete ist schon bezahlt!', { emotion: 'froh', action: 'zeigen', pauseAfter: 0.12 })),
      ],
    },
    {
      id: 's2', beat: 'vorstellung', location: 'buero', shot: 'halbnah', music: 'spannung', overlay: '',
      direction: 'Vexo_on_MTB-Kommentar wörtlich auf der Karte. Günther liest, Paule zweifelt, Rosa will los.',
      comment: { author: 'Vexo_on_MTB 🌲🚲', text: VEXO_TEXT, tag: 'IN DER SERIE: MIETE + RING BEZAHLT' },
      cast: [
        { characterId: R, position: 'links', facing: 'rechts' },
        { characterId: G, position: 'mitte', facing: 'links' },
        { characterId: P, position: 'rechts', facing: 'links' },
      ],
      lines: [
        line(L('l4', G, 'Vexo on MTB bezahlt Miete und Ring – und gibt uns eine dreimal so große Halle mit Gym?!', { emotion: 'ueberrascht', action: 'jubeln' })),
        line(L('l5', P, 'Ich glaube, wir sollten uns das lieber selbst anschauen.', { emotion: 'neutral', action: 'kopfschuetteln' })),
        line(L('l6', R, 'Dann sollten wir uns diese Halle sofort ansehen!', { emotion: 'entschlossen', action: 'zeigen', pauseAfter: 0.15 })),
      ],
    },
    {
      id: 's3', beat: 'entwicklung', location: 'neuehalle', shot: 'dolly', music: 'gefuehl', overlay: 'DREIMAL SO GROSS!',
      direction: 'Die Türen öffnen sich – Kamerafahrt in die riesige, fertig eingerichtete Halle.',
      fx: 'tueren',
      cast: [
        { characterId: G, position: 'links', facing: 'rechts', action: 'auftritt' },
        { characterId: P, position: 'rechts', facing: 'links', action: 'auftritt' },
      ],
      lines: [
        line(L('l7', G, 'Das ist jetzt wirklich unser neuer Boxclub!', { emotion: 'froh', action: 'jubeln', delayBefore: 1.0 })),
        line(L('l8', P, 'Ich glaube, wir sind gerade eine Nummer größer geworden.', { emotion: 'ueberrascht', action: 'achselzucken', pauseAfter: 0.12 })),
      ],
    },
    {
      id: 's4', beat: 'entwicklung', location: 'neuehalle', shot: 'totale', music: 'aufbruch', overlay: '',
      direction: 'Schwenk durch Gym-Bereich, Ring, Sandsack-Reihe.',
      cast: [
        { characterId: R, position: 'ganz_links', facing: 'rechts' },
      ],
      lines: [
        line(L('l9', R, 'Laufbänder, Hanteln, ein richtiger Ring – Platz für eine ganze Mannschaft!', { emotion: 'froh', action: 'zeigen', pauseAfter: 0.12 })),
      ],
    },
    {
      id: 's5', beat: 'handlung', location: 'neuehalle', shot: 'totale', music: 'spannung', overlay: '',
      direction: 'Ein wortloser Kurier mit goldenem Koffer. Günther fragt, der Koffer klappt auf. Günther ist sprachlos.',
      comment: { author: 'Vexo_on_MTB 🌲🚲', text: '„… da wartet jemand auf mit einem goldenen Koffer mit 50k“', tag: 'IN DER SERIE: 50.000 € IM GOLDENEN KOFFER' },
      props: [{ type: 'goldkoffer', x: 560, y: 1740, openAt: 2.4, scale: 1.3 }],
      cast: [
        { characterId: G, position: 'ganz_links', facing: 'rechts' },
        { characterId: K, position: 'mitte', facing: 'links' },
        { characterId: R, position: 'ganz_rechts', facing: 'links' },
      ],
      lines: [
        line(L('l10', G, 'Moment … ist das etwa der Koffer?', { emotion: 'ueberrascht', action: 'zeigen' })),
        line(L('l11', G, 'Fünfzig … tausend …', { emotion: 'ueberrascht', action: 'keine', sfx: 'kasse', delayBefore: 0.7 })),
        line(L('l12', R, 'Das ist das größte Upgrade unserer Vereinsgeschichte!', { emotion: 'froh', action: 'nicken', pauseAfter: 0.15 })),
      ],
    },
    {
      id: 's6', beat: 'handlung', location: 'buero', shot: 'halbnah', music: 'komisch', overlay: '',
      direction: 'Faro_wpt kündigt 40k für morgen an – klar als ANGEKÜNDIGT markiert.',
      comment: { author: 'Faro_wpt', text: '„und morgen sollten die 40 k ankommen“', tag: 'ANGEKÜNDIGT – NOCH NICHT DA' },
      cast: [
        { characterId: R, position: 'links', facing: 'rechts' },
        { characterId: G, position: 'mitte', facing: 'links' },
        { characterId: P, position: 'rechts', facing: 'links' },
      ],
      lines: [
        line(L('l13', R, 'Wartet mal! Faro_wpt schreibt: Morgen kommen noch mal vierzigtausend!', { emotion: 'ueberrascht', action: 'zeigen', tts: 'Wartet mal! Faro W P T schreibt: Morgen kommen noch mal vierzigtausend!' })),
        line(L('l14', G, 'Noch einmal vierzigtausend?!', { emotion: 'ueberrascht', action: 'jubeln' })),
        line(L('l15', P, 'Was machen wir denn mit dem ganzen Geld?', { emotion: 'neutral', action: 'kopfschuetteln', pauseAfter: 0.12 })),
      ],
    },
    {
      id: 's7', beat: 'handlung', location: 'buero', shot: 'nah', music: 'komisch', overlay: '',
      direction: 'Gag: Faro_wpts Kommentar „b“.',
      comment: { author: 'Faro_wpt', text: 'b', tag: 'KOMMENTAR' },
      cast: [
        { characterId: P, position: 'links', facing: 'rechts' },
        { characterId: G, position: 'rechts', facing: 'links' },
      ],
      lines: [
        line(L('l16', P, 'Und dann schreibt er einfach nur … b.', { emotion: 'neutral', action: 'achselzucken', tts: 'Und dann schreibt er einfach nur … Be.' })),
        line(L('l17', G, 'Hauptsache, die vierzigtausend kommen!', { emotion: 'froh', action: 'faust_heben', pauseAfter: 0.12 })),
      ],
    },
    {
      id: 's8', beat: 'entwicklung', location: 'neuehalle', shot: 'halbnah', music: 'gefuehl', overlay: '',
      direction: 'Emre betritt die neue Halle, schaut zum Ring.',
      cast: [
        { characterId: E, position: 'links', facing: 'rechts', action: 'auftritt' },
        { characterId: G, position: 'rechts', facing: 'links' },
      ],
      lines: [
        line(L('l18', G, 'Emre, ab jetzt hast du alles, was du brauchst.', { emotion: 'stolz', action: 'zeigen', delayBefore: 0.6 })),
        line(L('l19', E, 'Dann kann ich endlich richtig trainieren!', { emotion: 'froh', action: 'faust_heben', pauseAfter: 0.12 })),
      ],
    },
    {
      id: 's9', beat: 'entwicklung', location: 'neuehalle', shot: 'nah', music: 'spannung', overlay: '',
      direction: 'Paule erdet alle. Günther: Kampfvorbereitung. Emre überrascht – Pause.',
      cast: [
        { characterId: E, position: 'ganz_links', facing: 'rechts' },
        { characterId: G, position: 'mitte', facing: 'rechts' },
        { characterId: P, position: 'rechts', facing: 'links' },
      ],
      lines: [
        line(L('l20', P, 'Eine Halle ist schön und gut. Aber jetzt müssen wir zeigen, was wir können.', { emotion: 'neutral', action: 'zeigen' })),
        line(L('l21', G, 'Recht hast du. Zeit, Emre auf seinen ersten Kampf vorzubereiten.', { emotion: 'entschlossen', action: 'nicken' })),
        line(L('l22', E, 'Meinen … ersten Kampf?', { emotion: 'ueberrascht', action: 'keine', delayBefore: 0.7, sfx: 'trommelwirbel', pauseAfter: 0.2 })),
      ],
    },
    {
      id: 's10', beat: 'entscheidung', location: 'eventhalle', shot: 'totale', music: 'aufbruch', overlay: '',
      direction: 'Arena 43 → 50 von 100 (Ziel 75). Like-Kasse 142 → 214 € (36 echte Likes × 2 €, symbolisch).',
      seats: { from: FOLLOWER_ALT, to: FOLLOWER, total: 100, hud: true, goal: 75 },
      kasse: { amount: LIKEKASSE, from: LIKEKASSE_ALT, perLike: 2, likeGoal: 100, label: 'LIKE-KASSE' },
      cast: [
        { characterId: G, position: 'links', facing: 'rechts' },
        { characterId: P, position: 'rechts', facing: 'links' },
      ],
      lines: [
        line(L('l23', G, 'Wir haben die ersten fünfzig geschafft! Jetzt knacken wir die fünfundsiebzig!', { emotion: 'froh', action: 'jubeln', sfx: 'publikum' })),
        line(L('l24', P, 'Sechsunddreißig Likes: zweiundsiebzig Euro. Symbolisch.', { emotion: 'neutral', action: 'nicken', pauseAfter: 0.12 })),
      ],
    },
    {
      id: 's11', beat: 'entscheidung', location: 'neuehalle', shot: 'zoom', music: 'spannung', overlay: 'EMRES ERSTER KAMPF – DIE VORBEREITUNG BEGINNT!',
      direction: 'Dramatischer Blick auf den Ring. Günther in die Kamera. Die eine Aufforderung: KAMPF.',
      cast: [
        { characterId: G, position: 'mitte', facing: 'rechts' },
      ],
      lines: [
        line(L('l25', G, 'Boxclub Rostfaust ist bereit. Und Emre wird bald im Ring stehen!', { emotion: 'entschlossen', action: 'faust_heben', delayBefore: 0.4 })),
        line(L('l26', G, 'Seid ihr bereit für den ersten Kampf von Emre? Schreibt KAMPF in die Kommentare!', { emotion: 'entschlossen', action: 'zeigen', pauseAfter: 0.3 })),
      ],
    },
  ],
  decision: {
    question: 'Seid ihr bereit für Emres ersten Kampf? Schreibt KAMPF!',
    options: [
      { key: 'A', label: 'KAMPF – Emre soll in den Ring', consequenceHint: 'Die Kampfvorbereitung startet: Training, Trainerfrage, Gegnersuche.', plan: 'kampf:vorbereitung' },
      { key: 'B', label: 'Noch nicht – erst mehr Training', consequenceHint: 'Emre trainiert länger, bevor ein Kampf gesucht wird.', plan: 'kampf:spaeter' },
    ],
  },
  endCard: {
    type: 'arena',
    headline: 'SEID IHR BEREIT? SCHREIBT „KAMPF“!',
    lines: ['🥊 Emres erster Kampf – die Vorbereitung beginnt', '➕ 1 Follower = 1 Platz · ❤️ Ziel: 100 Likes'],
    seatsFilled: FOLLOWER,
    seatsTotal: 100,
    seatsGoal: 75,
  },
  cliffhanger: 'Emre soll seinen ersten Kampf bekommen – aber wer trainiert ihn, und gegen wen? Gegner und Termin sind noch offen.',
  stateChanges: [
    // Community + Performance
    { op: 'follower', amount: FOLLOWER, reason: 'Meldung des Produzenten vor Folge 7' },
    { op: 'plaetze', amount: FOLLOWER, reason: '50 Follower = 50 von 100 Plätzen' },
    { op: 'likes', amount: LIKES_F6, reason: 'Likes Folge 6 (Meldung des Produzenten)' },
    { op: 'kennzahlen', amount: 6, value: JSON.stringify({ views: 1858, likes: LIKES_F6, followersTotal: FOLLOWER, newFollowers: FOLLOWER - FOLLOWER_ALT, note: 'Gemeldet vor Folge 7: 1.858 Aufrufe (Rekord, erstmals deutlich > 1.000), 36 Likes, 50 Follower. Kommentare, Shares, Wiedergabezeit, Anteil gesehen, vollständige Aufrufe: nicht gemeldet.' }) },
    // Konten trennen: Like-Einnahmen F4–F5 aus dem Vereinskonto in die Like-Kasse umbuchen, F6 neu buchen
    { op: 'geld', amount: -LIKEKASSE_ALT, reason: 'Umbuchung: symbolische Like-Einnahmen F4–F5 (142 €) ins getrennte Like-Konto' },
    { op: 'konto', target: 'likes', amount: LIKEKASSE, reason: 'Like-Kasse: 46 + 25 + 36 Likes × 2 € (symbolisch)' },
    // Story-Fonds (fiktiv)
    { op: 'konto', target: 'story', value: JSON.stringify({ id: 'k-001', source: 'Vexo_on_MTB 🌲🚲 – Koffer im Paket (Folge 6)', amount: 20000, status: 'eingegangen', note: 'Nur Serienhandlung. Real nicht bestätigt.' }) },
    { op: 'konto', target: 'story', value: JSON.stringify({ id: 'k-002', source: 'Vexo_on_MTB 🌲🚲 – goldener Koffer in der neuen Halle (Folge 7)', amount: 50000, status: 'eingegangen', note: 'Nur Serienhandlung. Real nicht bestätigt.' }) },
    { op: 'konto', target: 'story', value: JSON.stringify({ id: 'k-003', source: 'Faro_wpt – „und morgen sollten die 40 k ankommen“ (Folge 7)', amount: 40000, status: 'angekuendigt', note: 'Nur ANGEKÜNDIGT, noch nicht eingegangen (auch nicht in der Serie).' }) },
    // Halle, Miete, Ring
    { op: 'ort_freischalten', target: 'neuehalle', reason: 'Umzug in die dreimal so große Halle (Serienhandlung)' },
    { op: 'laufende_kosten', amount: -250, reason: 'Miete (Pacht 250 €/Monat) übernimmt Vexo_on_MTB – Serienhandlung' },
    { op: 'ausruestung', target: 'gym', value: 'Gym-Bereich (Laufbänder, Hantelbank, Hantelregal)', amount: 1, reason: 'neue Halle, fertig eingerichtet' },
    // Angebote (real weiterhin offen)
    { op: 'angebot', target: 'o-005', value: JSON.stringify({ source: 'Kommentar von Vexo_on_MTB 🌲🚲 (unter Folge 6)', content: 'Miete + Ring bezahlt, dreifach so große Halle mit Gym (eingerichtet), Person mit goldenem Koffer mit 50k', status: 'offen', note: 'In der SERIE (fiktiv) in Folge 7 umgesetzt. REAL nicht bestätigt.' }) },
    { op: 'angebot', target: 'o-006', value: JSON.stringify({ source: 'Kommentar von Faro_wpt (unter Folge 6)', content: '„und morgen sollten die 40 k ankommen“ (+ Kommentar „b“ ohne Zusage)', status: 'offen', note: 'In der Serie nur angekündigt. REAL nicht bestätigt.' }) },
    // Handlung
    { op: 'handlung', target: 'umzug', value: 'Folge 7: Umzug in eine dreimal so große, fertig eingerichtete Halle mit Gym (von Vexo_on_MTB, Miete + Ring bezahlt). Ein wortloser Kurier übergibt einen goldenen Koffer mit 50.000 € (fiktiv).', reason: 'Der Umzug' },
    { op: 'handlung', target: 'koffer-20k', value: 'Folge 7: Story-Fonds jetzt 70.000 € eingegangen (20k + 50k), 40.000 € von Faro_wpt angekündigt. Paule: „Was machen wir mit dem ganzen Geld?“ – Verwendung offen.' },
    { op: 'handlung', target: 'erster-kampf', value: 'Folge 7: Start des Kampf-Strangs. Günther: „Es wird Zeit, Emre auf seinen ersten Kampf vorzubereiten.“ Emre: „Meinen ersten Kampf?“ Geplanter Aufbau: Training, Trainerfrage (Örlando offen), Technik, Kondition, Sparring, Gegnersuche, Ankündigung, Kampftag. KEIN Gegner, KEIN Termin.', reason: 'Emres erster Kampf' },
    { op: 'handlung', target: 'entwicklung-emre-yildiz', value: 'Folge 7: „Dann kann ich endlich richtig trainieren!“ – erfährt von seinem ersten Kampf.' },
    { op: 'kapitel', value: 'Akt 3 – Emres erster Kampf' },
  ],
  newCharacterIds: ['kurier'],
  socialCaption: 'Folge 7: Eine Halle für 50.000 Euro?! 🥊😱 Vexo_on_MTB 🌲🚲 schenkt uns (in der Story) eine dreimal so große Halle mit Gym – und Faro_wpt kündigt noch 40k an. Aber jetzt geht’s um Emre: Seid ihr bereit für seinen ersten Kampf? Schreibt KAMPF! 🔥',
  hashtags: ['#boxclubrostfaust', '#boxen', '#animationserie', '#boxtraining', '#teil7'],
} satisfies EpisodeInput;
