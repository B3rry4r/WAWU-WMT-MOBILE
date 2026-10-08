import { stopOf } from '@/theme';
import { darkColors } from '@/theme/tokens.generated';

import type { TgifCard } from './api/tgif';

/**
 * How each card is painted: its ground and its corner glow, the design's TGIF tokens
 * (design/_ds/wawu/tokens/colors.css `--tgif-*`, from design/_gen/home.js `TGC`). The card
 * is dark in both themes, as H29 to H34 draw it (the light artboards show the same card),
 * and the tokens are the same in both, so these read the token set directly and do not
 * follow the phone's theme.
 */
export type CardLook = {
  ground: string;
  /** The corner glow as an SVG stop takes it: the opaque colour and its strength. */
  glow: { color: string; opacity: number };
};

export const looks: Record<TgifCard, CardLook> = {
  verse: { ground: darkColors.tgifVerseGround, glow: stopOf(darkColors.tgifVerseGlow) },
  reality: { ground: darkColors.tgifRealityGround, glow: stopOf(darkColors.tgifRealityGlow) },
  remember: { ground: darkColors.tgifRememberGround, glow: stopOf(darkColors.tgifRememberGlow) },
  prayer: { ground: darkColors.tgifPrayerGround, glow: stopOf(darkColors.tgifPrayerGlow) },
  takeaway: { ground: darkColors.tgifTakeawayGround, glow: stopOf(darkColors.tgifTakeawayGlow) },
};

/** Text and controls on a card: white, whatever the theme. */
export const ink = darkColors.textOnAccent;
