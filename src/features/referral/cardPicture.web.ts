import type { RefObject } from 'react';
import type { View } from 'react-native';

/** The web build has no share sheet, so the card is never turned into a picture here. */
export async function pictureOfCard(_view: RefObject<View | null>): Promise<string> {
  throw new Error('The card cannot be made into a picture here.');
}
