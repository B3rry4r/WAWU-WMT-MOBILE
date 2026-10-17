import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/client';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { SegmentedTabs } from '@/components/SegmentedTabs';
import { Skeleton } from '@/components/Skeleton';
import { ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { CreateFrame } from '@/features/create/CreateFrame';
import { CategorySheet } from '@/features/create/DetailsScreen';
import {
  CONTENT_CATEGORIES,
  categoryLabel,
  cleanPrice,
  limits,
  priceOf,
  type AccessType,
  type ContentCategoryId,
  type Details,
} from '@/features/create/details';
import { FreeCard, MODES, PriceField, sendFailure } from '@/features/create/PriceScreen';
import { radius, space } from '@/theme';

import { fetchPiece, libraryKey, pieceKey, updatePiece, type LibraryPiece, type UpdateBody } from './api';

const categoryOf = (id: string): ContentCategoryId | null => CONTENT_CATEGORIES.find((c) => c.id === id)?.id ?? null;

/** What the form starts from: the piece as the Hub holds it. A category outside the 25 the Hub accepts today starts empty, and is only sent if the person picks one. */
export function startingDetails(piece: LibraryPiece): Details {
  return {
    title: piece.title,
    description: piece.description,
    category: categoryOf(piece.category),
    accessType: piece.accessType,
    price: piece.accessType === 'paid' && piece.price > 0 ? String(Math.round(piece.price)) : '',
  };
}

/**
 * The fields that differ from the piece, as `PATCH /content/{id}` takes them, or null when nothing differs or what is typed is not
 * one the Hub takes (an empty title or description, a paid piece with no price). Free sends the price 0 with it, as the Hub asks.
 */
export function changesOf(piece: LibraryPiece, now: Details): UpdateBody | null {
  const title = now.title.trim();
  const description = now.description.trim();
  if (!title || !description) return null;
  const body: UpdateBody = {};
  if (title !== piece.title) body.title = title;
  if (description !== piece.description.trim()) body.description = description;
  if (now.category !== null && now.category !== piece.category) body.category = now.category;
  const price = now.accessType === 'free' ? 0 : priceOf(now.price);
  if (price === null) return null;
  if (now.accessType !== piece.accessType || price !== piece.price) {
    body.accessType = now.accessType;
    body.price = price;
  }
  return Object.keys(body).length > 0 ? body : null;
}

export type EditDetailsScreenProps = { id: string; onBack: () => void; onSaved: () => void };

/**
 * Edit details, opened from M26 (the board draws the row, not the screen, so it is drawn in the Create steps' own style: the same
 * fields as M23 and the same price step as M24 and M37). It changes what the Hub allows on a piece that is waiting or turned down:
 * the title, the description, the category and the price (`PATCH /content/{id}`). The piece stays turned down until Send again.
 */
export function EditDetailsScreen({ id, onBack, onSaved }: EditDetailsScreenProps) {
  const piece = useQuery({ queryKey: pieceKey(id), queryFn: () => fetchPiece(id) });
  return piece.data ? (
    <EditForm piece={piece.data} onBack={onBack} onSaved={onSaved} />
  ) : (
    <CreateFrame testID="edit-screen" title="Edit details" onLeave={onBack}>
      {piece.isError ? (
        <ErrorState
          testID="edit-error"
          title="Couldn't open this piece"
          message={isApiError(piece.error) ? piece.error.message : 'Check your connection and try again.'}
          onRetry={() => void piece.refetch()}
        />
      ) : (
        <View testID="edit-loading" style={styles.loading}>
          <Skeleton height={56} radius={radius.input} />
          <Skeleton height={140} radius={radius.input} />
          <Skeleton height={56} radius={radius.input} />
        </View>
      )}
    </CreateFrame>
  );
}

function EditForm({ piece, onBack, onSaved }: { piece: LibraryPiece; onBack: () => void; onSaved: () => void }) {
  const client = useQueryClient();
  const [details, setDetails] = useState<Details>(() => startingDetails(piece));
  const [picking, setPicking] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const changes = changesOf(piece, details);
  const set = (patch: Partial<Details>) => {
    setFailure(null);
    setDetails((d) => ({ ...d, ...patch }));
  };
  const save = useMutation({
    mutationFn: (body: UpdateBody) => updatePiece(piece.id, body),
    onSuccess: (saved) => {
      client.setQueryData(pieceKey(piece.id), saved);
      void client.invalidateQueries({ queryKey: libraryKey });
      onSaved();
    },
    onError: (error) => setFailure(sendFailure(error)),
  });
  const free = details.accessType === 'free';

  const foot = (
    <>
      {failure ? <Banner testID="edit-failure" tone="danger" title="Not saved" body={failure} /> : null}
      <Button testID="edit-save" label="Save" full loading={save.isPending} disabled={!changes} onPress={() => changes && save.mutate(changes)} />
    </>
  );

  return (
    <CreateFrame testID="edit-screen" title="Edit details" onLeave={onBack} foot={foot}>
      <TextField testID="edit-title" label="Title" value={details.title} onChangeText={(title) => set({ title })} maxLength={limits.title} autoCapitalize="sentences" returnKeyType="next" />
      <TextField
        testID="edit-description"
        label="Description"
        multiline
        max={limits.description}
        value={details.description}
        onChangeText={(description) => set({ description })}
        autoCapitalize="sentences"
      />
      <TextField
        testID="edit-category"
        label="What is this?"
        placeholder="Choose a category"
        value={categoryLabel(details.category)}
        trailingIcon="ChevronDown"
        onPress={() => setPicking(true)}
      />
      <SegmentedTabs testID="edit-mode" label="Paid or free" items={MODES} value={details.accessType} onChange={(accessType: AccessType) => set({ accessType })} />
      {free ? (
        <>
          <FreeCard />
          <Text variant="muted">Free pieces count toward your uploads.</Text>
        </>
      ) : (
        <PriceField details={details} onChange={(price) => set({ price: cleanPrice(price) })} />
      )}
      <CategorySheet
        visible={picking}
        onClose={() => setPicking(false)}
        selected={details.category}
        onPick={(category) => {
          set({ category });
          setPicking(false);
        }}
      />
    </CreateFrame>
  );
}

const styles = StyleSheet.create({
  loading: { gap: space.lg },
});
