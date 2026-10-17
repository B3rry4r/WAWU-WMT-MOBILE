import type { RefObject } from 'react';
import type { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

/**
 * RF2's picture (R-33, R-68): the share card is drawn on the phone, so the picture that goes to the phone's share sheet
 * is the very view on screen, written to a PNG in the app's cache with `react-native-view-shot` (SHARED-CHANGES
 * REF-03 #1). The web build has no such module (`cardPicture.web.ts`) and never reaches here: it has no share sheet.
 */
export async function pictureOfCard(view: RefObject<View | null>): Promise<string> {
  const target = view.current;
  if (!target) throw new Error('The card is not on screen.');
  return captureRef(target, { format: 'png', quality: 1, result: 'tmpfile', fileName: 'invite-card' });
}
