import { handle } from '@/lib/api';
import * as store from '@/lib/store';
export const dynamic = 'force-dynamic';
export const GET = () => handle(() => store.getClub());
/** Nur Stammdaten direkt änderbar – alles andere über Zustandsänderungen (Konsistenz). */
export const PUT = (req: Request) => handle(async () => {
  const b = await req.json();
  const c = store.getClub();
  for (const k of ['clubName', 'city', 'address', 'founded', 'nextEpisodeNote'] as const) if (typeof b[k] === 'string') c[k] = b[k];
  store.saveClub(c);
  return c;
});
