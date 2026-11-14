/**
 * Folge 6 – „Wir werden endlich renoviert!“
 * Vorgabe des Produzenten: Die Angebote aus den Kommentaren werden IN DER SERIENHANDLUNG umgesetzt (fiktiv).
 *   - Vexo_on_MTB 🌲🚲: Lieferung (Handschuhe, Pratzen, Sandsäcke, Logo) + Koffer mit 20.000 € (fiktiv, kein echter Geldeingang)
 *   - Faro_wpt: Renovierung + Ausstattung (neuester Angebotsstand: 4 Boxsäcke, Boxring, 3 Paar Handschuhe, 3 Paar Tennisbälle,
 *     dazu 3 Pratzen aus dem ersten Angebot – nicht doppelt gezählt). Zahlungen pro Kampf bleiben offen, kein Betrag.
 *   - hakir_373 2: neue große Halle + Wing-Tsun-Trainer → nur ANGEBOT / Vorstellung (Traum), nicht eingetroffen
 *   - Örlando: weiterhin möglicher Boxtrainer, Abstimmung d-005 ohne Ergebnis → bleibt offen, nicht eingestellt
 * Reale Lieferungen/Zahlungen gelten außerhalb der Serie NICHT als bestätigt (Angebote bleiben „offen“).
 * Kasse (symbolisch): 392 € + 25 echte Likes (Folge 5) × 2 € = 442 €. Der 20.000-€-Koffer wird getrennt als Story-Fonds geführt.
 * Follower: 43 (keine neue Zahl gemeldet) → Arena bleibt 43/100.
 */
import type { EpisodeInput } from '../lib/types';

type LineIn = EpisodeInput['scenes'][number]['lines'][number];
type L = LineIn & { tts?: string };
const L = (id: string, speaker: string, text: string, extra: Partial<L> = {}): L => ({ id, speaker, text, emotion: 'neutral', action: 'keine', sfx: null, pauseAfter: 0.1, ...extra });
export const TTS: Record<string, string> = {};
const line = (l: L) => { if (l.tts) TTS[l.id] = l.tts; const { tts, ...rest } = l; void tts; return { ...rest, audio: null }; };

const FOLLOWER = 43;
const LIKES_F5 = 25;      // Screenshot Folge 5 (Meldung des Produzenten)
const KASSE_ALT = 392;
const KASSE = KASSE_ALT + LIKES_F5 * 2; // 442 € symbolisch

const G = 'guenther-wallach', P = 'paule-kruse', R = 'rosa-brandt', E = 'emre-yildiz', S = 'wingtsun-sifu';
const ALT = { condition: 28, sandbags: 0, hasNewRing: false, mirrorOk: false };
const NEU = { condition: 100, sandbags: 5, hasNewRing: true, mirrorOk: true };

export const episode = {
  id: 'ep-006',
  number: 6,
  title: 'Wir werden endlich renoviert!',
  status: 'entwurf',
  createdAt: new Date().toISOString(),
  generator: 'Claude im Chat (nach Vorgabe des Produzenten)',
  userIdeas: 'Lieferung von Vexo_on_MTB inkl. 20.000-€-Koffer, Renovierung durch Faro_wpt (Vorher/Nachher), große Halle + Wing-Tsun-Trainer von hakir_373 2, Emre trainiert, Cliffhanger erster Kampf.',
  resolvesDecisionId: null,
  titleCard: 'klein',
  hook: 'Günther stürmt vor die Halle, überall Pakete und ein Koffer: „Leute! Die Lieferung ist da!“',
  summary:
    'Vor dem Boxclub stapeln sich Pakete von Vexo_on_MTB – Handschuhe, Pratzen, Sandsäcke – und ein Koffer. Darin: 20.000 Euro (in der Geschichte). Günther plant schon einen Whirlpool, Paule muss sich erst mal setzen. Dann übernimmt Faro_wpt die Renovierung: Die alte Halle verwandelt sich in einen hellen Boxclub mit neuem Ring, Sandsäcken, Pratzen, Handschuhen und Tennisbällen. Rosa entdeckt den nächsten Kommentar: hakir_373 2 verspricht eine große Halle und einen Wing-Tsun-Trainer. Emre trainiert zum ersten Mal richtig. Günther: „Dann wird es Zeit für den ersten großen Kampf!“ Die Community entscheidet: Emres erster Kampf – oder erst ein Probetraining mit Örlando?',
  scenes: [
    {
      id: 's1', beat: 'einstieg', location: 'strasse', shot: 'totale', music: 'aufbruch', overlay: '',
      direction: 'Hook: Pakete und ein Koffer vor der Depotstraße 7. Günther stürmt rein, Paule schaut raus.',
      props: [
        { type: 'kiste', x: 470, label: 'VEXO_ON_MTB', scale: 1.05 },
        { type: 'kiste', x: 700, label: 'BOXEN', scale: 0.9 },
        { type: 'kiste', x: 585, y: 1395, label: 'PRATZEN', scale: 0.75 },
        { type: 'koffer', x: 580, y: 1640, scale: 0.85 },
      ],
      cast: [
        { characterId: G, position: 'ganz_links', facing: 'rechts', action: 'auftritt' },
        { characterId: P, position: 'ganz_rechts', facing: 'links' },
      ],
      lines: [
        line(L('l1', G, 'Leute! Die Lieferung ist da!', { emotion: 'ueberrascht', action: 'jubeln', sfx: 'tuer' })),
        line(L('l2', P, 'Welche Lieferung denn jetzt schon wieder?', { emotion: 'neutral', action: 'arme_verschraenkt', pauseAfter: 0.12 })),
      ],
    },
    {
      id: 's2', beat: 'vorstellung', location: 'halle', shot: 'halbnah', music: 'komisch', overlay: '',
      direction: 'In der (noch alten) Halle: Kiste von Vexo_on_MTB wird geöffnet – Handschuhe springen raus.',
      setOverrides: ALT,
      comment: { author: 'Vexo_on_MTB 🌲🚲', text: '„Bei mir ist verschickt und einen Koffer mit 20k und das ist alles schon versucht und sollte da sein.“', tag: 'IN DER SERIE: DIE LIEFERUNG IST DA' },
      props: [{ type: 'kiste', x: 560, label: 'VEXO_ON_MTB', openAt: 0.6, scale: 1.1 }],
      cast: [
        { characterId: G, position: 'links', facing: 'rechts' },
        { characterId: R, position: 'ganz_rechts', facing: 'links' },
      ],
      lines: [
        line(L('l3', G, 'Das kommt von Vexo on MTB! Handschuhe, Pratzen, Sandsäcke – alles da!', { emotion: 'froh', action: 'jubeln', sfx: 'whoosh' })),
        line(L('l4', R, 'Und was ist in dem Koffer?', { emotion: 'ueberrascht', action: 'zeigen', pauseAfter: 0.12 })),
      ],
    },
    {
      id: 's3', beat: 'handlung', location: 'halle', shot: 'totale', music: 'spannung', overlay: '20.000 € – IN DER STORY',
      direction: 'Der Koffer klappt auf: Geldbündel, goldenes Leuchten. Paule muss sich setzen.',
      setOverrides: ALT,
      props: [{ type: 'koffer', x: 540, y: 1560, openAt: 0.35, scale: 1.25 }],
      cast: [
        { characterId: G, position: 'ganz_links', facing: 'rechts' },
        { characterId: P, position: 'ganz_rechts', facing: 'links' },
      ],
      lines: [
        line(L('l5', G, 'Was?! Ein Koffer mit zwanzigtausend Euro?!', { emotion: 'ueberrascht', action: 'jubeln', sfx: 'kasse' })),
        line(L('l6', P, 'Ich setz mich mal kurz hin.', { emotion: 'ueberrascht', action: 'seufzen' })),
        line(L('l7', G, 'Neuer Ring! Neue Duschen! Ein Whirlpool!', { emotion: 'froh', action: 'zeigen' })),
        line(L('l8', P, 'Günni. Erst Miete, Strom und Emres Training.', { emotion: 'neutral', action: 'kopfschuetteln', pauseAfter: 0.15 })),
      ],
    },
    {
      id: 's4', beat: 'entwicklung', location: 'halle', shot: 'totale', music: 'aufbruch', overlay: '',
      direction: 'Faro_wpt übernimmt die Renovierung: Farbrollen-Wisch verwandelt die alte Halle in die neue (Wände, Ring, Sandsäcke, Spiegel).',
      setOverrides: NEU,
      renovate: { from: ALT, at: 2.6, dur: 2.6 },
      comment: { author: 'Faro_wpt', text: '4 Boxsäcke · Boxring · Pratzen · Handschuhe · Tennisbälle · Renovierung – „kein problem ❤️“', tag: 'IN DER SERIE: RENOVIERUNG' },
      cast: [
        { characterId: G, position: 'links', facing: 'rechts' },
        { characterId: R, position: 'rechts', facing: 'links' },
      ],
      lines: [
        line(L('l9', G, 'Und Faro_wpt übernimmt sogar unsere Renovierung!', { emotion: 'froh', action: 'faust_heben', sfx: 'whoosh', delayBefore: 0.1 })),
        line(L('l10', R, 'Neue Wände, ein richtiger Ring, Sandsäcke … und Tennisbälle?', { emotion: 'ueberrascht', action: 'zeigen' })),
      ],
    },
    {
      id: 's5', beat: 'entwicklung', location: 'halle', shot: 'halbnah', music: 'komisch', overlay: '',
      direction: 'Die neue Halle: Ausrüstungsregal mit Handschuhen, Pratzen, Tennisbällen. Paules trockener Kommentar.',
      setOverrides: NEU,
      props: [{ type: 'ausruestung', x: 560, scale: 1 }],
      cast: [
        { characterId: P, position: 'ganz_links', facing: 'rechts' },
        { characterId: R, position: 'ganz_rechts', facing: 'links' },
      ],
      lines: [
        line(L('l11', P, 'Für die Reflexe, Rosa. Hab ich nachgelesen.', { emotion: 'stolz', action: 'nicken', pauseAfter: 0.15 })),
      ],
    },
    {
      id: 's6', beat: 'handlung', location: 'buero', shot: 'halbnah', music: 'spannung', overlay: '',
      direction: 'Rosa entdeckt den Kommentar von hakir_373 2.',
      comment: { author: 'hakir_373 2', text: '„Ihr bekommt eine neue große Halle + Wing-Tsun-Trainer.“', tag: 'ANGEBOT – NOCH NICHT DA' },
      cast: [
        { characterId: R, position: 'links', facing: 'rechts' },
        { characterId: G, position: 'mitte', facing: 'links' },
        { characterId: P, position: 'rechts', facing: 'links' },
      ],
      lines: [
        line(L('l12', R, 'Wartet mal! hakir_373 2 verspricht uns eine neue große Halle und einen Wing-Tsun-Trainer!', { emotion: 'ueberrascht', action: 'zeigen' })),
        line(L('l13', G, 'Wing Tsun?! Paule, kannst du das buchstabieren?', { emotion: 'froh', action: 'jubeln' })),
        line(L('l14', P, 'Nein.', { emotion: 'neutral', action: 'achselzucken', pauseAfter: 0.2 })),
      ],
    },
    {
      id: 's7', beat: 'entwicklung', location: 'grosshalle', shot: 'schwenk', music: 'gefuehl', overlay: '',
      direction: 'Vorstellung (Traum): große Halle mit zwei Ringen; der Wing-Tsun-Trainer an der Holzpuppe – ruhig, präzise, KEIN Boxtrainer.',
      fx: 'traum',
      props: [{ type: 'holzpuppe', x: 520, scale: 1.05 }],
      cast: [
        { characterId: S, position: 'ganz_links', facing: 'rechts', action: 'schlagen' },
        { characterId: G, position: 'ganz_rechts', facing: 'links' },
      ],
      lines: [
        line(L('l15', G, 'Stellt euch vor: eine große Halle … und ein Meister, der ganz anders kämpft …', { emotion: 'froh', action: 'keine', pauseAfter: 0.15 })),
      ],
    },
    {
      id: 's8', beat: 'entwicklung', location: 'halle', shot: 'dolly', music: 'training', overlay: 'ERSTES TRAINING',
      direction: 'Zurück in der renovierten Halle: Emre mit neuen Handschuhen am neuen Sandsack.',
      setOverrides: NEU,
      props: [{ type: 'sandsack', x: 420, hitAt: 0.5, color: '#7c2b26' }],
      cast: [
        { characterId: E, position: 'links', facing: 'rechts', action: 'schlagen' },
        { characterId: G, position: 'ganz_rechts', facing: 'links' },
      ],
      lines: [
        line(L('l16', E, 'Wow … ist das wirklich unsere Halle?', { emotion: 'ueberrascht', action: 'keine', sfx: 'sandsack' })),
        line(L('l17', G, 'Emre, ab jetzt wird richtig trainiert!', { emotion: 'entschlossen', action: 'faust_heben' })),
      ],
    },
    {
      id: 's9', beat: 'entwicklung', location: 'ring', shot: 'nah', music: 'training', overlay: '',
      direction: 'Im neuen Ring: Pratzentraining mit Rosa, Beinarbeit.',
      setOverrides: NEU,
      cast: [
        { characterId: E, position: 'links', facing: 'rechts', action: 'schlagen' },
        { characterId: R, position: 'rechts', facing: 'links', action: 'pratzen' },
      ],
      lines: [
        line(L('l18', R, 'Links, rechts, Haken! Und jetzt Beinarbeit!', { emotion: 'entschlossen', action: 'pratzen', sfx: 'schlag', pauseAfter: 0.12 })),
      ],
    },
    {
      id: 's10', beat: 'entwicklung', location: 'halle', shot: 'halbnah', music: 'spannung', overlay: '',
      direction: 'Günther stolz in der neuen Halle. Paule erdet ihn. Emre schaut zum Ring – Cliffhanger.',
      setOverrides: NEU,
      cast: [
        { characterId: E, position: 'ganz_links', facing: 'rechts' },
        { characterId: G, position: 'mitte', facing: 'rechts' },
        { characterId: P, position: 'rechts', facing: 'links' },
      ],
      lines: [
        line(L('l19', G, 'Aus Rostfaust wird endlich ein richtiger Boxclub!', { emotion: 'stolz', action: 'faust_heben' })),
        line(L('l20', P, 'Sieht gut aus. Aber jetzt müssen wir auch zeigen, dass wir kämpfen können.', { emotion: 'neutral', action: 'zeigen' })),
        line(L('l21', G, 'Dann wird es Zeit für den ersten großen Kampf!', { emotion: 'entschlossen', action: 'nicken', sfx: 'trommelwirbel', delayBefore: 0.3, pauseAfter: 0.2 })),
      ],
    },
    {
      id: 's11', beat: 'entscheidung', location: 'eventhalle', shot: 'totale', music: 'aufbruch', overlay: '',
      direction: 'Arena 43/100 (Ziel 50), Kasse 392 → 442 € (25 echte Likes × 2 €, symbolisch), Like-Ziel 100.',
      seats: { from: FOLLOWER, to: FOLLOWER, total: 100, hud: true, goal: 50 },
      kasse: { amount: KASSE, from: KASSE_ALT, perLike: 2, likeGoal: 100 },
      cast: [
        { characterId: G, position: 'links', facing: 'rechts' },
        { characterId: P, position: 'rechts', facing: 'links' },
      ],
      lines: [
        line(L('l22', G, 'Nur noch sieben Follower bis zu den ersten Fünfzig! Und jedes Like bringt zwei Euro in die Kasse.', { emotion: 'froh', action: 'zeigen', sfx: 'publikum' })),
        line(L('l23', P, 'Fünfundzwanzig Likes: fünfzig Euro. Symbolisch.', { emotion: 'neutral', action: 'nicken', pauseAfter: 0.12 })),
      ],
    },
    {
      id: 's12', beat: 'entscheidung', location: 'halle', shot: 'nah', music: 'spannung', overlay: '',
      direction: 'Die eine Hauptfrage an die Community.',
      setOverrides: NEU,
      cast: [
        { characterId: G, position: 'links', facing: 'rechts' },
        { characterId: R, position: 'rechts', facing: 'links' },
      ],
      lines: [
        line(L('l24', G, 'Und jetzt ihr: Wen wollt ihr als Nächstes im Ring sehen?', { emotion: 'entschlossen', action: 'zeigen' })),
        line(L('l25', R, 'A: Emre beim ersten Kampf. B: erst Örlando beim Probetraining.', { emotion: 'entschlossen', action: 'arme_verschraenkt', pauseAfter: 0.3 })),
      ],
    },
  ],
  decision: {
    question: 'Wen wollt ihr als Nächstes im Ring sehen?',
    options: [
      { key: 'A', label: 'Emre beim ersten Kampf', consequenceHint: 'Der erste Kampf wird vorbereitet – Gegner und Termin folgen.', plan: 'kampf:emre-erster-kampf' },
      { key: 'B', label: 'Erst Örlando beim Probetraining', consequenceHint: 'Örlando kommt zum Probetraining in die neue Halle.', plan: 'trainer:oerlando-probetraining' },
    ],
  },
  endCard: {
    type: 'abstimmung',
    headline: 'Wen wollt ihr als Nächstes im Ring sehen?',
    lines: ['Schreib A oder B in die Kommentare!', `🏟️ ${FOLLOWER}/100 Plätze · ❤️ Ziel: 100 Likes`],
    seatsFilled: FOLLOWER,
    seatsTotal: 100,
    seatsGoal: 50,
  },
  cliffhanger: 'Der Boxclub ist renoviert – jetzt muss Rostfaust zeigen, dass er kämpfen kann. Emres erster Kampf oder erst Örlandos Probetraining? Gegner und Termin sind noch offen.',
  stateChanges: [
    { op: 'likes', amount: LIKES_F5, reason: 'Likes Folge 5 laut Screenshot des Produzenten' },
    { op: 'geld', amount: LIKES_F5 * 2, reason: 'Symbolisch: 25 Likes (Folge 5) × 2 € – keine echte Einnahme' },
    { op: 'kennzahlen', amount: 5, value: JSON.stringify({ views: 729, likes: LIKES_F5, followersTotal: FOLLOWER, newFollowers: 0, note: 'Laut Screenshot des Produzenten vor Folge 6: 729 Aufrufe, 25 Likes. Followerstand weiterhin 43. Höchste bisherige Aufrufzahl der Serie: 958 (Folge nicht angegeben). Kommentare, Shares, Wiedergabezeit, Anteil gesehen, vollständige Aufrufe: nicht gemeldet.' }) },
    // Renovierung + Ausstattung (in der Serienhandlung)
    { op: 'zustand_halle', amount: 72, reason: 'Renovierung durch Faro_wpt (Serienhandlung)' },
    { op: 'ausruestung_zustand', target: 'ring', amount: 55, reason: 'neuer Boxring (Serienhandlung)' },
    { op: 'ausruestung', target: 'sandsack', value: 'Sandsack', amount: 4, reason: '4 Boxsäcke von Faro_wpt' },
    { op: 'ausruestung_zustand', target: 'sandsack', amount: 70 },
    { op: 'ausruestung', target: 'handschuhe', value: 'Paar Boxhandschuhe', amount: 13, reason: '10 Paar (Vexo_on_MTB) + 3 Paar (Faro_wpt)' },
    { op: 'ausruestung_zustand', target: 'handschuhe', amount: 60 },
    { op: 'ausruestung', target: 'pratzen', value: 'Pratzen', amount: 3, reason: 'Pratzen (Vexo_on_MTB / Faro_wpt, nicht doppelt gezählt)' },
    { op: 'ausruestung', target: 'tennisbaelle', value: 'Tennisbälle (Reaktionstraining)', amount: 6, reason: '3 Paar Tennisbälle von Faro_wpt' },
    { op: 'ausruestung_zustand', target: 'spiegel', amount: 80, reason: 'Spiegel bei der Renovierung ersetzt' },
    { op: 'ort_freischalten', target: 'grosshalle', reason: 'Als Vorstellung gezeigt – Angebot von hakir_373 2, noch nicht da' },
    // Angebote: real weiterhin OFFEN – nur in der Serie umgesetzt
    { op: 'angebot', target: 'o-001', value: JSON.stringify({ source: 'Kommentare von Faro_wpt (unter Folge 3 und später)', content: 'Neuester Stand: 4 Boxsäcke, 3 Paar Tennisbälle, Boxring, 3 Paar Boxhandschuhe, Renovierung (früher: 5 Sandsäcke, 3 Pratzen, 4 Paar Handschuhe, Renovierung, Zahlungen pro Kampf). Antwort auf „Wow danke dir ❤️“: „kein problem ❤️“', status: 'offen', storyCondition: '', note: 'In der SERIE (fiktiv) in Folge 6 umgesetzt: Renovierung + Ausstattung. Zahlungen pro Kampf: offen, kein Betrag. REAL nicht bestätigt.' }) },
    { op: 'angebot', target: 'o-003', value: JSON.stringify({ source: 'Kommentare von Vexo_on_MTB 🌲🚲', content: 'Sandsäcke, Boxring, Pratzen, 10 Paar Boxhandschuhe, Logo-Design; laut Kommentar „verschickt“ + „Koffer mit 20k“', status: 'offen', note: 'In der SERIE (fiktiv) in Folge 6 geliefert, inkl. Koffer mit 20.000 €. REAL weder Lieferung noch Geld bestätigt.' }) },
    { op: 'angebot', target: 'o-004', value: JSON.stringify({ source: 'Kommentar von hakir_373 2', content: 'Neue große Halle + Wing-Tsun-Trainer', status: 'offen', storyCondition: '', note: 'In der Serie nur als Versprechen/Vorstellung gezeigt (Folge 6). Nicht eingetroffen.' }) },
    // Handlung
    { op: 'handlung', target: 'renovierung', value: 'Folge 6: Faro_wpt renoviert den Boxclub (Serienhandlung). Neue Wände, neuer Ring, 5 Sandsäcke (4 neue + alter), Pratzen, Handschuhe, Tennisbälle, neuer Spiegel.', reason: 'Die Renovierung' },
    { op: 'handlung', target: 'koffer-20k', value: 'Folge 6: Im Paket von Vexo_on_MTB liegt ein Koffer mit 20.000 € (fiktiv). Getrennt von der Like-Kasse geführt („Story-Fonds“). Paule: erst Miete, Strom und Emres Training; Günther träumt vom Whirlpool. Verwendung noch offen.', reason: 'Der Koffer' },
    { op: 'handlung', target: 'grosse-halle', value: 'Folge 6: hakir_373 2 verspricht eine neue große Halle + Wing-Tsun-Trainer („Sifu“). Nur Vorstellung, noch nicht da.', reason: 'Die große Halle' },
    { op: 'handlung', target: 'trainer-oerlando', value: 'Folge 6: Örlando bleibt möglicher BOXtrainer (nicht eingestellt). Neue Abstimmung: Emres erster Kampf oder erst Örlandos Probetraining.' },
    { op: 'handlung', target: 'entwicklung-emre-yildiz', value: 'Folge 6: Erstes richtiges Training in der renovierten Halle – Sandsack, Pratzen mit Rosa, Beinarbeit. „Ist das wirklich unsere Halle?“' },
    { op: 'handlung', target: 'kampfabend', value: 'Folge 6: Günther: „Zeit für den ersten großen Kampf!“ Gegner und Termin weiterhin offen. Arena 43/100, Ziel 50.' },
    { op: 'kapitel', value: 'Akt 2 – Der neue Boxclub' },
  ],
  newCharacterIds: ['wingtsun-sifu'],
  socialCaption: 'Folge 6: Wir werden endlich renoviert! 🥊🎨 Danke Vexo_on_MTB 🌲🚲, Faro_wpt und hakir_373 2 – eure Kommentare haben den Boxclub verändert (in unserer Geschichte). Jetzt ihr: Wen wollt ihr als Nächstes im Ring sehen? A = Emres erster Kampf, B = erst Örlando beim Probetraining. ❤️ Ziel: 100 Likes (1 Like = 2 € symbolisch)',
  hashtags: ['#boxclubrostfaust', '#boxen', '#renovierung', '#animationserie', '#teil6'],
} satisfies EpisodeInput;
