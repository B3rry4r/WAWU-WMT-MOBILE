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

/** The subtitle file's name: the recording's name with `.srt` in place of its type. */
export function subtitleFileName(recording: string): string {
  const dot = recording.lastIndexOf('.');
  const stem = (dot > 0 ? recording.slice(0, dot) : recording).replace(/[^A-Za-z0-9 _-]+/g, '').trim();
  return `${stem || 'subtitles'}.srt`;
}
