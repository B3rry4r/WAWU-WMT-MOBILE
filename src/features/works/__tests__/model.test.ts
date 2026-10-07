import { ALL_WORKS, bylineOf, categoryOfChip, chipOfCategory, chipsFor, coverOf, factsOf, headerSubtitle, isWebLink, shareText, stillOf } from '../model';

describe('chipsFor and the categories', () => {
  it('draws All then one chip per category the person used, in the order the Hub gives them', () => {
    expect(chipsFor([{ name: 'Brand films', count: 2 }, { name: 'Photography', count: 1 }])).toEqual([
      { value: ALL_WORKS, label: 'All' },
      { value: 'category:Brand films', label: 'Brand films' },
      { value: 'category:Photography', label: 'Photography' },
    ]);
  });

  it('draws no chips when nothing has a category, because there is nothing to filter by', () => {
    expect(chipsFor([])).toEqual([]);
  });

  it('turns a chip back into the category the Hub is asked for, and All into none', () => {
    expect(categoryOfChip(ALL_WORKS)).toBeNull();
    expect(categoryOfChip('category:Workshops')).toBe('Workshops');
    expect(chipOfCategory(null)).toBe(ALL_WORKS);
    expect(chipOfCategory('Workshops')).toBe('category:Workshops');
  });

  it('does not mistake a category called "all" for the All chip', () => {
    const [, chip] = chipsFor([{ name: 'all', count: 1 }]);
    expect(chip.value).not.toBe(ALL_WORKS);
    expect(categoryOfChip(chip.value)).toBe('all');
  });
});

describe('the words under a work', () => {
  it('reads "role · year" under a title', () => {
    expect(bylineOf({ role: 'Director', year: 2025 })).toBe('Director · 2025');
  });

  it('puts the person and the count in M34\'s bar, and the count alone when the name is missing', () => {
    expect(headerSubtitle('Lennox Emmanuel', 12)).toBe('Lennox Emmanuel · 12');
    expect(headerSubtitle(null, 3)).toBe('3');
  });
});

describe('factsOf (M35\'s rows)', () => {
  const base = { role: 'Director', client: null, year: 2025, link: null, category: null };

  it('always shows role and year, and leaves out the client, category and link the person did not give', () => {
    expect(factsOf(base).map((f) => [f.label, f.value])).toEqual([['Role', 'Director'], ['Year', '2025']]);
  });

  it('shows Role, Client, Year in the order the canvas draws them, then category and link', () => {
    expect(factsOf({ ...base, client: 'Kora Foods', category: 'Brand films', link: 'https://kora.example/film' }).map((f) => f.label)).toEqual([
      'Role',
      'Client',
      'Year',
      'Category',
      'Link',
    ]);
  });
});

describe('links and sharing', () => {
  it('opens only http and https links; a wawu/... link is a name inside the app', () => {
    expect(isWebLink('https://a.example')).toBe(true);
    expect(isWebLink('HTTP://a.example')).toBe(true);
    expect(isWebLink('wawu/lennox/kora')).toBe(false);
    expect(isWebLink('javascript:alert(1)')).toBe(false);
  });

  it('shares the title and who made it, with the work\'s own link when it has one', () => {
    const owner = { wawuId: 'u1', displayName: 'Lennox Emmanuel', handle: 'lennox', avatarUrl: null };
    expect(shareText({ title: 'Kora film', link: null, owner })).toBe('Kora film, by Lennox Emmanuel');
    expect(shareText({ title: 'Kora film', link: 'https://k.example', owner })).toBe('Kora film, by Lennox Emmanuel\nhttps://k.example');
    expect(shareText({ title: 'Kora film', link: null, owner: { ...owner, displayName: null } })).toBe('Kora film');
  });

  it('puts the first photo forward as a card\'s still when the cover is a video, and the video itself when there is no photo', () => {
    const video = { url: 'v', kind: 'video' as const };
    const photo = { url: 'p', kind: 'image' as const };
    expect(stillOf({ media: [video, photo] })).toBe(photo);
    expect(stillOf({ media: [photo, video] })).toBe(photo);
    expect(stillOf({ media: [video] })).toBe(video);
    expect(stillOf({ media: [] })).toBeNull();
  });

  it('takes the first photo or video as the cover', () => {
    expect(coverOf({ media: [] })).toBeNull();
    expect(coverOf({ media: [{ url: 'u1', kind: 'video' }, { url: 'u2', kind: 'image' }] })?.url).toBe('u1');
  });
});
