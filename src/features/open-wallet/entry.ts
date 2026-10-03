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
 */
export const OPEN_WALLET_PATH = '/open-wallet' as const;

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
