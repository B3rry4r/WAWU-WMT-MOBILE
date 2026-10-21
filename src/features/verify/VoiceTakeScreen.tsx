import { useCallback, useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { StatusPill } from '@/components/StatusPill';
import { EmptyState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { font, space, useWawu } from '@/theme';

import { ShopFrame } from './parts';
import { takeClock, takeShare, takeVerdict, voiceFailure, type TakeBounds } from './voiceModel';
import { RecordButton, recordButton, TakeRing } from './voiceParts';
import { useVoiceRecorder, type Take } from './voiceRecorder';

/** design/_gen/verify.js `vf9`: the script's words are 15.5 on a 1.55 line, the ring and its line are 14 apart, "Redo" is 14 at 600. */
const board = { script: 15.5, leading: 1.55, centreGap: 14, redo: 14, pairGap: 10 } as const;

type Phase = 'ready' | 'recording' | 'short' | 'done';

export type VoiceTakeScreenProps = {
  /** What the person reads aloud: the consent line, then their Voice Intro's words. */
  script: string;
  /** The shortest and longest recording, from the Hub. */
  bounds: TakeBounds;
  /** What the next try costs, from the Hub: nothing while the tier still includes the first, else its points. */
  next: { free: boolean; costPoints: number };
  onBack: () => void;
  /**
   * "Use this": uploads the take and starts making the intro. A refusal it throws is said under the ring in the Hub's own words and the
   * take stays, so Use this tries again without a second recording.
   */
  onUse: (take: Take) => Promise<void>;
};

/**
 * VF9 · Record 30 seconds, VF9a (recording), VF9b (too short) and VF9c (done). The script to read, a ring that fills to the longest take,
 * and the record button. A take shorter than the shortest is refused with the reason and the person records again; a full-length one
 * stops itself. The lengths are the Hub's (`sample.minSeconds`, `sample.maxSeconds`). When the phone refuses the
 * microphone the ring gives way to a plain way forward: ask again, or open the phone's settings.
 */
export function VoiceTakeScreen({ script, bounds, next, onBack, onUse }: VoiceTakeScreenProps) {
  const { colors } = useWawu();
  const rec = useVoiceRecorder();
  const [phase, setPhase] = useState<Phase>('ready');
  const [take, setTake] = useState<Take | null>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const { min, max } = bounds;

  const finish = useCallback(async () => {
    const got = await rec.stop();
    if (!got) {
      setFailure('We could not keep that take. Record it again.');
      setPhase('ready');
      return;
    }
    const seconds = Math.min(got.seconds, max);
    setTake({ ...got, seconds });
    setPhase(takeVerdict(seconds, min) === 'short' ? 'short' : 'done');
  }, [rec, min, max]);

  // A take that reaches the longest length stops itself.
  useEffect(() => {
    if (phase !== 'recording' || rec.seconds < max) return undefined;
    const id = setTimeout(() => void finish(), 0);
    return () => clearTimeout(id);
  }, [phase, rec.seconds, max, finish]);

  const press = async () => {
    if (phase === 'recording') {
      await finish();
      return;
    }
    setFailure(null);
    setTake(null);
    const started = await rec.start();
    if (started === 'started') setPhase('recording');
    else {
      setPhase('ready');
      if (started === 'failed') setFailure('We could not start the recording. Try again.');
    }
  };

  const redo = () => {
    setTake(null);
    setFailure(null);
    setPhase('ready');
  };

  const use = async () => {
    if (!take || busy) return;
    setBusy(true);
    setFailure(null);
    try {
      await onUse(take);
    } catch (error) {
      setFailure(voiceFailure(error));
    } finally {
      setBusy(false);
    }
  };

  const seconds = phase === 'recording' ? Math.min(rec.seconds, max) : take ? take.seconds : 0;
  const shown = Math.floor(seconds);
  const refused = phase === 'ready' ? rec.refused : null;

  const line = (() => {
    if (failure) {
      return (
        <Text variant="errorLine" accessibilityRole="alert" testID="voice-take-failure" style={styles.centred}>
          {failure}
        </Text>
      );
    }
    if (phase === 'short') {
      return (
        <Text variant="errorLine" accessibilityRole="alert" testID="voice-take-short" style={[font(600), styles.centred]}>
          Too short. Read the whole script.
        </Text>
      );
    }
    if (phase === 'done') return <StatusPill testID="voice-take-got" label="Got it" tone="positive" icon="Check" />;
    return (
      <Text variant="muted" testID="voice-take-hint" style={styles.centred}>
        {phase === 'recording' ? 'Recording. Read at your normal pace.' : 'Find a quiet room.'}
      </Text>
    );
  })();

  const body = refused ? (
    <EmptyState
      testID="voice-take-mic-off"
      icon="Mic"
      title="We can't use your microphone"
      message={
        refused.canAskAgain
          ? 'Allow the microphone so we can hear your voice, then record again.'
          : "Turn on the microphone for Who Made This? in your phone's settings, then come back and record."
      }
    />
  ) : (
    <View style={styles.centre}>
      <TakeRing testID="voice-take-ring" share={takeShare(shown, max)} clock={takeClock(shown)} of={`of ${takeClock(max)}`} tone={phase === 'short' ? 'danger' : 'accent'} />
      <View style={styles.line}>{line}</View>
      {phase === 'done' && !next.free && next.costPoints > 0 ? (
        <Text variant="muted" testID="voice-take-cost" style={styles.centred}>
          {`Making your intro uses ${next.costPoints} points.`}
        </Text>
      ) : null}
    </View>
  );

  const foot = refused ? (
    refused.canAskAgain ? (
      <Button testID="voice-take-allow" label="Allow microphone" icon="Mic" full onPress={() => void press()} />
    ) : (
      <Button testID="voice-take-settings" label="Open settings" icon="Settings" full onPress={() => void Linking.openSettings()} />
    )
  ) : phase === 'done' ? (
    <View style={styles.pair}>
      <View style={styles.redo}>
        <Button testID="voice-take-redo" label="Redo" variant="secondary" full disabled={busy} onPress={redo} />
      </View>
      <View style={styles.use}>
        <Button testID="voice-take-use" label="Use this" full loading={busy} onPress={() => void use()} />
      </View>
    </View>
  ) : (
    <View style={styles.controls}>
      {phase === 'ready' ? (
        <View style={styles.side} />
      ) : (
        <Pressable testID="voice-take-redo" accessibilityRole="button" accessibilityLabel="Redo" onPress={redo} hitSlop={space.md} style={styles.side}>
          <Text variant="body" tone="textSecondary" style={[font(600), styles.redoWord]}>
            Redo
          </Text>
        </Pressable>
      )}
      <RecordButton testID="voice-take-record" recording={phase === 'recording'} onPress={() => void press()} />
      <View style={styles.side} />
    </View>
  );

  return (
    <ShopFrame testID="voice-take-screen" title={`Record ${max} seconds`} onBack={onBack} foot={foot}>
      <Card padded>
        <Text variant="body" testID="voice-take-script" style={{ fontSize: board.script, lineHeight: board.script * board.leading, color: colors.textPrimary }}>
          {script}
        </Text>
      </Card>
      {body}
    </ShopFrame>
  );
}

const styles = StyleSheet.create({
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: board.centreGap, minHeight: 260 },
  line: { minHeight: 30, alignItems: 'center', justifyContent: 'center' },
  centred: { textAlign: 'center' },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: recordButton.between },
  side: { width: recordButton.side, minHeight: recordButton.side, alignItems: 'center', justifyContent: 'center' },
  redoWord: { fontSize: board.redo },
  pair: { flexDirection: 'row', gap: board.pairGap },
  redo: { flex: 1 },
  use: { flex: 1.4 },
});
