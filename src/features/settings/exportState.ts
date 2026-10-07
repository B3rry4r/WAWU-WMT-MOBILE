import type { ExportRequest } from './api/hub';

/** The row's line when nothing is pending: where an export goes (design/_gen/settings.js line 15). */
export const EXPORT_IDLE_LINE = 'Sent to your email';
export const EXPORT_PENDING_LINE = 'On its way to your email';
export const EXPORT_FAILED_LINE = 'Could not be sent, tap to try again';

export type ExportState = 'idle' | 'pending' | 'failed';

/** Where the person's newest data request stands: none or sent, still pending, or given up on. */
export function exportStateOf(requests: readonly ExportRequest[] | undefined): ExportState {
  if (!requests || requests.length === 0) return 'idle';
  const newest = requests.reduce((latest, next) => (Date.parse(next.requestedAt) > Date.parse(latest.requestedAt) ? next : latest));
  if (newest.status === 'pending') return 'pending';
  if (newest.status === 'failed') return 'failed';
  return 'idle';
}

export function exportLineOf(state: ExportState): string {
  return state === 'pending' ? EXPORT_PENDING_LINE : state === 'failed' ? EXPORT_FAILED_LINE : EXPORT_IDLE_LINE;
}
