import { readLocal, writeLocal } from '@/features/claim/localStore';

/**
 * Which reward and milestone moments (RF3, RF3a) this phone has already shown, per account, so each is told once.
 * Nothing here is a secret and nothing is sent anywhere. The store is the one the claim feature already uses: bounded,
 * and a read that fails or hangs reads as "nothing remembered".
 *
 * The first time a phone looks, there is nothing remembered: everything the Hub already lists is taken as seen, so a
 * new install never replays old rewards. Only a reward that becomes available after that first look is told.
 */
export const seenKey = (sub: string) => `wmt.referral.seen.${sub}`;

/** The ids already shown, or null when this phone has never looked (or the store gave nothing back). */
export async function readSeen(sub: string): Promise<Set<string> | null> {
  const raw = await readLocal(seenKey(sub));
  if (!raw) return null;
  try {
    const list: unknown = JSON.parse(raw);
    return Array.isArray(list) ? new Set(list.filter((id): id is string => typeof id === 'string')) : null;
  } catch {
    return null;
  }
}

export async function writeSeen(sub: string, ids: ReadonlySet<string>): Promise<void> {
  await writeLocal(seenKey(sub), JSON.stringify([...ids]));
}
