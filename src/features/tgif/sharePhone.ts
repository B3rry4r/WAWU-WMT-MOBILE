import { Share } from 'react-native';

import type { TgifDay } from './api/tgif';
import { shareText } from './model';

export const COULD_NOT_SHARE_VERSE = 'The verse could not be shared. Try again.';

export type VerseShare = 'shared' | 'dismissed';

/**
 * Share on the reader (R-58 a): the phone's own share sheet, with today's verse, where it is from and the link when the
 * Hub has one, as text. There is no drawn card and no app-specific target; the phone lists whatever it can send to.
 * Resolves `dismissed` when the person closed the sheet without sending (the phone says so on iOS); rejects when the
 * sheet could not open, so the reader can say so.
 */
export async function shareVerse(day: Pick<TgifDay, 'verse' | 'verseReference' | 'shareLink'>): Promise<VerseShare> {
  const result = await Share.share({ message: shareText(day) }, { dialogTitle: "Share today's verse" });
  return result.action === Share.dismissedAction ? 'dismissed' : 'shared';
}
