import { placeLine, subtitleLine } from '@/features/visitor/model';
import type { VisitorProfile } from '@/features/visitor/api';

const fields = (over: Record<string, unknown>) => ({ location: null, memberSince: null, ...over }) as unknown as VisitorProfile['fields'];

describe('a visitor\'s profile shows the place the person chose (GEO-03, R-85)', () => {
  it('the city, region and country read as one line, then how long they have been here', () => {
    const line = placeLine(fields({ location: 'Lagos', city: 'Ikeja', regionName: 'Lagos', countryName: 'Nigeria', memberSince: '2025-03-01T00:00:00.000Z' }));
    expect(line?.startsWith('Ikeja, Lagos, Nigeria')).toBe(true);
  });

  it('a profile that only has the older free text, or nothing, shows what it has', () => {
    expect(placeLine(fields({ location: 'Lekki, Lagos' }))).toBe('Lekki, Lagos');
    expect(placeLine(fields({}))).toBeNull();
  });

  it('the line under the name says what they do, then where', () => {
    const view = { profile: { headline: 'Filmmaker', company: null }, fields: fields({ city: 'Accra', regionName: 'Greater Accra', countryName: 'Ghana' }) } as unknown as Pick<VisitorProfile, 'profile' | 'fields'>;
    expect(subtitleLine(view)).toBe('Filmmaker · Accra, Greater Accra, Ghana');
  });
});
