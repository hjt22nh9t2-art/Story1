/**
 * Zentrales Datenmodell von BOXCLUB.
 * Alles, was gespeichert wird, läuft durch diese Schemas (Zod) – dadurch
 * kann das Seriengedächtnis nie in einen ungültigen Zustand geraten.
 */
import { z } from 'zod';

/* ------------------------------------------------------------------ Figuren */

export const HAIR_STYLES = ['glatze', 'haarkranz', 'stoppel', 'kurz', 'zurueckgegelt', 'locken', 'irokese', 'zopf', 'afro', 'dutt', 'seitenscheitel'] as const;
export const FACIAL_HAIR = ['keiner', 'schnurrbart', 'walross', 'vollbart', 'stoppeln', 'kinnbart'] as const;
export const BUILDS = ['schmal', 'athletisch', 'stämmig', 'schwer', 'muskulös'] as const;
export const TOPS = ['trainingsjacke', 'tanktop', 'tshirt', 'hoodie', 'hemd', 'sakko', 'strickjacke'] as const;
export const BOTTOMS = ['trainingshose', 'boxershorts', 'jeans', 'stoffhose', 'latzhose'] as const;
export const NOSES = ['klein', 'rund', 'breit', 'krumm', 'spitz'] as const;
export const BROWS = ['dünn', 'buschig', 'streng'] as const;
export const ACCESSORIES = ['muetze', 'brille', 'pfeife', 'handtuch', 'stirnband', 'handschuhe', 'narbe', 'klemmbrett', 'goldkette', 'pflaster', 'schluesselbund', 'kopfhoerer', 'zahnstocher'] as const;
export const AGE_LOOKS = ['jung', 'erwachsen', 'alt'] as const;

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Farbe als #RRGGBB');

/** Das feste Aussehen einer Figur. Daraus zeichnet der Renderer die Figur – immer identisch. */
export const CharacterLookSchema = z.object({
  skin: hex,
  hair: z.object({ style: z.enum(HAIR_STYLES), color: hex }),
  facialHair: z.object({ style: z.enum(FACIAL_HAIR), color: hex }),
  brows: z.enum(BROWS),
  eyeColor: hex,
  nose: z.enum(NOSES),
  cauliflowerEar: z.boolean(),
  build: z.enum(BUILDS),
  ageLook: z.enum(AGE_LOOKS),
  top: z.object({ type: z.enum(TOPS), color: hex, accent: hex, print: z.string().max(12).default('') }),
  bottom: z.object({ type: z.enum(BOTTOMS), color: hex, accent: hex }),
  shoes: hex,
  gloves: hex,
  accessories: z.array(z.enum(ACCESSORIES)).default([]),
});
export type CharacterLook = z.infer<typeof CharacterLookSchema>;

export const ROLES = ['gruender', 'trainer', 'boxer', 'mitarbeiter', 'mitglied', 'rivale', 'sponsor', 'nebenfigur'] as const;
export const CHAR_STATUS = ['aktiv', 'verletzt', 'kandidat', 'gast', 'ausgetreten'] as const;

export const CharacterSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(2),
  nickname: z.string().default(''),
  role: z.enum(ROLES),
  roleTitle: z.string(), // z. B. „Vereinsgründer“, „Cheftrainerin“
  status: z.enum(CHAR_STATUS),
  age: z.number().int().min(8).max(99),
  heightCm: z.number().int().min(140).max(215),
  weightKg: z.number().int().min(40).max(160),
  weightClass: z.string().default(''),
  personality: z.string(),
  background: z.string(),
  speechStyle: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  goal: z.string(),
  catchphrase: z.string().default(''),
  stats: z.object({ technik: z.number(), kraft: z.number(), kondition: z.number(), disziplin: z.number() }).optional(),
  record: z.object({ siege: z.number().int(), niederlagen: z.number().int(), unentschieden: z.number().int() }).default({ siege: 0, niederlagen: 0, unentschieden: 0 }),
  voice: z.object({
    elevenlabsVoiceId: z.string().default(''),
    openaiVoice: z.string().default('onyx'),
    instructions: z.string().default(''),
    /** Tonhöhe der Demo-„Brabbelstimme“, falls keine echte TTS konfiguriert ist */
    demoPitch: z.number().default(1),
    /** ElevenLabs-Modell dieser Stimme (leer = Standard aus .env) */
    elevenlabsModel: z.string().default(''),
    /** Etablierte Stimme: Änderung nur mit ausdrücklicher Bestätigung */
    locked: z.boolean().default(false),
    note: z.string().default(''),
  }),
  look: CharacterLookSchema,
  /** Folge, in der die Figur erstmals vorkam (null = noch nie gezeigt) */
  firstEpisode: z.number().int().nullable().default(null),
  /** Sobald eine Figur veröffentlicht wurde, ist ihr Aussehen gesperrt. */
  lookLocked: z.boolean().default(false),
  lookHistory: z.array(z.object({ episode: z.number().int(), reason: z.string() })).default([]),
  conceptImage: z.string().default(''),
  notes: z.string().default(''),
});
export type Character = z.infer<typeof CharacterSchema>;

/* --------------------------------------------------------------------- Orte */

export const LOCATION_KEYS = ['halle', 'ring', 'empfang', 'buero', 'umkleide', 'strasse', 'eventhalle', 'rivalengym'] as const;
export const LocationSchema = z.object({
  id: z.enum(LOCATION_KEYS),
  name: z.string(),
  description: z.string(),
  unlocked: z.boolean(),
});
export type Location = z.infer<typeof LocationSchema>;

/* ------------------------------------------------------------------ Verein */

export const EquipmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  count: z.number().int().min(0),
  condition: z.number().min(0).max(100),
});

export const FightSchema = z.object({
  id: z.string(),
  episode: z.number().int(),
  boxerId: z.string(),
  opponent: z.string(),
  opponentClub: z.string(),
  event: z.string(),
  result: z.enum(['sieg', 'niederlage', 'unentschieden', 'abgesagt']),
  method: z.string().default(''),
});

export const DecisionOptionSchema = z.object({
  key: z.enum(['A', 'B', 'C']),
  label: z.string(),
  consequenceHint: z.string().default(''),
  /** Maschinenlesbarer Plan, den der Demo-Generator versteht, z. B. "verpflichten:emre-yildiz" */
  plan: z.string().default(''),
});

export const DecisionSchema = z.object({
  id: z.string(),
  episode: z.number().int(),
  question: z.string(),
  options: z.array(DecisionOptionSchema).min(2).max(3),
  status: z.enum(['offen', 'entschieden', 'umgesetzt']),
  winner: z.enum(['A', 'B', 'C']).nullable().default(null),
  votes: z.record(z.string(), z.number()).default({}),
  note: z.string().default(''),
  resolvedInEpisode: z.number().int().nullable().default(null),
});
export type Decision = z.infer<typeof DecisionSchema>;

export const StorylineSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.enum(['offen', 'abgeschlossen']),
  startedEpisode: z.number().int(),
  updates: z.array(z.object({ episode: z.number().int(), text: z.string() })),
});

export const ClubStateSchema = z.object({
  clubName: z.string(),
  city: z.string(),
  address: z.string(),
  founded: z.string(),
  money: z.number(),
  monthlyCosts: z.number(),
  monthlyIncome: z.number(),
  members: z.number().int().min(0),
  reputation: z.number().min(0).max(100),
  facilityCondition: z.number().min(0).max(100),
  equipment: z.array(EquipmentSchema),
  fights: z.array(FightSchema),
  rivalries: z.array(z.object({ id: z.string(), club: z.string(), leader: z.string(), intensity: z.number().min(0).max(10), since: z.number().int(), notes: z.string() })),
  sponsors: z.array(z.object({ name: z.string(), amountPerMonth: z.number(), since: z.number().int() })),
  storylines: z.array(StorylineSchema),
  decisions: z.array(DecisionSchema),
  chapter: z.string(),
  timeline: z.array(z.object({ episode: z.number().int(), text: z.string() })),
  lastEpisode: z.number().int(),
  nextEpisodeNote: z.string().default(''),
  /** Anstehende Veranstaltung (z. B. Kampfabend) inkl. Community-Sitzplätzen */
  upcomingEvent: z.object({
    name: z.string(),
    locationId: z.string(),
    kind: z.string(),
    boxerId: z.string(),
    seats: z.number().int(),
    seatsFilled: z.number().int(),
    daysLeft: z.number().int(),
    cost: z.number(),
    announcedEpisode: z.number().int(),
    note: z.string().default(''),
  }).nullable().default(null),
});
export type ClubState = z.infer<typeof ClubStateSchema>;

/* --------------------------------------------------------- Zustandsänderungen */

/**
 * Jede Veränderung am Verein läuft über eine solche Operation. Sie wird beim
 * Veröffentlichen einer Folge angewendet und in der Folge protokolliert.
 */
export const STATE_OPS = [
  'geld', 'mitglieder', 'ruf', 'zustand_halle', 'figur_status', 'ausruestung', 'ausruestung_zustand',
  'kampf', 'rivalitaet', 'handlung', 'sponsor', 'ort_freischalten', 'kapitel', 'laufende_kosten', 'einnahmen', 'veranstaltung', 'plaetze', 'countdown',
] as const;
export const StateChangeSchema = z.object({
  op: z.enum(STATE_OPS),
  /** Zahlwert (Euro, Delta, Anzahl …) */
  amount: z.number().default(0),
  /** Figur, Ausrüstungs-ID, Orts-ID, Handlungsstrang-ID … */
  target: z.string().default(''),
  /** neuer Status / Name / Text */
  value: z.string().default(''),
  reason: z.string().default(''),
});
export type StateChange = z.infer<typeof StateChangeSchema>;

/* ---------------------------------------------------------------- Episoden */

export const EMOTIONS = ['neutral', 'froh', 'wuetend', 'traurig', 'ueberrascht', 'entschlossen', 'verlegen', 'stolz'] as const;
export const ACTIONS = ['keine', 'zeigen', 'schlagen', 'arme_verschraenkt', 'kopfschuetteln', 'jubeln', 'seufzen', 'auftritt', 'pratzen', 'achselzucken', 'nicken', 'faust_heben'] as const;
export const SHOTS = ['totale', 'halbnah', 'nah', 'schwenk', 'zoom', 'dolly'] as const;
export const BEATS = ['einstieg', 'vorstellung', 'handlung', 'entwicklung', 'entscheidung'] as const;
export const POSITIONS = ['ganz_links', 'links', 'mitte', 'rechts', 'ganz_rechts'] as const;
export const MUSIC = ['aufbruch', 'spannung', 'gefuehl', 'training', 'komisch'] as const;
export const SFX = ['glocke', 'schlag', 'sandsack', 'tuer', 'kasse', 'muenzen', 'whoosh', 'publikum', 'pfiff', 'telefon', 'kratzer', 'trommelwirbel', 'stempel'] as const;

export const LineSchema = z.object({
  id: z.string(),
  /** Figur-ID oder "erzaehler" */
  speaker: z.string(),
  text: z.string().min(1),
  emotion: z.enum(EMOTIONS).default('neutral'),
  action: z.enum(ACTIONS).default('keine'),
  sfx: z.enum(SFX).nullable().default(null),
  /** zusätzliche Pause nach der Zeile in Sekunden */
  pauseAfter: z.number().min(0).max(3).default(0.25),
  audio: z
    .object({ file: z.string(), durationSec: z.number(), provider: z.string() })
    .nullable()
    .default(null),
});
export type Line = z.infer<typeof LineSchema>;

export const SceneSchema = z.object({
  id: z.string(),
  beat: z.enum(BEATS),
  location: z.enum(LOCATION_KEYS),
  shot: z.enum(SHOTS),
  cast: z.array(z.object({
    characterId: z.string(), position: z.enum(POSITIONS), facing: z.enum(['links', 'rechts']).default('rechts'),
    /** Daueraktion, solange die Figur nicht spricht (z. B. Sandsack schlagen) */
    action: z.enum(ACTIONS).default('keine'),
  })),
  lines: z.array(LineSchema).min(1),
  /** Einblendung, z. B. „KONTOSTAND: 500 €“ */
  overlay: z.string().default(''),
  music: z.enum(MUSIC).default('aufbruch'),
  /** Regieanweisung (nur zur Info) */
  direction: z.string().default(''),
  /** Arena-Sitzplätze in dieser Szene: von → bis (animiert); null = keine Anzeige */
  seats: z.object({ from: z.number(), to: z.number(), total: z.number().default(100), hud: z.boolean().default(true) }).nullable().default(null),
});
export type Scene = z.infer<typeof SceneSchema>;

export const EPISODE_STATUS = ['entwurf', 'vertont', 'gerendert', 'veroeffentlicht'] as const;

export const EpisodeSchema = z.object({
  id: z.string(),
  number: z.number().int().min(1),
  title: z.string(),
  status: z.enum(EPISODE_STATUS),
  createdAt: z.string(),
  publishedAt: z.string().nullable().default(null),
  generator: z.string(),
  userIdeas: z.string().default(''),
  /** Entscheidung der Community, die diese Folge umsetzt */
  resolvesDecisionId: z.string().nullable().default(null),
  hook: z.string(),
  summary: z.string(),
  scenes: z.array(SceneSchema).min(1),
  decision: z.object({ question: z.string(), options: z.array(DecisionOptionSchema).min(2).max(3) }),
  cliffhanger: z.string().default(''),
  stateChanges: z.array(StateChangeSchema).default([]),
  newCharacterIds: z.array(z.string()).default([]),
  socialCaption: z.string().default(''),
  hashtags: z.array(z.string()).default([]),
  /** Endtafel: klassische Abstimmung oder Arena-/Follower-Aufruf */
  endCard: z.object({
    type: z.enum(['abstimmung', 'arena']),
    headline: z.string().default(''),
    lines: z.array(z.string()).default([]),
    seatsFilled: z.number().default(0),
    seatsTotal: z.number().default(100),
  }).default({ type: 'abstimmung', headline: '', lines: [], seatsFilled: 0, seatsTotal: 100 }),
  video: z.object({ file: z.string(), poster: z.string(), renderedAt: z.string(), durationSec: z.number() }).nullable().default(null),
});
export type Episode = z.infer<typeof EpisodeSchema>;
/** Eingabeform (Defaults optional) – für handgeschriebene Drehbücher */
export type EpisodeInput = z.input<typeof EpisodeSchema>;

export const LocationsSchema = z.array(LocationSchema);
export const CharactersSchema = z.array(CharacterSchema);
