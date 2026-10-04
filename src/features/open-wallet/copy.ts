import { Clipboard } from 'react-native';

/**
 * Puts A8's account number on the phone's clipboard. React Native's own
 * clipboard (still shipped, though deprecated) until `expo-clipboard` is
 * installed with the native batch (SHARED-CHANGES row 8, KYC-04 #1), when
 * this file calls `Clipboard.setStringAsync` instead. True once it is there.
 */
export async function copyText(value: string): Promise<boolean> {
  try {
    Clipboard.setString(value);
    return true;
  } catch {
    return false;
  }
}
