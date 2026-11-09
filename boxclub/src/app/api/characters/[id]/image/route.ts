import { handle } from '@/lib/api';
import * as store from '@/lib/store';
import { characterPrompt, generateImage } from '@/lib/providers/image';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;
export const POST = (_: Request, { params }: { params: Promise<{ id: string }> }) => handle(async () => {
  const { id } = await params;
  const all = store.getCharacters();
  const c = all.find((x) => x.id === id);
  if (!c) throw new Error('Figur nicht gefunden');
  const rel = await generateImage(characterPrompt(c), store.MEDIA_DIR, `images/characters/${id}-${Date.now()}.png`);
  c.conceptImage = rel;
  store.saveCharacters(all);
  return c;
});
