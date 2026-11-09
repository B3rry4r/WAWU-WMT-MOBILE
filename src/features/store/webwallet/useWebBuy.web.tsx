import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { walletBalanceQuery } from '@/api/money';
import { queryClient } from '@/api/query';
import { PaySheet } from '@/components/pay-sheet';
import { PAYMENT_UNANSWERED_LINE } from '@/components/pin-sheet';
import { PayPinSheet } from '@/features/device-approval';
import { feeLines, PRICE_CHANGED_LINE } from '@/features/events/buyModel';
import { usePaymentFlow, type Engine } from '@/features/feedpay/usePaymentFlow';
import { addMoneyHref } from '@/features/addmoney/entry';
import { OPEN_WALLET_PIN_PATH, useOpenWalletEntry } from '@/features/open-wallet/entry';
import { WALLET_NAME, PRICE_MOVED_TITLE } from '@/features/unlock/model';

import type { StorePurchaseView } from '../api';
import type { Said } from '../words';
import type { WebBuy, WebTarget } from './webBuyTypes';
import { askWebQuote, readWebPurchase, scopeOf, sendWebPayment, webPurchaseKey, type WebBuySpec, type WebQuote, type WebView } from './api';

/**
 * Paying for what the phone sells through the stores, from the wallet, on the web build (WEBAPP-06, R-128). It is the feed's own payment flow
 * (`usePaymentFlow`): a FRESH quote on every tap of Pay, the PIN, one `Idempotency-Key` per attempt that outlives the sheet, and a payment the Hub
 * has taken and not finished is only ever read, never paid again. `begin` opens the pay sheet; when the Hub says paid, `granted` is set (the same
 * shape the store screens already read, built from what the item gives), so every screen's own "it worked" view draws.
 */
type Target = WebTarget;

export function useWebBuy(): WebBuy {
  const router = useRouter();
  const entry = useOpenWalletEntry();
  const [target, setTarget] = useState<Target | null>(null);
  const live = useRef<Target | null>(null);

  const engine: Engine<WebQuote, WebView> = {
    scope: scopeOf(target?.spec ?? null),
    ask: () => (live.current ? askWebQuote(live.current.spec, live.current.title) : Promise.reject(new Error('nothing to buy'))),
    send: (quote, key, credential) => (live.current ? sendWebPayment(live.current.spec, quote, key, credential) : Promise.resolve({ kind: 'unanswered' as const })),
    read: (id) => readWebPurchase(live.current?.spec as WebBuySpec, id),
    readKey: (id) => webPurchaseKey(live.current?.spec ?? null, id),
    shortLine: 'There is not enough in your wallet for this.',
  };
  const flow = usePaymentFlow(engine, {
    onOpenWallet: entry.open,
    onSetPin: () => router.push(OPEN_WALLET_PIN_PATH),
    onForgotPin: () => router.push('/reset-pin'),
    onAddMoney: (short) => router.push(addMoneyHref(short)),
  });
  const { open, finish } = flow;

  const begin = useCallback<WebBuy['begin']>(
    (spec, title, grants, verb) => {
      const next = { spec, title, grants: grants ?? null, verb: verb ?? 'Buy' };
      live.current = next;
      setTarget(next);
      void open();
    },
    [open],
  );
  const clear = useCallback(() => {
    finish();
    live.current = null;
    setTarget(null);
  }, [finish]);

  const paid = flow.stage === 'paid' && flow.view && target ? flow.view : null;
  const granted = paid && target
    ? ({ id: paid.id, platform: 'web', storeProductId: target.spec.kind, kind: target.spec.kind === 'pass' ? 'pass' : target.spec.kind === 'credits' ? 'credits' : target.spec.kind === 'points_pack' ? 'points' : target.spec.kind === 'extra_products' ? 'extra_products' : 'tier', status: 'granted', alreadyGranted: false, grant: target.grants ?? {}, purchasedAt: new Date().toISOString(), expiresAt: null, flag: null } as unknown as StorePurchaseView)
    : null;

  // WEBAPP-08 F8: what a grant changes (the credits count, the tier, the points, the rooms) is read from the Hub again the moment the Hub says paid, as the phone's store path does.
  const grantedId = granted?.id ?? null;
  useEffect(() => {
    if (grantedId) void queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] !== 'store' || q.queryKey[1] === 'credits' });
  }, [grantedId]);

  const said: Said | null = flow.notice !== null && !flow.payOpen ? { tone: 'danger', line: flow.notice } : null;
  const busy = flow.asking || flow.payOpen || flow.pinOpen;

  return {
    busy,
    said,
    granted,
    begin,
    clear,
    sheets: <WebBuySheets flow={flow} title={target?.title ?? ''} verb={target?.verb ?? 'Buy'} onAddMoney={(short) => {
      // WEBAPP-08 F7: the pay sheet closes as the person is sent to Add money, so it never sits over the account number.
      flow.cancel();
      router.push(addMoneyHref(short));
    }} onOpenWallet={entry.open} onForgotPin={() => router.push('/reset-pin')} />,
  };
}

type Flow = ReturnType<typeof usePaymentFlow<WebQuote, WebView>>;

/** The pay sheet (the shared one: the item, the price, the bank's charge, the total, "Not enough" with the shortfall and Add) and the PIN sheet. */
function WebBuySheets({ flow, title, verb, onAddMoney, onOpenWallet, onForgotPin }: { flow: Flow; title: string; verb: string; onAddMoney: (shortfallKobo: number) => void; onOpenWallet: () => void; onForgotPin: () => void }) {
  const quote = flow.quote;
  const balance = useQuery({ ...walletBalanceQuery, enabled: Boolean(flow.payOpen && quote && quote.payment.balanceKobo === null) });
  if (!quote || !flow.payOpen) return null;
  const balanceKobo = flow.shortOf ?? quote.payment.balanceKobo ?? balance.data?.availableKobo ?? null;
  const status =
    flow.notice !== null && flow.status.kind === 'review'
      ? ({
          kind: 'blocked',
          title: flow.notice === PRICE_CHANGED_LINE ? PRICE_MOVED_TITLE : "Couldn't check the price",
          message: flow.notice === PRICE_CHANGED_LINE ? 'Check the new total before you pay.' : flow.notice,
          tryAgain: true,
        } as const)
      : flow.status;
  return (
    <>
      <PaySheet
        visible={!flow.pinOpen}
        item={{ title }}
        amountKobo={quote.payment.priceKobo}
        fees={feeLines(quote.payment.fee)}
        wallet={balanceKobo === null ? { kind: 'loading' } : { kind: 'open', balanceKobo }}
        walletName={WALLET_NAME}
        actionLabel={verb}
        status={status}
        onPay={flow.pay}
        onAddMoney={onAddMoney}
        onCancel={flow.cancel}
        onOpenWallet={onOpenWallet}
        onRetry={() => {
          flow.clearNotice();
          flow.setStatus({ kind: 'review' });
        }}
        onRefresh={flow.refresh}
      />
      <PayPinSheet
        visible={flow.pinOpen}
        onClose={flow.closePin}
        approval={{ totalKobo: quote.payment.totalKobo, payee: title }}
        run={flow.run}
        unansweredLine={PAYMENT_UNANSWERED_LINE}
        onForgotPin={() => {
          flow.closePin();
          onForgotPin();
        }}
        lockedUntil={flow.lockedUntil}
      />
    </>
  );
}
