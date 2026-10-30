import type { ChosenFile } from '@/features/create/chosen';

import { acceptedTypes, typeOfRecording } from './fileToolModel';
import { photoRuleOf } from './mediaToolModel';
import type { AiTool } from './studioApi';
import { isDrawnTool } from './studioModel';
import { inputKindOf, toolReady } from './voiceoverModel';
import { hasResult, type VoiceJob } from './voiceoverApi';

/**
 * Studio's home (STUDIO-HOME, R-113): one prompt box, the prompt tools as chips, a grid of the main tools with More, and the person's Recent
 * results. Everything here is read from what the Hub lists (R-47): a chip, a tile or a More row exists only for a tool the Hub lists and
 * the app can run, and every name, cost and description that is not the short label of a tile is the Hub's.
 */
export const HOME_WORDS = {
  title: 'What would you like to make?',
  make: 'Make',
  attach: 'Add a file',
  attachPhoto: 'Photo',
  attachVideo: 'Video',
  attachAudio: 'Audio',
  removeFile: 'Remove the file',
  more: 'More',
  moreMenu: 'More tools',
  recent: 'Recent',
  recentEmpty: 'Nothing made yet. What you make shows up here.',
  recentFailed: "We couldn't load what you made.",
  voiceMenu: 'Choose a voice',
  pickFailed: "That didn't open. Choose the file again.",
  /** The box's name for a screen reader. */
  boxLabel: 'What to make',
} as const;

/** A chip: the prompt tools the Hub lists, in this order. Speech is the Hub's VoiceOver. */
const PROMPT_CHIPS: readonly { id: string; label: string; placeholder: string }[] = [
  { id: 'image', label: 'Image', placeholder: 'Describe a picture' },
  { id: 'video', label: 'Video', placeholder: 'Describe a short clip' },
  { id: 'voiceover', label: 'Speech', placeholder: 'Type what to say' },
  { id: 'music', label: 'Music', placeholder: 'Describe a song' },
  { id: 'sound-effect', label: 'Sound effect', placeholder: 'Describe a sound' },
];

/** What to type once a file is in the box: the chips are then tools that take that file, and the words are what to do with it. */
export const FILE_PLACEHOLDER = 'Say what you want done (optional)';

/** The file tools a chip can name once a file is attached, in this order, with the short label of the chip. */
const FILE_CHIPS: readonly { id: string; label: string }[] = [
  { id: 'photo-edit', label: 'Edit a photo' },
  { id: 'talking-photo', label: 'Talking photo' },
  { id: 'voice-changer', label: 'Voice changer' },
  { id: 'video-music', label: 'Music for a video' },
  { id: 'stems', label: 'Split a song' },
  { id: 'dubbing', label: 'Dubbing' },
  { id: 'captions', label: 'Captions' },
  { id: 'clean-audio', label: 'Clean audio' },
];

/** The grid's tools in order, with the one or two words under each tile. The rest the Hub lists are in More, by the Hub's own names. */
const MAIN_TILES: readonly { id: string; label: string }[] = [
  { id: 'voiceover', label: 'Speech' },
  { id: 'music', label: 'Music' },
  { id: 'image', label: 'Image' },
  { id: 'video', label: 'Video' },
  { id: 'dubbing', label: 'Dubbing' },
  { id: 'talking-photo', label: 'Talking photo' },
  { id: 'voice-changer', label: 'Voice changer' },
];

export type Chip = { id: string; label: string; placeholder: string };
export type Tile = { tool: AiTool; label: string };

/** The tools the Hub lists and the app can draw (R-47), in the Hub's order. A listed tool that is switched off is still drawn, dimmed, as Studio always drew it. */
export const drawnList = (tools: readonly AiTool[]): AiTool[] => tools.filter(isDrawnTool);
const byId = (tools: readonly AiTool[], id: string): AiTool | undefined => tools.find((t) => t.id === id);

/** The prompt chips: only tools the Hub lists, enabled and whole (a chip that cannot run would be a dead control). */
export function promptChips(tools: readonly AiTool[]): Chip[] {
  const out: Chip[] = [];
  for (const chip of PROMPT_CHIPS) {
    const tool = byId(tools, chip.id);
    if (tool && toolReady(tool) && isPromptTool(tool)) out.push(chip);
  }
  return out;
}

/** True for a tool the words in the box can drive: the Hub says it takes words (speech) or a description (sound, track, picture, clip). */
export const isPromptTool = (tool: Pick<AiTool, 'id' | 'input'>): boolean => {
  const kind = inputKindOf(tool as AiTool);
  return kind === 'text' || kind === 'prompt' || kind === 'image' || kind === 'video';
};

/** The tiles of the grid (the main tools the Hub lists) and the rows of More (every other drawn tool). With nothing for More, there is no More tile. */
export function homeTools(tools: readonly AiTool[]): { tiles: Tile[]; more: AiTool[] } {
  const drawn = drawnList(tools);
  const tiles: Tile[] = [];
  for (const main of MAIN_TILES) {
    const tool = byId(drawn, main.id);
    if (tool) tiles.push({ tool, label: main.label });
  }
  const shown = new Set(tiles.map((t) => t.tool.id));
  return { tiles, more: drawn.filter((t) => !shown.has(t.id)) };
}

/** What a file in the box is: a photo, a video or audio. Anything else is not taken here. */
export type AttachKind = 'photo' | 'video' | 'audio';

/** The content types a tool takes for one kind of file, from the Hub's own rule for it. */
export function typesFor(tool: AiTool, kind: AttachKind): string[] {
  if (kind === 'photo') return photoRuleOf(tool)?.accepts ?? [];
  const rule = tool.input.file;
  if (!rule) return [];
  return acceptedTypes(rule).filter((t) => t.startsWith(`${kind}/`));
}

/** The kinds of file the "+" can take: those some ready file tool takes (nothing is offered that no tool would use, R-47). */
export function attachKinds(tools: readonly AiTool[]): AttachKind[] {
  const ready = tools.filter((t) => toolReady(t) && FILE_CHIPS.some((c) => c.id === t.id));
  return (['photo', 'video', 'audio'] as const).filter((kind) => ready.some((t) => typesFor(t, kind).length > 0));
}

/** The types the picker for one kind opens with: the union of what the ready tools take. */
export function pickTypes(tools: readonly AiTool[], kind: AttachKind): string[] {
  const all = new Set<string>();
  for (const t of tools) if (toolReady(t) && FILE_CHIPS.some((c) => c.id === t.id)) typesFor(t, kind).forEach((type) => all.add(type));
  return [...all];
}

/** What a chosen file is, by its type (a photo's `image/*`, a clip's `video/*`, a recording's `audio/*`), or null. */
export function kindOfFile(file: Pick<ChosenFile, 'name' | 'contentType'>): AttachKind | null {
  const type = typeOfRecording(file);
  if (type.startsWith('image/')) return 'photo';
  if (type.startsWith('video/')) return 'video';
  if (type.startsWith('audio/')) return 'audio';
  return null;
}

/** The chips for a file in the box: the ready tools whose rule takes this file's type. */
export function fileChips(tools: readonly AiTool[], file: Pick<ChosenFile, 'name' | 'contentType'>): Chip[] {
  const type = typeOfRecording(file);
  const kind = kindOfFile(file);
  const out: Chip[] = [];
  for (const chip of FILE_CHIPS) {
    const tool = byId(tools, chip.id);
    if (tool && kind && toolReady(tool) && typesFor(tool, kind).includes(type)) out.push({ ...chip, placeholder: FILE_PLACEHOLDER });
  }
  return out;
}

/** The round chip beside "+" for Speech: the first letter of the voice's name. */
export const voiceInitial = (name: string): string => Array.from(name.trim())[0]?.toUpperCase() ?? '';

/** True when "Make" has something to open the tool with: words for a prompt tool, or a file for a file tool. */
export function canMake(chip: Chip | undefined, text: string, file: ChosenFile | null): boolean {
  if (!chip) return false;
  if (file) return true;
  return text.trim().length > 0;
}

/** How a Recent card is drawn: a picture, a clip, a waveform or a transcript. The Hub gives no frame of a clip, so a clip is a glyph on a tile. */
export type RecentLook = { kind: 'image'; url: string } | { kind: 'video' } | { kind: 'audio'; bars: number[] } | { kind: 'text' };

/** The bar heights (0 to 1) of a card's waveform: decorative, from the job's id so the same card always looks the same. */
export function barsFor(id: string, count = 18): number[] {
  let seed = 7;
  for (const ch of id) seed = (seed * 31 + ch.charCodeAt(0)) % 2147483647;
  const bars: number[] = [];
  for (let i = 0; i < count; i += 1) {
    seed = (seed * 48271) % 2147483647;
    bars.push(0.25 + (seed % 1000) / 1000 * 0.75);
  }
  return bars;
}

export function recentLook(job: Pick<VoiceJob, 'id' | 'audioUrl' | 'outputs'>): RecentLook {
  const outputs = job.outputs ?? [];
  const image = outputs.find((o) => o.kind === 'image' && o.url);
  if (image?.url) return { kind: 'image', url: image.url };
  if (outputs.some((o) => o.kind === 'video' && o.url)) return { kind: 'video' };
  if (job.audioUrl || outputs.some((o) => o.kind === 'audio' && o.url)) return { kind: 'audio', bars: barsFor(job.id) };
  return { kind: 'text' };
}

/** The person's last results, newest first, up to ten: finished jobs of a tool the app draws (a job of a tool it cannot open would lead nowhere). */
export function recentResults(jobs: readonly VoiceJob[], tools: readonly AiTool[], limit = 10): VoiceJob[] {
  const drawn = new Set(drawnList(tools).map((t) => t.id as string));
  return jobs.filter((j) => j.state === 'done' && hasResult(j) && drawn.has(j.tool)).slice(0, limit);
}

/** The words under a Recent card: the tile's short label when the tool has one, else the Hub's name. */
export function recentLabel(job: Pick<VoiceJob, 'tool'>, tools: readonly AiTool[]): string {
  const main = MAIN_TILES.find((m) => m.id === job.tool);
  return main?.label ?? byId(tools, job.tool)?.name ?? '';
}
