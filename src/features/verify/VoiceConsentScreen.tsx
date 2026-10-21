import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ApiError } from '@/api/errors';
import { isApiError } from '@/api/client';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Icon } from '@/components/icon';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { hueFor } from '@/features/feed/model';
import { nameOf } from '@/features/me/model';
import { fetchMe, meKey } from '@/features/profile-edit/api';
import { font, radius, space, useWawu } from '@/theme';

import { ShopFrame } from './parts';
import {
  fetchMyVoice,
  fetchVoiceIntro,
  giveVoiceConsent,
  keepVoiceSample,
  newTryKey,
  startVoiceIntro,
  uploadVoiceSample,
  voiceIntroKey,
  voiceKey,
} from './voiceApi';
import { makingResult, openingStage, recordingTerms, sampleFileOf, scriptFor, voiceFailure, type FlowStage } from './voiceModel';
import { VoiceHearScreen } from './VoiceHearScreen';
import { VoiceMakingScreen } from './VoiceMakingScreen';
import { VoiceTakeScreen } from './VoiceTakeScreen';
import type { Take } from './voiceRecorder';

/**
 * How often the screen asks the Hub how the try is going while it is made.
 * PROVISIONAL(VOICE-POLL, owner=VERIFY-03, why=the Hub serves no percentage and no wait: the screen only needs to notice a finished try soon after it is done; owner or verifier may change it after a run on a real phone).
 */
export const POLL_MS = 2000;

/** design/_gen/verify.js `vf8`: the card has 16 inside and its words 10 apart; the line is 18 at 600 on a 1.45 line; each point is a 16 shield and 14 words, 10 apart, 12 between rows. */
const board = { line: 18, leading: 1.45, labelGap: 10, bodyGap: 20, pointGap: 12, pointInner: 10, shield: 16, shieldStroke: 2.2, point: 14 } as const;

/** What VF8 promises, each backed by the Hub: it is the caller's own account, the consent is for their own voice, and the Hub keeps the voice for intros only. */
const POINTS = ['Only you, the account owner, can do this', 'Only with your own voice', 'Your AI voice is only used for your intros'] as const;

export type VoiceConsentScreenProps = {
  onBack: () => void;
  /** "Write your Voice Intro first" and VF11's Edit text: VF4. */
  onWriteText: () => void;
  /** VF11's Use this: the intro is live and the flow is over. */
  onUse: () => void;
};

/**
 * VF8 · Your voice, your consent, and the stages that follow it on the same route: VF9 (record), VF10 and VF10a (making, failed) and VF11
 * (hear yourself). The person reads the Hub's consent line exactly as served (`consent.line`, the board's words with their own name) and agrees; the Hub files exactly
 * that line with the time and refuses any other. The recording goes up through `POST /uploads/presign` and `/confirm`, is kept as the
 * sample and the Hub starts the try (one Idempotency-Key a try, sent again unchanged when no answer came). The screen then polls the Hub
 * until the try is done (VF11) or failed (VF10a, in the Hub's own words, "No points were taken"). A try already under way when the
 * person comes back opens on VF10.
 */
export function VoiceConsentScreen({ onBack, onWriteText, onUse }: VoiceConsentScreenProps) {
  const { colors } = useWawu();
  const queryClient = useQueryClient();
  const me = useQuery({ queryKey: meKey, queryFn: fetchMe });
  const voice = useQuery({ queryKey: voiceKey, queryFn: fetchMyVoice });
  const intro = useQuery({
    queryKey: voiceIntroKey,
    queryFn: fetchVoiceIntro,
    refetchInterval: (query) => (query.state.data?.run?.state === 'working' ? POLL_MS : false),
  });
  const [chosen, setChosen] = useState<FlowStage | null>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [retryFailure, setRetryFailure] = useState<string | null>(null);
  // One key a try. A refusal means the Hub answered, so the next try is new; no answer keeps the key so a repeat cannot take points twice.
  const tryKey = useRef<string | null>(null);
  // The recording that is already kept as the sample, so Use this after a refused try does not send it again.
  const keptTake = useRef<string | null>(null);

  const name = me.data ? nameOf(me.data) : '';
  const view = intro.data;
  const result = view ? makingResult(view) : null;
  const terms = view ? recordingTerms(view) : null;
  // Where the flow opened is kept: a try that finishes while the person watches must land on VF11, not start over at VF8.
  const [opened, setOpened] = useState<FlowStage | null>(null);
  if (view && opened === null) setOpened(openingStage(view));
  let stage: FlowStage = chosen ?? opened ?? (view ? openingStage(view) : 'consent');
  if (stage === 'making' && result?.kind === 'done') stage = 'hear';

  const generate = async () => {
    tryKey.current ??= newTryKey();
    try {
      const started = await startVoiceIntro(tryKey.current);
      tryKey.current = null;
      queryClient.setQueryData(voiceIntroKey, started);
    } catch (error) {
      if (!(error instanceof ApiError && error.kind === 'network')) tryKey.current = null;
      if (error instanceof ApiError && error.code === 'voice_intro_busy') {
        void intro.refetch();
        setChosen('making');
        return;
      }
      throw error;
    }
  };

  const agree = async () => {
    if (!view || busy) return;
    setBusy(true);
    setFailure(null);
    try {
      queryClient.setQueryData(voiceIntroKey, await giveVoiceConsent(view.consent.line));
      setChosen('record');
    } catch (error) {
      setFailure(voiceFailure(error));
      if (error instanceof ApiError && error.code === 'voice_consent_line_changed') void intro.refetch();
    } finally {
      setBusy(false);
    }
  };

  const useTake = async (take: Take) => {
    if (keptTake.current !== take.uri) {
      const fileUrl = await uploadVoiceSample({ uri: take.uri, ...sampleFileOf(take.uri) });
      queryClient.setQueryData(voiceIntroKey, await keepVoiceSample(fileUrl));
      keptTake.current = take.uri;
    }
    await generate();
    setChosen('making');
  };

  const tryAgain = async () => {
    if (busy) return;
    if (!view?.sample.recorded) {
      setChosen('record');
      return;
    }
    setBusy(true);
    setRetryFailure(null);
    try {
      await generate();
      setChosen('making');
    } catch (error) {
      setRetryFailure(voiceFailure(error));
    } finally {
      setBusy(false);
    }
  };

  const readError = me.error ?? voice.error ?? intro.error;
  const loadFailed = (me.isError && !me.data) || (voice.isError && !voice.data) || (intro.isError && !intro.data) || (!!view && !terms);

  if (stage === 'record' && view && terms) {
    return <VoiceTakeScreen script={scriptFor(terms.line, view.text)} bounds={terms.bounds} next={view.next} onBack={() => setChosen('consent')} onUse={useTake} />;
  }
  if (stage === 'making' && result?.kind === 'failed') {
    return <VoiceMakingScreen state="failed" message={retryFailure ?? result.message} busy={busy} onTryAgain={() => void tryAgain()} />;
  }
  if (stage === 'making') return <VoiceMakingScreen state="working" />;
  if (stage === 'hear' && view?.audioUrl) {
    return (
      <VoiceHearScreen
        name={name}
        hue={hueFor(me.data?.wawuUserId ?? '')}
        avatarUrl={me.data?.avatarUrl ?? null}
        audioUrl={view.audioUrl}
        text={view.text}
        aiVoice={view.aiVoice}
        onBack={onBack}
        onUse={onUse}
        onEditText={onWriteText}
        onReRecord={() => {
          keptTake.current = null;
          setChosen('record');
        }}
      />
    );
  }

  let body;
  let foot;
  if (loadFailed) {
    body = (
      <ErrorState
        testID="voice-consent-error"
        title="Your voice did not load"
        message={isApiError(readError) ? readError.message : 'Check your connection and try again.'}
        onRetry={() => {
          if (me.isError) void me.refetch();
          if (voice.isError) void voice.refetch();
          if (intro.isError) void intro.refetch();
        }}
      />
    );
  } else if (!me.data || !voice.data || !view || !terms) {
    body = (
      <LoadingView label="Loading your voice" testID="voice-consent-loading">
        <View style={styles.loading}>
          <Skeleton height={150} radius={radius.card} />
          <Skeleton height={20} width="70%" />
          <Skeleton height={20} width="55%" />
        </View>
      </LoadingView>
    );
  } else if (!voice.data.available) {
    body = <EmptyState testID="voice-consent-off" icon="AudioLines" title="Voices are not available right now" message="Making your Voice Intro is switched off for the moment. Try again later." />;
  } else if (!(view.text ?? '').trim()) {
    body = (
      <EmptyState
        testID="voice-consent-no-words"
        icon="PenLine"
        title="Write your Voice Intro first"
        message="You read your words aloud, so they come before the recording."
        action={{ label: 'Write my Voice Intro', onPress: onWriteText }}
      />
    );
  } else {
    body = (
      <View style={styles.body}>
        <Card padded testID="voice-consent-card">
          <View style={styles.cardWords}>
            <Text variant="label">{"You'll read this first"}</Text>
            <Text variant="body" testID="voice-consent-line" style={[font(600), { fontSize: board.line, lineHeight: board.line * board.leading }]}>
              {`“${terms.line}”`}
            </Text>
          </View>
        </Card>
        <View style={styles.points}>
          {POINTS.map((point) => (
            <View key={point} style={styles.point}>
              <Icon name="ShieldCheck" size={board.shield} color={colors.positive} strokeWidth={board.shieldStroke} />
              <Text variant="body" style={{ fontSize: board.point }}>
                {point}
              </Text>
            </View>
          ))}
        </View>
        {failure ? (
          <Text variant="errorLine" accessibilityRole="alert" testID="voice-consent-failure">
            {failure}
          </Text>
        ) : null}
      </View>
    );
    foot = <Button testID="voice-consent-agree" label="I agree, start recording" full loading={busy} onPress={() => void agree()} />;
  }

  return (
    <ShopFrame testID="voice-consent-screen" title="Your voice, your consent" onBack={onBack} foot={foot}>
      {body}
    </ShopFrame>
  );
}

const styles = StyleSheet.create({
  loading: { gap: space.lg },
  body: { gap: board.bodyGap },
  cardWords: { gap: board.labelGap },
  points: { gap: board.pointGap },
  point: { flexDirection: 'row', alignItems: 'center', gap: board.pointInner },
});
