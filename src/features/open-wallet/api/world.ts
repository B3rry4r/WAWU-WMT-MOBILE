import { api } from "@/api/client";
import { ApiError, isApiError, networkError, toApiError } from "@/api/errors";
import type { components } from "@/api/schema.generated";

/**
 * A wallet for a person outside Nigeria (WALLET-41, R-87): the countries to pick from, what a country is offered
 * (`GET /money/world/options`), and the call that opens the first account (`POST /money/world/first-account`).
 * Everything the screen says comes from these answers; the app carries no list of countries or currencies.
 */
type Options = components["schemas"]["WorldOptionsView"];
type Countries = components["schemas"]["WorldCountriesView"];
type WorldView = components["schemas"]["WorldWalletView"];
type Envelope<T> = { statusCode: number; message: string; data: T | null };
type Answer = { data?: unknown; error?: unknown; response: Response };

export const FIAT_CODES = ["USD", "EUR", "GBP", "CAD", "AED", "GHS"] as const;
export type FiatCode = (typeof FIAT_CODES)[number];
export const isFiat = (value: unknown): value is FiatCode =>
  FIAT_CODES.includes(value as FiatCode);

export type WorldCountry = { code: string; name: string };
export type CurrencyChoice = { code: FiatCode; name: string; enabled: boolean };
export type WorldUnavailable =
  | "switched_off"
  | "country_blocked"
  | "limit_reached"
  | "nigeria";
export type WorldOptions = {
  country: string;
  abroad: boolean;
  available: boolean;
  unavailableReason: WorldUnavailable | null;
  suggested: FiatCode;
  choices: CurrencyChoice[];
};
/** `GET /money/wallet`'s `world` block: only a person who opened from outside Nigeria has one. */
export type WorldProgress = {
  country: string;
  firstCurrency: FiatCode | null;
  state: "opening" | "open" | "frozen" | "cancelled";
};

function unreadable(): ApiError {
  return new ApiError("unknown", 200, "This could not be read. Try again.");
}

async function send(request: Promise<Answer>): Promise<unknown> {
  let answer: Answer;
  try {
    answer = await request;
  } catch (error) {
    throw isApiError(error) ? error : networkError();
  }
  if (!answer.response.ok)
    throw toApiError(answer.response.status, answer.error);
  return (answer.data as Envelope<unknown> | undefined)?.data;
}

const text = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

/** GET /money/world/countries: every country a person can say they live in, by name. */
export async function fetchCountries(): Promise<WorldCountry[]> {
  const view = (await send(api.GET("/api/hub/money/world/countries"))) as
    | Countries
    | undefined;
  if (!view || !Array.isArray(view.countries)) throw unreadable();
  return view.countries
    .filter((c) => text(c?.code) && text(c?.name))
    .map((c) => ({ code: c.code, name: c.name }));
}

/** GET /money/world/options: what a country is offered, and whether a wallet can be opened from there now. */
export async function fetchWorldOptions(
  country: string,
): Promise<WorldOptions> {
  const view = (await send(
    api.GET("/api/hub/money/world/options", { params: { query: { country } } }),
  )) as Options | undefined;
  if (
    !view ||
    typeof view.available !== "boolean" ||
    !isFiat(view.suggested) ||
    !Array.isArray(view.choices)
  )
    throw unreadable();
  return {
    country: view.country,
    abroad: view.abroad === true,
    available: view.available,
    unavailableReason:
      (view.unavailableReason as WorldUnavailable | null) ?? null,
    suggested: view.suggested,
    choices: view.choices
      .filter((c) => isFiat(c?.code) && text(c?.name))
      .map((c) => ({
        code: c.code as FiatCode,
        name: c.name,
        enabled: c.enabled === true,
      })),
  };
}

/** What `GET /money/wallet` and `POST /money/wallet/open` say of the world part of a wallet; null for a Nigerian one. */
export function readWorld(value: unknown): WorldProgress | null {
  if (value === null || value === undefined) return null;
  const v = value as Partial<WorldView>;
  if (typeof v !== "object" || !text(v.country)) throw unreadable();
  const states = ["opening", "open", "frozen", "cancelled"] as const;
  if (!states.includes(v.state as (typeof states)[number])) throw unreadable();
  return {
    country: v.country,
    firstCurrency: isFiat(v.firstCurrency) ? v.firstCurrency : null,
    state: v.state as WorldProgress["state"],
  };
}

/**
 * POST /money/world/first-account: asks the Hub to open the first account of a person the bank approved. Safe to repeat.
 * `currency` picks another first currency while none is open (the bank may decline a country's own). Resolves with the
 * world part of the wallet afterwards.
 */
export async function openFirstAccount(
  currency?: FiatCode,
): Promise<WorldProgress | null> {
  const view = (await send(
    api.POST("/api/hub/money/world/first-account", {
      body: currency ? { currency } : {},
    }),
  )) as components["schemas"]["WalletView"] | undefined;
  if (!view || typeof view !== "object") throw unreadable();
  return readWorld((view as { world?: unknown }).world);
}
