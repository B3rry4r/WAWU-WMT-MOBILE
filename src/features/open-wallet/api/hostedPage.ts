import { Linking, Platform } from 'react-native';

import { SELFIE_PATH, selfieReturnUrl } from '@/lib/appLinks';

/**
 * Where the hosted selfie page sends the person back to (WEBAPP-05, R-127). In the browser it is this web app's own origin
 * (`https://usewmt.com/selfie`), read from the page the way the web build reads its own address; on a phone it stays the
 * app link in `appLinks.ts`. The Hub takes the address only when its `NUVION_LIVENESS_REDIRECT_ORIGINS` lists the origin.
 */
export function selfieReturnAddress(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${SELFIE_PATH}`;
  }
  return selfieReturnUrl();
}

/**
 * Opens the secure selfie page. On the web it replaces this tab: a new window opened after an awaited call is dropped by
 * popup blockers and by Safari, and the page returns to `/selfie` here anyway. On a phone it opens the browser.
 */
export async function openSecurePage(url: string): Promise<void> {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.location.assign(url);
    return;
  }
  await Linking.openURL(url);
}
