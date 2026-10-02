import { ICON_STROKE } from '@/components/icon';

/*
 * The PIN sheet's sizes, copied from the board kit as R-22 asks
 * (DECISIONS.md: component sizes come from design/_gen/kit.js, matched
 * exactly). Each group names the kit helper it comes from; W11 is
 * design/_gen/wallet.js line 81, which calls them.
 */

/** kit.js `sheet()`: padding 10px 20px 34px, gap (W11 passes 14), handle 40 by 5, radius 3, margin 0 auto 4px. */
export const SHEET = {
  padTop: 10,
  padBottom: 34,
  /** W11 and M13 pass 14 to `sheet()` as the stack spacing. */
  stack: 14,
  handleW: 40,
  handleH: 5,
  handleRound: 3,
  handleBelow: 4,
  /** `inset 0 1px 0 var(--border-hairline)`. */
  edge: 1,
} as const;

/**
 * The title and muted line come from the shared `Text` (`sheetTitleSm`,
 * `muted`); W11 stacks them in a column with gap 6.
 */
export const HEADING = {
  stack: 6,
} as const;

/** kit.js `dots()`: 16px dots, 18px apart, empty ones a 1.5px ring; W11 wraps them in padding 8px 0. */
export const DOTS = {
  size: 16,
  apart: 18,
  ring: 1.5,
  padY: 8,
} as const;

/**
 * kit.js `keypad()`: rows 58 high, 2 apart, digits 26 / 500 / -0.02em; Delete
 * 24 and ScanFace 26 at the default stroke. The biometric key is ScanFace or
 * Fingerprint (owner, 2 Oct 2026), both at the canvas's ScanFace size and stroke.
 */
export const KEYPAD = {
  keyH: 58,
  rowApart: 2,
  digitSize: 26,
  digitTracking: -0.02,
  biometric: { size: 26, stroke: ICON_STROKE.default },
  delete: { name: 'Delete', size: 24, stroke: ICON_STROKE.default },
} as const;

/** W11's "Forgot PIN?" line: 14px, 600, accent-fg. */
export const FORGOT = { size: 14 } as const;

/**
 * The kit's inline error line (design/_gen/auth.js, "That code isn't right"):
 * CircleAlert 15 in danger at stroke 2.2, 13px 600 text, 6 apart.
 */
export const ALERT = {
  icon: { name: 'CircleAlert', size: 15, stroke: ICON_STROKE.button },
  size: 13,
  apart: 6,
} as const;
