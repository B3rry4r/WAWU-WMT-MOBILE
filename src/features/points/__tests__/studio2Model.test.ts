import { readFileSync } from 'fs';
import { join } from 'path';

import { acceptedTypes, limitsLine, refusalFor, spokenLength } from '../fileToolModel';
import { RECEPTIONIST_LIMITS, RECEPTIONIST_WORDS, documentProblem, knowledgeLinkProblem, setupProblem } from '../receptionistModel';
import { CLONE_WORDS } from '../CloneVoiceScreen';
import type { AiTool } from '../studioApi';
import { hasStudio2Shape, isDrawnTool, studioLine } from '../studioModel';
import { BOOK_WORDS, DIALOGUE_WORDS, MUSIC_WORDS, PODCAST_WORDS, linkProblem, nextVoice, sceneCharacters, sceneFilled, textFileProblem, voiceProblem, writeLine, type SceneLine } from '../voiceToolsModel';
import { hasResult, pollMsFor, readVoiceJob } from '../voiceoverApi';
import { readJobIntent } from '../voiceoverIntent';
import { toolReady } from '../voiceoverModel';

const MB = 1024 * 1024;
const FILE = { folders: { audio: 'ai/input-audio', video: 'ai/input-video' }, accepts: { audio: ['audio/mpeg', 'audio/mp4'], video: ['video/mp4'] }, maxBytes: 500 * MB, maxMinutes: 10, languageCode: false };
const V = [{ id: 'a', name: 'A', description: '' }, { id: 'b', name: 'B', description: '' }, { id: 'c', name: 'C', description: '' }];
const tool = (id: string, input: Record<string, unknown>, voices = V): AiTool => ({ id, action: 'x', name: id, description: '', unit: 'use', costPointsPerUnit: 1, enabled: true, input: { maxCharacters: 0, charactersPerUnit: 0, ...input }, voices }) as unknown as AiTool;

describe('Dialogue’s rules are the Hub’s numbers', () => {
  const scene = (...texts: string[]): SceneLine[] => texts.map((text, i) => ({ id: i + 1, text, voiceId: i % 2 ? 'b' : 'a' }));
  it('keeps the scene inside the characters, cutting what does not fit and saying why', () => {
    const out = writeLine(scene('Hello', ''), 2, 'x'.repeat(50), 20);
    expect(sceneCharacters(out.lines)).toBe(20);
    expect(out.lines[1].text).toHaveLength(15);
    expect(out.note).toBe(DIALOGUE_WORDS.tooLong(20));
    expect(writeLine(scene('Hello', ''), 2, 'fine', 20).note).toBeNull();
  });
  it('refuses a voice past the most the Hub lists, but allows one already in the scene', () => {
    const lines = scene('One', 'Two', 'Three');
    expect(voiceProblem(lines, 3, 'c', 2)).toBe('A scene can use up to 2 different voices.');
    expect(voiceProblem(lines, 3, 'b', 2)).toBeNull();
    expect(voiceProblem(lines, 3, 'c', 3)).toBeNull();
    // Swapping a voice for another in a scene that stays inside the most is fine.
    expect(voiceProblem(scene('One', 'Two'), 1, 'c', 2)).toBeNull();
  });
  it('gives a new line the next voice not yet in the scene, then the last line’s', () => {
    expect(nextVoice(scene('One'), V, 2)).toBe('b');
    expect(nextVoice(scene('One', 'Two'), V, 2)).toBe('b');
  });
  it('needs words in every line', () => {
    expect(sceneFilled(scene('One', ''))).toBe(false);
    expect(sceneFilled(scene('One', 'Two'))).toBe(true);
    expect(sceneFilled([])).toBe(false);
  });
});

describe('the Podcast maker’s link and the Audiobook’s file', () => {
  it('takes an https address of the length the Hub lists, with no login in it', () => {
    expect(linkProblem('https://example.com/a', 100)).toBeNull();
    expect(linkProblem('', 100)).toBeNull();
    expect(linkProblem('http://example.com', 100)).toBe(PODCAST_WORDS.linkNotHttps);
    expect(linkProblem('example.com', 100)).toBe(PODCAST_WORDS.linkNotHttps);
    expect(linkProblem('https://', 100)).toBe(PODCAST_WORDS.linkNotHttps);
    expect(linkProblem(`https://example.com/${'a'.repeat(100)}`, 50)).toBe(PODCAST_WORDS.linkTooLong(50));
    expect(linkProblem('https://me:secret@example.com', 100)).toBe(PODCAST_WORDS.linkHasLogin);
  });
  it('refuses a file that is not text, an empty one, and one over the Hub’s characters', () => {
    expect(textFileProblem({ name: 'book.txt', text: 'Words.' }, 100)).toBeNull();
    expect(textFileProblem({ name: 'book', mimeType: 'text/plain', text: 'Words.' }, 100)).toBeNull();
    expect(textFileProblem({ name: 'a.pdf', mimeType: 'application/pdf', text: 'Words.' }, 100)).toBe(BOOK_WORDS.notText);
    expect(textFileProblem({ name: 'a.txt', text: '  ' }, 100)).toBe(BOOK_WORDS.empty);
    expect(textFileProblem({ name: 'a.txt', text: 'x'.repeat(101) }, 100)).toBe(BOOK_WORDS.tooLong(101, 100));
  });
});

describe('the file step reads the tool’s own rule', () => {
  it('lists the one kind of file a tool takes, and writes a short limit in seconds', () => {
    expect(acceptedTypes({ ...FILE, only: 'video' })).toEqual(['video/mp4']);
    expect(acceptedTypes({ ...FILE, only: 'audio' })).toEqual(['audio/mpeg', 'audio/mp4']);
    expect(acceptedTypes(FILE)).toHaveLength(3);
    expect(limitsLine({ ...FILE, only: 'video', maxSeconds: 90 })).toBe('MP4. Up to 500 MB and 1 minute 30 seconds.');
    expect(limitsLine({ ...FILE, only: 'video', maxSeconds: 120 })).toBe('MP4. Up to 500 MB and 2 minutes.');
    expect(limitsLine({ ...FILE, maxMinutes: 60 })).toBe('MP3, M4A or MP4. Up to 500 MB and 60 minutes.');
    expect(spokenLength(1)).toBe('1 second');
    expect(spokenLength(150)).toBe('2 minutes 30 seconds');
  });
  it('stops a video the phone says is longer than the Hub’s longest, before it goes up', () => {
    const rule = { ...FILE, only: 'video' as const, maxSeconds: 120 };
    const clip = (seconds?: number) => ({ name: 'c.mp4', contentType: 'video/mp4', blob: { size: 1000 }, seconds });
    expect(refusalFor(clip(60), rule)).toBeNull();
    expect(refusalFor(clip(undefined), rule)).toBeNull();
    expect(refusalFor(clip(121), rule)).toBe('That video is longer than 2 minutes.');
    expect(refusalFor({ name: 's.mp3', contentType: 'audio/mpeg', blob: { size: 10 } }, rule)).toBe('That file type is not accepted here. Choose MP4.');
  });
});

describe('a tool is drawn only when the Hub described it whole (R-47)', () => {
  const whole: Record<string, AiTool> = {
    'voice-changer': tool('voice-changer', { kind: 'file', file: { ...FILE, only: 'audio', voice: true } }),
    dialogue: tool('dialogue', { kind: 'dialogue', maxCharacters: 2000, charactersPerUnit: 900, dialogue: { maxVoices: 10 } }),
    'my-voice': tool('my-voice', { kind: 'file', file: { ...FILE, only: 'audio', clone: true } }, []),
    'video-music': tool('video-music', { kind: 'file', file: { ...FILE, only: 'video' } }, []),
    stems: tool('stems', { kind: 'file', file: { ...FILE, only: 'audio', parts: [2, 6] } }, []),
    audiobook: tool('audiobook', { kind: 'text', maxCharacters: 100000, charactersPerUnit: 900 }),
    podcast: tool('podcast', { kind: 'podcast', maxCharacters: 20000, podcast: { modes: ['conversation'], maxVoices: 2, durations: [{ id: 'short', action: 'p', costPoints: 1 }], maxLinkCharacters: 2000, languages: [{ code: 'en', name: 'English' }] } }),
    receptionist: tool('receptionist', { kind: 'chat', maxCharacters: 2000, charactersPerUnit: 2000 }, []),
  };
  it('draws each tool the Hub describes whole', () => {
    for (const [id, t] of Object.entries(whole)) {
      expect(hasStudio2Shape(t)).toBe(true);
      expect(isDrawnTool(t)).toBe(true);
      expect(toolReady(t)).toBe(true);
      expect(id).toBe(t.id);
    }
  });
  it('leaves out a tool listed without the part its screen reads', () => {
    expect(isDrawnTool(tool('voice-changer', { kind: 'file', file: { ...FILE, only: 'audio' } }))).toBe(false);
    expect(isDrawnTool(tool('voice-changer', { kind: 'file', file: { ...FILE, only: 'audio', voice: true } }, []))).toBe(false);
    expect(isDrawnTool(tool('dialogue', { kind: 'dialogue', maxCharacters: 2000, charactersPerUnit: 900 }))).toBe(false);
    expect(isDrawnTool(tool('my-voice', { kind: 'file', file: { ...FILE, only: 'audio' } }, []))).toBe(false);
    expect(isDrawnTool(tool('video-music', { kind: 'file', file: { ...FILE, only: 'audio' } }, []))).toBe(false);
    expect(isDrawnTool(tool('stems', { kind: 'file', file: { ...FILE, only: 'audio' } }, []))).toBe(false);
    expect(isDrawnTool(tool('audiobook', { kind: 'text', maxCharacters: 100000, charactersPerUnit: 900 }, []))).toBe(false);
    expect(isDrawnTool(tool('podcast', { kind: 'podcast', maxCharacters: 20000 }))).toBe(false);
    expect(isDrawnTool(tool('receptionist', { kind: 'text', maxCharacters: 10, charactersPerUnit: 10 }, []))).toBe(false);
  });
  it('captions the page for every AI tool once one of these is drawn', () => {
    expect(studioLine([{ id: 'voiceover' }])).toBe('Every AI voice tool, paid in points');
    expect(studioLine([{ id: 'voiceover' }, { id: 'stems' }])).toBe('Every AI tool, paid in points');
  });
});

describe('a job’s record on the phone', () => {
  const base = { key: 'k', toolId: 'dialogue', action: 'dialogue_per_min', voiceId: 'a', text: 'Hi', units: 1, characters: 2, quoteToken: 't', jobId: null, at: 1 };
  it('keeps a scene, a podcast, the parts of a song and a mood whole, and drops a half-written one', () => {
    expect(readJobIntent({ ...base, lines: [{ text: 'Hi', voiceId: 'a' }] })?.lines).toEqual([{ text: 'Hi', voiceId: 'a' }]);
    expect(readJobIntent({ ...base, lines: [{ text: '', voiceId: 'a' }] })?.lines).toBeUndefined();
    const podcast = { source: { url: 'https://x.test/a' }, mode: 'bulletin', voiceIds: ['a'], duration: 'short', language: 'en' };
    expect(readJobIntent({ ...base, toolId: 'podcast', characters: 0, podcast })?.podcast).toEqual(podcast);
    expect(readJobIntent({ ...base, toolId: 'podcast', characters: 0, podcast: { ...podcast, voiceIds: [] } })?.podcast).toBeUndefined();
    const file = { ...base, toolId: 'stems', characters: 0, fileKey: 'ai/input-audio/k1' };
    expect(readJobIntent({ ...file, parts: 6 })?.parts).toBe(6);
    expect(readJobIntent({ ...file, parts: 3 })?.parts).toBeUndefined();
    expect(readJobIntent({ ...file, toolId: 'video-music', description: 'warm' })?.description).toBe('warm');
  });
});

describe('a finished job’s result and how often it is read', () => {
  const job = (outputs: unknown[], audioUrl: string | null = null) => readVoiceJob({ id: 'j', tool: 'stems', state: 'done', voiceId: '', characters: 0, units: 1, costPoints: 1, audioUrl, outputs });
  it('counts a list of audio parts as a result even with no single audio link', () => {
    expect(hasResult(job([]))).toBe(false);
    expect(hasResult(job([{ kind: 'audio', url: 'https://f.test/a.mp3' }]))).toBe(true);
    expect(hasResult(job([{ kind: 'audio' }]))).toBe(false);
  });
  it('reads an audiobook and a podcast more slowly after their first minute, like a dub', () => {
    const now = Date.parse('2026-10-30T10:00:00Z');
    const ago = (ms: number) => new Date(now - ms).toISOString();
    expect(pollMsFor('audiobook', ago(10_000), now)).toBe(2000);
    expect(pollMsFor('podcast', ago(120_000), now)).toBe(5000);
    expect(pollMsFor('audiobook', ago(600_000), now)).toBe(10_000);
    expect(pollMsFor('stems', ago(600_000), now)).toBe(2000);
  });
});

describe('the Receptionist’s set-up and its words', () => {
  it('keeps the limits the Hub’s contract states for the set-up fields', () => {
    const spec = JSON.parse(readFileSync(join(__dirname, '../../../../contract/openapi.json'), 'utf8')) as { components: { schemas: Record<string, { properties: Record<string, { maxLength?: number }> }> } };
    const save = spec.components.schemas.SaveReceptionistDto.properties;
    expect(RECEPTIONIST_LIMITS.businessName).toBe(save.businessName.maxLength);
    expect(RECEPTIONIST_LIMITS.offer).toBe(save.offer.maxLength);
    expect(RECEPTIONIST_LIMITS.replyStyle).toBe(save.replyStyle.maxLength);
    const add = spec.components.schemas.AddKnowledgeDto.properties;
    expect(RECEPTIONIST_LIMITS.knowledgeName).toBe(add.name.maxLength);
    expect(RECEPTIONIST_LIMITS.link).toBe(add.url.maxLength);
  });
  it('says why a detail cannot be saved, and what a document may be', () => {
    expect(setupProblem({ businessName: '', offer: 'x', replyStyle: '' })).toBe(RECEPTIONIST_WORDS.needName);
    expect(setupProblem({ businessName: 'a', offer: 'x'.repeat(2001), replyStyle: '' })).toBe('What you offer can be 2,000 characters at most.');
    expect(setupProblem({ businessName: 'a', offer: 'b', replyStyle: '' })).toBeNull();
    expect(knowledgeLinkProblem('http://x.test')).toBe(PODCAST_WORDS.linkNotHttps);
    const limits = { docMaxBytes: 5 * MB };
    expect(documentProblem({ name: 'a.pdf', contentType: 'application/pdf', bytes: 100 }, limits)).toBeNull();
    expect(documentProblem({ name: 'a.txt', contentType: 'text/plain', bytes: 100 }, limits)).toBeNull();
    expect(documentProblem({ name: 'a.png', contentType: 'image/png', bytes: 100 }, limits)).toBe(RECEPTIONIST_WORDS.documentNotAccepted);
    expect(documentProblem({ name: 'a.pdf', contentType: 'application/pdf', bytes: 6 * MB }, limits)).toBe('That file is over the 5 MB limit.');
  });
  it('writes no em-dash, no provider’s name and nothing about a phone, WhatsApp or a call anywhere a person reads', () => {
    const lines: string[] = [];
    const walk = (value: unknown) => {
      if (typeof value === 'string') lines.push(value);
      else if (typeof value === 'function') {
        try {
          walk((value as (...a: never[]) => unknown)(...([1, 'x', 2] as never[])));
        } catch {
          // A word that needs more than three arguments is not a plain line.
        }
      } else if (value && typeof value === 'object') Object.values(value).forEach(walk);
    };
    [RECEPTIONIST_WORDS, CLONE_WORDS, MUSIC_WORDS, DIALOGUE_WORDS, PODCAST_WORDS, BOOK_WORDS].forEach(walk);
    expect(lines.length).toBeGreaterThan(100);
    for (const line of lines) {
      expect(line).not.toMatch(/—/);
      expect(line).not.toMatch(/whatsapp|eleven|openai|anthropic|phone number|call list|telephone/i);
    }
  });
});
