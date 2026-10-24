import { formatMoney } from "@/components/Money";

import type { AddMoneyQuote, AddMoneyRail } from "./ways";

/**
 * The rules and the words of the other ways to add money (WALLET-25, WALLET-26), kept out of the screens so each is tested by itself.
 * No figure is the design's: fees and totals are the Hub's quote.
 */

/** What the card number looks like as it is typed: groups of four. */
export function groupedCard(raw: string): string {
  return raw
    .replace(/[^0-9]/g, "")
    .slice(0, 19)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

/** The Luhn check the provider asks for before it takes a card (core-concepts__encryption, "Card number"). */
export function luhnOk(digits: string): boolean {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let d = digits.charCodeAt(i) - 48;
    if (d < 0 || d > 9) return false;
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return digits.length > 0 && sum % 10 === 0;
}

/** `MM/YY` as typed: the slash goes in by itself. */
export function groupedExpiry(raw: string): string {
  const d = raw.replace(/[^0-9]/g, "").slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

export type CardProblems = {
  number?: string;
  expiry?: string;
  cvv?: string;
  name?: string;
  address?: string;
  city?: string;
  state?: string;
};

export const CARD_NUMBER_LINE = "Check the card number.";
export const CARD_EXPIRY_LINE = "Check the expiry date.";
export const CARD_CVV_LINE = "The security code is 3 or 4 digits.";
export const CARD_NAME_LINE = "Enter the name on the card.";

/** Every problem with what was typed, each in words the person can act on; none for a card that can be sent. */
export function cardProblems(
  f: {
    number: string;
    expiry: string;
    cvv: string;
    name: string;
    address: string;
    city: string;
    state: string;
  },
  now = new Date(),
): CardProblems {
  const out: CardProblems = {};
  const digits = f.number.replace(/[^0-9]/g, "");
  if (digits.length < 13 || digits.length > 19 || !luhnOk(digits))
    out.number = CARD_NUMBER_LINE;
  const m = /^(\d{2})\/(\d{2})$/.exec(f.expiry);
  const month = m ? Number(m[1]) : 0;
  const year = m ? 2000 + Number(m[2]) : 0;
  const ends = new Date(year, month, 1);
  if (!m || month < 1 || month > 12 || ends.getTime() <= now.getTime())
    out.expiry = CARD_EXPIRY_LINE;
  if (!/^[0-9]{3,4}$/.test(f.cvv)) out.cvv = CARD_CVV_LINE;
  if (!/^[A-Za-z][A-Za-z '-]*$/.test(f.name.trim())) out.name = CARD_NAME_LINE;
  if (f.address.trim().length < 3)
    out.address = "Enter the address on your card statement.";
  if (f.city.trim().length < 2) out.city = "Enter the city.";
  if (f.state.trim().length < 2) out.state = "Enter the state.";
  return out;
}

/** The month and the four-digit year out of `MM/YY`. */
export function expiryParts(expiry: string): { month: string; year: string } {
  const [mm, yy] = expiry.split("/");
  return { month: mm, year: `20${yy}` };
}

/** The amount typed in naira, as whole kobo; null for anything that is not a sum of money with at most two decimals. */
export function koboOf(raw: string): number | null {
  const t = raw.replace(/[,\s₦]/g, "");
  if (!/^[0-9]{1,10}(\.[0-9]{1,2})?$/.test(t)) return null;
  const [whole, frac = ""] = t.split(".");
  const kobo = Number(whole) * 100 + Number(frac.padEnd(2, "0"));
  return Number.isSafeInteger(kobo) && kobo > 0 ? kobo : null;
}

export const RAIL_TITLE: Record<AddMoneyRail, string> = {
  card: "Debit card",
  apple_pay: "Apple Pay",
  ussd: "USSD",
  open_banking: "Bank checkout",
};

/** The line under a way on W15: what it is, or why it cannot be used (the Hub's own words). */
export function railLine(rail: AddMoneyRail, reason: string | null): string {
  if (reason) return reason;
  switch (rail) {
    case "card":
      return "Pay with a debit card";
    case "apple_pay":
      return "Pay with Apple Pay";
    case "ussd":
      return "Pay from your phone with a USSD prompt";
    case "open_banking":
      return "Pay from your bank on a secure page";
  }
}

const naira = (kobo: number) =>
  formatMoney(kobo, { decimals: kobo % 100 !== 0 });

/** The fee lines and the totals of a quote, in the order the old board drew them: the provider's charge, WAWU's, You pay, Wallet gets. */
export function quoteLines(
  q: AddMoneyQuote,
): { key: string; label: string; value: string; strong?: boolean }[] {
  const lines: {
    key: string;
    label: string;
    value: string;
    strong?: boolean;
  }[] = [];
  if (q.providerFeeKobo > 0)
    lines.push({
      key: "provider",
      label: "Payment provider charge",
      value: naira(q.providerFeeKobo),
    });
  if (q.wawuFeeKobo > 0)
    lines.push({ key: "wawu", label: "Our fee", value: naira(q.wawuFeeKobo) });
  lines.push({
    key: "pay",
    label: "You pay",
    value: naira(q.chargeKobo),
    strong: true,
  });
  lines.push({ key: "gets", label: "Wallet gets", value: naira(q.amountKobo) });
  return lines;
}

export const payLabel = (q: AddMoneyQuote | null): string =>
  q ? `Pay ${naira(q.chargeKobo)}` : "Continue";

/** An attempt that has ended without the money: the Hub's sentence, or ours when it sent none. */
export const ENDED_FALLBACK =
  "The payment did not go through. Nothing was added to your wallet.";
export const OPEN_PAGE_LABEL = "Open the payment page again";
