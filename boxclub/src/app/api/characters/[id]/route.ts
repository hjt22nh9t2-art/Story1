import { handle } from '@/lib/api';
import * as store from '@/lib/store';
import { CharacterSchema } from '@/lib/types';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };
export const GET = (_: Request, { params }: Ctx) => handle(async () => store.getCharacter((await params).id) ?? Promise.reject(new Error('Figur nicht gefunden')));
export const PUT = (req: Request, { params }: Ctx) => handle(async () => {
  const { id } = await params;
  const body = await req.json();
  const all = store.getCharacters();
  const i = all.findIndex((c) => c.id === id);
  if (i < 0) throw new Error('Figur nicht gefunden');
  const old = all[i];
  const next = CharacterSchema.parse({ ...old, ...body, id: old.id, firstEpisode: old.firstEpisode, lookLocked: old.lookLocked, lookHistory: old.lookHistory });
  const lookChanged = JSON.stringify(next.look) !== JSON.stringify(old.look) || next.heightCm !== old.heightCm;
  if (lookChanged && old.lookLocked) {
    const reason = String(body.lookChangeReason ?? '').trim();
    if (!reason) throw new Error(`${old.name} ist bereits in Folge ${old.firstEpisode} aufgetreten – das Aussehen ist gesperrt. Eine Änderung braucht einen Story-Grund (z. B. „neue Vereinsjacke in Folge 12“).`);
    next.lookHistory = [...old.lookHistory, { episode: store.getClub().lastEpisode + 1, reason }];
  }
  if (old.voice.locked && JSON.stringify({ ...next.voice, locked: true }) !== JSON.stringify({ ...old.voice, locked: true }) && !body.voiceChangeConfirmed) {
    throw new Error(`Die Stimme von ${old.name} ist festgelegt. Änderung nur mit ausdrücklicher Bestätigung (Häkchen „Stimme wirklich ändern“).`);
  }
  all[i] = next;
  store.saveCharacters(all);
  return next;
});
