import { educationLine, headlineLine, openToChips, paidLine, placeLine, subtitleLine, visitorBadge, visitorName } from '../model';

const profile = (over: Record<string, unknown> = {}) => ({ handle: 'lennox', headline: 'Filmmaker and brand strategist', company: 'Lennox Films', ...over }) as never;

describe('what the visitor profile decides from the Hub', () => {
  it('names the person by their name, else their handle', () => {
    expect(visitorName({ name: 'Lennox Emmanuel', profile: profile() })).toBe('Lennox Emmanuel');
    expect(visitorName({ name: null, profile: profile() })).toBe('lennox');
    expect(visitorName({ name: '  ', profile: profile({ handle: null }) })).toBe('');
  });

  it('writes the headline and company as one line, whichever the person has', () => {
    expect(headlineLine(profile())).toBe('Filmmaker and brand strategist · Lennox Films');
    expect(headlineLine(profile({ company: null }))).toBe('Filmmaker and brand strategist');
    expect(headlineLine(profile({ headline: null, company: null }))).toBeNull();
  });

  it('writes the line under the title from the headline and the place', () => {
    expect(subtitleLine({ profile: profile(), fields: { location: 'Lagos, Nigeria' } as never })).toBe('Filmmaker and brand strategist · Lagos, Nigeria');
    expect(subtitleLine({ profile: profile({ headline: null }), fields: { location: null } as never })).toBeNull();
  });

  it('writes where and since when with the year only, as M33 does', () => {
    expect(placeLine({ location: 'Lagos, Nigeria', memberSince: '2025-03-10T09:00:00.000Z' })).toBe('Lagos, Nigeria · On Who Made This? since 2025');
    expect(placeLine({ location: null, memberSince: '2025-03-10T09:00:00.000Z' })).toBe('On Who Made This? since 2025');
    expect(placeLine({ location: 'Abuja', memberSince: null })).toBe('Abuja');
    expect(placeLine({ location: null, memberSince: null })).toBeNull();
  });

  it('turns the first open-to item into "Open to ..." and keeps the rest as written', () => {
    expect(openToChips(['Brand films', 'Workshops'])).toEqual([
      { label: 'Open to brand films', lead: true },
      { label: 'Workshops', lead: false },
    ]);
    expect(openToChips(['  '])).toEqual([]);
  });

  it('writes an education row as the field and the years', () => {
    expect(educationLine({ field: 'Mass Communication', startYear: 2014, endYear: 2018, current: false })).toBe('Mass Communication · 2014 to 2018');
    expect(educationLine({ field: null, startYear: 2022, endYear: null, current: true })).toBe('2022 to now');
  });

  it('shows paid messages only while they are on with a price, with the reply window the creator set', () => {
    expect(paidLine({ dmEnabled: true, dmPrice: 300, dmResponseHours: 24 })).toEqual({ priceLine: '₦300 a message', replyLine: 'replies within 24 hours' });
    expect(paidLine({ dmEnabled: true, dmPrice: 300, dmResponseHours: 48 })?.replyLine).toBe('replies within 2 days');
    expect(paidLine({ dmEnabled: false, dmPrice: 300, dmResponseHours: 24 })).toBeNull();
    expect(paidLine({ dmEnabled: true, dmPrice: null, dmResponseHours: 24 })).toBeNull();
  });

  it('draws the tier pill from the badge the Hub serves, with its number only when it is numbered', () => {
    expect(visitorBadge({ badge: { id: 'b', name: 'Founding Maker', number: 7, numbered: true } } as never)).toEqual({ name: 'Founding Maker', number: 7 });
    expect(visitorBadge({ badge: { id: 'b', name: 'Verify', number: 7, numbered: false } } as never)).toEqual({ name: 'Verify', number: null });
    expect(visitorBadge({ badge: null } as never)).toBeNull();
  });
});
