import { useSyncExternalStore } from 'react';

import { onSessionEnd } from '@/api/session';
import type { components } from '@/api/schema.generated';

/** What a piece is filed under, and whether it is paid: the Hub's own value sets (`CreateContentDto`). */
export type ContentCategoryId = components['schemas']['CreateContentDto']['category'];
export type AccessType = components['schemas']['CreateContentDto']['accessType'];

/** The Hub's limits on the details step (`CreateContentDto`: title 200, description 5000, price 1 to 10,000,000 whole naira). */
export const limits = { title: 200, description: 5000, priceMax: 10_000_000 } as const;

/**
 * The 25 categories `POST /content` accepts, named as the web names them (its `src/lib/categories.ts`, which the Hub's
 * `src/common/categories.ts` mirrors). The Hub serves the ids and not their names, so the names live here (BACKEND_GAPS
 * G-ME-08-1). The record is typed on the contract's own id list: a category the Hub adds or drops stops this file compiling.
 */
const CATEGORY_NAMES: Record<ContentCategoryId, string> = {
  agriculture_food: 'Agriculture & Food',
  trade_commerce: 'Trade & Commerce',
  business_entrepreneurship: 'Business & Entrepreneurship',
  finance: 'Finance & Financial Services',
  technology: 'Technology & Innovation',
  education: 'Education & Training',
  healthcare: 'Healthcare & Wellness',
  employment: 'Employment & Careers',
  entertainment_creative: 'Entertainment & Creative Arts',
  beauty: 'Beauty & Personal Care',
  family_lifestyle: 'Family & Lifestyle',
  culture_heritage: 'Culture & Heritage',
  religion_faith: 'Religion & Faith',
  travel_tourism: 'Travel & Tourism',
  real_estate: 'Real Estate & Housing',
  transport_logistics: 'Transportation & Logistics',
  manufacturing: 'Manufacturing & Industry',
  energy_utilities: 'Energy & Utilities',
  media_communications: 'Media & Communications',
  professional_services: 'Professional Services',
  legal_services: 'Legal Services',
  insurance_pensions: 'Insurance & Pensions',
  sports_fitness: 'Sports & Fitness',
  government_public: 'Government & Public Services',
  social_impact: 'Social Impact & Community Development',
};

export const CONTENT_CATEGORIES: readonly { id: ContentCategoryId; label: string }[] = (Object.keys(CATEGORY_NAMES) as ContentCategoryId[]).map(
  (id) => ({ id, label: CATEGORY_NAMES[id] }),
);

export const categoryLabel = (id: ContentCategoryId | null): string => (id ? CATEGORY_NAMES[id] : '');

/** What steps 4 and 5 collect. `price` is the digits as typed, in whole naira; a free piece sends 0 whatever it holds. */
export type Details = { title: string; description: string; category: ContentCategoryId | null; accessType: AccessType; price: string };

const blank: Details = { title: '', description: '', category: null, accessType: 'paid', price: '' };
let details: Details = blank;
const listeners = new Set<() => void>();

const publish = (next: Details) => {
  details = next;
  listeners.forEach((l) => l());
};

export const getDetails = (): Details => details;
export const setDetails = (patch: Partial<Details>): void => publish({ ...details, ...patch });
/** A fresh piece starts with blank details (the draft calls this wherever it empties itself). */
export const resetDetails = (): void => publish(blank);

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useDetails(): Details {
  return useSyncExternalStore(subscribe, getDetails, getDetails);
}

/** Step 4 can go on once the Hub has what it needs of it: a title, a description and a category. */
export const detailsReady = (d: Details): boolean => d.title.trim().length > 0 && d.description.trim().length > 0 && d.category !== null;

/** The typed price as whole naira, or null when it is not one the Hub takes (nothing, zero, or over the most it allows). */
export function priceOf(typed: string): number | null {
  if (!/^\d+$/.test(typed)) return null;
  const naira = Number(typed);
  return naira >= 1 && naira <= limits.priceMax ? naira : null;
}

/** Digits only, with no leading zeros and no more than the Hub's most: what the price field lets a person type. */
export function cleanPrice(text: string): string {
  const digits = text.replace(/\D/g, '').replace(/^0+/, '');
  return Number(digits || 0) > limits.priceMax ? String(limits.priceMax) : digits;
}

/** `3000` reads `3,000` in the price field (the sign sits beside it). */
export const groupDigits = (digits: string): string => digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/** Step 5 can send once a free piece has been chosen, or a paid one has a price the Hub takes. */
export const priceReady = (d: Details): boolean => d.accessType === 'free' || priceOf(d.price) !== null;

/** The piece the Hub took, for M25 to name and to count against the uploads. */
export type Sent = { title: string };
let sent: Sent | null = null;
const sentListeners = new Set<() => void>();
const publishSent = (next: Sent | null) => {
  sent = next;
  sentListeners.forEach((l) => l());
};
export const getSent = (): Sent | null => sent;
export const setSent = (piece: Sent | null): void => publishSent(piece);

export function useSent(): Sent | null {
  return useSyncExternalStore(
    (listener) => {
      sentListeners.add(listener);
      return () => sentListeners.delete(listener);
    },
    getSent,
    getSent,
  );
}

onSessionEnd(() => {
  resetDetails();
  setSent(null);
});

/** The Hub's whole-kobo quick prices that are a whole number of naira, as the digits the price field takes. */
export const presetDigits = (presetsKobo: readonly number[]): string[] =>
  presetsKobo.filter((kobo) => Number.isInteger(kobo) && kobo > 0 && kobo % 100 === 0 && kobo / 100 <= limits.priceMax).map((kobo) => String(kobo / 100));

/** M25's "Usually takes", worded from the Hub's hours: "About an hour", "About 4 hours", "About a day", "About 3 days". */
export function reviewWords(hours: number): string {
  if (hours <= 1) return 'About an hour';
  if (hours < 24) return `About ${hours} hours`;
  const days = Math.round(hours / 24);
  return days <= 1 ? 'About a day' : `About ${days} days`;
}
