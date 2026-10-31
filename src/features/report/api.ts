import { api, unwrap } from '@/api/client';
import type { components } from '@/api/schema.generated';

/**
 * REPORT-UGC (Apple 1.2, Google Play's user-generated content policy). One Hub route reports a piece, a comment, a profile,
 * a community message, a chat message or a paid question: `POST /reports { kind, targetId, reason, note? }`. A repeat is the
 * same report with `alreadyReported: true` (no error). The Hub then leaves the item out of the reporter's feed, search,
 * comments, room and chat, and mails support.
 */
export type ReportKind = components['schemas']['CreateUgcReportDto']['kind'];
export type ReportReason = components['schemas']['CreateUgcReportDto']['reason'];
export type ReportReceipt = components['schemas']['UgcReportView'];

type Envelope<T> = { data?: T | null };

export async function sendReport(input: { kind: ReportKind; targetId: string; reason: ReportReason; note?: string }): Promise<ReportReceipt> {
  const note = input.note?.trim();
  const body = { kind: input.kind, targetId: input.targetId, reason: input.reason, ...(note ? { note } : {}) };
  const out = (await unwrap(api.POST('/api/hub/reports', { body }))) as Envelope<ReportReceipt>;
  return out.data as ReportReceipt;
}
