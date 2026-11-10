/** Folge 1 – „Null Boxer“. Handgeschriebenes Pilot-Drehbuch. */
import type { EpisodeInput as Episode } from '../lib/types';

const L = (id: string, speaker: string, text: string, extra: Record<string, unknown> = {}) => ({
  id, speaker, text, emotion: 'neutral' as const, action: 'keine' as const, sfx: null, pauseAfter: 0.15, audio: null, ...extra,
});

export const episode1: Episode = {
  id: 'ep-001',
  number: 1,
  title: 'Null Boxer',
  status: 'entwurf',
  createdAt: new Date('2026-11-09T12:00:00Z').toISOString(),
  publishedAt: null,
  generator: 'handgeschrieben (Pilot)',
  userIdeas: '',
  resolvesDecisionId: null,
  hook: 'Wir gründen einen Boxverein. Kleines Problem: Wir haben einen Ring, eine Trainerin – und genau null Boxer.',
  summary:
    'Günther Wallach eröffnet den Boxclub Rostfaust in der alten Depothalle seines Vaters neu. Hausmeister Paule ist das einzige Mitglied, Trainerin Rosa Brandt will nur echte Kämpfer trainieren, und in der Kasse liegen 500 Euro bei 250 Euro Pacht im Monat. Zwei Kandidaten melden sich: der 17-jährige Anfänger Emre und Ex-Profi Bruno „Der Bär“ Kessler – über den Paule offenbar mehr weiß.',
  scenes: [
    {
      id: 's1', beat: 'einstieg', location: 'strasse', shot: 'zoom', music: 'aufbruch', overlay: '',
      direction: 'Günther vor der Halle, breitet stolz die Arme aus. Bei „null Boxer“ friert das Bild kurz ein.',
      cast: [{ characterId: 'guenther-wallach', position: 'mitte', facing: 'rechts' }],
      lines: [
        L('l1', 'guenther-wallach', 'Wir gründen einen Boxverein!', { emotion: 'froh', action: 'jubeln', sfx: 'glocke', pauseAfter: 0.3 }),
        L('l2', 'guenther-wallach', 'Kleines Problem: ein Ring, eine Trainerin … und genau null Boxer.', { emotion: 'verlegen', action: 'achselzucken', sfx: 'kratzer', pauseAfter: 0.25 }),
      ],
    },
    {
      id: 's2', beat: 'vorstellung', location: 'halle', shot: 'schwenk', music: 'aufbruch', overlay: 'MITGLIEDER: 1',
      direction: 'Schwenk durch die Halle: Risse, Ring, leckender Sandsack. Paule fegt.',
      cast: [
        { characterId: 'guenther-wallach', position: 'links', facing: 'rechts' },
        { characterId: 'paule-kruse', position: 'rechts', facing: 'links' },
      ],
      lines: [
        L('l3', 'guenther-wallach', 'Der Boxclub Rostfaust. Hier hat schon mein Vater geboxt!', { emotion: 'stolz', action: 'zeigen', sfx: 'whoosh' }),
        L('l4', 'paule-kruse', 'Und seitdem hat hier keiner mehr geputzt.', { emotion: 'neutral', action: 'kopfschuetteln', pauseAfter: 0.3 }),
        L('l5', 'guenther-wallach', 'Paule. Hausmeister, Kassenwart – und einziges Mitglied.', { emotion: 'froh', action: 'zeigen' }),
      ],
    },
    {
      id: 's3', beat: 'handlung', location: 'ring', shot: 'dolly', music: 'training', overlay: '',
      direction: 'Rosa im Ring an der Ecke, Arme verschränkt. Günther vor den Seilen.',
      cast: [
        { characterId: 'guenther-wallach', position: 'links', facing: 'rechts' },
        { characterId: 'rosa-brandt', position: 'rechts', facing: 'links' },
      ],
      lines: [
        L('l6', 'guenther-wallach', 'Und das ist Rosa. Bronze bei der EM!', { emotion: 'stolz', action: 'zeigen', sfx: 'sandsack' }),
        L('l7', 'rosa-brandt', 'Ich trainiere keine Hobbyboxer. Ich trainiere Kämpfer.', { emotion: 'entschlossen', action: 'arme_verschraenkt', sfx: 'pfiff', pauseAfter: 0.3 }),
        L('l8', 'guenther-wallach', 'Wir haben nur … noch keine.', { emotion: 'verlegen', action: 'achselzucken' }),
        L('l9', 'rosa-brandt', 'Dann such welche.', { emotion: 'neutral', action: 'seufzen', pauseAfter: 0.25 }),
      ],
    },
    {
      id: 's4', beat: 'entwicklung', location: 'buero', shot: 'nah', music: 'komisch', overlay: 'KASSE: 500 €  ·  PACHT: 250 €/MONAT',
      direction: 'Paule mit kariertem Heft am Schreibtisch voller Rechnungen.',
      cast: [
        { characterId: 'paule-kruse', position: 'links', facing: 'rechts' },
        { characterId: 'guenther-wallach', position: 'rechts', facing: 'links' },
      ],
      lines: [
        L('l10', 'paule-kruse', 'Fünfhundert Euro in der Kasse. Pacht: zweihundertfünfzig. Pro Monat.', { emotion: 'neutral', action: 'keine', sfx: 'kasse', pauseAfter: 0.25 }),
        L('l11', 'guenther-wallach', 'Dann brauchen wir schnell einen Boxer. Dat wird ganz groß!', { emotion: 'entschlossen', action: 'faust_heben' }),
        L('l12', 'paule-kruse', 'Hast du über den Sandsack auch gesagt.', { emotion: 'neutral', action: 'achselzucken', sfx: 'sandsack', pauseAfter: 0.25 }),
      ],
    },
    {
      id: 's5', beat: 'entscheidung', location: 'halle', shot: 'totale', music: 'spannung', overlay: 'A: EMRE  ·  B: BRUNO',
      direction: 'Rosa zeigt auf die zwei Kandidaten am Hallentor. Paule murmelt. Günther fragt in die Kamera.',
      cast: [
        { characterId: 'emre-yildiz', position: 'ganz_links', facing: 'rechts' },
        { characterId: 'rosa-brandt', position: 'links', facing: 'rechts' },
        { characterId: 'guenther-wallach', position: 'mitte', facing: 'rechts' },
        { characterId: 'paule-kruse', position: 'rechts', facing: 'links' },
        { characterId: 'bruno-kessler', position: 'ganz_rechts', facing: 'links' },
      ],
      lines: [
        L('l13', 'rosa-brandt', 'Zwei Bewerber. Emre, siebzehn. Schnell, frech, null Erfahrung.', { emotion: 'neutral', action: 'zeigen', sfx: 'tuer' }),
        L('l14', 'rosa-brandt', 'Bruno, sechsunddreißig. Ex-Profi. Harte Fäuste, kaputtes Knie.', { emotion: 'neutral', action: 'zeigen' }),
        L('l15', 'paule-kruse', 'Den Bruno kenn ich. Das gibt Ärger.', { emotion: 'traurig', action: 'kopfschuetteln', sfx: 'trommelwirbel', pauseAfter: 0.3 }),
        L('l16', 'guenther-wallach', 'Wen holen wir zuerst? Den jungen Anfänger – oder den Ex-Profi? Ab in die Kommentare!', { emotion: 'froh', action: 'zeigen', pauseAfter: 0.9 }),
      ],
    },
  ],
  decision: {
    question: 'Wen sollen wir als Erstes verpflichten?',
    options: [
      { key: 'A', label: 'Emre (17) – den jungen Anfänger', consequenceHint: 'Billig, hungrig, braucht Jahre. Rosa muss bei null anfangen.', plan: 'verpflichten:emre-yildiz' },
      { key: 'B', label: 'Bruno „Der Bär“ (36) – den erfahrenen Ex-Profi', consequenceHint: 'Sofort kampfbereit, bringt Aufmerksamkeit – aber Knie und Vergangenheit sind ein Risiko.', plan: 'verpflichten:bruno-kessler' },
    ],
  },
  cliffhanger: 'Paule kennt Bruno – und offenbar nichts Gutes.',
  stateChanges: [
    { op: 'handlung', amount: 0, target: 'der-traum', value: 'Günther eröffnet den Club neu. Ziel: wieder größter Boxverein Kranstadts.', reason: '' },
    { op: 'handlung', amount: 0, target: 'die-pacht', value: '500 € in der Kasse, 250 € Pacht pro Monat – das Geld reicht höchstens zwei Monate.', reason: '' },
    { op: 'handlung', amount: 0, target: 'paules-geheimnis', value: 'Paule kennt Bruno Kessler von früher und sagt: „Das gibt Ärger.“', reason: 'Paules Geheimnis um Bruno' },
  ],
  newCharacterIds: [],
  socialCaption: 'Folge 1: Wir haben einen Boxclub. Und null Boxer. 🥊 Wen sollen wir verpflichten – A: Emre oder B: Bruno? Schreib A oder B in die Kommentare!',
  hashtags: ['#boxclub', '#boxen', '#serie', '#animation', '#rostfaust', '#teil1'],
  video: null,
};
