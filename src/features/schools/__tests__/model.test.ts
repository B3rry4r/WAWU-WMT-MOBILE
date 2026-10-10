import {
  cardLine,
  categoryChips,
  classesLine,
  cleanQuery,
  courseCountLabel,
  courseLine,
  dayLabel,
  emptyCopy,
  modeLabel,
  nonEmpty,
  profileLine,
  rowsOf,
  SEARCH_MAX,
  todayOf,
  upcomingIntake,
  weeksLabel,
  youGetLine,
} from '../model';

const intake = (startDate: string, over: Record<string, unknown> = {}) => ({ id: startDate, startDate, schedule: 'Saturdays', location: 'Yaba', capacity: 20, seatsLeft: 8, full: false, ...over });

describe('cleanQuery: what goes to the Hub for what a person typed', () => {
  it('trims the ends and makes runs of spaces one', () => {
    expect(cleanQuery('  drone   piloting ')).toBe('drone piloting');
    expect(cleanQuery('')).toBe('');
    expect(cleanQuery('   ')).toBe('');
  });

  it('turns a NUL or any control character into a space, so none reaches the request', () => {
    expect(cleanQuery('a\u0000b')).toBe('a b');
    expect(cleanQuery('a\tb\nc\rd')).toBe('a b c d');
    expect(cleanQuery('\u0000')).toBe('');
    // C0, DEL, C1, line and paragraph separators and a byte order mark: every one of them.
    const controls = [...Array.from({ length: 0x20 }, (_, i) => i), 0x7f, ...Array.from({ length: 0x20 }, (_, i) => 0x80 + i), 0x2028, 0x2029, 0xfeff];
    for (const code of controls) {
      const cleaned = cleanQuery(`x${String.fromCharCode(code)}y`);
      expect(cleaned).toBe('x y');
      expect(encodeURIComponent(cleaned)).not.toMatch(/%[01][0-9A-F]|%7F|%C2%[89]/);
    }
  });

  it('drops a broken half of a character and keeps a whole one', () => {
    expect(cleanQuery('a\uD83Db')).toBe('ab');
    expect(cleanQuery('a\uDE00b')).toBe('ab');
    expect(cleanQuery('school \u{1F393}')).toBe('school \u{1F393}');
    expect(cleanQuery('\uD83D')).toBe('');
  });

  it('keeps the Hub’s 100 characters and never cuts a character in two', () => {
    expect(cleanQuery('a'.repeat(100))).toHaveLength(100);
    expect(cleanQuery('a'.repeat(101))).toHaveLength(100);
    expect(cleanQuery('a'.repeat(5000))).toHaveLength(SEARCH_MAX);
    // 99 letters, then an emoji (two halves) that straddles the limit: the whole emoji goes, not half of it.
    const straddle = cleanQuery(`${'a'.repeat(99)}\u{1F393}`);
    expect(straddle).toBe('a'.repeat(99));
    expect(cleanQuery(`${'a'.repeat(98)}\u{1F393}`)).toHaveLength(100);
  });

  it('leaves the characters a search really has: letters, digits, wildcards and quotes mean themselves', () => {
    expect(cleanQuery('50% off_ \\ "x" (a|b)')).toBe('50% off_ \\ "x" (a|b)');
    expect(cleanQuery('Ibadan Ọ̀jọ́')).toBe('Ibadan Ọ̀jọ́');
  });
});

describe('the chips', () => {
  it('are All first, then the contract’s categories in the canvas’s order', () => {
    expect(categoryChips.map((c) => c.label)).toEqual(['All', 'Tech', 'Business', 'Creative', 'Languages', 'Vocational']);
    expect(categoryChips.map((c) => c.value)).toEqual(['all', 'tech', 'business', 'creative', 'languages', 'vocational']);
  });
});

describe('the words under a name', () => {
  it('SC1: the place and the course count, with no rating', () => {
    expect(cardLine({ location: 'Yaba, Lagos', courseCount: 18 })).toBe('Yaba, Lagos · 18 courses');
    expect(cardLine({ location: 'Aba', courseCount: 1 })).toBe('Aba · 1 course');
    expect(cardLine({ location: 'Aba', courseCount: 0 })).toBe('Aba · 0 courses');
    expect(courseCountLabel(2)).toBe('2 courses');
  });

  it('SC2: since when only when the school gave a year', () => {
    expect(profileLine({ location: 'Yaba, Lagos', foundedYear: 2016 })).toBe('Yaba, Lagos · Since 2016');
    expect(profileLine({ location: 'Yaba, Lagos', foundedYear: null })).toBe('Yaba, Lagos');
  });

  it('SC2: a course’s length and how it is taught', () => {
    expect(courseLine({ weeks: 12, mode: 'online' })).toBe('12 weeks · online');
    expect(courseLine({ weeks: 1, mode: 'in_person' })).toBe('1 week · in person');
    expect(courseLine({ weeks: 6, mode: 'hybrid' })).toBe('6 weeks · online + in person');
    expect(weeksLabel(4)).toBe('4 weeks');
    expect(modeLabel('online')).toBe('online');
  });
});

describe('days', () => {
  it('writes a day the way SC3 does, from the calendar day itself', () => {
    expect(dayLabel('2026-11-03')).toBe('Tue 3 November');
    expect(dayLabel('2027-01-12')).toBe('Tue 12 January');
    expect(dayLabel('2025-11-03')).toBe('Mon 3 November');
    expect(dayLabel('2026-12-31')).toBe('Thu 31 December');
  });

  it('is null for a day that is not one', () => {
    for (const bad of ['', 'soon', '2026-02-30', '2026-13-01', '2026-00-10', '2026-11-3', '2026-11-03T00:00:00Z', '03/11/2026']) expect(dayLabel(bad)).toBeNull();
  });

  it('writes today as the Hub writes a day, on the phone’s calendar', () => {
    expect(todayOf(new Date(2026, 9, 10, 23, 59))).toBe('2026-10-10');
    expect(todayOf(new Date(2027, 0, 5, 0, 1))).toBe('2027-01-05');
  });
});

describe('upcomingIntake: the class SC3 tells about', () => {
  const list = [intake('2026-01-05'), intake('2026-11-03'), intake('2027-01-12')];

  it('is the soonest class that has not started', () => {
    expect(upcomingIntake(list, '2026-10-10')?.startDate).toBe('2026-11-03');
  });

  it('counts a class that starts today', () => {
    expect(upcomingIntake(list, '2026-11-03')?.startDate).toBe('2026-11-03');
    expect(upcomingIntake(list, '2026-11-04')?.startDate).toBe('2027-01-12');
  });

  it('is null when every class has started, or there is none', () => {
    expect(upcomingIntake(list, '2027-01-13')).toBeNull();
    expect(upcomingIntake([], '2026-10-10')).toBeNull();
  });

  it('keeps a full class: a start date is true whether or not there are seats', () => {
    expect(upcomingIntake([intake('2026-11-03', { seatsLeft: 0, full: true })], '2026-10-10')?.full).toBe(true);
  });
});

describe('SC3’s lines', () => {
  it('Classes: how it is taught, then the days and the place', () => {
    expect(classesLine('online', { schedule: 'Saturdays', location: 'Yaba' })).toBe('Online, Saturdays in Yaba');
    expect(classesLine('online', { schedule: 'Weekdays', location: null })).toBe('Online, Weekdays');
    expect(classesLine('in_person', { schedule: 'Weekends', location: ' Kano ' })).toBe('In person, Weekends in Kano');
    expect(classesLine('hybrid', { schedule: '  ', location: 'Yaba' })).toBe('Online + in person in Yaba');
  });

  it('Classes: the way it is taught alone when no class is coming', () => {
    expect(classesLine('in_person', null)).toBe('In person');
  });

  it('You get: what the school lists, in order, on one line', () => {
    expect(youGetLine(['Certificate', 'mentor', 'portfolio'])).toBe('Certificate, mentor, portfolio');
    expect(youGetLine([' Certificate ', '', '  '])).toBe('Certificate');
    expect(youGetLine([])).toBe('');
  });

  it('the syllabus keeps its order and loses empty lines', () => {
    expect(nonEmpty(['One', ' ', 'Two '])).toEqual(['One', 'Two']);
  });
});

describe('rowsOf', () => {
  const card = (id: string) => ({ id }) as never;
  it('joins the pages in order and lists a school once', () => {
    expect(rowsOf([{ items: [card('a'), card('b')] }, { items: [card('b'), card('c')] }]).map((c) => c.id)).toEqual(['a', 'b', 'c']);
    expect(rowsOf(undefined)).toEqual([]);
  });
});

describe('emptyCopy: what an empty list says, by its cause', () => {
  it('a search with no match is SC10 as drawn', () => {
    expect(emptyCopy('all', 'drone piloting')).toEqual({ title: 'No schools for "drone piloting"', message: 'Try a shorter search, or browse a category.' });
    expect(emptyCopy('tech', 'drone')).toEqual({ title: 'No schools for "drone"', message: 'Try a shorter search, or browse a category.' });
  });

  it('a category nobody is listed in, and no school at all', () => {
    expect(emptyCopy('languages', '')).toEqual({ title: 'No Languages schools yet', message: 'Try another category.' });
    expect(emptyCopy('all', '')).toEqual({ title: 'No schools yet', message: 'Check back later.' });
  });

  it('no line of it has an em-dash', () => {
    for (const [c, q] of [['all', 'x'], ['tech', ''], ['all', '']] as const) {
      const copy = emptyCopy(c, q);
      expect(copy.title + copy.message).not.toContain(String.fromCharCode(0x2014));
    }
  });
});
