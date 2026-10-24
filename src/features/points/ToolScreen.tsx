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
import { fetchVoiceIntro, voiceIntroKey } from '@/features/verify/voiceApi';
import { pickFile } from '@/features/create/pickFile';
import { useRouter } from 'expo-router';
import { newRequestKey } from '@/features/wallet/api/settings';
import { canvasNormalLineHeight, font, space, useWawu } from '@/theme';

import { myPointsQuery } from './api';
import { fetchFileQuote, uploadRecording, type FileQuote } from './fileToolApi';
import { DUB_WORDS, dubLanguages, FILE_WORDS, folderFor, isDubbing, limitsLine, readCues, refusalFor, subtitleFileName, typeOfRecording, acceptedTypes } from './fileToolModel';
import { RecordingBox, SubtitlesCard, TranscriptCard, type Recording } from './FileParts';
import { useJobCheck } from './JobCheck';
import { PointsFrame } from './PointsFrame';
import { ResultPlayer } from './ResultPlayer';
import { aiToolsQuery, fetchJobQuote, type AiTool, type JobAction } from './studioApi';
import { giveOwnVoiceConsent, OWN_VOICE_ID, ownVoiceKey, ownVoiceQuery, removeOwnVoice } from './ownVoiceApi';
import { capTitle } from './studioModel';
import { canShareSubtitles, shareSubtitles } from './subtitleFile';
import { DraftPicker, OwnVoiceConsent, ResultActions, PreviewPlay } from './VoiceExtras';
import { charactersOf, clampText, countLine, EXTRAS_WORDS, failedWords, inputKindOf, lengthLine, TOOL_WORDS, toolReady, unitsFor, usedLine } from './voiceoverModel';
import { dropJobIntent, findJobIntent, putJobIntent, type JobIntent } from './voiceoverIntent';
import { hasResult, outputText, pollMsFor, startJob, voiceJobQuery, type VoiceJob } from './voiceoverApi';

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
  /** "Back to AI tools" on the daily limit (PT7). */
  onLeave: () => void;
};

/**
 * PT2 · One AI tool, with PT2a (working), PT2b (done) and PT2c (failed). Drawn from the tool's own description, `GET /ai-tools`: its name,
 * the longest text it takes and how many characters make a minute, the cost of a minute and the voices to pick from, all the Hub's, so
 * the next tool the Hub lists is a catalogue entry with its own runner, not a new screen. A tool the Hub lists as off, or with no voices, is
 * not drawn as usable.
 *
 * A tool that reads words aloud (VoiceOver, Quick voice: `input.kind` text) is PT2 as drawn: the words, "About N minutes", the voices.
 * A tool that takes a description (Sound effect, Music track: `input.kind` prompt) is PT2's layout with the description box and its
 * count against the entry's limit, and no voice rows and no length line, because its price is flat (a use, a track): the cost line
 * reads the quote either way.
 * A tool that takes the person's own recording (Captions, Clean audio: `input.kind` file) is PT2's frame with a choose-a-recording row where
 * the text box is: the file goes up, the Hub reads its length and quotes the minutes, and the cost line is that quote. It finishes with a
 * transcript in PT2b's card (and the subtitle file for the phone's share sheet) or with the cleaned audio in PT2b's player.
 * Dubbing (`id` dubbing, POINTS-11) is that file tool with one more choice: the language to hear it in, in single-choice rows (PT2's voice rows) of the
 * Hub's own list. Its job takes minutes, so the working view says so and the reads slow after the first minute; it ends in PT2b's player with the
 * dubbed audio and a card of the subtitles under it (a video in gives audio out, and nothing says otherwise).
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
  return <Tool key={tool.id} {...props} owner={owner} tool={tool} balance={points.data.balance} />;
}

type ToolProps = ToolScreenProps & { owner: string | null; tool: AiTool; balance: number };

/** What the person is looking at: typing (PT2), the job working (PT2a), done (PT2b), failed (PT2c), or a request the Hub never answered. */
type View_ = 'input' | 'working' | 'done' | 'failed' | 'unsent';

function Tool({ owner, tool, balance, onBack, onBuyPoints, onLeave }: ToolProps) {
  const { colors } = useWawu();
  const kind = inputKindOf(tool);
  const [text, setText] = useState('');
  const [voiceId, setVoiceId] = useState(kind === 'text' ? (tool.voices[0]?.id ?? '') : '');
  const [jobId, setJobId] = useState<string | null>(null);
  const [unsent, setUnsent] = useState(false);
  const [starting, setStarting] = useState(false);
  const [refusal, setRefusal] = useState<string | null>(null);
  const [balanceAfter, setBalanceAfter] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  /** What went well (a voice taken off, a result attached): the tick, where `notice` carries the danger mark. */
  const [goodNotice, setGoodNotice] = useState<string | null>(null);
  const router = useRouter();
  // AITOOLS-07: "Your voice" (VoiceOver only), its agreement, and what follows a finished result.
  const own = useQuery(ownVoiceQuery(tool.id === 'voiceover' ? owner : null), queryClient);
  const [consenting, setConsenting] = useState(false);
  const [consentBusy, setConsentBusy] = useState(false);
  const [consentFailure, setConsentFailure] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const offersOwn = kind === 'text' && own.data?.available === true && own.data.hasRecording === true;
  const ownReady = offersOwn && own.data?.ready === true;
  // PT2b's Save and Use in a product rows are VoiceOver's (AITOOLS-07). Quick voice, Sound effect and Music track keep their done view without them until a task adds them: their tests pin that.
  const savable = tool.id === 'voiceover';
  // PT2 draws a play button on "Your voice" too. The Hub serves no sample of the recording itself (`sample.recorded` is a flag); what it does
  // serve is the person's own Voice Intro, read by their voice, and that plays here. Not drawn while there is none (R-47).
  const intro = useQuery({ queryKey: voiceIntroKey, queryFn: fetchVoiceIntro, enabled: offersOwn }, queryClient);
  const ownSample = offersOwn ? intro.data?.audioUrl : null;
  // The recording of a file tool: its name and size, where it is (going up, being measured, ready), the `key` the upload gave and the Hub's quote of its length.
  const [recording, setRecording] = useState<Recording | null>(null);
  const [fileKey, setFileKey] = useState<string | null>(null);
  const [fileQuote, setFileQuote] = useState<FileQuote | null>(null);
  const [fileRefusal, setFileRefusal] = useState<{ title: string; body: string } | null>(null);
  const [canShare, setCanShare] = useState(false);
  // Dubbing: the language to hear it in, one of the Hub's list. Nothing is chosen until the person chooses: a dub costs points in every language.
  const [targetLanguage, setTargetLanguage] = useState('');
  const choosing = useRef(0);
  const sending = useRef(false);
  /** The request the Hub has not answered: the same key and body go again on Try again. */
  const pending = useRef<JobIntent | null>(null);
  /** The key of the job on screen, so its record goes when the person has seen its end. */
  const activeKey = useRef<string | null>(null);

  const characters = charactersOf(text);
  // A flat price is one use or one track whatever the length of the description; a read-aloud is billed in minutes.
  // A recording's minutes are the Hub's own reading of its length (the file quote), never worked out on the phone.
  const units = kind === 'file' ? (fileQuote?.file.minutes ?? 0) : kind === 'prompt' ? 1 : unitsFor(characters, tool.input.charactersPerUnit);
  const fileRule = tool.input.file ?? null;
  const dubbing = isDubbing(tool);
  const languages = dubLanguages(tool);

  const job = useQuery({
    ...voiceJobQuery(owner, jobId),
    refetchInterval: (query) => {
      // A job the Hub does not know (404) will not appear by being asked again (SWEEP-APP-3 row 167).
      if (isApiError(query.state.error) && query.state.error.status === 404) return false;
      const data = query.state.data;
      return data === undefined || data.state === 'working' || (data.state === 'done' && !hasResult(data)) ? pollMsFor(tool.id, data?.createdAt) : false;
    },
  }, queryClient);
  const view: View_ = jobId ? (job.data?.state === 'done' && hasResult(job.data) ? 'done' : job.data?.state === 'failed' ? 'failed' : 'working') : unsent ? 'unsent' : 'input';

  // The cost before Run is the Hub's: one quote per length in minutes (it holds and takes nothing).
  const costKey = ['points', 'job-quote', owner ?? '', tool.action, units] as const;
  const cost = useQuery(
    { queryKey: costKey, queryFn: () => fetchJobQuote({ action: tool.action as JobAction, units, characters }), enabled: Boolean(owner) && kind !== 'file' && characters > 0 && view === 'input', staleTime: 30_000 },
    queryClient,
  );
  const shownCost = kind === 'file' ? (recording?.phase === 'ready' ? (fileQuote?.costPoints ?? null) : null) : (cost.data?.costPoints ?? null);

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
        const outcome = await startJob({
          toolId: intent.toolId,
          request: intent.fileKey ? { kind: 'file', fileKey: intent.fileKey, ...(intent.targetLanguage ? { targetLanguage: intent.targetLanguage } : {}) } : kind === 'prompt' ? { kind: 'prompt', prompt: intent.text } : { kind: 'text', text: intent.text, voiceId: intent.voiceId },
          quoteToken: intent.quoteToken,
          key: intent.key,
        });
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
          await dropJobIntent(owner, intent.key, intent.toolId);
          setRefusal(outcome.message);
          void queryClient.invalidateQueries({ queryKey: ['points', 'job-quote'] });
        }
      } finally {
        sending.current = false;
        setStarting(false);
      }
    },
    [owner, kind],
  );

  const check = useJobCheck({
    onReady: (quote, input) => {
      // The cost the person was shown is not the cost now: show the new one and wait for them to run it again.
      if (shownCost !== null && quote.costPoints !== shownCost) {
        if (kind === 'file') setFileQuote((was) => (was ? { ...was, ...quote } : was));
        else queryClient.setQueryData(costKey, quote);
        setNotice(TOOL_WORDS.costMoved);
        return;
      }
      if (kind === 'file' && !fileKey) return;
      if (dubbing && !targetLanguage) return;
      void send({
        key: newRequestKey(),
        toolId: tool.id,
        action: tool.action,
        voiceId: kind === 'text' ? voiceId : '',
        text: kind === 'file' ? (recording?.name ?? 'recording') : text.trim(),
        units: input.units,
        characters: kind === 'file' ? 0 : (input.characters ?? characters),
        quoteToken: quote.quoteToken,
        ...(kind === 'file' && fileKey ? { fileKey } : {}),
        ...(dubbing && targetLanguage ? { targetLanguage } : {}),
        jobId: null,
        at: Date.now(),
      });
    },
    onBuyPoints,
    onLeave,
  });

  // "Your voice" leads the list and is the one picked when it is ready, as PT2 draws it (the person may pick another).
  const ownDefault = useRef(false);
  useEffect(() => {
    if (!ownReady || ownDefault.current || jobId) return;
    ownDefault.current = true;
    setVoiceId(OWN_VOICE_ID);
  }, [ownReady, jobId]);

  const pickVoice = (id: string) => {
    if (id === OWN_VOICE_ID && !ownReady) {
      setConsentFailure(null);
      setConsenting(true);
      return;
    }
    setConsenting(false);
    setVoiceId(id);
  };
  const agree = async () => {
    if (!own.data || consentBusy) return;
    setConsentBusy(true);
    setConsentFailure(null);
    try {
      const next = await giveOwnVoiceConsent(own.data.consent.line);
      queryClient.setQueryData(ownVoiceKey(owner), next);
      setConsenting(false);
      setVoiceId(OWN_VOICE_ID);
    } catch (error) {
      setConsentFailure(isApiError(error) && error.message ? error.message : EXTRAS_WORDS.removeFailed);
      void own.refetch();
    } finally {
      setConsentBusy(false);
    }
  };
  const takeBack = async () => {
    try {
      const out = await removeOwnVoice();
      queryClient.setQueryData(ownVoiceKey(owner), out.own);
      if (voiceId === OWN_VOICE_ID) setVoiceId(tool.voices[0]?.id ?? '');
      setGoodNotice(out.atProvider === 'gone' ? EXTRAS_WORDS.removed : EXTRAS_WORDS.removing);
    } catch {
      setNotice(EXTRAS_WORDS.removeFailed);
    }
  };

  // A job the person left running (or a request the Hub never answered) is picked up where it was.
  useEffect(() => {
    if (!owner) return;
    let alive = true;
    void findJobIntent(owner, tool.id).then((found) => {
      if (!alive || !found || found.toolId !== tool.id || sending.current) return;
      if (found.fileKey) {
        // The recording was uploaded and the job sent: only its name is kept here (the file is on the Hub, and goes when the job settles).
        setFileKey(found.fileKey);
        if (found.targetLanguage) setTargetLanguage(found.targetLanguage);
        setRecording({ name: found.text, bytes: 0, phase: 'ready', share: 1 });
      } else setText(found.text);
      if (kind === 'text') setVoiceId(found.voiceId);
      activeKey.current = found.key;
      if (found.jobId) setJobId(found.jobId);
      else void send(found);
    });
    return () => {
      alive = false;
    };
  }, [owner, tool.id, kind, send]);

  // The Hub does not know this job: its record goes, so the app does not look for it again on the next visit (SWEEP-APP-3 row 167).
  const gone = isApiError(job.error) && job.error.status === 404;
  useEffect(() => {
    if (!owner || !gone || !activeKey.current) return;
    void dropJobIntent(owner, activeKey.current, tool.id);
    activeKey.current = null;
  }, [owner, gone, tool.id]);

  // The person has seen the job's end: its record goes, and the Hub's balance is read again (points were kept, or came back).
  const ended = job.data?.state === 'failed' || (job.data?.state === 'done' && hasResult(job.data));
  useEffect(() => {
    if (!owner || !ended) return;
    if (activeKey.current) void dropJobIntent(owner, activeKey.current, tool.id);
    activeKey.current = null;
    void queryClient.invalidateQueries({ queryKey: ['points', 'job-quote'] });
    void queryClient.fetchQuery({ ...myPointsQuery(owner), staleTime: 0 }).then((fresh) => setBalanceAfter(fresh.balance), () => undefined);
  }, [owner, ended, tool.id]);

  // The Hub lets the person's file go when its job settles, done or failed, so a settled job leaves nothing to run again: a failed job shows the empty row and asks for the recording again.
  const fileReady = recording?.phase === 'ready' && fileKey !== null && fileQuote !== null && !ended && (!dubbing || targetLanguage !== '');
  const shownRecording = kind === 'file' && jobId && job.data?.state === 'failed' ? null : recording;
  const run = () => {
    if ((kind === 'file' ? !fileReady : characters === 0) || starting || check.checking) return;
    setRefusal(null);
    // A recording is priced by the minutes the Hub read from it; the phone sends no length and no characters.
    // A dub is priced for one language (a second language is a second job), so the quote says so.
    check.check(kind === 'file' ? { action: tool.action as JobAction, units, ...(dubbing ? { languages: 1 } : {}) } : { action: tool.action as JobAction, units, characters });
  };

  /** The person picks a recording: it is checked against the Hub's rule, goes up, and the Hub reads its length and quotes it. A refusal is the Hub's own words and nothing is held. */
  const choose = async () => {
    if (!fileRule || starting || check.checking || recording?.phase === 'uploading' || recording?.phase === 'checking') return;
    const turn = ++choosing.current;
    const live = () => choosing.current === turn;
    setRefusal(null);
    let picked;
    try {
      picked = await pickFile(acceptedTypes(fileRule));
    } catch {
      if (live()) setFileRefusal({ title: FILE_WORDS.pickFailedTitle, body: FILE_WORDS.pickFailedBody });
      return;
    }
    if (!picked || !live()) {
      picked?.discard?.();
      return;
    }
    // The old result (or failure) goes: this is a new job. The old file's key is the Hub's to let go when its job settles.
    if (jobId) {
      setJobId(null);
      setBalanceAfter(null);
    }
    setFileKey(null);
    setFileQuote(null);
    setFileRefusal(null);
    const file = { ...picked, contentType: typeOfRecording(picked) };
    const refusal = refusalFor(file, fileRule);
    if (refusal) {
      picked.discard?.();
      setRecording({ name: picked.name, bytes: picked.blob.size, phase: 'refused', share: 0 });
      setFileRefusal({ title: TOOL_WORDS.refusedTitle, body: refusal });
      return;
    }
    const base = { name: picked.name, bytes: picked.blob.size };
    setRecording({ ...base, phase: 'uploading', share: 0 });
    try {
      const up = await uploadRecording(file, folderFor(file.contentType, fileRule), (share) => live() && setRecording((r) => (r && r.phase === 'uploading' ? { ...r, share } : r)));
      if (!live()) return;
      setRecording({ ...base, phase: 'checking', share: 1 });
      const quote = await fetchFileQuote(tool.id, up.key);
      if (!live()) return;
      // A recording past the longest job is refused with the Hub's own sentence, and nothing is held.
      if (quote.cap && quote.cap.cap === 'minutes_per_job') {
        setRecording({ ...base, phase: 'refused', share: 1 });
        setFileRefusal({ title: capTitle(quote.cap), body: quote.cap.message });
        return;
      }
      setFileKey(up.key);
      setFileQuote(quote);
      setRecording({ ...base, phase: 'ready', share: 1 });
    } catch (error) {
      if (!live()) return;
      setRecording({ ...base, phase: 'refused', share: 0 });
      const said = isApiError(error) && error.message ? error.message : '';
      setFileRefusal(
        isApiError(error) && error.code === 'upload_failed' ? { title: FILE_WORDS.uploadFailedTitle, body: said || FILE_WORDS.uploadFailedBody } : { title: TOOL_WORDS.refusedTitle, body: said || FILE_WORDS.uploadFailedBody },
      );
    }
  };

  // The phone's share sheet is offered for the subtitle file only where the phone has one (the web draws no share row).
  useEffect(() => {
    if (kind !== 'file') return;
    let alive = true;
    void canShareSubtitles().then((yes) => alive && setCanShare(yes));
    return () => {
      alive = false;
    };
  }, [kind]);
  const shareFile = (text: string, extension: 'srt' | 'vtt' = 'srt') => {
    shareSubtitles(text, subtitleFileName(recording?.name ?? '', extension), FILE_WORDS.shareTitle, extension === 'vtt' ? 'text/vtt' : 'application/x-subrip').catch(() => setNotice(FILE_WORDS.shareFailed));
  };
  // A dub's subtitles (WebVTT), read for the person; the Hub may send none (the dub is kept without them), and then no card is drawn.
  const doneJob = job.data && job.data.state === 'done' ? job.data : null;
  const subtitleCues = dubbing && doneJob ? readCues(outputText(doneJob, 'subtitles') ?? '') : [];

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
  // Under the row: the Hub's types and limits while a recording is to be chosen, its length once one is ready. A settled job (PT2b) shows
  // what was heard and how long it was, never the limits; a failed one shows nothing, its banner is next (SWEEP-APP-8 L3, POINTS-10).
  const fileMetaLine =
    !fileRule
      ? ''
      : ended
        ? view === 'done' && fileQuote
          ? lengthLine(units)
          : ''
        : shownRecording?.phase === 'ready' && fileQuote
          ? lengthLine(units)
          : limitsLine(fileRule);
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
        <Button label={TOOL_WORDS.run} full loading={check.checking || starting} disabled={kind === 'file' ? !fileReady : characters === 0} onPress={run} testID="tool-run" />
      </View>
    ) : view === 'failed' ? (
      <Button label={TOOL_WORDS.tryAgain} full loading={check.checking || starting} onPress={kind === 'file' ? () => void choose() : run} testID="tool-try-again" />
    ) : view === 'unsent' ? (
      <Button label={TOOL_WORDS.tryAgain} full loading={starting} onPress={() => pending.current && void send(pending.current)} testID="tool-resend" />
    ) : undefined;

  return (
    <PointsFrame title={tool.name} subtitle={`Points: ${formatPointsCount(balance)}`} onBack={onBack} gap={BODY_GAP} foot={foot} testID="tool-screen">
      {kind === 'file' && fileRule ? (
        <View style={styles.boxGroup}>
          <RecordingBox recording={shownRecording} onChoose={() => void choose()} enabled={typing && !starting && !check.checking} settled={view === 'done'} />
          <View style={styles.meta}>
            <Text variant="body" tone="textMuted" testID="tool-length" style={[styles.metaText, styles.metaWide]}>
              {fileMetaLine}
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.boxGroup}>
          <WordsBox
            value={text}
            onChange={edit}
            editable={typing}
            tall={view === 'input'}
            max={tool.input.maxCharacters}
            placeholder={kind === 'prompt' ? tool.description || TOOL_WORDS.placeholder : TOOL_WORDS.placeholder}
            label={kind === 'prompt' ? TOOL_WORDS.promptBoxLabel : TOOL_WORDS.boxLabel}
          />
          <View style={styles.meta}>
            <Text variant="body" tone="textMuted" testID="tool-length" style={styles.metaText}>
              {kind === 'text' && characters > 0 ? lengthLine(units) : ''}
            </Text>
            <Text variant="body" tone="textMuted" testID="tool-count" style={styles.metaText}>
              {countLine(characters, tool.input.maxCharacters)}
            </Text>
          </View>
        </View>
      )}
      {view === 'input' && fileRefusal ? <Banner tone="danger" icon="CircleX" title={fileRefusal.title} body={fileRefusal.body} testID="tool-file-refused" /> : null}
      {view === 'input' && refusal ? <Banner tone="danger" icon="CircleX" title={TOOL_WORDS.refusedTitle} body={refusal} testID="tool-refused" /> : null}
      {view === 'input' && kind === 'text' ? (
        <VoiceList
          voices={offersOwn ? [{ id: OWN_VOICE_ID, name: EXTRAS_WORDS.ownName, description: EXTRAS_WORDS.ownLine, sampleUrl: ownSample ?? null }, ...tool.voices] : tool.voices}
          value={voiceId}
          onChange={pickVoice}
        />
      ) : null}
      {view === 'input' && consenting && own.data ? (
        <OwnVoiceConsent line={own.data.consent.line} busy={consentBusy} failure={consentFailure} onAgree={() => void agree()} onCancel={() => setConsenting(false)} />
      ) : null}
      {view === 'input' && ownReady ? <Button testID="own-voice-remove" label={EXTRAS_WORDS.removeVoice} variant="secondary" full onPress={() => void takeBack()} /> : null}
      {view === 'input' && dubbing ? (
        <VoiceList
          voices={languages.map((l) => ({ id: l.code, name: l.name, description: '' }))}
          value={targetLanguage}
          onChange={(code) => {
            setTargetLanguage(code);
            setRefusal(null);
          }}
          label={DUB_WORDS.language}
          testID="tool-languages"
          rowPrefix="tool-language"
        />
      ) : null}
      {view === 'working' ? <Working name={tool.name} body={dubbing ? DUB_WORDS.workingBody : TOOL_WORDS.workingBody} /> : null}
      {view === 'done' && job.data && hasResult(job.data) ? (
        <View style={styles.done}>
          {job.data.audioUrl ? (
            <ResultPlayer testID="tool-player" uri={job.data.audioUrl} name={tool.name} />
          ) : (
            <TranscriptCard text={outputText(job.data, 'text') ?? ''} onShare={canShare && outputText(job.data, 'subtitles') ? () => shareFile(outputText(job.data as VoiceJob, 'subtitles') ?? '') : undefined} />
          )}
          {dubbing && subtitleCues.length > 0 ? <SubtitlesCard cues={subtitleCues} onShare={canShare ? () => shareFile(outputText(job.data as VoiceJob, 'subtitles') ?? '', 'vtt') : undefined} /> : null}
          {savable && job.data.audioUrl && picking ? (
            <DraftPicker
              jobId={job.data.id}
              onCancel={() => setPicking(false)}
              onAttached={(title) => {
                setPicking(false);
                setGoodNotice(EXTRAS_WORDS.attached(title));
              }}
              onStartDraft={() => router.push('/shop')}
            />
          ) : savable && job.data.audioUrl ? (
            <ResultActions owner={owner} job={job.data} onUse={() => setPicking(true)} />
          ) : null}
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
      {jobId && job.isError && !ended ? (
        <Banner tone="warning" title={TOOL_WORDS.unreadableTitle} body={isApiError(job.error) && job.error.message ? job.error.message : TOOL_WORDS.unreadableBody} testID="tool-job-error" />
      ) : null}
      {check.node}
      {notice ? <Toast message={notice} tone="alert" placement="top" lines={2} onHide={() => setNotice(null)} testID="tool-notice" /> : null}
      {goodNotice ? <Toast message={goodNotice} tone="success" placement="top" lines={2} onHide={() => setGoodNotice(null)} testID="tool-notice-ok" /> : null}
    </PointsFrame>
  );
}

/** The words to speak, or the description of a sound or track: a multi-line box on the input colour; the ring is the accent while typing. */
function WordsBox({ value, onChange, editable, tall, max, placeholder, label }: { value: string; onChange: (next: string) => void; editable: boolean; tall: boolean; max: number; placeholder: string; label: string }) {
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
        accessibilityLabel={label}
        multiline
        editable={editable}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        maxLength={max > 0 ? max * 2 : undefined}
        textAlignVertical="top"
        onContentSizeChange={(e) => setGrown(e.nativeEvent.contentSize.height)}
        style={[styles.input, { color: colors.textPrimary }, font(400), browserOutlineOff, grown > 0 ? { height: Math.max(grown, BOX.font * BOX.leading) } : null]}
      />
    </View>
  );
}

/** PT2's single-choice rows: the voices of a tool that reads words aloud, and (POINTS-11) the languages of Dubbing, the same row under another label. */
function VoiceList({
  voices,
  value,
  onChange,
  label = TOOL_WORDS.voice,
  testID = 'tool-voices',
  rowPrefix = 'tool-voice',
}: {
  voices: AiTool['voices'];
  value: string;
  onChange: (id: string) => void;
  label?: string;
  testID?: string;
  rowPrefix?: string;
}) {
  return (
    <View style={styles.voices}>
      <Text variant="body" tone="textMuted" accessibilityRole="header" style={[font(700), styles.label]}>
        {label}
      </Text>
      <View accessibilityRole="radiogroup" testID={testID} style={styles.voiceList}>
        {voices.map((voice) => (
          <VoiceRow key={voice.id} voice={voice} on={voice.id === value} onPress={() => onChange(voice.id)} testID={`${rowPrefix}-${voice.id}`} />
        ))}
      </View>
    </View>
  );
}

function VoiceRow({ voice, on, onPress, testID }: { voice: AiTool['voices'][number]; on: boolean; onPress: () => void; testID: string }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID={testID}
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
      {voice.sampleUrl ? <PreviewPlay sampleUrl={voice.sampleUrl} name={voice.name} /> : null}
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

function Working({ name, body }: { name: string; body: string }) {
  return (
    <View testID="tool-working" accessibilityLiveRegion="polite" style={styles.working}>
      <IconTile icon="Loader" tone="accent" size={WORKING.mark} />
      <Text variant="body" accessibilityRole="header" style={[font(700), styles.workingTitle, { fontSize: WORKING.title, lineHeight: WORKING.title * WORKING.titleLeading, letterSpacing: WORKING.titleTracking * WORKING.title }]}>
        {TOOL_WORDS.workingTitle(name)}
      </Text>
      <Text variant="body" tone="textSecondary" style={[styles.workingBody, { fontSize: WORKING.body, lineHeight: WORKING.body * WORKING.bodyLeading }]}>
        {body}
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
  metaWide: { flex: 1 },
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
