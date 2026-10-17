import { api, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { components } from '@/api/schema.generated';
import { readPaymentQuote, type PaymentQuote } from '@/features/events/buyApi';

import type { IntakeView } from './api';

/**
 * The calls behind enrolling in a course and paying for it from the wallet (SCHOOLS-06: SC4 to SC7 and SC11) and behind My courses
 * and the school's own site (SCHOOLS-08: SC8, SC9), as the Hub's contract types them (SCHOOLS-07, SCHOOLS-09, SCHOOLS-10):
 * - `POST /schools/enrolments { intakeId }`: SC4's Continue holds a place in the class and answers the order (the fee asked for
 *   and `reservedUntil`). The same request again answers the same order, so a repeated tap holds one place. A full class is
 *   `409 class_full` with `reason.nextIntake` (SC11), a class that has begun is `409 intake_closed`.
 * - `GET /schools/enrolments/{id}`: the order as it stands now (SC5 while `reserved`, SC7's receipt once `enrolled`).
 * - `GET /schools/enrolments?tab=`: My courses (SC8), newest first, a page at a time by cursor.
 * - `GET /money/payments/quote?kind=school_fee&targetId=` and `POST /money/payments`: SC5's total and the payment, which is the
 *   money core's own (the PIN is the `X-Transaction-Pin` header, the `Idempotency-Key` is one per payment intent).
 * - `GET /schools/courses/{id}/apply-link` and `POST .../apply-click`: SC9's link, and the one tap that records the click.
 *
 * The Hub's success body is `{ statusCode, message, data }` and the contract types only `data` (SHARED-CHANGES.md row 11), so each
 * call reads the envelope itself. A refusal carries more than a code (`reason.nextIntake`, `triesLeft`, `balanceKobo`) and the
 * shared `ApiError` keeps only the code, so the calls that branch on it read the answer themselves and hand the screen one outcome.
 */
export type Enrolment = components['schemas']['SchoolEnrolmentView'];
export type EnrolmentRow = components['schemas']['SchoolEnrolmentListItem'];
export type EnrolTab = EnrolmentRow['tab'];
export type EnrolmentsPage = { items: EnrolmentRow[]; nextCursor: string | null };
export type ApplyLink = components['schemas']['SchoolApplyLinkView'];
export type FeePayment = components['schemas']['PaymentView'];

type Envelope<T> = { data?: T | null };

/** How many rows one page of My courses asks for: the Hub's default, written down so every page is the same. */
export const ENROLMENTS_PAGE_SIZE = 20;

export const enrolKeys = {
  enrolment: (id: string) => ['schools', 'enrolment', id] as const,
  mine: (tab: EnrolTab) => ['schools', 'enrolments', tab] as const,
  applyLink: (courseId: string) => ['schools', 'apply-link', courseId] as const,
};

const filled = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const isKobo = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;

function unreadable(what: string): ApiError {
  return new ApiError('unknown', 200, `Your ${what} could not be read. Try again.`);
}

const STATUSES: readonly Enrolment['status'][] = ['reserved', 'enrolled', 'released', 'refunded'];

/** An enrolment as the screens read it: a known status, whole-kobo money, the course, the school and the class. Anything else is refused, never drawn half empty. */
export function readEnrolment(value: unknown): Enrolment {
  const e = value as Partial<Enrolment> | null;
  const ok =
    e &&
    typeof e === 'object' &&
    filled(e.id) &&
    filled(e.reference) &&
    STATUSES.includes(e.status as Enrolment['status']) &&
    !!e.course &&
    filled(e.course.id) &&
    filled(e.course.title) &&
    !!e.school &&
    filled(e.school.id) &&
    filled(e.school.name) &&
    !!e.intake &&
    filled(e.intake.id) &&
    filled(e.intake.startDate) &&
    isKobo(e.priceKobo) &&
    (e.totalKobo === null || e.totalKobo === undefined || isKobo(e.totalKobo)) &&
    (e.providerFeeKobo === null || e.providerFeeKobo === undefined || isKobo(e.providerFeeKobo));
  if (!ok) throw unreadable('enrolment');
  return e as Enrolment;
}

function readRow(value: unknown): EnrolmentRow {
  const row = readEnrolment(value) as Partial<EnrolmentRow>;
  if ((row.tab !== 'current' && row.tab !== 'finished') || !filled(row.endDate)) throw unreadable('courses');
  return row as EnrolmentRow;
}

/** GET /schools/enrolments/{id}: the order as it stands. Our own records only; the Hub never asks the provider. */
export async function fetchEnrolment(id: string): Promise<Enrolment> {
  const body = (await unwrap(api.GET('/api/hub/schools/enrolments/{id}', { params: { path: { id } } }))) as unknown as Envelope<Enrolment>;
  return readEnrolment(body?.data);
}

/** GET /schools/enrolments: one page of My courses. `cursor` is the previous page's `nextCursor`, opaque and never built here. */
export async function fetchEnrolmentsPage(tab: EnrolTab, cursor: string | null): Promise<EnrolmentsPage> {
  const query = { tab, limit: ENROLMENTS_PAGE_SIZE, ...(cursor === null ? {} : { cursor }) };
  const body = (await unwrap(api.GET('/api/hub/schools/enrolments', { params: { query } }))) as unknown as Envelope<{ items?: unknown; nextCursor?: unknown }>;
  const data = body?.data;
  if (!data || typeof data !== 'object' || !Array.isArray(data.items)) throw unreadable('courses');
  const next = data.nextCursor;
  if (next !== null && next !== undefined && typeof next !== 'string') throw unreadable('courses');
  return { items: data.items.map(readRow), nextCursor: next ?? null };
}

/** What became of SC4's Continue, in the shapes the screen branches on. */
export type EnrolOutcome =
  /** A place is held (`reserved`), or a course with no fee enrolled at once (`enrolled`). */
  | { kind: 'held'; enrolment: Enrolment }
  /** `409 class_full`: nothing was taken. `nextIntake` is the soonest other class with a seat, or null (SC11). */
  | { kind: 'class_full'; nextIntake: IntakeView | null; message: string }
  /** `409 already_enrolled`: the student has this course already; `enrolmentId` opens it. */
  | { kind: 'already_enrolled'; enrolmentId: string | null; message: string }
  /** Any other refusal, in the Hub's own sentence (`intake_closed`, `reservation_limit`, a class that is gone). Nothing was taken. */
  | { kind: 'refused'; code: string | null; message: string }
  /** No answer: no connection, a timeout or a server fault. The same request is safe to send again (it holds one place). */
  | { kind: 'unanswered' };

type Reason = {
  code?: unknown;
  message?: unknown;
  nextIntake?: unknown;
  enrolmentId?: unknown;
  triesLeft?: unknown;
  lockedUntil?: unknown;
  balanceKobo?: unknown;
  totalKobo?: unknown;
  shortfallKobo?: unknown;
  paymentQuote?: unknown;
  paymentId?: unknown;
};

/** The refusal's `reason`, read defensively: the Hub answers `{ statusCode, message, reason }`. */
function reasonOf(error: unknown): { reason: Reason; message: string } {
  const record = typeof error === 'object' && error !== null ? (error as { reason?: unknown; message?: unknown }) : {};
  const reason = typeof record.reason === 'object' && record.reason !== null ? (record.reason as Reason) : {};
  const raw = record.message;
  const message = Array.isArray(raw) ? raw.filter((p) => typeof p === 'string').join('. ') : typeof raw === 'string' ? raw : '';
  return { reason, message: typeof reason.message === 'string' && reason.message ? reason.message : message };
}

const HTTP_CREATED = 201;
const HTTP_SERVER_MIN = 500;

function readIntakeView(value: unknown): IntakeView | null {
  const i = value as Partial<IntakeView> | null;
  if (!i || typeof i !== 'object' || !filled(i.id) || !filled(i.startDate) || typeof i.seatsLeft !== 'number' || typeof i.full !== 'boolean') return null;
  return i as IntakeView;
}

/** POST /schools/enrolments. Never rejects: whatever came back (or did not) is an `EnrolOutcome`. */
export async function enrol(intakeId: string): Promise<EnrolOutcome> {
  let result;
  try {
    result = await api.POST('/api/hub/schools/enrolments', { body: { intakeId } });
  } catch {
    return { kind: 'unanswered' };
  }
  const { data, error, response } = result;
  if (response.status === HTTP_CREATED) {
    try {
      return { kind: 'held', enrolment: readEnrolment((data as unknown as Envelope<Enrolment> | undefined)?.data) };
    } catch {
      // The Hub said created and the answer cannot be read: a place may be held, so it is not a refusal. The same request is safe again.
      return { kind: 'unanswered' };
    }
  }
  if (response.status >= HTTP_SERVER_MIN) return { kind: 'unanswered' };
  const { reason, message } = reasonOf(error);
  const code = typeof reason.code === 'string' ? reason.code : null;
  if (code === 'class_full') return { kind: 'class_full', nextIntake: readIntakeView(reason.nextIntake), message: message || 'This class is full.' };
  if (code === 'already_enrolled') {
    return { kind: 'already_enrolled', enrolmentId: filled(reason.enrolmentId) ? reason.enrolmentId : null, message: message || 'You are already enrolled in this course.' };
  }
  return { kind: 'refused', code, message: message || 'We could not hold a place in this class. Nothing was taken.' };
}

/** The quote was refused because this student already has a payment for the order that is not finished: `paymentId` is that payment. */
export class OpenPaymentError extends Error {
  constructor(readonly paymentId: string) {
    super('payment_in_progress');
  }
}

const HTTP_CONFLICT = 409;

/**
 * GET /money/payments/quote?kind=school_fee: SC5's fee, Bank charge and total, the balance, and the token the payment must carry. A fresh
 * one per tap. A `409 payment_in_progress` (a payment of theirs for this order is still being confirmed, `reason.paymentId`) is an
 * `OpenPaymentError`, so a second phone waits for that payment and draws no Pay.
 */
export async function fetchFeeQuote(enrolmentId: string): Promise<PaymentQuote> {
  const result = await api.GET('/api/hub/money/payments/quote', { params: { query: { kind: 'school_fee', targetId: enrolmentId } } });
  if (result.response.status === HTTP_CONFLICT) {
    const { reason } = reasonOf(result.error);
    if (reason.code === 'payment_in_progress' && filled(reason.paymentId)) throw new OpenPaymentError(reason.paymentId);
  }
  const body = (await unwrap(Promise.resolve(result))) as unknown as Envelope<PaymentQuote>;
  return readPaymentQuote(body?.data);
}

/** Why the Hub did not take the payment, in the shapes the screen branches on. */
export type FeeOutcome =
  /** The Hub took the request and answered with the payment. Its `status` says how it stands: completed, pending, failed, reversed. */
  | { kind: 'done'; payment: FeePayment }
  /** `403 pin_incorrect`: nothing moved, and no key is spent. */
  | { kind: 'pin_incorrect'; triesLeft: number }
  | { kind: 'pin_locked'; lockedUntil: string }
  /** `409 pin_not_set` (or `403 pin_required` with none set): A9 sets one. */
  | { kind: 'pin_not_set' }
  /** `409 wallet_not_open`: Open your wallet. */
  | { kind: 'no_wallet' }
  /** `402 insufficient_funds`: the bank's figures. */
  | { kind: 'insufficient_funds'; balanceKobo: number; totalKobo: number; shortfallKobo: number }
  /** `409 quote_changed`: the price moved; this is the quote as it stands now (null when the Hub sent none). */
  | { kind: 'quote_changed'; quote: PaymentQuote | null }
  /** `409 payment_in_progress`: a payment for this order is already being confirmed (`paymentId` when the Hub names it). Read it; never pay again. */
  | { kind: 'in_progress'; paymentId: string | null }
  /** No answer that proves anything (no connection, a timeout, a server fault, the same key still running): send the SAME key again. */
  | { kind: 'unanswered' }
  /** Any other refusal, in the Hub's own sentence. Nothing moved. */
  | { kind: 'refused'; code: string | null; message: string };

export type FeeInput = {
  enrolmentId: string;
  /** The quote's `totalKobo` and `quoteToken`, as the person saw them. */
  expectedTotalKobo: number;
  quoteToken: string;
  /** One per payment intent, kept across retries of the same intent. */
  key: string;
  pin: string;
};

const PAYMENT_STATUSES: readonly FeePayment['status'][] = ['pending', 'completed', 'failed', 'reversed'];

function readPayment(value: unknown): FeePayment {
  const p = value as Partial<FeePayment> | null;
  if (!p || typeof p !== 'object' || !filled(p.id) || !PAYMENT_STATUSES.includes(p.status as FeePayment['status']) || !isKobo(p.totalKobo)) throw unreadable('payment');
  return p as FeePayment;
}

/** GET /money/payments/{id}: one payment as it stands now (our own record, never the provider). `pending` becomes `completed`, `failed` or `reversed`. */
export async function fetchPayment(id: string): Promise<FeePayment> {
  const body = (await unwrap(api.GET('/api/hub/money/payments/{id}', { params: { path: { id } } }))) as unknown as Envelope<FeePayment>;
  return readPayment(body?.data);
}

/**
 * POST /money/payments with `kind: school_fee`. Never rejects: whatever came back (or did not) is a `FeeOutcome`, so the screen
 * decides in one place. A request that got no answer is `unanswered`, and so is every 5xx: money may have moved, so only the SAME
 * key is safe to send again.
 */
export async function payFee(input: FeeInput): Promise<FeeOutcome> {
  let result;
  try {
    result = await api.POST('/api/hub/money/payments', {
      params: { header: { 'X-Transaction-Pin': input.pin, 'Idempotency-Key': input.key } },
      body: { kind: 'school_fee', targetId: input.enrolmentId, expectedTotalKobo: input.expectedTotalKobo, quoteToken: input.quoteToken },
    });
  } catch {
    return { kind: 'unanswered' };
  }
  const { data, error, response } = result;
  if (response.status === HTTP_CREATED) {
    try {
      return { kind: 'done', payment: readPayment((data as unknown as Envelope<FeePayment> | undefined)?.data) };
    } catch {
      // The Hub said created and the answer cannot be read: the payment may exist, so it is not a refusal.
      return { kind: 'unanswered' };
    }
  }
  if (response.status >= HTTP_SERVER_MIN) return { kind: 'unanswered' };
  const { reason, message } = reasonOf(error);
  const code = typeof reason.code === 'string' ? reason.code : null;
  switch (code) {
    case 'pin_incorrect':
      return { kind: 'pin_incorrect', triesLeft: typeof reason.triesLeft === 'number' ? reason.triesLeft : 0 };
    case 'pin_locked':
      return filled(reason.lockedUntil) ? { kind: 'pin_locked', lockedUntil: reason.lockedUntil } : { kind: 'unanswered' };
    case 'pin_not_set':
    case 'pin_required':
      return { kind: 'pin_not_set' };
    case 'wallet_not_open':
      return { kind: 'no_wallet' };
    case 'idempotency_in_progress':
      return { kind: 'unanswered' };
    case 'payment_in_progress':
      return { kind: 'in_progress', paymentId: filled(reason.paymentId) ? reason.paymentId : null };
    case 'insufficient_funds':
      if (isKobo(reason.balanceKobo) && isKobo(reason.totalKobo) && isKobo(reason.shortfallKobo)) {
        return { kind: 'insufficient_funds', balanceKobo: reason.balanceKobo, totalKobo: reason.totalKobo, shortfallKobo: reason.shortfallKobo };
      }
      return { kind: 'refused', code, message: message || 'There is not enough in your wallet for this course.' };
    case 'quote_changed':
      try {
        return { kind: 'quote_changed', quote: readPaymentQuote(reason.paymentQuote) };
      } catch {
        return { kind: 'quote_changed', quote: null };
      }
    default:
      return { kind: 'refused', code, message: message || 'This payment was not taken. Nothing left your wallet.' };
  }
}

function readLink(value: unknown): ApplyLink {
  const l = value as Partial<ApplyLink> | null;
  if (!l || typeof l !== 'object' || !filled(l.url) || !filled(l.code) || !filled(l.courseId)) throw unreadable('link');
  return l as ApplyLink;
}

/** GET /schools/courses/{id}/apply-link: the school's own link with the WAWU code added, as SC9 prints it. Records nothing. */
export async function fetchApplyLink(courseId: string): Promise<ApplyLink> {
  const body = (await unwrap(api.GET('/api/hub/schools/courses/{id}/apply-link', { params: { path: { id: courseId } } }))) as unknown as Envelope<ApplyLink>;
  return readLink(body?.data);
}

/** POST /schools/courses/{id}/apply-click: one tap on "Continue to their site" records one click and answers with the link to open. */
export async function recordApplyClick(courseId: string): Promise<ApplyLink> {
  const body = (await unwrap(api.POST('/api/hub/schools/courses/{id}/apply-click', { params: { path: { id: courseId } } }))) as unknown as Envelope<ApplyLink>;
  return readLink(body?.data);
}
