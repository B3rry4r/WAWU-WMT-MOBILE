import { formatPointsCount } from '@/components/PointsFigure';

import { isDrawnTool } from './studioModel';
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
export type InputKind = 'text' | 'prompt' | 'file' | 'image' | 'video' | 'dialogue' | 'podcast' | 'chat';
/** `image` (Make an image, Edit a photo) and `video` (Make a video, Talking photo) are POINTS-14 and POINTS-15's kinds; `dialogue`, `podcast` and `chat` (the Receptionist) are POINTS-16, POINTS-18 and POINTS-12's. */
export const inputKindOf = (tool: Pick<AiTool, 'input'>): InputKind =>
  tool.input.kind === 'prompt'
    ? 'prompt'
    : tool.input.kind === 'file'
      ? 'file'
      : tool.input.kind === 'image'
        ? 'image'
        : tool.input.kind === 'video'
          ? 'video'
          : tool.input.kind === 'dialogue'
            ? 'dialogue'
            : tool.input.kind === 'podcast'
              ? 'podcast'
              : tool.input.kind === 'chat'
                ? 'chat'
                : 'text';

/**
 * What a tool's screen can run: the app has its screen, and the Hub lists it as on with a limit for what it takes. A tool that reads
 * words aloud also needs the characters that make a minute and voices to pick from; a tool that takes a description is a flat price (a
 * use, a track), with no voices and no length.
 */
export function toolReady(tool: AiTool | undefined): tool is AiTool {
  if (!tool || !tool.enabled || !isDrawnTool(tool)) return false;
  // A tool that takes the person's recording has no text to limit: it needs the Hub's rule for the file (its types, bytes and minutes).
  if (inputKindOf(tool) === 'file') {
    const rule = tool.input.file;
    return Boolean(rule && rule.maxBytes > 0 && rule.maxMinutes > 0 && (rule.accepts.audio.length > 0 || rule.accepts.video.length > 0));
  }
  // A Talking photo has no words to limit (a photo and a voice); the picture and video tools describe what they make (the Hub's limit), and `isDrawnTool` held their other options.
  if (tool.id === 'talking-photo') return true;
  // The Receptionist is its own screen (set-up, what it knows, a chat): it needs only to be listed whole, which `isDrawnTool` held.
  if (inputKindOf(tool) === 'chat') return true;
  if (inputKindOf(tool) === 'dialogue') return tool.input.maxCharacters > 0 && tool.input.charactersPerUnit > 0 && tool.voices.length > 0;
  if (inputKindOf(tool) === 'podcast') return tool.input.maxCharacters > 0 && tool.voices.length > 0 && (tool.input.podcast?.durations.length ?? 0) > 0;
  if (!(tool.input.maxCharacters > 0)) return false;
  if (inputKindOf(tool) === 'image' || inputKindOf(tool) === 'video') return true;
  return inputKindOf(tool) === 'prompt' || (tool.input.charactersPerUnit > 0 && tool.voices.length > 0);
}

/**
 * The words of VoiceOver's four added parts (AITOOLS-07): "Your voice" and its agreement, the sample button, PT2b's Save and "Use in a
 * product" rows (their titles and lines are the board's), and the draft list no board draws. No provider name (R-68), no em-dash (R-5).
 */
export const EXTRAS_WORDS = {
  ownName: 'Your voice',
  ownLine: 'From your Voice Intro',
  playSample: (name: string) => `Play a sample of ${name}`,
  stopSample: (name: string) => `Stop the sample of ${name}`,
  consentLabel: 'You will read this first',
  consentNote: 'Only your own voice, and only for your VoiceOver. We make it for each one and take it away when it is done. You can take it back any time.',
  consentFailed: 'We could not save that',
  agree: 'I agree',
  notNow: 'Not now',
  removeVoice: 'Take my voice off VoiceOver',
  removed: 'Your voice is off VoiceOver.',
  removing: 'Your voice is off VoiceOver. We are still clearing the last copy.',
  removeFailed: 'We could not do that. Try again.',
  saveTitle: 'Save',
  saveLine: 'To your library',
  saveLabel: 'Save to your library',
  savedTitle: 'Saved',
  savedLine: 'In your library. Tap to take it out.',
  unsaveLabel: 'Saved to your library. Tap to take it out',
  saveFailedTitle: 'We could not save it',
  saveFailed: 'Try again in a moment.',
  useTitle: 'Use in a product',
  useLine: 'Attach to a draft',
  pickDraft: 'Pick a draft',
  loadingDrafts: 'Loading your drafts',
  draftsFailed: 'We could not load your drafts',
  draftsFailedBody: 'Check your connection and try again.',
  noDrafts: 'You have no drafts yet. Start one and come back.',
  startDraft: 'Start a draft',
  hasAudio: 'Has audio',
  attachTo: (title: string) => `Attach to ${title}`,
  attachFailedTitle: 'We could not attach it',
  attachFailed: 'Try again in a moment.',
  attached: (title: string) => `Attached to ${title}`,
  cancel: 'Cancel',
} as const;
