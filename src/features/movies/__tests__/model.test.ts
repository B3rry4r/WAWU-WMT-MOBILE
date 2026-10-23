import { cardLine, countText, genreChoices, premiereAhead, premiereText, ratingText, runtimeText, totalText } from '../model';

describe('FLIX-03 · the words a movie is drawn with', () => {
  it('writes a length as hours and minutes', () => {
    expect(runtimeText(100)).toBe('1h 40m');
    expect(runtimeText(52)).toBe('52m');
    expect(runtimeText(120)).toBe('2h');
    expect(runtimeText(null)).toBeNull();
    expect(runtimeText(0)).toBeNull();
  });

  it('writes figures the way the board does', () => {
    expect(ratingText(4.52)).toBe('4.5');
    expect(countText(1830)).toBe('1,830');
    expect(totalText(148)).toBe('148 movies');
    expect(totalText(1)).toBe('1 movie');
    expect(cardLine({ genre: ['Drama', 'Crime'], year: 2024 })).toBe('Drama · 2024');
    expect(cardLine({ genre: [], year: null })).toBe('');
  });

  it('knows a premiere is ahead only until its date, and says the day in Lagos', () => {
    const now = new Date('2026-10-22T10:00:00Z');
    expect(premiereAhead({ premiering: true, premierDate: '2026-10-24T09:00:00Z' }, now)).toBe(true);
    expect(premiereAhead({ premiering: true, premierDate: '2026-10-22T09:00:00Z' }, now)).toBe(false);
    expect(premiereAhead({ premiering: false, premierDate: '2026-10-24T09:00:00Z' }, now)).toBe(false);
    expect(premiereAhead({ premiering: true, premierDate: null }, now)).toBe(false);
    expect(premiereText('2026-10-24T09:00:00Z', now)).toBe('Premieres Sat 24 Oct');
    expect(premiereText('not a date', now)).toBeNull();
  });

  // FIX-100 #5 (L6)
  it('splits compound genres into single ones, trimmed, once each, in the Hub order', () => {
    expect(genreChoices(['Comedy', 'Comedy | Thriller', 'Drama', 'Drama | Music |Thriller', ' | '])).toEqual(['Comedy', 'Drama', 'Music', 'Thriller']);
    expect(genreChoices([])).toEqual([]);
    expect(genreChoices(null)).toEqual([]);
    expect(cardLine({ genre: ['Comedy | Thriller'], year: 2024 })).toBe('Comedy · 2024');
  });
});
