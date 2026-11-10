/**
 * Folge 2 – „Fünf Tage“. Setzt die Community-Entscheidung aus Folge 1 um (A: Emre).
 * Drehbuch nach Vorgabe des Produzenten (Hook wörtlich, Arena-Aktion, Cliffhanger).
 * `tts` = Text für die Sprachausgabe, falls er vom Untertitel abweicht (Aussprache/Regieanweisung).
 */
import type { EpisodeInput } from '../lib/types';

type LineIn = EpisodeInput['scenes'][number]['lines'][number];
type L = LineIn & { tts?: string };
const L = (id: string, speaker: string, text: string, extra: Partial<L> = {}): L => ({ id, speaker, text, emotion: 'neutral', action: 'keine', sfx: null, pauseAfter: 0.1, ...extra });

export const TTS: Record<string, string> = {};
const line = (l: L) => { if (l.tts) TTS[l.id] = l.tts; const { tts, ...rest } = l; void tts; return { ...rest, audio: null }; };

export const episode = {
  id: 'ep-002',
  number: 2,
  title: 'Fünf Tage',
  status: 'entwurf',
  createdAt: new Date().toISOString(),
  generator: 'Claude im Chat (nach Vorgabe des Produzenten)',
  userIdeas: 'Erster Boxer Emre, Kampfabend in 5 Tagen, Arena mit 100 Plätzen, 1 neuer Follower = 1 symbolischer Platz.',
  resolvesDecisionId: 'd-001',
  hook: 'Wir haben unseren ersten Boxer! Aber in nur fünf Tagen wartet bereits sein erster großer Kampf!',
  summary:
    'Die Community hat entschieden: Emre (17) wird offiziell Mitglied Nr. 2, Bruno wird nicht verpflichtet. Rosa sieht Talent, aber keine Technik. Günther bekommt einen Anruf: In fünf Tagen darf Emre bei einem Kampfabend in der Kranstadt Arena (100 Plätze) einen Schaukampf boxen. Die Arena-Miete kostet 200 €, die Kasse sinkt auf 300 €. Bleibt die Halle leer, ist das Geld weg. Günther bittet die Zuschauer um Hilfe: Jeder neue Follower füllt symbolisch einen Platz.',
  scenes: [
    {
      id: 's1', beat: 'einstieg', location: 'halle', shot: 'zoom', music: 'training', overlay: 'UNSER 1. BOXER: EMRE',
      direction: 'Hook: Emre hämmert im Hintergrund auf den Sandsack, Günther jubelt in die Kamera.',
      cast: [
        { characterId: 'guenther-wallach', position: 'links', facing: 'rechts' },
        { characterId: 'emre-yildiz', position: 'rechts', facing: 'links', action: 'schlagen' },
      ],
      lines: [
        line(L('l1', 'guenther-wallach', 'Wir haben unseren ersten Boxer! Aber in nur fünf Tagen wartet bereits sein erster großer Kampf!', { emotion: 'froh', action: 'jubeln', sfx: 'glocke', pauseAfter: 0.12, tts: '[excited] Wir haben unseren ersten Boxer! Aber in nur fünf Tagen wartet bereits sein erster großer Kampf!' })),
      ],
    },
    {
      id: 's2', beat: 'vorstellung', location: 'halle', shot: 'totale', music: 'aufbruch', overlay: 'MITGLIEDER: 2',
      direction: 'Emre kommt offiziell als Mitglied. Günther, Rosa und Paule begrüßen ihn.',
      cast: [
        { characterId: 'emre-yildiz', position: 'ganz_links', facing: 'rechts' },
        { characterId: 'guenther-wallach', position: 'links', facing: 'rechts' },
        { characterId: 'rosa-brandt', position: 'rechts', facing: 'links' },
        { characterId: 'paule-kruse', position: 'ganz_rechts', facing: 'links' },
      ],
      lines: [
        line(L('l2', 'guenther-wallach', 'Emre Yıldız – offiziell Mitglied Nummer zwei!', { emotion: 'stolz', action: 'zeigen', sfx: 'stempel', tts: '[proudly] Emre Yildiz – offiziell Mitglied Nummer zwei!' })),
        line(L('l3', 'paule-kruse', 'Endlich mal jemand, der jünger ist als die Hantelbank.', { emotion: 'froh', action: 'achselzucken', pauseAfter: 0.15, tts: '[dry] Endlich mal jemand, der jünger ist als die Hantelbank.' })),
        line(L('l4', 'rosa-brandt', 'Talent hast du. Technik nicht. Noch nicht.', { emotion: 'neutral', action: 'arme_verschraenkt', tts: '[firmly] Talent hast du. Technik nicht. Noch nicht.' })),
        line(L('l5', 'emre-yildiz', 'Ich zeige euch, dass ich das Zeug zum Boxer habe!', { emotion: 'entschlossen', action: 'faust_heben', pauseAfter: 0.12, tts: '[determined] Ich zeig euch, dass ich das Zeug zum Boxer hab!' })),
      ],
    },
    {
      id: 's3', beat: 'handlung', location: 'buero', shot: 'nah', music: 'spannung', overlay: 'SCHAUKAMPF IN 5 TAGEN',
      direction: 'Das alte Telefon klingelt. Günther hebt ab und traut seinen Ohren nicht.',
      cast: [
        { characterId: 'paule-kruse', position: 'links', facing: 'rechts' },
        { characterId: 'guenther-wallach', position: 'rechts', facing: 'links' },
      ],
      lines: [
        line(L('l6', 'guenther-wallach', 'Ein Boxabend? In fünf Tagen? Und unser Emre darf boxen?!', { emotion: 'ueberrascht', action: 'keine', sfx: 'telefon', pauseAfter: 0.12, tts: '[surprised] Ein Boxabend? In fünf Tagen? Und unser Emre darf boxen?!' })),
        line(L('l7', 'paule-kruse', 'Haken an der Sache: Die Arena hat hundert Plätze. Und uns kennt keiner.', { emotion: 'neutral', action: 'kopfschuetteln' })),
        line(L('l8', 'paule-kruse', 'Zweihundert Euro Miete. Bleibt sie leer, ist das Geld weg.', { emotion: 'traurig', action: 'keine', sfx: 'kasse', pauseAfter: 0.2 })),
      ],
      // Kasse in der Einblendung der nächsten Szene
    },
    {
      id: 's4', beat: 'handlung', location: 'ring', shot: 'dolly', music: 'training', overlay: 'KASSE: 500 € → 300 €',
      direction: 'Im Ring. Rosa will antreten. Emre ist nervös, fasst sich dann ein Herz.',
      cast: [
        { characterId: 'rosa-brandt', position: 'links', facing: 'rechts' },
        { characterId: 'emre-yildiz', position: 'rechts', facing: 'links' },
      ],
      lines: [
        line(L('l9', 'rosa-brandt', 'Leer oder voll. Wir treten an.', { emotion: 'entschlossen', action: 'arme_verschraenkt', sfx: 'pfiff', pauseAfter: 0.2, tts: '[firmly] Leer oder voll. Wir treten an.' })),
        line(L('l10', 'emre-yildiz', 'Ich bin bereit. Ich werde euch nicht enttäuschen!', { emotion: 'entschlossen', action: 'faust_heben', pauseAfter: 0.12, tts: '[determined] Ich bin bereit. Ich werde euch nicht enttäuschen!' })),
      ],
    },
    {
      id: 's5', beat: 'entwicklung', location: 'eventhalle', shot: 'totale', music: 'aufbruch', overlay: '',
      direction: 'Die Kranstadt Arena: 100 rote Klappsitze. Während Günther spricht, füllen sie sich Platz für Platz.',
      seats: { from: 0, to: 100, total: 100, hud: true },
      cast: [
        { characterId: 'guenther-wallach', position: 'links', facing: 'rechts' },
        { characterId: 'paule-kruse', position: 'rechts', facing: 'links' },
      ],
      lines: [
        line(L('l11', 'guenther-wallach', 'Das ist unsere große Chance. Wir brauchen eure Hilfe!', { emotion: 'entschlossen', action: 'zeigen', tts: '[earnest] Das ist unsere große Chance. Wir brauchen eure Hilfe!' })),
        line(L('l12', 'guenther-wallach', 'Wir wollen die Arena in fünf Tagen komplett füllen!', { emotion: 'froh', action: 'jubeln', tts: '[excited] Wir wollen die Arena in fünf Tagen komplett füllen!' })),
        line(L('l13', 'guenther-wallach', 'Jeder neue Follower ist ein Platz. Hundert – und wir sind ausverkauft!', { emotion: 'froh', action: 'zeigen', sfx: 'publikum' })),
        line(L('l14', 'paule-kruse', 'Keine Sorge, sitzen müsst ihr nicht. Folgen reicht.', { emotion: 'froh', action: 'achselzucken', pauseAfter: 0.12, tts: '[dry] Keine Sorge, sitzen müsst ihr nicht. Folgen reicht.' })),
        line(L('l15', 'guenther-wallach', 'Folge dem Boxclub Rostfaust und hilf uns, die Arena vollzubekommen!', { emotion: 'froh', action: 'faust_heben', pauseAfter: 0.15, tts: '[warmly] Folge dem Boxclub Rostfaust und hilf uns, die Arena vollzubekommen!' })),
      ],
    },
    {
      id: 's6', beat: 'entscheidung', location: 'ring', shot: 'nah', music: 'spannung', overlay: '',
      direction: 'Cliffhanger: Rosa sieht Emre lange an.',
      cast: [
        { characterId: 'rosa-brandt', position: 'links', facing: 'rechts' },
        { characterId: 'emre-yildiz', position: 'rechts', facing: 'links' },
      ],
      lines: [
        line(L('l16', 'rosa-brandt', 'In fünf Tagen sehen wir, ob du wirklich bereit bist.', { emotion: 'entschlossen', action: 'keine', sfx: 'trommelwirbel', pauseAfter: 0.2, tts: '[quietly] In fünf Tagen sehen wir, ob du wirklich bereit bist.' })),
      ],
    },
    {
      id: 's7', beat: 'entscheidung', location: 'eventhalle', shot: 'zoom', music: 'spannung', overlay: 'NOCH 5 TAGE BIS ZUM KAMPFABEND!',
      direction: 'Die leere Arena. Günther aus dem Off.',
      seats: { from: 0, to: 0, total: 100, hud: false },
      cast: [],
      lines: [
        line(L('l17', 'guenther-wallach', 'Schaffen wir es, die Arena mit euch zusammen zu füllen?', { emotion: 'neutral', action: 'keine', pauseAfter: 0.35, tts: '[hopeful] Schaffen wir es, die Arena mit euch zusammen zu füllen?' })),
      ],
    },
  ],
  decision: {
    question: 'Schaffen wir es, die Arena zu füllen?',
    options: [
      { key: 'A', label: 'Ja – 100 neue Follower: ausverkauft!', consequenceHint: 'Volle Arena – Emre boxt vor Publikum, der Club wird in Kranstadt bekannt.', plan: 'arena:voll' },
      { key: 'B', label: 'Noch nicht – unter 100 neuen Followern', consequenceHint: 'Halbleere Halle – Emre boxt trotzdem, aber die 200 € Miete schmerzen.', plan: 'arena:teil' },
    ],
  },
  endCard: {
    type: 'arena',
    headline: 'NOCH 5 TAGE BIS ZUM KAMPFABEND',
    lines: ['1 neuer Follower = 1 Platz in der Arena', 'Folge dem Boxclub Rostfaust 🥊'],
    seatsFilled: 0,
    seatsTotal: 100,
  },
  cliffhanger: 'In fünf Tagen boxt Emre seinen ersten Schaukampf – ist er bereit, und wird die Arena voll?',
  stateChanges: [
    { op: 'figur_status', target: 'emre-yildiz', value: 'aktiv', reason: 'Community-Entscheidung Folge 1 (A)' },
    { op: 'mitglieder', amount: 1, reason: 'Emre tritt ein (Mitglied Nr. 2)' },
    { op: 'einnahmen', amount: 15, reason: 'Emres Mitgliedsbeitrag' },
    { op: 'handlung', target: 'entwicklung-emre-yildiz', value: 'Emre ist offizielles Mitglied Nr. 2. Rosa: Talent ja, Technik noch nicht.', reason: 'Der Weg von Emre' },
    { op: 'handlung', target: 'paules-geheimnis', value: 'Bruno wurde von der Community nicht verpflichtet. Was Paule über ihn weiß, bleibt vorerst offen.' },
    { op: 'ort_freischalten', target: 'eventhalle', reason: 'Kampfabend' },
    { op: 'geld', amount: -200, reason: 'Miete Kranstadt Arena (Kampfabend)' },
    { op: 'veranstaltung', amount: 200, value: 'Kampfabend Kranstadt Arena | eventhalle | Schaukampf | emre-yildiz | 100 | 5', reason: 'Community-Aktion: 1 neuer Follower = 1 symbolischer Platz' },
    { op: 'handlung', target: 'kampfabend', value: 'In 5 Tagen: Emres erster Schaukampf in der Kranstadt Arena. 100 Plätze, 200 € Miete bezahlt. Jeder neue Follower füllt symbolisch einen Platz.', reason: 'Der erste Kampfabend' },
    { op: 'kapitel', value: 'Akt 1 – Der erste Kampf' },
  ],
  newCharacterIds: [],
  socialCaption: 'Folge 2: Unser erster Boxer – und in 5 Tagen schon sein erster Kampf! 🥊 Die Arena hat 100 Plätze. Jeder neue Follower füllt symbolisch einen davon. Hilfst du uns, sie vollzubekommen?',
  hashtags: ['#boxclub', '#boxen', '#boxing', '#animation', '#serie', '#fyp', '#rostfaust', '#teil2'],
} satisfies EpisodeInput;
