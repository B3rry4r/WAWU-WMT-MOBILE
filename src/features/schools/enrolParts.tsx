import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useFocusRing } from '@/components/focusRing';
import { Text } from '@/components/Text';
import { NavBar } from '@/features/events/chrome';
import { canvasNormalLineHeight, font, layout, space, useWawu } from '@/theme';

import type { IntakeView } from './api';
import { classLine, longDay, monthName, startsLine } from './enrolModel';

/**
 * design/_gen/schools.js, SC4 (`enroll`, `pre`, `cohort`): the details card pads 12 above and below and 16 at the sides, each
 * row 46 high with a hairline under it, the label 13.5 and the value 14.5 at 600; a class is a card of 14 padding at corner 18,
 * its title 15 at 600 over its line (12.5, muted) and a 22 radio; the body keeps 16 between its parts; the foot pads 12 above and
 * 20 at the sides, with 34 below.
 */
export const enrolMetrics = {
  bodyTop: space.sm,
  partGap: 16,
  cardPadV: 12,
  cardPadH: 16,
  row: 46,
  rowLabel: 13.5,
  rowValue: 14.5,
  badgeGap: 6,
  badgeText: 12.5,
  classPad: 14,
  classCorner: 18,
  classGap: 10,
  classTitle: 15,
  classLine: 12.5,
  classTextGap: 2,
  radio: 22,
  radioOn: 6.5,
  radioOff: 1.5,
  footTop: 12,
  footBottom: 34,
  footGap: 12,
} as const;

/** One row of a details card: the label and the value, a hairline under it. */
export function DetailRow({ label, value, testID }: { label: string; value: string; testID?: string }) {
  const { colors } = useWawu();
  return (
    <View
      testID={testID}
      style={[styles.row, { boxShadow: [{ offsetX: 0, offsetY: -1, blurRadius: 0, spreadDistance: 0, color: colors.borderHairline, inset: true }] }]}
    >
      <Text variant="body" tone="textSecondary" style={styles.rowLabel}>
        {label}
      </Text>
      <Text variant="body" numberOfLines={1} style={styles.rowValue}>
        {value}
      </Text>
    </View>
  );
}

/** A card of rows padded as SC4 draws it (12 and 16), so the first row's hairline is not the card's own edge. */
export function DetailsCard({ children, testID }: { children: ReactNode; testID?: string }) {
  return (
    <Card testID={testID} style={styles.details}>
      {children}
    </Card>
  );
}

export type ClassOptionProps = {
  intake: IntakeView;
  selected: boolean;
  /** A full class cannot be picked. */
  disabled?: boolean;
  onPress: () => void;
  testID?: string;
};

/** A class in SC4's "Pick a class": "Starts 3 November", its days and place and the seats left, a radio at the end. */
export function ClassOption({ intake, selected, disabled, onPress, testID }: ClassOptionProps) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled: disabled === true }}
      accessibilityLabel={`${startsLine(intake)}. ${classLine(intake)}`}
      disabled={disabled}
      onPress={onPress}
      {...ring.handlers}
      style={[
        styles.option,
        ring.style,
        {
          backgroundColor: selected ? colors.accentTint : colors.surfaceCard,
          boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: selected ? 1.5 : 1, color: selected ? colors.accent : colors.borderHairline, inset: true }],
          opacity: disabled ? 0.6 : 1,
        },
      ]}
    >
      <View style={styles.optionText}>
        <Text variant="body" style={styles.optionTitle}>
          {startsLine(intake)}
        </Text>
        <Text variant="secondary" tone="textMuted" style={styles.optionLine}>
          {classLine(intake)}
        </Text>
      </View>
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[
          styles.radio,
          {
            boxShadow: [
              {
                offsetX: 0,
                offsetY: 0,
                blurRadius: 0,
                spreadDistance: selected ? enrolMetrics.radioOn : enrolMetrics.radioOff,
                color: selected ? colors.accent : colors.borderStrong,
                inset: true,
              },
            ],
          },
        ]}
      />
    </Pressable>
  );
}

export type ClassFullFootProps = {
  /** The class that is full: its start day. */
  fullStart: string;
  /** The soonest other class with a seat, or null when there is none. */
  next: Pick<IntakeView, 'startDate'> | null;
  /** "Enroll for January". Not drawn when no other class has a seat. */
  onEnrollNext: () => void;
  busy?: boolean;
  testID?: string;
};

/**
 * SC11 · Class full: the warning "The November class is full / The next one starts 12 January." over "Enroll for January", in the
 * foot where Enroll and Continue sit. With no other class that has a seat the banner says so and there is no button (the button
 * would lead nowhere, R-47). Every word is read from the classes the Hub served.
 */
export function ClassFullFoot({ fullStart, next, onEnrollNext, busy, testID }: ClassFullFootProps) {
  const month = monthName(fullStart);
  const title = month === '' ? 'This class is full' : `The ${month} class is full`;
  const body = next ? `The next one starts ${longDay(next.startDate)}.` : 'No other class has a seat right now. Check back later.';
  const nextMonth = next ? monthName(next.startDate) : '';
  return (
    <View testID={testID} style={styles.fullFoot}>
      <Banner tone="warning" icon="Users" title={title} body={body} testID={testID ? `${testID}-banner` : undefined} />
      {next ? <Button testID={testID ? `${testID}-enroll` : undefined} label={nextMonth === '' ? 'Enroll in the next class' : `Enroll for ${nextMonth}`} full loading={busy} onPress={onEnrollNext} /> : null}
    </View>
  );
}

/** The bar every enrolment screen shares: back, "Enroll" and the course under it. */
export function EnrolBar({ course, onBack, backTestID }: { course?: string; onBack: () => void; backTestID?: string }) {
  return <NavBar title="Enroll" subtitle={course} onBack={onBack} backTestID={backTestID} />;
}

/** The foot under an enrolment screen: 12 above, the gutter at the sides, 34 (or the phone's own inset) below. */
export function EnrolFoot({ children, testID }: { children: ReactNode; testID?: string }) {
  const { colors } = useWawu();
  const insets = useSafeAreaInsets();
  return (
    <View testID={testID} style={[styles.foot, { backgroundColor: colors.surfacePage, paddingBottom: Math.max(insets.bottom, enrolMetrics.footBottom) }]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: enrolMetrics.row, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.lg },
  rowLabel: { fontSize: enrolMetrics.rowLabel, lineHeight: canvasNormalLineHeight(enrolMetrics.rowLabel), flexShrink: 0 },
  rowValue: { ...font(600), fontSize: enrolMetrics.rowValue, lineHeight: canvasNormalLineHeight(enrolMetrics.rowValue), flexShrink: 1, textAlign: 'right' },
  details: { paddingVertical: enrolMetrics.cardPadV, paddingHorizontal: enrolMetrics.cardPadH },
  option: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: enrolMetrics.classPad, borderRadius: enrolMetrics.classCorner },
  optionText: { flex: 1, gap: enrolMetrics.classTextGap },
  optionTitle: { ...font(600), fontSize: enrolMetrics.classTitle, lineHeight: canvasNormalLineHeight(enrolMetrics.classTitle) },
  optionLine: { fontSize: enrolMetrics.classLine, lineHeight: canvasNormalLineHeight(enrolMetrics.classLine) },
  radio: { width: enrolMetrics.radio, height: enrolMetrics.radio, borderRadius: enrolMetrics.radio / 2, flexShrink: 0 },
  fullFoot: { gap: enrolMetrics.footGap },
  foot: { paddingTop: enrolMetrics.footTop, paddingHorizontal: layout.gutter, gap: enrolMetrics.footGap },
});
