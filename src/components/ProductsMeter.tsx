import { StyleSheet, View } from 'react-native';

import { dateWords } from '@/features/wallet/history/lagosTime';
import { canvasNormalLineHeight, font, radius, useWawu } from '@/theme';

import { Skeleton } from './Skeleton';
import { Text } from './Text';

/**
 * design/_gen/me.js line 17, `prodMeter` (M1, M19; the same strip on M2 to M4): 18 corner, 12 by 14 padding, the line 13.5 with its figure at
 * 600, a 6 high track with a 3 corner 8 under the line, a 12 gap between the figures and the caption.
 */
export const productsMeterMetrics = { padV: 12, padH: 14, font: 13.5, track: 6, trackRadius: 3, trackGap: 8, captionGap: 12 } as const;

/** The edge the kit draws inside the card (`box-shadow: inset 0 0 0 1px var(--border-hairline)`): it adds no height. */
const edge = 1;

/** The most the bar can be filled: a person over their allowance (a tier that ended) still draws a full bar, never a longer one. */
export function productsMeterFill(used: number, allowed: number): number {
  if (!(allowed > 0)) return 0;
  return Math.min(1, Math.max(0, used / allowed));
}

/** "2 of 3 products", "0 of 1 product". The figures come from the Hub (`productsUsed`, `productsAllowed`), never from a screen. */
export function productsMeterLine(used: number, allowed: number): string {
  return `${used} of ${allowed} ${allowed === 1 ? 'product' : 'products'}`;
}

/**
 * The caption's text: "Verify · ends 26 Nov". The day is read in Lagos time, where the tier is sold and renewed, so a
 * person abroad sees the same day as the Hub's receipts, in the board's three-letter month (never Intl, which writes "Sept"). The
 * year is added when the date is not in the current Lagos year ("Verify · ends 18 Oct 2027"), so a 12-month tier never reads as
 * ending today. A tier with no end date (or one that is not a date) is its name alone.
 */
export function productsMeterCaption(tierName: string | null | undefined, endsAt?: string | Date | null, now: Date = new Date()): string | undefined {
  const day = endsAt ? new Date(endsAt) : undefined;
  const ends = day && !Number.isNaN(day.getTime()) ? `ends ${dateWords(day, now)}` : undefined;
  if (tierName && ends) return `${tierName} · ${ends}`;
  return tierName || ends || undefined;
}

export type ProductsMeterProps = {
  /** Products the person has made live or waiting (`productsUsed`). */
  used: number;
  /** What their tier allows plus any they added (`productsAllowed`). Zero: no tier, so there is no allowance to measure and nothing is drawn. */
  allowed: number;
  /** The grey words on the right, usually `productsMeterCaption(tier.name, activeUntil)`. */
  caption?: string;
  /** The figures are on their way: a block the size of the meter, never a zero. */
  loading?: boolean;
  testID?: string;
};

/**
 * "2 of 3 products" with a bar of how much of the allowance is used (M1, M19, and the tier screens). Values by props only.
 * With no allowance it draws nothing: whoever has no tier is shown the way to get one by the screen, as that screen's own board draws it.
 */
export function ProductsMeter({ used, allowed, caption, loading, testID }: ProductsMeterProps) {
  const { colors } = useWawu();
  if (loading) {
    return (
      <View testID={testID} style={styles.loading}>
        <Skeleton height={productsMeterHeight} radius={radius.tile} testID={testID ? `${testID}-loading` : undefined} />
      </View>
    );
  }
  if (!(allowed > 0)) return null;

  const line = productsMeterLine(used, allowed);
  const fill = productsMeterFill(used, allowed);
  return (
    <View
      testID={testID}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={caption ? `${line}. ${caption}` : line}
      accessibilityValue={{ min: 0, max: allowed, now: Math.min(used, allowed) }}
      style={[
        styles.card,
        {
          backgroundColor: colors.surfaceCard,
          boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: edge, color: colors.borderHairline, inset: true }],
        },
      ]}
    >
      <View style={styles.line}>
        <Text variant="body" style={[font(600), styles.figure]}>
          {line}
        </Text>
        {caption ? (
          <Text variant="body" tone="textMuted" style={styles.caption} numberOfLines={1}>
            {caption}
          </Text>
        ) : null}
      </View>
      <View style={[styles.track, { backgroundColor: colors.surfaceSunken }]}>
        <View testID={testID ? `${testID}-fill` : undefined} style={[styles.fill, { backgroundColor: colors.accent, width: `${fill * 100}%` }]} />
      </View>
    </View>
  );
}

/** The card's height on the board: the kit sets no line height there, so the canvas takes the font's own (17 at 13.5), then the gap, the track and the padding (what the loading block holds open). */
const lineHeight = canvasNormalLineHeight(productsMeterMetrics.font);
const productsMeterHeight = productsMeterMetrics.padV * 2 + lineHeight + productsMeterMetrics.trackGap + productsMeterMetrics.track;

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.tile,
    paddingVertical: productsMeterMetrics.padV,
    paddingHorizontal: productsMeterMetrics.padH,
  },
  loading: { height: productsMeterHeight },
  line: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: productsMeterMetrics.captionGap },
  figure: { fontSize: productsMeterMetrics.font, lineHeight },
  caption: { fontSize: productsMeterMetrics.font, lineHeight, flexShrink: 1 },
  track: { height: productsMeterMetrics.track, borderRadius: productsMeterMetrics.trackRadius, marginTop: productsMeterMetrics.trackGap, overflow: 'hidden' },
  fill: { height: '100%' },
});
