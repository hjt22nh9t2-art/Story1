/**
 * Folge 9 – „Emre wird herausgefordert!“
 * Neuer Gegner: Rico Stahl („Stahl“) – erfundene Serienfigur, selbstbewusst, technisch stark, kein Bösewicht.
 * Kontrollierter Techniktest, KEIN Kampf. Herausforderung zur „Rostfaust Fight Night“ – kein Datum, kein Vertrag, kein Sieger.
 * Zahlen: 52 Follower (unverändert), Folge 8: 756 Aufrufe, 29 Likes → Like-Kasse +58 € (306 → 364 €).
 * Hinweis: Drei Profi-Trainer / UFC-Gürtel / Plakate + Menschenmenge / 100.000 € (laut Produzent von Vexo_on_MTB) waren in F1–F8 NICHT erzählt
 *   → nur als offene Angebote gespeichert, in dieser Folge nicht gezeigt. Der eingreifende Trainer ist Coach Wolski.
 * Abstimmung d-008 (Schlagkraft/Schnelligkeit/Ausdauer) hat noch kein Ergebnis → bleibt offen.
 */
import type { EpisodeInput } from '../lib/types';

type LineIn = EpisodeInput['scenes'][number]['lines'][number];
type L = LineIn & { tts?: string };
const L = (id: string, speaker: string, text: string, extra: Partial<L> = {}): L => ({ id, speaker, text, emotion: 'neutral', action: 'keine', sfx: null, pauseAfter: 0.1, ...extra });
export const TTS: Record<string, string> = {};
const line = (l: L) => { if (l.tts) TTS[l.id] = l.tts; const { tts, ...rest } = l; void tts; return { ...rest, audio: null }; };

const FOLLOWER = 52;
const LIKES_F8 = 29;
const LIKEKASSE_ALT = 306;
const LIKEKASSE = LIKEKASSE_ALT + LIKES_F8 * 2; // 364 €

const G = 'guenther-wallach', P = 'paule-kruse', R = 'rosa-brandt', E = 'emre-yildiz', J = 'j-sparring', W = 'marek-wolski', S = 'rico-stahl';
const NEU = { condition: 100, sandbags: 5, hasNewRing: true, mirrorOk: true };

export const episode = {
  id: 'ep-009',
  number: 9,
  title: 'Emre wird herausgefordert!',
  status: 'entwurf',
  createdAt: new Date().toISOString(),
  generator: 'Claude im Chat (nach Vorgabe des Produzenten)',
  userIdeas: 'Ein unbekannter, selbstbewusster Boxer provoziert Emre, Trainer greift ein, kontrollierter Techniktest, Herausforderung zur Rostfaust Fight Night. Frage: Kann Emre ihn besiegen? JA/NEIN.',
  resolvesDecisionId: null,
  titleCard: 'klein',
  hook: 'Sekunde 1: Ein Fremder steht in der neuen Halle: „Also DAS ist der berühmte Boxclub Rostfaust? Ich hab mir mehr erwartet.“',
  summary:
    'Mitten in Emres Training steht ein Fremder in der neuen Halle: „Also das ist der berühmte Boxclub Rostfaust? Ich hab mir mehr erwartet.“ Seinen Namen verrät er nicht – „Merk dir einfach: Stahl.“ Er will sehen, ob Emre überhaupt boxen kann. Coach Wolski stellt sich dazwischen, Emre will aufbrausen – und bleibt ruhig. Beim kontrollierten Techniktest ist Stahl schneller, Emre muss zurück; Wolski bricht ab: „Du hast noch einiges zu lernen.“ Stahl zieht die Handschuhe aus: „Bei der Rostfaust Fight Night will ich dich im Ring sehen.“ Emre nimmt an. Günther: „Dann haben wir wohl unseren ersten großen Kampf!“ – Termin und Details offen. Wolski: „Ab morgen beginnt dein härtestes Training.“',
  scenes: [
    {
      id: 's1', beat: 'einstieg', location: 'neuehalle', shot: 'totale', music: 'spannung', overlay: 'EIN UNBEKANNTER FORDERT EMRE HERAUS!',
      direction: 'Hook ab Sekunde 1: Der Fremde steht schon in der Halle. Emre trainiert, Günther dreht sich um.',
      cast: [
        { characterId: E, position: 'ganz_links', facing: 'rechts', action: 'schlagen' },
        { characterId: G, position: 'mitte', facing: 'rechts' },
        { characterId: S, position: 'ganz_rechts', facing: 'links', action: 'auftritt' },
      ],
      lines: [
        line(L('l1', S, 'Also DAS ist der berühmte Boxclub Rostfaust? Ich hab mir mehr erwartet.', { emotion: 'neutral', action: 'arme_verschraenkt', sfx: 'tuer', tts: 'Also das ist der berühmte Boxclub Rostfaust? Ich hab mir mehr erwartet.' })),
        line(L('l2', G, 'Äh … und wer bist du?', { emotion: 'ueberrascht', action: 'keine' })),
        line(L('l3', S, 'Merk dir einfach: Stahl.', { emotion: 'stolz', action: 'nicken', pauseAfter: 0.15 })),
      ],
    },
    {
      id: 's2', beat: 'vorstellung', location: 'neuehalle', shot: 'halbnah', music: 'spannung', overlay: '',
      direction: 'Stahl geht direkt auf Emre zu. Paule und Rosa beobachten.',
      cast: [
        { characterId: E, position: 'links', facing: 'rechts' },
        { characterId: S, position: 'mitte', facing: 'links' },
        { characterId: P, position: 'ganz_rechts', facing: 'links' },
      ],
      lines: [
        line(L('l4', S, 'Du bist also Emre? Du sollst bald deinen ersten Kampf haben.', { emotion: 'neutral', action: 'zeigen' })),
        line(L('l5', E, 'Ja. Und was willst du von mir?', { emotion: 'wuetend', action: 'arme_verschraenkt' })),
        line(L('l6', S, 'Ich will sehen, ob du überhaupt boxen kannst.', { emotion: 'stolz', action: 'keine' })),
        line(L('l7', P, 'Oh, das könnte interessant werden.', { emotion: 'neutral', action: 'achselzucken', pauseAfter: 0.12 })),
      ],
    },
    {
      id: 's3', beat: 'handlung', location: 'neuehalle', shot: 'halbnah', music: 'spannung', overlay: '',
      direction: 'Coach Wolski stellt sich dazwischen. Emre will aufbrausen – und bleibt ruhig (Charakterentwicklung).',
      cast: [
        { characterId: E, position: 'ganz_links', facing: 'rechts' },
        { characterId: W, position: 'mitte', facing: 'rechts' },
        { characterId: S, position: 'ganz_rechts', facing: 'links' },
      ],
      lines: [
        line(L('l8', W, 'Langsam. Hier wird nicht einfach jeder in den Ring geschickt.', { emotion: 'entschlossen', action: 'arme_verschraenkt' })),
        line(L('l9', S, 'Dann solltet ihr ihn vielleicht besser trainieren.', { emotion: 'stolz', action: 'achselzucken' })),
        line(L('l10', E, 'Pass bloß auf, was du …', { emotion: 'wuetend', action: 'faust_heben' })),
        line(L('l11', W, 'Emre. Ruhig. Wer sich provozieren lässt, hat schon verloren.', { emotion: 'neutral', action: 'zeigen' })),
        line(L('l12', E, '… Okay. Ich bleib ruhig.', { emotion: 'entschlossen', action: 'nicken', delayBefore: 0.3, pauseAfter: 0.12 })),
      ],
    },
    {
      id: 's4', beat: 'entwicklung', location: 'ring', shot: 'totale', music: 'training', overlay: 'TECHNIKTEST – KEIN KAMPF',
      direction: 'Kontrollierter Techniktest: Beinarbeit, Deckung, kontrollierte Treffer. Stahl wirkt überlegen. Rosa und J’ am Ringrand.',
      setOverrides: NEU,
      cast: [
        { characterId: E, position: 'ganz_links', facing: 'rechts', action: 'schlagen' },
        { characterId: S, position: 'links', facing: 'links', action: 'schlagen' },
        { characterId: W, position: 'rechts', facing: 'links' },
        { characterId: R, position: 'ganz_rechts', facing: 'links' },
      ],
      lines: [
        line(L('l13', W, 'Kurzer Techniktest. Kontrolliert. Kein Kampf.', { emotion: 'neutral', action: 'keine', sfx: 'glocke' })),
        line(L('l13b', S, 'Zu langsam.', { emotion: 'stolz', action: 'schlagen', sfx: 'whoosh', delayBefore: 1.0 })),
        line(L('l14', R, 'Der ist schnell …', { emotion: 'ueberrascht', action: 'zeigen', sfx: 'schlag' })),
        line(L('l13c', E, 'Noch mal.', { emotion: 'entschlossen', action: 'schlagen', sfx: 'schlag', delayBefore: 0.6 })),
        line(L('l15', E, 'Wow … der ist gut.', { emotion: 'ueberrascht', action: 'seufzen', sfx: 'schlag', delayBefore: 0.8 })),
      ],
    },
    {
      id: 's5', beat: 'entwicklung', location: 'ring', shot: 'nah', music: 'spannung', overlay: '',
      direction: 'Emre muss zurückweichen – J’ ruft vom Ringrand, Wolski bricht ab. Danach Stille.',
      setOverrides: NEU,
      cast: [
        { characterId: E, position: 'links', facing: 'rechts' },
        { characterId: J, position: 'mitte', facing: 'links' },
        { characterId: W, position: 'rechts', facing: 'links' },
      ],
      lines: [
        line(L('l16', J, 'Deckung hoch, Emre!', { emotion: 'ueberrascht', action: 'zeigen' })),
        line(L('l17', W, 'Stopp! Emre, du hast noch einiges zu lernen.', { emotion: 'neutral', action: 'zeigen', sfx: 'glocke', pauseAfter: 0.6 })),
      ],
    },
    {
      id: 's6', beat: 'handlung', location: 'neuehalle', shot: 'halbnah', music: 'gefuehl', overlay: '',
      direction: 'Stahl zieht die Handschuhe aus und stellt die Herausforderung. Emre nimmt an – keine Vertragsdetails.',
      cast: [
        { characterId: E, position: 'ganz_links', facing: 'rechts' },
        { characterId: G, position: 'mitte', facing: 'rechts' },
        { characterId: S, position: 'ganz_rechts', facing: 'links' },
      ],
      lines: [
        line(L('l18', S, 'Ich geb dir noch etwas Zeit. Aber bei der Rostfaust Fight Night will ich dich im Ring sehen.', { emotion: 'entschlossen', action: 'zeigen', tts: 'Ich geb dir noch etwas Zeit. Aber bei der Rostfaust Fait Nait will ich dich im Ring sehen.' })),
        line(L('l19', E, 'Ich nehme die Herausforderung an.', { emotion: 'entschlossen', action: 'faust_heben', delayBefore: 0.6 })),
        line(L('l20', G, 'Dann haben wir wohl unseren ersten großen Kampf!', { emotion: 'ueberrascht', action: 'jubeln', sfx: 'trommelwirbel', pauseAfter: 0.12 })),
      ],
    },
    {
      id: 's6b', beat: 'handlung', location: 'neuehalle', shot: 'totale', music: 'spannung', overlay: '',
      direction: 'Stahl verlässt die Halle, ohne sich umzudrehen. Rosa schaut ihm nach.',
      cast: [
        { characterId: R, position: 'ganz_links', facing: 'rechts' },
        { characterId: S, position: 'ganz_rechts', facing: 'rechts' },
      ],
      lines: [
        line(L('l20b', S, 'Viel Glück beim Training, Rostfaust.', { emotion: 'stolz', action: 'keine', sfx: 'tuer' })),
        line(L('l20c', R, 'Der meint das wirklich ernst.', { emotion: 'neutral', action: 'arme_verschraenkt', delayBefore: 0.4, pauseAfter: 0.15 })),
      ],
    },
    {
      id: 's7', beat: 'entscheidung', location: 'eventhalle', shot: 'totale', music: 'aufbruch', overlay: '',
      direction: 'Kurzer Community-Aufruf: Arena 52/100 (Ziel 75), Like-Kasse 306 → 364 € (29 echte Likes × 2 €, symbolisch).',
      seats: { from: FOLLOWER, to: FOLLOWER, total: 100, hud: true, goal: 75 },
      kasse: { amount: LIKEKASSE, from: LIKEKASSE_ALT, perLike: 2, likeGoal: 100, label: 'LIKE-KASSE' },
      cast: [
        { characterId: G, position: 'links', facing: 'rechts' },
        { characterId: P, position: 'rechts', facing: 'links' },
      ],
      lines: [
        line(L('l21', G, 'Wenn ihr Emre unterstützen wollt: Lasst ein Like da! Jedes Like bringt symbolisch zwei Euro in die Kasse.', { emotion: 'froh', action: 'zeigen', sfx: 'publikum' })),
        line(L('l22', P, 'Neunundzwanzig Likes: achtundfünfzig Euro. Symbolisch.', { emotion: 'neutral', action: 'nicken', pauseAfter: 0.12 })),
      ],
    },
    {
      id: 's8', beat: 'entscheidung', location: 'neuehalle', shot: 'halbnah', music: 'spannung', overlay: 'EMRE VS. DER UNBEKANNTE – KOMMT DER KAMPF WIRKLICH?',
      direction: 'Stahl ist weg. Wolski und Günther mit Emre. Die eine Frage.',
      cast: [
        { characterId: E, position: 'ganz_links', facing: 'rechts' },
        { characterId: W, position: 'mitte', facing: 'links' },
        { characterId: G, position: 'ganz_rechts', facing: 'links' },
      ],
      lines: [
        line(L('l23', W, 'Dann beginnt ab morgen dein härtestes Training.', { emotion: 'entschlossen', action: 'nicken' })),
        line(L('l24', G, 'Was meint ihr: Kann Emre ihn besiegen? Schreibt JA oder NEIN!', { emotion: 'entschlossen', action: 'zeigen', pauseAfter: 0.15 })),
      ],
    },
    {
      id: 's9', beat: 'entscheidung', location: 'ring', shot: 'zoom', music: 'spannung', overlay: '',
      direction: 'Dramatische Nahaufnahme: Emre allein im Ring, entschlossen.',
      setOverrides: NEU,
      cast: [
        { characterId: E, position: 'mitte', facing: 'rechts' },
      ],
      lines: [
        line(L('l25', E, 'Wir sehen uns im Ring, Stahl.', { emotion: 'entschlossen', action: 'faust_heben', delayBefore: 0.3, pauseAfter: 0.4 })),
      ],
    },
  ],
  decision: {
    question: 'Kann Emre den Herausforderer „Stahl“ besiegen?',
    options: [
      { key: 'A', label: 'JA – Emre schafft das!', consequenceHint: 'Die Community glaubt an Emre – Folge 10: Vorbereitung mit Rückenwind.', plan: 'kampf:stimmung-ja' },
      { key: 'B', label: 'NEIN – Stahl ist zu stark', consequenceHint: 'Emre muss die Zweifler überzeugen – Folge 10: härtestes Training.', plan: 'kampf:stimmung-nein' },
    ],
  },
  endCard: {
    type: 'abstimmung',
    headline: 'Kann Emre ihn besiegen?',
    lines: ['Schreib JA oder NEIN in die Kommentare!', `🏟️ ${FOLLOWER}/100 Plätze · ❤️ Ziel: 100 Likes`],
    seatsFilled: FOLLOWER,
    seatsTotal: 100,
    seatsGoal: 75,
  },
  cliffhanger: 'Emre hat die Herausforderung von „Stahl“ angenommen – kommt es bei der Rostfaust Fight Night wirklich zum Kampf? Termin, Vertrag und Ausgang offen.',
  stateChanges: [
    { op: 'likes', amount: LIKES_F8, reason: 'Likes Folge 8 (Meldung des Produzenten)' },
    { op: 'konto', target: 'likes', amount: LIKES_F8 * 2, reason: 'Like-Kasse: 29 Likes (F8) × 2 € (symbolisch)' },
    { op: 'kennzahlen', amount: 8, value: JSON.stringify({ views: 756, likes: LIKES_F8, followersTotal: FOLLOWER, newFollowers: 0, note: 'Gemeldet vor Folge 9: 756 Aufrufe, 29 Likes, weiterhin 52 Follower (letzter bestätigter Stand). Kommentare, Shares, Wiedergabezeit, Anteil gesehen, vollständige Aufrufe: nicht gemeldet.' }) },
    // Vom Produzenten genannte, in F1–F8 noch NICHT erzählte Angebote – nur offen gespeichert
    { op: 'angebot', target: 'o-010', value: JSON.stringify({ source: 'Vexo_on_MTB 🌲🚲 (laut Produzent vor Folge 9)', content: 'Drei neue Profi-Trainer, einer davon (in der Geschichte) mit UFC-Gürtel', status: 'offen', note: 'In F1–F8 NICHT erzählt, in F9 nicht gezeigt. Kann später eingeführt werden. Real nicht bestätigt.' }) },
    { op: 'angebot', target: 'o-011', value: JSON.stringify({ source: 'Vexo_on_MTB 🌲🚲 (laut Produzent vor Folge 9)', content: 'Plakate aufgehängt, große Menschenmenge vor dem Club angekündigt', status: 'offen', note: 'In F1–F8 NICHT erzählt, in F9 nicht gezeigt. Passt zur möglichen „Rostfaust Fight Night“.' }) },
    { op: 'angebot', target: 'o-012', value: JSON.stringify({ source: 'Vexo_on_MTB 🌲🚲 (laut Produzent vor Folge 9)', content: 'Weitere 100.000 € Sponsoring angeboten', status: 'offen', note: 'Nur Angebot. NICHT im Story-Fonds verbucht. Real nicht bestätigt.' }) },
    { op: 'konto', target: 'story', value: JSON.stringify({ id: 'k-004', source: 'Vexo_on_MTB 🌲🚲 – Angebot über weitere 100.000 € (laut Produzent vor Folge 9)', amount: 100000, status: 'angekuendigt', note: 'Nur angekündigt/angeboten – nicht eingegangen, auch nicht in der Serie.' }) },
    // Handlung
    { op: 'handlung', target: 'herausforderer-stahl', value: 'Folge 9: Ein Unbekannter („Merk dir einfach: Stahl.“ – Rico Stahl) provoziert Emre in der neuen Halle. Kontrollierter Techniktest: Stahl überlegen, Emre muss zurück, Wolski bricht ab. Stahl fordert Emre zur „Rostfaust Fight Night“ heraus, Emre nimmt an. Kein Termin, kein Vertrag, kein Sieger.', reason: 'Der Herausforderer' },
    { op: 'handlung', target: 'erster-kampf', value: 'Folge 9: Möglicher erster Gegner: „Stahl“. Event-Name „Rostfaust Fight Night“ (Datum offen). Wolski: „Ab morgen beginnt dein härtestes Training.“ Folge 10 = direkte Vorbereitung.' },
    { op: 'handlung', target: 'entwicklung-emre-yildiz', value: 'Folge 9: Lässt sich nicht provozieren („Ich bleib ruhig.“) – charakterliche Entwicklung. Im Techniktest noch unterlegen. Nimmt die Herausforderung an: „Wir sehen uns im Ring, Stahl.“' },
    { op: 'rivalitaet', target: 'Rico „Stahl“', reason: 'Rico Stahl', amount: 3, value: 'Folge 9: Provokation und Herausforderung zur Rostfaust Fight Night.' },
  ],
  newCharacterIds: ['rico-stahl'],
  socialCaption: 'Folge 9: Emre wird herausgefordert! 🥊😤 Ein Unbekannter steht plötzlich in unserer Halle – „Merk dir einfach: Stahl.“ Hat Emre gegen ihn überhaupt eine Chance? Schreibt JA oder NEIN! ❤️ Jedes Like = 2 € symbolisch für die Vereinskasse',
  hashtags: ['#boxclubrostfaust', '#boxen', '#herausforderung', '#animationserie', '#teil9'],
} satisfies EpisodeInput;
