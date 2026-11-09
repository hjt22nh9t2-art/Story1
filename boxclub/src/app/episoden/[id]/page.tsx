import { notFound } from 'next/navigation';
import * as store from '@/lib/store';
import { getConfig } from '@/lib/providers/config';
import { EpisodeEditor } from '@/components/EpisodeEditor';

export const dynamic = 'force-dynamic';

export default async function EpisodePage({ params }: { params: Promise<{ id: string }> }) {
  const ep = store.getEpisode((await params).id);
  if (!ep) notFound();
  const chars = store.getCharacters().map((c) => ({ id: c.id, name: c.name, status: c.status }));
  const locs = store.getLocations().map((l) => ({ id: l.id, name: l.name, unlocked: l.unlocked }));
  const club = store.getClub();
  return <EpisodeEditor initial={ep} characters={chars} locations={locs} tts={getConfig().tts} isNext={ep.number === club.lastEpisode + 1} />;
}
