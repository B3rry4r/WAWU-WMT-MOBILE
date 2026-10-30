import { formatBytes } from '@/features/create/model';

import type { AiTool } from './studioApi';

/**
 * The words and the plain rules of the picture and video tools (POINTS-14, POINTS-15) and of every tool's done view (POINTS-13).
 * No board draws them: they are PT2's frame and parts (R-29). Every figure is the Hub's (the tool's options, the quote) and no outside
 * name is in any line (R-68). No em-dash anywhere (R-5).
 */
export const MEDIA_WORDS = {
  boxLabel: 'Description',
  placeholder: 'Describe what you want',
  shape: 'Shape',
  length: 'Length',
  photo: 'Photo',
  voice: 'Voice',
  photoOptional: 'Optional. The clip starts from this photo.',
  photoNeeded: 'The face that will speak.',
  choosePhoto: 'Choose a photo',
  takePhoto: 'Take a photo',
  changePhoto: 'Change photo',
  removePhoto: 'Remove photo',
  photoUploading: 'Uploading',
  photoReady: 'Ready',
  cameraOffTitle: 'The camera is off for this app',
  cameraOff: 'Choose a photo from your library instead.',
  removeVoice: 'Remove voice',
  photoPickFailedTitle: "We couldn't open that photo",
  photoPickFailedBody: 'Choose another photo.',
  photoUploadFailedTitle: "That photo didn't upload",
  photoUploadFailedBody: 'Check your connection and try again.',
  photoRefusedTitle: "That photo can't be used",
  voiceChooseFile: 'Choose a recording',
  voiceUseResult: 'Use a voice result',
  voiceChanged: 'Change voice',
  voiceUploading: 'Uploading',
  voiceChecking: 'Checking the length',
  voiceNoResults: 'You have no voice results yet.',
  voiceResultsFailed: "We couldn't load your results. Try again.",
  voicePickResult: 'Pick a result',
  voiceRefusedTitle: "That voice can't be used",
  voiceFailedBody: 'Try again.',
  original: 'Your photo',
  viewLarger: 'View larger',
  closeLarger: 'Close',
  workingLong: 'This takes a few minutes. You can leave this screen. We will tell you when it is ready.',
  videoUnavailable: "This video can't play here.",
  playVideo: (name: string) => `Play ${name}`,
  seconds: (n: number) => `${n} second${n === 1 ? '' : 's'}`,
  speechLine: (seconds: number) => `Your voice runs ${seconds} second${seconds === 1 ? '' : 's'}`,
  photoNote: (name: string, bytes: number) => `${name}, ${formatBytes(bytes)}`,
} as const;

/** The done view of every tool: "Make it a piece" first and big, Save, "Use in a product", and a quiet Download (POINTS-13, R-109). */
export const RESULT_WORDS = {
  pieceTitle: 'Make it a piece',
  pieceLine: (format: string) => `Into Create, as ${/^[aeiou]/i.test(format) ? 'an' : 'a'} ${format}`,
  pieceWorking: 'Getting it ready',
  piecePickTitle: 'Which one?',
  pieceFailedTitle: "We couldn't open it in Create",
  pieceFailed: 'Try again in a moment.',
  pieceCancel: 'Cancel',
  download: 'Download',
  downloadPick: 'Download which one?',
  downloading: (share: number | null) => (share === null ? 'Downloading' : `Downloading ${Math.round(share * 100)}%`),
  cancel: 'Cancel',
  downloadFailedTitle: "We couldn't download that",
  downloadFailed: 'Check your connection and try again.',
  photosOffTitle: "We can't save to your photos",
  photosOff: "Allow photos for this app in your phone's settings, then try again.",
  savedToPhotos: 'Saved to your photos.',
  started: 'Your download has started.',
} as const;

/** What a shape reads as. The Hub lists ratios ("1:1"); a person reads Square, Portrait, Tall, Wide. A ratio this map does not know is shown as the ratio. */
const SHAPE_NAMES: Record<string, string> = { '1:1': 'Square', '4:5': 'Portrait', '9:16': 'Tall', '16:9': 'Wide' };
export const shapeName = (shape: string): string => SHAPE_NAMES[shape] ?? shape;

const TYPE_NAMES: Record<string, string> = { 'image/jpeg': 'JPG', 'image/png': 'PNG', 'image/webp': 'WEBP', 'audio/mpeg': 'MP3', 'audio/wav': 'WAV' };
/** "JPG, PNG or WEBP": the Hub's list of content types, in words. */
export function typeNames(types: readonly string[]): string {
  const names = types.map((t) => TYPE_NAMES[t] ?? t.split('/')[1]?.toUpperCase() ?? t);
  return names.length <= 1 ? names.join('') : `${names.slice(0, -1).join(', ')} or ${names[names.length - 1]}`;
}

type PhotoRule = NonNullable<NonNullable<AiTool['input']['options']>['photo']>;
type SpeechRule = NonNullable<NonNullable<AiTool['input']['options']>['speech']>;

/** The line under the photo row before one is chosen: what the Hub takes. */
export const photoLimits = (rule: PhotoRule): string => `${typeNames(rule.accepts)}, up to ${formatBytes(rule.maxBytes)}`;

/** The sentence for a photo the Hub's rule would refuse, or null when it fits. The Hub checks again on the upload. */
export function photoRefusal(file: { contentType: string; bytes: number }, rule: PhotoRule): string | null {
  if (!rule.accepts.includes(file.contentType)) return `Choose a ${typeNames(rule.accepts)} photo.`;
  if (file.bytes > rule.maxBytes) return `That photo is over the ${formatBytes(rule.maxBytes)} limit.`;
  if (file.bytes === 0) return 'That photo is empty. Choose another.';
  return null;
}

/** The sentence for a recording the Hub's rule would refuse, or null. The length is the Hub's own reading, through the quote. */
export function speechRefusal(file: { contentType: string; bytes: number }, rule: SpeechRule): string | null {
  if (!rule.accepts.includes(file.contentType)) return `Choose an ${typeNames(rule.accepts)} recording.`;
  if (file.bytes === 0) return 'That recording is empty. Choose another.';
  return null;
}

/** The shape picked before the person picks one: the first the Hub lists. */
export const defaultShape = (tool: Pick<AiTool, 'input'>): string => tool.input.options?.shapes[0] ?? '';
export const shapesOf = (tool: Pick<AiTool, 'input'>): string[] => tool.input.options?.shapes ?? [];
export const lengthsOf = (tool: Pick<AiTool, 'input'>): number[] => tool.input.options?.lengths ?? [];
export const photoRuleOf = (tool: Pick<AiTool, 'input'>): PhotoRule | null => tool.input.options?.photo ?? null;
export const speechRuleOf = (tool: Pick<AiTool, 'input'>): SpeechRule | null => tool.input.options?.speech ?? null;
/** A talking photo speaks a voice; it takes no words. */
export const isTalking = (tool: Pick<AiTool, 'id'>): boolean => tool.id === 'talking-photo';
