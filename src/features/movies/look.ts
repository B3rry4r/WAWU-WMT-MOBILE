import { canvasNormalLineHeight, layout, space } from '@/theme';
import { darkColors } from '@/theme/tokens.generated';

/**
 * Flix movies' sizes (design/_gen/movies.js, Flow MV: `flixPoster`, `fxBadge`, `mvHero`, `detailBody`, `mSearch`, `resRow`,
 * `mv3`, `mv5`), each named for where it comes from. Colours are the theme's tokens; where the board paints one the tokens do not
 * hold, the nearest token stands in: the star's amber is the warning token in its dark cut (as the feed's star does), the
 * poster's rating pill and the trailer's glass are the scrim and glass tokens.
 */
export const gutter = layout.gutter;

export const posterMetrics = {
  /** `flixPoster`: the picture is 1.47 times its width, 16 radius; the caption is 7 under it. */
  ratio: 1.47,
  radius: 16,
  captionGap: 7,
  /** The rail on Home and Explore draws 128 wide (`flixRail`); MV1's rails draw 112 (`mvRail`); MV6's grid draws 169 (`mv6`). */
  railWidth: 128,
  /** Posters in a rail are 10 apart. */
  railGap: 10,
  mvRailWidth: 112,
  title: 14,
  sub: 12,
  /** The sub line sits 3 closer to the title (`margin-top:-3px`). */
  subPull: -3,
  /** The rating pill: 24 high, 8 across, 8 in from the corner, the star 11 and the figure 11.5 at 700, 4 apart. */
  badgeHeight: 24,
  badgePadX: space.sm,
  badgeInset: space.sm,
  badgeGap: space.xs,
  badgeFont: 11.5,
  star: 11,
  starStroke: 2.4,
  /** The clapperboard shown where a title has no poster. */
  placeholderIcon: 28,
  /** A grid of posters is 2 across, 16 between rows and 12 between columns. */
  gridRowGap: space.lg,
  gridColGap: space.md,
} as const;

/** The amber of every star on the board (the board's amber): the warning token in its dark cut. */
export const starColor = darkColors.warning;

export const heroMetrics = {
  /** `mvHero`: 240 high, 24 radius, the badge 14 in from the top-left, the words 16 in from the left, right and bottom, 10 apart. */
  height: 240,
  radius: 24,
  badgeTop: 14,
  badgeLeft: 14,
  inset: space.lg,
  between: 10,
  title: 24,
  line: 13,
  lineOpacity: 0.8,
  lineTop: 3,
  /** A premiere's pill sits this far above the title in the hero. */
  premiereGap: 6,
  /** `mvHero`'s hero and rails are 18 apart on MV1 (the board's `body` spacing). */
  sectionGap: 18,
  /** `fxBadge`: 24 high, 9 across, the label 11 at 700 tracked .06em, the clapperboard 12, 5 apart. */
  badgeHeight: 24,
  badgePadX: 9,
  badgeFont: 11,
  badgeTrack: 0.06,
  badgeIcon: 12,
  badgeGap: 5,
  buttonsGap: space.sm,
} as const;

export const pageMetrics = {
  /** `dTop`: the backdrop is 270 high with a scrim from 35% black to the page colour. */
  backdrop: 270,
  /** `detailBody`: 130 down, 20 across, 160 below, 16 between parts. */
  bodyTop: 130,
  bodyBottom: 160,
  between: space.lg,
  /** The poster beside the title: 100 by 147, 14 radius, the words 14 to its right. */
  posterWidth: 100,
  posterHeight: 147,
  posterRadius: 14,
  posterGap: 14,
  words: 6,
  title: 24,
  line: 13,
  starSmall: 14,
  /** `tag`: 26 high, 10 across, the label 12 at 600, a 1 px strong ring. */
  tagHeight: 26,
  tagPadX: 10,
  tagFont: 12,
  tagsGap: 6,
  /** The trailer row: 8 around, 18 radius, a 96 by 56 thumbnail with a 30 round play, the words 14.5 at 600 and 12.5. */
  trailerPad: space.sm,
  trailerRadius: 18,
  trailerGap: space.md,
  thumbWidth: 96,
  thumbHeight: 56,
  thumbRadius: space.md,
  play: 30,
  playIcon: 13,
  trailerTitle: 14.5,
  trailerSub: 12.5,
  trailerSubTop: 2,
  ratingGap: 5,
  castGroup: 10,
  castPartPull: -4,
  /** The synopsis: 14.5 at 1.55. */
  synopsis: 14.5,
  synopsisLead: 1.55,
  /** The cast: a 52 circle, the name 12.5 at 600, the part 11.5, columns 70 wide and 14 apart. */
  castWidth: 70,
  castGap: 14,
  castAvatar: 52,
  castName: 12.5,
  castPart: 11.5,
  castBetween: 6,
  /** The foot: the button, then the note 12.5 under it, over the page's foot. */
  footNote: 12.5,
  footGap: space.sm,
  footBottom: 34,
} as const;

export const searchMetrics = {
  /** `mSearch`: 46 high, 16 across, the words 15, the glass 18; a typed word rings in the accent at 1.5. */
  height: 46,
  padX: space.lg,
  font: 15,
  glass: 18,
  clear: 17,
  /** `sortRow`: the total 13.5 muted, the sort 13.5 at 700 with a 15 chevron. */
  sortFont: 13.5,
  chevron: 15,
  /** `resRow`: a 56 by 82 poster, 10 radius, 12 apart, 10 above and below; the title 15 at 600, the line 12.5, the stars 12.5 at 600. */
  rowPad: 10,
  rowGap: space.md,
  thumbWidth: 56,
  thumbHeight: 82,
  thumbRadius: 10,
  pillGap: 10,
  rowTitle: 15,
  rowLine: 12.5,
  rowLineTop: 3,
  rowStarTop: 6,
  rowStar: 12,
  rowChevron: 17,
  /** "3 movies" over the results: 13. */
  count: 13,
} as const;

export const trailerMetrics = {
  /** `mv3`: the video is 220 high across the screen; the controls sit 16 in and 12 up, 10 apart, the time at 12. */
  height: 220,
  controlsInset: space.lg,
  controlsBottom: space.md,
  controlsGap: 10,
  scrub: 4,
  time: 12,
  icon: 18,
  /** The words under it: "TRAILER" 12 at 700 tracked .08em at 70%, the title 22 at 700; 16 between parts. */
  kicker: 12,
  kickerTrack: 0.08,
  kickerOpacity: 0.7,
  title: 22,
  titleTop: 4,
  between: space.lg,
  /** The foot is 48 above the screen's foot; the words sit 120 higher than the middle. */
  footBottom: 48,
  lift: 120,
  /** The close button over the video, 42 round (`nav` with `glass`). */
  close: 42,
} as const;

/** The sheets' groups (the filter sheet's and Continue on Flixora's) are 10 apart inside. */
export const sheetMetrics = { group: 10 } as const;

export const openingMetrics = {
  /** `mv5`: an 88 round ring with a 6 stroke, the title 22, the line, and a 30 high pill. */
  ring: 88,
  ringStroke: 6,
  between: 14,
  pillHeight: 30,
  pillPadX: space.md,
  pillFont: 12.5,
  pillIcon: 13,
  pillGap: 6,
} as const;

/** The line-height the canvas gets where it sets none, for the small lines drawn with a font size of their own. */
export const normalLine = canvasNormalLineHeight;
