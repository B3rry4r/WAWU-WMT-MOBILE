import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';

import { walletBalanceQuery } from '@/api/money';
import type { FeedItem } from '@/features/feed/api';
import { feeLines } from '@/features/events/buyModel';
import { usePaymentFlow, type Engine, type FlowHandlers } from '@/features/feedpay/usePaymentFlow';

import { askUnlockQuote, fetchMedia, fetchUnlock, sendUnlock, unlockKey, type Unlock, type UnlockQuote } from './api';
import { applyUnlock } from './patchFeed';

/**
 * Unlocking a locked post from the feed (HOME-12): the offer bar opens H14 on a fresh quote, Pay opens H15 (the shared PIN sheet),
 * and a paid unlock ends on H16. One of these serves the whole feed: `begin(item)` opens the sheet for the post whose bar was pressed.
 *
 * Every figure on the sheets is the Hub's quote or the Hub's unlock; the price on the offer bar is only where the person starts.
 */
export function useUnlock(handlers: FlowHandlers) {
  const client = useQueryClient();
  const itemRef = useRef<FeedItem | null>(null);
  const [item, setItem] = useState<FeedItem | null>(null);

  const engine: Engine<UnlockQuote, Unlock> = {
    scope: `unlock:${item?.id ?? ''}`,
    ask: () => (itemRef.current ? askUnlockQuote(itemRef.current.id) : Promise.reject(new Error('nothing to unlock'))),
    send: (quote, key, pin) =>
      sendUnlock({ contentId: quote.contentId, expectedTotalKobo: quote.payment.totalKobo, quoteToken: quote.payment.quoteToken, key, pin }),
    read: (paymentId) => fetchUnlock(itemRef.current?.id ?? '', paymentId),
    readKey: (paymentId) => unlockKey(item?.id ?? '', paymentId),
    shortLine: 'There is not enough in your wallet to unlock this.',
  };
  const flow = usePaymentFlow(engine, handlers);
  const { open: openFlow } = flow;

  const quote = flow.quote;
  const balance = useQuery({ ...walletBalanceQuery, enabled: Boolean(flow.payOpen && quote && quote.payment.balanceKobo === null) });
  const balanceKobo = flow.shortOf ?? quote?.payment.balanceKobo ?? balance.data?.availableKobo ?? null;

  const begin = useCallback(
    (post: FeedItem) => {
      itemRef.current = post;
      setItem(post);
      void openFlow();
    },
    [openFlow],
  );

  /** H16's button, or the scrim: the post stops being locked in every feed the app holds, and the sheet is done. */
  const done = () => {
    const view = flow.view;
    if (item && view && view.status === 'paid') {
      applyUnlock(client, item.id, { fullAssetUrl: view.fullAssetUrl });
      void fetchMedia(item.id).then((media) => {
        if (media) applyUnlock(client, item.id, { fullAssetUrl: view.fullAssetUrl, media });
      });
    }
    flow.finish();
  };

  return {
    item,
    /** The price is being asked for (the offer bar waits). */
    asking: flow.asking && !flow.payOpen,
    begin,
    done,
    quote,
    fees: quote ? feeLines(quote.payment.fee) : [],
    balanceKobo,
    flow,
  };
}

export type UnlockState = ReturnType<typeof useUnlock>;
