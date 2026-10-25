/**
 * How long a bank transfer takes, in words (FIX-109). The minutes are the Hub's (`arrivalMinutes` on a bank fee quote and on a
 * pending bank send, `transferIn.arrivalMinutes` on the wallet): this file only writes them out, and writes nothing when the Hub
 * sent none. No figure of the board ("a few minutes") is kept here, because no figure is ours to promise.
 */

/** A count the Hub sent that can be spoken: whole minutes, 1 to a day. Anything else is not a time, and nothing is drawn. */
export function arrivalMinutesOf(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 1440 ? value : null;
}

/** "a minute", "10 minutes", "an hour", "2 hours", "a day". Between whole hours the minutes are kept ("90 minutes"). */
export function durationWords(minutes: number): string {
  if (minutes === 1) return 'a minute';
  if (minutes === 1440) return 'a day';
  if (minutes >= 60 && minutes % 60 === 0) return minutes === 60 ? 'an hour' : `${minutes / 60} hours`;
  return `${minutes} minutes`;
}

/** W17's Arrives row. */
export const ARRIVES_LABEL = 'Arrives';
export const arrivesValue = (minutes: number): string => `In about ${durationWords(minutes)}`;

/** W19's line under the last step, while the bank has not confirmed. */
export const usuallyWithin = (minutes: number): string => `Usually within ${durationWords(minutes)}`;

/** W15's line under the account card. */
export const sendArrivesLine = (minutes: number): string => `Money you send arrives in about ${durationWords(minutes)}.`;

/** W45's line under "Waiting for your transfer". */
export const usuallyAbout = (minutes: number): string => `Usually about ${durationWords(minutes)}`;

