import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ApiError } from '@/api/errors';
import { isApiError } from '@/api/client';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Skeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { fetchFormats, formatsKey } from '@/features/create/api';
import { refusalFor, type ChosenFile } from '@/features/create/chosen';
import { CreateFrame } from '@/features/create/CreateFrame';
import type { UploadedFile } from '@/features/create/draft';
import { labelOf, type FormatId, type FormatRule } from '@/features/create/model';
import { FileRow, useFirstTap } from '@/features/create/parts';
import { sendFailure } from '@/features/create/PriceScreen';
import { canPickFile, pickFile } from '@/features/create/pickFile';
import { UPLOAD_CANCELLED, uploadFile } from '@/features/create/upload';
import { DropBox, retryable } from '@/features/create/UploadScreen';
import { radius, space } from '@/theme';

import { fetchPiece, libraryKey, pieceKey, updatePiece } from './api';

type Stage =
  | { state: 'idle' }
  | { state: 'uploading'; file: ChosenFile; share: number }
  | { state: 'saving'; name: string }
  | { state: 'failed'; file: ChosenFile | null; uploaded: UploadedFile | null; message: string; retry: boolean };

export type ReplaceFileScreenProps = { id: string; onBack: () => void; onReplaced: () => void };

/**
 * Replace the file, opened from M26 ("Upload a fixed version"; the board draws the row, not the screen, so it is drawn as M21 draws the
 * full-file step). The new file goes up under the format's own rule (`GET /uploads/formats`, `POST /uploads/presign`) and is then put on
 * the piece (`PATCH /content/{id}` with `fullAsset`); the piece stays turned down until Send again. A file that went up but could not be put
 * on the piece is kept, so Try again only repeats the second step.
 */
export function ReplaceFileScreen({ id, onBack, onReplaced }: ReplaceFileScreenProps) {
  const client = useQueryClient();
  const piece = useQuery({ queryKey: pieceKey(id), queryFn: () => fetchPiece(id) });
  const formats = useQuery({ queryKey: formatsKey, queryFn: fetchFormats });
  const format = piece.data?.contentType as FormatId | undefined;
  const rule: FormatRule | undefined = formats.data?.find((r) => r.id === format);
  const [stage, setStage] = useState<Stage>({ state: 'idle' });
  const abort = useRef<AbortController | null>(null);
  const firstTap = useFirstTap();

  // Leaving the screen stops a transfer that is still going.
  useEffect(() => () => abort.current?.abort(), []);

  const attach = async (uploaded: UploadedFile) => {
    setStage({ state: 'saving', name: uploaded.name });
    try {
      const saved = await updatePiece(id, { fullAsset: uploaded.fileUrl });
      client.setQueryData(pieceKey(id), saved);
      void client.invalidateQueries({ queryKey: libraryKey });
      onReplaced();
    } catch (error) {
      setStage({ state: 'failed', file: null, uploaded, message: sendFailure(error), retry: true });
    }
  };

  const send = async (file: ChosenFile) => {
    if (!rule || !format) return;
    const refusal = refusalFor(file, rule.full);
    if (refusal) {
      setStage({ state: 'failed', file, uploaded: null, message: refusal, retry: false });
      return;
    }
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    setStage({ state: 'uploading', file, share: 0 });
    try {
      const uploaded = await uploadFile(file, { folder: 'content/full', format }, (share) => setStage((s) => (s.state === 'uploading' ? { ...s, share } : s)), controller.signal);
      if (controller.signal.aborted) return;
      await attach(uploaded);
    } catch (error) {
      if (error instanceof ApiError && error.code === UPLOAD_CANCELLED) return;
      setStage({ state: 'failed', file, uploaded: null, message: isApiError(error) ? error.message : 'That file did not upload. Try again.', retry: retryable(error) });
    }
  };

  const choose = async () => {
    if (!rule || stage.state === 'uploading' || stage.state === 'saving' || !firstTap()) return;
    try {
      const file = await pickFile(rule.full.contentTypes);
      if (file) await send(file);
    } catch {
      setStage({ state: 'failed', file: null, uploaded: null, message: "We couldn't open your files. Try again.", retry: false });
    }
  };

  const leave = () => {
    abort.current?.abort();
    onBack();
  };
  const busy = stage.state === 'uploading' || stage.state === 'saving';
  const title = format ? `Replace the ${labelOf(format)}` : 'Replace the file';

  return (
    <CreateFrame testID="replace-screen" title={title} onLeave={leave}>
      {piece.isError && !piece.data ? (
        <ErrorState
          testID="replace-error"
          title="Couldn't open this piece"
          message={isApiError(piece.error) ? piece.error.message : 'Check your connection and try again.'}
          onRetry={() => void piece.refetch()}
        />
      ) : formats.isError && !rule ? (
        <ErrorState
          testID="replace-rules-error"
          title="Couldn't load the upload rules"
          message={isApiError(formats.error) ? formats.error.message : 'Check your connection and try again.'}
          onRetry={() => void formats.refetch()}
        />
      ) : !rule || !format ? (
        <Skeleton testID="replace-loading" height={200} radius={radius.card} />
      ) : (
        <>
          <DropBox format={format} limit={rule.full.maxBytes} disabled={busy || !canPickFile} onPress={() => void choose()} />
          {stage.state === 'uploading' ? <FileRow testID="replace-file" icon="FileText" name={stage.file.name} progress={stage.share} /> : null}
          {stage.state === 'saving' ? <FileRow testID="replace-file" icon="FileText" name={stage.name} progress={1} /> : null}
          {stage.state === 'failed' ? (
            <View style={styles.failure}>
              {stage.file ? <FileRow testID="replace-file" icon="FileText" name={stage.file.name} failed /> : null}
              {stage.uploaded ? <FileRow testID="replace-file" icon="FileText" name={stage.uploaded.name} failed /> : null}
              <Banner testID="replace-failure" tone="danger" title="Not replaced" body={stage.message} />
              {stage.retry && stage.uploaded ? <Button testID="replace-retry" label="Try again" variant="secondary" size="sm" onPress={() => stage.uploaded && void attach(stage.uploaded)} /> : null}
              {stage.retry && stage.file ? <Button testID="replace-retry" label="Try again" variant="secondary" size="sm" onPress={() => stage.file && void send(stage.file)} /> : null}
            </View>
          ) : null}
          <Text variant="muted">Send the piece again once the new file is on it.</Text>
        </>
      )}
    </CreateFrame>
  );
}

const styles = StyleSheet.create({
  failure: { gap: space.sm, alignItems: 'stretch' },
});
