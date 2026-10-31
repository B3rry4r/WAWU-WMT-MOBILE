import * as model from '../model';
import { DEFAULT_TIP_KOBO, firstName, noteEcho, sentHeading, tipTitle } from '../model';

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

  it("opens on the design's 1,000, and has no words for what the creator gets (R-120: a buyer never sees the creator's cut)", () => {
    expect(DEFAULT_TIP_KOBO).toBe(100_000);
    expect(Object.keys(model).filter((k) => /gets|earn|share|keeps/i.test(k))).toEqual([]);
  });
});
