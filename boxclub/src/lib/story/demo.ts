/**
 * Demo-Drehbuchautor: regelbasiert, ohne KI-Schlüssel.
 * Liest das Seriengedächtnis, setzt die Community-Entscheidung um und
 * schlägt passende neue Entscheidungen vor. Liefert dasselbe Format wie Claude.
 */
import type { Character, Decision } from '../types';
import type { World } from './apply';
import type { Draft } from './claude';

type Scene = Draft['scenes'][number];
type LineIn = Draft['scenes'][number]['lines'][number];
type Opt = { key: 'A' | 'B' | 'C'; label: string; consequenceHint: string; plan: string };

const SPONSORS = [
  { name: 'Kayas Imbiss', amount: 40, hint: 'Vierzig Euro im Monat – und ein Dönerlogo auf dem Ring.' },
  { name: 'Autohaus Brenner', amount: 75, hint: 'Fünfundsiebzig Euro, aber Brenner will mitreden.' },
  { name: 'Hafenkneipe Anker', amount: 30, hint: 'Dreißig Euro und Freibier nach Siegen.' },
];

const ln = (speaker: string, text: string, emotion: LineIn['emotion'] = 'neutral', action: LineIn['action'] = 'keine', sfx: LineIn['sfx'] = 'keine'): LineIn => ({ speaker, text, emotion, action, sfx });
const euro = (n: number) => `${Math.round(n)} €`;

const NUM = ['null', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf'];
function spoken(n: number): string {
  n = Math.round(n);
  if (n < 0) return `minus ${spoken(-n)}`;
  if (n <= 12) return NUM[n];
  return String(n);
}

export interface DemoResult { draft: Draft; plans: string[] }

export function demoDraft(world: World, nextNumber: number, ideas: string, decision?: Decision): DemoResult {
  const chars = world.characters;
  const by = (role: Character['role']) => chars.filter((c) => c.role === role);
  const founder = by('gruender')[0];
  const coach = by('trainer')[0];
  const keeper = chars.find((c) => c.id === 'paule-kruse') ?? by('mitarbeiter')[0] ?? founder;
  const nm = (c?: Character) => (c ? (c.nickname && !c.nickname.includes(' ') && c.role !== 'gruender' && c.role !== 'trainer' ? c.nickname : c.name.split(' ')[0]) : '');
  const club = structuredClone(world.club);
  const changes: Draft['stateChanges'] = [];
  const change = (op: Draft['stateChanges'][number]['op'], amount = 0, target = '', value = '', reason = '') => {
    changes.push({ op, amount, target, value, reason });
    if (op === 'geld') club.money += amount;
    if (op === 'mitglieder') club.members += amount;
  };
  const won = decision ? decision.options.find((o) => o.key === decision.winner) : undefined;
  const plan = won?.plan ?? '';
  const [kind, a1 = '', a2 = '', a3 = ''] = plan.split(':');
  const scenes: Scene[] = [];
  let title = `Folge ${nextNumber}`;
  let summary = '';
  let cliff = '';
  let cliffLine: { speaker: string; text: string } | null = null;

  /* ------------------------------------------------ Hauptgeschichte je nach Entscheidung */
  if (kind === 'verpflichten') {
    const rookie = chars.find((c) => c.id === a1);
    const n = nm(rookie);
    title = `${n} ist da`;
    const vet = (rookie?.age ?? 20) > 30;
    scenes.push({ beat: 'einstieg', location: 'strasse', shot: 'zoom', music: 'aufbruch', overlay: `NEUZUGANG: ${n.toUpperCase()}`, direction: `${n} kommt die Depotstraße entlang.`, cast: [{ characterId: founder.id, position: 'links', facing: 'rechts' }, { characterId: a1, position: 'rechts', facing: 'links' }], lines: [
      ln(founder.id, `Ihr habt entschieden: ${n} wird unser erster Boxer!`, 'froh', 'jubeln', 'glocke'),
      ln(a1, rookie?.catchphrase || 'Dann zeigt mal, was ihr habt.', 'entschlossen', 'auftritt'),
    ] });
    scenes.push({ beat: 'vorstellung', location: 'halle', shot: 'schwenk', music: 'aufbruch', overlay: '', direction: 'Rundgang durch die Halle.', cast: [{ characterId: a1, position: 'links', facing: 'rechts' }, { characterId: keeper.id, position: 'rechts', facing: 'links' }], lines: [
      ln(a1, vet ? 'Hier hab ich als Jugendlicher mal zugeschaut. Sieht noch genauso aus.' : 'Das ist der Club? Sieht aus wie ein Museum.', 'ueberrascht', 'zeigen', 'whoosh'),
      ln(keeper.id, vet ? 'Dich kenn ich noch, Junge. Du warst damals schon zu spät.' : 'Museum hat wenigstens Heizung.', 'neutral', 'achselzucken'),
    ] });
    scenes.push({ beat: 'handlung', location: 'ring', shot: 'dolly', music: 'training', overlay: 'ERSTES TRAINING', direction: `${nm(coach)} testet ${n}.`, cast: [{ characterId: coach.id, position: 'links', facing: 'rechts' }, { characterId: a1, position: 'rechts', facing: 'links' }], lines: [
      ln(coach.id, 'Hände hoch. Zehn Runden Pratzen. Los.', 'entschlossen', 'pratzen', 'pfiff'),
      ln(a1, vet ? 'Das Knie macht mit. Noch.' : 'Zehn? Ich dachte, wir fangen locker an!', vet ? 'traurig' : 'ueberrascht', 'schlagen', 'schlag'),
      ln(coach.id, vet ? 'Schlaghand ist noch da. Kondition nicht.' : 'Schnell bist du. Aber schnell allein gewinnt nichts.', 'neutral', 'arme_verschraenkt'),
    ] });
    change('figur_status', 0, a1, 'aktiv', 'Verpflichtet nach Community-Entscheidung');
    change('mitglieder', 1, '', '', `${n} tritt ein`);
    change('einnahmen', vet ? 0 : 15, '', '', vet ? 'Beitrag erlassen' : 'Mitgliedsbeitrag');
    change('handlung', 0, `entwicklung-${a1}`, `${n} beginnt das Training bei ${nm(coach)}.`, `Der Weg von ${n}`);
    if (vet) change('handlung', 0, 'paules-geheimnis', 'Paule deutet an, Bruno von früher zu kennen – mehr verrät er noch nicht.');
    scenes.push({ beat: 'entwicklung', location: 'buero', shot: 'nah', music: 'komisch', overlay: `MITGLIEDER: ${club.members}`, direction: 'Paule trägt den Neuen ins karierte Heft ein.', cast: [{ characterId: keeper.id, position: 'links', facing: 'rechts' }, { characterId: founder.id, position: 'rechts', facing: 'links' }], lines: [
      ln(keeper.id, `Mitglied Nummer ${spoken(club.members)}. ${vet ? 'Beitrag zahlt er keinen. Hat er gesagt.' : 'Fünfzehn Euro im Monat. Wenn er zahlt.'}`, 'neutral', 'keine', 'stempel'),
      ln(founder.id, founder.catchphrase || 'Dat wird ganz groß!', 'stolz', 'faust_heben'),
    ] });
    summary = `${n} wird nach der Community-Entscheidung erstes Boxmitglied des Clubs. ${nm(coach)} testet ${vet ? 'den Ex-Profi: Schlaghand stark, Kondition und Knie schwach' : 'das Talent: schnell, aber ohne Technik'}.`;
    cliff = vet ? `Paule weiß etwas über ${n}s Vergangenheit.` : `${n} hat nach dem Training ein Geheimnis vor seiner Mutter.`;
    cliffLine = vet ? { speaker: keeper.id, text: `Sag mal, ${n} … weiß Günni eigentlich, warum du damals aufgehört hast?` } : { speaker: a1, text: 'Meine Mutter darf davon nichts wissen. Klar?' };
  } else if (kind === 'kaufen') {
    const cost = Number(a2) || 100;
    title = `${a3 || 'Neue Ausrüstung'}`;
    scenes.push({ beat: 'einstieg', location: 'halle', shot: 'zoom', music: 'aufbruch', overlay: `INVESTITION: ${euro(cost)}`, direction: '', cast: [{ characterId: founder.id, position: 'mitte', facing: 'rechts' }], lines: [
      ln(founder.id, `Ihr habt entschieden: ${a3 || 'neue Ausrüstung'}! Wir haben ${spoken(cost)} Euro ausgegeben.`, 'froh', 'jubeln', 'kasse'),
    ] });
    scenes.push({ beat: 'vorstellung', location: 'strasse', shot: 'halbnah', music: 'komisch', overlay: '', direction: 'Lieferung aus den Kleinanzeigen kommt an.', cast: [{ characterId: keeper.id, position: 'links', facing: 'rechts' }, { characterId: founder.id, position: 'rechts', facing: 'links' }], lines: [
      ln(keeper.id, 'Gebraucht aus den Kleinanzeigen. Der Verkäufer hat geweint vor Glück.', 'neutral', 'achselzucken'),
      ln(founder.id, 'Weil er sich so freut, dass es weitergeht!', 'froh', 'zeigen'),
      ln(keeper.id, 'Weil er es endlich los ist.', 'neutral', 'kopfschuetteln', 'kratzer'),
    ] });
    change('geld', -cost, '', '', a3 || 'Ausrüstung');
    change('ausruestung', 1, a1, a3 || a1, 'Kauf nach Community-Entscheidung');
    const boxer = chars.find((c) => c.role === 'boxer' && c.status === 'aktiv');
    scenes.push({ beat: 'handlung', location: 'halle', shot: 'dolly', music: 'training', overlay: '', direction: 'Erster Test.', cast: [{ characterId: coach.id, position: 'links', facing: 'rechts' }, ...(boxer ? [{ characterId: boxer.id, position: 'rechts' as const, facing: 'links' as const }] : [])], lines: [
      ln(coach.id, 'Endlich vernünftiges Material. Jetzt gibt es keine Ausreden mehr.', 'entschlossen', 'arme_verschraenkt', 'sandsack'),
      ...(boxer ? [ln(boxer.id, 'Ich hatte nie Ausreden. Nur schlechte Handschuhe.', 'verlegen', 'schlagen', 'schlag')] : []),
    ] });
    scenes.push({ beat: 'entwicklung', location: 'buero', shot: 'nah', music: 'spannung', overlay: `KASSE: ${euro(club.money)}`, direction: '', cast: [{ characterId: keeper.id, position: 'links', facing: 'rechts' }, { characterId: founder.id, position: 'rechts', facing: 'links' }], lines: [
      ln(keeper.id, `Bleiben noch ${spoken(club.money)} Euro. Die Pacht wartet nicht.`, 'traurig', 'keine', 'muenzen'),
      ln(founder.id, 'Wir brauchen Einnahmen, Paule. Und zwar bald.', 'entschlossen', 'faust_heben'),
    ] });
    summary = `Der Club investiert ${cost} € in ${a3 || 'Ausrüstung'}. Das Training wird besser, aber die Kasse schrumpft auf ${club.money} €.`;
    cliff = 'Die Pacht ist bald fällig.';
    cliffLine = { speaker: keeper.id, text: 'Und morgen kommt der Brief vom Vermieter.' };
  } else if (kind === 'renovieren') {
    const cost = Number(a1) || 200;
    title = 'Farbe und Schweiß';
    scenes.push({ beat: 'einstieg', location: 'halle', shot: 'zoom', music: 'aufbruch', overlay: 'RENOVIERUNG', direction: '', cast: [{ characterId: founder.id, position: 'mitte', facing: 'rechts' }], lines: [
      ln(founder.id, 'Ihr habt entschieden: Die Halle wird renoviert!', 'froh', 'jubeln', 'glocke'),
    ] });
    scenes.push({ beat: 'vorstellung', location: 'halle', shot: 'schwenk', music: 'training', overlay: '', direction: 'Alle streichen.', cast: [{ characterId: keeper.id, position: 'links', facing: 'rechts' }, { characterId: coach.id, position: 'rechts', facing: 'links' }], lines: [
      ln(keeper.id, 'Ich hab die Farbe aus dem Keller. Von neunzehnhundertachtundachtzig.', 'neutral', 'zeigen'),
      ln(coach.id, 'Riecht auch so.', 'neutral', 'kopfschuetteln'),
    ] });
    change('geld', -cost, '', '', 'Renovierung');
    change('zustand_halle', 22, '', '', 'Renovierung');
    change('ruf', 3);
    scenes.push({ beat: 'handlung', location: 'halle', shot: 'halbnah', music: 'aufbruch', overlay: '', direction: 'Nachbarn helfen mit.', cast: [{ characterId: founder.id, position: 'links', facing: 'rechts' }, { characterId: keeper.id, position: 'rechts', facing: 'links' }], lines: [
      ln(founder.id, 'Drei Nachbarn haben geholfen und wollen jetzt Mitglied werden!', 'stolz', 'zeigen'),
      ln(keeper.id, 'Zwei. Der Dritte wollte nur die Leiter zurück.', 'neutral', 'achselzucken', 'kratzer'),
    ] });
    change('mitglieder', 2, '', '', 'Helfer treten ein');
    change('einnahmen', 30, '', '', 'Zwei neue Beiträge');
    scenes.push({ beat: 'entwicklung', location: 'buero', shot: 'nah', music: 'komisch', overlay: `KASSE: ${euro(club.money)}`, direction: '', cast: [{ characterId: keeper.id, position: 'links', facing: 'rechts' }, { characterId: founder.id, position: 'rechts', facing: 'links' }], lines: [
      ln(keeper.id, `Halle schöner, Kasse kleiner. ${spoken(club.money)} Euro.`, 'neutral', 'keine', 'muenzen'),
    ] });
    summary = `Der Club renoviert die Halle für ${cost} €. Zwei Helfer werden Mitglieder.`;
    cliff = 'Ein Fremder hat die frisch gestrichene Halle fotografiert.';
    cliffLine = { speaker: coach.id, text: 'Draußen steht seit einer Stunde einer im Anzug und fotografiert.' };
  } else if (kind === 'aktion' || kind === 'sponsor') {
    const isSponsor = kind === 'sponsor';
    const amount = Number(a2) || 40;
    title = isSponsor ? (club.sponsors.length ? `Neuer Sponsor: ${a1}` : 'Der erste Sponsor') : a1 === 'seniorenkurs' ? 'Boxen 60+' : 'Tag der offenen Tür';
    scenes.push({ beat: 'einstieg', location: isSponsor ? 'empfang' : 'strasse', shot: 'zoom', music: 'aufbruch', overlay: isSponsor ? 'SPONSOR GESUCHT' : 'TAG DER OFFENEN TÜR', direction: '', cast: [{ characterId: founder.id, position: 'mitte', facing: 'rechts' }], lines: [
      ln(founder.id, `Ihr habt entschieden: ${won?.label ?? title}!`, 'froh', 'jubeln', 'glocke'),
    ] });
    if (isSponsor) {
      scenes.push({ beat: 'vorstellung', location: 'empfang', shot: 'halbnah', music: 'komisch', overlay: '', direction: '', cast: [{ characterId: founder.id, position: 'links', facing: 'rechts' }, { characterId: keeper.id, position: 'rechts', facing: 'links' }], lines: [
        ln(founder.id, `${a1} zahlt ${spoken(amount)} Euro im Monat. Dafür kommt sein Logo auf den Ring.`, 'stolz', 'zeigen', 'telefon'),
        ln(keeper.id, 'Und wir essen bis Weihnachten nur noch Döner.', 'neutral', 'achselzucken'),
      ] });
      change('sponsor', amount, a1, '', 'Erster Sponsor');
      change('ruf', 2);
    } else if (a1 === 'seniorenkurs') {
      scenes.push({ beat: 'vorstellung', location: 'halle', shot: 'schwenk', music: 'komisch', overlay: 'BOXEN 60+', direction: 'Rentner mit Springseilen.', cast: [{ characterId: coach.id, position: 'links', facing: 'rechts' }, { characterId: keeper.id, position: 'rechts', facing: 'links' }], lines: [
        ln(coach.id, 'Sechs Rentner. Disziplinierter als jeder Boxer, den ich je hatte.', 'ueberrascht', 'arme_verschraenkt', 'pfiff'),
        ln(keeper.id, 'Ich bin der Jüngste im Kurs. Endlich mal.', 'stolz', 'jubeln'),
      ] });
      change('mitglieder', 6, '', '', 'Kurs „Boxen 60+“');
      change('einnahmen', 60, '', '', 'Kursgebühren');
      change('ruf', 3);
    } else {
      scenes.push({ beat: 'vorstellung', location: 'halle', shot: 'schwenk', music: 'aufbruch', overlay: '', direction: 'Kinder und Nachbarn in der Halle.', cast: [{ characterId: coach.id, position: 'links', facing: 'rechts' }, { characterId: keeper.id, position: 'rechts', facing: 'links' }], lines: [
        ln(coach.id, 'Zwanzig Leute. Drei davon können einen Springseil halten.', 'neutral', 'arme_verschraenkt', 'publikum'),
        ln(keeper.id, 'Und einer hat den Kuchen gegessen, den wir verkaufen wollten.', 'neutral', 'kopfschuetteln'),
      ] });
      change('mitglieder', 4, '', '', 'Tag der offenen Tür');
      change('einnahmen', 60, '', '', 'Vier neue Beiträge');
      change('geld', 85, '', '', 'Kuchen- und Getränkeverkauf');
      change('ruf', 6);
    }
    scenes.push({ beat: 'handlung', location: 'ring', shot: 'dolly', music: 'training', overlay: '', direction: '', cast: [{ characterId: coach.id, position: 'links', facing: 'rechts' }, { characterId: founder.id, position: 'rechts', facing: 'links' }], lines: [
      ln(coach.id, 'Mehr Leute heißt mehr Arbeit. Ich brauch Hilfe beim Training.', 'neutral', 'arme_verschraenkt'),
      ln(founder.id, 'Hilfe kostet Geld, Rosa.', 'verlegen', 'achselzucken'),
    ] });
    scenes.push({ beat: 'entwicklung', location: 'buero', shot: 'nah', music: 'komisch', overlay: `KASSE: ${euro(club.money)}`, direction: '', cast: [{ characterId: keeper.id, position: 'links', facing: 'rechts' }, { characterId: founder.id, position: 'rechts', facing: 'links' }], lines: [
      ln(keeper.id, isSponsor ? `Kasse: ${spoken(club.money)} Euro. Aber ab jetzt kommt jeden Monat was rein.` : `Kasse: ${spoken(club.money)} Euro. Zum ersten Mal mehr statt weniger.`, 'froh', 'keine', 'kasse'),
      ln(founder.id, 'Sag ich doch. Dat wird!', 'stolz', 'faust_heben'),
    ] });
    summary = isSponsor ? `${a1} wird Sponsor mit ${amount} € im Monat.` : a1 === 'seniorenkurs' ? 'Der Kurs „Boxen 60+“ bringt sechs neue Mitglieder und 60 € im Monat.' : `Der Tag der offenen Tür bringt vier neue Mitglieder und 85 € Erlös.`;
    cliff = `${nm(coach)} braucht Unterstützung im Training.`;
    cliffLine = { speaker: coach.id, text: 'Allein schaff ich das nicht mehr lange.' };
  } else if (kind === 'sparring' || kind === 'training') {
    const boxer = chars.find((c) => c.id === a1) ?? chars.find((c) => c.role === 'boxer' && c.status === 'aktiv')!;
    const n = nm(boxer);
    const rival = chars.find((c) => c.role === 'rivale');
    if (kind === 'sparring') {
      title = 'Das erste Sparring';
      const s = boxer.stats ? boxer.stats.technik + boxer.stats.kraft + boxer.stats.kondition + boxer.stats.disziplin : 15;
      const win = s + (nextNumber % 3) >= 20;
      scenes.push({ beat: 'einstieg', location: 'rivalengym', shot: 'zoom', music: 'spannung', overlay: 'TITAN BOXING GYM', direction: '', cast: [{ characterId: boxer.id, position: 'links', facing: 'rechts' }, ...(rival ? [{ characterId: rival.id, position: 'rechts' as const, facing: 'links' as const }] : [])], lines: [
        ln(boxer.id, `Ihr habt entschieden: Sparring. Ausgerechnet hier.`, 'entschlossen', 'faust_heben', 'tuer'),
        ...(rival ? [ln(rival.id, rival.catchphrase || 'Willkommen in der echten Boxwelt.', 'froh', 'zeigen')] : []),
      ] });
      change('ort_freischalten', 0, 'rivalengym', '', 'Sparring beim Titan Gym');
      if (rival) change('rivalitaet', 3, 'Titan Boxing Gym', 'Sparring-Einladung als Machtdemonstration', rival.name);
      scenes.push({ beat: 'vorstellung', location: 'rivalengym', shot: 'schwenk', music: 'spannung', overlay: '', direction: '', cast: [{ characterId: coach.id, position: 'links', facing: 'rechts' }, { characterId: founder.id, position: 'rechts', facing: 'links' }], lines: [
        ln(founder.id, 'Zehn Sandsäcke. Zehn! Und alle dicht.', 'ueberrascht', 'zeigen'),
        ln(coach.id, 'Hier hab ich zwanzig Jahre gearbeitet. Konzentrier dich.', 'traurig', 'arme_verschraenkt'),
      ] });
      scenes.push({ beat: 'handlung', location: 'ring', shot: 'nah', music: 'training', overlay: 'RUNDE 3', direction: 'Sparring, letzte Runde.', cast: [{ characterId: boxer.id, position: 'mitte', facing: 'rechts' }], lines: [
        ln(boxer.id, win ? 'Jetzt!' : 'Wo kam der denn her …', win ? 'wuetend' : 'ueberrascht', 'schlagen', 'schlag'),
      ] });
      change('kampf', 0, boxer.id, `Sparringspartner | Titan Boxing Gym | Sparring | ${win ? 'sieg' : 'niederlage'} | Punkte`);
      change('ruf', win ? 6 : 1);
      scenes.push({ beat: 'entwicklung', location: 'umkleide', shot: 'nah', music: 'gefuehl', overlay: win ? 'SIEG NACH PUNKTEN' : 'NIEDERLAGE NACH PUNKTEN', direction: '', cast: [{ characterId: coach.id, position: 'links', facing: 'rechts' }, { characterId: boxer.id, position: 'rechts', facing: 'links' }], lines: [
        ln(coach.id, win ? 'Gut. Morgen trotzdem um sechs.' : 'Verloren. Aber du bist nicht umgefallen. Das merk ich mir.', 'neutral', 'nicken'),
        ln(boxer.id, win ? 'Hat sie gerade gut gesagt?' : 'Nächstes Mal fall ich auch nicht um. Dann fällt er.', win ? 'froh' : 'entschlossen', 'faust_heben'),
      ] });
      summary = `${n} boxt das erste Sparring im Titan Gym von ${rival?.name ?? 'der Konkurrenz'} und ${win ? 'gewinnt nach Punkten' : 'verliert knapp nach Punkten'}. Die Rivalität beginnt.`;
      cliff = `${rival?.name ?? 'Die Konkurrenz'} macht Günther ein Angebot für die Halle.`;
      cliffLine = { speaker: founder.id, text: 'Viktor hat mir einen Umschlag gegeben. Da steht eine Zahl drauf …' };
    } else {
      title = `Sechs Uhr morgens`;
      scenes.push({ beat: 'einstieg', location: 'strasse', shot: 'zoom', music: 'training', overlay: '06:00 UHR', direction: '', cast: [{ characterId: boxer.id, position: 'mitte', facing: 'rechts' }], lines: [
        ln(boxer.id, `Ihr habt entschieden: Training. Jeden Tag. Um sechs.`, 'traurig', 'seufzen', 'pfiff'),
      ] });
      scenes.push({ beat: 'vorstellung', location: 'halle', shot: 'schwenk', music: 'training', overlay: a2 ? `FOKUS: ${a2.toUpperCase()}` : '', direction: 'Trainingsmontage.', cast: [{ characterId: coach.id, position: 'links', facing: 'rechts' }, { characterId: boxer.id, position: 'rechts', facing: 'links' }], lines: [
        ln(coach.id, `${a2 ? a2[0].toUpperCase() + a2.slice(1) : 'Grundlagen'}. Bis du es im Schlaf kannst.`, 'entschlossen', 'pratzen', 'sandsack'),
        ln(boxer.id, 'Ich kann im Schlaf nicht mal schlafen.', 'verlegen', 'schlagen', 'schlag'),
      ] });
      scenes.push({ beat: 'handlung', location: 'ring', shot: 'dolly', music: 'training', overlay: '', direction: '', cast: [{ characterId: coach.id, position: 'links', facing: 'rechts' }, { characterId: boxer.id, position: 'rechts', facing: 'links' }], lines: [
        ln(coach.id, 'Nochmal.', 'neutral', 'arme_verschraenkt'),
        ln(boxer.id, 'Das war das Fünfzigste Mal!', 'wuetend', 'schlagen', 'schlag'),
        ln(coach.id, 'Dann eben einundfünfzig.', 'neutral', 'achselzucken'),
      ] });
      change('handlung', 0, `entwicklung-${boxer.id}`, `Harte Trainingswoche mit Fokus ${a2 || 'Grundlagen'}.`, `Der Weg von ${n}`);
      scenes.push({ beat: 'entwicklung', location: 'umkleide', shot: 'nah', music: 'gefuehl', overlay: '', direction: '', cast: [{ characterId: boxer.id, position: 'mitte', facing: 'rechts' }], lines: [
        ln(boxer.id, 'Zum ersten Mal hat sie gesagt: Nicht schlecht.', 'stolz', 'nicken'),
      ] });
      summary = `Trainingswoche für ${n} mit Fokus ${a2 || 'Grundlagen'}. ${nm(coach)} zeigt erstmals so etwas wie Lob.`;
      cliff = `${n} bekommt einen Anruf von einem fremden Trainer.`;
      cliffLine = { speaker: boxer.id, text: 'Da hat gerade so ein Titan-Trainer angerufen …' };
    }
  } else {
    // freie Entscheidung ohne Plan oder keine Entscheidung
    title = won ? won.label.slice(0, 40) : 'Ein neuer Tag in der Halle';
    scenes.push({ beat: 'einstieg', location: 'halle', shot: 'zoom', music: 'aufbruch', overlay: '', direction: '', cast: [{ characterId: founder.id, position: 'mitte', facing: 'rechts' }], lines: [
      ln(founder.id, won ? `Ihr habt entschieden: ${won.label}!` : 'Neuer Tag, neues Glück im Boxclub Rostfaust!', 'froh', 'jubeln', 'glocke'),
    ] });
    scenes.push({ beat: 'vorstellung', location: 'empfang', shot: 'halbnah', music: 'komisch', overlay: `MITGLIEDER: ${club.members}`, direction: '', cast: [{ characterId: keeper.id, position: 'links', facing: 'rechts' }, { characterId: founder.id, position: 'rechts', facing: 'links' }], lines: [
      ln(keeper.id, ideas.trim() ? `Günni, ich hab da was gehört: ${ideas.trim().slice(0, 70)}` : 'Günni, der Kaffee ist alle. Und der Strom bald auch.', 'neutral', 'keine'),
      ln(founder.id, 'Wir finden eine Lösung. Wie immer.', 'entschlossen', 'faust_heben'),
    ] });
    scenes.push({ beat: 'handlung', location: 'ring', shot: 'dolly', music: 'training', overlay: '', direction: '', cast: [{ characterId: coach.id, position: 'mitte', facing: 'rechts' }], lines: [
      ln(coach.id, won ? `${won.consequenceHint || 'Dann ziehen wir das jetzt durch.'}` : 'Reden bringt nichts. Training bringt was.', 'entschlossen', 'arme_verschraenkt', 'pfiff'),
    ] });
    if (won) change('handlung', 0, `entscheidung-${decision!.id}`, won.label, won.label.slice(0, 40));
    scenes.push({ beat: 'entwicklung', location: 'buero', shot: 'nah', music: 'spannung', overlay: `KASSE: ${euro(club.money)}`, direction: '', cast: [{ characterId: keeper.id, position: 'links', facing: 'rechts' }, { characterId: founder.id, position: 'rechts', facing: 'links' }], lines: [
      ln(keeper.id, `Kasse: ${spoken(club.money)} Euro.`, 'neutral', 'keine', 'muenzen'),
    ] });
    summary = won ? `Der Club setzt die Entscheidung „${won.label}“ um.` : 'Alltag im Boxclub.';
    cliff = 'Etwas Unerwartetes bahnt sich an.';
    cliffLine = { speaker: keeper.id, text: 'Günni … da ist Post für dich. Vom Amt.' };
  }

  /* ------------------------------------------------ Ereignis: der Rivale taucht auf */
  const rivalChar = chars.find((c) => c.role === 'rivale');
  if (rivalChar && nextNumber >= 5 && !club.rivalries.length && !changes.some((c) => c.op === 'rivalitaet')) {
    const i = scenes.findIndex((x) => x.beat === 'handlung');
    scenes[i] = { beat: 'handlung', location: 'halle', shot: 'dolly', music: 'spannung', overlay: rivalChar.name.toUpperCase(), direction: `${rivalChar.name} besucht die Halle.`, cast: [{ characterId: founder.id, position: 'links', facing: 'rechts' }, { characterId: rivalChar.id, position: 'rechts', facing: 'links' }], lines: [
      ln(rivalChar.id, `Günther! Schön hier. Sehr … historisch.`, 'froh', 'auftritt', 'tuer'),
      ln(founder.id, 'Viktor. Was willst du hier?', 'wuetend', 'arme_verschraenkt'),
      ln(rivalChar.id, rivalChar.catchphrase || 'Nur Business.', 'stolz', 'zeigen'),
    ] };
    change('rivalitaet', 2, 'Titan Boxing Gym', 'Viktor Hahn interessiert sich für die Depothalle.', rivalChar.name);
    change('handlung', 0, 'die-pacht', 'Viktor Hahn taucht auf und interessiert sich auffällig für die Halle.');
  }

  /* ------------------------------------------------ Monatsende alle 4 Folgen */
  if (nextNumber % 4 === 0) {
    const net = club.monthlyIncome - club.monthlyCosts;
    change('geld', net, '', '', 'Monatsabrechnung (Einnahmen − Kosten)');
    const dev = scenes.find((s) => s.beat === 'entwicklung');
    dev?.lines.push(ln(keeper.id, `Und Monatsende: ${net < 0 ? 'minus' : 'plus'} ${spoken(Math.abs(net))} Euro. Bleiben ${spoken(club.money)}.`, net < 0 ? 'traurig' : 'froh', 'keine', 'kasse'));
    if (dev) dev.overlay = `KASSE: ${euro(club.money)}`;
  }

  /* ------------------------------------------------ Nächste Entscheidung vorschlagen */
  const statusAfter = new Map(chars.map((c) => [c.id, c.status]));
  for (const ch of changes) if (ch.op === 'figur_status') statusAfter.set(ch.target, ch.value as Character['status']);
  const boxers = chars.filter((c) => c.role === 'boxer' && statusAfter.get(c.id) === 'aktiv');
  const candidates = chars.filter((c) => c.role === 'boxer' && statusAfter.get(c.id) === 'kandidat');
  const fought = new Set(club.fights.map((f) => f.boxerId));
  for (const ch of changes) if (ch.op === 'kampf') fought.add(ch.target);
  const rnd = (nextNumber * 7) % 3;
  let opts: Opt[];
  let question: string;
  let asker = founder;
  if (!boxers.length && candidates.length >= 2) {
    question = 'Wen sollen wir verpflichten?';
    opts = candidates.slice(0, 2).map((c, i) => ({ key: (['A', 'B'] as const)[i], label: `${nm(c)} (${c.age}) – ${c.roleTitle}`, consequenceHint: `${c.strengths[0]}, aber ${c.weaknesses[0]}.`, plan: `verpflichten:${c.id}` }));
  } else if (club.money < 260 && !(world.club.decisions.at(-1)?.options.some((o) => o.plan.startsWith('aktion') || o.plan.startsWith('sponsor')) && club.money >= 0)) {
    question = club.money < 0 ? 'Wir sind im Minus! Wie retten wir den Club?' : 'Die Kasse ist fast leer. Wie bringen wir Geld rein?';
    asker = keeper;
    const done = new Set(world.club.decisions.flatMap((d) => (d.winner ? d.options.filter((o) => o.key === d.winner).map((o) => o.plan) : [])));
    const pool: Opt[] = ([
      { key: 'A' as const, label: 'Tag der offenen Tür', consequenceHint: 'Neue Mitglieder, aber viel Arbeit.', plan: 'aktion:tag-der-offenen-tuer' },
      { key: 'A' as const, label: 'Kurs „Boxen 60+“ anbieten', consequenceHint: 'Rentner zahlen pünktlich – aber Rosa muss Geduld haben.', plan: 'aktion:seniorenkurs' },
      ...SPONSORS.filter((sp) => !club.sponsors.some((x) => x.name === sp.name)).map((sp) => ({ key: 'B' as const, label: `${sp.name} als Sponsor`, consequenceHint: sp.hint, plan: `sponsor:${sp.name}:${sp.amount}` })),
    ] as Opt[]).filter((o) => !done.has(o.plan));
    opts = pool.slice(0, 2).map((o, i): Opt => ({ ...o, key: (['A', 'B'] as const)[i] }));
    if (opts.length < 2) opts = [
      { key: 'A', label: 'Halle untervermieten', consequenceHint: 'Geld sofort – aber fremde Leute in der Halle.', plan: '' },
      { key: 'B', label: 'Günther verkauft sein Auto', consequenceHint: 'Achthundert Euro. Und Günther fährt Bus.', plan: '' },
    ];
  } else if (boxers.length && boxers.some((b) => !fought.has(b.id)) && nextNumber >= 3) {
    const b = boxers.find((x) => !fought.has(x.id))!;
    question = `Ist ${nm(b)} bereit für das erste Sparring?`;
    asker = coach;
    opts = [
      { key: 'A', label: `Ja – Sparring im Titan Gym`, consequenceHint: 'Ausgerechnet beim reichen Rivalen.', plan: `sparring:${b.id}` },
      { key: 'B', label: 'Nein – erst eine Woche hartes Training', consequenceHint: 'Sicherer, aber langsamer.', plan: `training:${b.id}:${['kondition', 'technik', 'beinarbeit'][rnd]}` },
    ];
  } else if (candidates.length) {
    const c = candidates[0];
    question = 'Was machen wir mit dem Geld?';
    opts = [
      { key: 'A', label: `${nm(c)} verpflichten`, consequenceHint: `${c.strengths[0]} – aber ${c.weaknesses[0]}.`, plan: `verpflichten:${c.id}` },
      { key: 'B', label: 'Einen neuen Sandsack kaufen', consequenceHint: 'Hundertzwanzig Euro. Der alte leckt.', plan: 'kaufen:sandsack:120:Neuer Sandsack' },
    ];
  } else {
    question = 'Wohin mit dem Geld?';
    opts = [
      { key: 'A', label: 'Halle renovieren', consequenceHint: 'Zweihundert Euro für Farbe und Licht.', plan: 'renovieren:200' },
      { key: 'B', label: 'Neue Handschuhe für alle', consequenceHint: 'Neunzig Euro – dann gibt es keine Ausreden.', plan: 'kaufen:handschuhe:90:Vier Paar neue Handschuhe' },
    ];
  }
  const castFinal: Scene['cast'] = [{ characterId: asker.id, position: 'mitte', facing: 'rechts' }];
  const side = asker.id === founder.id ? coach : founder;
  castFinal.push({ characterId: side.id, position: 'rechts', facing: 'links' });
  if (cliffLine && !castFinal.some((c) => c.characterId === cliffLine!.speaker)) castFinal.push({ characterId: cliffLine.speaker, position: 'links', facing: 'rechts' });
  scenes.push({ beat: 'entscheidung', location: 'halle', shot: 'totale', music: 'spannung', overlay: opts.map((o) => `${o.key}: ${o.label.split(' – ')[0].split(' (')[0].toUpperCase()}`).join('  ·  '), direction: '', cast: castFinal, lines: [
    ...(cliffLine && castFinal.some((c) => c.characterId === cliffLine!.speaker) ? [ln(cliffLine.speaker, cliffLine.text, 'ueberrascht', 'keine', 'trommelwirbel')] : []),
    ln(asker.id, `${question} ${opts.map((o) => `${o.key}: ${o.label.split(' – ')[0]}`).join(', oder ')}? Schreibt es in die Kommentare!`, 'entschlossen', 'zeigen'),
  ] });

  const draft: Draft = {
    title, hook: scenes[0].lines[0].text, summary, cliffhanger: cliff,
    resolvesDecisionId: decision?.id ?? '',
    newCharacters: [], scenes,
    decision: { question, options: opts.map(({ key, label, consequenceHint }) => ({ key, label, consequenceHint })) },
    stateChanges: changes,
    socialCaption: `Folge ${nextNumber}: ${title}. ${question} Stimm ab mit ${opts.map((o) => o.key).join(' oder ')} in den Kommentaren! 🥊`,
    hashtags: ['#boxclub', '#boxen', '#serie', '#animation', '#rostfaust', `#teil${nextNumber}`],
  };
  return { draft, plans: opts.map((o) => o.plan) };
}
