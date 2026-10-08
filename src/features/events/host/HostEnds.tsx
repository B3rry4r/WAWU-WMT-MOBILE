import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { IconTile } from '@/components/IconTile';
import { EmptyState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { canvasNormalLineHeight, layout, space, type, useWawu } from '@/theme';

import { NavBar } from '../chrome';
import { nairaText } from './hostForm';
import type { MyVerification } from './hostApi';

/** events_b.js `foot`: 12 above the button, 24 below it (plus the safe area). */
export const footMetrics = { top: 12, bottom: 24 } as const;
/** kit.js `result`: an 88 circle, a 42 glyph at 2.2, 10 between the parts, the title 8 further down, the line 14.5; events_b.js `submitted`: 120 down, 20 between the result and its line. */
const RESULT = { circle: 88, stroke: 2.2, stack: 10, titleNudge: 8, line: 14.5, top: 120, gap: 20 } as const;

/** What a tick costs a year, from the system: one figure when both ticks cost the same, else "from" the lower. */
export function tickPriceLine(pricing: MyVerification['pricing']): string {
  const low = Math.min(pricing.creator, pricing.professional);
  const same = pricing.creator === pricing.professional;
  return `${same ? '' : 'from '}${nairaText(low)} a year`;
}

/** E21 · Needs a tick: hosting is for verified accounts. Get verified (M11) is added by ME-12, so the screen has only its way back. */
export function HostGate({ pricing, onBack }: { pricing: MyVerification['pricing']; onBack: () => void }) {
  const { colors } = useWawu();
  const insets = useSafeAreaInsets();
  return (
    <View testID="host-gate" style={[styles.root, { backgroundColor: colors.surfacePage, paddingTop: insets.top }]}>
      <NavBar title="Host an event" onBack={onBack} backTestID="host-back" />
      <View style={styles.center}>
        <EmptyState
          icon="BadgeCheck"
          title="Hosting needs a verified tick"
          message={`A creator or professional tick, ${tickPriceLine(pricing)}.`}
        />
      </View>
    </View>
  );
}

/** E16 · Sent for review. */
export function Submitted({ name, onDone }: { name: string; onDone: () => void }) {
  const { colors } = useWawu();
  const insets = useSafeAreaInsets();
  return (
    <View testID="host-submitted" style={[styles.root, { backgroundColor: colors.surfacePage, paddingTop: insets.top }]}>
      <View style={styles.result}>
        <View style={styles.words}>
          <IconTile icon="Clock" tone="warn" size={RESULT.circle} strokeWidth={RESULT.stroke} />
          <Text variant="title" accessibilityRole="header" style={styles.title}>
            Sent for review
          </Text>
          <Text variant="secondary" style={styles.line}>
            {name}
          </Text>
        </View>
        <Text variant="muted" style={styles.note}>
          A person checks it. It goes live on its own once approved.
        </Text>
      </View>
      <View style={[styles.foot, { paddingBottom: footMetrics.bottom + insets.bottom }]}>
        <Button testID="host-done" label="Done" full onPress={onDone} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignSelf: 'center', width: '100%', maxWidth: layout.screenW },
  center: { flex: 1, justifyContent: 'center', paddingHorizontal: layout.gutter },
  result: { flex: 1, paddingTop: RESULT.top, paddingHorizontal: layout.gutter, gap: RESULT.gap },
  words: { alignItems: 'center', gap: RESULT.stack },
  title: { marginTop: RESULT.titleNudge, textAlign: 'center', lineHeight: canvasNormalLineHeight(type.size.title) },
  line: { fontSize: RESULT.line, lineHeight: canvasNormalLineHeight(RESULT.line), textAlign: 'center' },
  note: { textAlign: 'center' },
  foot: { paddingTop: footMetrics.top, paddingHorizontal: layout.gutter, gap: space.sm },
});
