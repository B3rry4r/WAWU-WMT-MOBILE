import { api, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import type { components, operations } from '@/api/schema.generated';

import { tidyBillerName } from './names';

/**
 * Bills are bought through Flutterwave's checkout, as the website does (R-102, BILLS-02, BILLS-03, BILLS-08). The Hub's `/bills/*`
 * routes are the website's, live today; the wallet is not involved and the app never talks to Flutterwave except in the checkout
 * window (`CheckoutModal`):
 * - `GET /bills/categories`, `/categories/{category}/billers` and `/billers/{billerCode}/items`: the provider's lists, passed
 *   through as they come (snake_case names);
 * - `POST /bills/validate`: the name on a meter, smartcard or phone, before any money moves;
 * - `POST /bills/init`: records the intent and answers what the checkout needs (`billPaymentId`, `flutterwaveConfig`). Before any
 *   charge it may refuse with `503`, "Bill payments are briefly unavailable while we top up..."; that sentence is shown as the Hub wrote it;
 * - `POST /bills/{id}/verify` with the checkout's transaction id: the Hub checks the payment with the provider and delivers the bill.
 *   Safe to send again: a bill past `pending` answers its current state. A bill the biller could not deliver is `400` with the Hub's
 *   own sentence;
 * - `GET /bills/mine`: what the person has paid for (Recent);
 * - `GET /bills/{id}/status` (BILLS-09): where one of the person's bills stands, with its prepaid token and units. A `processing`
 *   bill is read this way every 10 seconds on S7; the Hub asks the provider at most once in 20 seconds and never buys.
 *
 * The Hub's success body is `{ statusCode, message, data }` and the contract types only `data` (SHARED-CHANGES.md row 11), so each
 * call reads `data` itself.
 */
export type BillCategory = components['schemas']['BillCategory'];
export type Biller = components['schemas']['Biller'];
export type BillItem = components['schemas']['BillItem'];
export type Validated = NonNullable<operations['BillPaymentController_validate']['responses'][200]['content']>['application/json'];
type InitAnswer = NonNullable<operations['BillPaymentController_init']['responses'][200]['content']>['application/json'];
export type BillRecord = NonNullable<operations['BillPaymentController_verify']['responses'][200]['content']>['application/json'];
export type BillStatusRead = NonNullable<operations['BillPaymentController_status']['responses'][200]['content']>['application/json'];

/** The checkout's own parameters, exactly as `init` answers them. */
export type CheckoutConfig = InitAnswer[Exclude<keyof InitAnswer, 'billPaymentId'>];
export type InitiatedBill = { billPaymentId: string; config: CheckoutConfig };

/** What the Hub calls a bill's state: `processing` is a normal resting state (the provider confirms delivery on its own time). */
export type BillStatus = 'pending' | 'paid' | 'processing' | 'delivered' | 'failed' | 'refunded';

export const billsKeys = {
  all: ['bills'] as const,
  categories: ['bills', 'categories'] as const,
  billers: (category: string) => ['bills', 'billers', category] as const,
  items: (billerCode: string) => ['bills', 'items', billerCode] as const,
  mine: ['bills', 'mine'] as const,
  status: (id: string) => ['bills', 'status', id] as const,
};

type Envelope<T> = { data?: T | null };

function unreadable(what: string): ApiError {
  return new ApiError('unknown', 200, `The ${what} could not be read. Try again.`);
}

const isText = (value: unknown): value is string => typeof value === 'string';
const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

/** The Hub's `data`, whether or not the envelope came with it (a list route's body is the list). */
function dataOf(body: unknown): unknown {
  return isObject(body) && !Array.isArray(body) && 'data' in body ? (body as Envelope<unknown>).data : body;
}

/** A list of rows: the array itself, or an object that carries it as `items` (the Hub's paged lists) or `data` (the provider's). */
function rowsOf(body: unknown, what: string): unknown[] {
  const data = dataOf(body);
  if (Array.isArray(data)) return data;
  if (isObject(data) && Array.isArray(data.items)) return data.items;
  // The provider's own page: `{ current_page, data: [...] }`.
  if (isObject(data) && Array.isArray(data.data)) return data.data;
  throw unreadable(what);
}

/** The categories the provider lists. */
export async function fetchCategories(): Promise<BillCategory[]> {
  const body = await unwrap(api.GET('/api/hub/bills/categories'));
  const rows = rowsOf(body, 'bill types');
  return rows.filter((r): r is BillCategory => isObject(r) && isText(r.name)) as BillCategory[];
}

/**
 * The billers in a category, by the category's CODE (the provider matches on the code). A company's name is kept tidy from here on
 * (`tidyBillerName`): the provider's "MTN NIGERIA" is "MTN" on a chip, in the review, on the receipt and in Recent.
 */
export async function fetchBillers(category: string): Promise<Biller[]> {
  const body = await unwrap(api.GET('/api/hub/bills/categories/{category}/billers', { params: { path: { category } } }));
  const rows = rowsOf(body, 'companies');
  return rows
    .filter((r): r is Biller => isObject(r) && isText(r.name) && isText(r.biller_code))
    .map((r) => ({ ...r, name: tidyBillerName(r.name, r.biller_code) }));
}

/** A price as the provider sends it: a number, or digits in text ("4400", "6000.00"); anything else, and a negative, is no price (0). */
function readPrice(value: unknown): number {
  if (isNumber(value)) return value > 0 ? value : 0;
  if (isText(value) && /^\s*\d+(\.\d+)?\s*$/.test(value)) return Number(value);
  return 0;
}

/**
 * What a biller sells: bundles, packages, plans. Airtime lists one code under every network. A row is kept when it has a code and a
 * name (its short name will do); a price that did not arrive as a number is read, or is no price, and never drops the row: a
 * filter on the price once left a company with nothing to pick.
 */
export async function fetchItems(billerCode: string): Promise<BillItem[]> {
  const body = await unwrap(api.GET('/api/hub/bills/billers/{billerCode}/items', { params: { path: { billerCode } } }));
  const rows = rowsOf(body, 'packages');
  const items: BillItem[] = [];
  for (const r of rows) {
    if (!isObject(r) || !isText(r.item_code) || r.item_code.trim() === '') continue;
    const name = isText(r.name) && r.name.trim() !== '' ? r.name : isText(r.short_name) ? r.short_name : '';
    if (name.trim() === '') continue;
    items.push({ ...(r as unknown as BillItem), name, amount: readPrice(r.amount) });
  }
  return items;
}

/** The name on a meter, smartcard or phone. A number the provider does not know rejects with the Hub's `502`. */
export async function validateCustomer(itemCode: string, customer: string): Promise<Validated> {
  const body = await unwrap(api.POST('/api/hub/bills/validate', { body: { itemCode, customer } }));
  const data = dataOf(body);
  if (!isObject(data) || !isText(data.customer)) throw unreadable('number');
  return {
    customer: data.customer,
    name: isText(data.name) && data.name.trim() !== '' ? data.name : null,
    fee: isNumber(data.fee) ? data.fee : 0,
    minimum: isNumber(data.minimum) ? data.minimum : 0,
    maximum: isNumber(data.maximum) ? data.maximum : 0,
  };
}

export type InitBillInput = { category: string; billerCode: string; itemCode: string; billerName: string; customerRef: string; amount: number };

/** Records the intent and answers what the checkout needs. Nothing is charged by this call. */
export async function initBill(input: InitBillInput): Promise<InitiatedBill> {
  const body = await unwrap(api.POST('/api/hub/bills/init', { body: input }));
  const data = dataOf(body) as Partial<InitAnswer> | null;
  const c = data?.flutterwaveConfig;
  if (!data || !isText(data.billPaymentId) || !c || !isText(c.txRef) || !isNumber(c.amount) || !isText(c.currency) || !isText(c.publicKey) || c.publicKey === '') {
    throw unreadable('payment');
  }
  return { billPaymentId: data.billPaymentId, config: { txRef: c.txRef, amount: c.amount, currency: c.currency, publicKey: c.publicKey } };
}

const STATUSES: readonly string[] = ['pending', 'paid', 'processing', 'delivered', 'failed', 'refunded'];

/** A prepaid token is a short run of digits (letters allowed, billers differ); the Hub cleans it, the app checks it again before it draws it. */
const TOKEN_SHAPE = /^[0-9A-Za-z][0-9A-Za-z -]{3,63}$/;
/** Units are a plain number of kilowatt hours as text ("45.2"). */
const UNITS_SHAPE = /^\d{1,9}(\.\d{1,4})?$/;
const readToken = (value: unknown): string | null => (isText(value) && TOKEN_SHAPE.test(value.trim()) ? value.trim() : null);
const readUnits = (value: unknown): string | null => (isText(value) && UNITS_SHAPE.test(value.trim()) ? value.trim() : null);

/** One bill as the Hub writes it; a row that cannot be read is dropped, never half drawn. */
export function readRecord(raw: unknown): BillRecord | null {
  if (!isObject(raw)) return null;
  const r = raw as Partial<BillRecord>;
  if (!isText(r.id) || !isText(r.category) || !isText(r.billerName) || !isText(r.customerRef) || !isNumber(r.amount) || !isText(r.status) || !STATUSES.includes(r.status) || !isText(r.createdAt)) {
    return null;
  }
  return {
    id: r.id,
    category: r.category,
    billerName: tidyBillerName(r.billerName),
    customerRef: r.customerRef,
    amount: r.amount,
    fee: isNumber(r.fee) ? r.fee : 0,
    status: r.status,
    providerReference: isText(r.providerReference) ? r.providerReference : null,
    failureReason: isText(r.failureReason) ? r.failureReason : null,
    createdAt: r.createdAt,
    deliveredAt: isText(r.deliveredAt) ? r.deliveredAt : null,
    refundReference: isText(r.refundReference) ? r.refundReference : null,
    refundedAt: isText(r.refundedAt) ? r.refundedAt : null,
    token: readToken(r.token),
    units: readUnits(r.units),
  };
}

/**
 * Confirms the payment with the Hub and delivers the bill. Sent again with the same transaction id it answers the bill's current
 * state and never buys twice. The answer is cached under the bill's id so the receipt opens at once.
 */
export async function verifyBill(billPaymentId: string, transactionId: string): Promise<BillRecord> {
  const body = await unwrap(api.POST('/api/hub/bills/{id}/verify', { params: { path: { id: billPaymentId } }, body: { transactionId } }));
  const record = readRecord(dataOf(body));
  if (!record) throw unreadable('receipt');
  cacheRecord(record);
  void queryClient.invalidateQueries({ queryKey: billsKeys.mine });
  return record;
}

/** What the person has paid for, newest first (S2's Recent, and where a receipt is found again). */
export async function fetchMine(): Promise<BillRecord[]> {
  const body = await unwrap(api.GET('/api/hub/bills/mine'));
  return rowsOf(body, 'bills')
    .map(readRecord)
    .filter((r): r is BillRecord => r !== null);
}

/** Where one bill stands. A status the app does not know, or an answer for another bill, is unreadable and changes nothing. */
export async function fetchStatus(id: string): Promise<BillStatusRead> {
  const body = await unwrap(api.GET('/api/hub/bills/{id}/status', { params: { path: { id } } }));
  const data = dataOf(body);
  if (!isObject(data) || data.id !== id || !isText(data.status) || !STATUSES.includes(data.status)) throw unreadable('bill');
  return {
    id,
    status: data.status as BillStatusRead['status'],
    token: readToken(data.token),
    units: readUnits(data.units),
    providerReference: isText(data.providerReference) ? data.providerReference : null,
  };
}

export const mineQuery = { queryKey: billsKeys.mine, queryFn: fetchMine } as const;

export const recordKey = (id: string) => ['bills', 'record', id] as const;

/** Keeps a record the Hub just gave, so its receipt does not wait for the list. */
export function cacheRecord(record: BillRecord): void {
  queryClient.setQueryData(recordKey(record.id), record);
}

/**
 * Puts what a status read said into the bill's cached record, which is where S7 draws from. A token or units the record already has are
 * kept when the read carries none. When the bill leaves its in-flight state Recent is read again (the receipt itself needs nothing
 * more: it draws the status, the token, the units and the reference, and the Hub's failure sentence comes from this session).
 */
export function applyStatus(read: BillStatusRead): BillRecord | null {
  const cached = queryClient.getQueryData<BillRecord>(recordKey(read.id));
  if (!cached) return null;
  const next: BillRecord = {
    ...cached,
    status: read.status,
    token: read.token ?? cached.token ?? null,
    units: read.units ?? cached.units ?? null,
    providerReference: read.providerReference ?? cached.providerReference,
  };
  cacheRecord(next);
  if (read.status !== cached.status && read.status !== 'processing') {
    void queryClient.invalidateQueries({ queryKey: billsKeys.mine });
  }
  return next;
}
