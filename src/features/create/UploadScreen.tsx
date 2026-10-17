import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ApiError } from '@/api/errors';
import { isApiError } from '@/api/client';
import { Button } from '@/components/Button';
import { useFocusRing } from '@/components/focusRing';
import { IconTile } from '@/components/IconTile';
import { Skeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { font, space, useWawu } from '@/theme';

import { allowanceKey, fetchAllowance, fetchFormats, formatsKey } from './api';
import { refusalFor, type ChosenFile } from './chosen';
import { CreateFrame } from './CreateFrame';
import { setFull, useDraft } from './draft';
import { formatBytes, labelOf, uploadTitle, type FormatId, type FormatRule } from './model';
import { FileRow, Stepper, useFirstTap } from './parts';
import { canPickFile, pickFile } from './pickFile';
import { UPLOAD_CANCELLED, uploadFile } from './upload';
import { SlotsFullNotice, slotsFull } from './UploadsMeter';

/** me.js `upload`: a 200 high drop box, 24 corner, a 1.5 strong ring; a 56 accent tile, a 16 semi-bold line, a 13 muted line, 10 between. */
const dropMetrics = { height: 200, corner: 24, ring: 1.5, icon: 56, between: 10, title: 16, hint: 13, pad: space.xl } as const;

type Stage = { state: 'idle' } | { state: 'uploading'; file: ChosenFile; share: number } | { state: 'done'; name: string } | { state: 'failed'; file: ChosenFile | null; message: string; retry: boolean };

/** A failed upload is worth asking again for when nothing about the file is wrong: no answer, a server fault, or the bytes themselves not landing. */
export const retryable = (error: unknown): boolean => !isApiError(error) || error.status === 0 || error.status >= 500 || error.code === 'upload_failed';

export type UploadScreenProps = { format: FormatId; onBack: () => void; onContinue: () => void; onOpenLibrary?: () => void };

/**
 * M21 · Upload the full file for the chosen format. The line under the heading and the limit on it come from the Hub's
 * rule for the format; the bar is the real share of the file that has gone up. Continue waits until it has all landed.
 */
export function UploadScreen({ format, onBack, onContinue, onOpenLibrary }: UploadScreenProps) {
  const formats = useQuery({ queryKey: formatsKey, queryFn: fetchFormats });
  const allowance = useQuery({ queryKey: allowanceKey, queryFn: fetchAllowance });
  const { full } = useDraft();
  const rule: FormatRule | undefined = formats.data?.find((r) => r.id === format);
  const [stage, setStage] = useState<Stage>(full ? { state: 'done', name: full.name } : { state: 'idle' });
  const abort = useRef<AbortController | null>(null);
  const firstTap = useFirstTap();
  // At "5 of 5 used" the Hub would refuse the piece when it is created, so nothing is uploaded for it (M27). A count that has not
  // loaded does not block: the Hub still decides at the create call.
  const noRoom = allowance.data ? slotsFull(allowance.data) : false;

  // Leaving the screen stops a transfer that is still going.
  useEffect(() => () => abort.current?.abort(), []);

  const send = async (file: ChosenFile) => {
    if (!rule) return;
    const refusal = refusalFor(file, rule.full);
    if (refusal) {
      setFull(null);
      setStage({ state: 'failed', file, message: refusal, retry: false });
      return;
    }
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    setFull(null);
    setStage({ state: 'uploading', file, share: 0 });
    try {
      const uploaded = await uploadFile(file, { folder: 'content/full', format }, (share) => setStage((s) => (s.state === 'uploading' ? { ...s, share } : s)), controller.signal);
      if (controller.signal.aborted) return;
      setFull(uploaded);
      setStage({ state: 'done', name: uploaded.name });
    } catch (error) {
      if (error instanceof ApiError && error.code === UPLOAD_CANCELLED) return;
      setStage({
        state: 'failed',
        file,
        message: isApiError(error) ? error.message : 'That file did not upload. Try again.',
        retry: retryable(error),
      });
    }
  };

  const choose = async () => {
    if (!rule || noRoom || stage.state === 'uploading' || !firstTap()) return;
    try {
      const file = await pickFile(rule.full.contentTypes);
      if (file) await send(file);
    } catch {
      setStage({ state: 'failed', file: null, message: "We couldn't open your files. Try again.", retry: false });
    }
  };

  const uploading = stage.state === 'uploading';
  const foot = <Button testID="create-continue" label="Continue" full disabled={!full || uploading} onPress={onContinue} />;
  const leave = () => {
    abort.current?.abort();
    onBack();
  };

  return (
    <CreateFrame testID="upload-screen" title={`New ${labelOf(format)}`} subtitle="Step 2 of 5" onLeave={leave} foot={foot}>
      <Stepper active={0} />
      {formats.isError && !rule ? (
        <ErrorState
          testID="upload-error"
          title="Couldn't load the upload rules"
          message={isApiError(formats.error) ? formats.error.message : 'Check your connection and try again.'}
          onRetry={() => void formats.refetch()}
        />
      ) : !rule ? (
        <Skeleton testID="upload-loading" height={dropMetrics.height} radius={dropMetrics.corner} />
      ) : (
        <>
          {allowance.data && noRoom ? <SlotsFullNotice allowance={allowance.data} onOpenLibrary={onOpenLibrary} /> : null}
          <DropBox format={format} limit={rule.full.maxBytes} disabled={uploading || noRoom || !canPickFile} onPress={() => void choose()} />
          {stage.state === 'uploading' || stage.state === 'failed' ? (
            stage.file ? (
              // A failed row shows no bar and no share: the bytes may all have gone and the file still not landed, and Try again starts over.
              <FileRow testID="upload-file" icon="FileText" name={stage.file.name} progress={stage.state === 'uploading' ? stage.share : undefined} failed={stage.state === 'failed'} />
            ) : null
          ) : stage.state === 'done' ? (
            <FileRow testID="upload-file" icon="FileText" name={stage.name} progress={1} />
          ) : null}
          {stage.state === 'failed' ? (
            <View style={styles.failure}>
              <Text variant="errorLine" tone="danger" accessibilityRole="alert" testID="upload-failure">
                {stage.message}
              </Text>
              {stage.retry && stage.file ? <Button testID="upload-retry" label="Try again" variant="secondary" size="sm" onPress={() => stage.file && void send(stage.file)} /> : null}
            </View>
          ) : null}
        </>
      )}
    </CreateFrame>
  );
}

export function DropBox({ format, limit, disabled, onPress }: { format: FormatId; limit: number; disabled: boolean; onPress: () => void }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  return (
    <Pressable
      testID="upload-drop"
      accessibilityRole="button"
      accessibilityLabel={uploadTitle(format)}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      {...ring.handlers}
      style={[
        styles.drop,
        {
          backgroundColor: colors.surfaceCard,
          boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: dropMetrics.ring, color: colors.borderStrong, inset: true }],
        },
        ring.style,
      ]}
    >
      <IconTile icon="FileUp" tone="accent" size={dropMetrics.icon} />
      <Text variant="body" style={[font(600), styles.dropTitle]}>
        {uploadTitle(format)}
      </Text>
      <Text variant="body" tone="textMuted" style={styles.dropHint}>
        {`Up to ${formatBytes(limit)}. It stays locked until someone buys.`}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  drop: { height: dropMetrics.height, borderRadius: dropMetrics.corner, alignItems: 'center', justifyContent: 'center', gap: dropMetrics.between, paddingHorizontal: dropMetrics.pad },
  dropTitle: { fontSize: dropMetrics.title, textAlign: 'center' },
  dropHint: { fontSize: dropMetrics.hint, textAlign: 'center' },
  failure: { gap: space.sm, alignItems: 'flex-start' },
});

