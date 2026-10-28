import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { bounded } from '@/features/claim/localStore';

/**
 * Which intent a store transaction was bought for, kept on the phone against the transaction's own id as soon as the store hands it back
 * (R-101). If the app is closed after the store took the payment and before the Hub was told, the next start finds the transaction still
 * open and posts it again WITH the intent it was bought for, so the Hub gives the goods and not a late-sale credit. Same shape as the pass
 * room in `../roomIntent`: per person (their account token, not the user id), the newest few, nothing trusted after a month, and every call
 * is bounded and never throws.
 */
type Bound = Record<string, { intentId: string; at: number }>;

const KEEP_MS = 30 * 24 * 60 * 60 * 1000;
/** An intent kept for a store sheet that is open: a payment that outlives the app is found within a day or not at all. */
const SHEET_KEEP_MS = 24 * 60 * 60 * 1000;
const MAX_BOUND = 12;
const onWeb = Platform.OS === 'web';
const keyOf = (token: string) => `wmt.store.intent.${token}`;

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

async function readBound(token: string): Promise<Bound> {
  try {
    const raw = await read(keyOf(token));
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Bound) : {};
  } catch {
    return {};
  }
}

/** The key the intent is kept under while the store sheet for this product is open, before the store has given the app any transaction id. */
export const sheetKey = (productId: string): string => `sheet:${productId}`;

/** The intent this store transaction was bought for. */
export async function bindIntent(token: string | null, transactionKey: string | null, intentId: string | null, now: number = Date.now()): Promise<void> {
  if (!token || !transactionKey || !intentId) return;
  const bound = await readBound(token);
  const fresh = Object.entries({ ...bound, [transactionKey]: { intentId, at: now } })
    .filter(([, e]) => typeof e?.intentId === 'string' && typeof e.at === 'number' && now - e.at <= KEEP_MS)
    .sort((a, b) => b[1].at - a[1].at)
    .slice(0, MAX_BOUND);
  await write(keyOf(token), JSON.stringify(Object.fromEntries(fresh)));
}

/** The intent kept for this transaction, or null when none was (it was bought on another phone, or long ago). */
export async function intentOf(token: string | null, transactionKey: string | null, productId?: string, now: number = Date.now()): Promise<string | null> {
  if (!token || !transactionKey) return null;
  const bound = await readBound(token);
  const e = bound[transactionKey];
  if (e && typeof e.intentId === 'string' && typeof e.at === 'number' && now - e.at <= KEEP_MS) return e.intentId;
  // The app was closed while the store sheet was open: the payment has no id kept against it, but the intent was kept for its product.
  const open = productId ? bound[sheetKey(productId)] : undefined;
  return open && typeof open.intentId === 'string' && typeof open.at === 'number' && now - open.at <= SHEET_KEEP_MS ? open.intentId : null;
}

/** The Hub has the transaction: the intent is not needed. */
export async function unbindIntent(token: string | null, transactionKey: string | null): Promise<void> {
  if (!token || !transactionKey) return;
  const bound = await readBound(token);
  if (!(transactionKey in bound)) return;
  delete bound[transactionKey];
  await write(keyOf(token), Object.keys(bound).length === 0 ? null : JSON.stringify(bound));
}
