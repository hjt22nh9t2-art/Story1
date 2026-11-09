import { handle } from '@/lib/api';
import * as store from '@/lib/store';
import { CharacterSchema } from '@/lib/types';
export const dynamic = 'force-dynamic';
export const GET = () => handle(() => store.getCharacters());
export const POST = (req: Request) => handle(async () => {
  const body = await req.json();
  const c = CharacterSchema.parse({ ...body, firstEpisode: null, lookLocked: false, lookHistory: [] });
  const all = store.getCharacters();
  if (all.some((x) => x.id === c.id)) throw new Error(`ID „${c.id}“ ist bereits vergeben.`);
  store.saveCharacters([...all, c]);
  return c;
});
