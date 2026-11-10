import { useState } from 'react';
import { Platform, StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@/components/Button';
import { useAnnounceFocus } from '@/components/FieldScroll';
import { browserOutlineOff } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { IconTile } from '@/components/IconTile';
import { Card } from '@/components/Card';
import { PointsFigure } from '@/components/PointsFigure';
import { Text } from '@/components/Text';
import { fieldMetrics } from '@/components/TextField';
import { canvasNormalLineHeight, font, space, useWawu } from '@/theme';

import type { MyPoints, PointMovement } from './api';
import { endsFirst, endsLine, movementLine, movementLook, pointsInput, signedPoints, WORDS } from './model';

/** design/_gen/points.js line 91, `balBar`: a card 14 by 16, "Your points" at 12.5 muted, the figure (size 22) 4 under it. */
const balanceMetrics = { padV: 14, label: 12.5, under: 4 } as const;

/** The Buy button beside the balance: "Buy points" on PT5 (accented on PT5a, when there are none), "Buy" on PT6. It opens PT4. */
export type BuyButton = { label: string; primary?: boolean; onPress: () => void; testID?: string };

/** "Your points" and the balance, as PT5 and PT6 draw it, with the button that buys more beside it (POINTS-06). */
export function BalanceCard({ points, buy, testID }: { points: number; buy?: BuyButton; testID?: string }) {
  return (
    <Card padded style={styles.balanceCard} testID={testID}>
      <View style={styles.balanceRow}>
        <View style={styles.balanceColumn}>
          <Text variant="caption" style={styles.balanceLabel}>
            {WORDS.yourPoints}
          </Text>
          <View style={styles.balanceFigure}>
            <PointsFigure count={points} size="hero" fit testID="points-balance" />
          </View>
        </View>
        {buy ? <Button testID={buy.testID ?? 'points-buy'} label={buy.label} variant={buy.primary ? 'primary' : 'secondary'} size="pill" onPress={buy.onPress} /> : null}
      </View>
    </Card>
  );
}

/** points.js line 96, `lot`: a row 10 above and below with a hairline under it, the count (size 14.5) and "ends 12 Jan" at 13. */
const lotMetrics = { padV: 10, ends: 13, cardPadV: 12, cardGap: 8 } as const;

/** "When they end": a row for each live lot, the soonest in the warning tone, then the line about the order they are spent in. */
export function LotsCard({ lots, nextExpiry, now }: { lots: MyPoints['lots']; nextExpiry: MyPoints['nextExpiry']; now: Date }) {
  const { colors } = useWawu();
  return (
    <Card padded style={styles.lotsCard} testID="points-lots">
      <View style={styles.lotsColumn}>
        <Text variant="label" accessibilityRole="header">
          {WORDS.whenTheyEnd}
        </Text>
        <View>
          {lots.map((lot) => {
            const first = endsFirst(lot, nextExpiry);
            return (
              <View key={lot.id} testID="points-lot" style={[styles.lot, { borderBottomColor: colors.borderHairline }]}>
                <PointsFigure count={lot.points} size="line" />
                <Text variant="meta" tone={first ? 'warning' : 'textMuted'} style={first ? font(700) : undefined}>
                  {endsLine(lot.expiresAt, now)}
                </Text>
              </View>
            );
          })}
        </View>
        <Text variant="muted">{WORDS.spentFirst}</Text>
      </View>
    </Card>
  );
}

/** points.js line 97, `mv`: a row 10 above and below, a 40 tile, 12 between, the words at 14.5 and the line under them at 12.5, the count at 14.5. */
const movementMetrics = { padV: 10, tile: 40, title: 14.5, line: 12.5, lineTop: 2, amount: 14.5 } as const;

/** One movement: what moved the points in the Hub's words, the day, and the signed count. */
export function MovementRow({ row, now }: { row: PointMovement; now: Date }) {
  const { colors } = useWawu();
  const look = movementLook(row);
  const line = movementLine(row, now);
  const amount = signedPoints(row.points);
  return (
    <View testID="points-movement" accessible accessibilityLabel={[row.label, line, `${amount} points`].filter(Boolean).join(', ')} style={styles.movement}>
      <IconTile icon={look.icon} tone={look.tone} size={movementMetrics.tile} />
      <View style={styles.movementWords}>
        <Text variant="body" numberOfLines={2} style={[font(600), { fontSize: movementMetrics.title, lineHeight: canvasNormalLineHeight(movementMetrics.title) }]}>
          {row.label}
        </Text>
        {line ? (
          <Text variant="body" tone="textMuted" style={[styles.movementLine, { fontSize: movementMetrics.line, lineHeight: canvasNormalLineHeight(movementMetrics.line) }]}>
            {line}
          </Text>
        ) : null}
      </View>
      <Text variant="body" style={[font(700), { fontSize: movementMetrics.amount, lineHeight: canvasNormalLineHeight(movementMetrics.amount), color: row.points > 0 ? colors.positive : colors.textPrimary }]}>
        {amount}
      </Text>
    </View>
  );
}

/** points.js line 99, `field(..., { fs: 22 })`: the kit's 54 tall field with its value at 22. */
const fieldValue = { size: 22, label: fieldMetrics.label } as const;

export type PointsFieldProps = {
  digits: string;
  onChangeDigits: (typed: string) => void;
  /** The line under the field: "You get ₦500". */
  hint?: string;
  /** Why the points cannot be converted, in the Hub's figures. Turns the field red. */
  error?: string;
  disabled?: boolean;
  testID?: string;
};

/**
 * "Points to convert": digits only, shown with thousands commas. The shared `TextField` sets its value at 15.5 and PT6 draws it at
 * 22, so this draws the same box, label and message at the board's size (as paid messages' `PriceField` does).
 */
export function PointsField({ digits, onChangeDigits, hint, error, disabled, testID }: PointsFieldProps) {
  const { colors } = useWawu();
  const [focused, setFocused] = useState(false);
  // R-117: the scroll this field sits in brings it into view above the keyboard when it takes the focus.
  const announceFocus = useAnnounceFocus();
  const bad = Boolean(error);
  const border = bad ? colors.danger : focused && !disabled ? colors.accent : colors.borderHairline;
  const message = error ?? hint;
  return (
    <View style={styles.fieldRoot}>
      <Text variant="secondary" tone="textSecondary" style={styles.fieldLabel}>
        {WORDS.pointsToConvert}
      </Text>
      <View
        style={[
          styles.fieldBox,
          { backgroundColor: colors.surfaceInput, borderColor: border, borderWidth: (focused && !disabled) || bad ? fieldMetrics.ring : StyleSheet.hairlineWidth },
        ]}
      >
        <TextInput
          testID={testID}
          accessibilityLabel={WORDS.pointsToConvert}
          value={pointsInput(digits)}
          onChangeText={onChangeDigits}
          editable={!disabled}
          keyboardType="number-pad"
          selectionColor={colors.accent}
          cursorColor={colors.accent}
          onFocus={() => (setFocused(true), announceFocus())}
          onBlur={() => setFocused(false)}
          style={[styles.fieldInput, Platform.OS === 'web' ? browserOutlineOff : null, { color: colors.textPrimary }]}
        />
      </View>
      {message ? (
        <View style={styles.fieldMessage}>
          {bad ? <Icon name="CircleAlert" size={space.lg} color={colors.danger} strokeWidth={2} /> : null}
          <Text
            variant="caption"
            tone={bad ? 'danger' : 'textMuted'}
            accessibilityLiveRegion={bad ? 'polite' : 'none'}
            accessibilityRole={bad ? 'alert' : undefined}
            style={styles.fieldMessageText}
            testID={testID ? `${testID}-message` : undefined}
          >
            {message}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  balanceCard: { paddingVertical: balanceMetrics.padV },
  balanceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md },
  balanceColumn: { flexShrink: 1, flexGrow: 1, minWidth: 0 },
  balanceLabel: { fontSize: balanceMetrics.label },
  balanceFigure: { marginTop: balanceMetrics.under, alignSelf: 'stretch' },
  lotsCard: { paddingVertical: lotMetrics.cardPadV },
  lotsColumn: { gap: lotMetrics.cardGap },
  lot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: lotMetrics.padV, borderBottomWidth: StyleSheet.hairlineWidth },
  movement: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: movementMetrics.padV },
  movementWords: { flex: 1, minWidth: 0 },
  movementLine: { marginTop: movementMetrics.lineTop },
  fieldRoot: { alignSelf: 'stretch' },
  fieldLabel: { ...font(600), fontSize: fieldValue.label, marginBottom: space.sm },
  fieldBox: { height: fieldMetrics.height, justifyContent: 'center', paddingHorizontal: space.lg, borderRadius: fieldMetrics.radius },
  fieldInput: { ...font(500), fontSize: fieldValue.size, padding: 0 },
  fieldMessage: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.sm },
  fieldMessageText: { flexShrink: 1 },
});

