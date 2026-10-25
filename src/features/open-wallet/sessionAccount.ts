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

/**
 * The first and last name the access token carries (WAWU ID puts the account's name in it, SIGNUP-NAMES, R-82): what "Confirm
 * your details" starts with. Null when the token has neither part. Read, never verified.
 */
export function namesOfToken(token: string | null): { firstName: string; lastName: string } | null {
  const json = payloadOf(token);
  if (json === null) return null;
  try {
    const claims: unknown = JSON.parse(json);
    if (typeof claims !== 'object' || claims === null) return null;
    const part = (value: unknown) => (typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '');
    const firstName = part((claims as { firstName?: unknown }).firstName);
    const lastName = part((claims as { lastName?: unknown }).lastName);
    return firstName || lastName ? { firstName, lastName } : null;
  } catch {
    return null;
  }
}

/**
 * The country of residence the account carries (WAWU ID's `countryCode` claim, ISO 3166-1 alpha-2, upper case), or null
 * when the token has none. It decides which opening a person may start (WALLET-41 round 1): the Hub reads the same claim.
 * Read, never verified.
 */
export function countryCodeOfToken(token: string | null): string | null {
  const json = payloadOf(token);
  if (json === null) return null;
  try {
    const claims: unknown = JSON.parse(json);
    const raw = typeof claims === 'object' && claims !== null ? (claims as { countryCode?: unknown }).countryCode : undefined;
    const code = typeof raw === 'string' ? raw.trim().toUpperCase() : '';
    return /^[A-Z]{2}$/.test(code) ? code : null;
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

/** The signed-in account's own name, or null while it is being read or when the account has none. */
export function useAccountNames(): { firstName: string; lastName: string } | null {
  const { status } = useSession();
  const [names, setNames] = useState<{ firstName: string; lastName: string } | null>(null);
  useEffect(() => {
    let current = true;
    if (status !== 'signedIn') return undefined;
    void getAccessToken().then((token) => {
      if (current) setNames(namesOfToken(token));
    });
    return () => {
      current = false;
    };
  }, [status]);
  return status === 'signedIn' ? names : null;
}

/** The account's country of residence: undefined while the token is being read, null when the account has none. */
export function useAccountCountry(): string | null | undefined {
  const { status } = useSession();
  const [country, setCountry] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    let current = true;
    if (status !== 'signedIn') return undefined;
    void getAccessToken().then((token) => {
      if (current) setCountry(countryCodeOfToken(token));
    });
    return () => {
      current = false;
    };
  }, [status]);
  return status === 'signedIn' ? country : undefined;
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
