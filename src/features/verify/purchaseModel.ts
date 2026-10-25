import { formatMoney, type Currency } from '@/components/Money';
import { formatPoints } from '@/components/PointsFigure';
import { CHANGED_LINE, lastsText, naira, NOT_READY_LINE, SHORT_LINE } from '@/features/points/buyModel';
import { dateWords } from '@/features/wallet/history/lagosTime';

import type { PlanTier, Purchase, PurchaseGrant, PurchaseQuote, PurchaseTarget } from './purchaseApi';

export { CHANGED_LINE, naira, NOT_READY_LINE, SHORT_LINE };

/**
 * A price in the currency the Hub priced it in (`GET /plans` `currency`), with that currency's own sign: "$3" for a person billed in
 * dollars, "₦1,000" for one billed in naira. A dollar figure is never drawn with the naira sign (RELEASE-02, CHECK-3 D-1).
 */
export const priceIn = (minor: number, currency: Currency): string => formatMoney(minor, { currency, decimals: minor % 100 !== 0 });

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

/** "Add 1,000 points for ₦800": the checkout offer, from the Hub's own figures. */
export const bumpLine = (bump: { points: number; priceMinor: number }): string => `Add ${formatPoints(bump.points)} for ${naira(bump.priceMinor)}`;

/** What the pay button says: the total the payer pays, the Bank charge included (BRIEF rule 5). */
export const payLabel = (totalKobo: number): string => `Pay ${naira(totalKobo)}`;

/** VF6a's two lines: what is needed and what the wallet has, both the Hub's. */
export const shortLine = (quote: Pick<PurchaseQuote, 'totalKobo' | 'balanceKobo'>): string =>
  quote.balanceKobo === null ? `You need ${naira(quote.totalKobo)}.` : `You need ${naira(quote.totalKobo)}. Your wallet has ${naira(quote.balanceKobo)}.`;

/** The PIN sheet's line after the amount ("Approve ₦5,800 for ..."): the tier, its renewal or upgrade, or the five more products. */
export function pinPurposeOf(target: PurchaseTarget, tierName: string | null, products: number | null): string {
  if (target.kind === 'extra_products') return products !== null ? `${products} more products` : 'more products';
  const name = tierName ?? 'your tier';
  if (target.kind === 'renew') return `renewing ${name}`;
  if (target.kind === 'upgrade') return `upgrading to ${name}`;
  return `the ${name} tier`;
}

/** When the figures the person was shown are not the figures the Hub has now. */
export function quoteMoved(a: PurchaseQuote, b: PurchaseQuote): boolean {
  return a.totalKobo !== b.totalKobo || a.planKobo !== b.planKobo || a.bumpKobo !== b.bumpKobo || a.bumpPoints !== b.bumpPoints || a.productsAllowedAfter !== b.productsAllowedAfter;
}

/** The words for a purchase that did not go through: the Hub's own sentence when it sent one. Nothing is promised about the money. */
export const failedLine = (p: Pick<Purchase, 'statusMessage' | 'status'>): string =>
  p.statusMessage?.trim() || (p.status === 'expired' ? 'The bank transfer did not arrive in time. Nothing was taken.' : 'Payment did not go through. Nothing was taken.');

/** VF7's three rows, from what the Hub granted: the points (the tier's and the offer's, "600 + 1,000"), the products, the event pass. A row the grant does not carry is not drawn. */
export type GrantRow = { id: 'points' | 'products' | 'pass'; label: string; value: string };

export function grantRows(grant: PurchaseGrant): GrantRow[] {
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
