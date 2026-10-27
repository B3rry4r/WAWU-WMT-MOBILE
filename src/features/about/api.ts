import { api, unwrap } from '@/api/client';
import { ApiError } from '@/api/errors';
import type { components } from '@/api/schema.generated';

/**
 * Z9, Z10 and Z11's calls, as the Hub's contract types them (SETTINGS-02):
 * - `GET /about`: the bank, the licence line and the support address, all config the
 *   owner fills in;
 * - `GET /policies/{slug}`: one of the owner's nine legal documents with its date, or
 *   `available: false` until the owner has put it in;
 * - `GET /policies`: the published ones in the owner's order (slug, title, date), for the Legal list
 *   (LEGAL-DOCS, owner, 26 Oct 2026);
 * - `POST /policies/accept`: signed in, once after sign-up, the Hub keeps which documents (and which dates) the
 *   person agreed to with A3's box.
 * The two reads are public: a person can read the documents before they have an account.
 *
 * The Hub's success body is `{ statusCode, message, data }` and the contract types only
 * `data` (SHARED-CHANGES.md row 11), so each call reads `data` itself.
 */
type Envelope<T> = { statusCode: number; message: string; data: T | null };

export type About = components['schemas']['AboutView'];
export type Policy = components['schemas']['PolicyView'];
export type PolicySlug = Policy['slug'];
export type PolicyList = components['schemas']['PolicyListView'];
export type PolicyListItem = PolicyList['items'][number];
export type PolicyAcceptance = components['schemas']['PolicyAcceptanceView'];

/** The owner's nine documents, in the owner's order (the Hub's list order). */
export const POLICY_SLUGS: readonly PolicySlug[] = [
  'privacy',
  'terms',
  'cookies',
  'creator-monetization',
  'verification-refund',
  'acceptable-use',
  'partner-dpa',
  'community-guidelines',
  'disclaimer',
];

export function isPolicySlug(value: unknown): value is PolicySlug {
  return typeof value === 'string' && (POLICY_SLUGS as readonly string[]).includes(value);
}

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
export const policyListKey = ['policies'] as const;

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

/** The Legal list: the published documents, in the order the Hub gives. */
export async function fetchPolicyList(): Promise<PolicyListItem[]> {
  const list = dataOf<PolicyList>(await unwrap(api.GET('/api/hub/policies')), 'list of documents');
  if (!Array.isArray(list.items)) throw unreadable('list of documents');
  return list.items;
}

/** Signed in, right after sign-up: the Hub keeps what A3's box was agreed to. Throws on any failure; the caller keeps the mark and tries again later. */
export async function acceptPolicies(): Promise<PolicyAcceptance> {
  return dataOf<PolicyAcceptance>(await unwrap(api.POST('/api/hub/policies/accept', { body: { how: 'signup' } })), 'agreement');
}
