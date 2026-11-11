/**
 * Folge 3 – „Emre braucht besseres Equipment!“
 * Hook: Emres erster Schlag reißt den alten Sandsack von der Decke.
 * Community-Frage (offen, A–D): Was kaufen wir zuerst?
 * Loop: Am Ende schlägt Emre auf den letzten Sandsack, der bedrohlich quietscht → führt zurück zum Anfang.
 */
import type { EpisodeInput } from '../lib/types';

type LineIn = EpisodeInput['scenes'][number]['lines'][number];
type L = LineIn & { tts?: string };
const L = (id: string, speaker: string, text: string, extra: Partial<L> = {}): L => ({ id, speaker, text, emotion: 'neutral', action: 'keine', sfx: null, pauseAfter: 0.12, ...extra });
export const TTS: Record<string, string> = {};
const line = (l: L) => { if (l.tts) TTS[l.id] = l.tts; const { tts, ...rest } = l; void tts; return { ...rest, audio: null }; };

const BLAU = '#2f3a4f'; // der Sandsack, der abreißt
const ROT = '#7c2b26';  // der letzte verbleibende Sandsack

export const episode = {
  id: 'ep-003',
  number: 3,
  title: 'Emre braucht besseres Equipment!',
  status: 'entwurf',
  createdAt: new Date().toISOString(),
  generator: 'Claude im Chat (nach Vorgabe des Produzenten)',
  userIdeas: 'Emres erstes Training, marode Ausrüstung, lustige Panne mit altem Equipment, Community-Abstimmung A–D über die erste Anschaffung.',
  resolvesDecisionId: 'd-002',
  hook: 'Emres erster Schlag – und der alte Sandsack reißt von der Decke.',
  summary:
    'Emres erstes Training: Schon beim ersten Jab reißt der alte Sandsack von der Decke. Rosas Bestandsaufnahme zeigt: Die Handschuhe haben Löcher, Pratzen und Speedball gibt es gar nicht. Günthers Klebeband-Idee scheitert – das Klebeband hält schon den Ring zusammen. Paule rechnet: 300 € in der Kasse, die Pacht ist bald fällig – es reicht für genau eine Anschaffung. Emre fürchtet, in vier Tagen wegen kaputter Ausrüstung zu verlieren. Die Community soll entscheiden, was zuerst gekauft wird. Zum Schluss schlägt Emre auf den letzten Sandsack – und der quietscht verdächtig.',
  scenes: [
    {
      id: 's1', beat: 'einstieg', location: 'halle', shot: 'totale', music: 'training', overlay: '',
      direction: 'Hook: Emre schlägt auf den blauen Sandsack, die Kette reißt, der Sack kracht zu Boden. Paule steht daneben.',
      setOverrides: { sandbags: 1 },
      props: [{ type: 'sandsack', x: 560, hitAt: 0.25, fallAt: 0.6, color: BLAU }],
      cast: [
        { characterId: 'emre-yildiz', position: 'links', facing: 'rechts', action: 'schlagen' },
        { characterId: 'paule-kruse', position: 'ganz_rechts', facing: 'links' },
      ],
      lines: [
        line(L('l1', 'emre-yildiz', 'Äh … das war nur ein Jab!', { emotion: 'ueberrascht', action: 'achselzucken', delayBefore: 1.15, tts: 'Äh … das war nur ein Jab!' })),
        line(L('l2', 'paule-kruse', 'Der hing da seit neunzehnhundertsiebenundachtzig. Der war einfach müde.', { emotion: 'neutral', action: 'kopfschuetteln', pauseAfter: 0.2, tts: '[dry] Der hing da seit neunzehnhundertsiebenundachtzig. Der war einfach müde.' })),
      ],
    },
    {
      id: 's2', beat: 'vorstellung', location: 'halle', shot: 'totale', music: 'training', overlay: 'AUSRÜSTUNG: MANGELHAFT',
      direction: 'Problem: Rosa macht Bestandsaufnahme vor dem kaputten Sandsack.',
      setOverrides: { sandbags: 1 },
      props: [{ type: 'sandsack', x: 560, fallen: true, color: BLAU }],
      cast: [
        { characterId: 'emre-yildiz', position: 'ganz_links', facing: 'rechts' },
        { characterId: 'rosa-brandt', position: 'links', facing: 'rechts' },
        { characterId: 'paule-kruse', position: 'ganz_rechts', facing: 'links' },
      ],
      lines: [
        line(L('l3', 'rosa-brandt', 'Bestandsaufnahme! Handschuhe: Loch im Daumen.', { emotion: 'entschlossen', action: 'zeigen', tts: '[confident] Bestandsaufnahme! Handschuhe: Loch im Daumen.' })),
        line(L('l4', 'rosa-brandt', 'Pratzen: haben wir keine. Speedball: auch nicht.', { emotion: 'neutral', action: 'kopfschuetteln', tts: '[firmly] Pratzen: haben wir keine. Speedball: auch nicht.' })),
        line(L('l5', 'emre-yildiz', 'Und womit soll ich dann trainieren?', { emotion: 'verlegen', action: 'achselzucken', pauseAfter: 0.2 })),
      ],
    },
    {
      id: 's3', beat: 'entwicklung', location: 'ring', shot: 'halbnah', music: 'komisch', overlay: '',
      direction: 'Günthers Rettungsidee – Paule zerlegt sie trocken.',
      cast: [
        { characterId: 'guenther-wallach', position: 'links', facing: 'rechts' },
        { characterId: 'paule-kruse', position: 'rechts', facing: 'links' },
      ],
      lines: [
        line(L('l6', 'guenther-wallach', 'Kein Problem! Paule, hol das Klebeband!', { emotion: 'froh', action: 'faust_heben', tts: '[excited] Kein Problem! Paule, hol das Klebeband!' })),
        line(L('l7', 'paule-kruse', 'Das Klebeband hält schon den Ring zusammen.', { emotion: 'neutral', action: 'zeigen', pauseAfter: 0.25, tts: '[dry] Das Klebeband hält schon den Ring zusammen.' })),
      ],
    },
    {
      id: 's4', beat: 'handlung', location: 'buero', shot: 'nah', music: 'spannung', overlay: 'KASSE: 300 €',
      direction: 'Kassensturz im Büro.',
      cast: [
        { characterId: 'paule-kruse', position: 'links', facing: 'rechts' },
        { characterId: 'guenther-wallach', position: 'rechts', facing: 'links' },
      ],
      lines: [
        line(L('l8', 'paule-kruse', 'Dreihundert Euro in der Kasse. Und die Pacht kommt bald.', { emotion: 'traurig', action: 'keine', sfx: 'kasse' })),
        line(L('l9', 'guenther-wallach', 'Dann können wir genau eine Sache kaufen.', { emotion: 'traurig', action: 'seufzen', pauseAfter: 0.2, tts: '[sighs] Dann können wir genau eine Sache kaufen.' })),
      ],
    },
    {
      id: 's5', beat: 'handlung', location: 'ring', shot: 'nah', music: 'gefuehl', overlay: 'NOCH 4 TAGE · ARENA 31/100',
      direction: 'Höhepunkt, emotional: Emre hat Angst, wegen kaputter Ausrüstung zu verlieren. Rosa stellt sich hinter ihn.',
      cast: [
        { characterId: 'emre-yildiz', position: 'links', facing: 'rechts' },
        { characterId: 'rosa-brandt', position: 'rechts', facing: 'links' },
      ],
      lines: [
        line(L('l10', 'emre-yildiz', 'In vier Tagen ist mein Kampf. Ich will nicht verlieren, nur weil unser Zeug kaputt ist.', { emotion: 'traurig', action: 'keine', tts: '[worried] In vier Tagen ist mein Kampf. Ich will nicht verlieren, nur weil unser Zeug kaputt ist.' })),
        line(L('l11', 'rosa-brandt', 'Wirst du nicht. Dafür sorgen wir.', { emotion: 'entschlossen', action: 'nicken', pauseAfter: 0.2, tts: '[confident] Wirst du nicht. Dafür sorgen wir.' })),
      ],
    },
    {
      id: 's6', beat: 'entscheidung', location: 'halle', shot: 'totale', music: 'spannung', overlay: 'A BOXSACK · B HANDSCHUHE\nC PRATZEN · D SPEEDBALL',
      direction: 'Community-Aktion: Günther fragt in die Kamera.',
      setOverrides: { sandbags: 1 },
      props: [{ type: 'sandsack', x: 560, fallen: true, color: BLAU }],
      cast: [
        { characterId: 'emre-yildiz', position: 'ganz_links', facing: 'rechts' },
        { characterId: 'rosa-brandt', position: 'links', facing: 'rechts' },
        { characterId: 'guenther-wallach', position: 'mitte', facing: 'rechts' },
        { characterId: 'paule-kruse', position: 'ganz_rechts', facing: 'links' },
      ],
      lines: [
        line(L('l12', 'guenther-wallach', 'Ihr entscheidet, was wir zuerst kaufen: A: Boxsack, B: Handschuhe, C: Pratzen oder D: Speedball?', { emotion: 'froh', action: 'zeigen', tts: '[excited] Ihr entscheidet, was wir zuerst kaufen: A: Boxsack, B: Handschuhe, C: Pratzen oder D: Speedball?' })),
        line(L('l13', 'guenther-wallach', 'Schreibt euren Buchstaben in die Kommentare!', { emotion: 'froh', action: 'faust_heben', pauseAfter: 0.15, tts: '[warmly] Schreibt euren Buchstaben in die Kommentare!' })),
      ],
    },
    {
      id: 's7', beat: 'entscheidung', location: 'halle', shot: 'totale', music: 'spannung', overlay: '',
      direction: 'Cliffhanger & Loop: Emre trainiert am letzten Sandsack weiter. Der quietscht. Paule wird bleich.',
      setOverrides: { sandbags: 0 },
      props: [{ type: 'sandsack', x: 560, hitAt: 0.9, color: ROT }],
      cast: [
        { characterId: 'emre-yildiz', position: 'links', facing: 'rechts', action: 'schlagen' },
        { characterId: 'paule-kruse', position: 'ganz_rechts', facing: 'links' },
      ],
      lines: [
        line(L('l14', 'paule-kruse', 'Emre … nicht den letzten Sandsack!', { emotion: 'ueberrascht', action: 'zeigen', delayBefore: 0.5, pauseAfter: 0.7, tts: '[alarmed] Emre … nicht den letzten Sandsack!' })),
      ],
    },
  ],
  decision: {
    question: 'Was kaufen wir als Erstes?',
    options: [
      { key: 'A', label: 'Neuer Boxsack', consequenceHint: 'Ersetzt den abgerissenen Sack – Emre kann wieder Schlagkraft trainieren.', plan: 'kaufen:boxsack' },
      { key: 'B', label: 'Neue Boxhandschuhe', consequenceHint: 'Kein Loch mehr im Daumen – schützt Emres Hände vor dem Kampf.', plan: 'kaufen:handschuhe' },
      { key: 'C', label: 'Pratzen für das Training', consequenceHint: 'Rosa kann endlich mit Emre an Technik und Kombinationen arbeiten.', plan: 'kaufen:pratzen' },
      { key: 'D', label: 'Speedball-Equipment', consequenceHint: 'Trainiert Timing und Reflexe – Emres größte Stärke.', plan: 'kaufen:speedball' },
    ],
  },
  cliffhanger: 'Emre trainiert am letzten Sandsack weiter – und der quietscht schon verdächtig. Was kauft der Club – und hält der Sack bis zum Kampf?',
  stateChanges: [
    { op: 'ausruestung', target: 'sandsack', amount: -1, value: 'Sandsack', reason: 'Beim ersten Training abgerissen (Folge 3)' },
    { op: 'plaetze', amount: 31, reason: 'Stand laut Produzent: 31 Follower = 31 von 100 Plätzen' },
    { op: 'follower', amount: 31, reason: 'Meldung des Produzenten vor Folge 3' },
    { op: 'countdown', amount: 4, reason: 'Ein Tag ist vergangen' },
    { op: 'handlung', target: 'entwicklung-emre-yildiz', value: 'Erstes Training. Der alte Sandsack reißt ab; Emre hat Angst, wegen kaputter Ausrüstung zu verlieren. Rosa: „Wirst du nicht.“' },
    { op: 'handlung', target: 'ausruestung', value: 'Ausrüstung marode: Handschuhe mit Löchern, keine Pratzen, kein Speedball, ein Sandsack übrig. Community stimmt ab (A Boxsack, B Handschuhe, C Pratzen, D Speedball). Preise stehen noch nicht fest.', reason: 'Neue Ausrüstung' },
    { op: 'handlung', target: 'kampfabend', value: 'Noch 4 Tage. Arena: 31/100 Plätze.' },
  ],
  newCharacterIds: [],
  socialCaption: 'Folge 3: Emres erster Schlag – und unser Sandsack ist Geschichte 😅🥊 Wir können uns genau EINE neue Sache leisten. Was kaufen wir? A Boxsack, B Handschuhe, C Pratzen oder D Speedball – schreib deinen Buchstaben in die Kommentare!',
  hashtags: ['#boxclubrostfaust', '#boxen', '#boxtraining', '#animationserie', '#teil3'],
} satisfies EpisodeInput;
