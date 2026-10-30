import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Text } from '@/components/Text';
import { canvasNormalLineHeight, space } from '@/theme';

import type { ChosenFile } from '@/features/create/chosen';

import { ResultPlayer } from './ResultPlayer';
import { takeClock, takeToFile, useTakeRecorder, type TakeRecorder } from './recordTake';
import { MUSIC_WORDS } from './voiceToolsModel';

/**
 * "Record" beside "Choose a recording" (POINTS-16): the microphone for a clip or a sample. Idle it is one button; while recording it shows the
 * running clock and "Stop recording"; a take that is kept plays back before it is used, with "Record again". A refused microphone says how to
 * turn it on and leaves choosing a recording working. No board draws this row (R-29): it is the app's button and its player.
 */
export function RecordRow({ recorder, enabled, onStart, onStop, testID = 'tool-record' }: { recorder: TakeRecorder; enabled: boolean; onStart: () => void; onStop: () => void; testID?: string }) {
  return (
    <View style={styles.wrap}>
      {recorder.recording ? (
        <View style={styles.live}>
          <Text variant="body" tone="textSecondary" testID={`${testID}-clock`} accessibilityLiveRegion="polite" style={[styles.clock, { lineHeight: canvasNormalLineHeight(14) }]}>
            {`${MUSIC_WORDS.recordingNow} ${takeClock(recorder.seconds)}`}
          </Text>
          <Button testID={`${testID}-stop`} label={MUSIC_WORDS.recordStop} variant="secondary" icon="Mic" full onPress={onStop} />
        </View>
      ) : (
        <Button testID={testID} label={recorder.take ? MUSIC_WORDS.recordAgain : MUSIC_WORDS.recordLabel} variant="secondary" icon="Mic" full disabled={!enabled} onPress={onStart} />
      )}
      {recorder.take && !recorder.recording ? <ResultPlayer testID={`${testID}-playback`} uri={recorder.take.uri} name={MUSIC_WORDS.playTake} /> : null}
      {recorder.interrupted && !recorder.recording ? <Text variant="body" tone="textMuted" testID={`${testID}-interrupted`} style={styles.note}>{MUSIC_WORDS.recordInterrupted}</Text> : null}
      {recorder.refused ? (
        <Banner
          tone="warning"
          icon="Mic"
          title={MUSIC_WORDS.recordRefusedTitle}
          body={recorder.refused.canAskAgain ? MUSIC_WORDS.recordRefusedAsk : MUSIC_WORDS.recordRefused}
          testID={`${testID}-refused`}
        />
      ) : null}
      {recorder.failed && !recorder.refused ? <Banner tone="danger" icon="CircleX" title={MUSIC_WORDS.recordFailed} body={MUSIC_WORDS.recordFailedBody} testID={`${testID}-failed`} /> : null}
    </View>
  );
}

/**
 * The recorder and its row together, for a tool that offers "Record" (Voice changer, the voice clone). The microphone is opened only while this is
 * drawn. A stopped take (or one the phone cut short) is handed up as a file the upload takes.
 */
export function RecordSection({ enabled, maxSeconds, onFile, testID }: { enabled: boolean; maxSeconds?: number; onFile: (file: ChosenFile) => void; testID?: string }) {
  const recorder = useTakeRecorder(maxSeconds);
  const [reading, setReading] = useState(false);
  const handed = useRef<unknown>(null);
  const { take } = recorder;
  // Every kept take goes up once, whether the person stopped it, it reached the longest, or the phone cut it short.
  useEffect(() => {
    if (!take || handed.current === take) return;
    handed.current = take;
    setReading(true);
    takeToFile(take)
      .then(onFile)
      .catch(() => undefined)
      .finally(() => setReading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `onFile` is the screen's handler for this take only
  }, [take]);
  return (
    <RecordRow
      recorder={recorder}
      enabled={enabled && !reading}
      onStart={() => void recorder.start()}
      onStop={() => void recorder.stop()}
      testID={testID}
    />
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.sm },
  live: { gap: space.sm },
  clock: { fontSize: 14, fontVariant: ['tabular-nums'] },
  note: { fontSize: 12.5, lineHeight: canvasNormalLineHeight(12.5) },
});
