/**
 * Episoden-Generator: lädt das Seriengedächtnis, lässt Claude (oder den Demo-Autor)
 * die nächste Folge schreiben, prüft die Konsistenz und speichert einen Entwurf.
 */
import { CharacterSchema, EpisodeSchema, type Character, type Episode } from '../types';
import * as store from '../store';
import { getConfig } from '../providers/config';
import type { World } from './apply';
import { buildContext, decisionToImplement } from './context';
import { claudeDraft, claudeRepair, type Draft } from './claude';
import { demoDraft } from './demo';
import { validateEpisode, type ValidationResult } from './validate';

export function loadWorld(): World {
  return { club: store.getClub(), characters: store.getCharacters(), locations: store.getLocations() };
}

function toCharacter(n: Draft['newCharacters'][number], epNum: number): Character {
  const l = n.look;
  const hex = (s: string, d: string) => (/^#[0-9a-fA-F]{6}$/.test(s) ? s : d);
  return CharacterSchema.parse({
    ...n,
    id: n.id.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
    age: Math.round(n.age), heightCm: Math.round(Math.min(215, Math.max(140, n.heightCm))), weightKg: Math.round(Math.min(160, Math.max(40, n.weightKg))),
    voice: { elevenlabsVoiceId: '', openaiVoice: 'onyx', instructions: n.speechStyle, demoPitch: 1 },
    look: {
      skin: hex(l.skin, '#e3b08c'), hair: { style: l.hairStyle, color: hex(l.hairColor, '#2b2118') }, facialHair: { style: l.facialHair, color: hex(l.facialHairColor, '#2b2118') },
      brows: l.brows, eyeColor: hex(l.eyeColor, '#3a2a1e'), nose: l.nose, cauliflowerEar: l.cauliflowerEar, build: l.build, ageLook: l.ageLook,
      top: { type: l.top, color: hex(l.topColor, '#444444'), accent: hex(l.topAccent, '#dddddd'), print: l.topPrint.slice(0, 12) },
      bottom: { type: l.bottom, color: hex(l.bottomColor, '#333333'), accent: hex(l.bottomColor, '#333333') },
      shoes: hex(l.shoes, '#222222'), gloves: hex(l.gloves, '#b3262e'), accessories: l.accessories,
    },
    notes: `Angelegt vom Generator für Folge ${epNum}.`,
  });
}

export function draftToEpisode(d: Draft, number: number, generator: string, ideas: string, plans: string[] = []): Episode {
  return EpisodeSchema.parse({
    id: store.epId(number), number, title: d.title, status: 'entwurf', createdAt: new Date().toISOString(), publishedAt: null,
    generator, userIdeas: ideas, resolvesDecisionId: d.resolvesDecisionId || null,
    hook: d.hook, summary: d.summary, cliffhanger: d.cliffhanger,
    scenes: d.scenes.map((s, si) => ({
      id: `s${si + 1}`, beat: s.beat, location: s.location, shot: s.shot, music: s.music, overlay: s.overlay, direction: s.direction,
      cast: s.cast,
      lines: s.lines.map((l, li) => ({ id: `s${si + 1}l${li + 1}`, speaker: l.speaker, text: l.text, emotion: l.emotion, action: l.action, sfx: l.sfx === 'keine' ? null : l.sfx, pauseAfter: li === s.lines.length - 1 && si === d.scenes.length - 1 ? 1.2 : 0.25, audio: null })),
    })),
    decision: { question: d.decision.question, options: d.decision.options.slice(0, 3).map((o, i) => ({ ...o, plan: plans[i] ?? '' })) },
    stateChanges: d.stateChanges,
    newCharacterIds: d.newCharacters.map((c) => c.id),
    socialCaption: d.socialCaption, hashtags: d.hashtags, video: null,
  });
}

export interface GenerateResult { episode: Episode; validation: ValidationResult; provider: string; log: string[] }

export async function generateNextEpisode(ideas = '', opts: { provider?: 'claude' | 'demo' } = {}): Promise<GenerateResult> {
  const world = loadWorld();
  const episodes = store.listEpisodes();
  const draftOpen = episodes.find((e) => e.status !== 'veroeffentlicht');
  if (draftOpen) throw new Error(`Folge ${draftOpen.number} ist noch nicht veröffentlicht. Erst veröffentlichen oder den Entwurf löschen – sonst entstehen Widersprüche.`);
  const number = world.club.lastEpisode + 1;
  const decision = decisionToImplement(world);
  const open = world.club.decisions.find((d) => d.status === 'offen');
  if (open) throw new Error(`Bitte zuerst das Ergebnis der Abstimmung aus Folge ${open.episode} eintragen („${open.question}“).`);
  const provider = opts.provider ?? getConfig().story;
  const log: string[] = [];

  let episode: Episode;
  let validation: ValidationResult;
  if (provider === 'claude') {
    const context = buildContext(world, episodes, ideas, number);
    let { draft, session } = await claudeDraft(context);
    for (let attempt = 0; ; attempt++) {
      const newChars = draft.newCharacters.map((n) => toCharacter(n, number));
      const trial: World = { ...world, characters: [...world.characters.filter((c) => !newChars.some((n) => n.id === c.id)), ...newChars] };
      episode = draftToEpisode(draft, number, `claude (${getConfig().claudeModel})`, ideas);
      validation = validateEpisode(episode, trial);
      log.push(`Versuch ${attempt + 1}: ${validation.errors.length} Fehler, ${validation.warnings.length} Warnungen`);
      if (validation.ok || attempt >= 2) {
        if (newChars.length) store.saveCharacters(trial.characters);
        break;
      }
      draft = await claudeRepair(session, validation.errors);
    }
  } else {
    const { draft, plans } = demoDraft(world, number, ideas, decision);
    episode = draftToEpisode(draft, number, 'demo (regelbasiert)', ideas, plans);
    validation = validateEpisode(episode, world);
  }
  store.saveEpisode(episode);
  return { episode, validation, provider, log };
}
