import { api, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { components } from '@/api/schema.generated';

/**
 * Z9, Z10 and Z11's calls, as the Hub's contract types them (SETTINGS-02):
 * - `GET /about`: the bank, the licence line and the support address, all config the
 *   owner fills in;
 * - `GET /policies/{slug}`: the owner's Terms or Privacy policy with its date, or
 *   `available: false` until the owner has put it in.
 * Both are public: a person can read the Terms before they have an account.
 *
 * The Hub's success body is `{ statusCode, message, data }` and the contract types only
 * `data` (SHARED-CHANGES.md row 11), so each call reads `data` itself.
 */
type Envelope<T> = { statusCode: number; message: string; data: T | null };

export type About = components['schemas']['AboutView'];
export type Policy = components['schemas']['PolicyView'];
export type PolicySlug = 'terms' | 'privacy';

function unreadable(what: string): ApiError {
  return new ApiError('unknown', 200, `The ${what} could not be read. Try again.`);
}

function dataOf<T>(body: unknown, what: string): T {
  const data = (body as Envelope<T> | null)?.data;
  if (!data || typeof data !== 'object') throw unreadable(what);
  return data;
}

export const aboutKey = ['about'] as const;
export const policyKey = (slug: PolicySlug) => ['policy', slug] as const;

export async function fetchAbout(): Promise<About> {
  const about = dataOf<About>(await unwrap(api.GET('/api/hub/about')), 'details');
  if (typeof about.bankName !== 'string') throw unreadable('details');
  return about;
}

export async function fetchPolicy(slug: PolicySlug): Promise<Policy> {
  const policy = dataOf<Policy>(await unwrap(api.GET('/api/hub/policies/{slug}', { params: { path: { slug } } })), 'document');
  if (typeof policy.available !== 'boolean' || !Array.isArray(policy.sections)) throw unreadable('document');
  return policy;
}
