import { formatPointsCount } from '@/components/PointsFigure';

import { isBuiltTool } from './studioModel';
import type { AiTool } from './studioApi';
import type { VoiceJob } from './voiceoverApi';

/** The copy of PT2, PT2a, PT2b and PT2c that is the design's own words. Every figure in a line is the Hub's, and no outside name is in any of it (R-68). */
export const TOOL_WORDS = {
  placeholder: 'Type or paste the words to speak',
  /** The box's name for a screen reader, by what it takes. */
  boxLabel: 'Words to speak',
  promptBoxLabel: 'Description',
  voice: 'Voice',
  run: 'Run',
  tryAgain: 'Try again',
  workingTitle: (name: string) => `Making your ${name}`,
  workingBody: 'About a minute. You can leave this screen.',
  failedTitle: "That didn't work",
  /** Said only when the Hub gave no sentence of its own: it makes no promise about the points. */
  failedBody: 'Try again.',
  refusedTitle: "That didn't start",
  unsentTitle: "That didn't go through",
  unsentBody: 'Check your connection and try again.',
  unreadableTitle: "We couldn't read this job",
  unreadableBody: 'Check your connection and try again.',
  loadFailed: "We couldn't load this tool",
  loadFailedBody: 'Check your connection and try again.',
  unavailableTitle: (name: string) => `${name} isn't available right now`,
  unavailableBody: 'Try again later.',
  costMoved: 'The cost changed. Check it, then run it again.',
} as const;

/** The words a person typed, counted as the Hub counts them: characters (not UTF-16 units) of the text with its ends trimmed. */
export const charactersOf = (text: string): number => Array.from(text.trim()).length;

/** Keeps at most `max` characters (whole characters, so an emoji is never cut in half). */
export function clampText(text: string, max: number): string {
  if (max <= 0) return text;
  const all = Array.from(text);
  return all.length <= max ? text : all.slice(0, max).join('');
}

/** Minutes billed for `characters`: the Hub's own sum (`ceil(characters / charactersPerUnit)`, at least 1), from the tool's `input` and nothing of the app's own. */
export function unitsFor(characters: number, charactersPerUnit: number): number {
  if (!(charactersPerUnit > 0)) return 0;
  return Math.max(1, Math.ceil(characters / charactersPerUnit));
}

/** "About 1 minute", "About 3 minutes". */
export const lengthLine = (units: number): string => `About ${units} minute${units === 1 ? '' : 's'}`;

/** "132 / 5,000". */
export const countLine = (characters: number, max: number): string => `${formatPointsCount(characters)} / ${formatPointsCount(max)}`;

/** "250 points used · 1,000 left"; just the first part until the Hub has told us the balance after. */
export function usedLine(job: Pick<VoiceJob, 'costPoints'>, balanceAfter: number | null): string {
  const used = `${formatPointsCount(job.costPoints)} points used`;
  return balanceAfter === null ? used : `${used} · ${formatPointsCount(balanceAfter)} left`;
}

/**
 * The failed banner: the Hub's sentence is the words ("That didn't work. No points were taken. Try again."). Its first sentence is the
 * title and the rest the body, as the board sets them. A sentence of one part is the body alone under the board's title. The app adds
 * no claim about the points: only the Hub's words say whether they came back.
 */
export function failedWords(message: string | null | undefined): { title: string; body: string } {
  const said = (message ?? '').trim();
  if (said === '') return { title: TOOL_WORDS.failedTitle, body: TOOL_WORDS.failedBody };
  const cut = said.search(/[.!?]\s/);
  if (cut === -1) return { title: TOOL_WORDS.failedTitle, body: said };
  return { title: said.slice(0, cut).replace(/[.!?]+$/, ''), body: said.slice(cut + 1).trim() };
}

/** What a tool takes in: the words to speak (`text`, the default of an entry that does not say), a description of a sound or track (`prompt`), or the person's own recording (`file`). */
export type InputKind = 'text' | 'prompt' | 'file';
export const inputKindOf = (tool: Pick<AiTool, 'input'>): InputKind => (tool.input.kind === 'prompt' ? 'prompt' : tool.input.kind === 'file' ? 'file' : 'text');

/**
 * What a tool's screen can run: the app has its screen, and the Hub lists it as on with a limit for what it takes. A tool that reads
 * words aloud also needs the characters that make a minute and voices to pick from; a tool that takes a description is a flat price (a
 * use, a track), with no voices and no length.
 */
export function toolReady(tool: AiTool | undefined): tool is AiTool {
  if (!tool || !tool.enabled || !isBuiltTool(tool)) return false;
  // A tool that takes the person's recording has no text to limit: it needs the Hub's rule for the file (its types, bytes and minutes).
  if (inputKindOf(tool) === 'file') {
    const rule = tool.input.file;
    const takes = Boolean(rule && rule.maxBytes > 0 && rule.maxMinutes > 0 && (rule.accepts.audio.length > 0 || rule.accepts.video.length > 0));
    // Dubbing also needs the languages the Hub lists: with none to choose from, there is nothing to run (POINTS-11).
    return tool.id === 'dubbing' ? takes && (rule?.dubbing?.languages.length ?? 0) > 0 : takes;
  }
  if (!(tool.input.maxCharacters > 0)) return false;
  return inputKindOf(tool) === 'prompt' || (tool.input.charactersPerUnit > 0 && tool.voices.length > 0);
}
