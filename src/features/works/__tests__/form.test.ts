import { bodyOf, emptyForm, fieldOfMessage, hasProblems, isComplete, isDirty, lengthOf, mediaHint, mediaKindOf, mediaRefused, mediaRoom, problemsOf, tooLong, type WorkForm } from '../form';
import { WORK_LIMITS } from '../limits';

const filled: WorkForm = { ...emptyForm, title: '  Brand film  ', role: ' Director ', year: '2025' };

describe('what M36 needs before Save', () => {
  it('needs a title, a role and a four digit year', () => {
    expect(isComplete(emptyForm)).toBe(false);
    expect(isComplete({ ...filled, title: '   ' })).toBe(false);
    expect(isComplete({ ...filled, role: '' })).toBe(false);
    expect(isComplete({ ...filled, year: '202' })).toBe(false);
    expect(isComplete({ ...filled, year: '20255' })).toBe(false);
    expect(isComplete(filled)).toBe(true);
  });

  it('tells a person a half-typed year is not a year, and says nothing about an empty one', () => {
    expect(problemsOf({ ...filled, year: '20' }).year).toBe('Enter the year as four digits.');
    expect(hasProblems(problemsOf({ ...filled, year: '' }))).toBe(false);
    expect(hasProblems(problemsOf(filled))).toBe(false);
  });

  it('counts a chosen file, or any typed field, as something to lose', () => {
    expect(isDirty(emptyForm, [])).toBe(false);
    expect(isDirty({ ...emptyForm, client: ' ' }, [])).toBe(false);
    expect(isDirty({ ...emptyForm, client: 'Kora' }, [])).toBe(true);
    expect(isDirty(emptyForm, [{ id: 'm', file: { blob: new Blob(), contentType: 'image/jpeg', extension: 'jpg', previewUri: 'x' }, state: 'ready', key: 'k' }])).toBe(true);
  });
});

describe('the request body', () => {
  it('trims, sends the year as a number, and leaves out every optional field that is empty', () => {
    expect(bodyOf(filled, [])).toEqual({ title: 'Brand film', role: 'Director', year: 2025 });
  });

  it('sends the optional fields that were filled, and the uploaded keys in the order chosen (the first is the cover)', () => {
    const body = bodyOf({ ...filled, client: ' Kora Foods ', link: ' wawu/lennox/kora ', category: ' Brand films ', description: ' About it ' }, ['k1', 'k2']);
    expect(body).toEqual({
      title: 'Brand film',
      role: 'Director',
      year: 2025,
      client: 'Kora Foods',
      link: 'wawu/lennox/kora',
      category: 'Brand films',
      description: 'About it',
      media: ['k1', 'k2'],
    });
    expect(Object.keys(bodyOf(filled, ['k1']))).toContain('media');
    expect(Object.keys(bodyOf(filled, []))).not.toContain('media');
  });
});

describe('which field the Hub\'s sentence is about', () => {
  it.each([
    ['Title can be at most 120 characters', 'title'],
    ['Year must be a year from 1950 to 2027', 'year'],
    ['Link is not a web address', 'link'],
    ['Role is required', 'role'],
    ['Client can be at most 120 characters', 'client'],
    ['Category cannot contain HTML tags', 'category'],
    ['Description has a character that is not allowed', 'description'],
    ['title must be a string', 'title'],
  ])('%s goes under %s', (message, field) => {
    expect(fieldOfMessage(message)).toBe(field);
  });

  it('puts a sentence about nothing in particular nowhere', () => {
    expect(fieldOfMessage('A profile can feature at most 50 works. Remove one to add another.')).toBeNull();
    expect(fieldOfMessage('Every picture or video must be one you uploaded.')).toBeNull();
  });
});

describe('what a file is', () => {
  it('calls video/mp4 a video and the rest photos', () => {
    expect(mediaKindOf('video/mp4')).toBe('video');
    expect(mediaKindOf('image/png')).toBe('image');
  });
});

describe('the limits M36 says before Save', () => {
  it('holds each text field to the Hub\'s length, counted the way the Hub counts it, in the app\'s own words', () => {
    for (const field of ['title', 'role', 'client', 'category', 'link'] as const) {
      const max = WORK_LIMITS[field];
      expect(problemsOf({ ...filled, [field]: 'x'.repeat(max) })[field]).toBeUndefined();
      const over = problemsOf({ ...filled, [field]: 'x'.repeat(max + 1) })[field];
      expect(over).toBe(`Too long. Use ${max} characters or fewer (this has ${max + 1}).`);
      expect(over).toBe(tooLong(field, max + 1));
    }
  });

  it('counts after the trim, and a run of spaces in a line of words as one, but not inside a link', () => {
    expect(lengthOf('title', `  ${'a'.repeat(10)}  `)).toBe(10);
    expect(lengthOf('title', 'a  b   c')).toBe(5);
    expect(lengthOf('link', 'a  b')).toBe(4);
    expect(hasProblems(problemsOf({ ...filled, title: `${'a'.repeat(WORK_LIMITS.title)}   ` }))).toBe(false);
  });

  it('SWEEP-APP-8 L5 (FIX-113): the description keeps its runs of spaces and its line breaks, as the Hub stores them, so they all count', () => {
    expect(lengthOf('description', 'a  b   c')).toBe(8);
    expect(lengthOf('description', '  a  b  ')).toBe(4);
    expect(lengthOf('description', 'one\n\ntwo')).toBe(8);
    // Four single-line fields still count a run as one, as the Hub collapses them.
    for (const field of ['title', 'role', 'client', 'category'] as const) expect(lengthOf(field, 'a  b   c')).toBe(5);
    // A description of exactly the limit, with a run of spaces, is over once the spaces count.
    const max = WORK_LIMITS.description;
    const over = `${'a'.repeat(max - 2)}  b`;
    expect(problemsOf({ ...filled, description: over }).description).toBe(tooLong('description', max + 1));
    expect(hasProblems(problemsOf({ ...filled, description: `${'a'.repeat(max - 3)}  b` }))).toBe(false);
  });

  it('says how many files a work carries, how many room is left, and how many were left out', () => {
    expect(mediaHint).toBe(`Up to ${WORK_LIMITS.media} photos or videos.`);
    expect(mediaRoom(0)).toBe(WORK_LIMITS.media);
    expect(mediaRoom(WORK_LIMITS.media - 1)).toBe(1);
    expect(mediaRoom(WORK_LIMITS.media)).toBe(0);
    expect(mediaRoom(WORK_LIMITS.media + 3)).toBe(0);
    expect(mediaRefused(1)).toBe('A work can carry up to 8 photos or videos. 1 was not added.');
    expect(mediaRefused(3)).toBe('A work can carry up to 8 photos or videos. 3 were not added.');
  });

  it('matches the Hub\'s own numbers (wawu-backend profile-works.ts)', () => {
    expect(WORK_LIMITS).toEqual({ media: 8, works: 50, title: 120, role: 80, client: 120, category: 40, link: 300, description: 1000 });
  });
});
