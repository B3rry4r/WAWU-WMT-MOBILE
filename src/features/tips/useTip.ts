import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';

import { walletBalanceQuery } from '@/api/money';
import type { AvatarHue } from '@/components/Avatar';
import { feeLines } from '@/features/events/buyModel';
import { usePaymentFlow, type Engine, type FlowHandlers } from '@/features/feedpay/usePaymentFlow';

import { askTipQuote, fetchTip, sendTip, tipKey, type Tip, type TipQuote } from './api';
import { amountOf, cleanAmountText, DEFAULT_QUICK_KOBO, NOTE_MAX } from './model';

/** The person being tipped, as the feed's rail knows them. */
export type TipTarget = { wawuId: string; name: string | null; avatarUrl: string | null; hue: AvatarHue };

/** How long a typed amount rests before the Hub is asked what it costs (a quick amount is asked at once). */
const TYPING_REST_MS = 350;

/**
 * Tipping a creator from the feed (HOME-13): H26's sheet (an amount, a note, the breakdown, Pay from wallet), H27's PIN and H28's
 * "Tip sent". One of these serves the whole feed: `begin(creator)` opens H26 for whoever the rail belongs to.
 *
 * The breakdown on H26 is the Hub's quote for the amount on the sheet, asked again whenever the amount changes and once more on
 * every tap of Tip (`usePaymentFlow`). The button only reads "Tip ₦X" with X the quote's total, so no total is ever drawn that the
 * Hub did not give.
 */
export function useTip(handlers: FlowHandlers) {
  const [target, setTarget] = useState<TipTarget | null>(null);
  const [open, setOpen] = useState(false);
  const [chosen, setChosen] = useState<number | null>(DEFAULT_QUICK_KOBO);
  const [typed, setTyped] = useState('');
  const [note, setNote] = useState('');
  const amountKobo = amountOf(chosen, typed);
  const trimmed = note.trim();

  const engine: Engine<TipQuote, Tip> = {
    scope: `tip:${target?.wawuId ?? ''}:${amountKobo ?? 0}:${trimmed}`,
    ask: () => {
      if (!target || amountKobo === null) return Promise.reject(new Error('nothing to quote'));
      return askTipQuote({ creatorWawuId: target.wawuId, amountKobo });
    },
    send: (quote, key, pin) =>
      sendTip({
        creatorWawuId: quote.creator.wawuUserId,
        amountKobo: quote.amountKobo,
        note: trimmed,
        expectedTotalKobo: quote.payment.totalKobo,
        quoteToken: quote.payment.quoteToken,
        key,
        pin,
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

  // The breakdown follows the amount: a quick amount is asked at once, a typed one after a short rest.
  const settled = open && flow.stage === null;
  useEffect(() => {
    if (!settled || amountKobo === null) return undefined;
    const timer = setTimeout(() => void ask(), typed.trim() ? TYPING_REST_MS : 0);
    return () => clearTimeout(timer);
  }, [settled, amountKobo, typed, ask]);

  const quote = flow.quote && flow.quote.amountKobo === amountKobo ? flow.quote : null;
  const balance = useQuery({ ...walletBalanceQuery, enabled: Boolean(open && quote && quote.payment.balanceKobo === null) });
  const balanceKobo = flow.shortOf ?? quote?.payment.balanceKobo ?? balance.data?.availableKobo ?? null;

  const begin = useCallback((who: TipTarget) => {
    setTarget(who);
    setChosen(DEFAULT_QUICK_KOBO);
    setTyped('');
    setNote('');
    setOpen(true);
  }, []);

  const close = () => {
    flow.finish();
    setOpen(false);
  };

  return {
    target,
    /** H26 and everything over it is up. */
    open,
    begin,
    close,
    chosen,
    typed,
    note,
    amountKobo,
    /** Pick a quick amount (clears what was typed). */
    pick: (kobo: number) => {
      setChosen(kobo);
      setTyped('');
    },
    /** Type another amount (digits only; clears the quick amount). */
    type: (text: string) => {
      setTyped(cleanAmountText(text));
      setChosen(null);
    },
    setNote: (text: string) => setNote(text.slice(0, NOTE_MAX)),
    /** The Hub's quote for THIS amount, or null while it is on its way. */
    quote,
    fees: quote ? feeLines(quote.payment.fee) : [],
    balanceKobo,
    flow,
  };
}

export type TipState = ReturnType<typeof useTip>;
