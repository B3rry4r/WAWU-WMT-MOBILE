import { charactersOf, clampText, countLine, failedWords, lengthLine, toolReady, unitsFor, usedLine } from '../voiceoverModel';
import type { AiTool } from '../studioApi';

const tool = (patch: Partial<AiTool> = {}): AiTool => ({
  id: 'voiceover',
  action: 'voiceover_per_min',
  name: 'VoiceOver',
  description: '',
  unit: 'minute',
  costPointsPerUnit: 250,
  enabled: true,
  input: { maxCharacters: 5000, charactersPerUnit: 900 },
  voices: [{ id: 'ada', name: 'Ada', description: 'Warm' }],
  ...patch,
});

describe('the length and the cost of a job come from the Hub’s own figure', () => {
  it('minutes are the characters over the Hub’s characters per minute, rounded up, never fewer than one', () => {
    expect(unitsFor(1, 900)).toBe(1);
    expect(unitsFor(900, 900)).toBe(1);
    expect(unitsFor(901, 900)).toBe(2);
    expect(unitsFor(5000, 900)).toBe(6);
    expect(unitsFor(100, 0)).toBe(0);
  });

  it('characters are counted as the Hub counts them: whole characters of the trimmed words', () => {
    expect(charactersOf('  hello  ')).toBe(5);
    expect(charactersOf('a😀b')).toBe(3);
    expect(clampText('a😀bc', 3)).toBe('a😀b');
    expect(clampText('abc', 5)).toBe('abc');
  });

  it('the lines read as the board sets them', () => {
    expect(lengthLine(1)).toBe('About 1 minute');
    expect(lengthLine(3)).toBe('About 3 minutes');
    expect(countLine(132, 5000)).toBe('132 / 5,000');
    expect(usedLine({ costPoints: 250 }, 1000)).toBe('250 points used · 1,000 left');
    expect(usedLine({ costPoints: 250 }, null)).toBe('250 points used');
  });
});

describe('a failed job says only what the Hub says', () => {
  it('the Hub’s first sentence is the title and the rest the body', () => {
    expect(failedWords("That didn't work. No points were taken. Try again.")).toEqual({ title: "That didn't work", body: 'No points were taken. Try again.' });
  });

  it('a sentence with no second part is the body under the board’s title, and a missing one promises nothing about the points', () => {
    expect(failedWords('The audio did not finish')).toEqual({ title: "That didn't work", body: 'The audio did not finish' });
    expect(failedWords(null)).toEqual({ title: "That didn't work", body: 'Try again.' });
    expect(failedWords(null).body).not.toMatch(/point/i);
  });
});

describe('a tool is usable only as the Hub describes it', () => {
  it('needs to be on, with a length for a minute and voices', () => {
    expect(toolReady(tool())).toBe(true);
    expect(toolReady(tool({ enabled: false }))).toBe(false);
    expect(toolReady(tool({ voices: [] }))).toBe(false);
    expect(toolReady(tool({ input: { maxCharacters: 5000, charactersPerUnit: 0 } }))).toBe(false);
    expect(toolReady(undefined)).toBe(false);
  });
});
