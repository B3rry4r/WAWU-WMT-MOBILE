import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { Banner } from '@/components/Banner';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { Icon } from '@/components/icon';
import { IconTile } from '@/components/IconTile';
import { formatPointsCount } from '@/components/PointsFigure';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { Toast } from '@/components/Toast';
import type { ChosenFile } from '@/features/create/chosen';
import { UPLOAD_CANCELLED } from '@/features/create/upload';
import { newRequestKey } from '@/features/wallet/api/settings';
import { canvasNormalLineHeight, font, radius, space, useWawu } from '@/theme';

import { myPointsQuery } from './api';
import { fetchFileQuote, uploadRecording, type FileQuote } from './fileToolApi';
import { FILE_WORDS } from './fileToolModel';
import { FieldBox } from './FieldBox';
import { useJobCheck } from './JobCheck';
import { PointsFrame } from './PointsFrame';
import { RecordSection } from './RecordRow';
import type { JobAction, AiTool } from './studioApi';
import { takeClock } from './recordTake';
import { removeSavedVoice, savedVoiceKey, savedVoiceQuery, type SavedVoice } from './voiceToolsApi';
import { startJob, voiceJobQuery } from './voiceoverApi';
import { failedWords, TOOL_WORDS } from './voiceoverModel';
import { Working } from './WorkingView';

/** The words of Clone your own voice (POINTS-16). No board draws it (R-29); the consent line is the Hub's own, shown exactly, and nothing here names a provider (R-68). */
export const CLONE_WORDS = {
  consentLabel: 'You will read this',
  consentNote: 'Only your own voice. We keep it for your voice tools until you remove it, and you can take it back any time.',
  recordHint: (min: number, max: number) => `Read the line above aloud. Record at least ${min} seconds, up to ${max}.`,
  nameLabel: 'Name for your voice',
  namePlaceholder: 'For example, My voice',
  nameMax: 60,
  agree: 'I agree',
  notNow: 'Not now',
  working: 'Making your voice',
  workingBody: 'About a minute. You can leave this screen.',
  savedTitle: 'Your voice',
  savedLine: 'Kept for your voice tools',
  remove: 'Remove my voice',
  removeTitle: 'Remove your voice?',
  removeBody: 'It leaves every voice list at once, and we delete our copy of it.',
  removeConfirm: 'Remove',
  removeKeep: 'Keep it',
  removed: 'Your voice is removed.',
  removing: 'Your voice is removed. We are still clearing the last copy.',
  removeFailed: 'We could not do that. Try again.',
  madeTitle: 'Your voice is ready',
  madeBody: 'Pick Your voice in VoiceOver, Quick voice, Dialogue and Voice changer.',
  unavailableTitle: "This isn't available right now",
  unavailableBody: 'Try again later.',
} as const;

/** PT2's frame again: the body parts stand 14 apart, the consent card is VF8's (the 20 corner card, the line in 600 type). */
const BODY_GAP = 14;

export type CloneVoiceScreenProps = { owner: string | null; tool: AiTool; balance: number; onBack: () => void; onBuyPoints: () => void; onLeave: () => void };

export function CloneVoiceScreen({ owner, tool, balance, onBack, onBuyPoints, onLeave }: CloneVoiceScreenProps) {
  const saved = useQuery(
    {
      ...savedVoiceQuery(owner),
      // A clone being made is read again until it is ready.
      refetchInterval: (query) => (query.state.data?.state === 'making' ? 2000 : false),
    },
    queryClient,
  );
  const title = tool.name;
  const frame = { title, subtitle: `Points: ${formatPointsCount(balance)}`, onBack, gap: BODY_GAP } as const;
  if (saved.isError && saved.data === undefined) {
    return (
      <PointsFrame {...frame} centered testID="clone-screen">
        <ErrorState testID="clone-error" icon="TriangleAlert" title={TOOL_WORDS.loadFailed} message={isApiError(saved.error) && saved.error.message ? saved.error.message : TOOL_WORDS.loadFailedBody} onRetry={() => void saved.refetch()} />
      </PointsFrame>
    );
  }
  if (saved.data === undefined) return <PointsFrame {...frame} testID="clone-screen"><Text variant="body" tone="textMuted">{'Loading'}</Text></PointsFrame>;
  if (!saved.data.available && saved.data.state === 'none') {
    return (
      <PointsFrame {...frame} centered testID="clone-screen">
        <EmptyState testID="clone-unavailable" icon="Fingerprint" title={CLONE_WORDS.unavailableTitle} message={CLONE_WORDS.unavailableBody} />
      </PointsFrame>
    );
  }
  return <Clone {...frame} owner={owner} tool={tool} saved={saved.data} onBuyPoints={onBuyPoints} onLeave={onLeave} />;
}

function Clone({ owner, tool, saved, title, subtitle, onBack, gap, onBuyPoints, onLeave }: Omit<CloneVoiceScreenProps, 'balance'> & { saved: SavedVoice; title: string; subtitle: string; gap: number }) {
  const { colors } = useWawu();
  const [file, setFile] = useState<{ key: string; quote: FileQuote } | null>(null);
  const [phase, setPhase] = useState<'idle' | 'uploading' | 'checking' | 'ready'>('idle');
  const [share, setShare] = useState(0);
  const [taken, setTaken] = useState(0);
  const [name, setName] = useState('');
  const [refusal, setRefusal] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [unsent, setUnsent] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [goodNotice, setGoodNotice] = useState<string | null>(null);
  const sending = useRef(false);
  const pending = useRef<{ key: string; fileKey: string; name: string; quoteToken: string } | null>(null);
  const turn = useRef(0);
  const stop = useRef<AbortController | null>(null);

  const job = useQuery(
    {
      ...voiceJobQuery(owner, jobId),
      refetchInterval: (query) => (query.state.data === undefined || query.state.data.state === 'working' ? 2000 : false),
    },
    queryClient,
  );
  const state = saved.state;
  // Once the Hub says the voice is kept, the job's work is over and the screen is the saved row.
  const running = state === 'ready' ? null : jobId;
  const failed = running !== null && job.data?.state === 'failed';
  // Between the job ending and the Hub's record of the voice being read again, the screen keeps saying it is being made.
  const making = state === 'making' || (running !== null && !failed && (job.data?.state !== 'done' || state === 'none'));

  // The job ended well: the Hub's own record of the saved voice is read again, and the screen becomes the saved row.
  useEffect(() => {
    if (job.data?.state === 'done' || job.data?.state === 'failed') {
      void queryClient.invalidateQueries({ queryKey: savedVoiceKey(owner) });
      void queryClient.invalidateQueries({ queryKey: myPointsQuery(owner).queryKey });
      void queryClient.invalidateQueries({ queryKey: ['ai-tools', owner ?? ''] });
    }
  }, [job.data?.state, owner]);

  const check = useJobCheck({
    onReady: (quote) => {
      if (!file) return;
      void send({ key: newRequestKey(), fileKey: file.key, name: name.trim(), quoteToken: quote.quoteToken });
    },
    onBuyPoints,
    onLeave,
  });

  const send = async (intent: { key: string; fileKey: string; name: string; quoteToken: string }) => {
    if (sending.current) return;
    sending.current = true;
    setStarting(true);
    setUnsent(false);
    pending.current = intent;
    try {
      const out = await startJob({ toolId: 'my-voice', request: { kind: 'clone', fileKey: intent.fileKey, name: intent.name, consentLine: saved.consent.line }, quoteToken: intent.quoteToken, key: intent.key });
      if (out.kind === 'started') {
        pending.current = null;
        queryClient.setQueryData(voiceJobQuery(owner, out.job.id).queryKey, out.job);
        setJobId(out.job.id);
        void queryClient.invalidateQueries({ queryKey: myPointsQuery(owner).queryKey });
      } else if (out.kind === 'unanswered') setUnsent(true);
      else {
        pending.current = null;
        setRefusal(out.message);
      }
    } finally {
      sending.current = false;
      setStarting(false);
    }
  };

  /** A take is in hand: it goes up (and can be stopped), the Hub reads its length and quotes it. A refusal is the Hub's own words and nothing is held. */
  const takeFile = async (picked: ChosenFile) => {
    const mine = ++turn.current;
    setRefusal(null);
    setFile(null);
    setPhase('uploading');
    setShare(0);
    setTaken(picked.seconds ?? 0);
    const abort = new AbortController();
    stop.current = abort;
    try {
      const up = await uploadRecording(picked, saved.recording.folder, (s) => turn.current === mine && setShare(s), abort.signal);
      if (turn.current !== mine) return;
      setPhase('checking');
      const quote = await fetchFileQuote('my-voice', up.key);
      if (turn.current !== mine) return;
      if (quote.cap && quote.cap.cap === 'minutes_per_job') {
        setPhase('idle');
        setRefusal(quote.cap.message);
        return;
      }
      setFile({ key: up.key, quote });
      setPhase('ready');
    } catch (error) {
      if (turn.current !== mine) return;
      setPhase('idle');
      if (isApiError(error) && error.code === UPLOAD_CANCELLED) return;
      setRefusal(isApiError(error) && error.message ? error.message : FILE_WORDS.uploadFailedBody);
    } finally {
      if (stop.current === abort) stop.current = null;
    }
  };

  const agree = () => {
    if (!file || name.trim() === '' || starting || check.checking) return;
    setRefusal(null);
    check.check({ action: tool.action as JobAction, units: file.quote.units });
  };

  const takeBack = async () => {
    setConfirming(false);
    try {
      const out = await removeSavedVoice();
      // The job that made the voice is over with it: a new voice is a new recording.
      setJobId(null);
      setFile(null);
      setPhase('idle');
      queryClient.setQueryData(savedVoiceKey(owner), out.myVoice);
      void queryClient.invalidateQueries({ queryKey: ['ai-tools', owner ?? ''] });
      setGoodNotice(out.atProvider === 'gone' ? CLONE_WORDS.removed : CLONE_WORDS.removing);
    } catch {
      setNotice(CLONE_WORDS.removeFailed);
    }
  };

  const failure = failedWords(job.data?.message);
  const foot =
    state === 'none' && !making && !failed ? (
      <View style={styles.foot}>
        {file ? (
          <Text variant="body" testID="tool-cost" style={{ fontSize: 14, lineHeight: canvasNormalLineHeight(14) }}>
            {'This uses '}
            <Text variant="body" style={[font(700), { fontSize: 14 }]}>{`${formatPointsCount(file.quote.costPoints)} points`}</Text>
          </Text>
        ) : null}
        <Button testID="clone-agree" label={CLONE_WORDS.agree} full loading={check.checking || starting} disabled={!file || phase !== 'ready' || name.trim() === ''} onPress={agree} />
        <Button testID="clone-not-now" label={CLONE_WORDS.notNow} variant="secondary" full onPress={onBack} />
      </View>
    ) : failed ? (
      <Button testID="clone-try-again" label={TOOL_WORDS.tryAgain} full onPress={() => { setJobId(null); setFile(null); setPhase('idle'); }} />
    ) : unsent ? (
      <Button testID="clone-resend" label={TOOL_WORDS.tryAgain} full loading={starting} onPress={() => pending.current && void send(pending.current)} />
    ) : undefined;

  return (
    <PointsFrame title={title} subtitle={subtitle} onBack={onBack} gap={gap} foot={foot} testID="clone-screen">
      {making ? (
        <Working title={CLONE_WORDS.working} body={CLONE_WORDS.workingBody} />
      ) : state === 'ready' ? (
        <>
          <View testID="clone-saved" style={[styles.saved, { backgroundColor: colors.surfaceCard, borderColor: colors.borderHairline }]}>
            <IconTile icon="Fingerprint" tone="accent" size={44} />
            <View style={styles.savedText}>
              <Text variant="body" numberOfLines={1} testID="clone-saved-name" style={[font(600), { fontSize: 16, lineHeight: canvasNormalLineHeight(16) }]}>
                {saved.name || CLONE_WORDS.savedTitle}
              </Text>
              <Text variant="body" tone="textMuted" style={{ fontSize: 13, lineHeight: canvasNormalLineHeight(13) }}>
                {CLONE_WORDS.savedLine}
              </Text>
            </View>
            <Icon name="CircleCheck" size={20} color={colors.positive} strokeWidth={2.2} />
          </View>
          <Text variant="body" tone="textSecondary" style={{ fontSize: 13.5, lineHeight: canvasNormalLineHeight(13.5) }}>
            {CLONE_WORDS.madeBody}
          </Text>
          <Button testID="clone-remove" label={CLONE_WORDS.remove} variant="secondary" full onPress={() => setConfirming(true)} />
        </>
      ) : (
        <>
          <View testID="clone-consent" style={[styles.consent, { backgroundColor: colors.surfaceCard, borderColor: colors.borderHairline }]}>
            <Text variant="body" tone="textMuted" accessibilityRole="header" style={[font(700), styles.consentLabel]}>
              {CLONE_WORDS.consentLabel}
            </Text>
            <Text variant="body" testID="clone-consent-line" style={[font(600), styles.consentLine]}>
              {saved.consent.line}
            </Text>
            <Text variant="body" tone="textSecondary" style={styles.consentNote}>
              {CLONE_WORDS.consentNote}
            </Text>
          </View>
          <Text variant="body" tone="textMuted" testID="clone-hint" style={{ fontSize: 12.5, lineHeight: canvasNormalLineHeight(12.5) }}>
            {CLONE_WORDS.recordHint(saved.recording.minSeconds, saved.recording.maxSeconds)}
          </Text>
          <RecordSection enabled={phase !== 'uploading' && phase !== 'checking' && !starting && !check.checking} maxSeconds={saved.recording.maxSeconds} onFile={(f) => void takeFile(f)} testID="clone-record" />
          {phase !== 'idle' ? (
            <Text variant="body" tone="textSecondary" testID="clone-take-state" accessibilityLiveRegion="polite" style={{ fontSize: 13, lineHeight: canvasNormalLineHeight(13) }}>
              {phase === 'uploading' ? `${FILE_WORDS.uploading} ${Math.round(share * 100)}%` : phase === 'checking' ? FILE_WORDS.checking : `${FILE_WORDS.ready}${taken > 0 ? `, ${takeClock(taken)}` : ''}`}
            </Text>
          ) : null}
          <FieldBox label={CLONE_WORDS.nameLabel} value={name} onChange={setName} max={CLONE_WORDS.nameMax} placeholder={CLONE_WORDS.namePlaceholder} testID="clone-name" editable={!starting} />
          {refusal ? <Banner tone="danger" icon="CircleX" title={TOOL_WORDS.refusedTitle} body={refusal} testID="clone-refused" /> : null}
          {unsent ? <Banner tone="danger" icon="CircleX" title={TOOL_WORDS.unsentTitle} body={TOOL_WORDS.unsentBody} testID="clone-unsent" /> : null}
        </>
      )}
      {failed ? <Banner tone="danger" icon="CircleX" title={failure.title} body={failure.body} testID="clone-failed" /> : null}
      {check.node}
      <BottomSheet visible={confirming} onClose={() => setConfirming(false)} label={CLONE_WORDS.removeTitle} gap={space.md} testID="clone-remove-sheet">
        <Text variant="sheetTitleSm" accessibilityRole="header">
          {CLONE_WORDS.removeTitle}
        </Text>
        <Text variant="body" tone="textSecondary">
          {CLONE_WORDS.removeBody}
        </Text>
        <Button testID="clone-remove-confirm" label={CLONE_WORDS.removeConfirm} full onPress={() => void takeBack()} />
        <Button testID="clone-remove-keep" label={CLONE_WORDS.removeKeep} variant="secondary" full onPress={() => setConfirming(false)} />
      </BottomSheet>
      {notice ? <Toast message={notice} tone="alert" placement="top" lines={2} onHide={() => setNotice(null)} testID="clone-notice" /> : null}
      {goodNotice ? <Toast message={goodNotice} tone="success" placement="top" lines={2} onHide={() => setGoodNotice(null)} testID="clone-notice-ok" /> : null}
    </PointsFrame>
  );
}

const styles = StyleSheet.create({
  foot: { gap: space.sm },
  saved: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg, borderRadius: radius.card, borderWidth: 1 },
  savedText: { flex: 1, minWidth: 0 },
  consent: { gap: space.md, padding: space.lg, borderRadius: radius.card, borderWidth: 1 },
  consentLabel: { fontSize: 11, letterSpacing: 0.88, textTransform: 'uppercase' },
  consentLine: { fontSize: 18, lineHeight: 18 * 1.45 },
  consentNote: { fontSize: 13.5, lineHeight: canvasNormalLineHeight(13.5) },
});
