import { router, usePathname, type Href } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { useSession } from '@/api/session';

/**
 * R-127, WEBAPP-03: a signed-out visitor to a link (a piece, a profile, a room, a receipt) is sent to the welcome screen, and
 * after signing in lands back on that page (until now only `/r/<code>` was kept). The browser address the visitor arrived on is
 * read once, before the router moves them; it is held for the tab (sessionStorage, so a refresh in the middle of sign-in keeps it)
 * and used once, when the person first reaches Home signed in.
 */
const KEY = 'wmt.returnPath';
const MAX_LENGTH = 500;

/** Paths that are the signed-out set, the public pages, or links that look after themselves: never a place to return to. */
const NOT_A_PLACE = [
  '/', '/welcome', '/account-type', '/sign-up', '/phone-code', '/sign-in', '/forgot-password', '/reset-password', '/email-code',
  '/about', '/terms', '/privacy-policy', '/legal-documents', '/r', '/claim-code', '/activate', '/selfie', '/dev', '/preview', '/suspended',
];

/** The path worth returning to, or null: an in-app path (one leading slash), not one of the signed-out screens. */
export function returnableTarget(path: string | null | undefined): string | null {
  if (!path || path.length > MAX_LENGTH || !path.startsWith('/') || path.startsWith('//') || path.includes('\\')) return null;
  const bare = path.split(/[?#]/)[0].replace(/\/+$/, '') || '/';
  if (NOT_A_PLACE.some((p) => bare === p || (p !== '/' && bare.startsWith(`${p}/`)))) return null;
  return path;
}

let landed: string | null = null;
let armed = false;

const store = {
  read(): string | null {
    try {
      return typeof sessionStorage === 'undefined' ? landed : sessionStorage.getItem(KEY);
    } catch {
      return landed;
    }
  },
  write(value: string | null): void {
    landed = value;
    try {
      if (typeof sessionStorage === 'undefined') return;
      if (value === null) sessionStorage.removeItem(KEY);
      else sessionStorage.setItem(KEY, value);
    } catch {
      // A browser that refuses storage keeps the path for this page load only.
    }
  },
};

/** Reads the address the browser opened on. Called once, when the app's code loads (before any screen draws); web only. */
export function captureLandingPath(location: Pick<Location, 'pathname' | 'search'> | undefined = typeof window === 'undefined' ? undefined : window.location): void {
  if (Platform.OS !== 'web' || !location) return;
  const target = returnableTarget(`${location.pathname}${location.search}`);
  // A later page load with no link of its own keeps what an earlier one found, so sign-in's own redirects do not wipe it.
  if (target) store.write(target);
}

/** What the visitor's session start decided: signed out keeps the path for after sign-in, signed in has no use for it. */
export function settleReturnPath(status: 'restoring' | 'signedIn' | 'signedOut'): void {
  if (status === 'restoring' || armed) return;
  armed = true;
  if (status === 'signedIn') store.write(null);
}

/** The path to return to, taken once (it is forgotten as it is read), or null. */
export function takeReturnPath(): string | null {
  const target = returnableTarget(store.read());
  store.write(null);
  return target;
}

export function resetReturnPathForTests(): void {
  landed = null;
  armed = false;
  store.write(null);
}

/** Mounted once under the root layout: on the web, a visitor who arrived signed out is taken to their page the first time they reach Home signed in. */
export function useReturnAfterSignIn(): void {
  const { status } = useSession();
  const pathname = usePathname();
  const done = useRef(false);
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    settleReturnPath(status);
  }, [status]);
  useEffect(() => {
    if (Platform.OS !== 'web' || done.current || status !== 'signedIn' || !armed || pathname !== '/') return;
    const target = takeReturnPath();
    done.current = true;
    if (target) router.replace(target as Href);
  }, [status, pathname]);
}
