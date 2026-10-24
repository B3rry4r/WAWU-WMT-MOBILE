import type { PillTone } from '@/components/StatusPill';
import type { IconTileTone } from '@/components/IconTile';
import type { ReviewStage } from '@/features/open-wallet/api/review';
import type { WalletState } from '@/features/open-wallet/api/account';

import type { HeldTier } from './api';

/**
 * Where the identity check stands, as the Hub says it (R-6: the check happens when a wallet is opened, so this row is
 * the wallet's state, never a flag the app keeps).
 *
 * - `not_started` (M16): no wallet yet, and nothing sent for one.
 * - `not_approved` (M17): the opening stopped. The Hub's review turned the details down (or stopped or let them
 *   lapse), or the selfie step has used every try without a match (KYC-02's retry rule).
 * - `unfinished`: details sent, the documents still to come.
 * - `checking`: the review is under way, or the bank is making the account.
 * - `open`, `frozen`: the wallet exists.
 */
export type IdentityKind = 'not_started' | 'not_approved' | 'unfinished' | 'checking' | 'open' | 'frozen';

export type IdentityRow = {
  kind: IdentityKind;
  line: string;
  pill: string;
  pillTone: PillTone;
  tile: IconTileTone;
  /** A row that leads into Open your wallet. An open wallet has nothing to open here. */
  opensWallet: boolean;
};

const ROWS: Record<IdentityKind, IdentityRow> = {
  not_started: { kind: 'not_started', line: 'Needed to get paid', pill: 'Not started', pillTone: 'accent', tile: 'accent', opensWallet: true },
  not_approved: { kind: 'not_approved', line: 'Send your ID again', pill: 'Not approved', pillTone: 'danger', tile: 'danger', opensWallet: true },
  unfinished: { kind: 'unfinished', line: 'Finish opening your wallet', pill: 'Not finished', pillTone: 'accent', tile: 'accent', opensWallet: true },
  checking: { kind: 'checking', line: 'We are checking your details', pill: 'Checking', pillTone: 'warning', tile: 'warn', opensWallet: true },
  open: { kind: 'open', line: 'Your wallet is open', pill: 'Open', pillTone: 'positive', tile: 'in', opensWallet: false },
  frozen: { kind: 'frozen', line: 'Your wallet is frozen', pill: 'Frozen', pillTone: 'danger', tile: 'danger', opensWallet: false },
};

export type IdentityInput = {
  wallet: WalletState;
  /** The review's stage, when the Hub reviews the opening (`GET /money/wallet` `review`). */
  review: ReviewStage | null;
  /** Whether the selfie step has stopped; null when it was not asked or did not answer. */
  selfieStopped: boolean | null;
};

/** Whether the selfie step is worth asking about: a wallet not open and a review that has nothing to say. */
export function asksSelfie(wallet: WalletState, review: ReviewStage | null): boolean {
  return wallet === 'not_open' && review === null;
}

export function identityRow({ wallet, review, selfieStopped }: IdentityInput): IdentityRow {
  if (wallet === 'open') return ROWS.open;
  if (wallet === 'frozen') return ROWS.frozen;
  if (wallet === 'opening') return ROWS.checking;
  switch (review) {
    case 'rejected':
    case 'stopped':
    case 'expired':
      return ROWS.not_approved;
    case 'checking':
    case 'approved':
      return ROWS.checking;
    case 'needs_documents':
      return ROWS.unfinished;
    case null:
      return selfieStopped === true ? ROWS.not_approved : ROWS.not_started;
  }
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "12 Oct 2026" in Lagos time (UTC+1, no daylight saving), or null when the Hub sent no date. */
export function dayOf(iso: string | null): string | null {
  if (!iso) return null;
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return null;
  const d = new Date(ms + 3_600_000);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export type TierRow = { title: string; line: string | null; pill: string; pillTone: PillTone };

/** The tier the person holds: its name and when it runs out, from `GET /me/tier`. */
export function tierRow(tier: HeldTier): TierRow {
  const day = dayOf(tier.until);
  const title = tier.name ?? 'Your tier';
  switch (tier.state) {
    case 'active':
      return { title, line: day ? `Active until ${day}` : null, pill: 'Active', pillTone: 'positive' };
    case 'ending':
      return { title, line: day ? `Ends ${day}` : null, pill: 'Ending', pillTone: 'warning' };
    case 'ended':
      return { title, line: day ? `Ended ${day}` : null, pill: 'Ended', pillTone: 'neutral' };
  }
}

export const STILL_CONFIRMING_TITLE = 'Paid, still confirming';
export const STILL_CONFIRMING_BODY = "Don't pay again. Check back in a minute.";
