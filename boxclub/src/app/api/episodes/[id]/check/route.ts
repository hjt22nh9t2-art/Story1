import { handle } from '@/lib/api';
import { checkEpisode } from '@/lib/service';
export const dynamic = 'force-dynamic';
export const POST = (_: Request, { params }: { params: Promise<{ id: string }> }) => handle(async () => checkEpisode((await params).id));
