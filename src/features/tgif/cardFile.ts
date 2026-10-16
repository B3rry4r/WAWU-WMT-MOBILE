import { File, Paths } from 'expo-file-system';
import { Asset, requestPermissionsAsync } from 'expo-media-library';
import * as Sharing from 'expo-sharing';

import type { ShareCard } from './api/tgif';
import { cardFileName } from './model';

/*
 * The phone's side of H35's Story, Save and WhatsApp-with-the-picture (SHARED-CHANGES HOME-09 #2,
 * BACKEND_GAPS G-242): the Hub's picture is written to a file in the app's cache, then handed to the
 * phone's share sheet (`expo-sharing`) or its photo library (`expo-media-library`). The web build
 * has none of this (`cardFile.web.ts`), so it draws no Story or Save.
 */

const base64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** The bytes inside a `data:image/png;base64,` address, read without `atob` (the same way `pngSize` reads the header). */
export function bytesOfDataUri(dataUri: string): Uint8Array {
  const at = dataUri.indexOf('base64,');
  if (at < 0) throw new Error('not base64');
  const text = dataUri.slice(at + 'base64,'.length).replace(/=+$/, '');
  const out = new Uint8Array(Math.floor((text.length * 3) / 4));
  let bits = 0;
  let held = 0;
  let n = 0;
  for (const c of text) {
    const v = base64.indexOf(c);
    if (v < 0) throw new Error('not base64');
    held = (held << 6) | v;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out[n] = (held >> bits) & 0xff;
      n += 1;
    }
  }
  return out.subarray(0, n);
}

/** Whether this phone has a share sheet to hand the picture to. */
export async function canShareCard(): Promise<boolean> {
  try {
    return await Sharing.isAvailableAsync();
  } catch {
    return false;
  }
}

/** Writes the card to a file in the app's cache (the same name every time, so a second share replaces the first) and returns its address. */
export function writeCard(card: ShareCard, date: string): string {
  const file = new File(Paths.cache, cardFileName(date));
  file.create({ overwrite: true });
  file.write(bytesOfDataUri(card.uri));
  return file.uri;
}

/** Opens the phone's share sheet with the picture; resolves when the sheet is closed. */
export async function shareCardFile(uri: string, title: string): Promise<void> {
  await Sharing.shareAsync(uri, { mimeType: 'image/png', UTI: 'public.png', dialogTitle: title });
}

/** Saves the picture to the phone's photos. `denied` when the person does not allow it. */
export async function saveCardFile(uri: string): Promise<'saved' | 'denied'> {
  const permission = await requestPermissionsAsync(true);
  if (!permission.granted) return 'denied';
  await Asset.create(uri);
  return 'saved';
}
