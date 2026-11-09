/**
 * KI-Drehbuchautor über die Claude API (offizielles @anthropic-ai/sdk).
 * Strukturierte Ausgabe (JSON-Schema) + Reparaturschleife bei Konsistenzfehlern.
 */
import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import {
  ACCESSORIES, ACTIONS, AGE_LOOKS, BEATS, BOTTOMS, BROWS, BUILDS, CHAR_STATUS, EMOTIONS, FACIAL_HAIR, HAIR_STYLES,
  LOCATION_KEYS, MUSIC, NOSES, POSITIONS, ROLES, SFX, SHOTS, STATE_OPS, TOPS,
} from '../types';
import { getConfig } from '../providers/config';
import { SERIES_BIBLE } from './context';

/** Schema, das die KI ausfüllt (bewusst schlicht gehalten: keine Defaults/Regex/Grenzen). */
export const DraftSchema = z.object({
  title: z.string(),
  hook: z.string(),
  summary: z.string(),
  cliffhanger: z.string(),
  resolvesDecisionId: z.string(),
  newCharacters: z.array(z.object({
    id: z.string(), name: z.string(), nickname: z.string(), role: z.enum(ROLES), roleTitle: z.string(), status: z.enum(CHAR_STATUS),
    age: z.number(), heightCm: z.number(), weightKg: z.number(), weightClass: z.string(),
    personality: z.string(), background: z.string(), speechStyle: z.string(), strengths: z.array(z.string()), weaknesses: z.array(z.string()),
    goal: z.string(), catchphrase: z.string(),
    look: z.object({
      skin: z.string(), hairStyle: z.enum(HAIR_STYLES), hairColor: z.string(), facialHair: z.enum(FACIAL_HAIR), facialHairColor: z.string(),
      brows: z.enum(BROWS), eyeColor: z.string(), nose: z.enum(NOSES), cauliflowerEar: z.boolean(), build: z.enum(BUILDS), ageLook: z.enum(AGE_LOOKS),
      top: z.enum(TOPS), topColor: z.string(), topAccent: z.string(), topPrint: z.string(),
      bottom: z.enum(BOTTOMS), bottomColor: z.string(), shoes: z.string(), gloves: z.string(), accessories: z.array(z.enum(ACCESSORIES)),
    }),
  })),
  scenes: z.array(z.object({
    beat: z.enum(BEATS), location: z.enum(LOCATION_KEYS), shot: z.enum(SHOTS), music: z.enum(MUSIC), overlay: z.string(), direction: z.string(),
    cast: z.array(z.object({ characterId: z.string(), position: z.enum(POSITIONS), facing: z.enum(['links', 'rechts']) })),
    lines: z.array(z.object({ speaker: z.string(), text: z.string(), emotion: z.enum(EMOTIONS), action: z.enum(ACTIONS), sfx: z.enum([...SFX, 'keine']) })),
  })),
  decision: z.object({ question: z.string(), options: z.array(z.object({ key: z.enum(['A', 'B', 'C']), label: z.string(), consequenceHint: z.string() })) }),
  stateChanges: z.array(z.object({ op: z.enum(STATE_OPS), amount: z.number(), target: z.string(), value: z.string(), reason: z.string() })),
  socialCaption: z.string(),
  hashtags: z.array(z.string()),
});
export type Draft = z.infer<typeof DraftSchema>;

export interface ClaudeSession { messages: Anthropic.Beta.Messages.BetaMessageParam[] }

async function call(session: ClaudeSession): Promise<Draft> {
  const cfg = getConfig();
  const client = new Anthropic();
  const stream = client.beta.messages.stream({
    model: cfg.claudeModel,
    max_tokens: 64000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'high', format: betaZodOutputFormat(DraftSchema) },
    system: [{ type: 'text', text: SERIES_BIBLE, cache_control: { type: 'ephemeral' } }],
    messages: session.messages,
  });
  const msg = await stream.finalMessage();
  if (msg.stop_reason === 'refusal') throw new Error('Claude hat die Anfrage abgelehnt. Bitte Ideen umformulieren.');
  if (msg.stop_reason === 'max_tokens') throw new Error('Antwort wurde abgeschnitten (max_tokens).');
  session.messages.push({ role: 'assistant', content: msg.content as Anthropic.Beta.Messages.BetaContentBlockParam[] });
  const text = msg.content.filter((b) => b.type === 'text').map((b) => (b as { text: string }).text).join('');
  return DraftSchema.parse(JSON.parse(text));
}

export async function claudeDraft(context: string): Promise<{ draft: Draft; session: ClaudeSession }> {
  const session: ClaudeSession = { messages: [{ role: 'user', content: context }] };
  return { draft: await call(session), session };
}

export async function claudeRepair(session: ClaudeSession, errors: string[]): Promise<Draft> {
  session.messages.push({ role: 'user', content: `Die Konsistenzprüfung hat Fehler gefunden. Liefere die komplette Folge korrigiert erneut:\n- ${errors.join('\n- ')}` });
  return call(session);
}
