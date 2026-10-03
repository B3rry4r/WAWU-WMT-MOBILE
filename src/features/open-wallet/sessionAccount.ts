import { useEffect, useState } from 'react';

import { getAccessToken, useSession } from '@/api/session';

/**
 * Whose session this is, as far as A26 needs to know: the `sub` claim of the
 * access token the app holds (WAWU ID's account id, which the Hub answers as
 * `wawuUserId`). Read, never verified: the Hub verifies the token on every
 * call. A26 compares it with each account read and shows only the signed-in
 * account's own data, whatever the shared query cache holds (FIX-04 clears
 * that cache app-wide).
 */
export function accountOfToken(token: string | null): string | null {
  const payload = token?.split('.')[1];
  if (!payload) return null;
  try {
    const json = globalThis.atob(payload.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(payload.length / 4) * 4, '='));
    const sub = (JSON.parse(json) as { sub?: unknown }).sub;
    return typeof sub === 'string' && sub.length > 0 ? sub : null;
  } catch {
    return null;
  }
}

/**
 * The signed-in account id, or null while it is being read or when signed
 * out. Read again when the session changes and when `shown` (the account a
 * screen is about to show) changes, so a new sign-in is never compared with
 * the one before it.
 */
export function useSessionAccount(shown: string | undefined): string | null {
  const { status } = useSession();
  const [account, setAccount] = useState<{ status: string; sub: string | null } | null>(null);
  useEffect(() => {
    let current = true;
    if (status !== 'signedIn') return undefined;
    void getAccessToken().then((token) => {
      if (current) setAccount({ status, sub: accountOfToken(token) });
    });
    return () => {
      current = false;
    };
  }, [status, shown]);
  return status === 'signedIn' && account?.status === 'signedIn' ? account.sub : null;
}
