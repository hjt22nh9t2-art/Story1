import { handle } from '@/lib/api';
import * as store from '@/lib/store';
export const dynamic = 'force-dynamic';
export const GET = () => handle(() => store.listEpisodes());
