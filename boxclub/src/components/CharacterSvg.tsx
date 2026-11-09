/** Figur als SVG (Server- und Client-tauglich). */
import { CharacterPortrait, type Action, type Emotion } from '@/remotion/Character';
import type { CharacterLook } from '@/lib/types';

export function CharacterSvg({ look, heightCm, size = 140, emotion, action }: { look: CharacterLook; heightCm: number; size?: number; emotion?: Emotion; action?: Action }) {
  return <CharacterPortrait look={look} heightCm={heightCm} size={size} emotion={emotion} action={action} frame={20} />;
}
