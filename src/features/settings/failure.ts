import { isApiError } from '@/api/client';
import type { IconName } from '@/components/icon';

/**
 * What a screen says when a call fails: the app's own short sentence, never the server's words ("Unauthorized",
 * "Internal server error", "Validation failed (uuid v 4 is expected)" are for logs, not for a person). The kind of
 * failure picks the sentence; anything the app has no sentence for says `fallback`, which each screen words for what
 * the person was doing. The one message kept is an app-written one: an answer the app could not read arrives as
 * an ApiError with status 200, which no server refusal ever has.
 */
export function sentenceOf(error: unknown, fallback: string): string {
  if (!isApiError(error)) return fallback;
  if (error.kind === 'network') return 'No connection. Check your internet and try again.';
  if (error.kind === 'unauthorized') return 'You were signed out. Sign in again.';
  if (error.kind === 'forbidden') return 'You do not have permission to do that.';
  if (error.kind === 'rate_limited') {
    return error.retryAfterSeconds ? `Too many tries. Wait ${waitInWords(error.retryAfterSeconds)} and try again.` : 'Too many tries. Wait a little and try again.';
  }
  if (error.kind === 'unknown' && error.status === 200 && error.message) return error.message;
  return fallback;
}

/** Whether the request never reached the server. */
export function isOffline(error: unknown): boolean {
  return isApiError(error) && error.kind === 'network';
}

/** A wait the server asked for, in words: "1 minute", "5 minutes", "1 hour". */
export function waitInWords(seconds: number): string {
  const minutes = Math.max(1, Math.ceil(seconds / 60));
  if (minutes < 60) return minutes === 1 ? '1 minute' : `${minutes} minutes`;
  const hours = Math.ceil(minutes / 60);
  return hours === 1 ? '1 hour' : `${hours} hours`;
}

/** What a screen says when its settings could not be read: no connection is told apart from a fault, and the title never repeats the sentence under it. */
export function loadProblem(error: unknown): { icon: IconName; title: string; message: string } {
  if (isOffline(error)) return { icon: 'WifiOff', title: 'No connection', message: 'Check your internet and try again.' };
  return { icon: 'CircleAlert', title: 'This could not be loaded', message: sentenceOf(error, 'Something went wrong. Try again.') };
}
