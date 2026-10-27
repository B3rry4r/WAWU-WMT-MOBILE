import { DEFAULT_TIP_KOBO, firstName, getsWords, noteEcho, sentHeading, tipTitle } from '../model';

describe('what the tip sheet decides', () => {
  it("names the creator by first name: 'Tip Tife', '₦2,000 sent to Tife'", () => {
    expect(firstName('  Tife Adeola ')).toBe('Tife');
    expect(tipTitle('Tife Adeola')).toBe('Tip Tife');
    expect(tipTitle(null)).toBe('Tip this creator');
    expect(sentHeading(200000, 'Tife Adeola')).toBe('₦2,000 sent to Tife');
    expect(sentHeading(125050, null)).toBe('₦1,250.50 sent');
  });

  it('echoes a note only when one was written', () => {
    expect(noteEcho('  That orbit shot is clean. ')).toBe('That orbit shot is clean.');
    expect(noteEcho('   ')).toBeNull();
    expect(noteEcho(null)).toBeNull();
  });

  it("says what the creator gets on a tile: 'Tife gets', or 'They get' without a name; and opens on the sheet's own 2,000", () => {
    expect(getsWords('Tife Adeola')).toBe('Tife gets');
    expect(getsWords(null)).toBe('They get');
    expect(getsWords('  ')).toBe('They get');
    expect(DEFAULT_TIP_KOBO).toBe(200_000);
  });
});
