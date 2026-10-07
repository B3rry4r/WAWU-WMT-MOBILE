import { bodyOf, emptyForm, fieldOfMessage, hasProblems, isComplete, isDirty, mediaKindOf, problemsOf, type WorkForm } from '../form';

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
