import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';

import { sentenceOf } from './failure';
import { startedInThisSession, useSignedIn } from './sessionGuard';

export type SwitchSettings<K extends string, S> = {
  queryKey: readonly unknown[];
  read: () => Promise<S>;
  /** Sends one key. Resolves with the settings as the server now holds them. */
  write: (patch: Partial<Record<K, boolean>>) => Promise<S>;
  /** The current value of a key; a key the server has never held reads as its default. */
  valueOf: (settings: S, key: K) => boolean;
};

/**
 * The switches of one settings route. Tapping flips the switch at once and sends that one key; if the
 * save fails the switch flips back and `failure` says why. A switch ignores taps while its own save is
 * in flight (`busy`), so two taps cannot cross on the way and leave the server with the wrong one.
 * An answer only ever writes its own key into the cache, so a save finishing late cannot undo
 * another switch's tap, and an answer that comes after the session ended (SETTINGS-01 round 2, D1) writes
 * nothing at all, success or failure, so it cannot touch the next account's cache.
 */
export function useSwitches<K extends string, S extends object>(config: SwitchSettings<K, S>) {
  const client = useQueryClient();
  const signedIn = useSignedIn();
  const query = useQuery({ queryKey: config.queryKey, queryFn: config.read, enabled: signedIn });
  const [busy, setBusy] = useState<readonly K[]>([]);
  const [failure, setFailure] = useState<string | null>(null);
  const inFlight = useRef(new Set<K>());

  const set = async (key: K, value: boolean) => {
    if (inFlight.current.has(key) || !client.getQueryData<S>(config.queryKey)) return;
    inFlight.current.add(key);
    const sameSession = startedInThisSession();
    setBusy([...inFlight.current]);
    setFailure(null);
    const before = client.getQueryData<S>(config.queryKey);
    client.setQueryData<S>(config.queryKey, (old) => (old ? { ...old, [key]: value } : old));
    try {
      const saved = await config.write({ [key]: value } as Partial<Record<K, boolean>>);
      // The account that sent this signed out (or another signed in) while it was on its way: the cache and the
      // screen now belong to someone else, so the answer is dropped.
      if (!sameSession()) return;
      const kept = (saved as Record<string, unknown>)[key];
      client.setQueryData<S>(config.queryKey, (old) => (old ? { ...old, [key]: typeof kept === 'boolean' ? kept : value } : old));
    } catch (error) {
      if (!sameSession()) return;
      const was = before ? (before as Record<string, unknown>)[key] : undefined;
      client.setQueryData<S>(config.queryKey, (old) => (old ? { ...old, [key]: was } : old));
      setFailure(sentenceOf(error, 'That did not save. Try again.'));
    } finally {
      inFlight.current.delete(key);
      setBusy([...inFlight.current]);
    }
  };

  return {
    query,
    busy,
    failure,
    isOn: (key: K) => (query.data ? config.valueOf(query.data, key) : false),
    set,
  };
}
