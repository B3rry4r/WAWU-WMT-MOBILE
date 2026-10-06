import { mailtoUrl } from '../links';
import { paragraphsOf, updatedLine } from '../format';

describe('updatedLine', () => {
  it('writes the date the owner gave, whole', () => {
    expect(updatedLine('2026-09-01')).toBe('Updated 1 September 2026');
    expect(updatedLine('2026-12-31')).toBe('Updated 31 December 2026');
  });

  it('says nothing for a date that is not one', () => {
    expect(updatedLine(null)).toBeNull();
    expect(updatedLine('1 September 2026')).toBeNull();
    expect(updatedLine('2026-13-01')).toBeNull();
    expect(updatedLine('2026-01-00')).toBeNull();
  });
});

describe('paragraphsOf', () => {
  it('splits on a blank line and drops empty ones', () => {
    expect(paragraphsOf('One.\n\nTwo.\n  \n\nThree.')).toEqual(['One.', 'Two.', 'Three.']);
    expect(paragraphsOf('Single line\nstill one')).toEqual(['Single line\nstill one']);
    expect(paragraphsOf('')).toEqual([]);
  });
});

describe('mailtoUrl', () => {
  it('builds a mail link only from something that looks like an address', () => {
    expect(mailtoUrl(' help@example.test ')).toBe('mailto:help@example.test');
    expect(mailtoUrl('not an address')).toBeNull();
    expect(mailtoUrl('')).toBeNull();
    expect(mailtoUrl(null)).toBeNull();
  });
});
