import { Image } from 'expo-image';
import { useEffect, useRef, useState, type MutableRefObject } from 'react';
import { StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/client';
import { ApiError } from '@/api/errors';
import { Button } from '@/components/Button';
import { Icon } from '@/components/icon';
import { Text } from '@/components/Text';
import { releaseUpload } from '@/features/create/api';
import type { UploadedFile } from '@/features/create/draft';
import { pickCover } from '@/features/create/coverPick';
import { canPickFile } from '@/features/create/pickFile';
import { UPLOAD_CANCELLED, uploadFile } from '@/features/create/upload';
import { pictureCandidates } from '@/features/feed/model';
import { usePicture } from '@/features/feed/usePicture';
import { kindIcon } from '@/features/me/model';
import { space, useWawu } from '@/theme';

import type { LibraryPiece } from './api';

/** What the person did to the cover on this screen: nothing, picked a new picture (already up), or took it off. */
export type CoverEdit = { kind: 'keep' } | { kind: 'set'; file: UploadedFile } | { kind: 'remove' };

/** The thumbnail is the shape the price card draws a cover in: 52 by 66, corner 10 (PriceScreen). */
const thumb = { width: 52, height: 66, corner: 10 } as const;

/**
 * The cover on Edit details (R-114): the piece's current cover (or the mark of its kind), Change to pick another picture of the phone's own,
 * and Remove to take it off. Nothing is sent until Save (`coverAsset` on `PATCH /content/{id}`: the new key replaces it, `null` removes it).
 * A picture that went up and is then replaced, removed or left unsaved is given back to the Hub, which frees its space. The Hub's own
 * sentence is shown when it refuses a picture (a type, a size over 5 MB, no room).
 */
export function EditCover({ piece, edit, onEdit, saved }: { piece: LibraryPiece; edit: CoverEdit; onEdit: (next: CoverEdit) => void; /** Set once Save has taken the picture: it is the piece's now, and leaving does not give it back. */ saved: MutableRefObject<boolean> }) {
  const { colors } = useWawu();
  const [failure, setFailure] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const picking = useRef(false);
  const pending = useRef<string | null>(null);
  const current = edit.kind === 'remove' ? null : edit.kind === 'set' ? (edit.file.previewUri ?? null) : (piece.coverUrl ?? null);
  const { uri, onError } = usePicture(pictureCandidates({ coverUrl: current }, null));
  const has = edit.kind === 'set' || (edit.kind === 'keep' && Boolean(piece.coverUrl));
  // The key of a picture that went up and may never be saved: kept in an effect, and given back when the person leaves.
  const pendingKey = edit.kind === 'set' ? edit.file.key : null;
  useEffect(() => {
    pending.current = pendingKey;
  }, [pendingKey]);
  useEffect(
    () => () => {
      const key = pending.current;
      if (key && !saved.current) void releaseUpload(key).catch(() => undefined);
    },
    [saved],
  );

  const pick = async () => {
    if (picking.current || sending) return;
    picking.current = true;
    try {
      const file = await pickCover();
      if (!file) return;
      setFailure(null);
      setSending(true);
      try {
        const uploaded = await uploadFile(file, { folder: 'content/cover' }, () => undefined);
        if (edit.kind === 'set') void releaseUpload(edit.file.key).catch(() => undefined);
        // `uploadFile` has let go of the phone's own copy by now, so the picture is drawn from the link it came back with, never from that file.
        onEdit({ kind: 'set', file: { ...uploaded, previewUri: uploaded.fileUrl } });
      } catch (error) {
        if (error instanceof ApiError && error.code === UPLOAD_CANCELLED) return;
        setFailure(isApiError(error) && error.message ? error.message : 'That picture did not upload. Try again.');
      } finally {
        setSending(false);
      }
    } catch {
      setFailure("We couldn't open your photos. Try again.");
    } finally {
      picking.current = false;
    }
  };

  const remove = () => {
    setFailure(null);
    if (edit.kind === 'set') void releaseUpload(edit.file.key).catch(() => undefined);
    onEdit(piece.coverUrl ? { kind: 'remove' } : { kind: 'keep' });
  };

  return (
    <View style={styles.root} testID="edit-cover">
      <Text variant="label">Cover</Text>
      <View style={styles.row}>
        <View style={[styles.thumb, { backgroundColor: colors.surfaceSunken }]}>
          {uri ? <Image testID="edit-cover-image" source={{ uri }} contentFit="cover" onError={onError} style={StyleSheet.absoluteFill} /> : <Icon name={kindIcon(piece.contentType)} size={24} color={colors.textMuted} />}
        </View>
        <View style={styles.words}>
          <Text variant="body" numberOfLines={2} tone={has ? 'textPrimary' : 'textMuted'}>
            {sending ? 'Sending your picture' : edit.kind === 'remove' ? 'No cover after you save' : has ? 'Your cover' : 'No cover'}
          </Text>
        </View>
        <View style={styles.buttons}>
          <Button testID="edit-cover-pick" label={has ? 'Change' : 'Pick a picture'} variant="secondary" size="sm" disabled={!canPickFile || sending} onPress={() => void pick()} />
          {has ? <Button testID="edit-cover-remove" label="Remove" variant="secondary" size="sm" disabled={sending} onPress={remove} /> : null}
        </View>
      </View>
      {failure ? (
        <Text variant="errorLine" tone="danger" accessibilityRole="alert" testID="edit-cover-failure">
          {failure}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: space.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  thumb: { width: thumb.width, height: thumb.height, borderRadius: thumb.corner, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  words: { flex: 1, minWidth: 0 },
  buttons: { gap: space.xs, alignItems: 'flex-end' },
});
