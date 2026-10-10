import type { InfiniteData } from '@tanstack/react-query';

import type { CreatorsPage, ExploreCreator } from '../api';
import { categoryChips, categoryIcon, categoryTiles, chosenCategory, emptyCategoryCopy } from '../categories';
import { displayHandle, tickOf } from '../CreatorCard';
import { withFollowing } from '../follow';
import { nextCreatorsPage } from '../paging';

const twelve = [
  ['music_audio', 'Music & Audio'],
  ['film_video', 'Film & Video'],
  ['photography', 'Photography'],
  ['fashion_beauty', 'Fashion & Beauty'],
  ['business_finance', 'Business & Finance'],
  ['technology', 'Technology'],
  ['food_lifestyle', 'Food & Lifestyle'],
  ['faith_spirituality', 'Faith & Spirituality'],
  ['art_design', 'Art & Design'],
  ['writing_publishing', 'Writing & Publishing'],
  ['sports_fitness', 'Sports & Fitness'],
  ['gaming_esports', 'Gaming & Esports'],
].map(([id, label]) => ({ id, label }));

const tick = (creator: boolean, professional: boolean) => ({
  creator: { verified: creator, expiresAt: null },
  professional: { verified: professional, expiresAt: null },
});

function creator(wawuId: string, over: Partial<ExploreCreator> = {}): ExploreCreator {
  return { wawuId, name: `Name ${wawuId}`, handle: wawuId, avatarUrl: null, field: null, pieceCount: 1, verification: tick(false, false), following: false, ...over };
}

describe('X1 category tiles', () => {
  it('a user sees All, the first six categories in the order the server lists them, then More', () => {
    const tiles = categoryTiles(twelve);
    expect(tiles.map((t) => ('label' in t ? t.label : null))).toEqual(['All', 'Music & Audio', 'Film & Video', 'Photography', 'Fashion & Beauty', 'Business & Finance', 'Technology', 'More']);
    expect(tiles[0]).toMatchObject({ kind: 'all', icon: 'LayoutGrid' });
    expect(tiles[7]).toMatchObject({ kind: 'more', icon: 'Ellipsis' });
  });

  it('draws More even when every category already fits (R-46: X1 draws the whole row)', () => {
    expect(categoryTiles(twelve.slice(0, 6)).map((t) => t.kind)).toEqual(['all', 'category', 'category', 'category', 'category', 'category', 'category', 'more']);
    expect(categoryTiles(twelve.slice(0, 2)).map((t) => t.kind)).toEqual(['all', 'category', 'category', 'more']);
  });

  it('with no category served, holds six places with neutral frames between All and More, and names none', () => {
    const tiles = categoryTiles([]);
    expect(tiles.map((t) => t.kind)).toEqual(['all', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'more']);
    expect(tiles.filter((t) => t.kind === 'blank').map((t) => ('slot' in t ? t.slot : -1))).toEqual([0, 1, 2, 3, 4, 5]);
    expect(tiles.filter((t) => 'label' in t).map((t) => ('label' in t ? t.label : ''))).toEqual(['All', 'More']);
  });

  it('draws each category with the icon the canvas gives it, and a category it does not know with the grid', () => {
    expect(categoryIcon('music_audio')).toBe('Music');
    expect(categoryIcon('film_video')).toBe('Clapperboard');
    expect(categoryIcon('art_design')).toBe('Palette');
    expect(categoryIcon('photography')).toBe('Camera');
    expect(categoryIcon('fashion_beauty')).toBe('Shirt');
    expect(categoryIcon('writing_publishing')).toBe('PenLine');
    expect(categoryIcon('gaming_esports')).toBe('Gamepad2');
    expect(categoryIcon('faith_spirituality')).toBe('Church');
    expect(categoryIcon('something_new')).toBe('LayoutGrid');
  });
});

describe('X2 chips and the category a route asks for', () => {
  it('lists All without an icon, then every category with its icon', () => {
    const chips = categoryChips(twelve);
    expect(chips).toHaveLength(13);
    expect(chips[0]).toEqual({ value: 'all', label: 'All', icon: undefined });
    expect(chips[5]).toEqual({ value: 'business_finance', label: 'Business & Finance', icon: 'BriefcaseBusiness' });
  });

  it('opens the category the route names, and All for anything the server does not serve', () => {
    expect(chosenCategory('photography', twelve)).toBe('photography');
    expect(chosenCategory(['gaming_esports', 'x'], twelve)).toBe('gaming_esports');
    expect(chosenCategory('all', twelve)).toBe('all');
    expect(chosenCategory(undefined, twelve)).toBe('all');
    expect(chosenCategory('Photography', twelve)).toBe('all');
    expect(chosenCategory('photography', [])).toBe('all');
    expect(chosenCategory(7, twelve)).toBe('all');
  });

  it('says X13 words for an empty category, and its own for All', () => {
    expect(emptyCategoryCopy('gaming_esports', twelve)).toEqual({
      title: 'Nobody is publishing in Gaming & Esports yet',
      message: 'Try another category, or come back once more people have published.',
    });
    expect(emptyCategoryCopy('all', twelve).title).toBe('Nobody is publishing yet');
  });
});

describe('a creator card', () => {
  it('shows the creator tick first, else the professional tick, else none', () => {
    expect(tickOf(creator('a', { verification: tick(true, true) }))).toBe('creator');
    expect(tickOf(creator('a', { verification: tick(false, true) }))).toBe('pro');
    expect(tickOf(creator('a'))).toBeUndefined();
  });

  it('shows @handle, or the name when there is no handle', () => {
    expect(displayHandle(creator('amaka'))).toBe('@amaka');
    expect(displayHandle(creator('x', { handle: null, name: 'Chidi Eze' }))).toBe('Chidi Eze');
  });
});

describe('Follow on every Explore list at once', () => {
  it('marks the creator in a list and in pages of a list, and leaves other data alone', () => {
    const list = [creator('a'), creator('b')];
    expect((withFollowing(list, 'b', true) as ExploreCreator[]).map((c) => c.following)).toEqual([false, true]);
    expect(withFollowing(list, 'z', true)).toBe(list);

    const pages: InfiniteData<CreatorsPage> = {
      pages: [{ items: [creator('a')], nextPage: 2 }, { items: [creator('b', { following: true })], nextPage: null }],
      pageParams: [1, 2],
    };
    const next = withFollowing(pages, 'b', false) as InfiniteData<CreatorsPage>;
    expect(next.pages[1]?.items[0]?.following).toBe(false);
    expect(next.pageParams).toEqual([1, 2]);

    const categories = [{ id: 'music_audio', label: 'Music & Audio' }];
    expect(withFollowing(categories, 'music_audio', true)).toBe(categories);
    expect(withFollowing(undefined, 'a', true)).toBeUndefined();
  });
});

describe('paging a category', () => {
  it('asks for the page the Hub names next, and stops on the last page or an empty one', () => {
    expect(nextCreatorsPage({ items: [creator('a')], nextPage: 2 })).toBe(2);
    expect(nextCreatorsPage({ items: [creator('a')], nextPage: null })).toBeUndefined();
    expect(nextCreatorsPage({ items: [], nextPage: 3 })).toBeUndefined();
  });
});
