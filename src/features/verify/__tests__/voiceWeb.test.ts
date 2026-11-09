import { Platform } from 'react-native';

import { isPhoto, redrawnType } from '@/features/media/redrawPhoto';

import { bareType, convertToWav, encodeWav, recordingMimeType, sampleToUpload, takenKind } from '../voiceWeb';

/** WEBAPP-04: a voice recorded in any browser goes up as something the Hub takes and every phone plays. */
let os: jest.ReplaceProperty<typeof Platform.OS> | undefined;
afterEach(() => {
  os?.restore();
  os = undefined;
});
const web = () => {
  os = jest.replaceProperty(Platform, 'OS', 'web');
};
const bytesOf = async (blob: Blob) => new Uint8Array(await blob.arrayBuffer());
const ascii = (b: Uint8Array, at: number, n: number) => String.fromCharCode(...b.slice(at, at + n));

describe('what the browser recorded', () => {
  it('MP4 audio, AAC, MP3 and WAV go up as they are; WebM and Ogg do not', () => {
    expect(takenKind('audio/mp4')).toEqual({ contentType: 'audio/mp4', extension: 'm4a' });
    expect(takenKind('audio/mp4;codecs=mp4a.40.2')).toEqual({ contentType: 'audio/mp4', extension: 'm4a' });
    expect(takenKind('audio/x-wav')?.contentType).toBe('audio/wav');
    expect(takenKind('audio/webm;codecs=opus')).toBeNull();
    expect(takenKind('audio/ogg')).toBeNull();
    expect(takenKind('')).toBeNull();
    expect(bareType('Audio/WebM; codecs=opus')).toBe('audio/webm');
  });

  it('the recorder asks for MP4 audio where the browser can write it, and for nothing otherwise (and never on a phone)', () => {
    web();
    expect(recordingMimeType({ isTypeSupported: (t) => t === 'audio/mp4' })).toBe('audio/mp4');
    expect(recordingMimeType({ isTypeSupported: (t) => t.startsWith('audio/webm') })).toBeUndefined();
    os?.restore();
    os = jest.replaceProperty(Platform, 'OS', 'android');
    expect(recordingMimeType({ isTypeSupported: () => true })).toBeUndefined();
  });
});

describe('WAV', () => {
  it('writes a 16-bit mono PCM file with the right header and the samples, mixing two channels down', async () => {
    const left = new Float32Array([0, 1, -1, 0.5]);
    const right = new Float32Array([0, 1, -1, -0.5]);
    const b = await bytesOf(encodeWav([left, right], 44100));
    expect(ascii(b, 0, 4)).toBe('RIFF');
    expect(ascii(b, 8, 4)).toBe('WAVE');
    expect(ascii(b, 12, 4)).toBe('fmt ');
    const v = new DataView(b.buffer);
    expect(v.getUint16(20, true)).toBe(1);
    expect(v.getUint16(22, true)).toBe(1);
    expect(v.getUint32(24, true)).toBe(44100);
    expect(v.getUint16(34, true)).toBe(16);
    expect(v.getUint32(40, true)).toBe(8);
    expect([0, 1, 2, 3].map((i) => v.getInt16(44 + i * 2, true))).toEqual([0, 32767, -32768, 0]);
    expect(b.length).toBe(44 + 8);
  });

  it('a take longer than the Hub reads is written at a lower rate, under its size limit', async () => {
    const long = new Float32Array(48000 * 200);
    const wav = encodeWav([long], 48000);
    expect(wav.size).toBeLessThan(10 * 1024 * 1024);
    const v = new DataView(await wav.arrayBuffer());
    expect(v.getUint32(24, true)).toBeLessThan(48000);
  });

  it('writes again what the browser decoded from its own recording', async () => {
    const data = new Float32Array([0.25, -0.25, 0.25]);
    const make = () => ({ decodeAudioData: async () => ({ numberOfChannels: 1, sampleRate: 48000, getChannelData: () => data }) as unknown as AudioBuffer, close: async () => undefined });
    const wav = await convertToWav(new Blob([new Uint8Array([1, 2, 3])], { type: 'audio/webm' }), make);
    expect(wav.type).toBe('audio/wav');
    expect(ascii(await bytesOf(wav), 0, 4)).toBe('RIFF');
  });
});

describe('what goes up', () => {
  const declared = { contentType: 'audio/mp4', extension: 'm4a' };
  it('on a phone is the file as the phone wrote it', async () => {
    os = jest.replaceProperty(Platform, 'OS', 'android');
    const blob = new Blob([new Uint8Array([1])], { type: '' });
    expect(await sampleToUpload(blob, declared)).toEqual({ blob, ...declared });
  });
  it('in a browser that recorded MP4 audio is that file, named for what it is (not for the blob address)', async () => {
    web();
    const blob = new Blob([new Uint8Array([1])], { type: 'audio/mp4' });
    expect(await sampleToUpload(blob, { contentType: 'audio/webm', extension: 'webm' })).toEqual({ blob, contentType: 'audio/mp4', extension: 'm4a' });
  });
  it('in a browser that recorded only WebM is converted, never sent labelled as MP4 (with no decoder to convert it, the take is refused instead)', async () => {
    web();
    const blob = new Blob([new Uint8Array([1])], { type: 'audio/webm;codecs=opus' });
    await expect(sampleToUpload(blob, declared)).rejects.toBeDefined();
  });
});

describe('photos written again in a browser', () => {
  it('keep their kind like the phone does (PNG, WebP), a GIF becomes a PNG, everything else a JPEG, and a video or a vector is not a photo', () => {
    expect(redrawnType('image/png')).toBe('image/png');
    expect(redrawnType('image/webp')).toBe('image/webp');
    expect(redrawnType('image/gif')).toBe('image/png');
    expect(redrawnType('image/jpeg')).toBe('image/jpeg');
    expect(redrawnType('image/heic')).toBe('image/jpeg');
    expect(isPhoto('image/jpeg')).toBe(true);
    expect(isPhoto('video/mp4')).toBe(false);
    expect(isPhoto('image/svg+xml')).toBe(false);
    expect(isPhoto('application/pdf')).toBe(false);
  });
});
