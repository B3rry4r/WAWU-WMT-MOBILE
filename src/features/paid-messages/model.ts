import { formatMoney, moneyParts } from '@/components/Money';
import { nairaToKobo } from '@/features/feed/api';

import type { PaidMessageSettings, PaidMessageStanding } from './api';

/** Which of I21, I22 and I23 the screen is in, from the Hub's standing alone. */
export type Mode = 'ok' | 'warned' | 'locked';

export function modeOf(standing: PaidMessageStanding): Mode {
  if (standing.state === 'paused') return 'locked';
  return standing.state === 'warning' ? 'warned' : 'ok';
}

/** What the person has typed and chosen so far. The price is the digits of the naira they typed. */
export type Form = { enabled: boolean; digits: string; hours: number | null };

/** The whole naira of an amount in kobo, as the digits the price field holds (no division on a screen, R-21). */
export function digitsFromKobo(kobo: number): string {
  return moneyParts(kobo).whole.replace(/\D/g, '');
}

export function formOf(settings: PaidMessageSettings): Form {
  return {
    enabled: settings.enabled,
    digits: settings.priceKobo === null ? '' : digitsFromKobo(settings.priceKobo),
    hours: settings.responseHours,
  };
}

/** The price field's words: "₦1,500", or nothing while empty. Digits only, no leading zeros. */
export function priceInput(digits: string): string {
  return digits === '' ? '' : formatMoney(nairaToKobo(Number(digits)), { decimals: false });
}

/** What was typed into the price field, as digits: the glyph, commas and anything else are dropped. */
export function digitsOf(typed: string): string {
  const only = typed.replace(/\D/g, '').replace(/^0+/, '');
  // Past the highest price the Hub takes is a figure nobody means: stop growing, so the field never overflows a number.
  return only.slice(0, 10);
}

/** The typed price in kobo, or null while the field is empty. */
export function priceKoboOf(form: Form): number | null {
  return form.digits === '' ? null : nairaToKobo(Number(form.digits));
}

/** What the creator keeps of one message, in kobo, rounded down. The Hub rounds the same way. */
export function earnKobo(priceKobo: number, sharePct: number): number {
  return Math.floor((priceKobo * sharePct) / 100);
}

/** "22%". Rounded down, so a share under a line never reads as on it. */
export function percentText(pct: number): string {
  return `${Math.floor(pct)}%`;
}

/** "24 hours", "2 days", "3 days", "1 week": the window as a person says it. */
export function windowLabel(hours: number): string {
  if (hours < 48) return hours === 1 ? '1 hour' : `${hours} hours`;
  if (hours % 168 === 0) return hours === 168 ? '1 week' : `${hours / 168} weeks`;
  if (hours % 24 === 0) return `${hours / 24} days`;
  return `${hours} hours`;
}

/** "3 October", in Lagos time, where the creator's days are. */
export function dayMonth(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', timeZone: 'Africa/Lagos' }).format(new Date(iso));
}

/** Why the price cannot be saved, or null. Empty is not an error: the switch decides whether a price is needed. */
export function priceProblem(form: Form, settings: PaidMessageSettings): string | null {
  const kobo = priceKoboOf(form);
  if (kobo === null) return null;
  const { minPriceKobo, maxPriceKobo } = settings.options;
  if (kobo < minPriceKobo) return `The lowest price is ${formatMoney(minPriceKobo, { decimals: false })}.`;
  if (kobo > maxPriceKobo) return `The highest price is ${formatMoney(maxPriceKobo, { decimals: false })}.`;
  return null;
}

/** Whether Save can be pressed: nothing locked, a price that is in range (and present when the switch is on), a reply time chosen. */
export function canSave(form: Form, settings: PaidMessageSettings): boolean {
  if (modeOf(settings.standing) === 'locked') return false;
  if (priceProblem(form, settings) !== null) return false;
  if (form.enabled && form.digits === '') return false;
  return form.hours !== null;
}

/** The body Save sends. The price goes only when there is one. */
export function saveBody(form: Form): { enabled: boolean; priceKobo?: number; responseHours?: number } {
  const kobo = priceKoboOf(form);
  return {
    enabled: form.enabled,
    ...(kobo === null ? {} : { priceKobo: kobo }),
    ...(form.hours === null ? {} : { responseHours: form.hours }),
  };
}

/** The line under the switch: BRIEF I21's "On · ₦1,500 a message", and I23's "Locked until 3 October". */
export function switchLine(form: Form, mode: Mode, standing: PaidMessageStanding): string {
  if (mode === 'locked') return standing.pausedUntil ? `Locked until ${dayMonth(standing.pausedUntil)}` : 'Locked';
  if (!form.enabled) return 'Off';
  const kobo = priceKoboOf(form);
  return kobo === null ? 'On' : `On · ${formatMoney(kobo, { decimals: false })} a message`;
}

/** I22's title: "You missed 4 of your last 18". Null when the Hub did not send the counts. */
export function warningTitle(standing: PaidMessageStanding): string | null {
  if (standing.unanswered === null || standing.questions === null) return null;
  return `You missed ${standing.unanswered} of your last ${standing.questions}`;
}

/** I22's words: the line the Hub names, and the way out when there is a price to raise to. */
export function warningBody(standing: PaidMessageStanding, canRaise: boolean): string {
  const line = `Past ${standing.pauseAtPct}% and paid messages switch off for ${standing.pauseDays} days.`;
  return canRaise ? `${line} Raise your price for fewer, more serious questions.` : line;
}

/** I23's title: "Paid messages are off for 7 days". */
export function lockedTitle(standing: PaidMessageStanding): string {
  return `Paid messages are off for ${standing.pauseDays} days`;
}

/** I23's words, as BRIEF I23 changes them: no shop (R-2, R-9). */
export function lockedBody(standing: PaidMessageStanding): string {
  const back = standing.pausedUntil ? `Back on ${dayMonth(standing.pausedUntil)}. ` : '';
  return `${back}Publishing, communities and tips all keep working.`;
}
