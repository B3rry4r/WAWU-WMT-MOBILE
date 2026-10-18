import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { browserOutlineOff, useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { IconTile } from '@/components/IconTile';
import { formatPointsCount } from '@/components/PointsFigure';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { Toast } from '@/components/Toast';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { newRequestKey } from '@/features/wallet/api/settings';
import { canvasNormalLineHeight, font, space, useWawu } from '@/theme';

import { myPointsQuery } from './api';
import { useJobCheck } from './JobCheck';
import { PointsFrame } from './PointsFrame';
import { ResultPlayer } from './ResultPlayer';
import { aiToolsQuery, fetchJobQuote, type AiTool, type JobAction } from './studioApi';
import { charactersOf, clampText, countLine, failedWords, lengthLine, TOOL_WORDS, toolReady, unitsFor, usedLine } from './voiceoverModel';
import { dropJobIntent, findJobIntent, putJobIntent, type JobIntent } from './voiceoverIntent';
import { JOB_POLL_MS, startVoiceover, voiceJobQuery, type VoiceJob } from './voiceoverApi';

/** design/_gen/points.js line 90, `pt2Body`: the parts stand 14 apart; the box and its count line 8 apart. */
const BODY_GAP = 14;
/** Line 90: a 20 corner box on the input colour, 14 by 16 padding, 15 type on a 1.5 line, 150 high while typing and 110 after; a 1.5 accent ring while typing, a 1 hairline after. The count line is 12.5, muted. */
const BOX = { radius: 20, padV: 14, padH: 16, font: 15, leading: 1.5, tall: 150, short: 110, ringOn: 1.5, ringOff: 1, between: 8, meta: 12.5 } as const;
/** Line 88, `voiceRow`: 10 between the parts, 10 by 12 padding, a 16 corner, a 1.5 accent ring on the picked voice; the name 14 semi-bold, the line 12; line 60, `radio`: 22 across, the picked one a 6.5 ring. The label above is kit.js line 43: 11, 700, .08em, capitals. */
const VOICE = { parts: 10, padV: 10, padH: 12, radius: 16, name: 14, line: 12, radio: 22, radioOn: 6.5, radioOff: 1.5, between: 8, labelSize: 11, labelTracking: 0.08, ringOn: 1.5, ringOff: 1 } as const;
/** Line 90, the working view: 12 between the parts, 20 above and below, a 64 mark, the title 20 bold, the line 13.5. */
const WORKING = { parts: 12, padV: 20, mark: 64, title: 20, titleTracking: -0.03, titleLeading: 1.15, body: 13.5, bodyLeading: 1.45 } as const;
/** Line 90, the done view: the player and the line 12 apart (line 91), the line 13 with a 15 mark 8 before it; line 91's foot: the cost row 8 between its parts, 14 type, a 16 mark. */
const DONE = { parts: 12, line: 13, mark: 15, markGap: 8, footGap: 10, cost: 14, costMark: 16, costGap: 8 } as const;
const SKELETON = { box: 150, voice: 56, voices: 2 } as const;

export type ToolScreenProps = {
  /** The Hub's id for the tool (`GET /ai-tools`), from the route. */
  toolId: string;
  onBack: () => void;
  /** Buy points (PT4), opened from this tool so it can lead back here. */
  onBuyPoints: () => void;
  /** PT3b's Add money, for the wallet's shortfall (kobo): opens W15 with it (FIX-62, `useJobCheck`). */
  onAddMoney: (shortfallKobo: number) => void;
  onForgotPin: () => void;
  onSetPin: () => void;
  /** "Back to AI tools" on the daily limit (PT7). */
  onLeave: () => void;
};

/**
 * PT2 · One AI tool, with PT2a (working), PT2b (done) and PT2c (failed). Drawn from the tool's own description, `GET /ai-tools`: its name,
 * the longest text it takes and how many characters make a minute, the cost of a minute and the voices to pick from, all the Hub's, so
 * the next tool the Hub lists is a catalogue entry with its own runner, not a new screen. A tool the Hub lists as off, or with no voices, is
 * not drawn as usable.
 */
export function ToolScreen(props: ToolScreenProps) {
  const owner = useSessionAccount(undefined);
  const tools = useQuery(aiToolsQuery(owner), queryClient);
  const points = useQuery(myPointsQuery(owner), queryClient);
  const tool = tools.data?.tools.find((t) => t.id === props.toolId);
  const name = tool?.name ?? 'AI tool';

  if ((tools.isError && tools.data === undefined) || (points.isError && points.data === undefined)) {
    const error = tools.data === undefined && tools.isError ? tools.error : points.error;
    return (
      <PointsFrame title={name} onBack={props.onBack} gap={BODY_GAP} centered testID="tool-screen">
        <ErrorState
          testID="tool-error"
          icon={isApiError(error) && error.kind === 'network' ? 'WifiOff' : 'TriangleAlert'}
          title={TOOL_WORDS.loadFailed}
          message={isApiError(error) && error.message ? error.message : TOOL_WORDS.loadFailedBody}
          onRetry={() => {
            void tools.refetch();
            void points.refetch();
          }}
        />
      </PointsFrame>
    );
  }
  if (tools.data === undefined || points.data === undefined) {
    return (
      <PointsFrame title={name} onBack={props.onBack} gap={BODY_GAP} testID="tool-screen">
        <Loading />
      </PointsFrame>
    );
  }
  if (!toolReady(tool)) {
    return (
      <PointsFrame title={name} onBack={props.onBack} gap={BODY_GAP} centered testID="tool-screen">
        <EmptyState testID="tool-unavailable" icon="Sparkles" title={TOOL_WORDS.unavailableTitle(name)} message={TOOL_WORDS.unavailableBody} />
      </PointsFrame>
    );
  }
  return <Tool {...props} owner={owner} tool={tool} balance={points.data.balance} />;
}

type ToolProps = ToolScreenProps & { owner: string | null; tool: AiTool; balance: number };

/** What the person is looking at: typing (PT2), the job working (PT2a), done (PT2b), failed (PT2c), or a request the Hub never answered. */
type View_ = 'input' | 'working' | 'done' | 'failed' | 'unsent';

function Tool({ owner, tool, balance, onBack, onBuyPoints, onAddMoney, onForgotPin, onSetPin, onLeave }: ToolProps) {
  const { colors } = useWawu();
  const [text, setText] = useState('');
  const [voiceId, setVoiceId] = useState(tool.voices[0]?.id ?? '');
  const [jobId, setJobId] = useState<string | null>(null);
  const [unsent, setUnsent] = useState(false);
  const [starting, setStarting] = useState(false);
  const [refusal, setRefusal] = useState<string | null>(null);
  const [balanceAfter, setBalanceAfter] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const sending = useRef(false);
  /** The request the Hub has not answered: the same key and body go again on Try again. */
  const pending = useRef<JobIntent | null>(null);
  /** The key of the job on screen, so its record goes when the person has seen its end. */
  const activeKey = useRef<string | null>(null);

  const characters = charactersOf(text);
  const units = unitsFor(characters, tool.input.charactersPerUnit);

  const job = useQuery({
    ...voiceJobQuery(owner, jobId),
    refetchInterval: (query) => {
      const data = query.state.data;
      return data === undefined || data.state === 'working' || (data.state === 'done' && !data.audioUrl) ? JOB_POLL_MS : false;
    },
  }, queryClient);
  const view: View_ = jobId ? (job.data?.state === 'done' && job.data.audioUrl ? 'done' : job.data?.state === 'failed' ? 'failed' : 'working') : unsent ? 'unsent' : 'input';

  // The cost before Run is the Hub's: one quote per length in minutes (it holds and takes nothing).
  const costKey = ['points', 'job-quote', owner ?? '', tool.action, units] as const;
  const cost = useQuery(
    { queryKey: costKey, queryFn: () => fetchJobQuote({ action: tool.action as JobAction, units, characters }), enabled: Boolean(owner) && characters > 0 && view === 'input', staleTime: 30_000 },
    queryClient,
  );
  const shownCost = cost.data?.costPoints ?? null;

  /** Sends a job request (new, or the same one again), then follows what the Hub says. */
  const send = useCallback(
    async (intent: JobIntent) => {
      if (!owner || sending.current) return;
      sending.current = true;
      setStarting(true);
      setUnsent(false);
      setRefusal(null);
      activeKey.current = intent.key;
      pending.current = intent;
      try {
        await putJobIntent(owner, intent);
        const outcome = await startVoiceover({ text: intent.text, voiceId: intent.voiceId, quoteToken: intent.quoteToken, key: intent.key });
        if (outcome.kind === 'started') {
          await putJobIntent(owner, { ...intent, jobId: outcome.job.id });
          queryClient.setQueryData(voiceJobQuery(owner, outcome.job.id).queryKey, outcome.job);
          pending.current = null;
          setJobId(outcome.job.id);
          // The Hub already holds the job's points: read its balance again so the count under the title is the Hub's while the job works (SWEEP-APP-3 row 166).
          void queryClient.invalidateQueries({ queryKey: myPointsQuery(owner).queryKey });
        } else if (outcome.kind === 'unanswered') {
          setUnsent(true);
        } else {
          pending.current = null;
          activeKey.current = null;
          await dropJobIntent(owner, intent.key);
          setRefusal(outcome.message);
          void queryClient.invalidateQueries({ queryKey: ['points', 'job-quote'] });
        }
      } finally {
        sending.current = false;
        setStarting(false);
      }
    },
    [owner],
  );

  const check = useJobCheck({
    onReady: (quote, input) => {
      // The cost the person was shown is not the cost now: show the new one and wait for them to run it again.
      if (shownCost !== null && quote.costPoints !== shownCost) {
        queryClient.setQueryData(costKey, quote);
        setNotice(TOOL_WORDS.costMoved);
        return;
      }
      void send({
        key: newRequestKey(),
        toolId: tool.id,
        action: tool.action,
        voiceId,
        text: text.trim(),
        units: input.units,
        characters: input.characters ?? characters,
        quoteToken: quote.quoteToken,
        jobId: null,
        at: Date.now(),
      });
    },
    onBuyPoints,
    onAddMoney,
    onForgotPin,
    onSetPin,
    onLeave,
  });

  // A job the person left running (or a request the Hub never answered) is picked up where it was.
  useEffect(() => {
    if (!owner) return;
    let alive = true;
    void findJobIntent(owner).then((found) => {
      if (!alive || !found || found.toolId !== tool.id || sending.current) return;
      setText(found.text);
      setVoiceId(found.voiceId);
      activeKey.current = found.key;
      if (found.jobId) setJobId(found.jobId);
      else void send(found);
    });
    return () => {
      alive = false;
    };
  }, [owner, tool.id, send]);

  // The person has seen the job's end: its record goes, and the Hub's balance is read again (points were kept, or came back).
  const ended = job.data?.state === 'failed' || (job.data?.state === 'done' && Boolean(job.data.audioUrl));
  useEffect(() => {
    if (!owner || !ended) return;
    if (activeKey.current) void dropJobIntent(owner, activeKey.current);
    activeKey.current = null;
    void queryClient.invalidateQueries({ queryKey: ['points', 'job-quote'] });
    void queryClient.fetchQuery({ ...myPointsQuery(owner), staleTime: 0 }).then((fresh) => setBalanceAfter(fresh.balance), () => undefined);
  }, [owner, ended]);

  const run = () => {
    if (characters === 0 || starting || check.checking) return;
    setRefusal(null);
    check.check({ action: tool.action as JobAction, units, characters });
  };

  /** The words change after a result: the page goes back to typing (the old job's record is already gone). */
  const edit = (next: string) => {
    setText(clampText(next, tool.input.maxCharacters));
    if (view === 'done' || view === 'failed') {
      setJobId(null);
      setBalanceAfter(null);
    }
    setRefusal(null);
  };

  const typing = view === 'input' || view === 'done' || view === 'failed';
  const failed = failedWords(job.data?.message);
  const foot =
    view === 'input' ? (
      <View style={styles.foot}>
        {shownCost !== null ? (
          <View style={styles.costRow} testID="tool-cost">
            <Icon name="Sparkles" size={DONE.costMark} color={colors.accentFg} strokeWidth={2.2} />
            <Text variant="body" style={[styles.costText, { fontSize: DONE.cost, lineHeight: canvasNormalLineHeight(DONE.cost) }]}>
              {'This uses '}
              <Text variant="body" style={[font(700), { fontSize: DONE.cost, lineHeight: canvasNormalLineHeight(DONE.cost) }]}>{`${formatPointsCount(shownCost)} points`}</Text>
            </Text>
          </View>
        ) : null}
        <Button label={TOOL_WORDS.run} full loading={check.checking || starting} disabled={characters === 0} onPress={run} testID="tool-run" />
      </View>
    ) : view === 'failed' ? (
      <Button label={TOOL_WORDS.tryAgain} full loading={check.checking || starting} onPress={run} testID="tool-try-again" />
    ) : view === 'unsent' ? (
      <Button label={TOOL_WORDS.tryAgain} full loading={starting} onPress={() => pending.current && void send(pending.current)} testID="tool-resend" />
    ) : undefined;

  return (
    <PointsFrame title={tool.name} subtitle={`Points: ${formatPointsCount(balance)}`} onBack={onBack} gap={BODY_GAP} foot={foot} testID="tool-screen">
      <View style={styles.boxGroup}>
        <WordsBox value={text} onChange={edit} editable={typing} tall={view === 'input'} max={tool.input.maxCharacters} />
        <View style={styles.meta}>
          <Text variant="body" tone="textMuted" testID="tool-length" style={styles.metaText}>
            {characters > 0 ? lengthLine(units) : ''}
          </Text>
          <Text variant="body" tone="textMuted" testID="tool-count" style={styles.metaText}>
            {countLine(characters, tool.input.maxCharacters)}
          </Text>
        </View>
      </View>
      {view === 'input' && refusal ? <Banner tone="danger" icon="CircleX" title={TOOL_WORDS.refusedTitle} body={refusal} testID="tool-refused" /> : null}
      {view === 'input' ? <VoiceList voices={tool.voices} value={voiceId} onChange={setVoiceId} /> : null}
      {view === 'working' ? <Working name={tool.name} /> : null}
      {view === 'done' && job.data?.audioUrl ? (
        <View style={styles.done}>
          <ResultPlayer testID="tool-player" uri={job.data.audioUrl} name={tool.name} />
          <View style={styles.usedRow} testID="tool-used">
            <Icon name="CircleCheck" size={DONE.mark} color={colors.positive} strokeWidth={2.2} />
            <Text variant="body" tone="textSecondary" style={{ fontSize: DONE.line, lineHeight: canvasNormalLineHeight(DONE.line) }}>
              {usedLine(job.data as VoiceJob, balanceAfter)}
            </Text>
          </View>
        </View>
      ) : null}
      {view === 'failed' ? <Banner tone="danger" icon="CircleX" title={failed.title} body={failed.body} testID="tool-failed" /> : null}
      {view === 'unsent' ? <Banner tone="danger" icon="CircleX" title={TOOL_WORDS.unsentTitle} body={TOOL_WORDS.unsentBody} testID="tool-unsent" /> : null}
      {jobId && job.isError && job.data === undefined ? (
        <Banner tone="warning" title={TOOL_WORDS.unreadableTitle} body={isApiError(job.error) && job.error.message ? job.error.message : TOOL_WORDS.unreadableBody} testID="tool-job-error" />
      ) : null}
      {check.node}
      {notice ? <Toast message={notice} tone="alert" placement="top" lines={2} onHide={() => setNotice(null)} testID="tool-notice" /> : null}
    </PointsFrame>
  );
}

/** The words to speak: a multi-line box on the input colour; the ring is the accent while typing. */
function WordsBox({ value, onChange, editable, tall, max }: { value: string; onChange: (next: string) => void; editable: boolean; tall: boolean; max: number }) {
  const { colors } = useWawu();
  // The box grows with the words (a browser's text area would scroll inside a fixed height).
  const [grown, setGrown] = useState(0);
  const ring = tall ? { width: BOX.ringOn, color: colors.accent } : { width: BOX.ringOff, color: colors.borderHairline };
  return (
    <View
      style={[
        styles.box,
        { minHeight: tall ? BOX.tall : BOX.short, backgroundColor: colors.surfaceInput, boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: ring.width, color: ring.color, inset: true }] },
      ]}
    >
      <TextInput
        testID="tool-text"
        accessibilityLabel="Words to speak"
        multiline
        editable={editable}
        value={value}
        onChangeText={onChange}
        placeholder={TOOL_WORDS.placeholder}
        placeholderTextColor={colors.textMuted}
        maxLength={max > 0 ? max * 2 : undefined}
        textAlignVertical="top"
        onContentSizeChange={(e) => setGrown(e.nativeEvent.contentSize.height)}
        style={[styles.input, { color: colors.textPrimary }, font(400), browserOutlineOff, grown > 0 ? { height: Math.max(grown, BOX.font * BOX.leading) } : null]}
      />
    </View>
  );
}

function VoiceList({ voices, value, onChange }: { voices: AiTool['voices']; value: string; onChange: (id: string) => void }) {
  return (
    <View style={styles.voices}>
      <Text variant="body" tone="textMuted" accessibilityRole="header" style={[font(700), styles.label]}>
        {TOOL_WORDS.voice}
      </Text>
      <View accessibilityRole="radiogroup" testID="tool-voices" style={styles.voiceList}>
        {voices.map((voice) => (
          <VoiceRow key={voice.id} voice={voice} on={voice.id === value} onPress={() => onChange(voice.id)} />
        ))}
      </View>
    </View>
  );
}

function VoiceRow({ voice, on, onPress }: { voice: AiTool['voices'][number]; on: boolean; onPress: () => void }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID={`tool-voice-${voice.id}`}
      accessibilityRole="radio"
      accessibilityState={{ checked: on }}
      accessibilityLabel={voice.description ? `${voice.name}, ${voice.description}` : voice.name}
      onPress={onPress}
      {...ring.handlers}
      style={[
        styles.voice,
        {
          backgroundColor: on ? colors.accentTint : colors.surfaceCard,
          boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: on ? VOICE.ringOn : VOICE.ringOff, color: on ? colors.accent : colors.borderHairline, inset: true }],
        },
        ring.style,
      ]}
    >
      <View style={styles.voiceText}>
        <Text variant="body" numberOfLines={1} style={[font(600), { fontSize: VOICE.name, lineHeight: canvasNormalLineHeight(VOICE.name) }]}>
          {voice.name}
        </Text>
        {voice.description ? (
          <Text variant="body" tone="textMuted" numberOfLines={2} style={{ fontSize: VOICE.line, lineHeight: canvasNormalLineHeight(VOICE.line) }}>
            {voice.description}
          </Text>
        ) : null}
      </View>
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[styles.radio, { borderWidth: on ? VOICE.radioOn : VOICE.radioOff, borderColor: on ? colors.accent : colors.borderStrong }]}
      />
    </Pressable>
  );
}

function Working({ name }: { name: string }) {
  return (
    <View testID="tool-working" accessibilityLiveRegion="polite" style={styles.working}>
      <IconTile icon="Loader" tone="accent" size={WORKING.mark} />
      <Text variant="body" accessibilityRole="header" style={[font(700), styles.workingTitle, { fontSize: WORKING.title, lineHeight: WORKING.title * WORKING.titleLeading, letterSpacing: WORKING.titleTracking * WORKING.title }]}>
        {TOOL_WORDS.workingTitle(name)}
      </Text>
      <Text variant="body" tone="textSecondary" style={[styles.workingBody, { fontSize: WORKING.body, lineHeight: WORKING.body * WORKING.bodyLeading }]}>
        {TOOL_WORDS.workingBody}
      </Text>
    </View>
  );
}

/** The page before the Hub has answered: the shape of the box and the voices, never a figure. */
function Loading(): ReactNode {
  return (
    <LoadingView label="Loading" testID="tool-loading">
      <View style={styles.loading}>
        <Skeleton height={SKELETON.box} radius={BOX.radius} />
        {Array.from({ length: SKELETON.voices }, (_, i) => (
          <Skeleton key={i} height={SKELETON.voice} radius={VOICE.radius} />
        ))}
      </View>
    </LoadingView>
  );
}

const styles = StyleSheet.create({
  boxGroup: { gap: BOX.between },
  box: { borderRadius: BOX.radius, paddingVertical: BOX.padV, paddingHorizontal: BOX.padH },
  input: { fontSize: BOX.font, lineHeight: BOX.font * BOX.leading, padding: 0, margin: 0, minHeight: BOX.font * BOX.leading },
  meta: { flexDirection: 'row', justifyContent: 'space-between', gap: space.md },
  metaText: { fontSize: BOX.meta, lineHeight: canvasNormalLineHeight(BOX.meta) },
  voices: { gap: VOICE.between },
  label: { fontSize: VOICE.labelSize, letterSpacing: VOICE.labelTracking * VOICE.labelSize, textTransform: 'uppercase' },
  voiceList: { gap: VOICE.between },
  voice: { flexDirection: 'row', alignItems: 'center', gap: VOICE.parts, paddingVertical: VOICE.padV, paddingHorizontal: VOICE.padH, borderRadius: VOICE.radius },
  voiceText: { flex: 1, minWidth: 0 },
  radio: { width: VOICE.radio, height: VOICE.radio, borderRadius: VOICE.radio / 2, flexShrink: 0 },
  working: { alignItems: 'center', gap: WORKING.parts, paddingVertical: WORKING.padV },
  workingTitle: { textAlign: 'center' },
  workingBody: { textAlign: 'center' },
  done: { gap: DONE.parts },
  usedRow: { flexDirection: 'row', alignItems: 'center', gap: DONE.markGap },
  foot: { gap: DONE.footGap },
  costRow: { flexDirection: 'row', alignItems: 'center', gap: DONE.costGap },
  costText: { flex: 1 },
  loading: { gap: BODY_GAP },
});
