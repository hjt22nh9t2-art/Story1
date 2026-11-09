import { handle } from '@/lib/api';
import { renderStatus, startRender } from '@/lib/service';
export const dynamic = 'force-dynamic';
type Ctx = { params: Promise<{ id: string }> };
export const GET = (_: Request, { params }: Ctx) => handle(async () => renderStatus((await params).id));
export const POST = (_: Request, { params }: Ctx) => handle(async () => { const { id } = await params; startRender(id); return renderStatus(id); });
