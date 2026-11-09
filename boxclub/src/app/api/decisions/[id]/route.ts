import { handle } from '@/lib/api';
import { setDecisionResult } from '@/lib/service';
export const dynamic = 'force-dynamic';
export const POST = (req: Request, { params }: { params: Promise<{ id: string }> }) => handle(async () => {
  const { id } = await params;
  const b = await req.json();
  return setDecisionResult(id, b.winner, b.votes ?? {}, b.note ?? '');
});
