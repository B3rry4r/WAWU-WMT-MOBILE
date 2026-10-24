import { StyleSheet, View } from 'react-native';

import { BrandMark } from '@/components/BrandMark';
import { Icon } from '@/components/icon';
import { Text } from '@/components/Text';
import { MoneyGround } from '@/features/wallet/home/BalanceCard';
import { font, space, useWawu } from '@/theme';

import type { Card } from './api';
import { expiryLine, groupedCardNumber, kindTitle, WORDS } from './model';

/** W29 and W31's card (design/_gen: a 28 corner, 24 all round, the mark top left, the label top right, the chip, the number, the foot). A card is about 1.586 wide for every high. */
const ART = {
  radius: 28,
  pad: 24,
  ratio: 1.586,
  mark: 34,
  chipW: 46,
  chipH: 34,
  chipRadius: 8,
  number: 22,
  label: 12,
  foot: 14,
} as const;

/** The card's face never draws a figure the Hub did not say: dots for a number it has not shown, the last four only when the issuer lists them. */
export type CardArtProps = {
  kind: Card['kind'];
  status: Card['status'];
  last4?: string | null;
  /** The card's secrets, only while they are shown (after the PIN). */
  shown?: {
    number: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
    holder: string;
  } | null;
  testID?: string;
};

export function CardArt({ kind, status, last4, shown, testID }: CardArtProps) {
  const { colors } = useWawu();
  const veiled = status === 'frozen' || status === 'blocked' || status === 'used';
  const dots = last4 ? `•••• •••• •••• ${last4}` : '•••• •••• •••• ••••';
  return (
    <View testID={testID} style={[styles.card, { borderRadius: ART.radius }]} accessibilityLabel={`${kindTitle(kind)}, ${status}`}>
      <MoneyGround corner={ART.radius} glowId={`card-glow-${testID ?? 'art'}`} />
      <View style={[styles.face, veiled ? styles.veiled : null]}>
        <View style={styles.top}>
          <BrandMark width={ART.mark} surface="dark" decorative />
          <Text variant="label" tone="textOnAccent" style={[font(700), styles.kind]}>
            {kind === 'single_use' ? 'SINGLE-USE' : 'VIRTUAL'}
          </Text>
        </View>
        <View style={[styles.chip, { backgroundColor: colors.textOnAccent }]} />
        <View>
          <Text
            variant="body"
            tone="textOnAccent"
            selectable={Boolean(shown)}
            testID={testID ? `${testID}-number` : undefined}
            style={[font(700), styles.number]}
          >
            {shown ? groupedCardNumber(shown.number) : dots}
          </Text>
          <View style={styles.foot}>
            <Text variant="body" tone="textOnAccent" numberOfLines={1} style={[font(600), styles.footText]}>
              {shown ? shown.holder.toUpperCase() : WORDS.title.toUpperCase()}
            </Text>
            {shown ? (
              <Text variant="body" tone="textOnAccent" testID={testID ? `${testID}-secrets` : undefined} style={[font(600), styles.footText]}>
                {`${expiryLine(shown.expiryMonth, shown.expiryYear)}   CVV ${shown.cvv}`}
              </Text>
            ) : (
              <Text variant="body" tone="textOnAccent" style={[font(700), styles.footText]}>
                USD
              </Text>
            )}
          </View>
        </View>
      </View>
      {veiled ? (
        <View pointerEvents="none" style={styles.stamp} testID={testID ? `${testID}-stamp` : undefined}>
          <Icon name={status === 'frozen' ? 'Snowflake' : status === 'used' ? 'Check' : 'Ban'} size={34} color={colors.textOnAccent} />
          <Text variant="body" tone="textOnAccent" style={[font(700), styles.stampText]}>
            {status === 'frozen' ? 'Frozen' : status === 'used' ? 'Used' : 'Blocked'}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { width: '100%', aspectRatio: ART.ratio, overflow: 'hidden' },
  face: { flex: 1, padding: ART.pad, justifyContent: 'space-between' },
  veiled: { opacity: 0.3 },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kind: { fontSize: ART.label, letterSpacing: 1.2, opacity: 0.75 },
  chip: {
    width: ART.chipW,
    height: ART.chipH,
    borderRadius: ART.chipRadius,
    opacity: 0.55,
  },
  number: { fontSize: ART.number, letterSpacing: 2 },
  foot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: space.md,
    gap: space.md,
  },
  footText: { fontSize: ART.foot, letterSpacing: 0.6, opacity: 0.85 },
  stamp: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  stampText: { fontSize: 18 },
});
