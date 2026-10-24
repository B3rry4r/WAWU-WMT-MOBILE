import { api, unwrap } from '@/api/client';
import type { components } from '@/api/schema.generated';

import { unreadable, type Envelope } from './home';

/**
 * The event pass behind the Passes card on Wallet (W1) and Your pass (W44): `GET /me/tier` `eventPass`. The Hub's tier
 * answer is the one source; a person without a pass gets `eventPass: null` and the app draws no Passes card (WALLET-38).
 *
 * `benefits`, `eventDate` and `eventName` are optional on the pass view (TIER-06, G-804, FIX-110): they are left out until an
 * admin sets them, so each is read as "not set" when it is missing and is never filled in here. `passCode` is what the pass's
 * QR carries (G-814): the Hub's own code for a pass the person holds, drawn exactly as sent.
 */
type MyTier = components['schemas']['MyTierView'];

export type MyPass = {
  id: string;
  /** The pass's own name, as the Hub sends it ("Maker Pass"). */
  name: string;
  /** The tier that gave the pass, when the Hub names it. */
  tierName: string | null;
  /** The lines under "What it gets you", in the Hub's order; empty until an admin sets them. */
  benefits: string[];
  /** `YYYY-MM-DD`, or null until the owner sets the day. */
  eventDate: string | null;
  /** The event the pass is for ("Christmas event"), or null until an admin names it. */
  eventName: string | null;
  /** What the QR code carries, or null when the Hub sent none (no code is drawn then). */
  code: string | null;
};

const filled = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

const DAY = /^(\d{4})-(\d{2})-(\d{2})$/;

/** A calendar day as the Hub writes it, or null for anything else (a date that does not exist is not a date). */
export function readDay(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const parts = DAY.exec(value);
  if (!parts) return null;
  const [year, month, day] = [Number(parts[1]), Number(parts[2]), Number(parts[3])];
  const real = new Date(Date.UTC(year, month - 1, day));
  const same = real.getUTCFullYear() === year && real.getUTCMonth() === month - 1 && real.getUTCDate() === day;
  return same ? value : null;
}

function readPass(view: MyTier): MyPass | null {
  const pass = view.eventPass as MyTier['eventPass'] | undefined;
  if (pass === null) return null;
  if (!pass || typeof pass !== 'object' || !filled(pass.id) || !filled(pass.name)) throw unreadable('pass');
  const benefits = Array.isArray(pass.benefits) ? pass.benefits.filter(filled).map((line) => line.trim()) : [];
  const tierName = view.tier && filled(view.tier.name) ? view.tier.name.trim() : null;
  return {
    id: pass.id,
    name: pass.name.trim(),
    tierName,
    benefits,
    eventDate: readDay(pass.eventDate),
    eventName: filled(pass.eventName) ? pass.eventName.trim() : null,
    code: filled(pass.passCode) ? pass.passCode.trim() : null,
  };
}

/** GET /me/tier, read for the pass only. An answer that is not a tier view is refused, never drawn as "no pass". */
export async function fetchMyPass(): Promise<MyPass | null> {
  const body = (await unwrap(api.GET('/api/hub/me/tier'))) as unknown as Envelope<MyTier>;
  const view = body?.data;
  if (!view || typeof view !== 'object') throw unreadable('pass');
  return readPass(view);
}

/** Keyed by the signed-in account, like the Wallet tab's reads, and read again each time it is shown: a pass can arrive while the app is open. */
export function myPassQuery(owner: string | null) {
  return { queryKey: ['me', 'tier', 'pass', owner ?? ''] as const, queryFn: fetchMyPass, staleTime: 0, enabled: Boolean(owner) };
}
