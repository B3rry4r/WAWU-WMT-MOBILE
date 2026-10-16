import type { TgifCard, TgifDay } from './api/tgif';

/** The five cards of a TGIF day, in reading order. The slugs are the contract's (`TgifCardStats.card`). */
export const cardOrder: readonly TgifCard[] = ['verse', 'reality', 'remember', 'prayer', 'takeaway'];

/** The small capitals over each card's words, as H29 to H34 draw them. */
export const cardLabels: Record<TgifCard, string> = {
  verse: "TODAY'S VERSE",
  reality: 'THE REALITY',
  remember: 'REMEMBER',
  prayer: 'PRAYER',
  takeaway: 'TAKEAWAY',
};

/**
 * One step of the reader: one of the five cards, or the sponsored card (ADS-01, H33), which sits before the
 * takeaway. It is another kind of step in this list, so the progress bar, the tap to continue and the Done on the
 * last step need no change.
 */
export type ReaderStep = { kind: 'card'; card: TgifCard } | { kind: 'sponsored' };

/** The steps of a reading: the five cards, and the sponsored card before the takeaway when there is one to show. */
export function readerSteps(sponsored = false): ReaderStep[] {
  return cardOrder.flatMap((card): ReaderStep[] => {
    const step: ReaderStep = { kind: 'card', card };
    return sponsored && card === 'takeaway' ? [{ kind: 'sponsored' }, step] : [step];
  });
}

/** Where the sponsored card sits: the place the takeaway has when there is none. A person already there or past it is never sent back to it. */
export const sponsoredSlot = cardOrder.indexOf('takeaway');

const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

const two = (n: number) => String(n).padStart(2, '0');

/**
 * The phone's calendar day as `YYYY-MM-DD`: the day TGIF is read on (the Hub counts
 * per calendar day and accepts yesterday, today and tomorrow in UTC, G-163).
 */
export function localDay(now: Date = new Date()): string {
  return `${now.getFullYear()}-${two(now.getMonth() + 1)}-${two(now.getDate())}`;
}

/** "Friday 26 September" for a `YYYY-MM-DD` day. Written out here, not by the phone's locale, so every phone reads the same. */
export function dateText(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const at = new Date(Date.UTC(y, m - 1, d));
  return `${weekdays[at.getUTCDay()]} ${d} ${months[m - 1]}`;
}

/** The line under TGIF on every card: the day and the series, as the Hub writes it. */
export function headerLine(day: Pick<TgifDay, 'date' | 'series'>): string {
  return `${dateText(day.date)} · ${day.series}`;
}

/**
 * A count the way the cards write it: 640, 2.1K, 12.4K, 1.2M. Cut down, never
 * rounded up, so a figure never claims more than there is.
 */
export function compactCount(n: number): string {
  if (!Number.isFinite(n) || n < 0) return '';
  const whole = Math.floor(n);
  if (whole < 1000) return String(whole);
  const trim = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));
  if (whole < 1_000_000) {
    const k = whole < 100_000 ? Math.floor(whole / 100) / 10 : Math.floor(whole / 1000);
    return `${trim(k)}K`;
  }
  return `${trim(Math.floor(whole / 100_000) / 10)}M`;
}

/** What a card says, as one string: the verse in quotation marks, or the card's own words. */
export function cardText(day: TgifDay, card: TgifCard): string {
  switch (card) {
    case 'verse':
      return `“${day.verse}”`;
    case 'reality':
      return day.reality;
    case 'remember':
      return day.remember;
    case 'prayer':
      return day.prayer;
    case 'takeaway':
      return day.takeaway;
  }
}

/**
 * The words' size. The canvas draws the verse at 32 and the other cards at 26 on
 * lines of about ninety characters; the Hub's real text runs up to four hundred,
 * so a long text steps down (size, then line height, follow from it) and never
 * leaves the card. Two rules, one after the other:
 * - `wordSize`: by the text's length alone, for the moment before the card has been
 *   laid out and there is no height to measure. Each step point is the longest text that
 *   still fits a card's body on a 390 x 844 screen at the size above it.
 * - `fitSize`: by the room the card really has (its scroll area's width and height, less
 *   everything else in it), down to the smallest size on a short phone. A text that
 *   still does not fit at the smallest size scrolls inside its own area; the controls
 *   are never under it.
 */
export const wordSizes = { verse: [32, 28, 24, 21, 18], other: [26, 23, 20, 18, 16] } as const;
export const wordLeading = 1.25;
const verseSteps = [170, 250, 330] as const;
const otherSteps = [330, 420, 560] as const;

export function wordSize(card: TgifCard, text: string): number {
  const sizes = card === 'verse' ? wordSizes.verse : wordSizes.other;
  const steps = card === 'verse' ? verseSteps : otherSteps;
  const over = steps.filter((limit) => text.length > limit).length;
  return sizes[over];
}

/**
 * How many lines a text of `length` characters takes at `size` in a column `width` wide.
 * Alan Sans (Bold and SemiBold, with the cards' tracking) averages 0.444 of the size per
 * character over the whole book; a line holds a character budget of 0.46 of the size, a
 * tenth more characters than that are lost to where words break, and one spare line is
 * kept. Against a greedy word wrap with the font's real advances, over all 365 days, the
 * five cards, every size below and widths of 272, 312 and 342, it never counts fewer lines
 * than the real wrap (0 of 27,375 cases), and counts 1.4 more on average.
 */
export const fitRule = { avgChar: 0.46, wrapLoss: 1.1, spareLines: 1 } as const;

export function estimateLines(length: number, size: number, width: number): number {
  if (length <= 0) return 0;
  const perLine = Math.max(1, Math.floor(width / (fitRule.avgChar * size)));
  return Math.ceil((length * fitRule.wrapLoss) / perLine) + fitRule.spareLines;
}

/** The height of a text of `length` characters at `size` in a column `width` wide. */
export function textHeight(length: number, size: number, width: number): number {
  return estimateLines(length, size, width) * size * wordLeading;
}

/** The space a card's words have: the width of the column and the height left for the text itself. */
export type WordRoom = { width: number; height: number };

/** The largest size on the card's ladder whose text fits `room`; the smallest when none does (the text then scrolls). */
export function fitSize(card: TgifCard, text: string, room: WordRoom): number {
  const sizes = card === 'verse' ? wordSizes.verse : wordSizes.other;
  for (const size of sizes) {
    if (textHeight(text.length, size, room.width) <= room.height) return size;
  }
  return sizes[sizes.length - 1];
}

/**
 * The line under the share sheet's title: what each way of sending really does. On a phone with a
 * share sheet (`asPicture`) the Hub's drawn card goes out as a picture from WhatsApp, Story and Chat,
 * and only Chat adds the link under it. Where there is no share sheet (the web build) the card goes to
 * Chat as a picture and WhatsApp takes the verse as text. The link is named only while the Hub has one to
 * send (`TGIF_SHARE_LINK`); with none, nothing is said about a link.
 */
export function shareLine(shareLink: string | null | undefined, asPicture = false): string {
  if (asPicture) return shareLink ? 'The card goes out as an image. Chat adds the link under it.' : 'The card goes out as an image.';
  const base = 'The card goes to Chat as an image. WhatsApp gets the verse as text.';
  return shareLink ? `${base} Both carry the link.` : base;
}

/** What goes out with a shared verse: the verse, where it is from, and the link when the Hub has one. */
export function shareText(day: Pick<TgifDay, 'verse' | 'verseReference' | 'shareLink'>): string {
  const lines = [`“${day.verse}”`, day.verseReference];
  if (day.shareLink) lines.push(day.shareLink);
  return lines.join('\n');
}

/** WhatsApp's own link for a ready message: it opens the app when it is installed, and WhatsApp's page when it is not. */
export function whatsappUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/** The file name a shared card is given in a chat. */
export function cardFileName(date: string): string {
  return `TGIF-${date}.png`;
}

const base64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * A PNG's width and height from its data address, read from the header chunk
 * (bytes 16 to 23) so the preview can keep the card's own shape. Null for
 * anything that is not a PNG.
 */
export function pngSize(dataUri: string): { width: number; height: number } | null {
  const at = dataUri.indexOf('base64,');
  if (at < 0) return null;
  const head = dataUri.slice(at + 'base64,'.length, at + 'base64,'.length + 32);
  const bytes: number[] = [];
  for (let i = 0; i + 3 < head.length; i += 4) {
    const quad = [...head.slice(i, i + 4)].map((c) => base64.indexOf(c));
    if (quad.some((v) => v < 0)) return null;
    bytes.push((quad[0] << 2) | (quad[1] >> 4), ((quad[1] & 15) << 4) | (quad[2] >> 2), ((quad[2] & 3) << 6) | quad[3]);
  }
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (bytes.length < 24 || signature.some((b, i) => bytes[i] !== b)) return null;
  const word = (o: number) => ((bytes[o] << 24) | (bytes[o + 1] << 16) | (bytes[o + 2] << 8) | bytes[o + 3]) >>> 0;
  const width = word(16);
  const height = word(20);
  return width > 0 && height > 0 ? { width, height } : null;
}
