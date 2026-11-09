import { handle } from '@/lib/api';
import * as store from '@/lib/store';
export const dynamic = 'force-dynamic';
export const GET = () => handle(() => ({ club: store.getClub(), characters: store.getCharacters(), locations: store.getLocations(), episodes: store.listEpisodes(), snapshots: store.listSnapshots() }));
