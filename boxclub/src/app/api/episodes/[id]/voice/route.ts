import { handle } from '@/lib/api';
import { voiceEpisode } from '@/lib/service';
export const dynamic = 'force-dynamic';
export const maxDuration = 600;
export const POST = (req: Request, { params }: { params: Promise<{ id: string }> }) => handle(async () => {
  const b = await req.json().catch(() => ({}));
  return voiceEpisode((await params).id, { force: !!b.force });
});
