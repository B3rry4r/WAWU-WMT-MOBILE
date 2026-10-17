import { watOf } from '@/features/events/format';

import type { LegalRequest } from './api';

export type StepState = 'done' | 'now' | 'todo';
export type StepKey = 'sent' | 'consultation' | 'quote' | 'pay' | 'delivered';
export type Step = { key: StepKey; title: string; sub: string | null; state: StepState };

const TITLES: Record<StepKey, string> = {
  sent: 'Request sent',
  consultation: 'Consultation',
  quote: 'Quote and agreement',
  pay: 'Pay and start',
  delivered: 'Documents delivered',
};

/** A matter that starts with a consultation has five steps; a fixed-price one (S26) has no consultation and four. */
const keysOf = (request: Pick<LegalRequest, 'path'>): StepKey[] =>
  request.path === 'simple' ? ['sent', 'quote', 'pay', 'delivered'] : ['sent', 'consultation', 'quote', 'pay', 'delivered'];

const MEDIUM_WORD: Record<string, string> = { zoom: 'video', phone: 'phone', physical: 'in person', chat: 'chat' };

/** "Thu 2 Oct, 12:00": an hour as the tracker says it (Lagos time). */
export function whenLine(iso: string): string {
  const w = watOf(iso);
  return `${w.weekday} ${w.day} ${w.month}, ${w.hour}:${w.minute}`;
}

/** The line under "Consultation": the hour and the kind ("Thu 2 Oct, 12:00 · video"), or how an in-person one is arranged. Null before anything is booked. */
export function consultationLine(request: Pick<LegalRequest, 'consultationMedium' | 'scheduledFor'>): string | null {
  const word = request.consultationMedium ? MEDIUM_WORD[request.consultationMedium] : undefined;
  if (request.scheduledFor) return word ? `${whenLine(request.scheduledFor)} · ${word}` : whenLine(request.scheduledFor);
  if (request.consultationMedium === 'physical') return "In person · we'll arrange a time by email";
  return null;
}

/** Which step the matter is at, read from what the Hub records on it: what is signed, paid and delivered. Past the last step is "all done". */
export function currentKey(request: LegalRequest): StepKey | null {
  if (request.deliveredAt !== null) return null;
  if (request.servicePaidAt !== null) return 'delivered';
  if (request.contractSigned) return 'pay';
  if (request.quoteAmount !== null) return 'quote';
  if (request.path === 'simple') return 'quote';
  return request.status === 'consultation_done' ? 'quote' : 'consultation';
}

/** The tracker's steps (S20 to S23): the ones before the current one are done, the current one is marked, the rest wait. */
export function stepsOf(request: LegalRequest): Step[] {
  const keys = keysOf(request);
  const now = currentKey(request);
  const at = now === null ? keys.length : keys.indexOf(now);
  return keys.map((key, i) => {
    let sub: string | null = null;
    if (key === 'consultation') sub = consultationLine(request);
    // A consultant has read it once the consultation is paid for: the Hub holds nothing earlier that says so.
    if (key === 'sent' && request.path !== 'simple' && request.consultationPaidAt !== null) sub = 'Answers read by your consultant';
    // A closed matter marks no step as the current one: it is not going anywhere (S22 under the closed banner).
    return { key, title: TITLES[key], sub, state: i < at ? 'done' : i === at && request.status !== 'cancelled' ? 'now' : 'todo' };
  });
}

/** What the matter has to ask of the person now: sign the letter (S21), pay to start (S22), or nothing. */
export type Ask = 'sign' | 'pay' | null;

export function askOf(request: LegalRequest): Ask {
  if (request.status === 'cancelled') return null;
  if (request.quoteAmount !== null && request.quoteAmount > 0 && !request.contractSigned) return 'sign';
  if (request.contractSigned && request.servicePaidAt === null && request.quoteAmount !== null) return 'pay';
  return null;
}

/** The consultation is paid for and still ahead: S20's note and "Add to calendar". */
export function consultationBooked(request: LegalRequest): boolean {
  return request.status !== 'cancelled' && request.consultationPaidAt !== null && currentKey(request) === 'consultation';
}

/** "Lennox Emmanuel": a name is signed when it has a first and a last word. */
export function signableName(typed: string): string | null {
  const name = typed.trim().replace(/\s+/g, ' ');
  return name.split(' ').length >= 2 && name.length >= 3 ? name : null;
}
