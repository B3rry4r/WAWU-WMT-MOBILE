import { formatPointsCount } from '@/components/PointsFigure';

import type { AiTool } from './studioApi';
import { charactersOf, clampText } from './voiceoverModel';

/**
 * The words and the plain rules of the voice, music and long-audio tools POINTS-16, POINTS-17 and POINTS-18 add (R-109): Voice changer,
 * Dialogue, Music for a video, Split a song, Audiobook and Podcast maker. No board draws them: each is PT2's frame and parts (R-29).
 * Every figure is the Hub's (the entry, the quote), no outside name is in any line (R-68) and there is no em-dash (R-5).
 */

/** What each of these tools' file step says where PT2 has its words box. The older file tools keep `FILE_WORDS`. */
export const FILE_STEP_WORDS: Record<string, { choose: string; chooseAnother: string; boxLabel: string; icon: 'AudioWaveform' | 'Video' }> = {
  'voice-changer': { choose: 'Choose a recording', chooseAnother: 'Choose another', boxLabel: 'Recording', icon: 'AudioWaveform' },
  'video-music': { choose: 'Choose a video', chooseAnother: 'Choose another', boxLabel: 'Video', icon: 'Video' },
  stems: { choose: 'Choose a song', chooseAnother: 'Choose another', boxLabel: 'Song', icon: 'AudioWaveform' },
};

/** Tools whose price is one use or one track whatever the length of the file: the cost line reads the Hub's quote and the length line says how long the file is. */
export const isFlatFileTool = (tool: Pick<AiTool, 'unit'>): boolean => tool.unit === 'use' || tool.unit === 'track';

export const MUSIC_WORDS = {
  moodLabel: 'Mood',
  moodBoxLabel: 'Mood of the music',
  moodPlaceholder: 'Optional. The feel you want, in a few words',
  /** The done view's one line: the Hub returns music only and never puts it on the video. */
  separate: 'This music is separate from your video. It is not put on the video.',
  partsLabel: 'Parts',
  parts: (n: number) => `${n} parts`,
  partsDone: 'Your parts',
  playPart: (name: string) => `Play ${name}`,
  pausePart: (name: string) => `Pause ${name}`,
  partPiece: (name: string) => `Make ${name} a piece`,
  recordLabel: 'Record',
  recordStop: 'Stop recording',
  recordAgain: 'Record again',
  recordingNow: 'Recording',
  recordRefusedTitle: 'The microphone is off for this app',
  recordRefused: "Allow the microphone for this app in your phone's settings, or choose a recording instead.",
  recordRefusedAsk: 'Allow the microphone to record, or choose a recording instead.',
  recordFailed: 'We could not record that',
  recordFailedBody: 'Try again.',
  recordInterrupted: 'The recording stopped when you left the app. It is kept.',
  playTake: 'your recording',
  cancelUpload: 'Cancel',
  cancelled: 'Stopped. Nothing was held.',
  orLine: 'or',
} as const;

/** Dialogue (POINTS-16). */
export const DIALOGUE_WORDS = {
  sceneLabel: 'Scene',
  line: (n: number) => `Line ${n}`,
  placeholder: 'What this voice says',
  boxLabel: (n: number) => `Words for line ${n}`,
  voiceChip: (n: number, name: string) => `Line ${n} voice, ${name}. Change voice`,
  removeLine: (n: number) => `Remove line ${n}`,
  addLine: 'Add a line',
  pickVoice: 'Voice',
  emptyLine: 'Every line needs words. Write something or take the line out.',
  tooManyVoices: (max: number) => `A scene can use up to ${max} different voices.`,
  tooLong: (max: number) => `A scene can have ${formatPointsCount(max)} characters in all.`,
  working: 'Making your scene',
} as const;

/** One line card of a scene. `id` is the card's own, so removing a line never moves another's words. */
export type SceneLine = { id: number; text: string; voiceId: string };

export const sceneCharacters = (lines: readonly SceneLine[]): number => lines.reduce((sum, l) => sum + charactersOf(l.text), 0);
export const sceneVoices = (lines: readonly SceneLine[]): Set<string> => new Set(lines.map((l) => l.voiceId));
/** True when every line has words and the scene has at least one line. */
export const sceneFilled = (lines: readonly SceneLine[]): boolean => lines.length > 0 && lines.every((l) => charactersOf(l.text) > 0);

/** Changing a line's words keeps the scene inside the Hub's characters: what does not fit is cut, and the reason is returned. */
export function writeLine(lines: readonly SceneLine[], id: number, text: string, max: number): { lines: SceneLine[]; note: string | null } {
  const others = lines.reduce((sum, l) => (l.id === id ? sum : sum + charactersOf(l.text)), 0);
  const room = Math.max(0, max - others);
  const fits = charactersOf(text) <= room;
  const next = fits ? text : clampText(text, room + (text.length - text.trim().length));
  return { lines: lines.map((l) => (l.id === id ? { ...l, text: next } : l)), note: fits ? null : DIALOGUE_WORDS.tooLong(max) };
}

/** A new line takes the next voice not yet in the scene (so a scene starts with a conversation), or the last line's voice once the scene is at the Hub's most voices. */
export function nextVoice(lines: readonly SceneLine[], voices: readonly { id: string }[], maxVoices: number): string {
  const used = sceneVoices(lines);
  if (used.size < maxVoices) {
    const fresh = voices.find((v) => !used.has(v.id));
    if (fresh) return fresh.id;
  }
  return lines[lines.length - 1]?.voiceId ?? voices[0]?.id ?? '';
}

/** The reason a line cannot have this voice (the scene would pass the Hub's most voices), or null. */
export function voiceProblem(lines: readonly SceneLine[], id: number, voiceId: string, maxVoices: number): string | null {
  const used = sceneVoices(lines.filter((l) => l.id !== id));
  return !used.has(voiceId) && used.size >= maxVoices ? DIALOGUE_WORDS.tooManyVoices(maxVoices) : null;
}

/** Podcast maker (POINTS-18). */
export const PODCAST_WORDS = {
  source: 'Source',
  text: 'Text',
  link: 'Link',
  textPlaceholder: 'Paste or type what the podcast is about',
  textBoxLabel: 'What the podcast is about',
  linkLabel: 'Web page',
  linkPlaceholder: 'https://',
  hosts: 'Hosts',
  oneHost: 'One host',
  twoHosts: 'Two hosts',
  hostVoice: (n: number, two: boolean) => (two ? `Host ${n} voice` : 'Voice'),
  length: 'Length',
  language: 'Language',
  duration: { short: 'Short', standard: 'Standard', long: 'Long' } as const,
  linkNotHttps: 'Use a link that starts with https://.',
  linkTooLong: (max: number) => `A link can be ${formatPointsCount(max)} characters at most.`,
  linkHasLogin: 'Use the page’s plain link, without a name or password in it.',
  sameVoice: 'Two hosts need two different voices.',
  workingBody: 'This can take a few minutes. You can leave this screen. We will tell you when it is ready.',
} as const;

/** The reason a typed link cannot be used, or null when it can. A link must be an https address; the Hub never opens it, so the words are all the app can check. */
export function linkProblem(raw: string, maxChars: number): string | null {
  const link = raw.trim();
  if (link === '') return null;
  if (!/^https:\/\//i.test(link)) return PODCAST_WORDS.linkNotHttps;
  if (Array.from(link).length > maxChars) return PODCAST_WORDS.linkTooLong(maxChars);
  if (/^https:\/\/[^/?#]*@/i.test(link)) return PODCAST_WORDS.linkHasLogin;
  if (!/^https:\/\/[^/?#\s]+\.[^/?#\s]+/i.test(link)) return PODCAST_WORDS.linkNotHttps;
  return null;
}

/** Audiobook (POINTS-18). */
export const BOOK_WORDS = {
  placeholder: 'Paste or type your text',
  boxLabel: 'Text of the audiobook',
  chooseFile: 'Choose a text file',
  fileLine: (name: string, chars: number) => `${name}, ${formatPointsCount(chars)} characters`,
  notText: 'Choose a plain text file, one that ends in .txt.',
  empty: 'That file has no words in it. Choose another.',
  tooLong: (chars: number, max: number) => `That file has ${formatPointsCount(chars)} characters. The most is ${formatPointsCount(max)}.`,
  tooBig: (max: number) => `That file is too big. The most is ${formatPointsCount(max)} characters.`,
  pickFailedTitle: "That didn't open",
  pickFailedBody: 'Choose the file again.',
  refusedTitle: "That file can't be used",
  workingBody: 'This can take a few minutes. You can leave this screen. We will tell you when it is ready.',
} as const;

/** The text a chosen file fills the box with, or the sentence that refuses it. The Hub counts characters; the file's bytes are not the count. */
export function textFileProblem(file: { name: string; mimeType?: string | null; text: string }, max: number): string | null {
  const named = /\.txt$/i.test(file.name);
  const mime = (file.mimeType ?? '').toLowerCase();
  if (!named && mime !== 'text/plain') return BOOK_WORDS.notText;
  if (file.text.trim() === '') return BOOK_WORDS.empty;
  const chars = charactersOf(file.text);
  return chars > max ? BOOK_WORDS.tooLong(chars, max) : null;
}
