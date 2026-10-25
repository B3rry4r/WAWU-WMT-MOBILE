import { api, unwrap } from "@/api/client";
import { ApiError } from "@/api/errors";
import type { components } from "@/api/schema.generated";

/**
 * The accounts of a person who opened a wallet from outside Nigeria (WALLET-41, R-87): the foreign accounts the Hub
 * lists (`GET /money/fx/accounts`, WALLET-21), each with the bank's balance and the details payers use, and opening one
 * more in a currency the Hub says is on (`GET /money/fx/currencies`, `POST /money/fx/accounts`). Nothing here is a sum
 * of anything: each balance is the bank's own figure for that account.
 */
type Account = components["schemas"]["FxAccountView"];
type Currencies = components["schemas"]["FxCurrenciesView"];
type Envelope<T> = { statusCode: number; message: string; data: T | null };

export type WorldDetails = {
  status: "pending" | "active";
  lines: { label: string; value: string }[];
};
export type WorldAccount = {
  id: string;
  currency: string;
  status: "opening" | "open" | "frozen";
  decimals: number;
  /** The bank's available balance in the currency's smallest unit; null when the bank could not be asked. */
  availableMinor: number | null;
  details: WorldDetails | null;
  /** The details exactly as the Hub sent them: the sheet payers read draws from this (copy, share). */
  rawDetails: components["schemas"]["FxReceivingDetailsView"] | null;
  /** A stablecoin account's network; null for a currency account. */
  chain: string | null;
  /** Where the details stand, as the Hub says: `ready`, `pending`, or `unavailable` with the provider's own words in `detailsNote`. */
  detailsStatus: "ready" | "pending" | "unavailable";
  detailsNote: string | null;
};
export type AddableCurrency = { code: string; name: string };

const filled = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;
function unreadable(what: string): ApiError {
  return new ApiError(
    "unknown",
    200,
    `Your ${what} could not be read. Try again.`,
  );
}

/** The lines of a fiat account's details: only what the bank issued, in the order a payer needs it. */
const LINES: readonly [keyof components["schemas"]["FxReceivingDetailsView"], string][] = [
  ["beneficiaryName", "Account name"],
  ["accountNumber", "Account number"],
  ["iban", "IBAN"],
  ["routingNumber", "Routing number"],
  ["sortCode", "Sort code"],
  ["swiftCode", "SWIFT code"],
  ["bankName", "Bank"],
];

export function readDetails(value: unknown): WorldDetails | null {
  const v = value as
    | Partial<components["schemas"]["FxReceivingDetailsView"]>
    | null
    | undefined;
  if (!v || typeof v !== "object") return null;
  const status = v.status === "active" ? "active" : "pending";
  const lines = LINES.flatMap(([key, label]) =>
    filled(v[key]) ? [{ label, value: String(v[key]).trim() }] : [],
  );
  return { status, lines };
}

export function readAccount(value: unknown): WorldAccount {
  const v = value as Partial<Account> | null;
  if (
    !v ||
    typeof v !== "object" ||
    !filled(v.id) ||
    !filled(v.currency) ||
    !Number.isSafeInteger(v.decimals)
  )
    throw unreadable("accounts");
  const status =
    v.status === "open" || v.status === "frozen" ? v.status : "opening";
  const balance = v.balance as { availableMinor?: unknown } | null | undefined;
  return {
    id: v.id,
    currency: v.currency,
    status,
    decimals: v.decimals as number,
    availableMinor: Number.isSafeInteger(balance?.availableMinor)
      ? (balance?.availableMinor as number)
      : null,
    details: readDetails(v.details),
    rawDetails:
      v.details && typeof v.details === "object"
        ? (v.details as components["schemas"]["FxReceivingDetailsView"])
        : null,
    detailsStatus:
      v.detailsStatus === "ready" || v.detailsStatus === "unavailable"
        ? v.detailsStatus
        : "pending",
    detailsNote: filled(v.detailsNote) ? v.detailsNote : null,
    chain: filled((v as { chain?: unknown }).chain)
      ? ((v as { chain?: string }).chain as string)
      : null,
  };
}

/** GET /money/fx/accounts. */
export async function fetchWorldAccounts(): Promise<WorldAccount[]> {
  const body = (await unwrap(
    api.GET("/api/hub/money/fx/accounts"),
  )) as unknown as Envelope<{ accounts?: unknown }>;
  const list = body?.data?.accounts;
  if (!Array.isArray(list)) throw unreadable("accounts");
  return list.map(readAccount);
}

/** GET /money/fx/currencies, narrowed to the fiat currencies that are on: what a person may add. */
export async function fetchAddable(): Promise<AddableCurrency[]> {
  const body = (await unwrap(
    api.GET("/api/hub/money/fx/currencies"),
  )) as unknown as Envelope<Currencies>;
  const view = body?.data;
  if (!view || !Array.isArray(view.currencies) || !view.products)
    throw unreadable("currencies");
  if (!view.products.openAccount) return [];
  return view.currencies
    .filter(
      (c) => c.kind === "fiat" && c.enabled && filled(c.code) && filled(c.name),
    )
    .map((c) => ({ code: c.code, name: c.name }));
}

/** POST /money/fx/accounts: opens one more fiat account. Asking again for one the person has returns it. */
export async function openAccountIn(currency: string): Promise<void> {
  await unwrap(
    api.POST("/api/hub/money/fx/accounts", {
      body: { currency: currency as "USD" },
    }),
  );
}

/** "£1,240.50", "1,240.50 AED": the bank's figure in the currency's own places. */
export function formatMinor(
  minor: number,
  currency: string,
  decimals: number,
): string {
  const amount = minor / 10 ** decimals;
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(amount);
  } catch {
    return `${amount.toFixed(decimals)} ${currency}`;
  }
}

export const WORLD_ACCOUNTS_KEY = ["money", "world-accounts"] as const;
