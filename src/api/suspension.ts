/**
 * USER-SUSPEND (R-121). The Hub refuses every write of a suspended person with a 403 whose `reason.code` is
 * `account_suspended`, in its own words and with the support address. The client reports that refusal here, once per
 * answer, whichever screen sent the write; the root layout listens and opens the one calm screen (`/suspended`). The
 * words and the address come from the Hub and are never written in the app.
 */
export const ACCOUNT_SUSPENDED_CODE = 'account_suspended';

export type SuspendedRefusal = { message: string; supportEmail: string | null };

type Listener = (refusal: SuspendedRefusal) => void;
const listeners = new Set<Listener>();
let last: SuspendedRefusal | null = null;

/** Listen for a refused write. Returns the way to stop. */
export function onSuspendedRefusal(listener: Listener): () => void {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

/** The newest refusal this run of the app has seen, for the screen it opens. */
export function lastSuspendedRefusal(): SuspendedRefusal | null {
  return last;
}

export function reportSuspendedRefusal(refusal: SuspendedRefusal): void {
  last = refusal;
  listeners.forEach((listener) => listener(refusal));
}

/** The refusal a 403 answer carries, or null when it is some other 403. */
export function refusalOf(body: unknown): SuspendedRefusal | null {
  if (typeof body !== 'object' || body === null) return null;
  const record = body as { message?: unknown; reason?: unknown };
  const reason = typeof record.reason === 'object' && record.reason !== null ? (record.reason as Record<string, unknown>) : null;
  if (reason?.code !== ACCOUNT_SUSPENDED_CODE) return null;
  const message = typeof record.message === 'string' && record.message ? record.message : typeof reason.message === 'string' ? reason.message : '';
  if (!message) return null;
  return { message, supportEmail: typeof reason.supportEmail === 'string' ? reason.supportEmail : null };
}
