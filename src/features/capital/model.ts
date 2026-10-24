import { formatMoney } from "@/components/Money";
import type { PillTone } from "@/components/StatusPill";

import type { CapitalOrder, CapitalOrderStatus, CapitalProduct } from "./api";

/**
 * The words and sums behind Capital (NUV-12, R-84). No board draws Capital: it is built from the wallet's own parts (R-29,
 * BACKEND_GAPS G-NUV-12-1). The words say what the provider's terms say (rate, term, what happens when someone leaves early) and never
 * promise a return the provider's answer does not give: every figure on a screen is the Hub's, which is the provider's own.
 */
export const WORDS = {
  title: "Capital",
  rowTitle: "Capital",
  rowLine: "Fixed returns and shares",
  invest: "Invest",
  mine: "Mine",
  notAPromise:
    "These figures are the provider's own and are not a promise of a return. Your money can be held until the term ends.",
  agree: "I have opened and agree to the documents",
  review: "Review",
  noWallet: "Open your wallet to invest",
  withdraw: "Withdraw",
  done: "Done",
} as const;

export const ORDER_STATUS: Record<
  CapitalOrderStatus,
  { label: string; tone: PillTone }
> = {
  reserved: { label: "Held for you", tone: "info" },
  confirming: { label: "Confirming", tone: "warning" },
  invested: { label: "Invested", tone: "positive" },
  matured: { label: "Ready to withdraw", tone: "accent" },
  paying_out: { label: "Paying out", tone: "warning" },
  paid_out: { label: "Paid out", tone: "neutral" },
  expired: { label: "Ran out", tone: "neutral" },
  rejected: { label: "Not accepted", tone: "danger" },
  cancelled: { label: "Cancelled", tone: "neutral" },
  failed: { label: "Did not go through", tone: "danger" },
  review: { label: "Being checked", tone: "warning" },
};

/** 0.3 is "30% a year"; 0.175 is "17.5% a year". The provider's own decimal, never rounded to a neater figure. */
export function rateText(rate: number | null | undefined): string {
  if (rate === null || rate === undefined) return "";
  const percent = Math.round(rate * 10_000) / 100;
  return `${String(percent)}% a year`;
}

export function termText(days: number | null | undefined): string {
  if (days === null || days === undefined) return "";
  return days === 1 ? "1 day" : `${days} days`;
}

/** "10% of interest" for Withholding tax; a flat deduction is shown as money. */
export function deductibleText(d: {
  value: number;
  valueType: "flat" | "percentage";
  appliesTo: "principal" | "interest";
}): string {
  if (d.valueType === "flat") return formatMoney(d.value);
  const percent = Math.round(d.value * 10_000) / 100;
  return `${String(percent)}% of ${d.appliesTo}`;
}

/** What the person can do about leaving early, from the product's own terms. */
export function earlyLine(
  p: Pick<
    CapitalProduct,
    "kind" | "allowEarlyWithdrawal" | "earliestWithdrawalDays"
  >,
): string {
  if (p.kind === "share_offering")
    return "Shares are held for the lock period before they can be moved.";
  if (p.allowEarlyWithdrawal === false)
    return "Your money stays in until the term ends.";
  if (p.allowEarlyWithdrawal === true) {
    const from = p.earliestWithdrawalDays
      ? `from day ${String(p.earliestWithdrawalDays)}`
      : "at any time";
    return `You can leave early ${from}. A share of the interest is taken when you do; the amount is shown before you confirm.`;
  }
  return "Ask before you invest whether you can leave early.";
}

/** The sale window a share offering is open in, as words. */
export function whyNotOrderable(
  reason: CapitalProduct["notOrderableReason"],
): string {
  switch (reason) {
    case "sold_out":
      return "Sold out";
    case "sale_closed":
      return "Sale closed";
    case "not_open_yet":
      return "Not open yet";
    case "unavailable":
      return "Not available";
    default:
      return "";
  }
}

/** "Mon 12 Jan 2027" in the phone's zone, or '' for a time that cannot be read. */
export function dayText(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Minutes and seconds a reservation has left: "14:32". Zero or less is "0:00". */
export function countdownText(expiresAt: string | null, now: number): string {
  if (!expiresAt) return "";
  const left = Math.max(
    0,
    Math.floor((new Date(expiresAt).getTime() - now) / 1000),
  );
  return `${String(Math.floor(left / 60))}:${String(left % 60).padStart(2, "0")}`;
}

export const reservationRanOut = (
  expiresAt: string | null,
  now: number,
): boolean => expiresAt !== null && new Date(expiresAt).getTime() <= now;

/**
 * Naira typed by a person ("1500", "1,500.50") to whole kobo, or null when it is not an amount. Two decimals at most, never a float
 * sum: the whole and the fraction are read apart.
 */
export function koboFromText(text: string): number | null {
  const clean = text.replace(/[,\s₦]/g, "");
  const m = /^(\d{1,10})(?:\.(\d{1,2}))?$/.exec(clean);
  if (!m) return null;
  const kobo = Number(m[1]) * 100 + Number((m[2] ?? "").padEnd(2, "0") || "0");
  return Number.isSafeInteger(kobo) && kobo > 0 ? kobo : null;
}

/** Keeps digits and one point with at most two decimals, as the person types. */
export function cleanAmountText(text: string): string {
  const stripped = text.replace(/[^0-9.]/g, "");
  const [whole, ...rest] = stripped.split(".");
  if (rest.length === 0) return whole.slice(0, 10);
  return `${whole.slice(0, 10)}.${rest.join("").slice(0, 2)}`;
}

/** Why an amount cannot be reserved, from the product's own limits, or null. */
export function amountProblem(
  kobo: number | null,
  p: Pick<CapitalProduct, "minKobo" | "maxKobo">,
  wawuMin: number | null,
  wawuMax: number | null,
): string | null {
  if (kobo === null) return null;
  const lo = Math.max(p.minKobo ?? 1, wawuMin ?? 1);
  const candidates = [p.maxKobo, wawuMax].filter(
    (v): v is number => v !== null,
  );
  const hi = candidates.length > 0 ? Math.min(...candidates) : null;
  if (kobo < lo) return `The least this takes is ${formatMoney(lo)}.`;
  if (hi !== null && kobo > hi)
    return `The most this takes is ${formatMoney(hi)}.`;
  return null;
}

/** What a holding card says under its name. */
export function holdingLine(o: CapitalOrder): string {
  const h = o.holding;
  if (o.status === "reserved") return "Held for you, nothing taken yet";
  if (o.status === "confirming") return "We are confirming this";
  if (o.kind === "share_offering")
    return h?.unitsHeld ? `${String(h.unitsHeld)} shares` : "Shares";
  const rate = rateText(h?.lockedRate ?? o.quote?.lockedRate);
  const matures = dayText(h?.maturesAt);
  return [rate, matures ? `ends ${matures}` : ""].filter(Boolean).join(" · ");
}

export function withdrawBlockLine(
  block: CapitalOrder["withdrawBlockedBy"],
): string {
  switch (block) {
    case "too_early":
      return "You can leave early from the date shown.";
    case "locked":
      return "You chose to lock this money until the term ends.";
    case "not_allowed":
      return "This product does not let you leave before the term ends.";
    case "in_progress":
      return "A payout is already on its way.";
    case "frozen":
      return "This investment is on hold. Contact support to continue.";
    case "not_for_this_product":
      return "Shares cannot be withdrawn here.";
    case "not_invested":
      return "There is nothing to withdraw.";
    default:
      return "";
  }
}

/** The line a payout's sheet shows: leaving early takes part of the interest, the full payout at the end takes none. */
export function payoutLine(early: boolean): string {
  return early
    ? "Leaving early takes a share of the interest earned so far."
    : "The term is over, so nothing is taken for leaving.";
}

/** The provider's words for a movement on a holding, in ours. A word it adds later is shown as it came, in sentence case. */
const EVENT_WORDS: Record<string, string> = {
  PURCHASE: "Money invested",
  DAILY_ACCRUAL: "Interest added",
  EARLY_WITHDRAWAL_PENALTY: "Share taken for leaving early",
  WITHHOLDING_TAX: "Withholding tax",
  WITHDRAWAL: "Withdrawal started",
  MATURITY_PAYOUT: "Payout at the end",
  MATURITY_SETTLEMENT: "Payout settled",
  EARLY_LIQUIDATION_PAYOUT: "Early payout",
  ALLOTMENT_ADJUSTED: "Shares adjusted",
  REFUND: "Refund",
  LOCK_EXPIRY: "Lock ended",
  PRICE_UPDATE: "Price updated",
  DIVIDEND_ACCRUED: "Dividend earned",
  DIVIDEND_DISTRIBUTED: "Dividend paid",
};

export function eventText(event: string): string {
  const known = EVENT_WORDS[event];
  if (known) return known;
  const spaced = event.toLowerCase().replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
