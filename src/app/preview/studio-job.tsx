import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Text } from '@/components/Text';
import { useJobCheck } from '@/features/points/JobCheck';
import { PointsFrame } from '@/features/points/PointsFrame';
import type { JobAction } from '@/features/points/studioApi';
import { LeaveDevRoute } from '@/features/shell/LeaveDevRoute';
import { radius, space, useWawu } from '@/theme';

/*
 * Development-only harness for the check before a job runs (POINTS-07), used to picture PT3, PT3a, PT3b and PT7 at 390 px against
 * the boards, over the real Hub. It stands where POINTS-08's VoiceOver screen will stand (the board's backdrop is that screen's text
 * box): Run asks the Hub to quote the job and the sheet or the limit comes from the Hub's own answer. Release builds redirect home.
 *
 *   /preview/studio-job?action=voiceover_per_min&units=1&characters=132&auto=1
 *
 * `auto=1` runs the check as the screen opens. A job the Hub says can run is only counted here (nothing is run: the job is POINTS-08's).
 */
const SCRIPT = 'Welcome to the Pricing Playbook. In the next ten minutes you will learn how to put a number on your work without guessing.';

export default function PreviewStudioJob() {
  if (!__DEV__) return <LeaveDevRoute />;
  return <Harness />;
}

function Harness() {
  const router = useRouter();
  const { colors } = useWawu();
  const params = useLocalSearchParams<{ action?: string; units?: string; characters?: string; auto?: string }>();
  const job = {
    action: (params.action ?? 'voiceover_per_min') as JobAction,
    units: Number(params.units ?? '1'),
    characters: Number(params.characters ?? String(SCRIPT.length)),
  };
  const ready = useRef(0);
  const gate = useJobCheck({
    onReady: () => {
      ready.current += 1;
    },
    onBuyPoints: () => router.push({ pathname: '/points-buy', params: { from: 'studio' } }),
    onLeave: () => router.replace('/studio'),
  });
  const started = useRef(false);
  useEffect(() => {
    if (params.auto === '1' && !started.current) {
      started.current = true;
      gate.check(job);
    }
  });
  return (
    <>
      <PointsFrame
        title="VoiceOver"
        onBack={() => router.back()}
        gap={space.md}
        testID="preview-studio-job"
        foot={<Button testID="preview-run" label="Run" full loading={gate.checking} onPress={() => gate.check(job)} />}
      >
        <View style={[styles.box, { backgroundColor: colors.surfaceInput, borderColor: colors.accent }]}>
          <Text variant="body">{SCRIPT}</Text>
        </View>
        <View style={styles.counts}>
          <Text variant="caption" tone="textMuted">{`About ${job.units} ${job.units === 1 ? 'minute' : 'minutes'}`}</Text>
          <Text variant="caption" tone="textMuted">{`${job.characters} characters`}</Text>
        </View>
      </PointsFrame>
      {gate.node}
    </>
  );
}

const styles = StyleSheet.create({
  box: { minHeight: 150, borderRadius: radius.card, borderWidth: 1.5, padding: space.lg },
  counts: { flexDirection: 'row', justifyContent: 'space-between' },
});

