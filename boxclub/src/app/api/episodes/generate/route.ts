import { handle } from '@/lib/api';
import { generateNextEpisode } from '@/lib/story/generate';
export const dynamic = 'force-dynamic';
export const maxDuration = 600;
export const POST = (req: Request) => handle(async () => {
  const b = await req.json().catch(() => ({}));
  return generateNextEpisode(String(b.ideas ?? ''), { provider: b.provider === 'demo' || b.provider === 'claude' ? b.provider : undefined });
});
