import { isApiError } from '@/api/client';

import type { Application, ApplyBody, CredentialKind, ProField } from './api';

/** The Hub's limits on an application (`ApplyProfessionalDto`). */
export const limits = { headlineMin: 8, headlineMax: 120, aboutMin: 40, aboutMax: 2000, services: 12, service: 60, licence: 80, issuer: 160 } as const;

/**
 * Text as the Hub should get it: no NUL character (the Hub's database refuses one and the application route answers 500,
 * BACKEND_GAPS.md G-325), then trimmed. Nobody types a NUL; a paste can carry one.
 */
export const clean = (typed: string): string => typed.replace(/\u0000/g, '').trim();

export const CREDENTIAL_KINDS: readonly { value: CredentialKind; label: string }[] = [
  { value: 'licence', label: 'Practising licence' },
  { value: 'qualification', label: 'Qualification' },
  { value: 'portfolio', label: 'Work samples' },
];

/** The field an application is filed in: the one whose categories hold the application's category. */
export function fieldOfCategory(fields: readonly ProField[], category: string): ProField | undefined {
  return fields.find((f) => f.categories.includes(category));
}

/** The words for a category no field covers (an application filed on the web): "real_estate" reads "Real estate". */
export function categoryLabel(category: string): string {
  const words = category.replace(/_/g, ' ').trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : 'Other';
}

export function labelOfApplication(fields: readonly ProField[], application: Pick<Application, 'category'>): string {
  return fieldOfCategory(fields, application.category)?.label ?? categoryLabel(application.category);
}

/** A field is taken while an application in it waits or is listed; the Hub refuses a second one (409). */
export function isTaken(field: ProField, mine: readonly Application[]): boolean {
  return mine.some((a) => field.categories.includes(a.category) && (a.status === 'pending' || a.status === 'approved'));
}

export function openFields(fields: readonly ProField[], mine: readonly Application[]): ProField[] {
  return fields.filter((f) => !isTaken(f, mine));
}

/** The turned-down application P8's "Apply again" starts from: the newest one in that field. */
export function rejectedIn(field: ProField, mine: readonly Application[]): Application | undefined {
  return mine
    .filter((a) => field.categories.includes(a.category) && a.status === 'rejected')
    .sort((a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt))[0];
}

export type ServicesForm = { headline: string; about: string; services: string[] };
export type ServicesProblems = { fields?: string; headline?: string; about?: string };

/** What is wrong with P5, in words the person can act on; an empty object means Continue can go on. */
export function servicesProblems(form: ServicesForm, selected: readonly string[]): ServicesProblems {
  const out: ServicesProblems = {};
  if (selected.length === 0) out.fields = 'Pick at least one field.';
  const headline = clean(form.headline);
  if (headline.length < limits.headlineMin) out.headline = `Write at least ${limits.headlineMin} characters.`;
  else if (headline.length > limits.headlineMax) out.headline = `Keep it to ${limits.headlineMax} characters or fewer.`;
  const about = clean(form.about);
  if (about.length < limits.aboutMin) out.about = `Tell people more: at least ${limits.aboutMin} characters.`;
  else if (about.length > limits.aboutMax) out.about = `Keep it to ${limits.aboutMax} characters or fewer.`;
  return out;
}

/** A new thing the person takes on, or null when it is empty, too long, a repeat, or one too many. */
export function addService(list: readonly string[], typed: string): { list: string[]; problem?: string } {
  const next = clean(typed).replace(/\s+/g, ' ');
  if (!next) return { list: [...list], problem: 'Write what you take on.' };
  if (next.length > limits.service) return { list: [...list], problem: `Keep it to ${limits.service} characters or fewer.` };
  if (list.some((s) => s.toLowerCase() === next.toLowerCase())) return { list: [...list], problem: 'You already added that.' };
  if (list.length >= limits.services) return { list: [...list], problem: `You can add up to ${limits.services}.` };
  return { list: [...list, next] };
}

export type CredentialForm = { kind: CredentialKind; licenceNumber: string; issuer: string };
export type CredentialProblems = { kind?: string; licenceNumber?: string; issuer?: string };

/**
 * What is wrong with P6. A regulated field takes only a practising licence, with its number and the body that
 * issued it, because that body is who a person rings to check it (the Hub refuses anything less). Elsewhere the
 * number and the body are optional.
 */
export function credentialProblems(form: CredentialForm, regulated: boolean, uploading: boolean): CredentialProblems & { upload?: string } {
  const out: CredentialProblems & { upload?: string } = {};
  if (regulated && form.kind !== 'licence') out.kind = 'A regulated field needs a practising licence.';
  const number = clean(form.licenceNumber);
  const issuer = clean(form.issuer);
  if (form.kind === 'licence') {
    if (regulated && !number) out.licenceNumber = 'Add the number on your licence.';
    if (number.length > limits.licence) out.licenceNumber = `Keep it to ${limits.licence} characters or fewer.`;
  }
  if (form.kind !== 'portfolio') {
    if (regulated && form.kind === 'licence' && !issuer) out.issuer = 'Say who issued it, so they can be asked to confirm it.';
    if (issuer.length > limits.issuer) out.issuer = `Keep it to ${limits.issuer} characters or fewer.`;
  }
  if (uploading) out.upload = 'Wait for your file to finish uploading.';
  return out;
}

/** The body of one application. The same credentials go with every field the person picked. */
export function applicationBody(field: ProField, services: ServicesForm, creds: CredentialForm, documents: readonly string[]): ApplyBody {
  const number = clean(creds.licenceNumber);
  const issuer = clean(creds.issuer);
  const body: ApplyBody = {
    category: field.applyCategory as ApplyBody['category'],
    headline: clean(services.headline),
    about: clean(services.about),
    services: services.services.map(clean),
    credentialKind: creds.kind,
    documents: [...documents],
  };
  if (creds.kind === 'licence' && number) body.licenceNumber = number;
  if (creds.kind !== 'portfolio' && issuer) body.issuingBody = issuer;
  return body;
}

/** What P8 says under a row's name for a listing that is approved. */
export const SHOWING = 'Showing in the directory';
export const HIDDEN = 'Hidden. Nobody can find you';

export type RowState = 'listed' | 'hidden' | 'review' | 'turned-down';

export function rowState(a: Pick<Application, 'status' | 'listed'>): RowState {
  if (a.status === 'approved') return a.listed ? 'listed' : 'hidden';
  if (a.status === 'pending') return 'review';
  return 'turned-down';
}

/** Whether the app can start a new application from this row's category: some field the Hub lists files in it. */
export const hasField = (fields: readonly ProField[], row: Pick<Application, 'category'>): boolean => fieldOfCategory(fields, row.category) !== undefined;

/** Newest first, so a field's latest answer leads (the Hub sends them that way already; the screen does not rely on it). */
export function byNewest(rows: readonly Application[]): Application[] {
  return [...rows].sort((a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt));
}

const STATUS_RANK: Record<Application['status'], number> = { approved: 0, pending: 1, rejected: 2 };

/**
 * One row per field, in the order P8 draws them: listed first, then under review, then turned down, the newest first
 * inside each. An older turned-down application in a field that has a newer one is history, not a second card.
 */
export function latestPerField(rows: readonly Application[], fields: readonly ProField[] = []): Application[] {
  const seen = new Set<string>();
  const out: Application[] = [];
  for (const row of byNewest(rows)) {
    // A row filed in a field's second category belongs to that field's card; a category no field files in keeps its own.
    const key = fieldOfCategory(fields, row.category)?.id ?? `category:${row.category}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out.sort((a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status]);
}

/** What a failed call says. The Hub's own sentences are for logs; each kind has the app's own. */
export function sentenceOf(error: unknown, fallback: string): string {
  if (!isApiError(error)) return fallback;
  if (error.kind === 'network') return 'No connection. Check your internet and try again.';
  if (error.kind === 'unauthorized') return 'You were signed out. Sign in again.';
  if (error.kind === 'forbidden') return 'This needs a creator account.';
  if (error.kind === 'conflict') return 'You already have an application in this field.';
  if (error.kind === 'rate_limited') return 'Too many tries. Wait a little and try again.';
  if (error.kind === 'unknown' && error.status === 200 && error.message) return error.message;
  return fallback;
}
