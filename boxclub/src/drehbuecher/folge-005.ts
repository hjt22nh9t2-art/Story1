/**
 * Folge 5 – „Wir bekommen einen neuen Trainer?!“
 * Grundlage: echte Kommentare unter Folge 4 (Nutzernamen exakt nach Vorgabe des Produzenten):
 *   - Örlando: möchte Trainer werden (7 Jahre Kampferfahrung) → NICHT eingestellt, Community stimmt über Probetraining ab.
 *   - Vexo_on_MTB 🌲🚲: Sandsäcke, guter Boxring, Pratzen, 10 Paar Handschuhe, Logo-Design; schrieb „Bestätigt“.
 *     Übergabe NICHT erfolgt → nichts davon steht in der Halle (nur Traumbild).
 *   - Faro_wpt: Urheber des Angebots o-001 (5 Sandsäcke, 3 Pratzen, 4 Paar Handschuhe, Renovierung),
 *     hat die Bedingungen angepasst (weitere Unterstützung, Zahlungen pro Kampf) → Details offen.
 * Örlando bekommt KEINE Figur / kein Gesicht (keine erfundene Identität) – nur die Kommentar-Karte.
 * Hauptaufforderung: Abstimmung JA/NEIN (Probetraining). Nebenbei: Like-Ziel 100, Follower-Ziel 50.
 * Kasse: 300 € + 46 echte Likes aus Folge 4 × 2 € (symbolisch) = 392 €.
 * Kein Kampfdatum festgelegt; Story-Countdown bleibt bei 4 Tagen (Ausrüstungs-Abstimmung noch offen).
 */
import type { EpisodeInput } from '../lib/types';

type LineIn = EpisodeInput['scenes'][number]['lines'][number];
type L = LineIn & { tts?: string };
const L = (id: string, speaker: string, text: string, extra: Partial<L> = {}): L => ({ id, speaker, text, emotion: 'neutral', action: 'keine', sfx: null, pauseAfter: 0.1, ...extra });
export const TTS: Record<string, string> = {};
const line = (l: L) => { if (l.tts) TTS[l.id] = l.tts; const { tts, ...rest } = l; void tts; return { ...rest, audio: null }; };

const FOLLOWER_ALT = 35;  // Stand nach Folge 4
const FOLLOWER = 43;      // Meldung des Produzenten vor Folge 5
const LIKES_F4 = 46;      // genaue Like-Zahl Folge 4 (Meldung des Produzenten)
const KASSE_ALT = 300;
const KASSE = KASSE_ALT + LIKES_F4 * 2; // 392 € (symbolisch)

const G = 'guenther-wallach', P = 'paule-kruse', R = 'rosa-brandt', E = 'emre-yildiz';

export const episode = {
  id: 'ep-005',
  number: 5,
  title: 'Wir bekommen einen neuen Trainer?!',
  status: 'entwurf',
  createdAt: new Date().toISOString(),
  generator: 'Claude im Chat (nach Vorgabe des Produzenten)',
  userIdeas: 'Örlando will Trainer werden, Vexo_on_MTB bietet Ausrüstung + Logo, Faro_wpt hat sein Angebot angepasst. Emre vorher/nachher. Cliffhanger „Bald!“. Abstimmung: Örlando zum Probetraining?',
  resolvesDecisionId: null,
  titleCard: 'klein',
  hook: 'Günther stürmt in die Halle: „LEUTE! Wir bekommen vielleicht einen neuen Trainer!“ – Paule: „Was hast du jetzt schon wieder angestellt?“',
  summary:
    'Unter Folge 4 meldet sich Örlando: Er hat sieben Jahre Kampferfahrung und würde gern Trainer werden. Günther ist sofort Feuer und Flamme, Paule will erst sehen, was er draufhat. Dann bietet Vexo_on_MTB Sandsäcke, einen Boxring, Pratzen, zehn Paar Handschuhe und ein eigenes Logo an – und Faro_wpt hat sein Angebot sogar noch erweitert. Paule notiert alles unter „noch nicht da“. Emre boxt seit dem Sandsack-Unfall gegen die Luft und träumt vom richtigen Training. Günther: „Wenn das klappt, wird aus Rostfaust ein richtiger Boxclub!“ – Emre: „Und wann soll ich das alles lernen?“ – „Bald!“ In der Arena sind jetzt 43 von 100 Plätzen besetzt, die Kasse steht symbolisch bei 392 €. Die Community entscheidet: Soll Örlando zum Probetraining kommen?',
  scenes: [
    {
      id: 's1', beat: 'einstieg', location: 'halle', shot: 'totale', music: 'aufbruch', overlay: '',
      direction: 'Hook: Günther stürmt mit dem Handy herein, Paule mit Besen.',
      setOverrides: { sandbags: 0 },
      cast: [
        { characterId: G, position: 'links', facing: 'rechts', action: 'auftritt' },
        { characterId: P, position: 'rechts', facing: 'links' },
      ],
      lines: [
        line(L('l1', G, 'LEUTE! Wir bekommen vielleicht einen neuen Trainer!', { emotion: 'ueberrascht', action: 'jubeln', sfx: 'tuer', tts: '[excited] LEUTE! Wir bekommen vielleicht einen neuen Trainer!' })),
        line(L('l2', P, 'Was hast du jetzt schon wieder angestellt?', { emotion: 'neutral', action: 'arme_verschraenkt', pauseAfter: 0.15, tts: '[dry] Was hast du jetzt schon wieder angestellt?' })),
      ],
    },
    {
      id: 's2', beat: 'vorstellung', location: 'halle', shot: 'halbnah', music: 'komisch', overlay: '',
      direction: 'Örlandos Kommentar springt ins Bild. Günther übertreibt sofort.',
      setOverrides: { sandbags: 0 },
      comment: { author: 'Örlando', text: 'Bitte, ich würde gerne euer Trainer werden. Ich habe seit sieben Jahren Kampferfahrung.', tag: 'KOMMENTAR – NOCH NICHT EINGESTELLT' },
      cast: [
        { characterId: G, position: 'links', facing: 'rechts' },
        { characterId: P, position: 'rechts', facing: 'links' },
      ],
      lines: [
        line(L('l3', G, 'Leute! Örlando will unser neuer Trainer werden!', { emotion: 'froh', action: 'zeigen', tts: '[excited] Leute! Örlando will unser neuer Trainer werden!' })),
        line(L('l4', P, 'Sieben Jahre Kampferfahrung? Na, dann wollen wir mal sehen, was er draufhat.', { emotion: 'neutral', action: 'kopfschuetteln', tts: '[dry] Sieben Jahre Kampferfahrung? Na, dann wollen wir mal sehen, was er draufhat.' })),
      ],
    },
    {
      id: 's3', beat: 'handlung', location: 'buero', shot: 'halbnah', music: 'spannung', overlay: '',
      direction: 'Rosa hält das Handy hoch: Vexo_on_MTB. Paule bleibt realistisch.',
      comment: { author: 'Vexo_on_MTB 🌲🚲', text: 'Sandsäcke, ein guter Boxring, Pratzen, 10 Paar Boxhandschuhe + ein eigenes Logo für euch. „Bestätigt“', tag: 'ANGEBOT – NOCH NICHT GELIEFERT' },
      cast: [
        { characterId: R, position: 'links', facing: 'rechts' },
        { characterId: G, position: 'mitte', facing: 'links' },
        { characterId: P, position: 'rechts', facing: 'links' },
      ],
      lines: [
        line(L('l6', R, 'Moment. Vexo on MTB: Sandsäcke, ein Boxring, Pratzen, zehn Paar Handschuhe – und ein Logo!', { emotion: 'ueberrascht', action: 'zeigen', tts: 'Moment. Vexo on Em Te Be: Sandsäcke, ein Boxring, Pratzen, zehn Paar Handschuhe – und ein Logo!' })),
        line(L('l7', G, 'Warte mal! Vexo will uns einen ganzen Boxring spendieren?!', { emotion: 'ueberrascht', action: 'jubeln', tts: '[shocked] Warte mal! Vexo will uns einen ganzen Boxring spendieren?!' })),
        line(L('l8', P, 'Erst mal abwarten, bis das Zeug wirklich hier steht.', { emotion: 'neutral', action: 'achselzucken', pauseAfter: 0.15, tts: '[dry] Erst mal abwarten, bis das Zeug wirklich hier steht.' })),
      ],
    },
    {
      id: 's4', beat: 'entwicklung', location: 'halle', shot: 'schwenk', music: 'gefuehl', overlay: '',
      direction: 'TRAUM (Günthers Vorstellung): neuer Ring, neue Sandsäcke, frische Halle. Nichts davon ist geliefert.',
      fx: 'traum',
      setOverrides: { sandbags: 4, condition: 100, hasNewRing: true, mirrorOk: true },
      cast: [
        { characterId: G, position: 'mitte', facing: 'rechts' },
      ],
      lines: [
        line(L('l9', G, 'Ein richtiger Ring … unser eigenes Logo …', { emotion: 'froh', action: 'zeigen', pauseAfter: 0.15, tts: '[dreamy] Ein richtiger Ring … unser eigenes Logo …' })),
      ],
    },
    {
      id: 's5', beat: 'handlung', location: 'buero', shot: 'nah', music: 'komisch', overlay: '',
      direction: 'Zurück im Büro: Rosa entdeckt das angepasste Angebot von Faro_wpt. Karte = Zusammenfassung, kein Wortlaut.',
      comment: { author: 'Faro_wpt', text: '5 Sandsäcke · 3 Pratzen · 4 Paar Handschuhe · Renovierung – jetzt angepasst: + Zahlungen pro Kampf', tag: 'ZUSAMMENFASSUNG – NOCH NICHT GEKLÄRT' },
      cast: [
        { characterId: R, position: 'links', facing: 'rechts' },
        { characterId: G, position: 'mitte', facing: 'links' },
        { characterId: P, position: 'rechts', facing: 'links' },
      ],
      lines: [
        line(L('l10', R, 'Leute, Faro_wpt hat auch noch ein Angebot – jetzt mit Zahlungen pro Kampf!', { emotion: 'ueberrascht', action: 'zeigen', sfx: 'whoosh', tts: 'Leute, Faro W P T hat auch noch ein Angebot – jetzt mit Zahlungen pro Kampf!' })),
        line(L('l11', G, 'Was ist denn hier los? Erst ein Trainer, jetzt die ganze Ausrüstung!', { emotion: 'froh', action: 'jubeln', tts: '[excited] Was ist denn hier los? Erst ein Trainer, jetzt die ganze Ausrüstung!' })),
        line(L('l12', P, 'Ich schreib’s auf. Unter: noch nicht da.', { emotion: 'neutral', action: 'nicken', sfx: 'stempel', pauseAfter: 0.2, tts: '[dry] Ich schreibs auf. Unter: noch nicht da.' })),
      ],
    },
    {
      id: 's6', beat: 'entwicklung', location: 'halle', shot: 'nah', music: 'training', overlay: 'DIE REALITÄT',
      direction: 'Emre boxt gegen die Luft – am leeren Haken, seit der Sandsack in Folge 3 abgerissen ist.',
      setOverrides: { sandbags: 0 },
      cast: [
        { characterId: E, position: 'links', facing: 'rechts', action: 'schlagen' },
        { characterId: G, position: 'rechts', facing: 'links' },
      ],
      lines: [
        line(L('l13', G, 'Emre! Vielleicht kriegst du einen echten Trainer!', { emotion: 'froh', action: 'zeigen', tts: '[excited] Emre! Vielleicht kriegst du einen echten Trainer!' })),
        line(L('l14', E, 'Echt? Ich box seit dem Sandsack-Unfall gegen die Luft!', { emotion: 'ueberrascht', action: 'schlagen', sfx: 'whoosh', pauseAfter: 0.15, tts: 'Echt? Ich box seit dem Sandsack-Unfall gegen die Luft!' })),
      ],
    },
    {
      id: 's7', beat: 'entwicklung', location: 'ring', shot: 'dolly', music: 'training', overlay: '',
      direction: 'Vorstellung (Traum): Emre im neuen Ring an Rosas Pratzen, echte Kombinationen.',
      fx: 'traum',
      setOverrides: { condition: 100, hasNewRing: true, mirrorOk: true },
      cast: [
        { characterId: E, position: 'links', facing: 'rechts', action: 'schlagen' },
        { characterId: R, position: 'rechts', facing: 'links', action: 'pratzen' },
      ],
      lines: [
        line(L('l15', R, 'Kinn runter, Hände hoch! Eins, zwei, Haken!', { emotion: 'entschlossen', action: 'pratzen', sfx: 'schlag' })),
      ],
    },
    {
      id: 's8', beat: 'entwicklung', location: 'halle', shot: 'halbnah', music: 'spannung', overlay: '',
      direction: 'Zurück in der echten Halle. Günthers großer Satz – Emres Frage – Günthers Grinsen.',
      setOverrides: { sandbags: 0 },
      cast: [
        { characterId: E, position: 'ganz_links', facing: 'rechts' },
        { characterId: G, position: 'mitte', facing: 'rechts' },
        { characterId: P, position: 'rechts', facing: 'links' },
      ],
      lines: [
        line(L('l17', G, 'Wenn das alles klappt, wird aus Rostfaust endlich ein richtiger Boxclub!', { emotion: 'stolz', action: 'faust_heben', tts: '[proudly] Wenn das alles klappt, wird aus Rostfaust endlich ein richtiger Boxclub!' })),
        line(L('l18', P, 'Dann brauchen wir nur noch einen Trainer, der Emre fit für seinen ersten Kampf macht.', { emotion: 'neutral', action: 'zeigen', tts: '[dry] Dann brauchen wir nur noch einen Trainer, der Emre fit für seinen ersten Kampf macht.' })),
        line(L('l19', E, 'Moment mal … und wann soll ich das alles lernen?', { emotion: 'verlegen', action: 'achselzucken', delayBefore: 0.1, tts: 'Moment mal … und wann soll ich das alles lernen?' })),
        line(L('l20', G, 'Bald!', { emotion: 'froh', action: 'nicken', delayBefore: 0.5, sfx: 'trommelwirbel', pauseAfter: 0.25, tts: '[mischievously] Bald!' })),
      ],
    },
    {
      id: 's9', beat: 'entscheidung', location: 'eventhalle', shot: 'totale', music: 'aufbruch', overlay: '',
      direction: 'Arena: 35 → 43 von 100 Plätzen (Ziel 50). Kasse zählt von 300 auf 392 € (46 echte Likes × 2 €, symbolisch). Like-Ziel 100.',
      seats: { from: FOLLOWER_ALT, to: FOLLOWER, total: 100, hud: true, goal: 50 },
      kasse: { amount: KASSE, from: KASSE_ALT, perLike: 2, likeGoal: 100 },
      cast: [
        { characterId: G, position: 'links', facing: 'rechts' },
        { characterId: P, position: 'rechts', facing: 'links' },
      ],
      lines: [
        line(L('l21', G, 'Dreiundvierzig von hundert Plätzen – nur noch sieben bis fünfzig!', { emotion: 'froh', action: 'zeigen', sfx: 'publikum', tts: '[excited] Dreiundvierzig von hundert Plätzen – nur noch sieben bis fünfzig!' })),
        line(L('l22', P, 'Und eure sechsundvierzig Likes: zweiundneunzig Euro. Symbolisch, Günni. Nächstes Ziel: hundert!', { emotion: 'neutral', action: 'nicken', sfx: 'kasse', tts: '[dry] Und eure sechsundvierzig Likes: zweiundneunzig Euro. Symbolisch, Günni. Nächstes Ziel: hundert!' })),
      ],
    },
    {
      id: 's10', beat: 'entscheidung', location: 'halle', shot: 'nah', music: 'spannung', overlay: '',
      direction: 'Die eigentliche Frage an die Community. Örlando erneut als Karte, damit klar ist, um wen es geht.',
      setOverrides: { sandbags: 0 },
      comment: { author: 'Örlando', text: 'Bitte, ich würde gerne euer Trainer werden. Ich habe seit sieben Jahren Kampferfahrung.', tag: 'IHR ENTSCHEIDET: PROBETRAINING?' },
      cast: [
        { characterId: G, position: 'links', facing: 'rechts' },
        { characterId: R, position: 'rechts', facing: 'links' },
      ],
      lines: [
        line(L('l24', G, 'Sollen wir Örlando zum Probetraining einladen? Schreibt JA oder NEIN!', { emotion: 'entschlossen', action: 'zeigen', tts: '[determined] Sollen wir Örlando zum Probetraining einladen? Schreibt JA oder NEIN!' })),
        line(L('l25', R, 'Und falls ja, Örlando: Bring Handschuhe mit.', { emotion: 'entschlossen', action: 'arme_verschraenkt', pauseAfter: 0.3 })),
      ],
    },
  ],
  decision: {
    question: 'Sollen wir Örlando zum Probetraining einladen?',
    options: [
      { key: 'A', label: 'JA – Probetraining!', consequenceHint: 'Örlando kommt zum Probetraining in die Halle.', plan: 'trainer:probetraining' },
      { key: 'B', label: 'NEIN – noch nicht', consequenceHint: 'Rosa bleibt erst mal allein an den Pratzen.', plan: 'trainer:kein_probetraining' },
    ],
  },
  endCard: {
    type: 'abstimmung',
    headline: 'Örlando zum Probetraining?',
    lines: ['Schreib JA oder NEIN in die Kommentare!', `🏟️ ${FOLLOWER}/100 Plätze · ❤️ Ziel: 100 Likes`],
    seatsFilled: FOLLOWER,
    seatsTotal: 100,
    seatsGoal: 50,
  },
  cliffhanger: 'Wann soll Emre das alles lernen? „Bald!“ – Der erste Kampf rückt näher, und die Community entscheidet, ob Örlando zum Probetraining kommt.',
  stateChanges: [
    { op: 'follower', amount: FOLLOWER, reason: 'Meldung des Produzenten vor Folge 5' },
    { op: 'plaetze', amount: FOLLOWER, reason: '43 Follower = 43 von 100 Plätzen' },
    { op: 'likes', amount: LIKES_F4, reason: 'Genaue Like-Zahl Folge 4 (Meldung des Produzenten)' },
    { op: 'geld', amount: LIKES_F4 * 2, reason: 'Symbolisch: 46 Likes (Folge 4) × 2 € – keine echte Einnahme' },
    { op: 'kennzahlen', amount: 4, value: JSON.stringify({ views: 842, likes: LIKES_F4, newFollowers: FOLLOWER - FOLLOWER_ALT, followersTotal: FOLLOWER, note: 'Gemeldet vor Folge 5. Höchste bisherige Aufrufzahl einer Folge: 958 (Folge nicht angegeben). Kommentare, Shares, Wiedergabezeit, Anteil gesehen, vollständige Aufrufe: nicht gemeldet.' }) },
    { op: 'angebot', target: 'o-001', value: JSON.stringify({ source: 'Kommentar von Faro_wpt (unter Folge 3)', note: 'Nicht bestätigt. Faro_wpt hat die Bedingungen in den Kommentaren angepasst (weitere Unterstützung, Zahlungen pro Kampf erwähnt) – Details offen, keine Vereinbarung, nichts eingegangen.' }) },
    { op: 'angebot', target: 'o-003', value: JSON.stringify({ source: 'Kommentar von Vexo_on_MTB 🌲🚲 (unter Folge 4)', content: 'Sandsäcke, ein guter Boxring, Pratzen, 10 Paar Boxhandschuhe, eigenes Logo-Design für den Boxclub', status: 'offen', storyCondition: '', note: 'Vexo_on_MTB schrieb „Bestätigt“. Übergabe/Lieferung NICHT bestätigt – nichts davon ist in der Halle.' }) },
    { op: 'handlung', target: 'trainer-oerlando', value: 'Örlando (TikTok-Kommentar unter Folge 4) möchte Trainer werden, 7 Jahre Kampferfahrung. NICHT eingestellt. Community-Abstimmung: Probetraining JA/NEIN.', reason: 'Wir bekommen einen neuen Trainer?!' },
    { op: 'handlung', target: 'sponsor-angebote', value: 'Drei offene Angebote: Faro_wpt (o-001, angepasst), unbekannter Zuschauer 10.000 € + 1.000 €/Sieg (o-002), Vexo_on_MTB 🌲🚲 (o-003, „Bestätigt“ geschrieben, nicht geliefert). Paule führt die Liste „noch nicht da“.' },
    { op: 'handlung', target: 'entwicklung-emre-yildiz', value: 'Boxt seit dem Sandsack-Unfall gegen die Luft. Träumt von richtigem Training. Fragt: „Wann soll ich das alles lernen?“ – Günther: „Bald!“' },
    { op: 'handlung', target: 'kampfabend', value: 'Kein neues Datum. Story-Countdown bleibt bei 4 Tagen, bis die Ausrüstungs-Abstimmung abgeschlossen ist. Arena 43/100, Ziel 50.' },
  ],
  newCharacterIds: [],
  socialCaption: 'Folge 5: Wir bekommen einen neuen Trainer?! 🥊😳 Örlando will Trainer werden, Vexo_on_MTB und Faro_wpt wollen helfen – und Emre boxt immer noch gegen die Luft. Ihr entscheidet: Soll Örlando zum Probetraining kommen? JA oder NEIN in die Kommentare! ❤️ Ziel: 100 Likes (1 Like = 2 € symbolisch für die Vereinskasse)',
  hashtags: ['#boxclubrostfaust', '#boxen', '#animationserie', '#community', '#teil5'],
} satisfies EpisodeInput;
