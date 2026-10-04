import { useSyncExternalStore } from 'react';

import { isApiError } from '@/api/errors';
import { signupProgressRequest, type SignupProgress } from '@/api/identity';

import { authed } from './signupApi';

/**
 * Where a signed-in account stands in the sign-up sequence (SHARED-CHANGES
 * AUTH-05 F2). Read once per signed-in session (cold start, or right after the
 * phone code): `step: 'email'` opens the email step before Home. The later steps
 * (`creator_setup`, `interests`, `follows`) belong to AUTH-06 and open nothing here.
 * A read that fails (offline, server down) lets the user into the app; the next
 * start reads again.
 */
type Gate = { phase: 'idle' | 'loading' | 'ready'; progress: SignupProgress | null };

let gate: Gate = { phase: 'idle', progress: null };
const listeners = new Set<() => void>();
let generation = 0;

function change(next: Gate) {
  gate = next;
  listeners.forEach((listener) => listener());
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** Reads the progress. Ignored if the session changed meanwhile. */
export async function refreshSignupGate(): Promise<void> {
  const started = generation;
  change({ phase: gate.phase === 'ready' ? 'ready' : 'loading', progress: gate.progress });
  let progress: SignupProgress | null = null;
  try {
    progress = await authed(signupProgressRequest);
  } catch (error) {
    if (!isApiError(error)) throw error;
  }
  if (started !== generation) return;
  change({ phase: 'ready', progress });
}

/** Takes the progress a step's own answer carries. */
export function setSignupProgress(progress: SignupProgress) {
  change({ phase: 'ready', progress });
}

/** Signed out: forget everything, so the next sign-in reads its own account's progress. */
export function resetSignupGate() {
  generation += 1;
  if (gate.phase !== 'idle') change({ phase: 'idle', progress: null });
}

export function signupGateState(): Gate {
  return gate;
}

export function useSignupGate(): { phase: Gate['phase']; needsEmail: boolean; progress: SignupProgress | null } {
  const current = useSyncExternalStore(subscribe, () => gate, () => gate);
  return {
    phase: current.phase,
    needsEmail: Boolean(current.progress?.inSequence && current.progress.step === 'email'),
    progress: current.progress,
  };
}
