import { Pressable, StyleSheet } from 'react-native';

import { pressScale } from '@/components/Button';
import { useFocusRing } from '@/components/focusRing';
import { ICON_STROKE, Icon } from '@/components/icon';
import { unbuilt } from '@/lib/unbuilt';
import { layout, useWawu } from '@/theme';

/**
 * design/_gen/kit.js `Fab`: a 58 accent circle with a 26 white plus (stroke 2.4) and the FAB shadow, 18 in from the
 * right and 106 above the phone's bottom edge. The screen ends where the tab bar begins, so the offset here is the
 * canvas's 106 less the bar's own height.
 */
export const createButtonMetrics = { size: 58, glyph: 26, right: 18, bottom: 106 - layout.tabbarH } as const;

/**
 * The Create button over Explore (X1, X14), for creator accounts only (R-38, DECISIONS: Create stays the floating button
 * for creator accounts). Create (M19) is ME-04's: until it is built the button is drawn and opens nothing.
 */
export function CreateButton() {
  const { colors, shadows } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID="explore-create"
      accessibilityRole="button"
      accessibilityLabel="Create"
      onPress={unbuilt('ME-04')}
      {...ring.handlers}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: colors.accent, boxShadow: shadows.fab, transform: [{ scale: pressed ? pressScale : 1 }] },
        ring.style,
      ]}
    >
      <Icon name="Plus" size={createButtonMetrics.glyph} color={colors.textOnAccent} strokeWidth={ICON_STROKE.fab} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    right: createButtonMetrics.right,
    bottom: createButtonMetrics.bottom,
    width: createButtonMetrics.size,
    height: createButtonMetrics.size,
    borderRadius: createButtonMetrics.size / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
