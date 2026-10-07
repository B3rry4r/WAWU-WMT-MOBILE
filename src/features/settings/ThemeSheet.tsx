import { Pressable, StyleSheet, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { Text } from '@/components/Text';
import { font, space, useWawu } from '@/theme';

import { THEME_CHOICES, THEME_LABEL, type ThemeChoice } from './devicePrefs';

/** A choice is as tall as a settings row's tap target and shows a check on the one in use. */
const choiceMetrics = { height: 52, title: 15.5, check: 20 } as const;

export type ThemeSheetProps = {
  visible: boolean;
  value: ThemeChoice;
  onPick: (choice: ThemeChoice) => void;
  onClose: () => void;
};

/** Z2's Theme row opens this: System follows the phone, Light and Dark pin the app. */
export function ThemeSheet({ visible, value, onPick, onClose }: ThemeSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose} label="Theme" testID="theme-sheet">
      <Text variant="sheetTitleSm">Theme</Text>
      <View accessibilityRole="radiogroup" style={styles.choices}>
        {THEME_CHOICES.map((choice) => (
          <Choice key={choice} choice={choice} chosen={choice === value} onPress={() => onPick(choice)} />
        ))}
      </View>
    </BottomSheet>
  );
}

function Choice({ choice, chosen, onPress }: { choice: ThemeChoice; chosen: boolean; onPress: () => void }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID={`theme-${choice}`}
      accessibilityRole="radio"
      accessibilityLabel={THEME_LABEL[choice]}
      accessibilityState={{ checked: chosen }}
      aria-checked={chosen}
      onPress={onPress}
      {...ring.handlers}
      style={({ pressed }) => [styles.choice, pressed && { backgroundColor: colors.surfaceSunken }, ring.style]}
    >
      <Text variant="body" style={[font(chosen ? 700 : 600), { fontSize: choiceMetrics.title }]}>
        {THEME_LABEL[choice]}
      </Text>
      {chosen ? <Icon name="Check" size={choiceMetrics.check} color={colors.accentFg} strokeWidth={2.4} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  choices: { gap: space.xs },
  choice: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: choiceMetrics.height },
});
