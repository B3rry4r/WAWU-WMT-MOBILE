import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/client';
import { Banner } from '@/components/Banner';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { Card, GroupedList } from '@/components/Card';
import { Icon } from '@/components/icon';
import { IconTile } from '@/components/IconTile';
import { ListRow } from '@/components/ListRow';
import { Skeleton } from '@/components/Skeleton';
import { StatusPill } from '@/components/StatusPill';
import { ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { allowanceKey } from '@/features/create/api';
import { CreateFrame } from '@/features/create/CreateFrame';
import { setSent } from '@/features/create/details';
import { sendFailure } from '@/features/create/PriceScreen';
import { rowPicture } from '@/features/feed/model';
import { kindIcon } from '@/features/me/model';
import { font, radius, space, useWawu } from '@/theme';

import { deletePiece, fetchPiece, libraryKey, pieceKey, resubmitPiece, type LibraryPiece } from './api';

/** design/_gen/me.js line 94, `rejected`: the card is 12 by 14 with a 52 by 66 picture (10 corners), 12 between it and the words; its title 14.5 / 600, the pill 6 under it. */
const cardMetrics = { padV: space.md, padH: 14, thumbW: 52, thumbH: 66, thumbCorner: 10, gap: space.md, title: 14.5, pillTop: 6, mark: 24 } as const;
/** The sentence under "Not approved" when the Hub holds no reason for the piece (a turned-down piece always has one from a reviewer). */
const NO_REASON = 'Replace the file or edit the details, then send it again.';

export type RejectedScreenProps = {
  id: string;
  onBack: () => void;
  /** Replace the file: opens the screen that uploads a fixed one. */
  onReplace: () => void;
  /** Edit details: opens the screen that changes the title, description, category and price. */
  onEdit: () => void;
  /** The piece is deleted: back to My content. */
  onDeleted: () => void;
  /** The Hub took the piece for review again: on to M25. */
  onSent: () => void;
};

/**
 * M26 · Rejected. The reviewer's reason as the Hub holds it (`GET /content/mine/library/{id}`, `rejectionReason`), the piece, and the
 * ways to fix it: Replace the file, Edit details, Delete, and Send again (`POST /content/{id}/resubmit`, which takes a place like a
 * new piece, so its refusals, a tier or a full set of uploads, are shown in the Hub's own words).
 *
 * The board names the delete row "Delete and free the slot". The Hub already returns a place when a reviewer turns a piece down, so
 * deleting a turned-down piece frees none, and the row says only "Delete" (BACKEND_GAPS G-ME-07-2).
 */
export function RejectedScreen({ id, onBack, onReplace, onEdit, onDeleted, onSent }: RejectedScreenProps) {
  const client = useQueryClient();
  const piece = useQuery({ queryKey: pieceKey(id), queryFn: () => fetchPiece(id) });
  const [asking, setAsking] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const refresh = () => {
    void client.invalidateQueries({ queryKey: libraryKey });
    void client.invalidateQueries({ queryKey: allowanceKey });
    // The Content grid on the Me tab and the draft count read under `profile`.
    void client.invalidateQueries({ queryKey: ['profile'] });
  };
  // A second tap in the same moment would send again (and open M25 twice) before the button has drawn its busy state.
  const sending = useRef(false);
  const send = useMutation({
    mutationFn: () => resubmitPiece(id),
    onMutate: () => setFailure(null),
    onSettled: () => {
      sending.current = false;
    },
    onSuccess: (sent) => {
      setSent({ title: sent.title });
      refresh();
      onSent();
    },
    onError: (error) => setFailure(sendFailure(error)),
  });
  const deleting = useRef(false);
  const remove = useMutation({
    mutationFn: () => deletePiece(id),
    onSettled: () => {
      deleting.current = false;
    },
    onSuccess: () => {
      setAsking(false);
      client.removeQueries({ queryKey: pieceKey(id) });
      refresh();
      onDeleted();
    },
    onError: (error) => setFailure(sendFailure(error)),
  });

  const data = piece.data;
  const rejected = data?.status === 'rejected';
  const foot = rejected ? (
    <>
      {failure && !asking ? <Banner testID="rejected-failure" tone="danger" title="Not sent" body={failure} /> : null}
      <Button testID="rejected-send" label="Send again" full loading={send.isPending} disabled={remove.isPending} onPress={() => {
          if (sending.current) return;
          sending.current = true;
          send.mutate();
        }}
      />
    </>
  ) : undefined;

  return (
    <CreateFrame testID="rejected-screen" title={data?.title ?? 'Rejected'} onLeave={onBack} gap={space.lg} foot={foot}>
      {data ? (
        rejected ? (
          <>
            <Banner testID="rejected-reason" tone="danger" icon="CircleX" title="Not approved" body={data.rejectionReason?.trim() || NO_REASON} />
            <PieceCard piece={data} />
            <GroupedList testID="rejected-actions">
              <ListRow testID="rejected-replace" lead={<IconTile icon="FileUp" />} title="Replace the file" subtitle="Upload a fixed version" onPress={onReplace} />
              <ListRow testID="rejected-edit" lead={<IconTile icon="PenLine" />} title="Edit details" onPress={onEdit} />
              <ListRow
                testID="rejected-delete"
                lead={<IconTile icon="Trash2" tone="danger" />}
                title="Delete"
                onPress={() => {
                  setFailure(null);
                  setAsking(true);
                }}
              />
            </GroupedList>
          </>
        ) : (
          <NotRejected status={data.status} />
        )
      ) : piece.isError ? (
        <ErrorState
          testID="rejected-error"
          title="Couldn't open this piece"
          message={isApiError(piece.error) ? piece.error.message : 'Check your connection and try again.'}
          onRetry={() => void piece.refetch()}
        />
      ) : (
        <View testID="rejected-loading" style={styles.loading}>
          <Skeleton height={96} radius={radius.tile} />
          <Skeleton height={64} radius={radius.card} />
          <Skeleton height={64} radius={radius.card} />
        </View>
      )}
      <BottomSheet visible={asking} onClose={() => setAsking(false)} dismissible={!remove.isPending} label="Delete this piece?" testID="rejected-delete-sheet">
        <Text variant="sheetTitleSm">Delete this piece?</Text>
        <Text variant="muted">It is taken down for good. This cannot be undone.</Text>
        {failure ? <Banner tone="danger" title="That did not work" body={failure} testID="rejected-delete-error" /> : null}
        <Button label="Keep it" full onPress={() => setAsking(false)} disabled={remove.isPending} testID="rejected-delete-keep" />
        <Button label="Delete" variant="secondary" full loading={remove.isPending} onPress={() => {
            if (deleting.current) return;
            deleting.current = true;
            remove.mutate();
          }}
          testID="rejected-delete-confirm"
        />
      </BottomSheet>
    </CreateFrame>
  );
}

/** Opened for a piece that is not turned down any more (sent again from another phone, approved, taken down): nothing here to fix. */
function NotRejected({ status }: { status: LibraryPiece['status'] }) {
  const { colors } = useWawu();
  const words =
    status === 'pending'
      ? { title: 'This piece is in review', line: 'It was sent again. We will tell you when it goes live.' }
      : status === 'live'
        ? { title: 'This piece is live', line: 'Nothing to fix.' }
        : { title: 'This piece is gone', line: 'It was taken down.' };
  return (
    <View testID="rejected-not" accessibilityRole="alert" style={styles.not}>
      <Icon name="Clock" size={cardMetrics.mark} color={colors.textMuted} />
      <Text variant="body" style={font(600)}>
        {words.title}
      </Text>
      <Text variant="muted" style={styles.notLine}>
        {words.line}
      </Text>
    </View>
  );
}

/** The piece as the board draws it: its picture, its title and the Rejected pill with its X. */
function PieceCard({ piece }: { piece: LibraryPiece }) {
  const { colors } = useWawu();
  const [broken, setBroken] = useState(false);
  const still = broken ? null : rowPicture(piece.contentType, piece.previewAssetUrl);
  return (
    <Card padded testID="rejected-piece" style={styles.card}>
      <View style={styles.cardRow}>
        <View style={[styles.thumb, { backgroundColor: colors.surfaceSunken }]}>
          {still ? (
            <Image testID="rejected-thumb-image" source={{ uri: still }} contentFit="cover" style={StyleSheet.absoluteFill} onError={() => setBroken(true)} />
          ) : (
            <View testID="rejected-thumb-mark">
              <Icon name={kindIcon(piece.contentType)} size={cardMetrics.mark} color={colors.textMuted} />
            </View>
          )}
        </View>
        <View style={styles.words}>
          <Text variant="body" numberOfLines={2} style={[font(600), styles.title]}>
            {piece.title}
          </Text>
          <View style={styles.pill}>
            <StatusPill label="Rejected" tone="danger" icon="X" />
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  loading: { gap: space.lg },
  not: { alignItems: 'center', gap: space.sm, paddingTop: space.s3xl },
  notLine: { textAlign: 'center' },
  card: { paddingVertical: cardMetrics.padV, paddingHorizontal: cardMetrics.padH },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: cardMetrics.gap },
  thumb: { width: cardMetrics.thumbW, height: cardMetrics.thumbH, borderRadius: cardMetrics.thumbCorner, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  words: { flex: 1, minWidth: 0 },
  title: { fontSize: cardMetrics.title },
  pill: { marginTop: cardMetrics.pillTop, alignItems: 'flex-start' },
});
