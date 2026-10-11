import { isApiError } from '@/api/client';

/** What the claim screen shows when the Hub refuses: a line on the code field, or a note above it. */
export type ClaimFailure =
  | { where: 'field'; message: string }
  | { where: 'banner'; tone: 'danger' | 'warning'; title: string; body: string };

/**
 * The Hub's `reason.code`s for POST /waitlist/claims (waitlist-error.ts), each in plain words that say what to do.
 * Nothing here names anybody: the Hub never sends another person's details, and the screen never invents any.
 */
export function claimFailure(error: unknown): ClaimFailure {
  if (!isApiError(error)) {
    return { where: 'banner', tone: 'danger', title: 'Your code was not claimed', body: 'Something went wrong. Try again.' };
  }
  switch (error.code) {
    case 'code_invalid':
      return { where: 'field', message: 'Type all 8 letters and numbers of your access code.' };
    case 'code_not_found':
      return {
        where: 'banner',
        tone: 'danger',
        title: 'We could not match that code to you',
        body: 'Check the code. Then make sure you are signed in with the phone number or email you registered with, and that you have confirmed it.',
      };
    case 'contact_not_verified':
      return {
        where: 'banner',
        tone: 'warning',
        title: 'Confirm your phone number or email first',
        body: 'A code only works for an account whose phone number or email is confirmed. Confirm one, then try your code again.',
      };
    case 'code_refunded':
      return {
        where: 'banner',
        tone: 'warning',
        title: 'That code cannot be used',
        body: 'It came from an extra payment, which is being refunded. Use the code from your first payment.',
      };
    case 'already_claimed':
      return { where: 'banner', tone: 'warning', title: 'That code has already been used', body: 'Each code can be used once. Check that you typed the right one.' };
    case 'claimed_by_you':
      return { where: 'banner', tone: 'warning', title: 'You already claimed this code', body: 'Your plan is already on your account.' };
    case 'offer_unavailable':
      // The Hub's sentence says the offer is gone and where to write, so the title says only what happened to the
      // code and does not repeat it (JOIN-03 round 2, N5).
      return {
        where: 'banner',
        tone: 'danger',
        title: 'That code cannot be claimed',
        body: error.message || 'The offer for that code is no longer available. Contact support with your code.',
      };
    default:
      break;
  }
  if (error.kind === 'rate_limited') {
    return { where: 'banner', tone: 'warning', title: 'Too many tries', body: 'Wait a little and try again.' };
  }
  if (error.kind === 'unauthorized') {
    return { where: 'banner', tone: 'danger', title: 'Your session ended', body: 'Sign in again, then enter your code.' };
  }
  if (error.kind === 'network') return { where: 'banner', tone: 'danger', title: 'No connection', body: 'Check your internet and try again.' };
  // An answer the app could not read (status 200) is the app's own sentence: the code may have been claimed.
  if (error.kind === 'unknown' && error.status === 200 && error.message) {
    return { where: 'banner', tone: 'warning', title: 'Your code was accepted', body: error.message };
  }
  return { where: 'banner', tone: 'danger', title: 'Your code was not claimed', body: 'Something went wrong. Try again.' };
}
