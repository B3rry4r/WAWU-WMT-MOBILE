import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';

import { queryClient } from '@/api/query';
import { deleteLast, koboOfText, pressKey } from '@/components/amount-entry';
import { PAYMENT_UNANSWERED_LINE } from '@/components/pin-sheet';
import { LoadingView, SkeletonRows } from '@/components/Skeleton';
import { notApproved, PayPinSheet, type Credential, type Settled } from '@/features/device-approval';
import { isNoWallet, useOpenWalletEntry } from '@/features/open-wallet/entry';
import { useSessionAccount } from '@/features/open-wallet/sessionAccount';
import { newRequestKey } from '@/features/wallet/api/settings';

import { banksQuery, corridorsQuery, recipientsQuery, requestQuote, saveRecipient, sendAbroad, sendQuery, sourcesQuery, type Refusal } from './api';
import { approvalPurpose, isSettled, type Quote, type Recipient, type Source } from './model';
import { NewRecipientView, type BanksRead } from './NewRecipientView';
import { AbroadAmountView, AbroadHomeView, AbroadReceiptView, AbroadReviewView, type QuoteRead, type Read } from './views';

/** Reads a query into the shape the views take; a wallet-less person is led to Open your wallet once. */
function useRead<T>(query: { data: T | undefined; isPending: boolean; isError: boolean; error: unknown; refetch: () => unknown }): Read<T> {
  const entry = useOpenWalletEntry();
  const led = useRef(false);
  const noWallet = query.isError && isNoWallet(query.error);
  useEffect(() => {
    if (noWallet && !led.current) {
      led.current = true;
      entry.open();
    }
  }, [noWallet, entry]);
  return {
    data: query.data,
    loading: query.isPending && !query.isError,
    failed: query.isError && !noWallet,
    retry: () => void query.refetch(),
  };
}

export function AbroadHomeScreen(props: { onBack: () => void; onNew: () => void; onPick: (r: Recipient) => void }) {
  const owner = useSessionAccount(undefined);
  const recipients = useRead<Recipient[]>(useQuery(recipientsQuery(owner), queryClient));
  return <AbroadHomeView recipients={recipients} {...props} />;
}

export function NewRecipientScreen(props: { onBack: () => void; onSaved: (r: Recipient) => void }) {
  const owner = useSessionAccount(undefined);
  const corridors = useQuery(corridorsQuery(owner), queryClient);
  const [saving, setSaving] = useState(false);
  const [refusal, setRefusal] = useState<Refusal | null>(null);
  const [unanswered, setUnanswered] = useState(false);

  // The hook the view calls for a bank directory: a query that runs only while its picker is in view.
  const useBanks = useCallback(
    (country: string, wanted: boolean): BanksRead => {
      // eslint-disable-next-line react-hooks/rules-of-hooks -- called once per render, in the same place, by the view
      const q = useQuery(banksQuery(owner, country, wanted && country !== ''), queryClient);
      return {
        data: q.data,
        loading: q.isPending && q.isFetching,
        failed: q.isError,
        retry: () => void q.refetch(),
      };
    },
    [owner],
  );

  if (!corridors.data)
    return (
      <LoadingView testID="abroad-corridors-loading">
        <SkeletonRows count={3} />
      </LoadingView>
    );
  return (
    <NewRecipientView
      corridors={corridors.data}
      useBanks={useBanks}
      saving={saving}
      refusal={refusal}
      unanswered={unanswered}
      onBack={props.onBack}
      onSave={(input) => {
        setSaving(true);
        setRefusal(null);
        setUnanswered(false);
        void saveRecipient({
          country: input.country,
          method: input.method,
          holderName: input.holderName,
          fields: input.fields,
          ...(input.scheme ? { scheme: input.scheme } : {}),
        }).then((result) => {
          setSaving(false);
          if (result.kind === 'done') {
            void queryClient.invalidateQueries({
              queryKey: ['money', 'abroad', 'recipients'],
            });
            props.onSaved(result.value);
          } else if (result.kind === 'refused') setRefusal(result.refusal);
          else setUnanswered(true);
        });
      }}
    />
  );
}

/** How long the typing rests before the Hub is asked for a quote. */
const QUOTE_SETTLE_MS = 500;

export function AbroadAmountScreen(props: { recipientId: string; onBack: () => void; onContinue: (quote: Quote) => void }) {
  const owner = useSessionAccount(undefined);
  const recipients = useQuery(recipientsQuery(owner), queryClient);
  const sourcesQ = useQuery(sourcesQuery(owner), queryClient);
  const sources = useRead<Source[]>(sourcesQ);
  const recipient = recipients.data?.find((r) => r.id === props.recipientId);
  const [from, setFrom] = useState<string | null>(null);
  const [side, setSide] = useState<'send' | 'receive'>('send');
  const [text, setText] = useState('');
  // What the Hub answered, and for which amount: an answer for another amount is never shown (Continue would carry it).
  const [held, setHeld] = useState<{ key: string; result: QuoteRead } | null>(null);
  const asked = useRef(0);

  const fromCurrency = from ?? sources.data?.find((s) => s.currency === 'NGN')?.currency ?? sources.data?.[0]?.currency ?? 'NGN';
  const amountMinor = koboOfText(text);
  const key = `${fromCurrency}|${side}|${amountMinor}`;
  const quote: QuoteRead = amountMinor <= 0 ? { state: 'idle' } : held?.key === key ? held.result : { state: 'loading' };

  useEffect(() => {
    if (!recipient || !sources.data || amountMinor <= 0) return;
    const mine = ++asked.current;
    const timer = setTimeout(() => {
      void requestQuote({ recipientId: recipient.id, fromCurrency, amountMinor, side }).then((r) => {
        if (mine !== asked.current) return;
        setHeld({
          key,
          result:
            r.kind === 'done'
              ? { state: 'ready', quote: r.value }
              : r.kind === 'refused'
                ? { state: 'refused', refusal: r.refusal }
                : { state: 'unanswered' },
        });
      });
    }, QUOTE_SETTLE_MS);
    return () => clearTimeout(timer);
  }, [recipient, sources.data, fromCurrency, amountMinor, side, key]);

  const failedRecipients: Read<Recipient[]> = { data: undefined, loading: false, failed: true, retry: () => void recipients.refetch() };
  if (!recipient)
    return recipients.isError ? (
      <AbroadHomeView recipients={failedRecipients} onBack={props.onBack} onNew={props.onBack} onPick={() => props.onBack()} />
    ) : (
      <LoadingView testID="abroad-amount-loading">
        <SkeletonRows count={3} />
      </LoadingView>
    );
  return (
    <AbroadAmountView
      recipient={recipient}
      sources={sources}
      fromCurrency={fromCurrency}
      onFromCurrency={(c) => setFrom(c)}
      side={side}
      onSide={(s) => {
        setSide(s);
        setText('');
      }}
      text={text}
      amountMinor={amountMinor}
      onKey={(k) => setText((t) => pressKey(t, k))}
      onDelete={() => setText((t) => deleteLast(t))}
      onClear={() => setText('')}
      quote={quote}
      onBack={props.onBack}
      onContinue={() => quote.state === 'ready' && props.onContinue(quote.quote)}
    />
  );
}

export function AbroadReviewScreen(props: {
  quote: Quote;
  onBack: () => void;
  onSent: (id: string) => void;
  onNewQuote: () => void;
  onForgotPin: () => void;
  onSetPin: () => void;
}) {
  const { quote } = props;
  const owner = useSessionAccount(undefined);
  const entry = useOpenWalletEntry();
  const recipients = useQuery(recipientsQuery(owner), queryClient);
  const recipient = recipients.data?.find((r) => r.id === quote.recipientId);
  const key = useRef(newRequestKey());
  const [narration, setNarration] = useState('');
  const [pinOpen, setPinOpen] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [lockedUntil, setLockedUntil] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const secondsLeft = Math.max(0, Math.floor((Date.parse(quote.expiresAt) - now) / 1000));

  /** Sends with the PIN, or with the phone's approval of exactly this request: one path for both. The key is kept across tries. */
  const run = async (credential: Credential): Promise<Settled> => {
    setWaiting(true);
    let outcome;
    try {
      outcome = await sendAbroad({
        quoteId: quote.id,
        narration,
        key: key.current,
        ...credential,
      });
    } finally {
      setWaiting(false);
    }
    switch (outcome.kind) {
      case 'pin_incorrect':
        return { code: 'pin_incorrect', triesLeft: outcome.triesLeft };
      case 'pin_locked':
        setLockedUntil(outcome.lockedUntil);
        return { code: 'pin_locked', lockedUntil: outcome.lockedUntil };
      case 'unanswered':
        return { code: 'unanswered' };
      case 'approval_cancelled':
        return notApproved('cancelled', true, () => undefined);
      case 'approval_failed':
        return notApproved('failed', true, () => undefined);
      case 'done':
        setPinOpen(false);
        props.onSent(outcome.send.id);
        return { code: 'approved' };
      case 'pin_not_set':
        setPinOpen(false);
        props.onSetPin();
        return { code: 'approved' };
      case 'no_wallet':
        setPinOpen(false);
        entry.open();
        return { code: 'approved' };
      case 'quote_expired':
      case 'insufficient_funds':
        // Nothing moved: the key is spent on nothing, and a fresh quote is a fresh intent.
        key.current = newRequestKey();
        setPinOpen(false);
        setFailure(outcome.message);
        return { code: 'approved' };
      case 'refused':
        key.current = newRequestKey();
        setPinOpen(false);
        setFailure(outcome.message);
        return { code: 'approved' };
    }
  };

  if (!recipient)
    return (
      <LoadingView testID="abroad-review-loading">
        <SkeletonRows count={3} />
      </LoadingView>
    );
  return (
    <>
      <AbroadReviewView
        recipient={recipient}
        quote={quote}
        narration={narration}
        onNarration={setNarration}
        secondsLeft={secondsLeft}
        notice={notice}
        failure={failure}
        waiting={waiting}
        onBack={props.onBack}
        onSend={() => {
          setFailure(null);
          setNotice(null);
          setPinOpen(true);
        }}
        onNewQuote={props.onNewQuote}
      />
      <PayPinSheet
        visible={pinOpen}
        onClose={() => setPinOpen(false)}
        approval={{ purpose: approvalPurpose(quote, recipient) }}
        run={run}
        unansweredLine={PAYMENT_UNANSWERED_LINE}
        onForgotPin={() => {
          setPinOpen(false);
          props.onForgotPin();
        }}
        lockedUntil={lockedUntil}
      />
    </>
  );
}

/** How often a send the partner has not finished is read again (our record, never the partner). */
const POLL_MS = 4000;

export function AbroadReceiptScreen(props: { id: string; onDone: () => void; onAgain: () => void }) {
  const owner = useSessionAccount(undefined);
  const q = useQuery(
    {
      ...sendQuery(owner, props.id),
      refetchInterval: (query) => (query.state.data && isSettled(query.state.data.status) ? false : POLL_MS),
    },
    queryClient,
  );
  return (
    <AbroadReceiptView
      send={q.data}
      loading={q.isPending && !q.isError}
      failed={q.isError}
      retry={() => void q.refetch()}
      onDone={props.onDone}
      onAgain={props.onAgain}
    />
  );
}
