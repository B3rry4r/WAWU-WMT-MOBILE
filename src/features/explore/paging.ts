import type { CreatorsPage } from './api';

/** The page after this one, or undefined on the last page (or when a page came back empty). */
export function nextCreatorsPage(last: CreatorsPage): number | undefined {
  if (last.items.length === 0) return undefined;
  return last.nextPage ?? undefined;
}
