/**
 * End-to-End-Test der Serienlogik auf einer KOPIE der Daten (data/ bleibt unberührt).
 *   npm run test:flow            (Demo-Autor, 8 Folgen)
 *   npm run test:flow -- claude  (mit Claude, braucht ANTHROPIC_API_KEY)
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'boxclub-test-'));
fs.cpSync(path.join(process.cwd(), 'data'), tmp, { recursive: true, filter: (s) => !s.includes(`${path.sep}media${path.sep}episodes`) && !s.includes('renders') });
process.env.BOXCLUB_DATA = tmp;
const store = await import('../src/lib/store');
const svc = await import('../src/lib/service');
const gen = await import('../src/lib/story/generate');
const provider = process.argv[2] === 'claude' ? 'claude' : 'demo';

let failures = 0;
const assert = (cond: unknown, msg: string) => { if (!cond) { failures++; console.log('  ✗', msg); } else console.log('  ✓', msg); };

// Folge 1 ggf. veröffentlichen
if (store.getClub().lastEpisode === 0) {
  const r = svc.publish('ep-001');
  console.log('Folge 1 veröffentlicht:', r.log.length, 'Änderungen');
}
const signed = new Set<string>();
for (let n = 2; n <= 9; n++) {
  const club = store.getClub();
  const open = club.decisions.find((d) => d.status === 'offen')!;
  const winner = (['A', 'B'] as const)[n % 2];
  svc.setDecisionResult(open.id, winner, { A: 100 + n, B: 90 }, '');
  const moneyBefore = store.getClub().money;
  const { episode, validation } = await gen.generateNextEpisode('', { provider });
  console.log(`\nFolge ${n} „${episode.title}“ (Entscheidung ${winner}: ${open.options.find((o) => o.key === winner)?.label}) – ${validation.estimatedSec.toFixed(0)} s`);
  for (const s of episode.scenes) console.log(`   [${s.beat}/${s.location}] ${s.lines.map((l) => `${l.speaker.split('-')[0]}: ${l.text}`).join(' | ')}`);
  assert(validation.ok, `Konsistenzprüfung ok ${validation.errors.join('; ')}`);
  assert(episode.resolvesDecisionId === open.id, 'setzt die Community-Entscheidung um');
  const plan = open.options.find((o) => o.key === winner)?.plan ?? '';
  if (plan.startsWith('verpflichten:')) signed.add(plan.split(':')[1]);
  svc.publish(episode.id);
  const after = store.getClub();
  const delta = episode.stateChanges.filter((c) => c.op === 'geld').reduce((s, c) => s + c.amount, 0);
  assert(Math.abs(after.money - (moneyBefore + delta)) < 0.01, `Kasse stimmt: ${moneyBefore} + ${delta} = ${after.money}`);
  for (const id of signed) assert(store.getCharacter(id)?.status === 'aktiv', `${id} ist weiterhin aktiv`);
  assert(after.lastEpisode === n, `lastEpisode = ${n}`);
  assert(store.listSnapshots().includes(n), 'Snapshot gesichert');
  assert(after.decisions.filter((d) => d.status === 'offen').length === 1, 'genau eine neue offene Abstimmung');
  const locked = store.getCharacters().filter((c) => c.firstEpisode !== null).every((c) => c.lookLocked);
  assert(locked, 'alle aufgetretenen Figuren sind optisch gesperrt');
}
console.log(`\n${failures ? `❌ ${failures} Fehler` : '✅ Alle Prüfungen bestanden'} (Testdaten: ${tmp})`);
process.exit(failures ? 1 : 0);
