import { StyleSheet, View } from 'react-native';

import { GroupedList } from '@/components/Card';
import { Text } from '@/components/Text';
import { canvasNormalLineHeight, space, text } from '@/theme';

import { subtitleOf, type SwitchGroup } from './groups';
import { SwitchRow } from './SwitchRow';

/** design/_gen/settings.js lines 14 and 15: each group is its small capital label, 8 above its card. */
const LABEL_GAP = space.sm;

export type SwitchGroupsProps<K extends string> = {
  groups: readonly SwitchGroup<K>[];
  valueOf: (key: K) => boolean;
  busy: readonly K[];
  onChange: (key: K, next: boolean) => void;
  testIDPrefix: string;
};

/** The labelled cards of switches that Z3 and Z4 both draw. */
export function SwitchGroups<K extends string>({ groups, valueOf, busy, onChange, testIDPrefix }: SwitchGroupsProps<K>) {
  return (
    <>
      {groups.map((group) => (
        <View key={group.title} style={styles.group}>
          <Text variant="label" accessibilityRole="header" style={styles.label}>
            {group.title}
          </Text>
          <GroupedList testID={`${testIDPrefix}-group-${group.title}`}>
            {group.switches.map((spec) => {
              const on = valueOf(spec.key);
              return (
                <SwitchRow
                  key={spec.key}
                  testID={`${testIDPrefix}-${spec.key}`}
                  title={spec.title}
                  subtitle={subtitleOf(spec, on)}
                  on={on}
                  busy={busy.includes(spec.key)}
                  onChange={(next) => onChange(spec.key, next)}
                />
              );
            })}
          </GroupedList>
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  group: { gap: LABEL_GAP },
  /** The kit's label sets no line height, so the canvas draws it on `normal`. */
  label: { lineHeight: canvasNormalLineHeight(text.label.fontSize ?? 0) },
});
