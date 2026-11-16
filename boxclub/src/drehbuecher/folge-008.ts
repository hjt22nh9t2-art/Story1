/**
 * Folge 8 – „Emre bekommt seinen ersten Sparringspartner!“
 * Kommentare (Vorgabe des Produzenten):
 *   - J’: „ich bin emres sparing partner“ → J’ wird Emres Sparringspartner (KEIN Wettkampfgegner)
 *   - Community-Kommentar (kein Nutzername sichtbar): „Jetzt kommt ein Profi und bringt Emre das Boxen bei“
 *     → fiktiver Boxtrainer Marek Wolski (neu, fest; nicht Sifu, nicht Örlando)
 *   - Community-Kommentar (kein Nutzername sichtbar): Kooperation mit „IRON“ → fiktive Marke, nur ANGEKÜNDIGT
 * Zahlen: 52 Follower (Arena 52/100, Ziel 75). Likes F7: 46 → +92 € Like-Kasse (214 → 306 €).
 * Kein Gegner, kein Termin. Abstimmung: Schlagkraft / Schnelligkeit / Ausdauer.
 */
import type { EpisodeInput } from '../lib/types';

type LineIn = EpisodeInput['scenes'][number]['lines'][number];
type L = LineIn & { tts?: string };
const L = (id: string, speaker: string, text: string, extra: Partial<L> = {}): L => ({ id, speaker, text, emotion: 'neutral', action: 'keine', sfx: null, pauseAfter: 0.1, ...extra });
export const TTS: Record<string, string> = {};
const line = (l: L) => { if (l.tts) TTS[l.id] = l.tts; const { tts, ...rest } = l; void tts; return { ...rest, audio: null }; };

const FOLLOWER_ALT = 50;
const FOLLOWER = 52;
const LIKES_F7 = 46;
const LIKEKASSE_ALT = 214;
const LIKEKASSE = LIKEKASSE_ALT + LIKES_F7 * 2; // 306 €

const G = 'guenther-wallach', P = 'paule-kruse', R = 'rosa-brandt', E = 'emre-yildiz', J = 'j-sparring', T = 'marek-wolski';
const NEU = { condition: 100, sandbags: 5, hasNewRing: true, mirrorOk: true };

export const episode = {
  id: 'ep-008',
  number: 8,
  title: 'Emre bekommt seinen ersten Sparringspartner!',
  status: 'entwurf',
  createdAt: new Date().toISOString(),
  generator: 'Claude im Chat (nach Vorgabe des Produzenten)',
  userIdeas: 'J’ wird Sparringspartner, ein Profi-Trainer kommt (Community-Kommentar), Marke IRON kündigt Kooperation an (fiktiv). Erstes Sparring, Grundlagen, Cliffhanger erster Kampf. Frage: Schlagkraft, Schnelligkeit oder Ausdauer?',
  resolvesDecisionId: null,
  titleCard: 'klein',
  hook: 'Emre schlägt im Ring ins Leere. Günther: „Emre, so wird das nichts! Du brauchst endlich einen richtigen Sparringspartner!“ – die Hallentür geht auf.',
  summary:
    'Emre schlägt im Ring unbeholfen ins Leere – Günther: „So wird das nichts!“ Da kommt J’ in die Halle, der in den Kommentaren geschrieben hat: „ich bin emres sparing partner“. Erstes kontrolliertes Sparring: J’ ist schneller, Emre muss zurück, Paule ruft „Hände hoch!“. Dann stellt Günther den neuen Profi-Trainer Marek Wolski vor – Grundlagen statt Träume: Stellung, Deckung, Beinarbeit, Jab, Cross. Rosa liest eine Nachricht: Die Marke IRON will mit kompletter Boxausrüstung kooperieren (in der Serie, noch nicht geliefert). Wolski: „Ab heute musst du richtig arbeiten.“ Emre: „Ich bin bereit!“ J’: „Dann sehen wir uns morgen im Ring.“ Arena 52/100, Like-Kasse 306 €. Wolski: „Wenn Emre so weitermacht, können wir bald über seinen ersten Kampf sprechen.“',
  scenes: [
    {
      id: 's1', beat: 'einstieg', location: 'ring', shot: 'totale', music: 'training', overlay: 'EMRE BEKOMMT EINEN SPARRINGSPARTNER?!',
      direction: 'Hook: Emre schlägt unbeholfen ins Leere. Günther am Ringrand. Am Ende: Tür geht auf.',
      setOverrides: NEU,
      cast: [
        { characterId: E, position: 'links', facing: 'rechts', action: 'schlagen' },
        { characterId: G, position: 'ganz_rechts', facing: 'links' },
      ],
      lines: [
        line(L('l1', G, 'Emre, so wird das nichts! Du brauchst endlich einen richtigen Sparringspartner!', { emotion: 'ueberrascht', action: 'kopfschuetteln', sfx: 'whoosh' })),
        line(L('l2', E, 'Und wo soll ich den herkriegen?', { emotion: 'verlegen', action: 'achselzucken', sfx: 'tuer', pauseAfter: 0.15 })),
      ],
    },
    {
      id: 's2', beat: 'vorstellung', location: 'neuehalle', shot: 'halbnah', music: 'aufbruch', overlay: '',
      direction: 'J’ kommt herein. Kommentar-Karte mit seinem Nutzernamen.',
      comment: { author: 'J’', text: '„ich bin emres sparing partner“', tag: 'AUS EUREM KOMMENTAR – JETZT IN DER SERIE' },
      cast: [
        { characterId: E, position: 'ganz_links', facing: 'rechts' },
        { characterId: G, position: 'mitte', facing: 'rechts' },
        { characterId: J, position: 'ganz_rechts', facing: 'links', action: 'auftritt' },
      ],
      lines: [
        line(L('l3', G, 'Du bist also J’? Du hast geschrieben, dass du Emres Sparringspartner werden willst!', { emotion: 'froh', action: 'zeigen', delayBefore: 0.5, tts: 'Du bist also Jay? Du hast geschrieben, dass du Emres Sparringspartner werden willst!' })),
        line(L('l4', J, 'Genau. Keine Sorge, Emre – wir trainieren zusammen. Aber ich werde dich fordern.', { emotion: 'entschlossen', action: 'nicken' })),
        line(L('l5', E, 'Dann kann das Training ja endlich losgehen!', { emotion: 'verlegen', action: 'faust_heben', pauseAfter: 0.12 })),
      ],
    },
    {
      id: 's3', beat: 'handlung', location: 'ring', shot: 'totale', music: 'spannung', overlay: 'ERSTES SPARRING',
      direction: 'Kontrolliertes Sparring: J’ schneller, Emre muss zurück. Paule am Ringrand.',
      setOverrides: NEU,
      cast: [
        { characterId: E, position: 'ganz_links', facing: 'rechts', action: 'schlagen' },
        { characterId: J, position: 'mitte', facing: 'links', action: 'schlagen' },
        { characterId: P, position: 'ganz_rechts', facing: 'links' },
      ],
      lines: [
        line(L('l6', J, 'Deckung, Emre!', { emotion: 'entschlossen', action: 'schlagen', sfx: 'schlag' })),
        line(L('l7', E, 'Uff! Der war schnell.', { emotion: 'ueberrascht', action: 'seufzen' })),
        line(L('l8', P, 'Emre! Hände hoch! Du musst deine Deckung halten!', { emotion: 'ueberrascht', action: 'zeigen' })),
        line(L('l9', E, 'Okay … ich hab noch viel zu lernen.', { emotion: 'verlegen', action: 'nicken', pauseAfter: 0.15 })),
      ],
    },
    {
      id: 's4', beat: 'handlung', location: 'neuehalle', shot: 'halbnah', music: 'aufbruch', overlay: '',
      direction: 'Der Profi-Trainer kommt. Community-Kommentar ohne Nutzernamen.',
      comment: { author: 'Community-Kommentar', text: '„Jetzt kommt ein Profi und bringt Emre das Boxen bei“', tag: 'AUS EUREM KOMMENTAR – JETZT IN DER SERIE' },
      cast: [
        { characterId: E, position: 'ganz_links', facing: 'rechts' },
        { characterId: G, position: 'mitte', facing: 'rechts' },
        { characterId: T, position: 'ganz_rechts', facing: 'links', action: 'auftritt' },
      ],
      lines: [
        line(L('l10', G, 'Emre, noch eine Überraschung: Das ist Marek Wolski – dein neuer Boxtrainer!', { emotion: 'stolz', action: 'zeigen', delayBefore: 0.5 })),
        line(L('l11', T, 'Du hast Potenzial. Aber wenn du wirklich kämpfen willst, fangen wir bei den Grundlagen an.', { emotion: 'neutral', action: 'arme_verschraenkt', pauseAfter: 0.12 })),
      ],
    },
    {
      id: 's5', beat: 'entwicklung', location: 'ring', shot: 'dolly', music: 'training', overlay: 'STELLUNG · DECKUNG · BEINARBEIT',
      direction: 'Grundlagen: Wolski hält die Pratzen, Emre schlägt Jab–Cross, weicht aus.',
      setOverrides: NEU,
      cast: [
        { characterId: E, position: 'links', facing: 'rechts', action: 'schlagen' },
        { characterId: T, position: 'rechts', facing: 'links', action: 'pratzen' },
      ],
      lines: [
        line(L('l12', T, 'Stellung. Kinn runter. Jab – Cross. Und raus!', { emotion: 'entschlossen', action: 'pratzen', sfx: 'schlag' })),
        line(L('l13', T, 'Gut. Noch mal. Hände bleiben oben.', { emotion: 'neutral', action: 'pratzen', sfx: 'schlag', pauseAfter: 0.12 })),
      ],
    },
    {
      id: 's6', beat: 'handlung', location: 'buero', shot: 'halbnah', music: 'spannung', overlay: '',
      direction: 'Rosa liest die Nachricht von IRON (fiktive Marke) – Community-Kommentar als Karte.',
      comment: { author: 'Community-Kommentar', text: '„Später kommt eine berühmte Firma und will eine Kooperation mit euch die IRON heißen und sie geben euch ganze Box Materialien“', tag: 'IN DER SERIE: ANGEBOT VON IRON – NOCH NICHT GELIEFERT' },
      cast: [
        { characterId: R, position: 'links', facing: 'rechts' },
        { characterId: G, position: 'mitte', facing: 'links' },
        { characterId: P, position: 'rechts', facing: 'links' },
      ],
      lines: [
        line(L('l14', R, 'Leute! Wir haben eine Nachricht von IRON bekommen!', { emotion: 'ueberrascht', action: 'zeigen', tts: 'Leute! Wir haben eine Nachricht von Eiron bekommen!' })),
        line(L('l15', G, 'IRON? Was wollen die denn von uns?', { emotion: 'ueberrascht', action: 'keine', tts: 'Eiron? Was wollen die denn von uns?' })),
        line(L('l16', R, 'Die wollen mit uns zusammenarbeiten – mit kompletter Boxausrüstung!', { emotion: 'froh', action: 'jubeln' })),
        line(L('l17', P, 'Jetzt müssen wir nur noch lernen, damit richtig umzugehen.', { emotion: 'neutral', action: 'achselzucken', pauseAfter: 0.12 })),
      ],
    },
    {
      id: 's7', beat: 'entwicklung', location: 'neuehalle', shot: 'schwenk', music: 'gefuehl', overlay: 'VORSCHAU: IRON-AUSRÜSTUNG',
      direction: 'Vorstellung (Traum): IRON-Kisten und Regal mit Handschuhen, Pratzen, Bandagen – noch nicht geliefert.',
      fx: 'traum',
      props: [
        { type: 'kiste', x: 300, label: 'IRON', scale: 1 },
        { type: 'kiste', x: 300, y: 1385, label: 'IRON', scale: 0.75 },
        { type: 'ausruestung', x: 700, scale: 1 },
      ],
      cast: [
        { characterId: G, position: 'mitte', facing: 'rechts' },
      ],
      lines: [
        line(L('l18', G, 'Handschuhe, Bandagen, Pratzen, Sandsäcke, Trainingsklamotten …', { emotion: 'froh', action: 'zeigen', pauseAfter: 0.12 })),
      ],
    },
    {
      id: 's8', beat: 'entwicklung', location: 'ring', shot: 'halbnah', music: 'gefuehl', overlay: '',
      direction: 'Zurück im Ring: Wolski, Emre, J’ – das Ziel wird ernst.',
      setOverrides: NEU,
      cast: [
        { characterId: E, position: 'ganz_links', facing: 'rechts' },
        { characterId: T, position: 'mitte', facing: 'links' },
        { characterId: J, position: 'ganz_rechts', facing: 'links' },
      ],
      lines: [
        line(L('l19', T, 'Wenn du deinen ersten Kampf gewinnen willst, musst du ab heute richtig arbeiten.', { emotion: 'entschlossen', action: 'zeigen' })),
        line(L('l20', E, 'Ich bin bereit!', { emotion: 'entschlossen', action: 'faust_heben' })),
        line(L('l21', J, 'Dann sehen wir uns morgen wieder im Ring.', { emotion: 'froh', action: 'nicken', pauseAfter: 0.12 })),
      ],
    },
    {
      id: 's9', beat: 'entscheidung', location: 'eventhalle', shot: 'totale', music: 'aufbruch', overlay: '',
      direction: 'Arena 50 → 52 von 100 (Ziel 75). Like-Kasse 214 → 306 € (46 echte Likes × 2 €, symbolisch).',
      seats: { from: FOLLOWER_ALT, to: FOLLOWER, total: 100, hud: true, goal: 75 },
      kasse: { amount: LIKEKASSE, from: LIKEKASSE_ALT, perLike: 2, likeGoal: 100, label: 'LIKE-KASSE' },
      cast: [
        { characterId: G, position: 'links', facing: 'rechts' },
        { characterId: P, position: 'rechts', facing: 'links' },
      ],
      lines: [
        line(L('l22', G, 'Zweiundfünfzig Follower! Schaffen wir als Nächstes die fünfundsiebzig?', { emotion: 'froh', action: 'zeigen', sfx: 'publikum' })),
        line(L('l23', P, 'Sechsundvierzig Likes: zweiundneunzig Euro. Symbolisch.', { emotion: 'neutral', action: 'nicken', pauseAfter: 0.12 })),
      ],
    },
    {
      id: 's10', beat: 'entscheidung', location: 'neuehalle', shot: 'zoom', music: 'spannung', overlay: 'EMRES ERSTER KAMPF RÜCKT NÄHER!',
      direction: 'Wolski mit Trainingsplan (Klemmbrett). Cliffhanger + die eine Frage.',
      cast: [
        { characterId: T, position: 'links', facing: 'rechts' },
        { characterId: E, position: 'rechts', facing: 'links' },
      ],
      lines: [
        line(L('l24', T, 'Wenn Emre so weitermacht, können wir bald über seinen ersten Kampf sprechen.', { emotion: 'neutral', action: 'nicken', delayBefore: 0.3, sfx: 'trommelwirbel' })),
        line(L('l25', E, 'Und ihr entscheidet: Was soll ich zuerst trainieren?', { emotion: 'entschlossen', action: 'zeigen', delayBefore: 0.4, pauseAfter: 0.3 })),
      ],
    },
  ],
  decision: {
    question: 'Was soll Emre zuerst trainieren?',
    options: [
      { key: 'A', label: 'Schlagkraft 💥', consequenceHint: 'Sandsack- und Krafttraining stehen in Folge 9 im Mittelpunkt.', plan: 'training:schlagkraft' },
      { key: 'B', label: 'Schnelligkeit ⚡', consequenceHint: 'Speed, Reflexe (Tennisbälle!) und Beinarbeit in Folge 9.', plan: 'training:schnelligkeit' },
      { key: 'C', label: 'Ausdauer 🫁', consequenceHint: 'Laufen, Seilspringen, Runden durchhalten in Folge 9.', plan: 'training:ausdauer' },
    ],
  },
  endCard: {
    type: 'abstimmung',
    headline: 'Was soll Emre zuerst trainieren?',
    lines: ['Schreib A, B oder C in die Kommentare!', `🏟️ ${FOLLOWER}/100 Plätze · ❤️ Ziel: 100 Likes`],
    seatsFilled: FOLLOWER,
    seatsTotal: 100,
    seatsGoal: 75,
  },
  cliffhanger: 'Wolski: „Wenn Emre so weitermacht, können wir bald über seinen ersten Kampf sprechen.“ – Gegner und Termin offen; IRON-Ausrüstung angekündigt.',
  stateChanges: [
    { op: 'follower', amount: FOLLOWER, reason: 'Meldung des Produzenten vor Folge 8' },
    { op: 'plaetze', amount: FOLLOWER, reason: '52 Follower = 52 von 100 Plätzen' },
    { op: 'likes', amount: LIKES_F7, reason: 'Likes Folge 7 (Screenshot des Produzenten)' },
    { op: 'konto', target: 'likes', amount: LIKES_F7 * 2, reason: 'Like-Kasse: 46 Likes (F7) × 2 € (symbolisch)' },
    { op: 'kennzahlen', amount: 7, value: JSON.stringify({ views: 889, likes: LIKES_F7, followersTotal: FOLLOWER, newFollowers: FOLLOWER - FOLLOWER_ALT, note: 'Gemeldet vor Folge 8 (Screenshot): 889 Aufrufe, 46 Likes, 52 Follower. Rekord bleibt Folge 6 (1.858). Kommentare, Shares, Wiedergabezeit, Anteil gesehen, vollständige Aufrufe: nicht gemeldet.' }) },
    { op: 'mitglieder', amount: 1, reason: 'J’ trainiert ab jetzt regelmäßig im Club (Serienhandlung)' },
    { op: 'angebot', target: 'o-007', value: JSON.stringify({ source: 'Kommentar von J’ (unter Folge 7)', content: '„ich bin emres sparing partner“', status: 'offen', note: 'In der Serie umgesetzt: J’ ist Emres Sparringspartner (Figur, fiktive Darstellung). Kein Wettkampfgegner.' }) },
    { op: 'angebot', target: 'o-008', value: JSON.stringify({ source: 'Community-Kommentar (kein Nutzername sichtbar, unter Folge 7)', content: '„Jetzt kommt ein Profi und bringt Emre das Boxen bei“', status: 'offen', note: 'In der Serie umgesetzt: fiktiver Boxtrainer Marek Wolski.' }) },
    { op: 'angebot', target: 'o-009', value: JSON.stringify({ source: 'Community-Kommentar (kein Nutzername sichtbar, unter Folge 7)', content: 'Kooperation mit der Marke „IRON“: komplette Boxausrüstung (Handschuhe, Trainingshandschuhe, Pratzen, Sandsäcke, Bandagen, Trainingskleidung)', status: 'offen', note: 'IRON ist ein FIKTIVER Kooperationspartner in der Serie. Nur angekündigt (F8), Übergabe ggf. Folge 9. Keine echte Partnerschaft, keine echte Lieferung.' }) },
    { op: 'handlung', target: 'erster-kampf', value: 'Folge 8: Ernsthafte Vorbereitung beginnt. Neuer Trainer Marek Wolski (Grundlagen: Stellung, Deckung, Beinarbeit, Jab, Cross). Sparringspartner J’. Wolski: „Bald können wir über den ersten Kampf sprechen.“ Gegner/Termin offen.' },
    { op: 'handlung', target: 'sparring', value: 'Folge 8: Erstes kontrolliertes Sparring Emre vs. J’. J’ deutlich erfahrener, Emre muss zurück, Deckung zu tief („Hände hoch!“). J’: „Morgen wieder im Ring.“', reason: 'Sparring mit J’' },
    { op: 'handlung', target: 'iron-kooperation', value: 'Folge 8: Nachricht von IRON (fiktive Marke): Kooperation + komplette Boxausrüstung angekündigt. NICHT geliefert. Übergabe als möglicher Höhepunkt in Folge 9.', reason: 'Kooperation mit IRON' },
    { op: 'handlung', target: 'entwicklung-emre-yildiz', value: 'Folge 8: Erstes Sparring – Deckung zu tief, „ich hab noch viel zu lernen“. Beginnt Grundlagentraining bei Wolski. „Ich bin bereit!“' },
  ],
  newCharacterIds: ['j-sparring', 'marek-wolski'],
  socialCaption: 'Folge 8: Emre bekommt seinen ersten Sparringspartner! 🥊 Danke J’ – aus deinem Kommentar wird jetzt Training. Dazu ein Profi-Trainer und eine Nachricht von IRON (fiktive Marke in unserer Story). Ihr entscheidet: Was soll Emre zuerst trainieren? A = Schlagkraft, B = Schnelligkeit, C = Ausdauer 👇',
  hashtags: ['#boxclubrostfaust', '#boxen', '#sparring', '#animationserie', '#teil8'],
} satisfies EpisodeInput;
