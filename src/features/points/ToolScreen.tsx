import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { browserOutlineOff } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { formatPointsCount } from '@/components/PointsFigure';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { Toast } from '@/components/Toast';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { fetchVoiceIntro, voiceIntroKey } from '@/features/verify/voiceApi';
import { useCreatorGate } from '@/features/create/CreateEntry';
import { pickFile } from '@/features/create/pickFile';
import { ProductsFullHost } from '@/features/verify/ProductsFullHost';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { newRequestKey } from '@/features/wallet/api/settings';
import { canvasNormalLineHeight, font, space, useWawu, radius } from '@/theme';

import { myPointsQuery } from './api';
import { UPLOAD_CANCELLED } from '@/features/create/upload';
import type { ChosenFile } from '@/features/create/chosen';

import { fetchFileQuote, uploadRecording, type FileQuote } from './fileToolApi';
import { DUB_WORDS, dubLanguages, FILE_WORDS, folderFor, isDubbing, limitsLine, longestSeconds, readCues, refusalFor, spokenLength, subtitleFileName, typeOfRecording, acceptedTypes } from './fileToolModel';
import { CancelUpload, RecordingBox, SubtitlesCard, TranscriptCard, type Recording } from './FileParts';
import { SceneLines } from './DialogueParts';
import { PartsList, PartsRow } from './PartsList';
import { PodcastInputs, type PodcastChoice } from './PodcastParts';
import { RecordSection } from './RecordRow';
import { RunSummary } from './RunSummary';
import { pickTextFile } from './textPick';
import { BOOK_WORDS, DIALOGUE_WORDS, FILE_STEP_WORDS, isFlatFileTool, linkProblem, MUSIC_WORDS, nextVoice, PODCAST_WORDS, sceneCharacters, sceneFilled, sceneVoices, SUMMARY_WORDS, textFileProblem, voiceProblem, writeLine, type SceneLine } from './voiceToolsModel';
import { LengthRow, PhotoRow, ShapeRow, VoiceRow as SpeechRow } from './MediaInputs';
import { defaultShape, isTalking, lengthsOf, MEDIA_WORDS, shapesOf, thingOf, workingTitleFor } from './mediaToolModel';
import type { AiPiece } from './mediaToolApi';
import { putPieceInDraft } from './pieceFlow';
import { DoneCard, ResultMedia } from './ResultView';
import { useMediaInputs } from './useMediaInputs';
import { useJobCheck } from './JobCheck';
import { PointsFrame } from './PointsFrame';
import { ResultPlayer } from './ResultPlayer';
import { aiToolsQuery, fetchJobQuote, type AiTool, type JobAction, type JobInput } from './studioApi';
import { giveOwnVoiceConsent, OWN_VOICE_ID, ownVoiceKey, ownVoiceQuery, removeOwnVoice } from './ownVoiceApi';
import { capTitle } from './studioModel';
import { canShareSubtitles, shareSubtitles } from './subtitleFile';
import { DraftPicker, OwnVoiceConsent } from './VoiceExtras';
import { Working } from './WorkingView';
import { CloneVoiceScreen } from './CloneVoiceScreen';
import { ReceptionistScreen } from './ReceptionistScreen';
import { VOICE, VoiceList } from './VoiceRows';
import { charactersOf, clampText, countLine, EXTRAS_WORDS, failedWords, inputKindOf, lengthLine, TOOL_WORDS, toolReady, unitsFor, usedLine, type InputKind } from './voiceoverModel';
import { dropJobIntent, findJobIntent, putJobIntent, type JobIntent, type MediaIntent } from './voiceoverIntent';
import { hasResult, mediaResult, outputText, pollMsFor, resultFiles, startJob, voiceJobQuery, type JobRequest, type VoiceJob } from './voiceoverApi';

/** design/_gen/points.js line 90, `pt2Body`: the parts stand 14 apart; the box and its count line 8 apart. */
const BODY_GAP = 14;
/** Line 90: a 20 corner box on the input colour, 14 by 16 padding, 15 type on a 1.5 line, 150 high while typing and 110 after; a 1.5 accent ring while typing, a 1 hairline after. The count line is 12.5, muted. */
const BOX = { radius: 20, padV: 14, padH: 16, font: 15, leading: 1.5, tall: 150, short: 110, big: 260, compact: 76, ringOn: 1.5, ringOff: 1, between: 8, meta: 12.5 } as const;
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
  /** A finished job the ready notification names (AITOOLS-08): shown when the phone holds no record of the running one. */
  openJobId?: string;
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
  // The Receptionist and Clone your own voice are screens of their own (POINTS-12, POINTS-16): a set-up, what it knows and a chat; a consent, a recording and a saved voice.
  if (tool.id === 'receptionist') return <ReceptionistScreen key={tool.id} owner={owner} tool={tool} balance={points.data.balance} onBack={props.onBack} onBuyPoints={props.onBuyPoints} onLeave={props.onLeave} />;
  if (tool.id === 'my-voice') return <CloneVoiceScreen key={tool.id} owner={owner} tool={tool} balance={points.data.balance} onBack={props.onBack} onBuyPoints={props.onBuyPoints} onLeave={props.onLeave} />;
  return <Tool key={tool.id} {...props} owner={owner} tool={tool} balance={points.data.balance} />;
}

export type ToolProps = ToolScreenProps & { owner: string | null; tool: AiTool; balance: number };

/** What the person is looking at: typing (PT2), the job working (PT2a), done (PT2b), failed (PT2c), or a request the Hub never answered. */
type View_ = 'input' | 'working' | 'done' | 'failed' | 'unsent';

/** The tool's body, for `ToolScreen` and for the development-only picture gallery (`Gallery.tsx`), which hands it canned data. */
export function Tool({ owner, tool, balance, onBack, onBuyPoints, onLeave, openJobId }: ToolProps) {
  const { colors } = useWawu();
  const kind = inputKindOf(tool);
  const [text, setText] = useState('');
  // A Voice changer picks the voice to hear a recording in, as VoiceOver does for words (POINTS-16).
  const takesVoice = kind === 'text' || (kind === 'file' && tool.input.file?.voice === true);
  const [voiceId, setVoiceId] = useState(takesVoice ? (tool.voices[0]?.id ?? '') : '');
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
  // POINTS-14 and POINTS-15: the picture and video tools' choices (shape, length), their photo and voice rows, and the original photo beside an edited result.
  const talking = isTalking(tool);
  const lengths = lengthsOf(tool);
  const [shape, setShape] = useState(() => defaultShape(tool));
  const [seconds, setSeconds] = useState(() => lengths[0] ?? 0);
  const [voicePicking, setVoicePicking] = useState(false);
  const [original, setOriginal] = useState<string | null>(null);
  const [placesSheet, setPlacesSheet] = useState(false);
  // The Hub adds "Your voice" itself, as the first voice, once the person keeps a clone (POINTS-16): then the list is the Hub's as it comes.
  const hubOwn = tool.voices.some((v) => v.id === OWN_VOICE_ID);
  const offersOwn = kind === 'text' && !hubOwn && own.data?.available === true && own.data.hasRecording === true;
  const ownReady = offersOwn && own.data?.ready === true;
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
  /** The upload that is going up, so "Cancel" can stop it (POINTS-17). */
  const uploading = useRef<AbortController | null>(null);
  const sending = useRef(false);
  const media = useMediaInputs(tool, starting);
  // POINTS-16 to POINTS-18: Dialogue's lines, the Podcast maker's choices, Split a song's parts, the mood of Music for a video and the Audiobook's text file.
  const nextLine = useRef(3);
  const [lines, setLines] = useState<SceneLine[]>(() =>
    inputKindOf(tool) === 'dialogue'
      ? [
          { id: 1, text: '', voiceId: tool.voices[0]?.id ?? '' },
          { id: 2, text: '', voiceId: tool.voices[1]?.id ?? tool.voices[0]?.id ?? '' },
        ]
      : [],
  );
  const [sceneNote, setSceneNote] = useState<string | null>(null);
  const pod = tool.input.podcast ?? null;
  const [podcast, setPodcast] = useState<PodcastChoice>(() => ({
    source: 'text',
    text: '',
    link: '',
    hosts: pod?.modes.includes('conversation') ? 2 : 1,
    voiceIds: [tool.voices[0]?.id ?? '', tool.voices[1]?.id ?? tool.voices[0]?.id ?? ''],
    duration: pod?.durations.find((d) => d.id === 'standard')?.id ?? pod?.durations[0]?.id ?? '',
    language: pod?.languages[0]?.code ?? '',
  }));
  const [parts, setParts] = useState(() => tool.input.file?.parts?.[0] ?? 2);
  const [mood, setMood] = useState('');
  const [bookFile, setBookFile] = useState<string | null>(null);
  /** The job whose "Edit" was pressed: its input is unfolded again, with its result kept below, until the words change or a new run starts (S2-APP-2 patch, F1). */
  const [editFor, setEditFor] = useState<string | null>(null);
  /** False when the screen was opened on a job from a ready notice and the phone holds no record of what was chosen for it. */
  const [choicesKnown, setChoicesKnown] = useState(true);
  /** The request the Hub has not answered: the same key and body go again on Try again. */
  const pending = useRef<JobIntent | null>(null);
  /** The key of the job on screen, so its record goes when the person has seen its end. */
  const activeKey = useRef<string | null>(null);

  const sceneChars = sceneCharacters(lines);
  const podcastChars = podcast.source === 'text' ? charactersOf(podcast.text) : 0;
  const characters = kind === 'dialogue' ? sceneChars : kind === 'podcast' ? podcastChars : charactersOf(text);
  /** A tool that takes a description (a sound, a track, a picture, a clip) rather than words to speak. */
  const describes = kind === 'prompt' || kind === 'image' || kind === 'video';
  const maxVoices = tool.input.dialogue?.maxVoices ?? 0;
  const linkIssue = kind === 'podcast' && podcast.source === 'link' ? linkProblem(podcast.link, pod?.maxLinkCharacters ?? 0) : null;
  const hostIssue = kind === 'podcast' && podcast.hosts === 2 && podcast.voiceIds[0] === podcast.voiceIds[1] ? PODCAST_WORDS.sameVoice : null;
  const podcastReady =
    kind === 'podcast' &&
    (podcast.source === 'text' ? podcastChars > 0 && podcastChars <= tool.input.maxCharacters : podcast.link.trim() !== '' && linkIssue === null) &&
    hostIssue === null &&
    podcast.duration !== '' &&
    podcast.language !== '';
  /** The plan action a quote is for: a podcast's is its length's, every other tool's is its own. */
  const quoteAction = (kind === 'podcast' ? pod?.durations.find((d) => d.id === podcast.duration)?.action : undefined) ?? tool.action;
  const flatFile = kind === 'file' && isFlatFileTool(tool);
  // A flat price is one use or one track whatever the length of the description; a read-aloud is billed in minutes.
  // A recording's minutes are the Hub's own reading of its length (the file quote), never worked out on the phone.
  // A picture is one use; a clip is its chosen seconds; a talking photo is the seconds the Hub read from the voice (never worked out here).
  // A song, a video's music and a voice sample are one use or one track whatever their length: their units are the Hub's quote's own.
  const units =
    kind === 'file'
      ? flatFile
        ? (fileQuote?.units ?? 0)
        : (fileQuote?.file.minutes ?? 0)
      : kind === 'prompt' || kind === 'image' || kind === 'podcast'
        ? 1
        : kind === 'video'
          ? talking
            ? (media.speech?.speech.seconds ?? 0)
            : seconds
          : unitsFor(characters, tool.input.charactersPerUnit);
  const photoUp = media.photo?.phase === 'uploading' || media.voice?.phase === 'uploading' || media.voice?.phase === 'checking';
  /** What has to be in before Run: words (not for a talking photo), the photo an edit or a talking photo needs, the voice of a talking photo; nothing still going up. */
  const inputsReady =
    !photoUp &&
    (talking
      ? media.photo?.phase === 'ready' && media.voice?.phase === 'ready' && media.speech !== null
      : kind === 'dialogue'
        ? sceneFilled(lines) && sceneVoices(lines).size <= maxVoices && sceneChars <= tool.input.maxCharacters
        : kind === 'podcast'
          ? podcastReady
          : characters > 0) &&
    (tool.id !== 'photo-edit' || media.photo?.phase === 'ready');
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

  /** The Audiobook and the Podcast maker fold their input into one row once Run is pressed, so the job's view sits in the first screen (S2-APP-2 patch, F1). */
  const foldsInput = kind === 'podcast' || tool.id === 'audiobook';
  const reopened = jobId !== null && editFor === jobId;
  const folded = foldsInput && (view === 'working' || view === 'unsent' || ((view === 'done' || view === 'failed') && !reopened));

  // The cost before Run is the Hub's: one quote per length in minutes (it holds and takes nothing).
  const costKey = ['points', 'job-quote', owner ?? '', quoteAction, units] as const;
  const unwordedQuote = talking || kind === 'podcast';
  const cost = useQuery(
    {
      queryKey: costKey,
      queryFn: () => fetchJobQuote(unwordedQuote ? { action: quoteAction as JobAction, units } : { action: quoteAction as JobAction, units, characters }),
      enabled: Boolean(owner) && kind !== 'file' && (talking ? units > 0 : kind === 'podcast' ? podcastReady : characters > 0) && view === 'input',
      staleTime: 30_000,
    },
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
      setChoicesKnown(true);
      activeKey.current = intent.key;
      pending.current = intent;
      try {
        await putJobIntent(owner, intent);
        const outcome = await startJob({
          toolId: intent.toolId,
          request: requestOf(intent, kind, talking),
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
    [owner, kind, talking],
  );

  /** What the person chose besides the words, as the job carries it: the shape, the clip's seconds, the uploaded photo and a talking photo's voice. */
  const mediaChoices = (): MediaIntent | null => {
    if (kind !== 'image' && kind !== 'video') return null;
    const voice = media.voice;
    return {
      ...(!talking && shape ? { shape } : {}),
      ...(kind === 'video' && !talking ? { seconds } : {}),
      ...(media.photo?.key ? { photoKey: media.photo.key } : {}),
      ...(talking && voice?.source === 'file' && voice.audioKey ? { audioKey: voice.audioKey } : {}),
      ...(talking && voice?.source === 'job' ? { sourceJobId: voice.jobId } : {}),
    };
  };

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
      const chosen = mediaChoices();
      if (chosen && talking && !(chosen.photoKey && (chosen.audioKey || chosen.sourceJobId))) return;
      setOriginal(media.photo?.previewUri ?? null);
      void send({
        key: newRequestKey(),
        toolId: tool.id,
        action: tool.action,
        voiceId: takesVoice ? voiceId : '',
        text:
          kind === 'file'
            ? (recording?.name ?? 'recording')
            : talking
              ? tool.name
              : kind === 'dialogue'
                ? lines.map((l) => l.text.trim()).join('\n')
                : kind === 'podcast'
                  ? podcast.source === 'text'
                    ? podcast.text.trim()
                    : podcast.link.trim()
                  : text.trim(),
        units: input.units,
        characters: kind === 'file' || talking ? 0 : kind === 'podcast' ? podcastChars : (input.characters ?? characters),
        quoteToken: quote.quoteToken,
        ...(kind === 'file' && fileKey ? { fileKey } : {}),
        ...(tool.id === 'stems' ? { parts } : {}),
        ...(tool.id === 'video-music' && mood.trim() ? { description: mood.trim() } : {}),
        ...(kind === 'dialogue' ? { lines: lines.map((l) => ({ text: l.text.trim(), voiceId: l.voiceId })) } : {}),
        ...(kind === 'podcast' && pod
          ? {
              podcast: {
                source: podcast.source === 'text' ? { text: podcast.text.trim() } : { url: podcast.link.trim() },
                mode: podcast.hosts === 2 ? ('conversation' as const) : ('bulletin' as const),
                voiceIds: podcast.hosts === 2 ? [podcast.voiceIds[0], podcast.voiceIds[1]] : [podcast.voiceIds[0]],
                duration: podcast.duration as 'short' | 'standard' | 'long',
                language: podcast.language,
              },
            }
          : {}),
        ...(dubbing && targetLanguage ? { targetLanguage } : {}),
        ...(chosen ? { media: chosen } : {}),
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
    if (id === OWN_VOICE_ID && !ownReady && !hubOwn) {
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
      if (alive && !found && openJobId && !sending.current) {
        setChoicesKnown(false);
        setJobId(openJobId);
      }
      if (!alive || !found || found.toolId !== tool.id || sending.current) return;
      if (found.fileKey) {
        // The recording was uploaded and the job sent: only its name is kept here (the file is on the Hub, and goes when the job settles).
        setFileKey(found.fileKey);
        if (found.targetLanguage) setTargetLanguage(found.targetLanguage);
        setRecording({ name: found.text, bytes: 0, phase: 'ready', share: 1 });
      } else if (found.media && talking) {
        // A talking photo has no words: its record holds the photo and the voice.
      } else if (found.lines) {
        setLines(found.lines.map((l, i) => ({ id: i + 1, ...l })));
        nextLine.current = found.lines.length + 1;
      } else if (found.podcast) {
        const q = found.podcast;
        setPodcast((was) => ({
          ...was,
          source: 'text' in q.source ? 'text' : 'link',
          text: 'text' in q.source ? q.source.text : '',
          link: 'url' in q.source ? q.source.url : '',
          hosts: q.mode === 'conversation' ? 2 : 1,
          voiceIds: [q.voiceIds[0] ?? was.voiceIds[0], q.voiceIds[1] ?? was.voiceIds[1]],
          duration: q.duration,
          language: q.language,
        }));
      } else setText(found.text);
      if (found.parts) setParts(found.parts);
      if (found.description) setMood(found.description);
      if (found.media) {
        if (found.media.shape) setShape(found.media.shape);
        if (found.media.seconds) setSeconds(found.media.seconds);
        media.restore(found.media);
      }
      if (takesVoice && found.voiceId) setVoiceId(found.voiceId);
      activeKey.current = found.key;
      if (found.jobId) setJobId(found.jobId);
      else void send(found);
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the record is read once for this tool; `media` and `talking` are the tool's own and do not change under it
  }, [owner, tool.id, kind, send, openJobId]);

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
    // The Hub lets a photo and a voice go when their job settles, so the rows ask again for the next run.
    media.settled();
    void queryClient.invalidateQueries({ queryKey: ['points', 'job-quote'] });
    void queryClient.fetchQuery({ ...myPointsQuery(owner), staleTime: 0 }).then((fresh) => setBalanceAfter(fresh.balance), () => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `media.settled` is stable
  }, [owner, ended, tool.id]);

  // The Hub lets the person's file go when its job settles, done or failed, so a settled job leaves nothing to run again: a failed job shows the empty row and asks for the recording again.
  const fileReady = recording?.phase === 'ready' && fileKey !== null && fileQuote !== null && !ended && (!dubbing || targetLanguage !== '');
  const shownRecording = kind === 'file' && jobId && job.data?.state === 'failed' ? null : recording;
  const run = () => {
    if ((kind === 'file' ? !fileReady : !inputsReady) || starting || check.checking) return;
    setRefusal(null);
    // A recording is priced by the minutes the Hub read from it; the phone sends no length and no characters.
    // A dub is priced for one language (a second language is a second job), so the quote says so.
    const job: JobInput =
      kind === 'file' ? { action: tool.action as JobAction, units, ...(dubbing ? { languages: 1 } : {}) } : unwordedQuote ? { action: quoteAction as JobAction, units } : { action: tool.action as JobAction, units, characters };
    check.check(job);
  };

  /** The person picks a recording, a video or a song: the phone's picker opens, then it is taken like a recording made here. */
  const choose = async () => {
    if (!fileRule || starting || check.checking || recording?.phase === 'uploading' || recording?.phase === 'checking') return;
    const turn = ++choosing.current;
    setRefusal(null);
    let picked;
    try {
      picked = await pickFile(acceptedTypes(fileRule));
    } catch {
      if (choosing.current === turn) setFileRefusal({ title: FILE_WORDS.pickFailedTitle, body: FILE_WORDS.pickFailedBody });
      return;
    }
    if (!picked || choosing.current !== turn) {
      picked?.discard?.();
      return;
    }
    await takeFile(picked, turn);
  };

  /**
   * A file in hand (picked, or recorded here): it is checked against the Hub's rule, goes up (and can be stopped), and the Hub reads its length
   * and quotes it. A refusal is the Hub's own words and nothing is held.
   */
  const takeFile = async (picked: ChosenFile, turn: number) => {
    if (!fileRule || starting || check.checking) {
      picked.discard?.();
      return;
    }
    const live = () => choosing.current === turn;
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
    const stop = new AbortController();
    uploading.current = stop;
    try {
      const up = await uploadRecording(file, folderFor(file.contentType, fileRule), (share) => live() && setRecording((r) => (r && r.phase === 'uploading' ? { ...r, share } : r)), stop.signal);
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
      if (isApiError(error) && error.code === UPLOAD_CANCELLED) {
        // The person stopped it: the row is empty again, nothing was held, and the same file can be chosen again.
        setRecording(null);
        return;
      }
      setRecording({ ...base, phase: 'refused', share: 0 });
      const said = isApiError(error) && error.message ? error.message : '';
      setFileRefusal(
        isApiError(error) && error.code === 'upload_failed' ? { title: FILE_WORDS.uploadFailedTitle, body: said || FILE_WORDS.uploadFailedBody } : { title: TOOL_WORDS.refusedTitle, body: said || FILE_WORDS.uploadFailedBody },
      );
    } finally {
      if (uploading.current === stop) uploading.current = null;
    }
  };
  /** "Cancel" on a big upload: it stops where it is. */
  const cancelUpload = () => {
    uploading.current?.abort();
  };

  /** The Audiobook's text file: its words fill the box (the file itself is never sent); a file that is not text, or is over the Hub's characters, is refused with the reason. */
  const chooseTextFile = async () => {
    if (starting || check.checking) return;
    setFileRefusal(null);
    let picked;
    try {
      picked = await pickTextFile(tool.input.maxCharacters);
    } catch {
      setFileRefusal({ title: BOOK_WORDS.pickFailedTitle, body: BOOK_WORDS.pickFailedBody });
      return;
    }
    if (!picked) return;
    const problem = picked.tooBig ? BOOK_WORDS.tooBig(tool.input.maxCharacters) : textFileProblem(picked, tool.input.maxCharacters);
    if (problem) {
      setBookFile(null);
      setFileRefusal({ title: BOOK_WORDS.refusedTitle, body: problem });
      return;
    }
    edit(picked.text);
    setBookFile(BOOK_WORDS.fileLine(picked.name, charactersOf(picked.text)));
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
  const doneMedia = doneJob ? mediaResult(doneJob) : null;
  // The audio a done job made: the Hub's `audioUrl`, else its first audio file; Split a song gives several (its parts).
  const audioParts = doneJob ? resultFiles(doneJob).filter((f) => f.output.kind === 'audio') : [];
  const audioUri = doneJob ? (doneJob.audioUrl ?? audioParts[0]?.output.url ?? null) : null;
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

  /** A choice made on a finished or failed view starts a new run: the page goes back to the input. */
  const startOver = () => {
    if (view === 'done' || view === 'failed') {
      setJobId(null);
      setBalanceAfter(null);
    }
    setRefusal(null);
  };
  /** Dialogue: a line's words (kept inside the Hub's characters), its voice (kept inside the Hub's voices), a line added or taken out. */
  const writeScene = (id: number, next: string) => {
    const out = writeLine(lines, id, next, tool.input.maxCharacters);
    startOver();
    setLines(out.lines);
    setSceneNote(out.note);
  };
  const pickSceneVoice = (id: number, picked: string) => {
    const problem = voiceProblem(lines, id, picked, maxVoices);
    if (problem) {
      setSceneNote(problem);
      return;
    }
    startOver();
    setSceneNote(null);
    setLines((all) => all.map((l) => (l.id === id ? { ...l, voiceId: picked } : l)));
  };
  const addSceneLine = () => {
    if (sceneChars >= tool.input.maxCharacters) {
      setSceneNote(DIALOGUE_WORDS.tooLong(tool.input.maxCharacters));
      return;
    }
    startOver();
    setSceneNote(null);
    setLines((all) => [...all, { id: nextLine.current++, text: '', voiceId: nextVoice(all, tool.voices, maxVoices) }]);
  };
  const removeSceneLine = (id: number) => {
    startOver();
    setSceneNote(null);
    setLines((all) => (all.length > 1 ? all.filter((l) => l.id !== id) : all));
  };
  /** The Podcast maker: any change goes back to the input and keeps the text inside the Hub's characters. */
  const changePodcast = (next: Partial<PodcastChoice>) => {
    startOver();
    setPodcast((was) => ({ ...was, ...next, ...(next.text !== undefined ? { text: clampText(next.text, tool.input.maxCharacters) } : {}) }));
  };
  /** The picture and video tools' next missing input, for Try again after a failure (the Hub let the photo go with the job). */
  const fillMissing = () => {
    if (talking && media.photo?.phase === 'ready' && media.voice?.phase !== 'ready') setVoicePicking(true);
    else {
      startOver();
      void media.choosePhoto('library');
    }
  };
  const creator = useCreatorGate(view === 'done') === 'creator';
  /** "Make it a piece": the file is in the draft and Create's preview step opens; Back there returns to this result. */
  const openPiece = (piece: AiPiece, previewUri?: string) => {
    putPieceInDraft(piece, previewUri);
    router.push('/create-preview');
  };

  const pieceHandlers = { onPiece: openPiece, onReopen: () => router.push('/create-preview'), onNeedTier: () => router.push('/tiers'), onProductsFull: () => setPlacesSheet(true) };
  const typing = view === 'input' || view === 'done' || view === 'failed';
  // Under the row: the Hub's types and limits while a recording is to be chosen, its length once one is ready. A settled job (PT2b) shows
  // what was heard and how long it was, never the limits; a failed one shows nothing, its banner is next (SWEEP-APP-8 L3, POINTS-10).
  // A recording is "About N minutes" (the minutes it is priced by); a song or a video, priced as one use, is how long the Hub read it to be.
  const heardLength = flatFile && fileQuote ? spokenLength(fileQuote.file.seconds) : lengthLine(units);
  const fileMetaLine =
    !fileRule
      ? ''
      : ended
        ? view === 'done' && fileQuote
          ? heardLength
          : ''
        : shownRecording?.phase === 'ready' && fileQuote
          ? heardLength
          : limitsLine(fileRule);
  const failed = failedWords(job.data?.message);
  /** The folded input: what was given and how it was set, from the choices the phone holds (or only what it is, when it holds none). */
  const summary = folded ? (
    kind === 'podcast' ? (
      <RunSummary
        icon={podcast.source === 'link' ? 'Link' : 'Mic'}
        title={!choicesKnown ? SUMMARY_WORDS.podcastUnknown : podcast.source === 'link' ? SUMMARY_WORDS.podcastLink : SUMMARY_WORDS.podcastText}
        line={choicesKnown ? SUMMARY_WORDS.podcastLine(podcast.hosts, PODCAST_WORDS.duration[podcast.duration as 'short' | 'standard' | 'long'] ?? podcast.duration) : ''}
        onEdit={view === 'done' || view === 'failed' ? () => setEditFor(jobId) : undefined}
      />
    ) : (
      <RunSummary
        icon="FileText"
        title={SUMMARY_WORDS.bookTitle}
        line={SUMMARY_WORDS.bookLine(characters > 0 ? characters : (job.data?.characters ?? 0))}
        onEdit={view === 'done' || view === 'failed' ? () => setEditFor(jobId) : undefined}
      />
    )
  ) : null;
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
        <Button label={TOOL_WORDS.run} full loading={check.checking || starting} disabled={kind === 'file' ? !fileReady : !inputsReady} onPress={run} testID="tool-run" />
      </View>
    ) : view === 'failed' ? (
      <Button label={TOOL_WORDS.tryAgain} full loading={check.checking || starting} onPress={kind === 'file' ? () => void choose() : inputsReady ? run : fillMissing} testID="tool-try-again" />
    ) : view === 'unsent' ? (
      <Button label={TOOL_WORDS.tryAgain} full loading={starting} onPress={() => pending.current && void send(pending.current)} testID="tool-resend" />
    ) : undefined;

  return (
    <PointsFrame title={tool.name} subtitle={`Points: ${formatPointsCount(balance)}`} onBack={onBack} gap={BODY_GAP} foot={foot} scrollTopKey={folded} testID="tool-screen">
      {kind === 'file' && fileRule ? (
        <View style={styles.boxGroup}>
          <RecordingBox
            recording={shownRecording}
            onChoose={() => void choose()}
            enabled={typing && !starting && !check.checking}
            settled={view === 'done'}
            words={FILE_STEP_WORDS[tool.id]}
          />
          {shownRecording?.phase === 'uploading' ? <CancelUpload onCancel={cancelUpload} /> : null}
          <View style={styles.meta}>
            <Text variant="body" tone="textMuted" testID="tool-length" style={[styles.metaText, styles.metaWide]}>
              {fileMetaLine}
            </Text>
          </View>
        </View>
      ) : talking ? null : kind === 'dialogue' ? (
        <SceneLines
          lines={lines}
          voices={tool.voices}
          characters={sceneChars}
          max={tool.input.maxCharacters}
          editable={typing}
          onWrite={writeScene}
          onVoice={pickSceneVoice}
          onAdd={addSceneLine}
          onRemove={removeSceneLine}
          note={sceneNote}
        />
      ) : folded ? (
        summary
      ) : kind === 'podcast' && pod ? (
        <PodcastInputs
          podcast={pod}
          voices={tool.voices}
          choice={podcast}
          maxCharacters={tool.input.maxCharacters}
          characters={podcastChars}
          linkProblem={linkIssue}
          voiceProblem={hostIssue}
          editable={typing}
          onChange={changePodcast}
        />
      ) : (
        <View style={styles.boxGroup}>
          <WordsBox
            value={text}
            onChange={edit}
            editable={typing}
            tall={view === 'input' || reopened}
            big={tool.id === 'audiobook'}
            max={tool.input.maxCharacters}
            placeholder={describes ? tool.description || MEDIA_WORDS.placeholder : tool.id === 'audiobook' ? BOOK_WORDS.placeholder : TOOL_WORDS.placeholder}
            label={describes ? TOOL_WORDS.promptBoxLabel : tool.id === 'audiobook' ? BOOK_WORDS.boxLabel : TOOL_WORDS.boxLabel}
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
      {view === 'input' && tool.id === 'audiobook' ? (
        <View style={styles.boxGroup}>
          <Button testID="tool-text-file" label={BOOK_WORDS.chooseFile} variant="secondary" icon="FileText" full disabled={starting || check.checking} onPress={() => void chooseTextFile()} />
          {bookFile ? (
            <Text variant="body" tone="textMuted" testID="tool-text-file-name" style={styles.metaText}>
              {bookFile}
            </Text>
          ) : null}
        </View>
      ) : null}
      {view === 'input' && kind === 'file' && fileRule?.voice === true && fileRule.only === 'audio' ? (
        <RecordSection
          enabled={typing && !starting && !check.checking && recording?.phase !== 'uploading' && recording?.phase !== 'checking'}
          maxSeconds={longestSeconds(fileRule)}
          onFile={(file) => {
            const turn = ++choosing.current;
            void takeFile(file, turn);
          }}
        />
      ) : null}
      {view === 'input' && tool.id === 'video-music' && fileRule?.description ? (
        <View style={styles.boxGroup}>
          <WordsBox
            value={mood}
            onChange={(next) => setMood(clampText(next, fileRule.description?.maxCharacters ?? 0))}
            editable={typing}
            tall={false}
            compact
            max={fileRule.description.maxCharacters}
            placeholder={MUSIC_WORDS.moodPlaceholder}
            label={MUSIC_WORDS.moodBoxLabel}
            testID="tool-mood"
          />
          <View style={styles.meta}>
            <Text variant="body" tone="textMuted" testID="tool-mood-count" style={[styles.metaText, styles.metaWide, { textAlign: 'right' }]}>
              {countLine(charactersOf(mood), fileRule.description.maxCharacters)}
            </Text>
          </View>
        </View>
      ) : null}
      {view === 'input' && tool.id === 'stems' && (fileRule?.parts?.length ?? 0) > 0 ? <PartsRow parts={fileRule?.parts ?? []} value={parts} onChange={setParts} /> : null}
      {view === 'input' && fileRefusal ? <Banner tone="danger" icon="CircleX" title={fileRefusal.title} body={fileRefusal.body} testID="tool-file-refused" /> : null}
      {view === 'input' && refusal ? <Banner tone="danger" icon="CircleX" title={TOOL_WORDS.refusedTitle} body={refusal} testID="tool-refused" /> : null}
      {(view === 'input' || view === 'failed') && (kind === 'image' || kind === 'video') ? (
        <>
          {shapesOf(tool).length > 0 && !talking ? <ShapeRow shapes={shapesOf(tool)} value={shape} onChange={setShape} /> : null}
          {kind === 'video' && !talking && lengths.length > 0 ? <LengthRow lengths={lengths} value={seconds} onChange={setSeconds} /> : null}
          {media.photoRule ? (
            <PhotoRow
              rule={media.photoRule}
              optional={media.photoRule.use === 'optional'}
              photo={media.photo}
              refused={media.photoRefused}
              cameraOff={media.cameraOff}
              enabled={!starting && !check.checking}
              onChoose={(from) => {
                startOver();
                void media.choosePhoto(from);
              }}
              onRemove={media.takeOffPhoto}
            />
          ) : null}
          {talking && media.speechRule ? (
            <SpeechRow
              owner={owner}
              accepts={media.speechRule.accepts}
              voice={media.voice}
              seconds={media.speech?.speech.seconds ?? null}
              refused={media.voiceRefused}
              picking={voicePicking}
              enabled={!starting && !check.checking}
              onChoosePicking={setVoicePicking}
              onChooseFile={() => {
                startOver();
                setVoicePicking(false);
                void media.chooseRecording();
              }}
              onUseResult={(id, label) => {
                startOver();
                setVoicePicking(false);
                void media.useResult(id, label);
              }}
              onClear={media.clearVoice}
            />
          ) : null}
        </>
      ) : null}
      {view === 'input' && takesVoice ? (
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
      {view === 'working' ? <Working title={workingTitleFor(tool)} body={dubbing ? DUB_WORDS.workingBody : kind === 'video' ? MEDIA_WORDS.workingLong : tool.id === 'audiobook' || kind === 'podcast' ? PODCAST_WORDS.workingBody : TOOL_WORDS.workingBody} /> : null}
      {view === 'done' && job.data && hasResult(job.data) ? (
        <View style={styles.done}>
          {doneMedia ? (
            <ResultMedia file={doneMedia} name={thingOf(tool)} />
          ) : tool.id === 'stems' && audioParts.length > 0 ? (
            <PartsList job={job.data} parts={audioParts} creator={creator} handlers={pieceHandlers} />
          ) : audioUri ? (
            <ResultPlayer testID="tool-player" uri={audioUri} name={tool.name} />
          ) : (
            <TranscriptCard text={outputText(job.data, 'text') ?? ''} onShare={canShare && outputText(job.data, 'subtitles') ? () => shareFile(outputText(job.data as VoiceJob, 'subtitles') ?? '') : undefined} />
          )}
          {tool.id === 'video-music' && audioUri ? (
            <Text variant="body" tone="textMuted" testID="tool-music-separate" style={{ fontSize: DONE.line, lineHeight: canvasNormalLineHeight(DONE.line) }}>
              {MUSIC_WORDS.separate}
            </Text>
          ) : null}
          {dubbing && subtitleCues.length > 0 ? <SubtitlesCard cues={subtitleCues} onShare={canShare ? () => shareFile(outputText(job.data as VoiceJob, 'subtitles') ?? '', 'vtt') : undefined} /> : null}
          {original && tool.id === 'photo-edit' ? (
            <View style={styles.usedRow} testID="tool-original">
              <Image source={{ uri: original }} contentFit="cover" style={styles.original} accessibilityLabel={MEDIA_WORDS.original} accessibilityIgnoresInvertColors />
              <Text variant="body" tone="textMuted" style={{ fontSize: DONE.line, lineHeight: canvasNormalLineHeight(DONE.line) }}>
                {MEDIA_WORDS.original}
              </Text>
            </View>
          ) : null}
          {job.data.audioUrl && picking ? (
            <DraftPicker
              jobId={job.data.id}
              onCancel={() => setPicking(false)}
              onAttached={(title) => {
                setPicking(false);
                setGoodNotice(EXTRAS_WORDS.attached(title));
              }}
              onStartDraft={() => router.push('/shop')}
            />
          ) : (
            <DoneCard
              owner={owner}
              job={job.data}
              toolName={thingOf(tool)}
              creator={creator}
              onUse={job.data.audioUrl ? () => setPicking(true) : undefined}
              hidePiece={tool.id === 'stems' && audioParts.length > 0}
              {...pieceHandlers}
              onNotice={(words, good) => (good ? setGoodNotice(words) : setNotice(words))}
            />
          )}
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
      {placesSheet ? <ProductsFullHost onClose={() => setPlacesSheet(false)} /> : null}
      {notice ? <Toast message={notice} tone="alert" placement="top" lines={2} onHide={() => setNotice(null)} testID="tool-notice" /> : null}
      {goodNotice ? <Toast message={goodNotice} tone="success" placement="top" lines={2} onHide={() => setGoodNotice(null)} testID="tool-notice-ok" /> : null}
    </PointsFrame>
  );
}

/** The words to speak, or the description of a sound or track: a multi-line box on the input colour; the ring is the accent while typing. */
function WordsBox({
  value,
  onChange,
  editable,
  tall,
  big = false,
  compact = false,
  max,
  placeholder,
  label,
  testID = 'tool-text',
}: {
  value: string;
  onChange: (next: string) => void;
  editable: boolean;
  tall: boolean;
  /** The Audiobook's box is the largest: a book is pasted in whole (POINTS-18). */
  big?: boolean;
  /** Music for a video's mood is a short optional line (POINTS-17). */
  compact?: boolean;
  max: number;
  placeholder: string;
  label: string;
  testID?: string;
}) {
  const { colors } = useWawu();
  // The box grows with the words (a browser's text area would scroll inside a fixed height).
  const [grown, setGrown] = useState(0);
  const ring = tall ? { width: BOX.ringOn, color: colors.accent } : { width: BOX.ringOff, color: colors.borderHairline };
  return (
    <View
      style={[
        styles.box,
        { minHeight: big ? (tall ? BOX.big : BOX.tall) : compact ? BOX.compact : tall ? BOX.tall : BOX.short, backgroundColor: colors.surfaceInput, boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: ring.width, color: ring.color, inset: true }] },
      ]}
    >
      <TextInput
        testID={testID}
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

/** The body the tool's job route takes, from the intent kept on the phone: the same intent gives the same request on every resend. */
function requestOf(intent: JobIntent, kind: InputKind, talking: boolean): JobRequest {
  if (intent.lines) return { kind: 'dialogue', lines: intent.lines };
  if (intent.podcast) return { kind: 'podcast', ...intent.podcast };
  if (intent.fileKey) {
    return {
      kind: 'file',
      fileKey: intent.fileKey,
      ...(intent.targetLanguage ? { targetLanguage: intent.targetLanguage } : {}),
      ...(intent.voiceId ? { voiceId: intent.voiceId } : {}),
      ...(intent.parts ? { parts: intent.parts } : {}),
      ...(intent.description ? { description: intent.description } : {}),
    };
  }
  const m = intent.media ?? {};
  if (kind === 'image') return { kind: 'image', prompt: intent.text, ...(m.shape ? { shape: m.shape } : {}), ...(m.photoKey ? { photoKey: m.photoKey } : {}) };
  if (kind === 'video') {
    if (talking) return { kind: 'talking', photoKey: m.photoKey ?? '', ...(m.audioKey ? { audioKey: m.audioKey } : {}), ...(m.sourceJobId ? { sourceJobId: m.sourceJobId } : {}) };
    return { kind: 'video', prompt: intent.text, ...(m.shape ? { shape: m.shape } : {}), seconds: m.seconds ?? intent.units, ...(m.photoKey ? { photoKey: m.photoKey } : {}) };
  }
  if (kind === 'prompt') return { kind: 'prompt', prompt: intent.text };
  return { kind: 'text', text: intent.text, voiceId: intent.voiceId };
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
  done: { gap: DONE.parts },
  usedRow: { flexDirection: 'row', alignItems: 'center', gap: DONE.markGap },
  original: { width: 44, height: 44, borderRadius: radius.chip },
  foot: { gap: DONE.footGap },
  costRow: { flexDirection: 'row', alignItems: 'center', gap: DONE.costGap },
  costText: { flex: 1 },
  loading: { gap: BODY_GAP },
});
