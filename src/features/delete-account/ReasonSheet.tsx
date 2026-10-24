import { Pressable, StyleSheet, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { Text } from '@/components/Text';
import { font, space, useWawu } from '@/theme';

import type { LeavingReason } from './api';
import { LEAVING_REASONS } from './model';

/** The Theme sheet's choice (Z2): 52 high, a 15.5 title, a check on the one chosen. */
const choiceMetrics = { height: 52, title: 15.5, check: 20 } as const;

export type ReasonSheetProps = {
  visible: boolean;
  value: LeavingReason | null;
  /** The reason picked, or null when the one already chosen is tapped again (the question is optional). */
  onPick: (reason: LeavingReason | null) => void;
  onClose: () => void;
};

/** Z7's "Why are you leaving?" choices. Optional: tapping the chosen one again clears it. */
export function ReasonSheet({ visible, value, onPick, onClose }: ReasonSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose} label="Why are you leaving?" testID="reason-sheet">
      <Text variant="sheetTitleSm">Why are you leaving?</Text>
      <View accessibilityRole="radiogroup" style={styles.choices}>
        {LEAVING_REASONS.map((choice) => (
          <Choice key={choice.code} code={choice.code} label={choice.label} chosen={choice.code === value} onPress={() => onPick(choice.code === value ? null : choice.code)} />
        ))}
      </View>
    </BottomSheet>
  );
}

function Choice({ code, label, chosen, onPress }: { code: LeavingReason; label: string; chosen: boolean; onPress: () => void }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID={`reason-${code}`}
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ checked: chosen }}
      aria-checked={chosen}
      onPress={onPress}
      {...ring.handlers}
      style={({ pressed }) => [styles.choice, pressed && { backgroundColor: colors.surfaceSunken }, ring.style]}
    >
      <Text variant="body" style={[font(chosen ? 700 : 600), { fontSize: choiceMetrics.title, flex: 1 }]}>
        {label}
      </Text>
      {chosen ? <Icon name="Check" size={choiceMetrics.check} color={colors.accentFg} strokeWidth={2.4} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  choices: { gap: space.xs },
  choice: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: choiceMetrics.height },
});
