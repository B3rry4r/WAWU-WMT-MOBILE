import { accountNameOf, formatNaira, paidFromText, type PaidFrom } from '@/components/pay-sheet';
import type { FeedItem } from '@/features/feed/api';
import { creatorName, durationSeconds, pillFor, postKind, UNNAMED_CREATOR, type PostKind } from '@/features/feed/model';

/** The wallet the piece is paid from, as H14 names it. */
export const WALLET_NAME = 'Naira wallet';

const SECONDS_PER_MINUTE = 60;

const kindOf = (item: Pick<FeedItem, 'contentType'>): PostKind => postKind(item) ?? 'video';

/**
 * Who H14 and H15 name as the creator: the feed's own name for them (WAWU ID's name, else their handle), and a piece's page's
 * "Someone" for a creator who has neither yet. A quote is never refused for a missing name.
 */
export const unlockPayee = (creator: { displayName: string | null; handle: string | null }): string => creatorName(creator) ?? UNNAMED_CREATOR;

/** The line under the title on H14: "Video · 18 min", "PDF · 84 pages". The piece's own figures, left out when it has none. */
export function sheetSubtitle(item: FeedItem): string {
  return pillFor({ ...item, fullAssetLocked: false }, kindOf(item)).text;
}

/** H16's line: what is now the person's, in the piece's own measure ("The full 18 minutes", "All 84 pages"), and where it is kept. */
export function unlockedLine(item: FeedItem): string {
  const kind = kindOf(item);
  const seconds = durationSeconds(item.media?.durationLabel ?? item.durationLabel);
  const pages = item.media?.pageCount ?? item.pageCount;
  const frames = item.media?.frameCount;
  let what: string;
  if ((kind === 'video' || kind === 'audio') && seconds !== null && seconds >= SECONDS_PER_MINUTE) {
    const minutes = Math.round(seconds / SECONDS_PER_MINUTE);
    what = `The full ${minutes} ${minutes === 1 ? 'minute is' : 'minutes are'}`;
  } else if (kind === 'pdf' && pages) {
    what = `All ${pages} ${pages === 1 ? 'page is' : 'pages are'}`;
  } else if (kind === 'photos' && frames) {
    what = `All ${frames} ${frames === 1 ? 'photo is' : 'photos are'}`;
  } else {
    what = `The full ${NOUN[kind]} is`;
  }
  return `${what} yours, and it's in My purchases from now on.`;
}

const NOUN: Record<PostKind, string> = { video: 'video', audio: 'audio', pdf: 'PDF', photos: 'set', course: 'course', template: 'template' };

/** H16's button: it opens the piece in place. */
export function openLabel(item: FeedItem): string {
  switch (kindOf(item)) {
    case 'audio':
      return 'Listen now';
    case 'pdf':
      return 'Read now';
    case 'photos':
      return 'See now';
    // A course or a template has no player in the feed to open into (HOME-07): the sheet just ends, and the piece's own page has it.
    case 'course':
    case 'template':
      return 'Done';
    default:
      return 'Watch now';
  }
}

/** The mark on that button: Play for something that plays, the book for the PDF. */
export function openIcon(item: FeedItem): 'Play' | 'BookOpen' | 'Images' | 'Check' {
  const kind = kindOf(item);
  if (kind === 'course' || kind === 'template') return 'Check';
  return kind === 'pdf' ? 'BookOpen' : kind === 'photos' ? 'Images' : 'Play';
}

const OPENING: Record<PostKind, string> = { video: 'the video', audio: 'the audio', pdf: 'the PDF', photos: 'the set', course: 'the course', template: 'the template' };

/**
 * H18's words: the total that left the wallet (the one H14 showed) and what could not be finished. A buyer who paid from another
 * currency's account (PAY-FX, R-91) is told what left that account, in its currency.
 */
export function openingLine(item: FeedItem, totalKobo: number, from?: PaidFrom | null): string {
  const left = from ? `${paidFromText(from)} left your ${accountNameOf(from.currency)}` : `${formatNaira(totalKobo)} left your wallet`;
  return `${left} and we couldn't finish opening ${OPENING[kindOf(item)]}. You won't be charged twice.`;
}

/** The tick beside the creator's name on H14: purple for a creator, blue for a professional. */
export const tickOf = (tick: 'creator' | 'professional' | null | undefined): 'creator' | 'pro' | undefined =>
  tick === 'creator' ? 'creator' : tick === 'professional' ? 'pro' : undefined;

export const PRICE_MOVED_TITLE = 'The price changed';
