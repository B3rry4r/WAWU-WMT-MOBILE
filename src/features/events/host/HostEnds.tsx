import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { useFocusRing } from '@/components/focusRing';
import { IconTile } from '@/components/IconTile';
import { Skeleton } from '@/components/Skeleton';
import { Text } from '@/components/Text';
import { canvasNormalLineHeight, font, layout, space, type, useWawu } from '@/theme';

import { NavBar } from '../chrome';

/** events_b.js `foot`: 12 above the button, 24 below it (plus the safe area). */
export const footMetrics = { top: 12, bottom: 24 } as const;
/** kit.js `result`: an 88 circle, a 42 glyph at 2.2, 10 between the parts, the title 8 further down, the line 14.5; events_b.js `submitted`: 120 down, 20 between the result and its line. */
/** kit.js `empty`: a 56 circle, 10 between, the title 4 lower, words held to 280, the action 6 under them, 26 above and below. */
const GATE = { icon: 56, stack: 10, titleNudge: 4, maxWidth: 280, padV: 26, bodyTop: 8, bodyBottom: 120, actionTop: 6, wordsLine: 20 } as const;
const RESULT = { circle: 88, stroke: 2.2, stack: 10, titleNudge: 8, line: 14.5, top: 120, between: 20 } as const;

/** What the gate's words say: the Hub's own sentence for an ended tier, else the tier names and the lowest price, both from `GET /plans`. */
export type GateWords = { state: 'loading' } | { state: 'failed'; onRetry: () => void } | { state: 'ready'; lines: string[] };

/**
 * E21 · Needs a tier: hosting needs a running tier (R-43). The title and the picture are the board's; the words under it are the Hub's
 * (the tier names, "From" the lowest price, and for a tier that ended the Hub's own sentence), and See tiers opens VF5. A line the Hub
 * has not served is not drawn (R-47): with the plan unread the title and the button stay, and Try again offers the read once more.
 */
export function HostGate({ words, onBack, onSeeTiers }: { words: GateWords; onBack: () => void; onSeeTiers?: () => void }) {
  const { colors } = useWawu();
  const insets = useSafeAreaInsets();
  const ring = useFocusRing();
  return (
    <View testID="host-gate" style={[styles.root, { backgroundColor: colors.surfacePage, paddingTop: insets.top }]}>
      <NavBar title="Host an event" onBack={onBack} backTestID="host-back" />
      <View style={styles.center}>
        <View style={styles.gate}>
          <IconTile icon="BadgeCheck" size={GATE.icon} />
          <Text variant="h3" accessibilityRole="header" style={[font(600), styles.gateTitle]}>
            Hosting needs a tier
          </Text>
          {words.state === 'loading' ? (
            <View testID="host-gate-loading" accessibilityLabel="Loading the tiers" style={styles.gateLoading}>
              <Skeleton height={GATE.wordsLine} />
              <Skeleton height={GATE.wordsLine} width="60%" />
            </View>
          ) : words.state === 'failed' ? (
            <Pressable accessibilityRole="button" onPress={words.onRetry} testID="host-gate-retry" {...ring.handlers} style={ring.style}>
              <Text variant="linkStrong">The tiers did not load. Try again</Text>
            </Pressable>
          ) : words.lines.length > 0 ? (
            // One line for each thing the Hub said (the tiers, then "From" the lowest price), as the board breaks them.
            <View testID="host-gate-words" style={styles.gateLines}>
              {words.lines.map((line) => (
                <Text key={line} variant="secondary" tone="textSecondary" style={styles.gateWords}>
                  {line}
                </Text>
              ))}
            </View>
          ) : null}
          {onSeeTiers ? (
            <View style={styles.gateAction}>
              <Button testID="host-see-tiers" label="See tiers" size="md" onPress={onSeeTiers} />
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

/** E16 · Sent for review: a secondary My events button (E17) left of Done, as the canvas draws them. */
export function Submitted({ name, onDone, onMyEvents }: { name: string; onDone: () => void; onMyEvents?: () => void }) {
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
          {onMyEvents ? <Button testID="host-my-events" label="My events" variant="secondary" onPress={onMyEvents} style={styles.half} /> : null}
          <Button testID="host-done" label="Done" full={!onMyEvents} onPress={onDone} style={onMyEvents ? styles.half : undefined} />
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
  gateLines: { alignItems: 'center' },
  gateWords: { textAlign: 'center', maxWidth: GATE.maxWidth },
  gateLoading: { width: GATE.maxWidth, gap: space.xs, alignItems: 'center' },
  gateAction: { marginTop: GATE.actionTop },
  words: { alignItems: 'center', gap: RESULT.stack },
  title: { marginTop: RESULT.titleNudge, textAlign: 'center', lineHeight: canvasNormalLineHeight(type.size.title) },
  line: { fontSize: RESULT.line, lineHeight: canvasNormalLineHeight(RESULT.line), textAlign: 'center' },
  note: { textAlign: 'center' },
  foot: { paddingTop: footMetrics.top, paddingHorizontal: layout.gutter, gap: space.sm },
  pair: { flexDirection: 'row', gap: space.md },
  half: { flex: 1 },
});
