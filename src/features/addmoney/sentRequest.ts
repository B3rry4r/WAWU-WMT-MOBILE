import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import { bounded } from "@/features/claim/localStore";

import type { AddMoneyRail, Billing } from "./ways";

/**
 * The one request of an add-money attempt, kept on the phone until the Hub has the last word (WALLET-25 fix round 1, F1).
 *
 * An attempt is one `Idempotency-Key` and one request body. If the app hears no answer (no network, a timeout, a server fault, the same
 * key still running) the card may already have been charged, and the only safe next step is to send the SAME request again: the Hub
 * answers a key it knows with the first result. The Hub compares the body with the first one, and a card is scrambled with a random
 * padding, so scrambling it again for the retry makes a different body under the same key and the Hub refuses it. So the card is
 * scrambled once, here the scrambled text is kept beside the key and the amounts, and every retry sends exactly these bytes, also
 * after the screen is closed and the app opened again. It is removed when the Hub gives a final answer (taken, or a refusal that
 * proves no payment exists for the key) or when the person starts a new payment knowingly.
 *
 * Nothing here is a secret that opens a card: the card is only its scrambled text (readable by the provider alone), and the PIN is
 * never kept. The secure store is the one store the app already ships; the browser build used for development keeps it in localStorage.
 * Every call is bounded and never throws: a store that fails reads as "nothing remembered", and the memory of this run still holds it.
 */
export type SentRequest = {
  /** The `Idempotency-Key`, one per attempt. */
  key: string;
  rail: AddMoneyRail;
  amountKobo: number;
  chargeKobo: number;
  /** The card as the phone scrambled it, with the billing address; the same text on every retry. */
  card?: { encrypted: string; billing: Billing };
  msisdn?: string;
  /** When the request was first made (ms). */
  at: number;
};

/** How long a request with no answer is kept: the Hub keeps a key for at least a day, so past this the same key can no longer be trusted. */
export const SENT_KEEP_MS = 23 * 60 * 60 * 1000;

const onWeb = Platform.OS === "web";
export const sentKey = (owner: string) => `wmt.addmoney.sent.${owner}`;

const filled = (v: unknown): v is string =>
  typeof v === "string" && v.length > 0;
const whole = (v: unknown): v is number =>
  typeof v === "number" && Number.isSafeInteger(v) && v > 0;

function parse(raw: string | null, now: number): SentRequest | null {
  if (!raw) return null;
  try {
    const r = JSON.parse(raw) as Partial<SentRequest>;
    if (
      !filled(r.key) ||
      !filled(r.rail) ||
      !whole(r.amountKobo) ||
      !whole(r.chargeKobo) ||
      !whole(r.at)
    )
      return null;
    if (now - r.at > SENT_KEEP_MS) return null;
    if (
      r.rail === "card" &&
      !(r.card && filled(r.card.encrypted) && r.card.billing)
    )
      return null;
    return r as SentRequest;
  } catch {
    return null;
  }
}

export const readSent = (
  owner: string | null,
  now = Date.now(),
): Promise<SentRequest | null> =>
  owner === null
    ? Promise.resolve(null)
    : bounded(
        async () =>
          parse(
            onWeb
              ? (globalThis.localStorage?.getItem(sentKey(owner)) ?? null)
              : await SecureStore.getItemAsync(sentKey(owner)),
            now,
          ),
        null,
      );

/** True when the store took it. Written before the request leaves the phone. */
export const keepSent = (
  owner: string | null,
  request: SentRequest,
): Promise<boolean> =>
  owner === null
    ? Promise.resolve(false)
    : bounded(async () => {
        const text = JSON.stringify(request);
        if (onWeb) globalThis.localStorage?.setItem(sentKey(owner), text);
        else await SecureStore.setItemAsync(sentKey(owner), text);
        return true;
      }, false);

export const dropSent = (owner: string | null): Promise<void> =>
  owner === null
    ? Promise.resolve()
    : bounded(async () => {
        if (onWeb) globalThis.localStorage?.removeItem(sentKey(owner));
        else await SecureStore.deleteItemAsync(sentKey(owner));
      }, undefined);
