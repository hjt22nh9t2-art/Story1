import { handle } from '@/lib/api';
import * as store from '@/lib/store';
import { compositionProps } from '@/lib/service';
export const dynamic = 'force-dynamic';
export const GET = (_: Request, { params }: { params: Promise<{ id: string }> }) => handle(async () => {
  const ep = store.getEpisode((await params).id);
  if (!ep) throw new Error('Folge nicht gefunden');
  return compositionProps(ep, '/api/media');
});
