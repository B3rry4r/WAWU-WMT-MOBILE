import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';

import { walletBalanceQuery } from '@/api/money';
import type { AvatarHue } from '@/components/Avatar';
import { feeLines } from '@/features/events/buyModel';
import { usePaymentFlow, type Engine, type FlowHandlers } from '@/features/feedpay/usePaymentFlow';

import { askTipQuote, fetchTip, sendTip, tipKey, type Tip, type TipQuote } from './api';
import { usePrices } from '@/features/prices/api';
import { useLadder } from '@/features/store/ladder/useLadder';
import { useShownPrice } from '@/features/store/ladder/usePrice';
import { nearestOf } from '@/features/prices/model';

import { DEFAULT_TIP_KOBO, NOTE_MAX } from './model';

/** The person being tipped, as the feed's rail knows them. */
export type TipTarget = { wawuId: string; name: string | null; avatarUrl: string | null; hue: AvatarHue };

/**
 * Tipping a creator from the feed (HOME-13): H26's sheet (an amount, a note, the breakdown, Pay from wallet), H27's PIN and H28's
 * "Tip sent". One of these serves the whole feed: `begin(creator)` opens H26 for whoever the rail belongs to.
 *
 * The amount is one of six tiles from the Hub's tip list (PRICE-PICKER, R-101): nothing is typed.
 *
 * The breakdown on H26 is the Hub's quote for the amount on the sheet, asked again whenever the amount changes and once more on
 * every tap of Tip (`usePaymentFlow`). The button only reads "Tip ₦X" with X the quote's total, so no total is ever drawn that the
 * Hub did not give.
 */
export function useTip(handlers: FlowHandlers) {
  const [target, setTarget] = useState<TipTarget | null>(null);
  const [open, setOpen] = useState(false);
  const [chosen, setChosen] = useState<number>(DEFAULT_TIP_KOBO);
  const [note, setNote] = useState('');
  // The tiles are the Hub's tip list; the amount is always one of them (the nearest, when the admin's list moved since the sheet opened).
  const prices = usePrices();
  // R-101: in the Android and iOS apps a tip is a store purchase on the price ladder, shown at the STORE's price. A tip the store sells no
  // product for is not drawn. `ladder.native` is false on the web, which keeps the wallet.
  const ladder = useLadder();
  const clearBought = ladder.buyer.clear;
  const shown = useShownPrice();
  const listed = (prices.data?.tips ?? []).map((t) => t.priceNaira);
  const tips = ladder.native ? listed.filter((n) => shown.kobo(n) !== null) : listed;
  const tipNaira = nearestOf(tips, chosen / 100);
  const amountKobo = tipNaira === null ? null : tips.includes(chosen / 100) ? chosen : tipNaira * 100;
  const trimmed = note.trim();

  const engine: Engine<TipQuote, Tip> = {
    scope: `tip:${target?.wawuId ?? ''}:${amountKobo ?? 0}:${trimmed}`,
    ask: () => {
      if (!target || amountKobo === null) return Promise.reject(new Error('nothing to quote'));
      return askTipQuote({ creatorWawuId: target.wawuId, amountKobo });
    },
    send: (quote, key, credential) =>
      sendTip({
        creatorWawuId: quote.creator.wawuUserId,
        amountKobo: quote.amountKobo,
        note: trimmed,
        expectedTotalKobo: quote.payment.totalKobo,
        quoteToken: quote.payment.quoteToken,
        key,
        ...credential,
      }),
    read: fetchTip,
    readKey: tipKey,
    shortLine: 'There is not enough in your wallet for this tip.',
  };
  // No wallet yet (R-6): the sheet steps aside and Open your wallet takes over.
  const flow = usePaymentFlow(engine, {
    ...handlers,
    onOpenWallet: () => {
      setOpen(false);
      handlers.onOpenWallet();
    },
  });
  const { ask } = flow;

  // The breakdown follows the amount: a tile is asked about at once.
  const settled = open && flow.stage === null && !ladder.native;
  useEffect(() => {
    if (!settled || amountKobo === null) return undefined;
    const timer = setTimeout(() => void ask(), 0);
    return () => clearTimeout(timer);
  }, [settled, amountKobo, ask]);

  const quote = flow.quote && flow.quote.amountKobo === amountKobo ? flow.quote : null;
  const balance = useQuery({ ...walletBalanceQuery, enabled: Boolean(open && quote && quote.payment.balanceKobo === null) });
  const balanceKobo = flow.shortOf ?? quote?.payment.balanceKobo ?? balance.data?.availableKobo ?? null;

  const begin = useCallback((who: TipTarget) => {
    setTarget(who);
    setChosen(DEFAULT_TIP_KOBO);
    setNote('');
    if (ladder.native) clearBought();
    setOpen(true);
  }, [ladder.native, clearBought]);

  const close = () => {
    flow.finish();
    setOpen(false);
    if (ladder.native) clearBought();
  };

  return {
    target,
    /** H26 and everything over it is up. */
    open,
    begin,
    close,
    /** The tiles: the Hub's tip list in whole naira, in order (empty while it is being read). */
    tips,
    /** Reading the tip list failed: the tiles say so and offer to try again. */
    tipsFailed: prices.isError && !prices.data,
    readTips: () => void prices.refetch(),
    /** The tip list has been read and the store sells none of it (the ladder is not set up for tips). */
    tipsNone: ladder.native && prices.isSuccess && shown.ready && tips.length === 0,
    note,
    amountKobo,
    /** Pick a tile. */
    pick: (kobo: number) => setChosen(kobo),
    setNote: (text: string) => setNote(text.slice(0, NOTE_MAX)),
    /** The Hub's quote for THIS amount, or null while it is on its way. */
    quote,
    fees: quote ? feeLines(quote.payment.fee) : [],
    balanceKobo,
    flow,
    /** The store's side (R-101): set on a phone with a store, null on the web. */
    store: ladder.native ? { ladder, shown } : null,
  };
}

export type TipState = ReturnType<typeof useTip>;
