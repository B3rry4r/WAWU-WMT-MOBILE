import { Platform } from 'react-native';

/*
 * The Voice Intro's recording in a browser (WEBAPP-04, R-127). The Hub takes a voice sample as audio/mp4, audio/aac, audio/mpeg or audio/wav
 * (`voice/sample` in wawu-backend `presign-upload.dto.ts`); a phone writes an .m4a. A browser's MediaRecorder writes what it can: Safari
 * and recent Chrome write MP4 audio, Firefox and older Chrome only WebM or Ogg, which an iPhone cannot play. So:
 *   1. the recorder asks the browser for MP4 audio first (`recordingMimeType`);
 *   2. what was really recorded is read from the file's own type (the blob's, never the address, which a browser makes a bare
 *      `blob:` link with no extension); AAC in MP4, AAC, MP3 and WAV go up as they are (never Opus in any container);
 *   3. anything else (WebM, Ogg) is decoded in the page and written again as 16-bit mono WAV, which every phone and browser plays and
 *      the Hub already takes. The Hub is not changed.
 */

/** The kinds the Hub takes for a voice sample that are fine as they are, by what the file really is. A bare MP4 is not here: its codec is unknown (Chrome writes Opus into MP4). */
const TAKEN: Record<string, { contentType: string; extension: string }> = {
  'audio/aac': { contentType: 'audio/aac', extension: 'aac' },
  'audio/mpeg': { contentType: 'audio/mpeg', extension: 'mp3' },
  'audio/wav': { contentType: 'audio/wav', extension: 'wav' },
  'audio/x-wav': { contentType: 'audio/wav', extension: 'wav' },
  'audio/wave': { contentType: 'audio/wav', extension: 'wav' },
};

/** The kind of a blob's own type, ignoring codecs (`audio/webm;codecs=opus` is `audio/webm`). */
export const bareType = (type: string): string => type.split(';')[0].trim().toLowerCase();

/** The one MP4 the page keeps as recorded: AAC in MP4, named in the type. */
export const AAC_IN_MP4 = 'audio/mp4;codecs=mp4a.40.2';

/** The sample kind the Hub takes for this type as it is (AAC in MP4, AAC, MP3, WAV), or null when the page has to convert it (WebM, Opus in MP4, anything unnamed). */
export function takenKind(type: string): { contentType: string; extension: string } | null {
  const lower = type.replace(/\s/g, '').toLowerCase();
  if (bareType(lower) === 'audio/mp4') return /codecs=.*mp4a\.40/.test(lower) ? { contentType: 'audio/mp4', extension: 'm4a' } : null;
  return TAKEN[bareType(lower)] ?? null;
}

/** The type to ask a browser's MediaRecorder for: AAC in MP4, only where it says yes to that exact string; else undefined (the recorder's own default, WebM, which is then written as WAV). */
export function recordingMimeType(
  recorder: { isTypeSupported?: (type: string) => boolean } | undefined = typeof MediaRecorder === 'undefined' ? undefined : MediaRecorder,
): string | undefined {
  if (Platform.OS !== 'web' || !recorder?.isTypeSupported) return undefined;
  return recorder.isTypeSupported(AAC_IN_MP4) ? AAC_IN_MP4 : undefined;
}

/**
 * The rate a voice sample is written at. The only reader of a stored sample is the voice provider, once per run (the app never plays
 * it: the Voice Intro it plays is the Hub's own). `docs/elevenlabs/API-FACTS.md` names no rate the provider needs, so the default is
 * 22,050 Hz mono, 16-bit: a 30 second take is 1.32 MB (the Hub reads up to 10 MB).
 */
export const WAV_RATE = 22050;

/** 16-bit mono PCM in a WAV file at `WAV_RATE` (or the take's own rate when it is lower), from decoded channels mixed down to one. */
export function encodeWav(channels: Float32Array[], sampleRate: number): Blob {
  const frames = channels[0]?.length ?? 0;
  const rate = Math.min(WAV_RATE, sampleRate);
  const ratio = sampleRate / rate;
  const count = Math.floor((frames * rate) / sampleRate);
  const buffer = new ArrayBuffer(44 + count * 2);
  const view = new DataView(buffer);
  const text = (at: number, value: string) => {
    for (let i = 0; i < value.length; i += 1) view.setUint8(at + i, value.charCodeAt(i));
  };
  text(0, 'RIFF');
  view.setUint32(4, 36 + count * 2, true);
  text(8, 'WAVE');
  text(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  text(36, 'data');
  view.setUint32(40, count * 2, true);
  const at = (c: number, i: number) => channels[c][i] ?? 0;
  for (let i = 0; i < count; i += 1) {
    // Each output sample averages the source samples it covers (a box filter), then mixes the channels.
    const from = Math.floor(i * ratio);
    const to = Math.max(from + 1, Math.floor((i + 1) * ratio));
    let sum = 0;
    for (let c = 0; c < channels.length; c += 1) {
      let part = 0;
      for (let s = from; s < to; s += 1) part += at(c, s);
      sum += part / (to - from);
    }
    const mixed = Math.max(-1, Math.min(1, sum / channels.length));
    view.setInt16(44 + i * 2, mixed < 0 ? mixed * 0x8000 : mixed * 0x7fff, true);
  }
  return new Blob([buffer], { type: 'audio/wav' });
}

type DecodeContext = { decodeAudioData: (data: ArrayBuffer) => Promise<AudioBuffer>; close?: () => Promise<void> };

/** Decodes what the browser recorded and writes it again as WAV. Throws when the browser cannot read its own recording. */
export async function convertToWav(blob: Blob, make: () => DecodeContext = () => new (window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()): Promise<Blob> {
  const context = make();
  try {
    const decoded = await context.decodeAudioData(await blob.arrayBuffer());
    const channels = Array.from({ length: decoded.numberOfChannels }, (_, i) => decoded.getChannelData(i));
    return encodeWav(channels, decoded.sampleRate);
  } finally {
    void context.close?.();
  }
}

export type SampleUpload = { blob: Blob; contentType: string; extension: string };

/**
 * What goes up for a take: on a phone, the file as the phone wrote it; in a browser, the recording as MP4/AAC/MP3/WAV when it is one,
 * else written again as WAV. `declared` is what the screen worked out from the address (right on a phone, a guess in a browser).
 */
export async function sampleToUpload(blob: Blob, declared: { contentType: string; extension: string }): Promise<SampleUpload> {
  if (Platform.OS !== 'web') return { blob, ...declared };
  const kind = takenKind(blob.type);
  if (kind) return { blob, ...kind };
  return { blob: await convertToWav(blob), contentType: 'audio/wav', extension: 'wav' };
}
