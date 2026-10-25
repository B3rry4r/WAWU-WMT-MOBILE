import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { bounded } from '@/features/claim/localStore';

/**
 * A tier or a pass being bought, and the room if it is a pass, kept on the phone until the Hub has the purchase (IAP-02, IAP-03 round 2).
 *
 * The App Store's one account field carries the person's account token, so a pass bought there can not carry its room, and the store does not
 * say whether a running subscription was ever handed to the Hub. If the app is closed after the store took the payment and before the Hub was
 * told, the recovery that finishes it later reads here that this person owes the Hub this product, and which room. Google Play keeps the room
 * in the purchase itself (its profile id) and says whether it was acknowledged, so it needs this only for the room's absence. One entry per
 * person (their account token, which is not the user id); an entry nobody finished is not trusted after a month. Every call is bounded and never throws.
 *
 * A pass is bought once, so a person can hold several unfinished payments at once, each for its own room. The one entry per person says what
 * they were trying to buy last, which is not necessarily the room of a payment the store still holds. So the moment the store hands back a
 * pass transaction, its room is kept against THAT transaction's id (`bindRoom`), and a held pass is only ever handed to the Hub with the room
 * it was bought for (`roomOf`), never the room being bought now (F2b). The latest entry stands in only for a payment nothing was bound to, and
 * only when it is the single such payment.
 */
type Entry = { productId: string; communityId: string | null; at: number };

const KEEP_MS = 30 * 24 * 60 * 60 * 1000;
const onWeb = Platform.OS === 'web';
const keyOf = (token: string) => `wmt.store.room.${token}`;

const read = (key: string): Promise<string | null> => bounded(async () => (onWeb ? (globalThis.localStorage?.getItem(key) ?? null) : SecureStore.getItemAsync(key)), null);
const write = (key: string, value: string | null): Promise<boolean> =>
  bounded(async () => {
    if (onWeb) {
      if (value === null) globalThis.localStorage?.removeItem(key);
      else globalThis.localStorage?.setItem(key, value);
    } else if (value === null) await SecureStore.deleteItemAsync(key);
    else await SecureStore.setItemAsync(key, value);
    return true;
  }, false);

/** Remembers the subscription (and its room) before the store sheet opens. */
export async function rememberBuy(token: string | null, productId: string, communityId: string | null): Promise<void> {
  if (!token) return;
  await write(keyOf(token), JSON.stringify({ productId, communityId, at: Date.now() } satisfies Entry));
}

/** What this person was buying of this product, if one was kept and is still trusted: its room (null for a tier). Null when nothing is owed. */
export async function pendingBuy(token: string | null, productId: string, now: number = Date.now()): Promise<{ communityId: string | null } | null> {
  if (!token) return null;
  try {
    const raw = await read(keyOf(token));
    const e = raw ? (JSON.parse(raw) as Partial<Entry>) : null;
    if (!e || e.productId !== productId || typeof e.at !== 'number' || now - e.at > KEEP_MS) return null;
    return { communityId: typeof e.communityId === 'string' ? e.communityId : null };
  } catch {
    return null;
  }
}

/** The Hub has the purchase: the entry is not needed. */
export async function forgetBuy(token: string | null): Promise<void> {
  if (token) await write(keyOf(token), null);
}

type Bound = Record<string, { communityId: string; at: number }>;

const MAX_BOUND = 12;
const boundKey = (token: string) => `wmt.store.txn.${token}`;

async function readBound(token: string): Promise<Bound> {
  try {
    const raw = await read(boundKey(token));
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Bound) : {};
  } catch {
    return {};
  }
}

/** The room a pass transaction was bought for, kept against the transaction's own id as soon as the store hands it back. */
export async function bindRoom(token: string | null, transactionKey: string | null, communityId: string | null, now: number = Date.now()): Promise<void> {
  if (!token || !transactionKey || !communityId) return;
  const bound = await readBound(token);
  const fresh = Object.entries({ ...bound, [transactionKey]: { communityId, at: now } })
    .filter(([, e]) => typeof e?.communityId === 'string' && typeof e.at === 'number' && now - e.at <= KEEP_MS)
    .sort((a, b) => b[1].at - a[1].at)
    .slice(0, MAX_BOUND);
  await write(boundKey(token), JSON.stringify(Object.fromEntries(fresh)));
}

/** The room this transaction was bought for, or null when none was kept (it was bought on another phone, or long ago). */
export async function roomOf(token: string | null, transactionKey: string | null, now: number = Date.now()): Promise<string | null> {
  if (!token || !transactionKey) return null;
  const e = (await readBound(token))[transactionKey];
  return e && typeof e.communityId === 'string' && typeof e.at === 'number' && now - e.at <= KEEP_MS ? e.communityId : null;
}

/** The Hub has the transaction: its room is not needed. */
export async function unbindRoom(token: string | null, transactionKey: string | null): Promise<void> {
  if (!token || !transactionKey) return;
  const bound = await readBound(token);
  if (!(transactionKey in bound)) return;
  delete bound[transactionKey];
  await write(boundKey(token), Object.keys(bound).length === 0 ? null : JSON.stringify(bound));
}
