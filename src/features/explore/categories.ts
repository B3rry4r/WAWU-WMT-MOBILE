import type { IconName } from '@/components/icon';

import type { CategoryId, ExploreCategory } from './api';

/**
 * The icon each creator category is drawn with. design/_gen/explore.js `CATS`, `CHIPS` and `catEmpty`
 * draw eight of the twelve (All, Music, Film, Art, Photography, Fashion, Writing, Gaming, Faith).
 * Default (agent), owner may override: the four the canvas never draws take the nearest icon the
 * app already ships (Business: briefcase, Technology: phone, Food & Lifestyle: sun, Sports: dumbbell).
 * A category the app does not know yet keeps the grid icon, so a new one on the server still shows.
 */
const categoryIcons: Record<string, IconName> = {
  music_audio: 'Music',
  film_video: 'Clapperboard',
  photography: 'Camera',
  fashion_beauty: 'Shirt',
  business_finance: 'BriefcaseBusiness',
  technology: 'Smartphone',
  food_lifestyle: 'Sun',
  faith_spirituality: 'Church',
  art_design: 'Palette',
  writing_publishing: 'PenLine',
  sports_fitness: 'Dumbbell',
  gaming_esports: 'Gamepad2',
};

/** design/_gen/explore.js `CATS`: All leads with the grid, More closes the row with the ellipsis. */
export const allIcon: IconName = 'LayoutGrid';
export const moreIcon: IconName = 'Ellipsis';

export function categoryIcon(id: string): IconName {
  return categoryIcons[id] ?? allIcon;
}

/** X1 draws All, six categories, then More (design/_gen/explore.js `CATS`). */
export const TILE_CATEGORIES = 6;

export type CategoryTileItem =
  | { kind: 'all'; label: string; icon: IconName }
  | { kind: 'category'; id: string; label: string; icon: IconName }
  | { kind: 'more'; label: string; icon: IconName };

/** X1's row of tiles: All, the first six categories the server lists, then More when there are more than six. */
export function categoryTiles(categories: readonly ExploreCategory[]): CategoryTileItem[] {
  const shown = categories.slice(0, TILE_CATEGORIES).map(
    (c): CategoryTileItem => ({ kind: 'category', id: c.id, label: c.label, icon: categoryIcon(c.id) }),
  );
  const more: CategoryTileItem[] = categories.length > TILE_CATEGORIES ? [{ kind: 'more', label: 'More', icon: moreIcon }] : [];
  return [{ kind: 'all', label: 'All', icon: allIcon }, ...shown, ...more];
}

export type CategoryChoice = CategoryId | 'all';

/**
 * The category a route asked for, checked against the categories the server serves. Anything else (missing,
 * misspelt, a category since removed) is All, so a stale link still opens a working screen.
 */
export function chosenCategory(param: unknown, categories: readonly ExploreCategory[]): CategoryChoice {
  const value = Array.isArray(param) ? param[0] : param;
  if (typeof value !== 'string' || value === 'all') return 'all';
  return categories.some((c) => c.id === value) ? (value as CategoryId) : 'all';
}

/** The chips on X2: All, then every category the server lists (design/_gen/explore.js: "every one as a chip on Categories"). */
export function categoryChips(categories: readonly ExploreCategory[]) {
  return [
    { value: 'all' as CategoryChoice, label: 'All', icon: undefined as IconName | undefined },
    ...categories.map((c) => ({ value: c.id as CategoryChoice, label: c.label, icon: categoryIcon(c.id) as IconName | undefined })),
  ];
}

/** X13's words for a category nobody publishes in yet. All has its own, since there is no other category to try. */
export function emptyCategoryCopy(choice: CategoryChoice, categories: readonly ExploreCategory[]) {
  const label = choice === 'all' ? undefined : categories.find((c) => c.id === choice)?.label;
  if (!label) {
    return { title: 'Nobody is publishing yet', message: 'Come back once more people have published.' };
  }
  return {
    title: `Nobody is publishing in ${label} yet`,
    message: 'Try another category, or come back once more people have published.',
  };
}
