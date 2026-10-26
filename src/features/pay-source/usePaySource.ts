import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  choosePaySource,
  clearPaySource,
  paySourceHasNaira,
  resetPaySource,
  setPaySourceDefaults,
  usePaySourceCode,
} from '@/api/paySource';
import { onSessionEnd } from '@/api/session';
import type { PaySource } from '@/components/pay-sheet';
import type { PaymentQuote } from '@/features/events/buyApi';
import { fetchWalletHome } from '@/features/wallet/api/home';
import { fetchWorldAccounts, WORLD_ACCOUNTS_KEY, type WorldAccount } from '@/features/wallet/world/api';

/**
 * Paying from the account that holds the money (PAY-FX, R-91): ONE hook every caller of the pay sheet uses, so the rule is written
 * once. The rule: the naira wallet pays when it holds enough; when it does not (or the person has no naira wallet at all, R-87),
 * their main currency pays; every other account they hold is offered. The Hub does the converting: the quote it gives for the
 * chosen account (`payment.source`) is the firm amount, and the account is named to every paying route by `choosePaySource`
 * (`src/api/paySource.ts`), which `client.ts` puts on the request. A person with only a naira wallet gets `undefined` here and
 * the sheet they have always had.
 *
 * `requote` is the caller's own way to get its quote again (its flow's `ask`): it runs when the chosen account changes and when a
 * firm quote has run out. Codes, places and amounts all come from the Hub; no currency list, rate or fee is kept in the app.
 */
export function usePaySource(args: {
  /** The payment quote on the sheet, or null before there is one. */
  payment: PaymentQuote | null;
  /** Whether the pay sheet is open. */
  open: boolean;
  /** Ask the Hub for this payment's quote again, with the account now chosen. */
  requote: () => unknown;
}): PaySource | undefined {
  const { payment, open, requote } = args;
  const code = usePaySourceCode();
  const live = useRef(requote);
  useEffect(() => {
    live.current = requote;
  });

  // The person's other accounts: asked only while the sheet is open. A Hub that does not serve them (no foreign accounts) is "none".
  const accountsQuery = useQuery({
    queryKey: WORLD_ACCOUNTS_KEY,
    queryFn: fetchWorldAccounts,
    enabled: open,
    staleTime: 30_000,
    retry: false,
  });
  const accounts = useMemo(
    () => (accountsQuery.data ?? []).filter((a: WorldAccount) => a.status === 'open' && a.chain === null),
    [accountsQuery.data],
  );
  const main = accounts[0]?.currency ?? null;

  // The naira wallet could not cover it: the main currency pays, once per sheet.
  const switched = useRef(false);
  useEffect(() => {
    if (!open) {
      switched.current = false;
      return;
    }
    const short = payment?.shortfallKobo ?? 0;
    if (!switched.current && code === null && payment && payment.balanceKobo !== null && short > 0 && main !== null) {
      switched.current = true;
      choosePaySource(main);
    }
  }, [open, code, payment, main]);

  // A different account was chosen: ask for the quote against it. (The quote on screen names the account it was made for.)
  const asked = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    if (!open) {
      asked.current = undefined;
      return;
    }
    const shown = payment?.source?.currency ?? null;
    if (payment && asked.current !== code && shown !== code) {
      asked.current = code;
      void live.current();
    } else if (payment && shown === code) {
      asked.current = code;
    }
  }, [open, code, payment]);

  // The sheet closed (or its screen went away): the next payment starts from the default again.
  useEffect(() => {
    if (!open) resetPaySource();
  }, [open]);
  useEffect(() => () => resetPaySource(), []);

  // A firm quote is only good until the provider's own expiry.
  const expiresAt = payment?.source ? Date.parse(payment.source.expiresAt) : null;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (expiresAt === null || Number.isNaN(expiresAt)) return undefined;
    const timer = setTimeout(() => setNow(Date.now()), Math.max(0, expiresAt - Date.now()) + 1);
    return () => clearTimeout(timer);
  }, [expiresAt]);
  const expired = expiresAt !== null && !Number.isNaN(expiresAt) && now >= expiresAt;

  const source = payment?.source;
  const hasNaira = paySourceHasNaira();
  const choices = useMemo(
    () => [
      ...(hasNaira ? [{ id: 'NGN', label: 'Naira wallet', selected: code === null }] : []),
      ...accounts.map((a) => ({ id: a.currency, label: `${a.currency} account`, selected: code === a.currency })),
    ],
    [hasNaira, accounts, code],
  );

  if (!source || code === null) return undefined;
  return {
    currency: source.currency,
    accountName: `${source.currency} account`,
    decimals: source.decimals,
    amountMinor: source.amountMinor,
    providerFeeMinor: source.providerFeeMinor,
    wawuFeeMinor: source.wawuFeeMinor,
    availableMinor: source.availableMinor,
    expired,
    choices,
    onChoose: (id: string) => choosePaySource(id === 'NGN' ? null : id),
    onRefresh: () => {
      void live.current();
    },
  };
}

/**
 * Once a person is in the app: whose money is where decides where a payment starts. A person with no naira wallet (R-87) starts
 * from their main currency; everyone else from naira. Read from the Hub's wallet and accounts, never assumed.
 */
export function useDefaultPaySource(active: boolean): void {
  useEffect(() => onSessionEnd(clearPaySource), []);
  useEffect(() => {
    if (!active) return undefined;
    let current = true;
    void (async () => {
      try {
        const home = await fetchWalletHome();
        const hasNaira = home.account !== null;
        let fallback: string | null = null;
        if (!hasNaira && home.world) {
          fallback = home.world.firstCurrency ?? (await fetchWorldAccounts())[0]?.currency ?? null;
        }
        if (current) setPaySourceDefaults({ fallback, hasNaira });
      } catch {
        // No wallet yet, or the Hub did not answer: the naira way, as always.
      }
    })();
    return () => {
      current = false;
    };
  }, [active]);
}
