import { useSyncExternalStore } from 'react';

import { isApiError } from '@/api/errors';
import { signupProgressRequest, type SignupProgress } from '@/api/identity';
import { setHubAccountType } from '@/features/after-signup/hubAccountType';

import { authed } from './signupApi';

/**
 * Where a signed-in account stands in the sign-up sequence (SHARED-CHANGES
 * AUTH-05 F2). Read once per signed-in session (cold start, or right after the
 * phone code): `step: 'email'` opens the email step before Home, and the later steps open A11 (`creator_setup`), A12
 * (`interests`) and A13 (`follows`) before Home (AUTH-06). A read that fails (offline, server down) lets the user into
 * the app; the next start reads again.
 *
 * The same read carries the account type picked at A2. It is copied to the Hub's profile here, before the gate opens, so
 * `GET /users/me` answers it for a brand-new person (G-17); WAWU ID's answer is the source, never the screen's memory. The copy
 * is idempotent and never opens a wallet. A Hub that does not answer within `HUB_COPY_WAIT_MS`, or refuses, lets the gate open
 * anyway and the next read tries again.
 */
type Gate = { phase: 'idle' | 'loading' | 'ready'; progress: SignupProgress | null };

let gate: Gate = { phase: 'idle', progress: null };
const listeners = new Set<() => void>();
let generation = 0;
/** The account type last copied to the Hub for this session; null until it has been. */
let copiedToHub: string | null = null;
/** How long the gate waits for the Hub's answer before it opens without it. A screen timing, not a fact. */
const HUB_COPY_WAIT_MS = 6000;

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
  await copyAccountType(progress);
  if (started !== generation) return;
  change({ phase: 'ready', progress });
}

/** Copies the sign-up's account type to the Hub's profile once per session. Never throws: the next read tries again. */
async function copyAccountType(progress: SignupProgress | null): Promise<void> {
  const type = progress?.inSequence ? progress.accountType : null;
  if (!type || copiedToHub === type) return;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      setHubAccountType(type).then(() => {
        copiedToHub = type;
      }),
      new Promise<void>((resolve) => {
        timer = setTimeout(resolve, HUB_COPY_WAIT_MS);
      }),
    ]);
  } catch {
    // Offline or refused: the gate opens, and the next read copies it.
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** Takes the progress a step's own answer carries. */
export function setSignupProgress(progress: SignupProgress) {
  change({ phase: 'ready', progress });
}

/** Signed out: forget everything, so the next sign-in reads its own account's progress. */
export function resetSignupGate() {
  generation += 1;
  copiedToHub = null;
  if (gate.phase !== 'idle') change({ phase: 'idle', progress: null });
}

export function signupGateState(): Gate {
  return gate;
}

/** The steps AUTH-06 draws, which open before Home. */
export type SetupStep = 'creator_setup' | 'interests' | 'follows';

/** "1 of 2": where a step stands among the steps WAWU ID lists after the email, for the bar's corner. Left out when it is the only one. */
export function stepLabel(progress: SignupProgress | null, step: SetupStep): string | undefined {
  const shown = (progress?.steps ?? []).filter((s) => s !== 'email');
  const at = shown.indexOf(step);
  return shown.length > 1 && at >= 0 ? `${at + 1} of ${shown.length}` : undefined;
}

export function useSignupGate(): { phase: Gate['phase']; needsEmail: boolean; setupStep: SetupStep | null; progress: SignupProgress | null } {
  const current = useSyncExternalStore(subscribe, () => gate, () => gate);
  return {
    phase: current.phase,
    needsEmail: Boolean(current.progress?.inSequence && current.progress.step === 'email'),
    setupStep:
      current.progress?.inSequence && (current.progress.step === 'creator_setup' || current.progress.step === 'interests' || current.progress.step === 'follows')
        ? current.progress.step
        : null,
    progress: current.progress,
  };
}
