import { api, resendsUnderKey, unwrap } from "@/api/client";
import { ApiError } from "@/api/errors";
import type { components } from "@/api/schema.generated";
import type {
  ApprovalAttempt,
  SignedRequest,
} from "@/features/device-approval";

/**
 * The calls behind the other ways to add money (WALLET-25: card and Apple Pay; WALLET-26: USSD and the bank checkout; R-84), as the
 * backend contract types them.
 *
 * - `GET /money/add-money/options`: which ways the Hub offers now, and why one cannot be used, in the Hub's words. Also the provider's
 *   public key, which the phone encrypts a card with: the card never reaches the Hub in the clear (`cardPublicKey`).
 * - `GET /money/add-money/quote`: what the person pays and what the wallet gets for an amount (the provider's charge plus WAWU's, R-10,
 *   both from the Hub's config).
 * - `POST /money/add-money`: the PIN is `X-Transaction-Pin` (or the phone's fingerprint approval, `X-Device-Approval`, in its place) and the
 *   `Idempotency-Key` is one per attempt, sent again unchanged on every retry.
 * - `GET /money/add-money/{id}`, `POST /money/add-money/{id}/cancel`: where an attempt stands, and giving up on one that is not paid.
 *
 * The Hub's refusals carry a code and a sentence; the app shows the sentence.
 */
export type AddMoneyOptions = components["schemas"]["AddMoneyOptionsView"];
export type AddMoneyRailView = components["schemas"]["AddMoneyRailView"];
export type AddMoneyQuote = components["schemas"]["AddMoneyQuoteView"];
export type AddMoneyAttempt = components["schemas"]["AddMoneyView"];
export type AddMoneyRail = AddMoneyRailView["rail"];

type Envelope<T> = { statusCode: number; message: string; data: T | null };

const filled = (v: unknown): v is string =>
  typeof v === "string" && v.trim().length > 0;
const isKobo = (v: unknown): v is number =>
  typeof v === "number" && Number.isSafeInteger(v) && v >= 0;
const STATUSES = [
  "created",
  "awaiting_user",
  "processing",
  "settled",
  "failed",
  "expired",
  "cancelled",
];
const RAILS = ["card", "apple_pay", "ussd", "open_banking"];

function unreadable(what: string): ApiError {
  return new ApiError(
    "unknown",
    200,
    `Your ${what} could not be read. Try again.`,
  );
}

/** An attempt, field by field: an answer that is not one is refused, never shown as "nothing happened". */
export function readAttempt(raw: unknown): AddMoneyAttempt {
  const a = raw as Partial<AddMoneyAttempt> | null | undefined;
  if (
    !a ||
    !filled(a.id) ||
    !RAILS.includes(a.rail as string) ||
    !STATUSES.includes(a.status as string) ||
    !isKobo(a.amountKobo) ||
    !isKobo(a.chargeKobo) ||
    !filled(a.message)
  ) {
    throw unreadable("payment");
  }
  return a as AddMoneyAttempt;
}

function readOptions(raw: unknown): AddMoneyOptions {
  const o = raw as Partial<AddMoneyOptions> | null | undefined;
  if (!o || !Array.isArray(o.rails)) throw unreadable("payment options");
  const rails = o.rails.filter(
    (r): r is AddMoneyRailView =>
      !!r && RAILS.includes(r.rail) && typeof r.available === "boolean",
  );
  return { ...(o as AddMoneyOptions), rails };
}

function readQuote(raw: unknown): AddMoneyQuote {
  const q = raw as Partial<AddMoneyQuote> | null | undefined;
  if (
    !q ||
    !RAILS.includes(q.rail as string) ||
    !isKobo(q.amountKobo) ||
    !isKobo(q.providerFeeKobo) ||
    !isKobo(q.wawuFeeKobo) ||
    !isKobo(q.chargeKobo)
  ) {
    throw unreadable("total");
  }
  return q as AddMoneyQuote;
}

export async function fetchOptions(): Promise<AddMoneyOptions> {
  const body = (await unwrap(
    api.GET("/api/hub/money/add-money/options"),
  )) as unknown as Envelope<AddMoneyOptions>;
  return readOptions(body?.data);
}

export async function fetchQuote(
  rail: AddMoneyRail,
  amountKobo: number,
): Promise<AddMoneyQuote> {
  const body = (await unwrap(
    api.GET("/api/hub/money/add-money/quote", {
      params: { query: { rail, amountKobo } },
    }),
  )) as unknown as Envelope<AddMoneyQuote>;
  return readQuote(body?.data);
}

export async function fetchAttempt(id: string): Promise<AddMoneyAttempt> {
  const body = (await unwrap(
    api.GET("/api/hub/money/add-money/{id}", { params: { path: { id } } }),
  )) as unknown as Envelope<AddMoneyAttempt>;
  return readAttempt(body?.data);
}

export async function cancelAttempt(id: string): Promise<AddMoneyAttempt> {
  const body = (await unwrap(
    api.POST("/api/hub/money/add-money/{id}/cancel", {
      params: { path: { id } },
    }),
  )) as unknown as Envelope<AddMoneyAttempt>;
  return readAttempt(body?.data);
}

/** Who approves: the PIN, or the phone's fingerprint or face (`approve` makes the `X-Device-Approval` value for the exact request). Exactly one. */
export type Approver = (request: SignedRequest) => Promise<ApprovalAttempt>;
export type Credential =
  | { pin: string; approve?: never }
  | { approve: Approver; pin?: never };

/** What the person typed for a card: the phone encrypts it before anything is sent. */
export type CardEntry = {
  number: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  name: string;
};
export type Billing = {
  line1: string;
  city: string;
  state: string;
  postalCode?: string;
};

export type StartInput = {
  rail: AddMoneyRail;
  amountKobo: number;
  /** What the person was shown they pay: the Hub refuses (409) if it changed. */
  chargeKobo: number;
  /** The card, already encrypted on this phone (base64), with the billing address. */
  card?: { encrypted: string; billing: Billing };
  /** USSD: the paying phone; left out, the phone on the account. */
  msisdn?: string;
  /** One per attempt, kept across retries of the same attempt. */
  key: string;
} & Credential;

export type StartOutcome =
  /** The Hub took the request and answered with the attempt (it may already be `failed`, with the reason in plain words). */
  | { kind: "done"; attempt: AddMoneyAttempt }
  | { kind: "pin_incorrect"; triesLeft: number }
  | { kind: "pin_locked"; lockedUntil: string }
  | { kind: "pin_not_set" }
  | { kind: "no_wallet" }
  /** `409 quote_changed`: the fees moved; the quote is asked for again. */
  | { kind: "quote_changed" }
  /** No answer that proves anything: send the SAME key again. */
  | { kind: "unanswered" }
  | { kind: "approval_cancelled" }
  | { kind: "approval_failed" }
  | { kind: "refused"; code: string | null; message: string };

type Reason = {
  code?: unknown;
  message?: unknown;
  triesLeft?: unknown;
  lockedUntil?: unknown;
};

function reasonOf(error: unknown): { reason: Reason; message: string } {
  const record =
    typeof error === "object" && error !== null
      ? (error as { reason?: unknown; message?: unknown })
      : {};
  const reason =
    typeof record.reason === "object" && record.reason !== null
      ? (record.reason as Reason)
      : {};
  const raw = record.message;
  const message = Array.isArray(raw)
    ? raw.filter((p) => typeof p === "string").join(". ")
    : typeof raw === "string"
      ? raw
      : "";
  return {
    reason,
    message:
      typeof reason.message === "string" && reason.message
        ? reason.message
        : message,
  };
}

/** Reads the Hub's answer into the one `StartOutcome` the screen branches on. Never throws. */
export function startOutcomeOf(result: {
  data?: unknown;
  error?: unknown;
  response: Response;
}): StartOutcome {
  const { data, error, response } = result;
  if (response.status === 201) {
    try {
      return {
        kind: "done",
        attempt: readAttempt(
          (data as unknown as Envelope<AddMoneyAttempt> | undefined)?.data,
        ),
      };
    } catch {
      // The Hub said created and the answer cannot be read: the attempt may exist, so it is not a refusal.
      return { kind: "unanswered" };
    }
  }
  if (response.status >= 500) return { kind: "unanswered" };
  const { reason, message } = reasonOf(error);
  const code = typeof reason.code === "string" ? reason.code : null;
  switch (code) {
    case "pin_incorrect":
      return {
        kind: "pin_incorrect",
        triesLeft: typeof reason.triesLeft === "number" ? reason.triesLeft : 0,
      };
    case "pin_locked":
      return filled(reason.lockedUntil)
        ? { kind: "pin_locked", lockedUntil: reason.lockedUntil }
        : { kind: "unanswered" };
    case "pin_not_set":
      return { kind: "pin_not_set" };
    case "wallet_not_open":
      return { kind: "no_wallet" };
    case "device_approval_refused":
      return { kind: "approval_failed" };
    case "idempotency_in_progress":
      return { kind: "unanswered" };
    case "quote_changed":
      return { kind: "quote_changed" };
    default:
      return {
        kind: "refused",
        code,
        message: message || "This payment was not taken. Nothing was charged.",
      };
  }
}

async function approvalHeader(
  credential: Credential,
  request: SignedRequest,
): Promise<
  | {
      header: { "X-Transaction-Pin": string } | { "X-Device-Approval": string };
    }
  | { outcome: StartOutcome }
> {
  if (credential.approve === undefined)
    return { header: { "X-Transaction-Pin": credential.pin } };
  const attempt = await credential.approve(request);
  switch (attempt.kind) {
    case "ready":
      return { header: { "X-Device-Approval": attempt.header } };
    case "cancelled":
      return { outcome: { kind: "approval_cancelled" } };
    case "unanswered":
      return { outcome: { kind: "unanswered" } };
    case "failed":
      return { outcome: { kind: "approval_failed" } };
  }
}

/** POST /money/add-money. Never rejects: whatever came back (or did not) is a `StartOutcome`. */
export async function startAddMoney(input: StartInput): Promise<StartOutcome> {
  const body = {
    rail: input.rail,
    amountKobo: input.amountKobo,
    chargeKobo: input.chargeKobo,
    ...(input.card
      ? {
          card: {
            encrypted: input.card.encrypted,
            billing: input.card.billing,
          },
        }
      : {}),
    ...(input.rail === "ussd" && input.msisdn
      ? { ussd: { msisdn: input.msisdn } }
      : {}),
  };
  const approval = await approvalHeader(input, {
    method: "POST",
    path: "/api/hub/money/add-money",
    body,
  });
  if ("outcome" in approval) return approval.outcome;
  let result;
  try {
    result = await api.POST("/api/hub/money/add-money", {
      params: { header: { ...approval.header, "Idempotency-Key": input.key } },
      body,
      fetch: resendsUnderKey,
    });
  } catch {
    return { kind: "unanswered" };
  }
  return startOutcomeOf(result);
}
