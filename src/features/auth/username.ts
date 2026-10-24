import { useEffect, useState } from 'react';

import { HANDLE_PATTERN, limits } from '@/features/profile-edit/limits';
import { bareHandle } from '@/features/profile-edit/social';

import type { UsernameAnswer } from './identityApi';

/**
 * The username is the profile's handle, the @handle Edit profile shows (SIGNUP-NAMES, R-82), so it has Edit profile's
 * rules: letters, numbers, dots and underscores, at most 30. The Hub adds two more it alone can judge (a name another
 * account holds, in any case, and a few words kept back), and says them in its own words.
 */
export const USERNAME_MAX = limits.handle;

/** The sentences the Hub gives for the same two refusals, so a typed value is refused in the same words with or without a call. */
export const USERNAME_WORDS = {
  empty: 'Choose a username.',
  characters: 'Use letters, numbers, dots and underscores.',
  tooLong: `A username can be at most ${USERNAME_MAX} characters.`,
} as const;

/** How long typing must pause before the Hub is asked whether the name is free. A screen timing, not a fact. */
export const CHECK_DELAY_MS = 450;

/** The name as it would be kept: no "@", no spaces around it. */
export const usernameOf = bareHandle;

/** What the app can say about a typed name without asking the Hub; null when it looks fine and only the Hub can tell. */
export function usernameProblem(typed: string): string | null {
  const name = bareHandle(typed);
  if (name === '') return USERNAME_WORDS.empty;
  if (name.length > USERNAME_MAX) return USERNAME_WORDS.tooLong;
  if (!HANDLE_PATTERN.test(name)) return USERNAME_WORDS.characters;
  return null;
}

export type UsernameCheck =
  /** Nothing typed yet. */
  | { phase: 'idle' }
  /** Typed, waiting out the pause or for the Hub's answer. */
  | { phase: 'checking' }
  | { phase: 'free' }
  /** Refused: by the app's own look at it, or the Hub's sentence (taken, held back). */
  | { phase: 'refused'; message: string };

/**
 * Whether the typed name is free, while the person types: nothing for an empty box, the app's own sentence at once for
 * a name that breaks the characters or length, and otherwise the Hub's answer after the pause. A call that fails
 * leaves the line empty (the answer on Continue is the one that counts). Only the latest typed value may set the line.
 */
export function useUsernameCheck(typed: string, ask: ((name: string) => Promise<UsernameAnswer>) | undefined): UsernameCheck {
  const [answer, setAnswer] = useState<{ name: string; result: UsernameCheck } | null>(null);
  const name = bareHandle(typed);
  const problem = name === '' ? null : usernameProblem(typed);

  useEffect(() => {
    if (!ask || name === '' || problem) return undefined;
    // The cleanup runs when the typed name changes or the field goes away, so an answer to an older name is never used.
    let current = true;
    const timer = setTimeout(() => {
      ask(name).then(
        (said) => {
          if (current) setAnswer({ name, result: said.available ? { phase: 'free' } : { phase: 'refused', message: said.message ?? USERNAME_WORDS.characters } });
        },
        () => {
          if (current) setAnswer(null);
        },
      );
    }, CHECK_DELAY_MS);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [ask, name, problem]);

  if (name === '') return { phase: 'idle' };
  if (problem) return { phase: 'refused', message: problem };
  if (answer && answer.name === name) return answer.result;
  return ask ? { phase: 'checking' } : { phase: 'idle' };
}

/** A3's Continue was refused because of the username: the Hub's own sentence, shown under that field. */
export class UsernameRefused extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UsernameRefused';
  }
}
