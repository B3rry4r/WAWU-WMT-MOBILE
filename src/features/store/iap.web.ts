import { StoreFailure } from './failure';
import type { BuyRequest, BuyResult, Os, StoreCause, StorePrice, StoreTransaction } from './iap';

/**
 * The web has no store sheet (IAP-02): Google Play Billing and Apple In-App Purchase exist only in the phone apps, and the website
 * keeps its own payments (R-86). Every call here answers as a phone without a store would, so a screen opened in the browser says plainly
 * that buying happens in the app. The pictures of the buy screens are made from this build, and the store sheet itself cannot show there.
 */
export type { BuyRequest, BuyResult, Os, StoreCause, StorePrice, StoreTransaction };

export const storeOs = (): Os | null => null;
export const storeName = (os: Os | null): string => (os === 'ios' ? 'the App Store' : 'Google Play');
export const causeOf = (): StoreCause => 'store_unavailable';
export const resetIapForTests = (): void => undefined;
export const connect = async (): Promise<boolean> => false;
export async function fetchPrices(): Promise<Map<string, StorePrice>> {
  throw new StoreFailure('store_unavailable');
}
export const buy = async (_request: BuyRequest): Promise<BuyResult> => ({ ok: false, cause: 'store_unavailable' });
export const finish = async (): Promise<boolean> => false;
export const owned = async (): Promise<StoreTransaction[]> => [];
export async function restore(): Promise<StoreTransaction[]> {
  throw new StoreFailure('store_unavailable');
}
