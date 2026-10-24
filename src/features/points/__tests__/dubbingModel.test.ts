import { costLine } from '../studioModel';
import { dubLanguages, readCues, subtitleFileName } from '../fileToolModel';
import { pollMsFor } from '../voiceoverApi';
import { readJobIntent } from '../voiceoverIntent';
import { toolReady } from '../voiceoverModel';
import type { AiTool } from '../studioApi';

const RULE = {
  folders: { audio: 'ai/input-audio', video: 'ai/input-video' },
  accepts: { audio: ['audio/mpeg'], video: ['video/mp4'] },
  maxBytes: 1000,
  maxMinutes: 60,
  languageCode: false,
};
const dub = (languages: { code: string; name: string }[] | undefined, over: Partial<AiTool> = {}): AiTool => ({
  id: 'dubbing',
  action: 'dub_standard_per_min_lang',
  name: 'Dubbing',
  description: '',
  unit: 'minute',
  costPointsPerUnit: 1500,
  enabled: true,
  input: { kind: 'file', maxCharacters: 0, charactersPerUnit: 0, file: { ...RULE, ...(languages ? { dubbing: { languages } } : {}) } },
  voices: [],
  ...over,
});

describe('Dubbing is ready only with the Hub’s languages to choose from', () => {
  it('needs the file rule and at least one language', () => {
    expect(toolReady(dub([{ code: 'es', name: 'Spanish' }]))).toBe(true);
    expect(toolReady(dub([]))).toBe(false);
    expect(toolReady(dub(undefined))).toBe(false);
    expect(toolReady(dub([{ code: 'es', name: 'Spanish' }], { enabled: false }))).toBe(false);
  });

  it('offers the languages as the Hub lists them and drops an entry that is not whole', () => {
    const tool = dub([{ code: 'es', name: 'Spanish' }, { code: '', name: 'Nothing' }, { code: 'fr', name: ' ' }, { code: 'yo', name: 'Yoruba' }]);
    expect(dubLanguages(tool)).toEqual([{ code: 'es', name: 'Spanish' }, { code: 'yo', name: 'Yoruba' }]);
    expect(dubLanguages(dub(undefined))).toEqual([]);
  });
});

describe('the tile line', () => {
  it('says where the price starts for Dubbing, and is the plain figure for every other tool', () => {
    expect(costLine(dub([]))).toBe('From 1,500 a minute');
    expect(costLine({ id: 'captions', unit: 'minute', costPointsPerUnit: 15 })).toBe('15 a minute');
    expect(costLine({ unit: 'minute', costPointsPerUnit: 250 })).toBe('250 a minute');
  });
});

describe('the reads of a working job', () => {
  const now = Date.parse('2026-10-24T10:00:00.000Z');
  const ago = (ms: number) => new Date(now - ms).toISOString();
  it('are every 2 seconds for every tool but Dubbing, however long the job has gone', () => {
    expect(pollMsFor('voiceover', ago(0), now)).toBe(2000);
    expect(pollMsFor('captions', ago(10 * 60_000), now)).toBe(2000);
  });
  it('slow for a dub: 2 seconds for the first minute, 5 until the fifth minute, then 10', () => {
    expect(pollMsFor('dubbing', ago(0), now)).toBe(2000);
    expect(pollMsFor('dubbing', ago(59_999), now)).toBe(2000);
    expect(pollMsFor('dubbing', ago(60_000), now)).toBe(5000);
    expect(pollMsFor('dubbing', ago(299_999), now)).toBe(5000);
    expect(pollMsFor('dubbing', ago(300_000), now)).toBe(10_000);
  });
  it('count a time that cannot be read, or one ahead of the phone’s clock, as a job that has just started', () => {
    expect(pollMsFor('dubbing', null, now)).toBe(2000);
    expect(pollMsFor('dubbing', 'not a time', now)).toBe(2000);
    expect(pollMsFor('dubbing', new Date(now + 5 * 60_000).toISOString(), now)).toBe(2000);
  });
});

describe('the subtitles a dub brings back', () => {
  it('are read as where each line starts and what it says, without the header, the cue names or the markup', () => {
    const vtt = 'WEBVTT\n\nNOTE made by a machine\n\nintro\n00:00:00.000 --> 00:00:04.000 align:start\nHello <b>there</b>.\nSecond line.\n\n01:02.500 --> 01:05.000\n<v Ada>Short form.</v>\n\n1:02:03.000 --> 1:02:05.000\nAn hour in.\n';
    expect(readCues(vtt)).toEqual([
      { at: '0:00', text: 'Hello there. Second line.' },
      { at: '1:02', text: 'Short form.' },
      { at: '1:02:03', text: 'An hour in.' },
    ]);
  });
  it('skip a block with no time or no words, and read an SRT the same way', () => {
    expect(readCues('WEBVTT\n\nSTYLE\n::cue { color: red }\n\n00:00:01.000 --> 00:00:02.000\n\n')).toEqual([]);
    expect(readCues('1\r\n00:00:07,250 --> 00:00:09,000\r\nHola.\r\n')).toEqual([{ at: '0:07', text: 'Hola.' }]);
    expect(readCues('')).toEqual([]);
  });
  it('are named after the recording, with .vtt for a dub', () => {
    expect(subtitleFileName('Q3 interview (final).mp3', 'vtt')).toBe('Q3 interview final.vtt');
    expect(subtitleFileName('???.wav', 'vtt')).toBe('subtitles.vtt');
    expect(subtitleFileName('talk.mp4')).toBe('talk.srt');
  });
});

describe('a dub the person left running is kept with its language', () => {
  const base = { key: 'k-12345678', toolId: 'dubbing', action: 'dub_standard_per_min_lang', voiceId: '', text: 'interview.mp3', units: 2, characters: 0, quoteToken: 'q', fileKey: 'ai/input-audio/x.mp3', jobId: null, at: 1 };
  it('reads the language back, and a stored entry with none is still whole', () => {
    expect(readJobIntent({ ...base, targetLanguage: 'yo' })?.targetLanguage).toBe('yo');
    expect(readJobIntent(base)).not.toBeNull();
    expect(readJobIntent(base)).not.toHaveProperty('targetLanguage');
    expect(readJobIntent({ ...base, targetLanguage: 42 })).not.toHaveProperty('targetLanguage');
  });
});
