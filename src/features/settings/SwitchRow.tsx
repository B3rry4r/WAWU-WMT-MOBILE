import { Pressable, StyleSheet, View } from 'react-native';

import { useFocusRing } from '@/components/focusRing';
import { Text } from '@/components/Text';
import { canvasNormalLineHeight, font, space, useWawu } from '@/theme';

import { Switch } from './Switch';

/** design/_gen/settings.js line 6, `tRow`: 60 high, 10 above and below, 12 between the words and the toggle, a 15 title at 600, a 12.5 line under it, 2 apart. */
export const switchRowMetrics = { minHeight: 60, padV: 10, between: 12, title: 15, subtitle: 12.5, subtitleGap: 2 } as const;

export type SwitchRowProps = {
  title: string;
  subtitle?: string;
  on: boolean;
  /** Called with the value the person asked for. */
  onChange: (next: boolean) => void;
  /** A save is in flight: the row ignores taps until it answers, so two taps cannot cross on the way. */
  busy?: boolean;
  testID?: string;
};

/** One switch in a grouped list: the whole row is the control, as a switch to a screen reader. */
export function SwitchRow({ title, subtitle, on, onChange, busy, testID }: SwitchRowProps) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="switch"
      accessibilityLabel={[title, subtitle].filter(Boolean).join(', ')}
      accessibilityState={{ checked: on, busy: Boolean(busy) }}
      aria-checked={on}
      disabled={busy}
      onPress={() => onChange(!on)}
      {...ring.handlers}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surfaceSunken }, ring.style]}
    >
      <View style={styles.words}>
        <Text variant="body" style={[font(600), styles.title]}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="secondary" tone="textMuted" style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Switch on={on} busy={busy} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: switchRowMetrics.between, minHeight: switchRowMetrics.minHeight, paddingVertical: switchRowMetrics.padV },
  words: { flex: 1, minWidth: 0, paddingRight: space.xs },
  /** The kit sets no line height on these two lines, so the canvas draws them on `normal` (the theme's `canvasNormalLineHeight`). */
  title: { fontSize: switchRowMetrics.title, lineHeight: canvasNormalLineHeight(switchRowMetrics.title) },
  subtitle: { fontSize: switchRowMetrics.subtitle, lineHeight: canvasNormalLineHeight(switchRowMetrics.subtitle), marginTop: switchRowMetrics.subtitleGap },
});
