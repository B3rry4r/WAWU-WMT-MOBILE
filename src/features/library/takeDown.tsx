import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';

import { ApiError } from '@/api/errors';
import { Banner } from '@/components/Banner';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { Text } from '@/components/Text';
import { allowanceKey } from '@/features/create/api';

import { deletePiece, libraryKey, pieceKey } from './api';

/** What the confirm says, by the piece's state (R-130: buyers keep what they paid for; a place is freed unless the piece was already turned down). */
export function takeDownWords(status: string): string {
  if (status === 'live') return 'It leaves your profile, search and the feed, and nobody can buy it. People who already bought it keep it. Your place is free again.';
  if (status === 'pending') return 'It leaves review and your place is free again.';
  return 'It is taken down for good. This cannot be undone.';
}

const failureOf = (error: unknown): string => (error instanceof ApiError && error.message ? error.message : 'We could not take it down. Check your connection and try again.');

/** The state the piece wore when the person asked, kept so the sheet's words stay while it closes. */
export type TakeDownTarget = { id: string; title: string; status: string };

/**
 * Taking one of your own pieces down: `DELETE /content/{id}` (the Hub frees the place in the same step and answers a repeat 404). The
 * lists that show it, the uploads count and the profile are read again at once, so the place is free the moment the sheet closes.
 */
export function useTakeDown(onDone?: (target: TakeDownTarget) => void) {
  const client = useQueryClient();
  const [target, setTarget] = useState<TakeDownTarget | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const done = (t: TakeDownTarget) => {
    setTarget(null);
    client.removeQueries({ queryKey: pieceKey(t.id) });
    // The lists, the uploads count (the place is free again) and the Me tab's Content grid are read again at once.
    void client.invalidateQueries({ queryKey: libraryKey });
    void client.invalidateQueries({ queryKey: allowanceKey });
    void client.invalidateQueries({ queryKey: ['profile'] });
    onDone?.(t);
  };
  // A second tap in the same moment would send twice before the button has drawn its busy state.
  const sending = useRef(false);
  const remove = useMutation({
    mutationFn: (t: TakeDownTarget) => deletePiece(t.id),
    onSettled: () => {
      sending.current = false;
    },
    onSuccess: (_none, t) => done(t),
    // The Hub answers a piece that is already down with 404 (another phone, a second tap): it is gone, which is what was asked.
    onError: (error, t) => (error instanceof ApiError && error.kind === 'not_found' ? done(t) : setFailure(failureOf(error))),
  });
  return {
    ask: (t: TakeDownTarget) => {
      setFailure(null);
      setTarget(t);
    },
    busy: remove.isPending,
    target,
    failure,
    close: () => setTarget(null),
    confirm: () => {
      if (!target || sending.current) return;
      sending.current = true;
      remove.mutate(target);
    },
  };
}

/** The confirm every take-down asks, as the Rejected screen's delete sheet asks it. */
export function TakeDownSheet({ takeDown, testID = 'takedown' }: { takeDown: ReturnType<typeof useTakeDown>; testID?: string }) {
  const { target, busy, failure } = takeDown;
  return (
    <BottomSheet visible={target !== null} onClose={takeDown.close} dismissible={!busy} label="Take this down?" testID={`${testID}-sheet`}>
      <Text variant="sheetTitleSm">Take this down?</Text>
      {target ? (
        <Text variant="muted" numberOfLines={2}>
          {target.title}
        </Text>
      ) : null}
      <Text variant="muted">{target ? takeDownWords(target.status) : ''}</Text>
      {failure ? <Banner tone="danger" title="That did not work" body={failure} testID={`${testID}-error`} /> : null}
      <Button label="Keep it" full onPress={takeDown.close} disabled={busy} testID={`${testID}-keep`} />
      <Button label="Take down" variant="secondary" full loading={busy} onPress={takeDown.confirm} testID={`${testID}-confirm`} />
    </BottomSheet>
  );
}
