import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';

import { walletBalanceQuery } from '@/api/money';
import { detailKey, type FeedItem } from '@/features/feed/api';
import { feeLines } from '@/features/events/buyModel';
import { usePaymentFlow, type Engine, type FlowHandlers } from '@/features/feedpay/usePaymentFlow';

import { askUnlockQuote, fetchMedia, fetchUnlock, sendUnlock, unlockKey, type Unlock, type UnlockQuote } from './api';
import { useLadder } from '@/features/store/ladder/useLadder';

import { applyUnlock } from './patchFeed';

/**
 * Unlocking a locked post from the feed (HOME-12): the offer bar opens H14 on a fresh quote, Pay opens H15 (the shared PIN sheet),
 * and a paid unlock ends on H16. One of these serves the whole feed: `begin(item)` opens the sheet for the post whose bar was pressed.
 *
 * Every figure on the sheets is the Hub's quote or the Hub's unlock; the price on the offer bar is only where the person starts.
 */
export function useUnlock(handlers: FlowHandlers) {
  const client = useQueryClient();
  // R-101: in the Android and iOS apps an unlock is a store purchase on the price ladder. `ladder.native` is false on the web, which keeps the wallet.
  const ladder = useLadder();
  const [storeOpen, setStoreOpen] = useState(false);
  const itemRef = useRef<FeedItem | null>(null);
  const [item, setItem] = useState<FeedItem | null>(null);

  const engine: Engine<UnlockQuote, Unlock> = {
    scope: `unlock:${item?.id ?? ''}`,
    ask: () => (itemRef.current ? askUnlockQuote(itemRef.current.id) : Promise.reject(new Error('nothing to unlock'))),
    send: (quote, key, credential) =>
      sendUnlock({ contentId: quote.contentId, expectedTotalKobo: quote.payment.totalKobo, quoteToken: quote.payment.quoteToken, key, ...credential }),
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
      if (ladder.native) {
        ladder.buyer.clear();
        setStoreOpen(true);
        return;
      }
      void openFlow();
    },
    [openFlow, ladder.native, ladder.buyer.clear],
  );

  /**
   * The moment the Hub says the unlock is paid (not when H16 is closed), the post stops being locked in every feed the app holds, and the
   * same reads a reload makes are asked again: the feeds, the piece's page and the wallet's balance (SWEEP-FLOWS B2). One run per paid
   * unlock; the Hub's own answers are the source, never anything made up here.
   */
  const paidView = flow.view && flow.view.status === 'paid' ? flow.view : null;
  const paidFor = useRef<string | null>(null);
  const itemId = item?.id ?? null;
  useEffect(() => {
    if (!itemId || !paidView) {
      if (!paidView) paidFor.current = null;
      return;
    }
    const mark = `${itemId}:${paidView.id}`;
    if (paidFor.current === mark) return;
    paidFor.current = mark;
    const fullAssetUrl = paidView.fullAssetUrl;
    applyUnlock(client, itemId, { fullAssetUrl });
    void fetchMedia(itemId).then((media) => {
      if (media) applyUnlock(client, itemId, { fullAssetUrl, media });
    });
    void client.invalidateQueries({ queryKey: ['feed'] });
    // The creator's profile grid draws a bought piece open, from the same per-viewer answer (L1).
    void client.invalidateQueries({ queryKey: ['profile', 'content'] });
    void client.invalidateQueries({ queryKey: detailKey(itemId) });
    void client.invalidateQueries({ queryKey: walletBalanceQuery.queryKey });
  }, [client, itemId, paidView]);

  /** H16's button, or the scrim: the sheet is done (the post was already opened up when the payment was paid). */
  const done = () => {
    flow.finish();
    if (ladder.native) {
      ladder.buyer.clear();
      setStoreOpen(false);
    }
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
    /** The store's side (R-101): set on a phone with a store, null on the web. */
    store: ladder.native ? { ladder, open: storeOpen } : null,
  };
}

export type UnlockState = ReturnType<typeof useUnlock>;
