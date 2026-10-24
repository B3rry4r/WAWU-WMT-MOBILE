/** The parts of a person's place the Hub keeps (`ProfileFieldsView`, GEO-02): any may be missing. */
export type PlaceParts = {
  city?: string | null;
  regionName?: string | null;
  countryName?: string | null;
  /** The older free text ("Lagos, Nigeria") the web types and the app wrote before GEO-03. */
  location?: string | null;
};

const text = (value: string | null | undefined): string => (value ?? '').trim();

/**
 * Where a person is, as one line for a profile (GEO-03, R-85): "Ikeja, Lagos, Nigeria" from the city, the region and the
 * country they chose. A person with a city or a region shows those; one who only has the older free text shows that text
 * (a richer line than a country alone); one with only a country shows the country. Null when nothing is known.
 */
export function whereLine(place: PlaceParts): string | null {
  const city = text(place.city);
  const region = text(place.regionName);
  const country = text(place.countryName);
  if (city || region) return [city, region, country].filter(Boolean).join(', ');
  return text(place.location) || country || null;
}

/** The free-text line the web reads, written beside the structured place so both agree ("Ikeja, Lagos, Nigeria"). Null when all three are empty. */
export function locationText(place: Pick<PlaceParts, 'city' | 'regionName' | 'countryName'>): string | null {
  return [text(place.city), text(place.regionName), text(place.countryName)].filter(Boolean).join(', ') || null;
}

/**
 * What a country calls its regions, as the Hub types them ("State", "Province", "County"): the one type most of them share.
 * A country whose regions are several kinds in about equal measure (the United Kingdom) just says "Region".
 */
export function regionWord(regions: readonly { type: string }[]): string {
  const counts = new Map<string, number>();
  for (const region of regions) {
    const type = region.type.trim();
    if (type) counts.set(type, (counts.get(type) ?? 0) + 1);
  }
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (!top || top[1] / regions.length < 0.75) return 'Region';
  return top[0].charAt(0).toUpperCase() + top[0].slice(1);
}
