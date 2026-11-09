import { Platform } from 'react-native';

/**
 * WEBAPP-08 F5 (web only): what was typed on A3, kept in the tab's session storage so a refresh does not empty the form. It never holds the
 * password or the agreement tick. The sign-up waiting for its code is kept by `signupStore` (also session storage on the web); together a
 * refresh on A3 shows the typed details again and the link to the code that was already sent.
 */
export type SignupDraft = { firstName: string; lastName: string; username: string; email: string; phone: string; phoneCountry?: string; countryCode?: string };

export const SIGNUP_DRAFT_KEY = 'wmt.signupDraft';

const store = (): Storage | undefined => {
  if (Platform.OS !== 'web') return undefined;
  try {
    return globalThis.sessionStorage;
  } catch {
    return undefined;
  }
};

export function saveSignupDraft(values: SignupDraft): void {
  try {
    const { firstName, lastName, username, email, phone, phoneCountry, countryCode } = values;
    store()?.setItem(SIGNUP_DRAFT_KEY, JSON.stringify({ firstName, lastName, username, email, phone, phoneCountry, countryCode }));
  } catch {
    // A browser that refuses storage starts the form empty after a refresh, as before.
  }
}

export function readSignupDraft(): (Partial<SignupDraft> & { residence?: string }) | undefined {
  try {
    const raw = store()?.getItem(SIGNUP_DRAFT_KEY);
    if (!raw) return undefined;
    const v = JSON.parse(raw) as Record<string, unknown>;
    const text = (k: string) => (typeof v[k] === 'string' ? (v[k] as string) : undefined);
    return { firstName: text('firstName'), lastName: text('lastName'), username: text('username'), email: text('email'), phone: text('phone'), phoneCountry: text('phoneCountry'), residence: text('countryCode') };
  } catch {
    return undefined;
  }
}

export function clearSignupDraft(): void {
  try {
    store()?.removeItem(SIGNUP_DRAFT_KEY);
  } catch {
    // Nothing kept.
  }
}
