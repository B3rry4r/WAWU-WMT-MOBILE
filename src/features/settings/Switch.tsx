import { StyleSheet, View } from 'react-native';

import { blackAt } from '@/components/shadow';
import { useWawu } from '@/theme';

/** design/_gen/kit.js line 59, `toggle`: a 51 by 31 pill, a 27 knob 2 in from the edge, shadow `0 2px 4px` black at 20%. */
export const switchMetrics = { width: 51, height: 31, knob: 27, inset: 2, knobShadowY: 2, knobShadowBlur: 4, knobShadowAlpha: 0.2, ring: 1 } as const;

/**
 * The drawing of the design's toggle: accent when on, the sunken surface with a strong ring when off.
 * It is not pressable itself; the row that holds it is (see `SwitchRow`).
 */
export function Switch({ on, busy }: { on: boolean; busy?: boolean }) {
  const { colors } = useWawu();
  const travel = switchMetrics.width - switchMetrics.knob - 2 * switchMetrics.inset;
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.track,
        {
          backgroundColor: on ? colors.accent : colors.surfaceSunken,
          boxShadow: on ? undefined : [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: switchMetrics.ring, color: colors.borderStrong, inset: true }],
          opacity: busy ? 0.6 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.knob,
          {
            backgroundColor: colors.textOnAccent,
            left: switchMetrics.inset + (on ? travel : 0),
            boxShadow: [{ offsetX: 0, offsetY: switchMetrics.knobShadowY, blurRadius: switchMetrics.knobShadowBlur, color: blackAt(switchMetrics.knobShadowAlpha) }],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: switchMetrics.width, height: switchMetrics.height, borderRadius: switchMetrics.height / 2, flexShrink: 0 },
  knob: { position: 'absolute', top: switchMetrics.inset, width: switchMetrics.knob, height: switchMetrics.knob, borderRadius: switchMetrics.knob / 2 },
});
