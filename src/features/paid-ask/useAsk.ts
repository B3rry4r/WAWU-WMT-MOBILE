import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';

import { walletBalanceQuery } from '@/api/money';
import type { AvatarHue } from '@/components/Avatar';
import { feeLines } from '@/features/events/buyModel';
import { usePaymentFlow, type Engine, type FlowHandlers, type ViewStatus } from '@/features/feedpay/usePaymentFlow';
import { newRequestKey } from '@/features/wallet/api/settings';

import { askQuestion, fetchQuestion, payQuestion, questionKey, requoteQuestion, type AskQuote, type QuestionView } from './api';

/** The creator being asked, as the screen that opened the sheet knows them. */
export type AskTarget = {
  wawuId: string;
  name: string | null;
  avatarUrl: string | null;
  hue: AvatarHue;
  /** The tick drawn after the name. */
  tick?: 'creator' | 'pro';
  /** The price and window the page showed, drawn on the sheet until the Hub's own quote arrives. */
  priceKobo: number | null;
  windowHours: number | null;
  /** Words to start the sheet with (Try again: the question that went unanswered). */
  text?: string;
};

/** How long typed words rest before the Hub is asked what the question costs. */
const TYPING_REST_MS = 700;

/** A question as the payment flow reads it: the Hub's own status folded into the flow's five, with the question kept. */
export type AskResult = {
  id: string;
  status: ViewStatus;
  statusMessage: string | null;
  payment: { status: string; delivered: boolean; failureReason: string | null };
  question: QuestionView;
};

export function toResult(q: QuestionView): AskResult {
  const status: ViewStatus =
    q.status === 'asked' || q.status === 'answered'
      ? 'paid'
      : q.status === 'unpaid' || q.status === 'pending'
        ? 'pending'
        : q.status === 'failed'
          ? 'failed'
          : q.status === 'reversed'
            ? 'reversed'
            : 'refunded';
  const p = q.payment;
  return { id: q.id, status, statusMessage: q.statusMessage, payment: { status: p?.status ?? 'pending', delivered: p?.delivered ?? false, failureReason: p?.failureReason ?? null }, question: q };
}

/**
 * Asking a creator a paid question from the wallet (INBOX-10): I3's sheet (the words, the window, the refund, the breakdown, Pay from
 * wallet), I6 when the wallet is short, W11's PIN, and the states between. One of these serves a screen: `begin(creator)` opens I3.
 *
 * The question is DRAFTED once for the words on the sheet (the Hub keeps the words until it is paid) and quoted again, fresh, on every
 * tap of Send (`usePaymentFlow`): a draft per rest in typing, never one per tap. Changed words are a new draft; the old one is never
 * paid. One `Idempotency-Key` per attempt, kept until the Hub decides, so a lost answer followed by a retry is one debit and one
 * question. A paid question ends the flow and tells the screen (`onAsked`), which opens the thread (I4).
 */
export function useAsk(handlers: FlowHandlers, onAsked: (wawuId: string, question: QuestionView) => void) {
  const [target, setTarget] = useState<AskTarget | null>(null);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const trimmed = text.trim();
  /** The draft the Hub holds for the words on the sheet. */
  const draft = useRef<{ words: string; id: string } | null>(null);

  const engine: Engine<AskQuote, AskResult> = {
    scope: `paid-question:${target?.wawuId ?? ''}:${trimmed}`,
    ask: async () => {
      if (!target || !trimmed) throw new Error('nothing to quote');
      const kept = draft.current;
      if (kept && kept.words === trimmed) return requoteQuestion(kept.id);
      const quote = await askQuestion({ creatorWawuId: target.wawuId, text: trimmed, key: newRequestKey() });
      draft.current = { words: trimmed, id: quote.question.id };
      return quote;
    },
    send: async (quote, key, pin) => {
      const outcome = await payQuestion({
        questionId: quote.question.id,
        expectedTotalKobo: quote.payment.totalKobo,
        quoteToken: quote.payment.quoteToken,
        key,
        pin,
      });
      return outcome.kind === 'done' ? { kind: 'done', view: toResult(outcome.view) } : outcome;
    },
    read: async (id) => toResult(await fetchQuestion(id)),
    readKey: questionKey,
    shortLine: 'There is not enough in your wallet for this question.',
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

  // The breakdown follows the words: asked once they have rested.
  const settled = open && flow.stage === null;
  useEffect(() => {
    if (!settled || !trimmed) return undefined;
    const timer = setTimeout(() => void ask(), TYPING_REST_MS);
    return () => clearTimeout(timer);
  }, [settled, trimmed, ask]);

  const quote = flow.quote && flow.quote.question.text === trimmed ? flow.quote : null;
  const balance = useQuery({ ...walletBalanceQuery, enabled: Boolean(open && quote && quote.payment.balanceKobo === null) });
  const balanceKobo = flow.shortOf ?? quote?.payment.balanceKobo ?? balance.data?.availableKobo ?? null;

  const begin = useCallback((who: AskTarget) => {
    setTarget(who);
    setText(who.text ?? '');
    draft.current = null;
    setOpen(true);
  }, []);

  const close = () => {
    flow.finish();
    setOpen(false);
  };

  // A paid question: the sheet is done, the screen opens the thread.
  const paid = flow.stage === 'paid' ? flow.view : null;
  const asked = useRef<string | null>(null);
  const finish = flow.finish;
  useEffect(() => {
    if (!paid || !target || asked.current === paid.id) return;
    asked.current = paid.id;
    const who = target.wawuId;
    finish();
    setOpen(false);
    draft.current = null;
    onAsked(who, paid.question);
  }, [paid, target, finish, onAsked]);

  return {
    target,
    /** I3 and everything over it is up. */
    open,
    begin,
    close,
    text,
    setText: (next: string) => setText(next.slice(0, MAX_QUESTION)),
    /** The Hub's quote for THESE words, or null while it is on its way. */
    quote,
    fees: quote ? feeLines(quote.payment.fee) : [],
    balanceKobo,
    flow,
  };
}

/** The longest question the Hub takes. */
export const MAX_QUESTION = 2000;

export type AskState = ReturnType<typeof useAsk>;
