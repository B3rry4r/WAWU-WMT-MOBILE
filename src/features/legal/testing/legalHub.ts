/**
 * A stand-in Hub for the legal payment screens (LEGAL-04, LEGAL-06): every route they call, in the Hub's shapes, with the Hub's own rules for the
 * payment (a key it knows is answered with the first payment before the PIN or the quote is looked at; a debit is counted once per key). It is a
 * `fetch`, installed by `installHub()` before the app's modules load. Nothing leaves the process.
 */
export const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
export const ok = (data: unknown) => json(200, { statusCode: 200, message: 'OK', data });
export const refuse = (status: number, reason: Record<string, unknown>) => json(status, { data: null, statusCode: status, message: String(reason.message ?? ''), reason });

export const R1 = '11111111-1111-4111-8111-111111111111';
export const PROVIDER_FEE = 1575;
/** The conversation id S26 starts from. */
export const THREAD_ID = 'i1';

export function request(over: Record<string, unknown> = {}) {
  return {
    id: R1,
    serviceCode: 'tenancy-review',
    serviceName: 'Tenancy agreement review',
    category: 'Property',
    path: 'consultation',
    status: 'awaiting_quote',
    documents: [],
    consultationMedium: null,
    consultationFee: null,
    consultationPaidAt: null,
    scheduledFor: null,
    quoteAmount: null,
    quoteNote: null,
    contractSigned: false,
    contractSignedAs: null,
    contractSignedAt: null,
    servicePaidAt: null,
    deliverableUrl: null,
    deliveredAt: null,
    cancellationReason: null,
    cancelledAt: null,
    createdAt: '2099-09-20T09:00:00.000Z',
    ...over,
  };
}

export const OPTIONS = [
  { medium: 'zoom', label: 'Video call', minutes: 30, priceKobo: 1_500_000, onRequest: false },
  { medium: 'phone', label: 'Phone call', minutes: 20, priceKobo: 1_000_000, onRequest: false },
  { medium: 'physical', label: 'In person', minutes: null, priceKobo: null, onRequest: true },
];

/** 12:00 Lagos on a Friday far ahead is 11:00 UTC. */
const slot = (hhLagos: number, mm: string, available = true) => ({ startsAt: `2099-10-02T${String(hhLagos - 1).padStart(2, '0')}:${mm}:00.000Z`, available });
export const DAYS = [
  { date: '2099-10-02', slots: [slot(9, '00', false), slot(10, '30'), slot(12, '00'), slot(14, '00')] },
  { date: '2099-10-05', slots: [slot(9, '00'), slot(10, '30')] },
];

export type PayMode = 'paid' | 'pending' | 'failed' | 'lost_after' | 'short' | 'changed' | 'in_progress' | 'not_set';

export const hub = {
  req: request() as Record<string, unknown>,
  options: OPTIONS as unknown[],
  days: DAYS as unknown[],
  bookings: [] as Record<string, unknown>[],
  bookFails: null as null | { status: number; reason: Record<string, unknown> },
  quoteCalls: 0,
  /** What each quote answers: the price in kobo (the n-th ask gets the n-th, the last repeats). */
  prices: [1_500_000] as number[],
  stage: 'consultation' as 'consultation' | 'service',
  quoteRefusal: null as null | { status: number; reason: Record<string, unknown> },
  balanceKobo: 48_525_075,
  pays: [] as { pin: string | null; key: string | null; body: Record<string, unknown> }[],
  paidKeys: new Set<string>(),
  payments: 0,
  wrongFirst: false,
  mode: 'paid' as PayMode,
  signs: [] as Record<string, unknown>[],
  /** The conversation S26 reads (`GET /legal/assistant/{id}`) and starts from (`POST .../start`): its `fixedPrice` is what S26 draws. */
  thread: null as null | Record<string, unknown>,
  /** What `POST /legal/assistant/{id}/start` was asked with. */
  starts: [] as Record<string, unknown>[],
  /** A refusal the start route answers with, until it is cleared. */
  startFails: null as null | { status: number; code: string; message: string },
  deliverables: [] as unknown[],
  feeQuoteFails: false,
  /** While set, the booking answer waits for it: a second tap lands while the first is still under way. */
  bookGate: null as null | Promise<void>,
};

export function resetHub() {
  Object.assign(hub, {
    req: request(),
    options: OPTIONS,
    days: DAYS,
    bookings: [],
    bookFails: null,
    quoteCalls: 0,
    prices: [1_500_000],
    stage: 'consultation',
    quoteRefusal: null,
    balanceKobo: 48_525_075,
    pays: [],
    paidKeys: new Set<string>(),
    payments: 0,
    wrongFirst: false,
    mode: 'paid',
    signs: [],
    thread: null,
    starts: [],
    startFails: null,
    deliverables: [],
    feeQuoteFails: false,
    bookGate: null,
  });
}

const quoteView = (priceKobo: number, n: number) => ({
  requestId: R1,
  stage: hub.stage,
  title: hub.stage === 'consultation' ? 'Tenancy agreement review consultation' : 'Tenancy agreement review',
  priceKobo,
  payment: {
    kind: 'legal_fee',
    targetId: R1,
    title: 'Tenancy agreement review',
    payee: null,
    priceKobo,
    fee: { providerFeeKobo: PROVIDER_FEE, wawuFeeKobo: 0, totalFeeKobo: PROVIDER_FEE },
    totalKobo: priceKobo + PROVIDER_FEE,
    balanceKobo: hub.balanceKobo,
    shortfallKobo: null,
    willBeHeld: false,
    withinDailyLimit: true,
    remainingTodayKobo: null,
    quoteToken: `tok-${n}`,
    expiresAt: '2099-01-01T00:00:00.000Z',
  },
});

const paymentView = (status: string) => ({
  id: 'pay-1',
  method: 'wallet',
  requestId: R1,
  stage: hub.stage,
  title: 'Tenancy agreement review',
  status,
  statusMessage: status === 'failed' ? 'The bank did not confirm it. Nothing was taken.' : null,
  priceKobo: hub.prices[0],
  requestStatus: String(hub.req.status),
  payment: { id: 'pay-1' },
  createdAt: '2099-09-20T09:00:00.000Z',
  paidAt: status === 'paid' ? '2099-09-20T09:00:05.000Z' : null,
});

/** The matter after the fee is applied, as the Hub's own write does. */
function applyFee() {
  const now = '2099-09-20T09:00:05.000Z';
  hub.req = hub.stage === 'consultation' ? { ...hub.req, consultationPaidAt: now, status: 'consultation_scheduled' } : { ...hub.req, servicePaidAt: now, status: 'in_progress' };
}

export function installHub() {
  globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const r = input instanceof Request ? input : new Request(String(input), init);
    const url = new URL(r.url);
    const path = url.pathname.replace(/^\/api\/hub/, '');
    const method = r.method;
    if (path === '/legal/consultation/options') return ok({ timeZone: 'Africa/Lagos', options: hub.options });
    if (path === '/legal/consultation/slots') {
      const medium = url.searchParams.get('medium');
      const o = (hub.options as { medium: string; label: string; minutes: number }[]).find((x) => x.medium === medium);
      return ok({ medium, label: o?.label, minutes: o?.minutes ?? 30, timeZone: 'Africa/Lagos', horizonDays: 21, days: hub.days });
    }
    if (path === `/legal/requests/${R1}/booking` && method === 'POST') {
      const body = (await r.json()) as Record<string, unknown>;
      hub.bookings.push(body);
      if (hub.bookGate) await hub.bookGate;
      if (hub.bookFails) return refuse(hub.bookFails.status, hub.bookFails.reason);
      const priceKobo = body.medium === 'physical' ? null : 1_500_000;
      hub.req = { ...hub.req, consultationMedium: body.medium, consultationFee: priceKobo === null ? null : priceKobo / 100, scheduledFor: body.scheduledFor ?? null, status: 'awaiting_consultation_payment' };
      return ok({ requestId: R1, status: hub.req.status, medium: body.medium, label: 'Video call', minutes: 30, priceKobo, scheduledFor: body.scheduledFor ?? null, holdExpiresAt: null, paid: false, paidAt: null });
    }
    if (path === `/legal/requests/${R1}/booking`) return ok({ requestId: R1, status: hub.req.status, medium: hub.req.consultationMedium, label: 'Video call', minutes: 30, priceKobo: 1_500_000, scheduledFor: hub.req.scheduledFor, holdExpiresAt: null, paid: Boolean(hub.req.consultationPaidAt), paidAt: null });
    if (path === `/legal/requests/${R1}/pay/wallet/quote`) {
      if (hub.quoteRefusal) return refuse(hub.quoteRefusal.status, hub.quoteRefusal.reason);
      hub.quoteCalls += 1;
      const price = hub.prices[Math.min(hub.quoteCalls, hub.prices.length) - 1];
      return ok(quoteView(price, hub.quoteCalls));
    }
    if (path === `/legal/requests/${R1}/pay/wallet` && method === 'POST') {
      const body = (await r.json()) as Record<string, unknown>;
      const key = r.headers.get('idempotency-key') ?? '';
      hub.pays.push({ pin: r.headers.get('x-transaction-pin'), key, body });
      // The Hub answers a key it knows with the first payment, before it looks at the PIN or the quote.
      if (hub.paidKeys.has(key)) return json(201, { statusCode: 201, message: 'Created', data: paymentView(hub.mode === 'pending' ? 'pending' : 'paid') });
      if (hub.mode === 'not_set') return refuse(409, { code: 'pin_not_set', message: 'Set a PIN first.' });
      if (hub.wrongFirst && hub.pays.length === 1) return refuse(403, { code: 'pin_incorrect', message: 'Wrong PIN. 4 tries left.', triesLeft: 4 });
      if (hub.mode === 'short') return refuse(402, { code: 'insufficient_funds', message: 'Not enough.', balanceKobo: 500_000, totalKobo: Number(body.expectedTotalKobo), shortfallKobo: Number(body.expectedTotalKobo) - 500_000 });
      if (hub.mode === 'changed') {
        return refuse(409, { code: 'quote_changed', message: 'The price changed.', paymentQuote: quoteView(hub.prices[hub.prices.length - 1], 99).payment });
      }
      if (hub.mode === 'in_progress') return refuse(409, { code: 'payment_in_progress', message: 'Still confirming.' });
      if (hub.mode === 'lost_after' && hub.paidKeys.size === 0) {
        // The Hub took the payment and its answer never arrives.
        hub.paidKeys.add(key);
        hub.payments += 1;
        applyFee();
        return json(500, { statusCode: 500, message: 'Something went wrong' });
      }
      hub.paidKeys.add(key);
      hub.payments += 1;
      if (hub.mode === 'pending') return json(201, { statusCode: 201, message: 'Created', data: paymentView('pending') });
      if (hub.mode === 'failed') return json(201, { statusCode: 201, message: 'Created', data: paymentView('failed') });
      applyFee();
      return json(201, { statusCode: 201, message: 'Created', data: paymentView('paid') });
    }
    if (path === `/legal/requests/${R1}/pay/wallet/pay-1`) return ok(paymentView(hub.mode === 'pending' ? 'pending' : 'paid'));
    if (path === `/legal/requests/${R1}` && method === 'GET') return ok(hub.req);
    if (path === `/legal/requests/${R1}/contract` && method === 'GET') return ok({ contractText: 'ENGAGEMENT LETTER. WAWU Legal will review your tenancy agreement.', amountNaira: 45000, alreadySigned: false });
    if (path === `/legal/requests/${R1}/contract/sign`) {
      const body = (await r.json()) as { fullName: string };
      hub.signs.push(body);
      hub.req = { ...hub.req, contractSigned: true, contractSignedAs: body.fullName, contractSignedAt: '2099-09-20T09:00:00.000Z', status: 'contract_signed' };
      return ok(hub.req);
    }
    if (path === `/legal/requests/${R1}/deliverables`) return ok({ requestId: R1, status: String(hub.req.status), items: hub.deliverables });
    if (path === `/legal/assistant/${THREAD_ID}` && method === 'GET') return ok(hub.thread);
    if (path === `/legal/assistant/${THREAD_ID}/start` && method === 'POST') {
      const body = (await r.json()) as Record<string, unknown>;
      hub.starts.push(body);
      if (hub.startFails) return refuse(hub.startFails.status, { code: hub.startFails.code, message: hub.startFails.message });
      hub.req = request({ serviceCode: 'cac-registration', serviceName: 'CAC business name registration', path: 'simple', status: 'quoted', quoteAmount: 35000 });
      hub.thread = { ...hub.thread, stage: 'sent', fixedPrice: null, legalRequestId: R1, requestStatus: 'quoted', requestPath: 'simple' };
      return json(201, { statusCode: 201, message: 'Created', data: hub.thread });
    }
    if (path === '/money/fees/quote') {
      if (hub.feeQuoteFails) return refuse(503, { code: 'fees_not_set', message: 'Fees are not set.' });
      const amount = Number(url.searchParams.get('amountKobo'));
      return ok({ kind: 'purchase', billCategory: null, amountKobo: amount, fee: { providerFeeKobo: PROVIDER_FEE, wawuFeeKobo: 0, totalFeeKobo: PROVIDER_FEE }, parts: [], totalKobo: amount + PROVIDER_FEE, withinDailyLimit: true, remainingTodayKobo: null, quoteToken: 'fee-tok', expiresAt: '2099-01-01T00:00:00.000Z' });
    }
    if (path === '/money/wallet/balance') return ok({ availableKobo: hub.balanceKobo, asOf: '2099-09-20T09:00:00.000Z' });
    throw new Error(`no answer for ${method} ${path}`);
  }) as typeof fetch;
}
