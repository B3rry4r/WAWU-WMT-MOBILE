import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Icon, type IconName } from '@/components/icon';
import { Text } from '@/components/Text';
import { canvasNormalLineHeight, font, layout, space } from '@/theme';
import { darkColors, lightColors } from '@/theme/tokens.generated';

import type { ResultView } from './doorFormat';

/**
 * The door is dark in both themes, as the canvas draws it (design/_gen/events.js, E19 to E24): the page is the
 * dark theme's page colour, the words white, and the three results are the light theme's positive, warning and
 * danger (the canvas paints #12925A, #C77700 and #D63B3B in both themes; the danger token is #D93A3A, the same
 * red to the eye). The camera's own picture sits under a veil of the page colour, as the canvas dims its photo.
 */
export const DOOR = {
  page: darkColors.surfacePage,
  ink: darkColors.textOnAccent,
  card: darkColors.surfaceCard,
  positive: lightColors.positive,
  warning: lightColors.warning,
  danger: lightColors.danger,
} as const;

/** E19: the camera's picture shows through at 45% (`opacity:.45` on the canvas's photo), so the veil over it is 55%. */
export const veilOpacity = 0.55;

/**
 * E20, E23 and E24: a panel rising from the bottom edge, top corners 36, 24 above its content and 20 at the sides,
 * 40 below (more where the phone's home bar needs it), 8 between its lines; a 40 icon stroked 2.4; the headline
 * 26 at 800 and 0.02em; the line 14 at 90%; the counts 13 at 85%, 10 below the line and 10 apart.
 */
export const panelMetrics = {
  corner: 36,
  top: 24,
  bottom: 40,
  lineGap: space.sm,
  icon: 40,
  iconStroke: 2.4,
  title: 26,
  titleTracking: 0.02,
  line: 14,
  lineOpacity: 0.9,
  totals: 13,
  totalsOpacity: 0.85,
  totalsGap: 10,
  totalsLift: 10,
} as const;

export type ResultPanelProps = {
  view: ResultView;
  /** Taking it away: a tap anywhere on the panel clears it and the scanner is ready for the next ticket. */
  onDismiss: () => void;
  bottomInset: number;
};

/** E20 Let them in, E23 Already used, E24 Not a valid ticket. */
export function ResultPanel({ view, onDismiss, bottomInset }: ResultPanelProps) {
  return (
    <Pressable
      testID="door-result"
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
      accessibilityLabel={view.announce}
      accessibilityHint="Tap to scan the next ticket"
      onPress={onDismiss}
      style={[styles.panel, { backgroundColor: DOOR[view.tone], paddingBottom: Math.max(bottomInset, panelMetrics.bottom) }]}
    >
      <Icon name={view.icon} size={panelMetrics.icon} color={DOOR.ink} strokeWidth={panelMetrics.iconStroke} />
      <Text testID="door-result-title" variant="body" tone="textOnAccent" style={styles.title}>
        {view.title}
      </Text>
      <Text testID="door-result-line" variant="body" tone="textOnAccent" style={styles.line}>
        {view.line}
      </Text>
      {view.totals ? (
        <View style={styles.totals}>
          <Text testID="door-result-in" variant="body" tone="textOnAccent" style={styles.totalsText}>
            {view.totals[0]}
          </Text>
          <Text variant="body" tone="textOnAccent" style={styles.totalsText}>
            {'·'}
          </Text>
          <Text testID="door-result-left" variant="body" tone="textOnAccent" style={styles.totalsText}>
            {view.totals[1]}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export type ProblemView = {
  icon: IconName;
  title: string;
  line: string;
  /** Asks the Hub again with the same code; absent when asking again cannot change the answer. */
  retry: (() => void) | null;
  /** True when the only way on is to leave the door (this person may not scan here, or there is no such event). */
  leave: boolean;
};

export type ProblemPanelProps = {
  problem: ProblemView;
  /** Clears the panel; the scanner is ready for the next ticket. */
  onDismiss: () => void;
  onLeave: () => void;
  bottomInset: number;
};

/**
 * What is not a verdict (not drawn; the result panel's shape in the page's own card colour, in the canvas's tone):
 * the scan did not reach the Hub, or the Hub could not answer, or this person may not scan here. A ticket is never
 * let in or turned away on one of these, so the panel says what happened and what to do, and the scanner waits.
 */
export function ProblemPanel({ problem, onDismiss, onLeave, bottomInset }: ProblemPanelProps) {
  return (
    <View testID="door-problem" accessibilityRole="alert" accessibilityLiveRegion="assertive" style={[styles.panel, { backgroundColor: DOOR.card, paddingBottom: Math.max(bottomInset, panelMetrics.bottom) }]}>
      <Icon name={problem.icon} size={panelMetrics.icon} color={DOOR.ink} strokeWidth={panelMetrics.iconStroke} />
      <Text testID="door-problem-title" variant="body" tone="textOnAccent" style={styles.problemTitle}>
        {problem.title}
      </Text>
      <Text testID="door-problem-line" variant="body" tone="textOnAccent" style={styles.line}>
        {problem.line}
      </Text>
      <View style={styles.actions}>
        {problem.leave ? (
          <Button label="Back" variant="white" size="md" full onPress={onLeave} testID="door-problem-back" />
        ) : (
          <>
            {problem.retry ? <Button label="Try again" variant="white" size="md" full onPress={problem.retry} testID="door-problem-retry" /> : null}
            <Button label="Cancel" variant="glass" size="md" full onPress={onDismiss} testID="door-problem-dismiss" />
          </>
        )}
      </View>
    </View>
  );
}

/** What the camera area says while there is no camera to look through, or a check is on its way. */
export function AimWords({ title, line, busy, testID }: { title: string; line?: string; busy?: boolean; testID?: string }) {
  return (
    <View testID={testID} style={styles.words} accessibilityLiveRegion="polite">
      {busy ? <ActivityIndicator color={DOOR.ink} accessibilityLabel={title} /> : null}
      <Text variant="body" tone="textOnAccent" style={styles.aimTitle}>
        {title}
      </Text>
      {line ? (
        <Text variant="body" tone="textOnAccent" style={styles.aimLine}>
          {line}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: panelMetrics.corner,
    borderTopRightRadius: panelMetrics.corner,
    paddingTop: panelMetrics.top,
    paddingHorizontal: layout.gutter,
    alignItems: 'center',
    gap: panelMetrics.lineGap,
  },
  title: {
    ...font(800),
    fontSize: panelMetrics.title,
    lineHeight: canvasNormalLineHeight(panelMetrics.title),
    letterSpacing: panelMetrics.titleTracking * panelMetrics.title,
    textAlign: 'center',
  },
  problemTitle: { ...font(700), fontSize: 20, lineHeight: canvasNormalLineHeight(20), textAlign: 'center' },
  line: { fontSize: panelMetrics.line, lineHeight: canvasNormalLineHeight(panelMetrics.line), opacity: panelMetrics.lineOpacity, textAlign: 'center' },
  totals: { flexDirection: 'row', marginTop: panelMetrics.totalsLift, gap: panelMetrics.totalsGap, opacity: panelMetrics.totalsOpacity },
  totalsText: { fontSize: panelMetrics.totals, lineHeight: canvasNormalLineHeight(panelMetrics.totals) },
  actions: { alignSelf: 'stretch', gap: space.sm, marginTop: space.md },
  words: { alignItems: 'center', gap: space.sm, paddingHorizontal: layout.gutter },
  aimTitle: { ...font(600), fontSize: 15, lineHeight: canvasNormalLineHeight(15), textAlign: 'center' },
  aimLine: { fontSize: 13.5, lineHeight: canvasNormalLineHeight(13.5), opacity: 0.7, textAlign: 'center' },
});

