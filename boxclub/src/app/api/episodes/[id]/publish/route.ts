import { handle } from '@/lib/api';
import { publish } from '@/lib/service';
export const dynamic = 'force-dynamic';
export const POST = (_: Request, { params }: { params: Promise<{ id: string }> }) => handle(async () => publish((await params).id));
