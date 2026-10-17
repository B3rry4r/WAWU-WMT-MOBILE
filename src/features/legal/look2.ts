import { space } from '@/theme';

/**
 * The booking and matter screens' sizes (design/_gen/services.js: `medium`, `day`, `slot`, `statusRow`, `track`, `booked`, `sign`,
 * `simpleSvc`, `chatFixed`, `handover`), named so each cites where it comes from. Colours are the theme's tokens.
 */
export const matterMetrics = {
  /** `medium`: a card at `padding:14px`, `gap:12px`, corner 18; the tile 40; the title 15 at 600, the line under it 12.5 (2 below); the price 14.5. */
  mediumPad: 14,
  mediumGap: space.md,
  mediumCorner: 18,
  mediumRing: 1.5,
  mediumTile: 40,
  mediumTitle: 15,
  mediumSub: 12.5,
  mediumSubTop: 2,
  mediumPrice: 14.5,
  /** `body(...)` with a 20 spacing and 130 room for the foot: the screen's parts 20 apart; the cards 8 apart, the days and times 10 apart. */
  bodyGap: 20,
  cardsGap: space.sm,
  whenGap: 10,
  /** `day`: 62 wide, corner 16, `padding:10px 0`, `gap:2px`; the weekday 12 at 600 (70% strength), the date 18 at 700. */
  dayWidth: 62,
  dayCorner: 16,
  dayPadY: 10,
  dayGap: 2,
  dayName: 12,
  dayNumber: 18,
  daysGap: space.sm,
  /** `slot`: three to a row, `gap:8px`, 40 high, corner 12, 14 at 600. */
  slotHeight: 40,
  slotCorner: 12,
  slotText: 14,
  slotRing: 1,
  slotsGap: space.sm,
  /** The line under the times: 12.5 muted. */
  pickedText: 12.5,
  /** `statusRow`: `padding:10px 0`, `gap:12px`; the disc 26, its check 14 at 2.6, its dot 8; the title 14.5 at 600, the line under it 12.5 (2 below). `track`: the card at `padding:8px 16px`. */
  stepPadY: 10,
  stepGap: space.md,
  stepDisc: 26,
  stepCheck: 14,
  stepDot: 8,
  stepTitle: 14.5,
  stepSub: 12.5,
  stepSubTop: 2,
  trackPadY: 8,
  trackPadX: space.lg,
  /** `booked`: the green note at corner 16, `padding:12px 14px`, 13.5 at 600, the mark 18 at 2.2, `gap:10px`. */
  noteCorner: 16,
  notePadY: 12,
  notePadX: 14,
  noteText: 13.5,
  noteIcon: 18,
  noteGap: 10,
  /** `sign`: the card at `padding:16px`, its parts 14 apart; "Quote" 12.5 muted, the figure 26 (4 below the label). */
  quoteCardPad: space.lg,
  quoteGap: 14,
  quoteLabel: 12.5,
  quoteFigure: 26,
  quoteFigureTop: 4,
  /** `simpleSvc`: centred, `gap:8px`, `padding-top:6px`; the tile 64; the title 21 (a `h1`), the line under it `muted`. */
  headTop: 6,
  headGap: space.sm,
  headTile: 64,
  headTitle: 21,
  /** `chatFixed` and `handover`: the cards in the chat. A fixed price card is at `padding:14px` with its parts 12 apart; the Book card at `padding:12px 14px`. */
  chatCardPad: 14,
  chatCardPadSlim: 12,
  chatCardGap: space.md,
  chatCardTile: 44,
  chatCardTitle: 15,
  chatCardSub: 12.5,
  chatCardPrice: 15,
  /** The foot (`foot(Btn)`): a full button standing on the page, 34 below it. */
  footTop: space.md,
  footBottom: 34,
} as const;
