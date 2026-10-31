import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ApiError } from '@/api/errors';
import { isApiError } from '@/api/client';
import { Button } from '@/components/Button';
import { useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { IconTile } from '@/components/IconTile';
import { Skeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { font, space, useWawu } from '@/theme';

import { fetchFormats, formatsKey } from './api';
import { refusalFor, type ChosenFile } from './chosen';
import { CreateFrame } from './CreateFrame';
import { CoverChoice } from './CoverChoice';
import { setPreview, useCover, useDraft, type UploadedFile } from './draft';
import { formatBytes, iconOf, labelOf, previewHint, type FormatId, type PreviewRule } from './model';
import { frameFor } from './frames';
import { FileRow, Stepper, useFirstTap } from './parts';
import { pagesOf } from './pdfPages';
import { canPickFile, pickFile } from './pickFile';
import { listingStill, type StillSource } from './still';
import { UPLOAD_CANCELLED, uploadFile } from './upload';

/** me.js `previewStep`: the title at 20, 6 above its line; three 3:4 tiles 8 apart with 10 corners; the third frosted (8 blur, black at 0.3) with an 18 lock. */
const lookMetrics = { title: 20, titleGap: 6, tileGap: 8, tileCorner: 10, ratio: 3 / 4, frost: 8, lock: 18, kindIcon: 28, labelGap: 10 } as const;
const dropMetrics = { height: 120, corner: 24, ring: 1.5, icon: 44, between: space.sm } as const;

type Stage = { state: 'idle' } | { state: 'uploading'; file: ChosenFile; share: number } | { state: 'failed'; file: ChosenFile | null; share: number; message: string; retry: boolean };

const retryable = (error: unknown): boolean => !isApiError(error) || error.status === 0 || error.status >= 500 || error.code === 'upload_failed';

/** `12 pages · public`, or what the file weighs when it does not say how many pages it has. */
export function previewMeta(file: UploadedFile): string {
  const size = file.pages ? `${file.pages} ${file.pages === 1 ? 'page' : 'pages'}` : formatBytes(file.bytes);
  return `${size} · public`;
}

export type PreviewScreenProps = {
  format: FormatId;
  onBack: () => void;
  /** Opens the details step (M23). Left out until that step is built (R-47): the screen then draws no Continue. */
  onContinue?: () => void;
};

/**
 * M22 · Add a preview: the separate public file buyers see before they pay, never pages of the full one. What it may be
 * (types, size) is the Hub's rule for the format. The three tiles show how it will sit beside a locked one.
 */
export function PreviewScreen({ format, onBack, onContinue }: PreviewScreenProps) {
  const formats = useQuery({ queryKey: formatsKey, queryFn: fetchFormats });
  const { preview } = useDraft();
  const rule: PreviewRule | undefined = formats.data?.find((r) => r.id === format)?.preview;
  const [stage, setStage] = useState<Stage>({ state: 'idle' });
  const abort = useRef<AbortController | null>(null);
  const firstTap = useFirstTap();

  useEffect(() => () => abort.current?.abort(), []);

  const send = async (file: ChosenFile) => {
    if (!rule) return;
    const refusal = refusalFor(file, rule);
    if (refusal) {
      // A file that is refused is never uploaded, so nothing else lets go of the phone's copy of it.
      file.discard?.();
      setPreview(null);
      setStage({ state: 'failed', file, share: 0, message: refusal, retry: false });
      return;
    }
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    setPreview(null);
    setStage({ state: 'uploading', file, share: 0 });
    try {
      const pages = file.contentType === 'application/pdf' ? await pagesOf(file.blob) : null;
      // A video is drawn as a frame of itself. It is read before the upload, because the phone's own copy of the file goes once the
      // upload has settled; a file with no readable frame gives null (never an error, never a long wait) and keeps the icon.
      const frame = await frameFor(file);
      if (controller.signal.aborted) {
        // The person left (Back, or another pick) before the upload began, so `uploadFile` will never settle for this file: its copy on the phone goes now.
        file.discard?.();
        return;
      }
      const uploaded = await uploadFile(file, { folder: 'content/preview', format }, (share) => setStage((s) => (s.state === 'uploading' ? { ...s, share } : s)), controller.signal);
      if (controller.signal.aborted) return;
      setPreview({ ...uploaded, ...(pages ? { pages } : {}), ...(frame ? { frame } : {}) });
      setStage({ state: 'idle' });
    } catch (error) {
      if (error instanceof ApiError && error.code === UPLOAD_CANCELLED) return;
      setStage((s) => ({
        state: 'failed',
        file,
        share: s.state === 'uploading' ? s.share : 0,
        message: isApiError(error) ? error.message : 'That file did not upload. Try again.',
        retry: retryable(error),
      }));
    }
  };

  const choose = async () => {
    if (!rule || stage.state === 'uploading' || !firstTap()) return;
    try {
      const file = await pickFile(rule.contentTypes);
      if (file) await send(file);
    } catch {
      setStage({ state: 'failed', file: null, share: 0, message: "We couldn't open your files. Try again.", retry: false });
    }
  };

  const leave = () => {
    abort.current?.abort();
    onBack();
  };
  const foot = onContinue ? <Button testID="create-continue" label="Continue" full disabled={!preview || stage.state === 'uploading'} onPress={onContinue} /> : undefined;

  return (
    <CreateFrame testID="preview-screen" title={`New ${labelOf(format)}`} subtitle="Step 3 of 5" onLeave={leave} foot={foot}>
      <Stepper active={1} />
      <View style={styles.heading}>
        <Text variant="h2" style={styles.title}>
          Add a preview
        </Text>
        <Text variant="muted">{previewHint(rule)}</Text>
      </View>
      {formats.isError && !rule ? (
        <ErrorState
          testID="preview-error"
          title="Couldn't load the upload rules"
          message={isApiError(formats.error) ? formats.error.message : 'Check your connection and try again.'}
          onRetry={() => void formats.refetch()}
        />
      ) : !rule ? (
        <Skeleton testID="preview-loading" height={dropMetrics.height} radius={dropMetrics.corner} />
      ) : stage.state === 'uploading' ? (
        <FileRow testID="preview-file" icon="FileText" name={stage.file.name} progress={stage.share} />
      ) : preview ? (
        <>
          <FileRow
            testID="preview-file"
            icon="FileCheck2"
            tone="in"
            name={preview.name}
            meta={previewMeta(preview)}
            onRemove={() => {
              setPreview(null);
              setStage({ state: 'idle' });
            }}
            removeLabel="Remove the preview"
          />
          <HowItLooks format={format} file={preview} />
          <CoverChoice preview={preview} />
        </>
      ) : (
        <DropBox disabled={!canPickFile} onPress={() => void choose()} />
      )}
      {stage.state === 'failed' ? (
        <View style={styles.failure}>
          <Text variant="errorLine" tone="danger" accessibilityRole="alert" testID="preview-failure">
            {stage.message}
          </Text>
          {stage.retry && stage.file ? <Button testID="preview-retry" label="Try again" variant="secondary" size="sm" onPress={() => stage.file && void send(stage.file)} /> : null}
        </View>
      ) : null}
    </CreateFrame>
  );
}

function DropBox({ disabled, onPress }: { disabled: boolean; onPress: () => void }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID="preview-drop"
      accessibilityRole="button"
      accessibilityLabel="Add a preview file"
      disabled={disabled}
      onPress={onPress}
      {...ring.handlers}
      style={[
        styles.drop,
        { backgroundColor: colors.surfaceCard, boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: dropMetrics.ring, color: colors.borderStrong, inset: true }] },
        ring.style,
      ]}
    >
      <IconTile icon="FileUp" tone="accent" size={dropMetrics.icon} />
      <Text variant="body" style={font(600)}>
        Choose the preview file
      </Text>
    </Pressable>
  );
}

/** "How it will look": the preview twice, then once more behind a lock, as a buyer meets it before paying. */
function HowItLooks({ format, file }: { format: FormatId; file: UploadedFile }) {
  // The tiles draw what the listing will carry: the cover the person picked, else the preview's own frame or picture (R-114).
  const picture = listingStill(file, useCover());
  return (
    <View style={styles.look} testID="preview-look">
      <Text variant="label">How it will look</Text>
      <View style={styles.tiles}>
        <LookTile format={format} picture={picture} />
        <LookTile format={format} picture={picture} />
        <LookTile format={format} picture={picture} locked />
      </View>
    </View>
  );
}

function LookTile({ format, picture, locked }: { format: FormatId; picture: StillSource | null; locked?: boolean }) {
  const { colors } = useWawu();
  const [broken, setBroken] = useState(false);
  const still = picture && !broken ? picture : null;
  return (
    <View testID={locked ? 'preview-tile-locked' : 'preview-tile'} style={[styles.tile, { backgroundColor: colors.surfaceSunken }]}>
      {still ? (
        <Image testID="preview-tile-image" source={still} contentFit="cover" blurRadius={locked ? lookMetrics.frost : 0} style={StyleSheet.absoluteFill} onError={() => setBroken(true)} />
      ) : locked ? null : (
        <View style={[StyleSheet.absoluteFill, styles.centre]}>
          <Icon name={iconOf(format)} size={lookMetrics.kindIcon} color={colors.textMuted} />
        </View>
      )}
      {locked ? (
        <View style={[StyleSheet.absoluteFill, styles.centre, { backgroundColor: colors.mediaBlack30 }]}>
          <Icon name="Lock" size={lookMetrics.lock} color={colors.textOnAccent} strokeWidth={2.2} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { gap: lookMetrics.titleGap },
  title: { fontSize: lookMetrics.title },
  drop: { height: dropMetrics.height, borderRadius: dropMetrics.corner, alignItems: 'center', justifyContent: 'center', gap: dropMetrics.between },
  failure: { gap: space.sm, alignItems: 'flex-start' },
  look: { gap: lookMetrics.labelGap },
  tiles: { flexDirection: 'row', gap: lookMetrics.tileGap },
  tile: { flex: 1, aspectRatio: lookMetrics.ratio, borderRadius: lookMetrics.tileCorner, overflow: 'hidden' },
  centre: { alignItems: 'center', justifyContent: 'center' },
});

