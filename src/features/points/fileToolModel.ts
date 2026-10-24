import { formatBytes } from '@/features/create/model';
import { extensionOfName } from '@/features/create/fileTypes';
import type { ChosenFile } from '@/features/create/chosen';

import type { AiTool } from './studioApi';

/** The copy of the file step (POINTS-10): no board draws it (G-POINTS-09-1), so it is PT2's words box with a choose-a-recording row where the text sits. Every figure is the Hub's or the person's. */
export const FILE_WORDS = {
  choose: 'Choose a recording',
  chooseAnother: 'Choose another',
  boxLabel: 'Recording',
  uploading: 'Uploading',
  checking: 'Checking the length',
  ready: 'Ready',
  pickFailedTitle: "That didn't open",
  pickFailedBody: 'Choose the recording again.',
  uploadFailedTitle: "That didn't upload",
  uploadFailedBody: 'Check your connection and choose it again.',
  tooLongTitle: 'That recording is too long',
  unreadableTitle: "We couldn't read that recording",
  transcript: 'Transcript',
  shareSubtitles: 'Share subtitles',
  shareFailed: 'The subtitles could not be shared. Try again.',
  shareTitle: 'Subtitles',
} as const;

/**
 * The copy of Dubbing's own parts (POINTS-11). No board draws the language rows or the subtitles card (G-POINTS-11-1); the words are the
 * tool's, with no outside name and no figure of the app's own: the languages are the Hub's list, the cost is the Hub's quote.
 */
export const DUB_WORDS = {
  /** The label over the rows, as "Voice" is over PT2's voice rows. */
  language: 'Language',
  /** The line under the label: what the choice means. */
  languageHint: 'The language you will hear it in',
  /** PT2a's line for a job that takes minutes: the board's "About a minute" would not be true. */
  workingBody: 'This can take a few minutes. You can leave this screen.',
  subtitles: 'Subtitles',
  noLanguages: 'No languages to choose from right now.',
} as const;

/** The mark the tool is known by in the Hub's list. */
export const DUBBING_TOOL_ID = 'dubbing';
export const isDubbing = (tool: Pick<AiTool, 'id'>): boolean => tool.id === DUBBING_TOOL_ID;

/** The languages a dub can be heard in: the Hub's own list (`input.file.dubbing.languages`), in the Hub's order. Nothing else is ever offered. */
export const dubLanguages = (tool: Pick<AiTool, 'input'>): { code: string; name: string }[] =>
  (tool.input.file?.dubbing?.languages ?? []).filter((l) => typeof l.code === 'string' && l.code !== '' && typeof l.name === 'string' && l.name.trim() !== '');

/** The name a person knows each type by. A type the Hub adds that is not here is named by its own subtype ("OGG"). */
const LABELS: Record<string, string> = {
  'audio/mpeg': 'MP3',
  'audio/wav': 'WAV',
  'audio/mp4': 'M4A',
  'audio/aac': 'AAC',
  'video/mp4': 'MP4',
  'video/quicktime': 'MOV',
  'video/webm': 'WEBM',
};
const labelOf = (contentType: string): string => LABELS[contentType] ?? (contentType.split('/')[1] ?? contentType).toUpperCase();

type FileRule = NonNullable<AiTool['input']['file']>;

/** Every type the tool takes, the Hub's list: audio first, then video. */
export const acceptedTypes = (rule: FileRule): string[] => [...rule.accepts.audio, ...rule.accepts.video];

/** "MP3, WAV, M4A, AAC, MP4, MOV or WEBM". */
export function typesLine(rule: FileRule): string {
  const names = acceptedTypes(rule).map(labelOf);
  return names.length <= 1 ? names.join('') : `${names.slice(0, -1).join(', ')} or ${names[names.length - 1]}`;
}

/** The line under the row, all from the Hub's rule: "MP3, WAV or MP4. Up to 500 MB and 60 minutes." */
export const limitsLine = (rule: FileRule): string => `${typesLine(rule)}. Up to ${formatBytes(rule.maxBytes)} and ${rule.maxMinutes} minute${rule.maxMinutes === 1 ? '' : 's'}.`;

/** Other names a phone or a browser gives the same audio (`audio/x-m4a`, `audio/m4a`); the Hub's list is in its own names. */
const ALIASES: Record<string, string> = { 'audio/x-m4a': 'audio/mp4', 'audio/m4a': 'audio/mp4', 'audio/x-aac': 'audio/aac', 'audio/aacp': 'audio/aac', 'video/x-quicktime': 'video/quicktime' };
const BY_EXTENSION: Record<string, string> = { m4a: 'audio/mp4', aac: 'audio/aac', webm: 'video/webm', mp3: 'audio/mpeg', wav: 'audio/wav', mp4: 'video/mp4', mov: 'video/quicktime' };

/** What the Hub calls the chosen file's type: what the picker said, tidied, else what its name says. */
export function typeOfRecording(file: Pick<ChosenFile, 'name' | 'contentType'>): string {
  const reported = (file.contentType ?? '').toLowerCase().split(';')[0].trim();
  const tidy = ALIASES[reported] ?? reported;
  if (!tidy || tidy === 'application/octet-stream') return BY_EXTENSION[extensionOfName(file.name)] ?? tidy;
  return tidy;
}

/** The sentence for a chosen file the Hub's rule would refuse, or null when it fits. The Hub checks again; this stops the person at the edge in the Hub's own numbers. */
export function refusalFor(file: Pick<ChosenFile, 'name' | 'contentType'> & { blob: { size: number } }, rule: FileRule): string | null {
  if (!acceptedTypes(rule).includes(typeOfRecording(file))) return `That file type is not accepted here. Choose ${typesLine(rule)}.`;
  if (file.blob.size === 0) return 'That file is empty. Choose another.';
  if (file.blob.size > rule.maxBytes) return `That file is over the ${formatBytes(rule.maxBytes)} limit.`;
  return null;
}

/** The Hub's private folder for the file's kind: audio or video. */
export const folderFor = (contentType: string, rule: FileRule): string => (rule.accepts.video.includes(contentType) ? rule.folders.video : rule.folders.audio);

/** The subtitle file's name: the recording's name with `.srt` (Captions) or `.vtt` (Dubbing's WebVTT) in place of its type. */
export function subtitleFileName(recording: string, extension: 'srt' | 'vtt' = 'srt'): string {
  const dot = recording.lastIndexOf('.');
  const stem = (dot > 0 ? recording.slice(0, dot) : recording).replace(/[^A-Za-z0-9 _-]+/g, '').trim();
  return `${stem || 'subtitles'}.${extension}`;
}

/** "0:04", "1:02:03": where a subtitle starts. */
function clockOf(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  const h = Math.floor(whole / 3600);
  const m = Math.floor((whole % 3600) / 60);
  const s = whole % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
}

/** `00:01:02.500` or `01:02.500` (WebVTT) or `00:01:02,500` (SRT) as seconds, or null when it is not a time. */
function secondsOf(stamp: string): number | null {
  const m = /^(?:(\d+):)?(\d{1,2}):(\d{2})(?:[.,](\d{1,3}))?$/.exec(stamp.trim());
  if (!m) return null;
  return Number(m[1] ?? 0) * 3600 + Number(m[2]) * 60 + Number(m[3]);
}

export type Cue = { at: string; text: string };

/**
 * The lines of a WebVTT file (or an SRT) as the person reads them: where each starts and what is said. The header, notes and styles, the
 * cue's own name and its markup are left out; a block with no time or no words is skipped. The file itself is what is shared, untouched.
 */
export function readCues(vtt: string): Cue[] {
  const cues: Cue[] = [];
  for (const block of vtt.replace(/\r\n?/g, '\n').split(/\n{2,}/)) {
    const lines = block.split('\n').map((l) => l.trim());
    const at = lines.findIndex((l) => l.includes('-->'));
    if (at === -1) continue;
    const start = secondsOf(lines[at].split('-->')[0]);
    const text = lines
      .slice(at + 1)
      .map((l) => l.replace(/<[^>]*>/g, '').trim())
      .filter((l) => l !== '')
      .join(' ');
    if (start === null || text === '') continue;
    cues.push({ at: clockOf(start), text });
  }
  return cues;
}
