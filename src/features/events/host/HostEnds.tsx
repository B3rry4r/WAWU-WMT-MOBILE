import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { IconTile } from '@/components/IconTile';
import { Text } from '@/components/Text';
import { unbuilt } from '@/lib/unbuilt';
import { canvasNormalLineHeight, font, layout, space, type, useWawu } from '@/theme';

import { NavBar } from '../chrome';
import { nairaText } from './hostForm';
import type { MyVerification } from './hostApi';

/** events_b.js `foot`: 12 above the button, 24 below it (plus the safe area). */
export const footMetrics = { top: 12, bottom: 24 } as const;
/** kit.js `result`: an 88 circle, a 42 glyph at 2.2, 10 between the parts, the title 8 further down, the line 14.5; events_b.js `submitted`: 120 down, 20 between the result and its line. */
/** kit.js `empty` with an action: a 56 circle, 10 between, the title 4 lower, words held to 280, the button 6 further, 26 above and below. */
const GATE = { icon: 56, stack: 10, titleNudge: 4, maxWidth: 280, action: 6, padV: 26, bodyTop: 8, bodyBottom: 120 } as const;
const RESULT = { circle: 88, stroke: 2.2, stack: 10, titleNudge: 8, line: 14.5, top: 120, between: 20, pairBetween: 10 } as const;

/** What a tick costs a year, from the system: one figure when both ticks cost the same, else "from" the lower. */
export function tickPriceLine(pricing: MyVerification['pricing']): string {
  const low = Math.min(pricing.creator, pricing.professional);
  const same = pricing.creator === pricing.professional;
  return `${same ? '' : 'from '}${nairaText(low)} a year`;
}

/** E21 · Needs a tick: hosting is for verified accounts. Get verified (M11) is built by ME-12, so its button is drawn and does nothing yet (R-46). */
export function HostGate({ pricing, onBack }: { pricing: MyVerification['pricing']; onBack: () => void }) {
  const { colors } = useWawu();
  const insets = useSafeAreaInsets();
  return (
    <View testID="host-gate" style={[styles.root, { backgroundColor: colors.surfacePage, paddingTop: insets.top }]}>
      <NavBar title="Host an event" onBack={onBack} backTestID="host-back" />
      <View style={styles.center}>
        <View style={styles.gate}>
          <IconTile icon="BadgeCheck" size={GATE.icon} />
          <Text variant="h3" accessibilityRole="header" style={[font(600), styles.gateTitle]}>
            Hosting needs a verified tick
          </Text>
          <Text variant="secondary" tone="textSecondary" style={styles.gateWords}>
            {`A creator or professional tick, ${tickPriceLine(pricing)}.`}
          </Text>
          <View style={styles.gateAction}>
            <Button testID="host-get-verified" label="Get verified" size="md" onPress={unbuilt('ME-12')} />
          </View>
        </View>
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
        <View style={styles.pair}>
          <View style={styles.half}>
            <Button testID="host-my-events" label="My events" variant="secondary" full onPress={unbuilt('EVENTS-08')} />
          </View>
          <View style={styles.half}>
            <Button testID="host-done" label="Done" full onPress={onDone} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignSelf: 'center', width: '100%', maxWidth: layout.screenW },
  center: { flex: 1, justifyContent: 'center', paddingHorizontal: layout.gutter, paddingTop: GATE.bodyTop, paddingBottom: GATE.bodyBottom },
  result: { flex: 1, paddingTop: RESULT.top, paddingHorizontal: layout.gutter, gap: RESULT.between },
  gate: { alignItems: 'center', gap: GATE.stack, paddingVertical: GATE.padV, paddingHorizontal: space.lg },
  gateTitle: { marginTop: GATE.titleNudge, textAlign: 'center' },
  gateWords: { textAlign: 'center', maxWidth: GATE.maxWidth },
  gateAction: { marginTop: GATE.action },
  pair: { flexDirection: 'row', gap: RESULT.pairBetween },
  half: { flex: 1 },
  words: { alignItems: 'center', gap: RESULT.stack },
  title: { marginTop: RESULT.titleNudge, textAlign: 'center', lineHeight: canvasNormalLineHeight(type.size.title) },
  line: { fontSize: RESULT.line, lineHeight: canvasNormalLineHeight(RESULT.line), textAlign: 'center' },
  note: { textAlign: 'center' },
  foot: { paddingTop: footMetrics.top, paddingHorizontal: layout.gutter, gap: space.sm },
});
