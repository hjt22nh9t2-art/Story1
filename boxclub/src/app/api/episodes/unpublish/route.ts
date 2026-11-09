import { handle } from '@/lib/api';
import { unpublishLast } from '@/lib/service';
export const dynamic = 'force-dynamic';
export const POST = () => handle(() => unpublishLast());
