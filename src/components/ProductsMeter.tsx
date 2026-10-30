import { StyleSheet, View, type TextStyle } from 'react-native';

import { dateWords } from '@/features/wallet/history/lagosTime';
import { canvasNormalLineHeight, font, radius, useWawu } from '@/theme';

import { Skeleton } from './Skeleton';
import { Text } from './Text';
import { TierBadge, tierBadgeMetrics } from './TierBadge';

/**
 * R-110 point 2 (owner, 30 Oct 2026; it replaces the 12 by 14 strip of design/_gen/me.js line 17, `prodMeter`, for M1, M19 and the tier
 * screens): a tidy card with 16 all round. Top row: "Products" (13, muted) at the start, the tier's chip at the end. Then the count
 * large (22 at 700, tabular), a 6 high rounded bar (the sunken track, the accent fill), and one muted line under it ("Until 30 Oct 2027", or "Ends").
 */
export const productsMeterMetrics = { pad: 16, label: 13, figure: 22, track: 6, trackRadius: 3, figureGap: 4, barGap: 12, lineGap: 12 } as const;

/** The edge the kit draws inside the card (`box-shadow: inset 0 0 0 1px var(--border-hairline)`): it adds no height. */
const edge = 1;

/** The most the bar can be filled: a person over their allowance (a tier that ended) still draws a full bar, never a longer one. */
export function productsMeterFill(used: number, allowed: number): number {
  if (!(allowed > 0)) return 0;
  return Math.min(1, Math.max(0, used / allowed));
}

/** "2 of 3 products", "0 of 1 product": what a screen reader hears. The figures come from the Hub (`productsUsed`, `productsAllowed`), never from a screen. */
export function productsMeterLine(used: number, allowed: number): string {
  return `${used} of ${allowed} ${allowed === 1 ? 'product' : 'products'}`;
}

/** The large figure on the card: "0 of 10" ("Products" is the label above it). */
export function productsMeterFigure(used: number, allowed: number): string {
  return `${used} of ${allowed}`;
}

/** What the card needs of the person's tier (`GET /me/tier`): its name for the chip, and its state and end date for the line under the bar. */
export type MeterTier = {
  name?: string | null;
  /** The Hub's `state`: `active` runs "Until" its end day, anything else ("ending") "Ends" on it. */
  state?: string | null;
  /** The Hub's `activeUntil`. */
  endsAt?: string | Date | null;
};

/**
 * The line under the bar: "Until 30 Oct 2027" while the tier is `active`, "Ends 30 Oct 2027" once it is `ending` (the Hub's own word for the
 * last days of a term, which the Your tier screen answers with "Renew to keep publishing"). The meter never says "Renews": the Hub carries no
 * renewal flag (G-POLISH-1-1), so it cannot tell a store subscription that renews from a tier granted by a code or a claim that does not
 * (lead ruling, 30 Oct 2026, POLISH-1 patch r1). When the Hub adds `renews`, "Renews" comes back for a running store subscription. `state` and
 * `activeUntil` are the fields read. The day is read in Lagos time, where the tier is sold and renewed, in the board's three-letter month
 * (never Intl, which writes "Sept"); the year is added when the date is not in the current Lagos year, so a 12-month tier never reads as
 * ending today. A tier with no end date (or one that is not a date) has no line.
 */
export function productsMeterRenewal(tier: MeterTier | null | undefined, now: Date = new Date()): string | undefined {
  const day = tier?.endsAt ? new Date(tier.endsAt) : undefined;
  if (!day || Number.isNaN(day.getTime())) return undefined;
  return `${tier?.state === 'active' ? 'Until' : 'Ends'} ${dateWords(day, now)}`;
}

export type ProductsMeterProps = {
  /** Products the person has made live or waiting (`productsUsed`). */
  used: number;
  /** What their tier allows plus any they added (`productsAllowed`). Zero: no tier, so there is no allowance to measure and nothing is drawn. */
  allowed: number;
  /** The tier: its name is the chip, its state and end date the line under the bar. Left out, the card has neither. */
  tier?: MeterTier | null;
  /** The figures are on their way: a block the size of the meter, never a zero. */
  loading?: boolean;
  /** The day the year of the end date is judged against (a test's clock); the real one by default. */
  now?: Date;
  testID?: string;
};

const figureStyle: TextStyle = { fontVariant: ['tabular-nums'] };

/**
 * "Products" and the tier chip, "0 of 10", a bar of how much of the allowance is used, and when the tier renews (M1, M19, and the tier
 * screens). Values by props only. With no allowance it draws nothing: whoever has no tier is shown the way to get one by the screen, as that
 * screen's own board draws it.
 */
export function ProductsMeter({ used, allowed, tier, loading, now, testID }: ProductsMeterProps) {
  const { colors } = useWawu();
  if (loading) {
    return (
      <View testID={testID} style={styles.loading}>
        <Skeleton height={productsMeterHeight} radius={radius.card} testID={testID ? `${testID}-loading` : undefined} />
      </View>
    );
  }
  if (!(allowed > 0)) return null;

  const line = productsMeterLine(used, allowed);
  const fill = productsMeterFill(used, allowed);
  const renewal = productsMeterRenewal(tier, now);
  const name = tier?.name?.trim();
  return (
    <View
      testID={testID}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={[line, name, renewal].filter(Boolean).join('. ')}
      accessibilityValue={{ min: 0, max: allowed, now: Math.min(used, allowed) }}
      style={[
        styles.card,
        {
          backgroundColor: colors.surfaceCard,
          boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: edge, color: colors.borderHairline, inset: true }],
        },
      ]}
    >
      <View style={styles.top}>
        <Text variant="secondary" tone="textMuted" style={styles.label}>
          Products
        </Text>
        {name ? <TierBadge name={name} testID={testID ? `${testID}-tier` : undefined} /> : null}
      </View>
      <Text variant="body" testID={testID ? `${testID}-figure` : undefined} style={[font(700), figureStyle, styles.figure]}>
        {productsMeterFigure(used, allowed)}
      </Text>
      <View style={[styles.track, { backgroundColor: colors.surfaceSunken }]}>
        <View testID={testID ? `${testID}-fill` : undefined} style={[styles.fill, { backgroundColor: colors.accent, width: `${fill * 100}%` }]} />
      </View>
      {renewal ? (
        <Text variant="secondary" tone="textMuted" testID={testID ? `${testID}-renewal` : undefined} style={styles.renewal}>
          {renewal}
        </Text>
      ) : null}
    </View>
  );
}

const m = productsMeterMetrics;
const labelLine = canvasNormalLineHeight(m.label);
const figureLine = Math.round(m.figure * 1.25);
/** The card's height with a line under the bar (what the loading block holds open): the padding, the chip row, the figure, the bar and the line. */
const productsMeterHeight = m.pad * 2 + tierBadgeMetrics.height + m.figureGap + figureLine + m.barGap + m.track + m.lineGap + labelLine;

const styles = StyleSheet.create({
  card: { borderRadius: radius.card, padding: m.pad },
  loading: { height: productsMeterHeight },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: tierBadgeMetrics.height },
  label: { fontSize: m.label, lineHeight: labelLine },
  figure: { fontSize: m.figure, lineHeight: figureLine, marginTop: m.figureGap },
  track: { height: m.track, borderRadius: m.trackRadius, marginTop: m.barGap, overflow: 'hidden' },
  fill: { height: '100%' },
  renewal: { fontSize: m.label, lineHeight: labelLine, marginTop: m.lineGap },
});
