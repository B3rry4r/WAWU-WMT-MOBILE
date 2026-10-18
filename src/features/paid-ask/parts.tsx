import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icon';
import { Skeleton } from '@/components/Skeleton';
import { Text } from '@/components/Text';
import { useFocusRing } from '@/components/focusRing';
import { font, radius, space, text as textStyles, useWawu } from '@/theme';

import type { StatusCard } from './model';

/** design/_gen/inbox.js `heldCard`: an 18 corner on the tone's tint, 12 by 14 inside, an 18 mark 11 from the words; the title 14 / 600, the line 12.5 on a 1.4, 2 under it. */
const cardMetrics = { corner: 18, padV: 12, padH: 14, between: 11, mark: 18, title: 14, body: 12.5, bodyLine: 1.4, bodyTop: 2, loadingWidth: '60%', loadingCorner: 8 } as const;

const looks: Record<StatusCard['tone'], { tint: 'warningTint' | 'positiveTint'; ink: 'warning' | 'positive'; icon: IconName }> = {
  waiting: { tint: 'warningTint', ink: 'warning', icon: 'Clock' },
  late: { tint: 'warningTint', ink: 'warning', icon: 'Clock' },
  answered: { tint: 'positiveTint', ink: 'positive', icon: 'CircleCheck' },
  refunded: { tint: 'positiveTint', ink: 'positive', icon: 'RotateCcw' },
};

/** I4's countdown, I5's "answered" and I7's refund: the Hub's state of one question, in words. */
export function StatusCardView({ card, testID }: { card: StatusCard; testID?: string }) {
  const { colors } = useWawu();
  const look = looks[card.tone];
  return (
    <View testID={testID} accessibilityRole="summary" style={[styles.card, { backgroundColor: colors[look.tint] }]}>
      <Icon name={look.icon} size={cardMetrics.mark} color={colors[look.ink]} strokeWidth={2.2} />
      <View style={styles.words}>
        <Text variant="body" style={[font(600), { fontSize: cardMetrics.title }]} testID={testID ? `${testID}-title` : undefined}>
          {card.title}
        </Text>
        {card.body === null ? (
          // The line is not known yet (I5 before the creator's terms are here): a loading line, never "closed" or an offer by guess.
          <Skeleton testID={testID ? `${testID}-body-loading` : undefined} width={cardMetrics.loadingWidth} height={cardMetrics.body * cardMetrics.bodyLine} radius={cardMetrics.loadingCorner} style={styles.bodyLoading} />
        ) : (
          <Text variant="caption" tone="textSecondary" style={styles.body} testID={testID ? `${testID}-body` : undefined}>
            {card.body}
          </Text>
        )}
      </View>
    </View>
  );
}

/** design/_gen/inbox.js `composer`: 10 above, 16 at the sides, a hairline on top; the field at least 44 high with a 22 corner, 10 by 16 inside, 15 on a 1.35; a 44 round send button. */
const composerMetrics = { padTop: 10, padH: 16, between: 8, field: 44, corner: 22, padV: 10, padX: 16, font: 15, line: 1.35, round: 44, arrow: 20 } as const;

function Bar({ children, testID }: { children: React.ReactNode; testID: string }) {
  const { colors } = useWawu();
  const insets = useSafeAreaInsets();
  return (
    <View testID={testID} style={[styles.bar, { backgroundColor: colors.surfaceChrome, borderTopColor: colors.borderHairline, paddingBottom: Math.max(insets.bottom, space.lg) }]}>
      {children}
    </View>
  );
}

/** I4's composer: locked while a question waits ("You can send once Chidi replies"). Nothing to type into and nothing to send. */
export function LockedComposer({ line }: { line: string }) {
  const { colors } = useWawu();
  return (
    <Bar testID="paid-composer-locked">
      <View style={styles.row}>
        <TextInput
          testID="paid-composer-locked-field"
          editable={false}
          value=""
          placeholder={line}
          placeholderTextColor={colors.textMuted}
          accessibilityLabel={line}
          style={[styles.field, textStyles.body, { backgroundColor: colors.surfaceInput, color: colors.textPrimary, boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: 1, color: colors.borderHairline, inset: true }] }]}
        />
        <View style={[styles.round, { backgroundColor: colors.surfaceSunken }]}>
          <Icon name="ArrowUp" size={composerMetrics.arrow} color={colors.textDisabled} strokeWidth={2.4} />
        </View>
      </View>
    </Bar>
  );
}

/** I5's and I7's composer: the field and the arrow are one button that opens the ask sheet ("Ask a follow-up · ₦1,500", "Try again · ₦200"). */
export function AskComposer({ label, onPress }: { label: string; onPress: () => void }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Bar testID="paid-composer">
      <Pressable testID="paid-composer-ask" accessibilityRole="button" accessibilityLabel={label} onPress={onPress} {...ring.handlers} style={[styles.row, ring.style]}>
        <View style={[styles.field, styles.fieldCenter, { backgroundColor: colors.surfaceInput, boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: 1, color: colors.borderHairline, inset: true }] }]}>
          <Text variant="body" tone="textMuted" numberOfLines={1} style={{ fontSize: composerMetrics.font }}>
            {label}
          </Text>
        </View>
        <View style={[styles.round, { backgroundColor: colors.surfaceSunken }]}>
          <Icon name="ArrowUp" size={composerMetrics.arrow} color={colors.textDisabled} strokeWidth={2.4} />
        </View>
      </Pressable>
    </Bar>
  );
}

/** The creator is not taking paid questions: the Hub's state, in place of a composer. */
export function ClosedComposer({ line }: { line: string }) {
  return (
    <Bar testID="paid-composer-closed">
      <Text variant="secondary" tone="textMuted" style={[font(600), styles.closed]} accessibilityLiveRegion="polite">
        {line}
      </Text>
    </Bar>
  );
}

/** While the Hub has not said whether the creator takes questions: an empty bar of the composer's own height. */
export function WaitingComposer() {
  return (
    <Bar testID="paid-composer-loading">
      <Skeleton height={composerMetrics.field} radius={composerMetrics.corner} />
    </Bar>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'flex-start', gap: cardMetrics.between, borderRadius: cardMetrics.corner, paddingVertical: cardMetrics.padV, paddingHorizontal: cardMetrics.padH, alignSelf: 'stretch' },
  words: { flex: 1, minWidth: 0 },
  body: { fontSize: cardMetrics.body, lineHeight: cardMetrics.body * cardMetrics.bodyLine, marginTop: cardMetrics.bodyTop },
  bodyLoading: { marginTop: cardMetrics.bodyTop },
  bar: { paddingTop: composerMetrics.padTop, paddingHorizontal: composerMetrics.padH, borderTopWidth: StyleSheet.hairlineWidth },
  row: { flexDirection: 'row', alignItems: 'center', gap: composerMetrics.between },
  field: {
    flex: 1,
    minHeight: composerMetrics.field,
    borderRadius: composerMetrics.corner,
    paddingVertical: composerMetrics.padV,
    paddingHorizontal: composerMetrics.padX,
    fontSize: composerMetrics.font,
    lineHeight: composerMetrics.font * composerMetrics.line,
  },
  fieldCenter: { justifyContent: 'center' },
  round: { width: composerMetrics.round, height: composerMetrics.round, borderRadius: radius.chip, alignItems: 'center', justifyContent: 'center' },
  closed: { textAlign: 'center', paddingBottom: space.xs },
});
