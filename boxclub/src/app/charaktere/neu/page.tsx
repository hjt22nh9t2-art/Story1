import { CharacterEditor } from '@/components/CharacterEditor';
import type { Character } from '@/lib/types';

const blank: Character = {
  id: '', name: '', nickname: '', role: 'boxer', roleTitle: 'Boxer', status: 'kandidat', age: 20, heightCm: 178, weightKg: 75, weightClass: 'Weltergewicht',
  personality: '', background: '', speechStyle: '', strengths: [], weaknesses: [], goal: '', catchphrase: '',
  record: { siege: 0, niederlagen: 0, unentschieden: 0 },
  voice: { elevenlabsVoiceId: '', openaiVoice: 'onyx', instructions: '', demoPitch: 1, elevenlabsModel: '', locked: false, note: '', speko: null },
  look: {
    skin: '#e3b08c', hair: { style: 'kurz', color: '#2b2118' }, facialHair: { style: 'keiner', color: '#2b2118' }, brows: 'dünn', eyeColor: '#3a2a1e',
    nose: 'klein', cauliflowerEar: false, build: 'athletisch', ageLook: 'jung',
    top: { type: 'tshirt', color: '#2f6fb0', accent: '#ffffff', print: '' }, bottom: { type: 'trainingshose', color: '#222222', accent: '#ffffff' },
    shoes: '#f2f2f2', gloves: '#b3262e', accessories: [],
  },
  firstEpisode: null, lookLocked: false, lookHistory: [], conceptImage: '', notes: '',
};

export default function NewCharacter() {
  return <CharacterEditor initial={blank} isNew appearances={[]} />;
}
