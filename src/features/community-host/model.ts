/**
 * What I32 checks before it asks the Hub (INBOX-14), and what I34 says about a request. The Hub checks every one of these again and is the
 * judge: a name of 3 to 80 characters and a purpose of 1 to 500 are its own bounds (CreateRoomDto); a private room needs a picture; the
 * price's bounds are its launch settings, so the phone checks only that a whole-naira price was typed.
 */
export type Kind = 'open' | 'private';

export const NAME_MIN = 3;
export const NAME_MAX = 80;
export const PURPOSE_MAX = 500;
const KOBO_PER_NAIRA = 100;

export const validName = (value: string): boolean => {
  const name = value.trim();
  return name.length >= NAME_MIN && name.length <= NAME_MAX;
};

export const validPurpose = (value: string): boolean => {
  const purpose = value.trim();
  return purpose.length >= 1 && purpose.length <= PURPOSE_MAX;
};

/** A private room needs a cover picture (the Hub answers 400 without one). */
export function pictureError(kind: Kind, hasPicture: boolean): string | undefined {
  return kind === 'private' && !hasPicture ? 'A private community needs a cover picture.' : undefined;
}

/** The typed price in whole naira, as kobo. Null when nothing usable was typed. */
export function formKobo(typed: string): number | null {
  if (!/^\d{1,9}$/.test(typed)) return null;
  const naira = Number(typed);
  return naira > 0 ? naira * KOBO_PER_NAIRA : null;
}

export function priceError(typed: string): string | undefined {
  return formKobo(typed) === null ? 'Set a price for 30 days.' : undefined;
}

const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;

/** "5m", "2h", "Yest.", "3d": how long ago a request was made, from the Hub's time. The board writes "asked 2h ago". */
export function askedAgo(iso: string, now: number = Date.now()): string {
  const at = Date.parse(iso);
  if (Number.isNaN(at)) return '';
  const gap = Math.max(0, now - at);
  if (gap < HOUR_MS) return `${Math.max(1, Math.round(gap / 60_000))}m`;
  if (gap < DAY_MS) return `${Math.floor(gap / HOUR_MS)}h`;
  const days = Math.floor(gap / DAY_MS);
  return days === 1 ? 'Yest.' : `${days}d`;
}

/** The line under a requester's name: what the Hub knows of them (a headline and a city are not served yet, G-INBOX-14-2) and how long ago they asked. */
export function requestLine(ago: string): string {
  if (!ago) return 'Asked to join';
  return ago === 'Yest.' ? 'asked Yest.' : `asked ${ago} ago`;
}

/** The line under a waiting row in a room that sells a pass: the host removed them, they did not ask (G-INBOX-24-6). */
export const removedLine = (): string => 'Removed from this room';

/** What `POST /communities/rooms` is sent (R-63). */
export type RoomInput = { name: string; description: string; kind: Kind; imageUrl?: string; passPriceKobo?: number };

/**
 * The room to create, or null when it must not be sent. A private room is always sent WITH a price in kobo and a picture: one with no
 * price would keep the older host-approval flow, which R-63 removed, so it is never made from the app. An open room is never sent a price.
 * The price's bounds are the Hub's launch settings: a price outside them is refused by the Hub, in its own words.
 */
export function roomInput(form: { name: string; purpose: string; kind: Kind; price: string; imageUrl?: string }): RoomInput | null {
  if (!validName(form.name) || !validPurpose(form.purpose)) return null;
  const base = { name: form.name.trim(), description: form.purpose.trim(), kind: form.kind };
  if (form.kind === 'open') return form.imageUrl ? { ...base, imageUrl: form.imageUrl } : base;
  const kobo = formKobo(form.price);
  if (kobo === null || !form.imageUrl) return null;
  return { ...base, imageUrl: form.imageUrl, passPriceKobo: kobo };
}
