import * as Clipboard from 'expo-clipboard';

/**
 * Puts A8's account number on the phone's clipboard with `expo-clipboard`
 * (SHARED-CHANGES KYC-04 #1, applied by SHARED-04). True once it is there;
 * false when the phone refuses, so the button never says "Copied" for
 * nothing. The web build uses the browser's Clipboard API (`copy.web.ts`).
 */
export async function copyText(value: string): Promise<boolean> {
  try {
    return await Clipboard.setStringAsync(value);
  } catch {
    return false;
  }
}
