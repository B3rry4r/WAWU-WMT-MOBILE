import { isApiError } from '@/api/client';
import type { IconName } from '@/components/icon';

/** What an ApiError says, or `fallback` for anything else. The server's own sentence is kept when it sent one. */
export function sentenceOf(error: unknown, fallback: string): string {
  return isApiError(error) && error.message ? error.message : fallback;
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
