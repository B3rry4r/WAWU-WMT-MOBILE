import { Platform, Share, type ShareAction } from 'react-native';

import { showShareNote } from './shareNote';

/** What a share is given: the same shape `Share.share` takes (a text, which may be a link). */
export type ShareContent = { message: string };
export type ShareOptions = { dialogTitle?: string };

const LINK = /(https?:\/\/|\bwawu\/|\busewmt\.com)/i;

type WebNavigator = { share?: (data: { text: string }) => Promise<void>; clipboard?: { writeText: (text: string) => Promise<void> } };

/**
 * The one way every screen shares (R-127, WEBAPP-03). On a phone it is `Share.share`, untouched. In a browser:
 * the browser's own share sheet where it has one (phone browsers, Safari, Edge); otherwise the text goes to the
 * clipboard and a plain "Link copied" (or "Copied" for text that is not a link) note shows. Every path answers with an
 * `action` (shared, or dismissed when the person closes the sheet), and it rejects only when nothing could be shared or
 * copied, so the caller's own "could not share" line stays true.
 */
export async function shareOut(content: ShareContent, options?: ShareOptions): Promise<ShareAction> {
  // The call is exactly the one the screens made before (no second argument unless they gave one).
  if (Platform.OS !== 'web') return (options ? await Share.share(content, options) : await Share.share(content)) as ShareAction;
  const nav: WebNavigator | undefined = typeof navigator === 'undefined' ? undefined : (navigator as unknown as WebNavigator);
  if (nav?.share) {
    try {
      await nav.share({ text: content.message });
      return { action: Share.sharedAction };
    } catch (e) {
      // The person closed the sheet: a dismissal, not a failure. Any other refusal falls through to the copy.
      if (e && typeof e === 'object' && (e as { name?: string }).name === 'AbortError') return { action: Share.dismissedAction };
    }
  }
  if (!nav?.clipboard) throw new Error('Nothing could share or copy');
  await nav.clipboard.writeText(content.message);
  showShareNote(LINK.test(content.message) ? 'Link copied' : 'Copied');
  return { action: Share.sharedAction };
}
