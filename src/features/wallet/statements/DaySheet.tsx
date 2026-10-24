import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { IconButton } from '@/components/Button';
import { BottomSheet } from '@/components/BottomSheet';
import { Text } from '@/components/Text';
import { font, radius, space, useWawu } from '@/theme';

import { daysBetween, monthTitle, monthWeeks, partsOf, shiftMonth, type Day } from './period';

/** A day button is as tall as a chip and as wide as a seventh of the sheet; the weekday letters sit above them. */
const CELL = { height: 40, font: 14.5, weekFont: 12 } as const;
const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;
const WEEKDAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

export type DaySheetProps = {
  visible: boolean;
  onClose: () => void;
  /** What the sheet is for: "First day" or "Last day". */
  title: string;
  /** The day shown as chosen, and the month the sheet opens on. */
  value: Day;
  /** Days after this one cannot be chosen (today in Lagos: a statement never reaches into the future). */
  max: Day;
  onPick: (day: Day) => void;
  testID?: string;
};

/**
 * W38's date chooser: one month of days, Monday first, with arrows to the months either side. It opens on the month
 * of the chosen day and never offers a day after `max`.
 */
export function DaySheet({ visible, onClose, title, value, max, onPick, testID = 'day-sheet' }: DaySheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose} label={title} testID={testID}>
      {/* The sheet's contents are drawn only while it is open, so each opening starts on the chosen day's month. */}
      <Calendar title={title} value={value} max={max} onPick={onPick} testID={testID} />
    </BottomSheet>
  );
}

type CalendarProps = Pick<DaySheetProps, 'title' | 'value' | 'max' | 'onPick'> & { testID: string };

function Calendar({ title, value, max, onPick, testID }: CalendarProps) {
  const { colors } = useWawu();
  const [shown, setShown] = useState<{ year: number; month: number }>(() => partsOf(value));
  const maxParts = partsOf(max);
  const atLastMonth = shown.year * 12 + shown.month >= maxParts.year * 12 + maxParts.month;
  const weeks = monthWeeks(shown.year, shown.month);
  return (
    <>
      <Text variant="cardTitle">{title}</Text>
      <View style={styles.monthRow}>
        <IconButton icon="ChevronLeft" label="Previous month" onPress={() => setShown(shiftMonth(shown.year, shown.month, -1))} testID={`${testID}-prev`} />
        <Text variant="body" accessibilityRole="header" style={[styles.month, font(600)]} testID={`${testID}-month`}>
          {monthTitle(shown.year, shown.month)}
        </Text>
        <IconButton
          icon="ChevronRight"
          label="Next month"
          disabled={atLastMonth}
          onPress={() => setShown(shiftMonth(shown.year, shown.month, 1))}
          testID={`${testID}-next`}
        />
      </View>
      <View style={styles.grid}>
      <View style={styles.week} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {WEEKDAYS.map((d, i) => (
          <Text key={WEEKDAY_NAMES[i]} variant="meta" tone="textMuted" style={[styles.cell, styles.weekday]}>
            {d}
          </Text>
        ))}
      </View>
      {weeks.map((week, w) => (
        <View key={`${shown.year}-${shown.month}-${w}`} style={styles.week}>
          {week.map((day, i) => {
            if (day === null) return <View key={WEEKDAY_NAMES[i]} style={styles.cell} />;
            const disabled = daysBetween(max, day) > 0;
            const chosen = day === value;
            return (
              <Pressable
                key={day}
                testID={`${testID}-${day}`}
                accessibilityRole="button"
                accessibilityLabel={`${partsOf(day).date} ${monthTitle(shown.year, shown.month)}`}
                accessibilityState={{ disabled, selected: chosen }}
                disabled={disabled}
                onPress={() => onPick(day)}
                style={styles.cell}
              >
                <View style={[styles.day, chosen && { backgroundColor: colors.accent }]}>
                  <Text
                    variant="body"
                    style={[styles.dayText, chosen ? font(700) : font(500)]}
                    tone={chosen ? 'textOnAccent' : disabled ? 'textMuted' : 'textPrimary'}
                  >
                    {partsOf(day).date}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md },
  month: { flex: 1, textAlign: 'center' },
  week: { flexDirection: 'row' },
  cell: { flex: 1, height: CELL.height, alignItems: 'center', justifyContent: 'center' },
  weekday: { fontSize: CELL.weekFont, textAlign: 'center', textAlignVertical: 'center' },
  day: { width: CELL.height, height: CELL.height, borderRadius: radius.chip, alignItems: 'center', justifyContent: 'center' },
  grid: { gap: space.xs },
  dayText: { fontSize: CELL.font },
});
