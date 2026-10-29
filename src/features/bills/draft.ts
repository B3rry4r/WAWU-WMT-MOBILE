import { useSyncExternalStore } from 'react';

import type { BillKind } from './kinds';

/**
 * The bill being put together, from the first pick to Pay. It lives in memory only, never in an address: a link cannot name an
 * amount or a company, and a screen opened without it goes back to S2. Back keeps what was picked; Done or a new start clears it.
 */
export type BillDraft = {
  kind: BillKind;
  /** The category as the provider names it: `init` sends this display name, as the website does. */
  categoryName: string;
  /** The category's CODE, which billers are listed by. */
  categoryCode: string;
  biller?: { code: string; name: string };
  item?: { code: string; name: string; amount: number; label: string | null };
  /** The meter, smartcard or phone number, digits only. */
  customer?: string;
  /** The name the provider holds for it, once checked. */
  customerName?: string | null;
  /** Whole naira. */
  amount?: number;
};

let current: BillDraft | null = null;
const listeners = new Set<() => void>();
/** The Hub's own sentence for a bill it took money for and could not deliver, by bill id (S12 shows it as the Hub wrote it). */
const failures = new Map<string, string>();

const emit = () => listeners.forEach((l) => l());

export const billDraft = {
  get: (): BillDraft | null => current,
  /** Starts a bill: whatever was being put together is gone. */
  start(next: BillDraft): void {
    current = next;
    emit();
  },
  /** Adds to the bill; nothing happens when there is none. */
  update(patch: Partial<BillDraft>): void {
    if (!current) return;
    current = { ...current, ...patch };
    emit();
  },
  clear(): void {
    current = null;
    emit();
  },
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  failureFor: (id: string): string | undefined => failures.get(id),
  rememberFailure(id: string, sentence: string): void {
    failures.set(id, sentence);
  },
};

export function useBillDraft(): BillDraft | null {
  return useSyncExternalStore(billDraft.subscribe, billDraft.get, billDraft.get);
}
