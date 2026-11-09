import { handle } from '@/lib/api';
import * as store from '@/lib/store';
import { updateEpisode } from '@/lib/service';
export const dynamic = 'force-dynamic';
type Ctx = { params: Promise<{ id: string }> };
export const GET = (_: Request, { params }: Ctx) => handle(async () => store.getEpisode((await params).id) ?? Promise.reject(new Error('Folge nicht gefunden')));
export const PUT = (req: Request, { params }: Ctx) => handle(async () => updateEpisode((await params).id, await req.json()));
export const DELETE = (_: Request, { params }: Ctx) => handle(async () => {
  const { id } = await params;
  const ep = store.getEpisode(id);
  if (!ep) throw new Error('Folge nicht gefunden');
  if (ep.status === 'veroeffentlicht') throw new Error('Veröffentlichte Folgen können nicht gelöscht werden (sie sind Teil der Geschichte).');
  store.deleteEpisode(id);
  return { deleted: id };
});
