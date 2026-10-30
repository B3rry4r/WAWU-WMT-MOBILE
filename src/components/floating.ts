import { createButtonMetrics } from '@/components/CreateButton';
import { layout, space } from '@/theme';

/**
 * R-110 point 3 (owner, 30 Oct 2026): where the two floating buttons stand, and the room under a tab screen's last block so nothing a person
 * needs to read sits beneath them. The Create button (creator accounts) stands 18 in from the right and 16 above the bar. The WAWU theme's
 * button (R-99) stands on the SAME line, to Create's left with a gap (it used to stand above Create, which put it in the middle of the
 * content); for a person with no Create button, or on a tab that draws none, it takes Create's place. So the floating zone is one row
 * high: Create's 58 and the 16 under it.
 */
export const floatingMetrics = {
  /** The theme button's size: the phone's tap minimum (R-99). */
  music: layout.tapMin,
  /** Between the theme button and Create, side by side. */
  gap: space.md,
  /** Clear air kept between the last block and the buttons. */
  clear: space.lg,
} as const;

/** The theme button's right edge, from the screen's right: Create's place, or one button and a gap to its left. */
export function musicRight(stacked: boolean): number {
  const create = createButtonMetrics;
  const centred = create.right + (create.size - floatingMetrics.music) / 2;
  return stacked ? create.right + create.size + floatingMetrics.gap : centred;
}

/** The theme button's bottom edge above the scene's foot: its centre is on Create's centre line. */
export function musicBottom(): number {
  return createButtonMetrics.bottom + (createButtonMetrics.size - floatingMetrics.music) / 2;
}

/**
 * How far above a tab screen's foot (where the bar begins) its content must end: Create's height and the 16 under it, and the clear air
 * above. Both buttons stand on one line, so the room is the same with or without Create; a tab with neither needs none of it.
 */
export function floatingRoom(opts: { create: boolean; music: boolean }): number {
  if (!opts.create && !opts.music) return 0;
  const tallest = opts.create ? createButtonMetrics.size : floatingMetrics.music;
  const lift = opts.create ? createButtonMetrics.bottom : musicBottom();
  return lift + tallest + floatingMetrics.clear;
}
