import { acceptedTypes, folderFor, limitsLine, refusalFor, subtitleFileName, typeOfRecording, typesLine } from '../fileToolModel';
import { readJobIntent } from '../voiceoverIntent';
import { hasResult, outputText, readVoiceJob } from '../voiceoverApi';
import { inputKindOf, toolReady } from '../voiceoverModel';
import type { AiTool } from '../studioApi';

const MB = 1024 * 1024;
const RULE = {
  folders: { audio: 'ai/input-audio', video: 'ai/input-video' },
  accepts: { audio: ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/aac'], video: ['video/mp4', 'video/quicktime', 'video/webm'] },
  maxBytes: 500 * MB,
  maxMinutes: 60,
  languageCode: true,
};
const tool = (over: Partial<AiTool> = {}): AiTool => ({
  id: 'captions',
  action: 'captions_per_min',
  name: 'Captions',
  description: '',
  unit: 'minute',
  costPointsPerUnit: 15,
  enabled: true,
  input: { kind: 'file', maxCharacters: 0, charactersPerUnit: 0, file: RULE },
  voices: [],
  ...over,
});
const file = (name: string, contentType: string, size = MB) => ({ name, contentType, blob: { size } });

describe('the file step reads only the Hub’s rule', () => {
  it('names the types and the limits from the rule', () => {
    expect(typesLine(RULE)).toBe('MP3, WAV, M4A, AAC, MP4, MOV or WEBM');
    expect(limitsLine(RULE)).toBe('MP3, WAV, M4A, AAC, MP4, MOV or WEBM. Up to 500 MB and 60 minutes.');
    expect(limitsLine({ ...RULE, maxMinutes: 1 })).toContain('and 1 minute.');
    expect(acceptedTypes(RULE)).toHaveLength(7);
  });

  it('picks the Hub’s folder by the kind of file', () => {
    expect(folderFor('audio/mpeg', RULE)).toBe('ai/input-audio');
    expect(folderFor('video/webm', RULE)).toBe('ai/input-video');
  });

  it('understands the other names a phone gives an m4a, and the name when the phone says nothing', () => {
    expect(typeOfRecording({ name: 'a.m4a', contentType: 'audio/x-m4a' })).toBe('audio/mp4');
    expect(typeOfRecording({ name: 'a.m4a', contentType: 'audio/m4a' })).toBe('audio/mp4');
    expect(typeOfRecording({ name: 'a.m4a', contentType: 'application/octet-stream' })).toBe('audio/mp4');
    expect(typeOfRecording({ name: 'clip.webm', contentType: '' })).toBe('video/webm');
    expect(typeOfRecording({ name: 'a.mp3', contentType: 'Audio/MPEG; charset=x' })).toBe('audio/mpeg');
  });

  it('refuses a wrong type, an empty file and a file over the cap, each in a sentence, and lets a fitting file through', () => {
    expect(refusalFor(file('a.pdf', 'application/pdf'), RULE)).toBe('That file type is not accepted here. Choose MP3, WAV, M4A, AAC, MP4, MOV or WEBM.');
    expect(refusalFor(file('a.mp3', 'audio/mpeg', 0), RULE)).toBe('That file is empty. Choose another.');
    expect(refusalFor(file('a.mp3', 'audio/mpeg', 500 * MB + 1), RULE)).toBe('That file is over the 500 MB limit.');
    expect(refusalFor(file('a.mp3', 'audio/mpeg', 500 * MB), RULE)).toBeNull();
  });

  it('names the subtitle file after the recording, with nothing a file name cannot hold', () => {
    expect(subtitleFileName('Q3 interview (final).mp3')).toBe('Q3 interview final.srt');
    expect(subtitleFileName('.mp3')).toBe('mp3.srt');
    expect(subtitleFileName('???.wav')).toBe('subtitles.srt');
  });
});

describe('a tool that takes a recording is ready only with the Hub’s rule for it', () => {
  it('reads the kind, and needs the rule, not text limits or voices', () => {
    expect(inputKindOf(tool())).toBe('file');
    expect(toolReady(tool())).toBe(true);
    expect(toolReady(tool({ input: { kind: 'file', maxCharacters: 0, charactersPerUnit: 0 } }))).toBe(false);
    expect(toolReady(tool({ enabled: false }))).toBe(false);
    expect(toolReady(tool({ id: 'dubbing' as AiTool['id'] }))).toBe(false);
  });
});

describe('a job that made words, not a link', () => {
  const base = { id: 'j1', tool: 'captions', state: 'done', voiceId: '', characters: 0, units: 2, costPoints: 30, createdAt: 'x' };
  it('is done when the transcript is there, and keeps the subtitles beside it', () => {
    const job = readVoiceJob({ ...base, audioUrl: null, outputs: [{ kind: 'text', text: 'Hello.' }, { kind: 'subtitles', text: '1\n' }, { kind: 'strange', text: 'x' }] });
    expect(job.outputs).toHaveLength(2);
    expect(outputText(job, 'text')).toBe('Hello.');
    expect(outputText(job, 'subtitles')).toBe('1\n');
    expect(hasResult(job)).toBe(true);
  });
  it('is not done with neither a link nor words, and an older job with no outputs reads as none', () => {
    expect(hasResult(readVoiceJob({ ...base, audioUrl: null, outputs: [{ kind: 'text', text: '  ' }] }))).toBe(false);
    const old = readVoiceJob({ ...base, audioUrl: 'https://a.test/x.mp3' });
    expect(old.outputs).toEqual([]);
    expect(hasResult(old)).toBe(true);
  });
});

describe('the record of a job left running, for a recording', () => {
  const stored = { key: 'abcdefgh', toolId: 'captions', action: 'captions_per_min', voiceId: '', text: 'interview.mp3', units: 2, characters: 0, quoteToken: 'tok', fileKey: 'ai/input-audio/u/f.mp3', jobId: null, at: 1 };
  it('keeps the file key and counts no characters', () => {
    expect(readJobIntent(stored)).toEqual(stored);
  });
  it('is dropped when it is not whole, and a words job still needs its characters', () => {
    expect(readJobIntent({ ...stored, characters: 5 })).toBeNull();
    expect(readJobIntent({ ...stored, fileKey: undefined })).toBeNull();
    expect(readJobIntent({ ...stored, fileKey: undefined, text: 'Hello', characters: 5 })?.fileKey).toBeUndefined();
  });
});
