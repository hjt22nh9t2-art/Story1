import { notFound } from 'next/navigation';
import * as store from '@/lib/store';
import { CharacterEditor } from '@/components/CharacterEditor';

export const dynamic = 'force-dynamic';

export default async function CharacterPage({ params }: { params: Promise<{ id: string }> }) {
  const c = store.getCharacter((await params).id);
  if (!c) notFound();
  const appearances = store.listEpisodes().filter((e) => e.scenes.some((s) => s.cast.some((x) => x.characterId === c.id))).map((e) => e.number);
  return <CharacterEditor initial={c} isNew={false} appearances={appearances} />;
}
