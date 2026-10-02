import { darkColors } from '@/theme/tokens.generated';

/**
 * The design's shadows are black at a set strength (design/_ds/wawu/tokens/elevation.css `--shadow-sheet`
 * 0.5, design/_gen/kit.js `Seg` 0.08) in both themes. The theme has no token for them yet
 * (SHARED-CHANGES.md row 7), so the black is taken from the dark scrim, which is pure black, and given the
 * design's own strength.
 */
export function blackAt(alpha: number): string {
  return darkColors.surfaceScrim.replace(/[\d.]+\)$/, `${alpha})`);
}
