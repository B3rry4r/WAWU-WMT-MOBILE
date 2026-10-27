import { isApiError } from '@/api/errors';
import { formatPoints } from '@/components/PointsFigure';
import { lastsText } from '@/features/points/buyModel';
import { dateWords } from '@/features/wallet/history/lagosTime';

import type { PlanTier, PurchaseGrant } from './purchaseApi';

/**
 * The words of VF5 to VF7a that are the design's own. No figure is in any of them: every price, length, count and point is the Hub's
 * (R-43, R-65), and the tier's name is the Hub's too ("Verify", "Verify Plus", "Founding Maker").
 */
export const TIER_WORDS = {
  title: 'Make it official',
  blurb: 'Make it official to publish, upload files and unlock your points.',
  upgradeTitle: 'Upgrade your tier',
  yourTier: 'Your tier',
  best: 'Best',
  payOnly: 'pay only',
  checkout: 'Checkout',
  payWith: 'Pay with',
  wallet: 'Who Made This? wallet',
  transfer: 'Bank transfer',
  transferSub: 'From any Nigerian bank',
  dollarsTitle: "Paying in dollars isn't open yet",
  dollarsBody: 'Your tiers are priced in dollars. Paying for a tier from a dollar account is not switched on yet. Add a dollar account to your wallet so you are ready.',
  dollarsAdd: 'Add a dollar account',
  price: 'Price',
  total: 'Total',
  paying: 'Paying...',
  officialTitle: "You're official",
} as const;

/** "12 months", "30 days": a tier's length from the Hub's own days. */
export const lengthOf = (tier: Pick<PlanTier, 'days'>): string => lastsText(tier.days);

/** "10 products", "1 product". */
export const productsOf = (count: number): string => `${count} ${count === 1 ? 'product' : 'products'}`;

/** The checkout card's line: "12 months · 10 products". */
export const tierLine = (tier: Pick<PlanTier, 'days' | 'products'>): string => `${lengthOf(tier)} · ${productsOf(tier.products)}`;

/** The first word of a tier's name ("Founding" for "Founding Maker"), which the numbered badge and the pack bonus are named by. */
const firstWord = (name: string): string => name.trim().split(/\s+/)[0] ?? name;

/**
 * VF5's two lines under a tier's name: what it gives (its length, products, points and event pass), then, when it carries them, the
 * numbered badge and the bonus on points packs. A part the Hub does not give is not written.
 */
export function tierFacts(tier: PlanTier): { gives: string; extras: string | null } {
  const gives = [lengthOf(tier), productsOf(tier.products), tier.bonusPoints > 0 ? formatPoints(tier.bonusPoints) : null, tier.eventPass?.name ?? null].filter(Boolean).join(' · ');
  const extras = [tier.badge?.numbered ? `Numbered ${firstWord(tier.name)} badge` : null, tier.packBonusPercent > 0 ? `${tier.packBonusPercent}% bonus on points packs` : null].filter(Boolean).join(', ');
  return { gives, extras: extras || null };
}

/** The tier the sheet starts on: the one the Hub marks `preselected`, else the first. Never a name of the design's. */
export const startingTier = (tiers: readonly PlanTier[]): PlanTier | null => tiers.find((t) => t.preselected) ?? tiers[0] ?? null;

/** The tiers a running tier can be moved up to: the ones that cost more than the one held. */
export const higherTiers = (tiers: readonly PlanTier[], heldId: string): PlanTier[] => {
  const held = tiers.find((t) => t.id === heldId);
  return held ? tiers.filter((t) => t.priceMinor > held.priceMinor) : [];
};

/**
 * The tiers VF13's "Upgrade instead" can lead to: the ones above the held tier (they cost more) that would leave room, as the Hub offers on a
 * `product_limit_reached` refusal (a tier counts only when its products plus the extras held are more than what is used). A person with no
 * running tier is offered every tier that leaves room; the top tier gets none.
 */
export const nextTiers = (tiers: readonly PlanTier[], heldId: string | null, extraProducts: number, used: number): PlanTier[] => {
  const above = heldId === null ? [...tiers] : higherTiers(tiers, heldId);
  return above.filter((t) => t.products + extraProducts > used);
};

/**
 * The Hub's refusals of the "Add 5 more products" pack on its quote (`GET /plans/purchases/quote?kind=extra_products`, R-100, PACK-CAP):
 * `pack_not_allowed` (the person's tier may not buy it, or they hold the most packs a profile can: 20 products) and `tier_required` (no running
 * tier). The sheet no longer guesses from `GET /me/tier`: it asks the Hub, which answers eligibility first, before any wallet or payment gate.
 */
export const PACK_NOT_ALLOWED = 'pack_not_allowed';
/** Verify and Verify Plus, full: only the tiers are offered. */
export const PACK_TIERS_LINE = 'Move up a tier to publish another.';
/** Founding Maker at the cap (R-100's own sentence). */
export const PACK_CAP_LINE = "That's the most products a profile can hold.";
/** The store sheet is not opened while the Hub cannot be asked: an Apple purchase cannot be refunded by WAWU. */
export const PACK_CHECK_FAILED_LINE = 'We could not check this right now. Try again.';

export type PackVerdict = { kind: 'checking' } | { kind: 'offered' } | { kind: 'refused'; code: 'pack_not_allowed' | 'tier_required'; message: string } | { kind: 'unknown' };

/**
 * What the Hub's answer to the pack's quote means. A quote that comes back, or one stopped only by a gate that is asked AFTER eligibility
 * (`wallet_not_open`, `fees_not_set`: the store path needs neither), means the Hub would sell the pack. A refusal is `pack_not_allowed` or
 * `tier_required`. Anything else (no network, the server failing) is `unknown`: the pack is not drawn and the store is not opened.
 */
export function packVerdictOf(read: { isPending: boolean; isError: boolean; error: unknown }): PackVerdict {
  if (read.isPending) return { kind: 'checking' };
  if (!read.isError) return { kind: 'offered' };
  const error = read.error;
  if (isApiError(error)) {
    if (error.code === 'wallet_not_open' || error.code === 'fees_not_set') return { kind: 'offered' };
    if (error.code === PACK_NOT_ALLOWED || error.code === 'tier_required') return { kind: 'refused', code: error.code, message: error.message };
  }
  return { kind: 'unknown' };
}

/** VF7's three rows, from what the Hub granted: the points (the tier's and the offer's, "600 + 1,000"), the products, the event pass. A row the grant does not carry is not drawn. */
export type GrantRow = { id: 'points' | 'products' | 'pass'; label: string; value: string };

export function grantRows(grant: Pick<PurchaseGrant, 'bonusPoints' | 'bumpPoints' | 'productsAllowed' | 'eventPass'>): GrantRow[] {
  const rows: GrantRow[] = [];
  const plain = (n: number) => new Intl.NumberFormat('en-US').format(n);
  if (grant.bonusPoints > 0 || grant.bumpPoints > 0) {
    rows.push({ id: 'points', label: 'Points added', value: grant.bumpPoints > 0 && grant.bonusPoints > 0 ? `${plain(grant.bonusPoints)} + ${plain(grant.bumpPoints)}` : plain(grant.bonusPoints + grant.bumpPoints) });
  }
  rows.push({ id: 'products', label: 'Products to publish', value: String(grant.productsAllowed) });
  if (grant.eventPass) rows.push({ id: 'pass', label: 'Event pass', value: grant.eventPass.name });
  return rows;
}

/**
 * The day a tier ends, as "Active until 26 Nov": the Lagos day and the board's three-letter month (never Intl, which writes "Sept").
 * The year is added when the date is not in the current Lagos year ("18 Oct 2027"), so a 12-month tier never reads as ending today.
 */
export function dayOf(iso: string | null | undefined, now: Date = new Date()): string | null {
  if (!iso) return null;
  const at = new Date(iso);
  return Number.isNaN(at.getTime()) ? null : dateWords(at, now);
}
