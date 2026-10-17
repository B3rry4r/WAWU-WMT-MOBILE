/**
 * The addresses WAWU shares and receives (LINKS-01). One place, so the app, the
 * website and the phone's link settings cannot drift apart.
 *
 * An app link is an https address on wawuafrica.com that this app opens when it is
 * installed. Two exist, and only these two (the website lists exactly the same
 * paths in `/.well-known/apple-app-site-association`; `app.json` registers them
 * as the `associatedDomains` entry and the Android `intentFilters`, and a spec
 * checks that it does):
 *
 *   /r/<code>   an invite, as a person shares it (REF-03 claims the code)
 *   /selfie     where Nuvion's hosted selfie page sends a person back to
 *
 * Without the app installed the website shows a small "Open in the WAWU app" page
 * for each. `/join` is the registration campaign and is never one of these.
 */

/** The website's host and origin. The only host an app link may be on. */
export const LINK_HOST = 'wawuafrica.com';
export const LINK_ORIGIN = `https://${LINK_HOST}`;

/** The path every invite lives under, with its closing slash: `/r/<code>`. */
export const INVITE_PATH_PREFIX = '/r/';

/** Where the hosted selfie page returns to. Its own path: never `/join`. */
export const SELFIE_PATH = '/selfie';

/**
 * An invite as it is shared: `https://wawuafrica.com/r/<code>`, the code in lower case like the Hub writes it.
 * The Hub's own `link` field (`wawu/r/<code>`, no scheme) is not used: a chat app makes no link of it.
 */
export function inviteLink(code: string): string {
  return `${LINK_ORIGIN}${INVITE_PATH_PREFIX}${encodeURIComponent(code.trim().toLowerCase())}`;
}

/** A link as a person reads it on a card: no scheme (`wawuafrica.com/r/lennox`). */
export function readableLink(link: string): string {
  return link.replace(/^https?:\/\//i, '');
}

/** The address the hosted selfie page returns to. The Hub takes it only when `NUVION_LIVENESS_REDIRECT_ORIGINS` lists it. */
export function selfieReturnUrl(): string {
  return `${LINK_ORIGIN}${SELFIE_PATH}`;
}
