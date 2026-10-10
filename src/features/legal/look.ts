import { canvasNormalLineHeight, space } from '@/theme';

/**
 * The legal chat's sizes (design/_gen/services.js, `chatHead`, `msgs`, `bb`, `who`, `sys`, `quick`,
 * `composer`, `brief`), named so each cites where it comes from. Colours are the theme's tokens.
 */
export const legalMetrics = {
  /** `chatHead`: 64 high, `padding:0 16px 0 12px`, `gap:10px`; the back button and the avatar 40; the name 16 at 700; the line under it 12.5, 1 below. */
  headHeight: 64,
  headPadLeft: space.md,
  headPadRight: space.lg,
  headGap: 10,
  headButton: 40,
  avatar: 40,
  headName: 16,
  headSub: 12.5,
  headSubTop: 1,
  scale: 19,
  scaleStroke: 2,
  /** `msgs`: `padding:14px 16px 150px`, `gap:10px`. The bottom is what the composer stands on. */
  listTop: 14,
  listSide: space.lg,
  listBottom: space.lg,
  between: 10,
  /** `bb`: at most 80% wide, `padding:10px 14px`, corner 20 and 6 on the speaker's bottom corner, 15 on 1.4. */
  bubbleMax: '80%',
  bubblePadY: 10,
  bubblePadX: 14,
  bubbleCorner: 20,
  bubbleTail: 6,
  bubbleText: 15,
  bubbleLeading: 1.4,
  /** `who`: 11.5 at 700, `margin:4px 0 -4px 2px`. */
  whoText: 11.5,
  whoTop: 4,
  whoLeft: 2,
  /** `sys`: centred, `gap:6px`, 12 at 600, `padding:6px 0`, an Info glyph 13. */
  sysText: 12,
  sysGap: 6,
  sysPad: 6,
  sysIcon: 13,
  /** `quick`: wrapped, `gap:8px`; each 36 high, `padding:0 14px`, a 1.5 ring in the accent, 14 at 600. */
  quickGap: space.sm,
  quickHeight: 36,
  quickPadX: 14,
  quickRing: 1.5,
  quickText: 14,
  /** `brief`: a card at `padding:14px 16px`, its title row 8 apart (a 18 glyph, 14.5 at 700), then 6 to the rows. */
  briefPadY: 14,
  briefPadX: space.lg,
  briefGap: 6,
  briefHeadGap: space.sm,
  briefIcon: 18,
  briefTitle: 14.5,
  /** `kv`: each row at least 50 high, `padding:12px 0`, `gap:14px`; the rows are children of the card's own 6 gap column, so they stand 6 apart, the hairline drawn inside the top edge. */
  kvMin: 50,
  kvPadY: space.md,
  kvGap: 14,
  /** The line under the brief card is a button 14 below it in `msgs`' own gap. */
  /** `composer`: `padding:10px 16px 30px`, `gap:8px`, a hairline above; the field 44 high at corner 22, `padding:10px 16px`, 15; the send disc 44 with a 20 arrow at 2.4. */
  composerTop: 10,
  composerSide: space.lg,
  composerBottom: 30,
  composerGap: space.sm,
  field: 44,
  fieldCorner: 22,
  fieldPadY: 12,
  fieldPadX: space.lg,
  fieldText: 15,
  fieldMaxHeight: 120,
  send: 44,
  sendIcon: 20,
  sendStroke: 2.4,
  /** The inline rows under the list (a failed send, a slow assistant) are 13 on the normal line. */
  noteText: 13,
} as const;

export const normal = canvasNormalLineHeight;
