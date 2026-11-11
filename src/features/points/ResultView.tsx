import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { Banner } from '@/components/Banner';
import { GroupedList } from '@/components/Card';
import { useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { ListRow } from '@/components/ListRow';
import { Text } from '@/components/Text';
import { canvasNormalLineHeight, font, layout, radius, space, useWawu } from '@/theme';
import { newRequestKey } from '@/features/wallet/api/settings';

import { makePiece, type AiPiece } from './mediaToolApi';
import { MEDIA_WORDS, RESULT_WORDS } from './mediaToolModel';
import { heldPiece, rememberPiece } from './pieceFlow';
import { downloadResult, type DownloadOutcome } from './resultDownload';
import { fetchVoiceJob, resultFiles, type ResultFile, type VoiceJob } from './voiceoverApi';
import { ResultActions } from './VoiceExtras';

/** The picture and the clip fill the width, 12 above the card; the piece row is the largest part of the card, 76 high with a 48 mark; the Download link is 13 muted. */
const LOOK = { mediaRadius: radius.card, piece: 76, pieceMark: 48, pieceTitle: 17, pieceLine: 13.5, link: 13, thumb: 56, viewerClose: 44 } as const;

/** A finished picture or video, in the result frame. A picture opens larger on a tap and closes with Back; a clip plays with the player's own controls. */
export function ResultMedia({ file, name }: { file: ResultFile; name: string }) {
  return file.output.kind === 'video' ? <ResultVideo uri={file.output.url} name={name} /> : <ResultPicture uri={file.output.url} name={name} />;
}

function ResultPicture({ uri, name }: { uri: string; name: string }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable
        testID="result-picture"
        accessibilityRole="imagebutton"
        accessibilityLabel={`Your ${name}. ${MEDIA_WORDS.viewLarger}`}
        onPress={() => setOpen(true)}
        {...ring.handlers}
        style={[styles.frame, { backgroundColor: colors.surfaceSunken }, ring.style]}
      >
        <Image source={{ uri }} contentFit="cover" style={styles.fill} accessibilityIgnoresInvertColors />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View testID="result-picture-large" style={[styles.viewer, { backgroundColor: colors.surfacePage }]}>
          <Image source={{ uri }} contentFit="contain" style={styles.fill} accessibilityIgnoresInvertColors />
          <Pressable testID="result-picture-close" accessibilityRole="button" accessibilityLabel={MEDIA_WORDS.closeLarger} onPress={() => setOpen(false)} hitSlop={space.md} style={[styles.close, { backgroundColor: colors.surfaceCard }]}>
            <Icon name="X" size={20} color={colors.textPrimary} />
          </Pressable>
        </View>
      </Modal>
    </>
  );
}

/** The clip, in the player's own controls (play, pause, scrub, full screen): a phone's and the browser's. */
function ResultVideo({ uri, name }: { uri: string; name: string }) {
  const { colors } = useWawu();
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
    p.staysActiveInBackground = false;
    p.showNowPlayingNotification = false;
  });
  return (
    <View testID="result-video" accessibilityLabel={MEDIA_WORDS.playVideo(name)} style={[styles.frame, styles.videoFrame, { backgroundColor: colors.surfaceSunken }]}>
      <VideoView testID="result-video-view" player={player} nativeControls fullscreenOptions={{ enable: true }} allowsPictureInPicture={false} contentFit="contain" style={styles.fill} />
    </View>
  );
}

export type DoneCardProps = {
  owner: string | null;
  job: VoiceJob;
  toolName: string;
  /** Creator accounts only (R-38): Create is for them. Everyone else keeps Save and Download. */
  creator: boolean;
  /** "Use in a product": audio results only, since drafts take audio. */
  onUse?: () => void;
  /** The result opened in Create: set the draft and push the preview step. Gets the piece and the picture's address. */
  onPiece: (piece: AiPiece, previewUri?: string) => void;
  /** The draft already holds this result's file (the person came back from Create): open its preview step again. */
  onReopen: () => void;
  /** Create needs a tier (402 tier_required) or has every place used (product_limit_reached): the screen decides where that leads. */
  onNeedTier: () => void;
  onProductsFull: () => void;
  /** The share sheet's or the photos' notice, in words. */
  onNotice: (words: string, good: boolean) => void;
  /** Split a song (POINTS-17): each part has its own "Make it a piece" in the parts list, so the card draws none of its own. */
  hidePiece?: boolean;
};

/**
 * POINTS-13 · The card under every finished result: "Make it a piece" first and largest (creators only, and only for a result a Create
 * format takes), then Save, then "Use in a product" (audio), then a small quiet "Download" under the card.
 */
export function DoneCard({ owner, job, toolName, creator, onUse, onPiece, onReopen, onNeedTier, onProductsFull, onNotice, hidePiece = false }: DoneCardProps) {
  const files = resultFiles(job);
  const pieceable = files.filter((f) => f.output.pieceFormat);
  const downloadable = files.filter((f) => f.output.downloadUrl);
  const [choosing, setChoosing] = useState<'piece' | 'download' | null>(null);
  return (
    <View style={styles.card} testID="result-card">
      {creator && pieceable.length > 0 && !hidePiece ? (
        <PieceRow job={job} options={pieceable} choosing={choosing === 'piece'} onChoose={(on) => setChoosing(on ? 'piece' : null)} onPiece={onPiece} onReopen={onReopen} onNeedTier={onNeedTier} onProductsFull={onProductsFull} />
      ) : null}
      <ResultActions owner={owner} job={job} onUse={onUse} />
      {downloadable.length > 0 ? (
        <DownloadLink job={job} toolName={toolName} options={downloadable} choosing={choosing === 'download'} onChoose={(on) => setChoosing(on ? 'download' : null)} onNotice={onNotice} />
      ) : null}
    </View>
  );
}

export type PieceMakerHandlers = { onPiece: DoneCardProps['onPiece']; onReopen: () => void; onNeedTier: () => void; onProductsFull: () => void };

/**
 * "Make it a piece" for one result file (POINTS-13), shared by the card's piece row and the stems' parts list (POINTS-17: each part its
 * own button): the Hub copies the output into the person's own folder and Create opens with it; the same key goes again on a try that did
 * not finish, a new one after a refusal; a result already in the draft just opens it again.
 */
export function usePieceMaker(job: Pick<VoiceJob, 'id'>, handlers: PieceMakerHandlers) {
  const { onPiece, onReopen, onNeedTier, onProductsFull } = handlers;
  const [busy, setBusy] = useState<number | null>(null);
  const [failure, setFailure] = useState<{ index: number; words: string } | null>(null);
  const sending = useRef(false);
  /** The key of a try that did not finish: the same key goes again. A try that finished (or was refused) takes a new one. */
  const key = useRef<{ index: number; value: string } | null>(null);
  const make = async (file: ResultFile, before?: () => void) => {
    if (sending.current) return;
    before?.();
    setFailure(null);
    if (heldPiece(job.id, file.index)) {
      onReopen();
      return;
    }
    sending.current = true;
    setBusy(file.index);
    const sentKey = key.current?.index === file.index ? key.current.value : newRequestKey();
    key.current = { index: file.index, value: sentKey };
    try {
      const piece = await makePiece(job.id, file.index, sentKey);
      key.current = null;
      rememberPiece(job.id, file.index, piece.full.key);
      onPiece(piece, file.output.url);
    } catch (error) {
      if (isApiError(error) && error.code === 'tier_required') {
        key.current = null;
        onNeedTier();
      } else if (isApiError(error) && error.code === 'product_limit_reached') {
        key.current = null;
        onProductsFull();
      } else {
        // The Hub's own sentence (no room is "This file needs 3 MB, but only 1 MB of your 1 GB storage is free."); a refusal frees the key.
        if (isApiError(error) && error.status >= 400 && error.status < 500) key.current = null;
        setFailure({ index: file.index, words: isApiError(error) && error.message ? error.message : RESULT_WORDS.pieceFailed });
      }
    } finally {
      sending.current = false;
      setBusy(null);
    }
  };
  return { make, busy, failure };
}

function PieceRow({
  job,
  options,
  choosing,
  onChoose,
  onPiece,
  onReopen,
  onNeedTier,
  onProductsFull,
}: {
  job: VoiceJob;
  options: ResultFile[];
  choosing: boolean;
  onChoose: (on: boolean) => void;
  onPiece: DoneCardProps['onPiece'];
  onReopen: () => void;
  onNeedTier: () => void;
  onProductsFull: () => void;
}) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const maker = usePieceMaker(job, { onPiece, onReopen, onNeedTier, onProductsFull });
  const busy = maker.busy !== null;
  const failure = maker.failure?.words ?? null;
  const format = options[0].output.pieceFormat as string;
  const make = (file: ResultFile) => maker.make(file, () => onChoose(false));
  const press = () => {
    if (busy) return;
    if (options.length > 1) onChoose(!choosing);
    else void make(options[0]);
  };
  return (
    <View style={styles.pieceBlock}>
      <Pressable
        testID="result-piece"
        accessibilityRole="button"
        accessibilityLabel={`${RESULT_WORDS.pieceTitle}. ${RESULT_WORDS.pieceLine(format)}`}
        accessibilityState={{ busy }}
        onPress={press}
        {...ring.handlers}
        style={({ pressed }) => [styles.piece, { backgroundColor: colors.accent, opacity: pressed ? 0.9 : 1 }, ring.style]}
      >
        <View style={[styles.pieceMark, { backgroundColor: colors.textOnAccent }]}>
          <Icon name={busy ? 'Loader' : 'Plus'} size={24} color={colors.accent} strokeWidth={2.4} />
        </View>
        <View style={styles.pieceText}>
          <Text variant="body" style={[font(700), { color: colors.textOnAccent, fontSize: LOOK.pieceTitle, lineHeight: canvasNormalLineHeight(LOOK.pieceTitle) }]}>
            {busy ? RESULT_WORDS.pieceWorking : RESULT_WORDS.pieceTitle}
          </Text>
          <Text variant="body" style={{ color: colors.textOnAccent, fontSize: LOOK.pieceLine, lineHeight: canvasNormalLineHeight(LOOK.pieceLine) }}>
            {RESULT_WORDS.pieceLine(format)}
          </Text>
        </View>
        <Icon name="ChevronRight" size={20} color={colors.textOnAccent} />
      </Pressable>
      {choosing ? <OutputPicker title={RESULT_WORDS.piecePickTitle} options={options} onPick={(f) => void make(f)} testID="piece-picker" /> : null}
      {failure ? <Banner tone="danger" icon="CircleX" title={RESULT_WORDS.pieceFailedTitle} body={failure} testID="piece-failure" /> : null}
    </View>
  );
}

/** A result with several files (stems) asks which one first, in the existing list pattern. */
function OutputPicker({ title, options, onPick, testID }: { title: string; options: ResultFile[]; onPick: (file: ResultFile) => void; testID: string }) {
  return (
    <View testID={testID} style={styles.picker}>
      <Text variant="body" tone="textMuted" accessibilityRole="header" style={[font(700), styles.pickerLabel]}>
        {title}
      </Text>
      <GroupedList>
        {options.map((f) => (
          <ListRow key={f.index} testID={`${testID}-${f.index}`} title={f.output.name ?? `File ${f.index + 1}`} onPress={() => onPick(f)} />
        ))}
      </GroupedList>
    </View>
  );
}

function DownloadLink({
  job,
  toolName,
  options,
  choosing,
  onChoose,
  onNotice,
}: {
  job: VoiceJob;
  toolName: string;
  options: ResultFile[];
  choosing: boolean;
  onChoose: (on: boolean) => void;
  onNotice: DoneCardProps['onNotice'];
}) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const [share, setShare] = useState<number | null | undefined>(undefined);
  const [failure, setFailure] = useState<{ title: string; body: string } | null>(null);
  const stop = useRef<AbortController | null>(null);
  const working = share !== undefined;
  useEffect(() => () => stop.current?.abort(), []);

  const run = async (file: ResultFile) => {
    if (stop.current) return;
    const controller = new AbortController();
    stop.current = controller;
    setFailure(null);
    onChoose(false);
    setShare(null);
    const saving = (url: string) => downloadResult({ url, name: file.output.name ? fileName(file) : 'result', contentType: file.output.contentType ?? 'application/octet-stream' }, { signal: controller.signal, onProgress: setShare });
    const finish = (outcome: DownloadOutcome) => {
      if (outcome === 'denied') setFailure({ title: RESULT_WORDS.photosOffTitle, body: RESULT_WORDS.photosOff });
      else if (outcome === 'saved') onNotice(RESULT_WORDS.savedToPhotos, true);
      else if (outcome === 'started') onNotice(RESULT_WORDS.started, true);
    };
    try {
      try {
        finish(await saving(file.output.downloadUrl as string));
      } catch (first) {
        if (controller.signal.aborted) throw first;
        // The link may have expired: a fresh read of the job gives a fresh one, and the download is tried once more.
        const fresh = resultFiles(await fetchVoiceJob(job.id)).find((f) => f.index === file.index);
        if (!fresh?.output.downloadUrl) throw first;
        finish(await saving(fresh.output.downloadUrl));
      }
    } catch {
      if (!controller.signal.aborted) setFailure({ title: RESULT_WORDS.downloadFailedTitle, body: RESULT_WORDS.downloadFailed });
    } finally {
      stop.current = null;
      setShare(undefined);
    }
  };
  const press = () => {
    if (working) return;
    if (options.length > 1) onChoose(!choosing);
    else void run(options[0]);
  };
  return (
    <View style={styles.downloadBlock}>
      {working ? (
        <View style={styles.downloadRow} testID="result-downloading">
          <Text variant="body" tone="textMuted" accessibilityLiveRegion="polite" style={{ fontSize: LOOK.link, lineHeight: canvasNormalLineHeight(LOOK.link) }}>
            {RESULT_WORDS.downloading(share ?? null)}
          </Text>
          <Pressable testID="result-download-cancel" accessibilityRole="button" accessibilityLabel={RESULT_WORDS.cancel} onPress={() => stop.current?.abort()} hitSlop={space.md}>
            <Text variant="body" tone="textMuted" style={[font(600), styles.underline, { fontSize: LOOK.link, lineHeight: canvasNormalLineHeight(LOOK.link) }]}>
              {RESULT_WORDS.cancel}
            </Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          testID="result-download"
          accessibilityRole="button"
          accessibilityLabel={RESULT_WORDS.downloadLabel(toolName)}
          onPress={press}
          hitSlop={{ top: space.md, bottom: space.md, left: space.lg, right: space.lg }}
          {...ring.handlers}
          style={[styles.downloadLink, ring.style]}
        >
          <Text variant="body" style={[font(500), styles.underline, { color: colors.textMuted, fontSize: LOOK.link, lineHeight: canvasNormalLineHeight(LOOK.link) }]}>
            {RESULT_WORDS.download}
          </Text>
        </Pressable>
      )}
      {choosing ? <OutputPicker title={RESULT_WORDS.downloadPick} options={options} onPick={(f) => void run(f)} testID="download-picker" /> : null}
      {failure ? <Banner tone="danger" icon="CircleX" title={failure.title} body={failure.body} testID="download-failure" /> : null}
    </View>
  );
}

/** The file's name on the phone: the Hub's attachment name sits in the link; the output's own label with the right ending is the fallback. */
function fileName(file: ResultFile): string {
  const fromLink = /filename\*?=(?:UTF-8'')?"?([^";&]+)/i.exec(decodeURIComponent(file.output.downloadUrl ?? ''))?.[1];
  if (fromLink) return fromLink;
  const ext = (file.output.contentType ?? '').split('/')[1]?.replace('mpeg', 'mp3').replace('jpeg', 'jpg') ?? 'bin';
  return `${(file.output.name ?? 'result').toLowerCase().replace(/\s+/g, '-')}.${ext}`;
}

const styles = StyleSheet.create({
  frame: { width: '100%', aspectRatio: 1, borderRadius: LOOK.mediaRadius, overflow: 'hidden' },
  videoFrame: { aspectRatio: 16 / 9 },
  fill: { width: '100%', height: '100%' },
  viewer: { flex: 1, justifyContent: 'center' },
  close: { position: 'absolute', top: space.xl, right: space.lg, width: LOOK.viewerClose, height: LOOK.viewerClose, borderRadius: LOOK.viewerClose / 2, alignItems: 'center', justifyContent: 'center' },
  card: { gap: space.md },
  pieceBlock: { gap: space.md },
  piece: { minHeight: LOOK.piece, flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.md, borderRadius: radius.card },
  pieceMark: { width: LOOK.pieceMark, height: LOOK.pieceMark, borderRadius: LOOK.pieceMark / 2, alignItems: 'center', justifyContent: 'center' },
  pieceText: { flex: 1, minWidth: 0 },
  picker: { gap: space.sm },
  pickerLabel: { fontSize: 11, letterSpacing: 0.88, textTransform: 'uppercase' },
  downloadBlock: { gap: space.md },
  downloadLink: { alignSelf: 'center', minHeight: layout.tapMin / 2, justifyContent: 'center' },
  downloadRow: { flexDirection: 'row', alignSelf: 'center', alignItems: 'center', gap: space.md },
  underline: { textDecorationLine: 'underline' },
});
