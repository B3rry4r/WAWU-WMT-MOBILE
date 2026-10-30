import { getDraft, resetDraft } from '@/features/create/draft';
import { getDetails } from '@/features/create/details';

import { hasMediaOptions, isDrawnTool, studioLine } from '../studioModel';
import { photoRefusal, shapeName, speechRefusal, typeNames } from '../mediaToolModel';
import { putPieceInDraft, rememberPiece, heldPiece } from '../pieceFlow';
import { readJobIntent } from '../voiceoverIntent';
import { hasResult, mediaResult, readVoiceJob, resultFiles } from '../voiceoverApi';

/*
 * POINTS-13 to POINTS-15, the plain rules: what a Studio result is made of (pictures and clips are files, words are not), which tools
 * Studio draws (only a tool the Hub describes whole), the checks before a photo or a voice goes up, and what Create's draft holds
 * after "Make it a piece".
 */
const tool = (id: string, options: Record<string, unknown> | undefined) => ({ id, input: { kind: 'image', maxCharacters: 1000, charactersPerUnit: 0, ...(options ? { options } : {}) } }) as never;
const photo = { use: 'required', folder: 'ai/input-image', accepts: ['image/jpeg', 'image/png', 'image/webp'], maxBytes: 26_214_400 };

describe('a tool Studio draws (R-47)', () => {
  it('is drawn only when the Hub described what its screen reads', () => {
    expect(isDrawnTool(tool('image', { shapes: ['1:1'] }))).toBe(true);
    expect(isDrawnTool(tool('image', undefined))).toBe(false);
    expect(isDrawnTool(tool('photo-edit', { shapes: ['1:1'] }))).toBe(false);
    expect(isDrawnTool(tool('photo-edit', { shapes: ['1:1'], photo }))).toBe(true);
    expect(isDrawnTool(tool('video', { shapes: ['16:9'], lengths: [] }))).toBe(false);
    expect(isDrawnTool(tool('video', { shapes: ['16:9'], lengths: [4, 6, 8] }))).toBe(true);
    expect(hasMediaOptions(tool('talking-photo', { shapes: [], photo }))).toBe(false);
    expect(hasMediaOptions(tool('talking-photo', { shapes: [], photo, speech: { audioFolder: 'ai/input-audio', accepts: ['audio/mpeg'], maxSeconds: 60, fromJob: true } }))).toBe(true);
  });
  it('a tool the app has no screen for is still not drawn, and the caption says "tool" once a picture or video tool is drawn', () => {
    expect(isDrawnTool({ id: 'dialogue', input: { kind: 'dialogue', maxCharacters: 1, charactersPerUnit: 0 } } as never)).toBe(false);
    expect(studioLine([{ id: 'voiceover' }, { id: 'music' }])).toBe('Every AI voice tool, paid in points');
    expect(studioLine([{ id: 'voiceover' }, { id: 'image' }])).toBe('Every AI tool, paid in points');
  });
});

describe('what a finished job made', () => {
  const output = { kind: 'image', url: 'https://f.test/p.png', contentType: 'image/png', bytes: 5, name: 'Picture', downloadUrl: 'https://f.test/p.png?dl=1', pieceFormat: 'image' };
  const job = (outputs: unknown[]) => readVoiceJob({ id: 'j1', tool: 'image', state: 'done', voiceId: '', targetLanguage: null, characters: 3, units: 1, costPoints: 100, audioUrl: null, outputs, message: null, saved: false, createdAt: 'x', finishedAt: null });
  it('a picture or a clip is a result and a file with its place; words are not files', () => {
    expect(hasResult(job([output]))).toBe(true);
    expect(mediaResult(job([output]))?.index).toBe(0);
    expect(resultFiles(job([{ kind: 'text', text: 'hi' }, output])).map((f) => f.index)).toEqual([1]);
    expect(hasResult(job([]))).toBe(false);
  });
});

describe('the checks before a photo or a voice goes up', () => {
  const rule = photo as never;
  it('a photo over the Hub’s size, or of a type it does not take, or empty, is refused with the reason', () => {
    expect(photoRefusal({ contentType: 'image/jpeg', bytes: 1000 }, rule)).toBeNull();
    expect(photoRefusal({ contentType: 'image/gif', bytes: 1000 }, rule)).toBe('Choose a JPG, PNG or WEBP photo.');
    expect(photoRefusal({ contentType: 'image/png', bytes: 26_214_401 }, rule)).toBe('That photo is over the 25 MB limit.');
    expect(photoRefusal({ contentType: 'image/png', bytes: 0 }, rule)).toBe('That photo is empty. Choose another.');
  });
  it('a recording of a type the Hub does not take is refused; the length is the Hub’s reading, not ours', () => {
    const speech = { audioFolder: 'ai/input-audio', accepts: ['audio/mpeg', 'audio/wav'], maxSeconds: 60, fromJob: true } as never;
    expect(speechRefusal({ contentType: 'audio/mp4', bytes: 10 }, speech)).toBe('Choose an MP3 or WAV recording.');
    expect(speechRefusal({ contentType: 'audio/wav', bytes: 10 }, speech)).toBeNull();
  });
  it('shapes and types read as words', () => {
    expect(['1:1', '4:5', '9:16', '16:9', '3:2'].map(shapeName)).toEqual(['Square', 'Portrait', 'Tall', 'Wide', '3:2']);
    expect(typeNames(['image/jpeg'])).toBe('JPG');
  });
});

describe('a job left running keeps what the person chose', () => {
  const base = { key: 'k-12345678', toolId: 'talking-photo', action: 'talking_photo_per_sec', voiceId: '', text: 'Talking photo', units: 12, characters: 0, quoteToken: 't', jobId: null, at: 1 };
  it('a talking photo (no words) is kept with its photo and voice, and one with neither is not whole', () => {
    expect(readJobIntent({ ...base, media: { photoKey: 'ai/input-image/k1', sourceJobId: 'voice-1' } })?.media).toEqual({ photoKey: 'ai/input-image/k1', sourceJobId: 'voice-1' });
    expect(readJobIntent(base)).toBeNull();
  });
  it('a clip keeps its shape, seconds and photo', () => {
    const kept = readJobIntent({ ...base, toolId: 'video', text: 'A ball', characters: 6, units: 4, media: { shape: '9:16', seconds: 4, photoKey: 'k' } });
    expect(kept?.media).toEqual({ shape: '9:16', seconds: 4, photoKey: 'k' });
  });
});

describe('"Make it a piece" fills Create’s draft', () => {
  beforeEach(() => resetDraft());
  it('sets the format, the file and the title, and remembers the upload so Back and again opens the same one', () => {
    putPieceInDraft({ format: 'video', full: { key: 'content/full/u/1', fileUrl: 'https://f.test/1', contentType: 'video/mp4', bytes: 9, name: 'studio-video.mp4' }, suggestedTitle: 'Video, 30 Oct 2026' });
    expect(getDraft().format).toBe('video');
    expect(getDraft().full).toMatchObject({ key: 'content/full/u/1', contentType: 'video/mp4', name: 'studio-video.mp4' });
    expect(getDetails().title).toBe('Video, 30 Oct 2026');
    rememberPiece('job-1', 0, 'content/full/u/1');
    expect(heldPiece('job-1', 0)).toBe('content/full/u/1');
    expect(heldPiece('job-1', 1)).toBeNull();
    resetDraft();
    expect(heldPiece('job-1', 0)).toBeNull();
  });
  it('a piece that replaces another draft gives the old file back to the Hub and starts fresh', () => {
    putPieceInDraft({ format: 'audio', full: { key: 'a', fileUrl: 'u', contentType: 'audio/mpeg', bytes: 1, name: 'a.mp3' }, suggestedTitle: 'One' });
    putPieceInDraft({ format: 'image', full: { key: 'b', fileUrl: 'u', contentType: 'image/png', bytes: 1, name: 'b.png' }, suggestedTitle: 'Two' }, 'https://f.test/b.png');
    expect(getDraft()).toMatchObject({ format: 'image', full: { key: 'b', previewUri: 'https://f.test/b.png' } });
    expect(getDetails().title).toBe('Two');
  });
});
