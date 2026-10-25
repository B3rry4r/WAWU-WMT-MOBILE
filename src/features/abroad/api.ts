import { api, resendsUnderKey, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { components } from '@/api/schema.generated';
import { credentialHeader, type Credential } from '@/features/device-approval';

import type { Bank, Corridors, Quote, Recipient, AbroadSend, Source } from './model';

/**
 * The calls behind Send abroad (NUV-11, R-84), as the backend contract types them (`/money/abroad/*`):
 * the corridors with the exact fields of each country and way, the bank directory, the accounts to send from, saved recipients,
 * a quote, and the send itself with the PIN (or a fingerprint or face approval) and one Idempotency-Key per payment intent.
 */
type Envelope<T> = { statusCode: number; message: string; data: T | null };

function read<T>(body: unknown, what: string, ok: (data: unknown) => boolean): T {
  const data = (body as Envelope<unknown> | null)?.data;
  if (!ok(data)) throw new ApiError('unknown', 200, `Your ${what} could not be read. Try again.`);
  return data as T;
}
const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

export async function fetchCorridors(): Promise<Corridors> {
  return read<Corridors>(
    await unwrap(api.GET('/api/hub/money/abroad/corridors')),
    'countries',
    (d) => isObject(d) && Array.isArray(d.countries) && typeof d.enabled === 'boolean',
  );
}
export const corridorsQuery = (owner: string | null) =>
  ({
    queryKey: ['money', 'abroad', 'corridors', owner ?? ''] as const,
    queryFn: fetchCorridors,
    staleTime: 60_000,
    retry: false,
    enabled: Boolean(owner),
  }) as const;

export async function fetchBanks(country: string): Promise<Bank[]> {
  const body = await unwrap(
    api.GET('/api/hub/money/abroad/banks/{country}', {
      params: { path: { country } },
    }),
  );
  return read<{ banks: Bank[] }>(body, 'banks', (d) => isObject(d) && Array.isArray(d.banks)).banks;
}
export const banksQuery = (owner: string | null, country: string, on: boolean) =>
  ({
    queryKey: ['money', 'abroad', 'banks', owner ?? '', country] as const,
    queryFn: () => fetchBanks(country),
    staleTime: 600_000,
    enabled: Boolean(owner) && on,
  }) as const;

export async function fetchSources(): Promise<Source[]> {
  const body = await unwrap(api.GET('/api/hub/money/abroad/sources'));
  return read<{ sources: Source[] }>(body, 'accounts', (d) => isObject(d) && Array.isArray(d.sources)).sources;
}
export const sourcesQuery = (owner: string | null) =>
  ({
    queryKey: ['money', 'abroad', 'sources', owner ?? ''] as const,
    queryFn: fetchSources,
    staleTime: 0,
    enabled: Boolean(owner),
  }) as const;

export async function fetchRecipients(): Promise<Recipient[]> {
  const body = await unwrap(api.GET('/api/hub/money/abroad/recipients'));
  return read<{ items: Recipient[] }>(body, 'recipients', (d) => isObject(d) && Array.isArray(d.items)).items;
}
export const recipientsQuery = (owner: string | null) =>
  ({
    queryKey: ['money', 'abroad', 'recipients', owner ?? ''] as const,
    queryFn: fetchRecipients,
    staleTime: 0,
    enabled: Boolean(owner),
  }) as const;

export type NewRecipient = components['schemas']['AbroadRecipientDto'];

/** What a refusal carries beyond its words: the Hub's code and, for refused details, the fields by key. */
export type Refusal = {
  code: string | null;
  message: string;
  fields: string[];
  minimumMinor: number | null;
  maximumMinor: number | null;
  currency: string | null;
};

function refusalOf(error: unknown): Refusal {
  const rec = isObject(error) ? error : {};
  const reason = isObject(rec.reason) ? rec.reason : {};
  const raw = rec.message;
  const message =
    typeof reason.message === 'string' && reason.message
      ? reason.message
      : Array.isArray(raw)
        ? raw.filter((p) => typeof p === 'string').join('. ')
        : typeof raw === 'string'
          ? raw
          : '';
  const num = (v: unknown) => (typeof v === 'number' && Number.isSafeInteger(v) ? v : null);
  return {
    code: typeof reason.code === 'string' ? reason.code : null,
    message,
    fields: Array.isArray(reason.fields) ? reason.fields.filter((f): f is string => typeof f === 'string') : [],
    minimumMinor: num(reason.minimumMinor),
    maximumMinor: num(reason.maximumMinor),
    currency: typeof reason.currency === 'string' ? reason.currency : null,
  };
}

export type Called<T> = { kind: 'done'; value: T } | { kind: 'refused'; refusal: Refusal } | { kind: 'unanswered' };

export async function saveRecipient(body: NewRecipient): Promise<Called<Recipient>> {
  try {
    const result = await api.POST('/api/hub/money/abroad/recipients', { body });
    if (result.response.ok)
      return {
        kind: 'done',
        value: read<Recipient>(result.data, 'recipient', (d) => isObject(d) && typeof d.id === 'string'),
      };
    if (result.response.status >= 500) return { kind: 'unanswered' };
    return { kind: 'refused', refusal: refusalOf(result.error) };
  } catch {
    return { kind: 'unanswered' };
  }
}

export async function removeRecipient(id: string): Promise<void> {
  await unwrap(
    api.DELETE('/api/hub/money/abroad/recipients/{id}', {
      params: { path: { id } },
    }),
  );
}

export async function requestQuote(input: {
  recipientId: string;
  fromCurrency: string;
  amountMinor: number;
  side: 'send' | 'receive';
}): Promise<Called<Quote>> {
  try {
    const result = await api.POST('/api/hub/money/abroad/quotes', {
      body: input,
    });
    if (result.response.ok)
      return {
        kind: 'done',
        value: read<Quote>(
          result.data,
          'quote',
          (d) => isObject(d) && typeof d.id === 'string' && Number.isSafeInteger(d.amountFromMinor) && Number.isSafeInteger(d.amountToMinor),
        ),
      };
    if (result.response.status >= 500) return { kind: 'unanswered' };
    return { kind: 'refused', refusal: refusalOf(result.error) };
  } catch {
    return { kind: 'unanswered' };
  }
}

export async function fetchSend(id: string): Promise<AbroadSend> {
  return read<AbroadSend>(
    await unwrap(api.GET('/api/hub/money/abroad/sends/{id}', { params: { path: { id } } })),
    'send',
    (d) => isObject(d) && typeof d.id === 'string' && typeof d.status === 'string',
  );
}
export const sendQuery = (owner: string | null, id: string) =>
  ({
    queryKey: ['money', 'abroad', 'send', owner ?? '', id] as const,
    queryFn: () => fetchSend(id),
    staleTime: 0,
    enabled: Boolean(owner) && id !== '',
  }) as const;

/** Why the Hub did not take the send, in the shapes the screen branches on (the same ones naira Send has, plus the abroad ones). */
export type SendOutcome =
  | { kind: 'done'; send: AbroadSend }
  | { kind: 'pin_incorrect'; triesLeft: number }
  | { kind: 'pin_locked'; lockedUntil: string }
  | { kind: 'pin_not_set' }
  | { kind: 'no_wallet' }
  /** No answer that proves anything: send the SAME key again. */
  | { kind: 'unanswered' }
  | { kind: 'approval_cancelled' }
  | { kind: 'approval_failed' }
  /** `409 quote_expired`: get a new quote. */
  | { kind: 'quote_expired'; message: string }
  /** `insufficient_funds`: nothing left. */
  | { kind: 'insufficient_funds'; message: string }
  | { kind: 'refused'; code: string | null; message: string };

/**
 * POST /money/abroad/sends. Never rejects: whatever came back (or did not) is a `SendOutcome`. A request that got no answer, and every
 * 5xx, is `unanswered`: money may have moved, so only the SAME key is safe to send again.
 */
export async function sendAbroad(input: { quoteId: string; narration: string; key: string } & Credential): Promise<SendOutcome> {
  const body = {
    quoteId: input.quoteId,
    ...(input.narration.trim() ? { narration: input.narration.trim() } : {}),
  };
  const credential: Credential = input.approve === undefined ? { pin: input.pin } : { approve: input.approve };
  const headed = await credentialHeader(credential, {
    method: 'POST',
    path: '/api/hub/money/abroad/sends',
    body,
  });
  if ('outcome' in headed) return headed.outcome;
  let result;
  try {
    result = await api.POST('/api/hub/money/abroad/sends', {
      params: { header: { ...headed.header, 'Idempotency-Key': input.key } },
      body,
      fetch: resendsUnderKey,
    });
  } catch {
    return { kind: 'unanswered' };
  }
  if (result.response.status === 201) {
    try {
      return {
        kind: 'done',
        send: read<AbroadSend>(result.data, 'send', (d) => isObject(d) && typeof d.id === 'string'),
      };
    } catch {
      return { kind: 'unanswered' };
    }
  }
  if (result.response.status >= 500) return { kind: 'unanswered' };
  const refusal = refusalOf(result.error);
  const raw =
    isObject(result.error) && isObject((result.error as { reason?: unknown }).reason)
      ? (result.error as { reason: Record<string, unknown> }).reason
      : {};
  switch (refusal.code) {
    case 'pin_incorrect':
      return {
        kind: 'pin_incorrect',
        triesLeft: typeof raw.triesLeft === 'number' ? raw.triesLeft : 0,
      };
    case 'pin_locked':
      return typeof raw.lockedUntil === 'string' ? { kind: 'pin_locked', lockedUntil: raw.lockedUntil } : { kind: 'unanswered' };
    case 'pin_not_set':
      return { kind: 'pin_not_set' };
    case 'wallet_not_open':
      return { kind: 'no_wallet' };
    case 'device_approval_refused':
      return { kind: 'approval_failed' };
    case 'idempotency_in_progress':
      return { kind: 'unanswered' };
    case 'quote_expired':
      return {
        kind: 'quote_expired',
        message: refusal.message || 'This quote has run out. Get a new one and try again.',
      };
    case 'insufficient_funds':
      return {
        kind: 'insufficient_funds',
        message: refusal.message || 'There is not enough money in that account for this send.',
      };
    default:
      return {
        kind: 'refused',
        code: refusal.code,
        message: refusal.message || 'This send was not taken. Nothing left your account.',
      };
  }
}
