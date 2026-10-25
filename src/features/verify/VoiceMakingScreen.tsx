import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { IconTile } from '@/components/IconTile';
import { Text } from '@/components/Text';
import { footMetrics } from '@/features/create/CreateFrame';
import { font, layout, space, useWawu } from '@/theme';

import { failedLineOf } from './voiceModel';
import { MakingRing } from './voiceParts';

/** design/_gen/verify.js `vf10`: 14 between the ring and its words, the title at 22, the result sits 220 down with 20 between its parts. */
const board = { ringToWords: 14, title: 22, top: 120, resultGap: 10, circle: 88, glyphStroke: 2.2, titleNudge: 8, titleWidth: 250 } as const;

/** Both boards have no bar and no way back: the try is under way or over, so the screen is the result and its one button. */
function Bare({ children, foot, testID }: { children: ReactNode; foot?: ReactNode; testID: string }) {
  const { colors } = useWawu();
  const insets = useSafeAreaInsets();
  return (
    <View testID={testID} style={[styles.root, { backgroundColor: colors.surfacePage, paddingTop: insets.top }]}>
      {children}
      {foot ? (
        <View style={{ paddingTop: footMetrics.top, paddingBottom: footMetrics.bottom + insets.bottom, paddingLeft: layout.gutter + insets.left, paddingRight: layout.gutter + insets.right }}>{foot}</View>
      ) : null}
    </View>
  );
}

export type VoiceMakingScreenProps =
  | { state: 'working' }
  | {
      state: 'failed';
      /** The Hub's own words for a try that did not work ("No points were taken"). */
      message: string | null;
      /** Back to the recording; the Hub already gave the points back. */
      onTryAgain: () => void;
      busy?: boolean;
    };

/**
 * VF10 · Making your intro, and VF10a · the failed try. Working: a ring that turns (the Hub serves no percentage) and "In your own
 * voice." (no time is promised: nothing serves one, G-VERIFY-03-3). Failed: the board's title and the Hub's own line under it (without its
 * opening "That didn't work.", the title says it), which says no points were taken; Try again goes back to the recording.
 */
export function VoiceMakingScreen(props: VoiceMakingScreenProps) {
  if (props.state === 'working') {
    return (
      <Bare testID="voice-making-screen">
        <View style={styles.centre} accessibilityLiveRegion="polite">
          <MakingRing testID="voice-making-ring" label="Making your intro" />
          <Text variant="body" accessibilityRole="header" style={[font(700), styles.title]}>
            Making your intro
          </Text>
          <Text variant="muted" style={styles.centred}>
            In your own voice.
          </Text>
        </View>
      </Bare>
    );
  }
  return (
    <Bare testID="voice-failed-screen" foot={<Button testID="voice-failed-again" label="Try again" full loading={props.busy} onPress={props.onTryAgain} />}>
      <View style={styles.result}>
        <IconTile icon="X" tone="danger" size={board.circle} strokeWidth={board.glyphStroke} />
        <Text variant="title" accessibilityRole="header" style={styles.resultTitle}>
          {"We couldn't make your intro"}
        </Text>
        <Text variant="secondary" testID="voice-failed-line" accessibilityRole="alert" style={styles.resultLine}>
          {failedLineOf(props.message)}
        </Text>
      </View>
    </Bare>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: board.ringToWords, paddingBottom: board.top, paddingHorizontal: space.xl },
  title: { fontSize: board.title, lineHeight: Math.round(board.title * 1.25), textAlign: 'center' },
  centred: { textAlign: 'center' },
  resultTitle: { textAlign: 'center', maxWidth: board.titleWidth, marginTop: board.titleNudge },
  resultLine: { textAlign: 'center', maxWidth: board.titleWidth },
  result: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: board.resultGap },
});
