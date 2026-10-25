import { formatCredits } from '@/components/Credits';

import type { CostsByKind } from './api';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

const DAY_MS = 86_400_000;
/** A day name ("Mon") says which day while it is within the last week; older than that the date is written out. */
const WEEK_DAYS = 6;

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

const two = (n: number) => String(n).padStart(2, '0');

/** "09:12", on the phone's own clock. */
export function clockTime(iso: string): string {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return '';
  return `${two(at.getHours())}:${two(at.getMinutes())}`;
}

/**
 * The time on an inbox row, as the design writes it: "09:12" today, "Yest." yesterday, "Mon" within the
 * last week, "12 Sep" before that. Days are the phone's own, not UTC's.
 */
export function rowTime(iso: string | null, now: Date = new Date()): string {
  if (!iso) return '';
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return '';
  const days = Math.round((startOfDay(now) - startOfDay(at)) / DAY_MS);
  if (days <= 0) return clockTime(iso);
  if (days === 1) return 'Yest.';
  if (days <= WEEK_DAYS) return WEEKDAYS[at.getDay()] ?? '';
  return `${at.getDate()} ${MONTHS[at.getMonth()] ?? ''}`;
}

/** The label above a run of messages: "Today", "Yesterday", the weekday within the week, then the date. */
export function dayLabel(iso: string, now: Date = new Date()): string {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return '';
  const days = Math.round((startOfDay(now) - startOfDay(at)) / DAY_MS);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days <= WEEK_DAYS) return WEEKDAYS[at.getDay()] ?? '';
  return `${at.getDate()} ${MONTHS[at.getMonth()] ?? ''} ${at.getFullYear()}`;
}

/** The calendar day a message belongs to, for grouping: the phone's own day. */
export function dayKey(iso: string): string {
  const at = new Date(iso);
  return `${at.getFullYear()}-${at.getMonth()}-${at.getDate()}`;
}

const THOUSAND = 1000;
const MILLION = 1_000_000;

function oneDecimal(value: number): string {
  const rounded = Math.floor(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

/** "640 members", "2.1K members", "1 member": the list's short form of a head count. */
export function membersShort(count: number): string {
  const whole = Math.max(0, Math.floor(count));
  if (whole === 1) return '1 member';
  if (whole >= MILLION) return `${oneDecimal(whole / MILLION)}M members`;
  if (whole >= THOUSAND) return `${oneDecimal(whole / THOUSAND)}K members`;
  return `${whole} members`;
}

/** "1,204 members", the room header's full form. */
export function membersFull(count: number): string {
  const whole = Math.max(0, Math.floor(count));
  return `${String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} ${whole === 1 ? 'member' : 'members'}`;
}

/** "48 WAWU Credits", "1 WAWU Credit". A count: never a naira value (DECISIONS R-5). */
export function wawuCredits(count: number): string {
  const whole = Math.max(0, Math.floor(count));
  return `${String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} WAWU ${whole === 1 ? 'Credit' : 'Credits'}`;
}

/** "Tolu" from "Tolu Balogun": rows name who spoke by first name, as the design does. */
export function firstName(name: string | null | undefined): string {
  return (name ?? '').trim().split(/\s+/)[0] ?? '';
}

export type LastWords = { text: string | null; hasPhoto: boolean; hasVideo?: boolean; hasVoice?: boolean; mine: boolean; senderName: string | null };

/** The line under a room's name: "Tolu: who’s at the meetup Sat?", "You: Thanks", or "Tolu: Photo". Nothing said yet reads "No messages yet". */
export function lastLine({ text, hasPhoto, hasVideo, hasVoice, mine, senderName }: LastWords): string {
  const words = text?.trim() || (hasPhoto ? 'Photo' : hasVideo ? 'Video' : hasVoice ? 'Voice note' : '');
  if (!words) return 'No messages yet';
  const who = mine ? 'You' : firstName(senderName);
  return who ? `${who}: ${words}` : words;
}

/** "photos", "photos and video", "photos, video and voice notes". */
function listed(words: readonly string[]): string {
  if (words.length <= 1) return words[0] ?? '';
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}

const upFirst = (words: string) => words.charAt(0).toUpperCase() + words.slice(1);

/**
 * I24's second line under the balance, from the Hub's costs by kind (R-62): "Chat free · photos, video, voice use credits". Only a kind
 * the Hub prices above nothing is named as using credits; nothing is said of a kind it does not price.
 */
export function chatLine(costs: CostsByKind): string {
  const paid = [costs.photo > 0 ? 'photos' : null, costs.video > 0 ? 'video' : null, costs.voice > 0 ? 'voice' : null].filter(
    (word): word is string => word !== null,
  );
  const chat = costs.text > 0 ? `Messages ${formatCredits(costs.text)}` : 'Chat free';
  return paid.length > 0 ? `${chat} · ${paid.join(', ')} use credits` : chat;
}

/**
 * I33's second sentence under "Share the link or post your first message.", from the Hub's costs: what members pay in the new room,
 * then that reading is free. The board's "Members pay 1 credit a message and reading is free." was drawn before R-62, when every message
 * cost a credit; it is those words only while the Hub still prices text. Otherwise what the Hub prices is named and the rest is free.
 */
export function memberCostLine(costs: CostsByKind): string {
  if (costs.text > 0) return `Members pay ${formatCredits(costs.text)} a message and reading is free.`;
  const paid = [costs.photo > 0 ? 'photos' : null, costs.video > 0 ? 'video' : null, costs.voice > 0 ? 'voice notes' : null].filter(
    (word): word is string => word !== null,
  );
  if (paid.length === 0) return 'Chat and reading are free.';
  const named = paid.length === 1 ? paid[0] : `${paid.slice(0, -1).join(', ')} and ${paid[paid.length - 1]}`;
  return `Chat and reading are free. Credits are for ${named}.`;
}

/**
 * I38's line under "Photo", from the Hub's costs: "Photos 1 credit · video and voice notes 3". A video and a voice note that cost
 * the same share a clause. Null when the Hub prices none of them.
 */
export function priceLine(costs: CostsByKind): string | null {
  const parts: string[] = [];
  if (costs.photo > 0) parts.push(`Photos ${formatCredits(costs.photo)}`);
  if (costs.video > 0 && costs.video === costs.voice) {
    parts.push(`video and voice notes ${costs.video}`);
  } else {
    if (costs.video > 0) parts.push(`video ${costs.video}`);
    if (costs.voice > 0) parts.push(`voice notes ${costs.voice}`);
  }
  return parts.length > 0 ? upFirst(parts.join(' · ')) : null;
}

/**
 * I27's words, from the Hub's costs: "Text and emoji stay free. Buy credits to send photos, video and voice notes." Null when the Hub
 * prices no kind, because then there is nothing to buy credits for.
 */
export function outOfCreditsLine(costs: CostsByKind): string | null {
  const paid = [costs.photo > 0 ? 'photos' : null, costs.video > 0 ? 'video' : null, costs.voice > 0 ? 'voice notes' : null].filter(
    (word): word is string => word !== null,
  );
  if (paid.length === 0) return null;
  return `${costs.text > 0 ? '' : 'Text and emoji stay free. '}Buy credits to send ${listed(paid)}.`;
}
