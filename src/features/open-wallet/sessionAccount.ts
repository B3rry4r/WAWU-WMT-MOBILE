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
  const json = payloadOf(token);
  if (json === null) return null;
  try {
    const claims: unknown = JSON.parse(json);
    const sub = typeof claims === 'object' && claims !== null ? (claims as { sub?: unknown }).sub : undefined;
    return typeof sub === 'string' && sub.length > 0 ? sub : null;
  } catch {
    return null;
  }
}

/** base64url: the JWT alphabet, `-` and `_` in place of `+` and `/`, padding optional. */
const BASE64URL = /^[A-Za-z0-9_-]+={0,2}$/;

/**
 * The token's middle part as text: base64url (RFC 7515 section 2), padding
 * added back where it was left off, then the bytes read as UTF-8, so a name
 * such as "Ngozi Ọ̀kọ̀" in the claims comes through whole. Null for anything
 * that is not a three-part token with a readable middle.
 */
function payloadOf(token: string | null): string | null {
  const parts = token?.split('.');
  if (!parts || parts.length !== 3 || !BASE64URL.test(parts[1])) return null;
  const bare = parts[1].replace(/=+$/, '');
  if (bare.length % 4 === 1) return null;
  try {
    const bytes = globalThis.atob(bare.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(bare.length / 4) * 4, '='));
    // Each byte as %XX, then decodeURIComponent reads them as UTF-8 (and throws on bytes that are not).
    let escaped = '';
    for (let i = 0; i < bytes.length; i += 1) escaped += `%${bytes.charCodeAt(i).toString(16).padStart(2, '0')}`;
    return decodeURIComponent(escaped);
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
