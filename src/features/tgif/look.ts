import { darkColors, lightColors } from '@/theme/tokens.generated';

import type { TgifCard } from './api/tgif';

/**
 * How each card is painted. The card is dark in both themes, as H29 to H34 draw it
 * (the light artboards show the same card), so these read the dark and light
 * token sets directly and do not follow the phone's theme.
 *
 * The canvas paints the cards with five colours the tokens do not have (the
 * ground #2A0C3E, #101A3A, #3A0C2A and #1A0E30, and the corner glows). Until the
 * design system adds them (SHARED-CHANGES.md, HOME-09 #1) each is the nearest token,
 * or a token laid over the page colour at the strength that lands on the canvas's
 * colour: the verse and takeaway grounds are the debit card's ink, the prayer
 * ground is its light-theme ink, the reality ground is the USD blue at 38%, and
 * the remember ground is the pink hue at 19%, both over the dark page. The
 * reality glow is the professional blue and the accent purple, 30% each, which
 * together land on the canvas's indigo.
 */
export type CardLook = {
  ground: string;
  /** A token laid over the ground. */
  wash?: { color: string; opacity: number };
  /** The corner glow: one token, or two laid together to make a colour the tokens lack. */
  glows: readonly { color: string; opacity: number }[];
};

export const looks: Record<TgifCard, CardLook> = {
  verse: { ground: darkColors.surfaceCardInk, glows: [{ color: darkColors.accent, opacity: 0.7 }] },
  reality: {
    ground: darkColors.surfacePage,
    wash: { color: darkColors.curUsd, opacity: 0.38 },
    glows: [
      { color: darkColors.tickProfessional, opacity: 0.3 },
      { color: darkColors.accent, opacity: 0.3 },
    ],
  },
  remember: { ground: darkColors.surfacePage, wash: { color: darkColors.huePink, opacity: 0.19 }, glows: [{ color: darkColors.huePink, opacity: 0.55 }] },
  prayer: { ground: lightColors.surfaceCardInk, glows: [{ color: darkColors.accent, opacity: 0.6 }] },
  takeaway: { ground: darkColors.surfaceCardInk, glows: [{ color: darkColors.warning, opacity: 0.5 }] },
};

/** Text and controls on a card: white, whatever the theme. */
export const ink = darkColors.textOnAccent;
