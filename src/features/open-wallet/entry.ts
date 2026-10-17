import { useRouter } from 'expo-router';
import { useMemo } from 'react';

import { isApiError } from '@/api/errors';
import type { MoneyErrorCode } from '@/api/money';

/**
 * The way into Open your wallet (R-6) from anything that moves money. Nobody
 * has a wallet until they open one, and every money route answers that the
 * same way: `409 wallet_not_open` (MONEY-13, contract CONVENTIONS section 7).
 * A screen that pays hands its refusal to `leadIfNoWallet`; a screen that
 * already knows there is no wallet (the pay sheet's no-wallet state) calls
 * `open`. Both land on A26, the first step.
 *
 * Where it started is the screen under the flow: every step is pushed on top
 * of it, and nothing else is. So the end of the flow (A10's PIN set, or A8's
 * Done when a PIN was already set) dismisses every Open your wallet screen and
 * the person is back where they tapped (`useOpenWalletWay().leave`): the pay
 * sheet still open on its screen, or the Wallet tab, which then shows the open
 * wallet (W5, WALLET-01). Their money reads are asked again on the way out.
 */
export const OPEN_WALLET_PATH = '/open-wallet' as const;
/** A5, Confirm your details (KYC-03), pushed on top of A26 when a check passes. */
export const OPEN_WALLET_DETAILS_PATH = '/open-wallet-details' as const;
/** A6, the selfie, with A7 (matched, the account opening) and A16 (no match) as its states (KYC-03). */
export const OPEN_WALLET_SELFIE_PATH = '/open-wallet-selfie' as const;
/** A8, the account just opened (KYC-04): in place of every earlier step once the account is open. */
export const OPEN_WALLET_ACCOUNT_PATH = '/open-wallet-account' as const;
/** A9 and A10, creating the transaction PIN (KYC-04), pushed on top of A8. */
export const OPEN_WALLET_PIN_PATH = '/open-wallet-pin' as const;

const noWallet: MoneyErrorCode = 'wallet_not_open';

/** True for the money routes' "no wallet yet" answer. */
export function isNoWallet(error: unknown): boolean {
  return isApiError(error) && error.code === noWallet;
}

export type OpenWalletEntry = {
  /** Opens A26. */
  open: () => void;
  /** Opens A26 when `error` is "no wallet yet" and says so; leaves any other error to the caller. */
  leadIfNoWallet: (error: unknown) => boolean;
};

export function useOpenWalletEntry(): OpenWalletEntry {
  const router = useRouter();
  return useMemo(() => {
    const open = () => router.push(OPEN_WALLET_PATH);
    return {
      open,
      leadIfNoWallet: (error: unknown) => {
        if (!isNoWallet(error)) return false;
        open();
        return true;
      },
    };
  }, [router]);
}
/** A26, the ID document (KYC-06): the third step of the review opening, after the details and the selfie. */
export const OPEN_WALLET_ID_PATH = '/open-wallet-id' as const;
/** A27, the proof of address with the home address and Submit (KYC-06), pushed on top of A26. */
export const OPEN_WALLET_ADDRESS_PATH = '/open-wallet-address' as const;
/** A28, Checking your details (KYC-06): in place of A26 and A27 once the documents are sent. */
export const OPEN_WALLET_CHECKING_PATH = '/open-wallet-checking' as const;
/** A29, Rejected (KYC-06): the bank's reasons and what to fix, with Upload again. */
export const OPEN_WALLET_REJECTED_PATH = '/open-wallet-rejected' as const;
/**
 * The first step, opened on purpose to add the details again (KYC-06): a refusal or an expired opening asks for
 * them, and the first step is the one that collects them. `again` keeps it from sending the person straight back
 * to where the review stands.
 */
export const OPEN_WALLET_DETAILS_AGAIN = { pathname: OPEN_WALLET_PATH, params: { again: '1' } } as const;
