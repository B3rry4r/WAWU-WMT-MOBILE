import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { KeyboardAvoidingView, StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/client';
import { Button } from '@/components/Button';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { fetchMe, meKey } from '@/features/profile-edit/api';
import { radius, space, useWawu } from '@/theme';

import { ShopFrame } from './parts';
import { fetchVoiceIntro, saveVoiceIntroText, voiceIntroKey } from './voiceApi';
import { introPlaceholder, introState, TOO_LONG_LINE, voiceFailure } from './voiceModel';
import { IntroBox, introBox } from './voiceParts';

export type VoiceIntroScreenProps = {
  onBack: () => void;
  /**
   * "Hear it in my voice", once the words are kept: the route reads the person's tier and opens VF5, Your tier or VF8. A refusal it throws
   * (the tier could not be read) is said under the box and the words stay.
   */
  onHearInMyVoice: () => Promise<void>;
};

/** design/_gen/verify.js line 93: the words, the box and its line are 14 apart in the body, the box and its line 8. */
const board = { bodyGap: 14, lineGap: 8 } as const;

/**
 * VF4 · Write your Voice Intro, VF4a (empty) and VF4b (too long). The words (`GET /me/voice-intro`, what is already kept) in a box with a
 * count against the Hub's limit (`textMaxChars`, a Hub setting: the screen holds no number of its own). Over the limit the box and the
 * count turn red, the line says to cut a sentence, and the button is off, as it is while the box is empty. "Hear it in my voice" keeps the
 * words (`PUT /me/voice-intro/text`) and hands on. Not drawn: the board's "About 20 seconds when read" and the "30-second" in the
 * too-long line, as the Hub serves no length in seconds (BACKEND_GAPS G-VERIFY-02-1).
 */
export function VoiceIntroScreen({ onBack, onHearInMyVoice }: VoiceIntroScreenProps) {
  const { colors } = useWawu();
  const queryClient = useQueryClient();
  const intro = useQuery({ queryKey: voiceIntroKey, queryFn: fetchVoiceIntro });
  const me = useQuery({ queryKey: meKey, queryFn: fetchMe });
  // What the person has typed; until they type, the box shows the words the Hub already keeps.
  const [typed, setTyped] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const kept = intro.data?.text ?? '';
  const value = typed ?? kept;
  const limit = intro.data?.textMaxChars ?? 0;
  const state = introState(value, limit);

  const go = async () => {
    if (!state.ready || busy) return;
    setBusy(true);
    setFailure(null);
    try {
      // Words that are already kept are not sent again.
      if (value.trim() !== kept.trim()) {
        const view = await saveVoiceIntroText(value);
        queryClient.setQueryData(voiceIntroKey, view);
      }
    } catch (error) {
      setFailure(voiceFailure(error));
      setBusy(false);
      return;
    }
    try {
      await onHearInMyVoice();
    } catch {
      setFailure('We could not check your plan. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const foot = intro.data ? (
    <Button testID="voice-intro-hear" label="Hear it in my voice" icon="AudioLines" full loading={busy} disabled={!state.ready} onPress={() => void go()} />
  ) : undefined;

  return (
    <KeyboardAvoidingView testID="voice-intro-keyboard" behavior="padding" style={[styles.root, { backgroundColor: colors.surfacePage }]}>
      <ShopFrame testID="voice-intro-screen" title="Your Voice Intro" onBack={onBack} foot={foot}>
        {intro.isError && !intro.data ? (
          <ErrorState
            testID="voice-intro-error"
            title="Your Voice Intro did not load"
            message={isApiError(intro.error) ? intro.error.message : 'Check your connection and try again.'}
            onRetry={() => void intro.refetch()}
          />
        ) : !intro.data ? (
          <LoadingView label="Loading your Voice Intro" testID="voice-intro-loading">
            <View style={styles.loading}>
              <Skeleton height={20} radius={radius.input} />
              <Skeleton height={introBox.minHeight} radius={introBox.corner} />
            </View>
          </LoadingView>
        ) : (
          <View style={styles.body}>
            <Text variant="muted">A few lines about you or your service. Buyers hear it on your profile.</Text>
            <View style={styles.box}>
              <IntroBox
                testID="voice-intro-text"
                label="Your Voice Intro"
                value={value}
                onChangeText={(next) => {
                  setTyped(next);
                  setFailure(null);
                }}
                placeholder={introPlaceholder(me.data?.firstName)}
                over={state.tooLong}
                disabled={busy}
              />
              <View style={styles.line}>
                {state.tooLong || failure ? (
                  <Text variant="caption" tone="danger" accessibilityRole="alert" testID="voice-intro-line" style={styles.lineText}>
                    {state.tooLong ? TOO_LONG_LINE : failure}
                  </Text>
                ) : (
                  <View style={styles.lineText} />
                )}
                <Text variant="caption" tone={state.tooLong ? 'danger' : 'textMuted'} testID="voice-intro-count" accessibilityLabel={`${state.count} of ${limit} characters`}>
                  {`${state.count} / ${limit}`}
                </Text>
              </View>
            </View>
          </View>
        )}
      </ShopFrame>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: { gap: space.lg },
  body: { gap: board.bodyGap },
  box: { gap: board.lineGap },
  line: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: space.md },
  lineText: { flex: 1 },
});
