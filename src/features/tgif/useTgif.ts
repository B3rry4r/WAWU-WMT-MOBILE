import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import {
  dayKey,
  fetchDay,
  fetchStats,
  markRead,
  markShared,
  sayAmen,
  statsKey,
  takeAmenBack,
  type TgifCard,
  type TgifCardStats,
  type TgifReactionState,
  type TgifStats,
} from './api/tgif';

/** Today's cards. They never change within a day, so they are kept for it and not asked for again on every return. */
export function useDay(date: string) {
  return useQuery({ queryKey: dayKey(date), queryFn: () => fetchDay(date), staleTime: Infinity });
}

/** Amen per card, readers and shares, and what the caller has done. Asked for again when the reader is opened. */
export function useStats(date: string) {
  return useQuery({ queryKey: statsKey(date), queryFn: () => fetchStats(date) });
}

function withCard(stats: TgifStats, card: TgifCard, next: (c: TgifCardStats) => TgifCardStats): TgifStats {
  return { ...stats, cards: stats.cards.map((c) => (c.card === card ? next(c) : c)) };
}

/**
 * Counts this person as a reader once the cards are on screen. The Hub keeps one
 * reader per person per day, so opening the reader again changes nothing; a read
 * that cannot be sent is not shown to anyone, only the day's count misses one.
 */
export function useCountRead(date: string, ready: boolean) {
  const client = useQueryClient();
  const sent = useRef<string | null>(null);
  const read = useMutation({
    mutationFn: () => markRead(date),
    // Marked old, not fetched again: the reader draws no reader count, and a fetch landing mid-tap would undo an Amen shown at once.
    onSuccess: () => client.invalidateQueries({ queryKey: statsKey(date), refetchType: 'none' }),
  });
  const { mutate } = read;
  useEffect(() => {
    if (!ready || sent.current === date) return;
    sent.current = date;
    mutate();
  }, [ready, date, mutate]);
}

export type AmenMove = { card: TgifCard; on: boolean };

/**
 * Say Amen to a card, or take it back. The count and the person's own mark change at
 * once, the Hub's answer replaces them, and a failure puts them back. A card takes one
 * tap at a time, so two quick taps never reach the Hub out of order.
 */
export function useAmen(date: string) {
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ card, on }: AmenMove) => (on ? sayAmen(date, card) : takeAmenBack(date, card)),
    onMutate: async ({ card, on }) => {
      await client.cancelQueries({ queryKey: statsKey(date) });
      const before = client.getQueryData<TgifStats>(statsKey(date));
      if (before) {
        client.setQueryData<TgifStats>(
          statsKey(date),
          withCard(before, card, (c) => (c.amenByMe === on ? c : { ...c, amenByMe: on, amen: Math.max(0, c.amen + (on ? 1 : -1)) })),
        );
      }
      return { before };
    },
    onError: (_error, _move, context) => {
      if (context?.before) client.setQueryData(statsKey(date), context.before);
    },
    onSuccess: (state: TgifReactionState) => {
      const now = client.getQueryData<TgifStats>(statsKey(date));
      if (now) client.setQueryData<TgifStats>(statsKey(date), withCard(now, state.card, (c) => ({ ...c, amen: state.amen, amenByMe: state.amenByMe })));
    },
    onSettled: () => client.invalidateQueries({ queryKey: statsKey(date) }),
  });
  return {
    say: (move: AmenMove) => mutation.mutate(move),
    busy: mutation.isPending,
    failed: mutation.isError,
    clearFailure: () => mutation.reset(),
  };
}

/** Counts a share: one per person per day. Only called once a share has really gone out. */
export function useCountShare(date: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => markShared(date),
    onSuccess: () => client.invalidateQueries({ queryKey: statsKey(date), refetchType: 'none' }),
  });
}
