import { handle } from '@/lib/api';
import * as store from '@/lib/store';
import { StateChangeSchema } from '@/lib/types';
import { applyChange } from '@/lib/story/apply';
export const dynamic = 'force-dynamic';
/** Manuelle Korrekturbuchung (z. B. Geld, Ausrüstung) – wird in der Chronik vermerkt. */
export const POST = (req: Request) => handle(async () => {
  const ch = StateChangeSchema.parse(await req.json());
  const w = { club: store.getClub(), characters: store.getCharacters(), locations: store.getLocations() };
  const msg = applyChange(w, ch, w.club.lastEpisode);
  w.club.timeline.push({ episode: w.club.lastEpisode, text: `Korrektur (Produzent): ${msg}` });
  store.saveClub(w.club); store.saveCharacters(w.characters); store.saveLocations(w.locations);
  return { message: msg, club: w.club };
});
