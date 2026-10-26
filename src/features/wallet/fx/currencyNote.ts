import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

/**
 * The one-time note after a wallet opens ("You can also hold dollars, pounds, euros..."), seen once for each person. It is kept on this
 * phone, under the person's id, and not at the Hub: it is a hint about the app, not a fact about the account, and a Hub flag would be a
 * table and a route for something that costs nothing if it shows twice on a second phone. Nothing here is a secret; the secure store is
 * the one store the app ships (the browser build keeps it in localStorage, as the theme does).
 */
export const noteKey = (owner: string): string => `wmt.note.currencies.${owner}`;

const onWeb = Platform.OS === 'web';

async function read(key: string): Promise<string | null> {
  if (onWeb) return globalThis.localStorage?.getItem(key) ?? null;
  return SecureStore.getItemAsync(key);
}
async function write(key: string, value: string): Promise<void> {
  if (onWeb) return globalThis.localStorage?.setItem(key, value);
  return SecureStore.setItemAsync(key, value);
}

/** Whether the note has been seen and put away: `null` while it is being read, so nothing flashes before the answer. */
export function useCurrencyNote(owner: string | null): { seen: boolean | null; dismiss: () => void } {
  const [seen, setSeen] = useState<{ owner: string; value: boolean } | null>(null);
  useEffect(() => {
    if (!owner) return;
    let live = true;
    read(noteKey(owner))
      .then((value) => live && setSeen({ owner, value: value === 'seen' }))
      // A phone that cannot read its store shows no note: a hint is never worth a nag.
      .catch(() => live && setSeen({ owner, value: true }));
    return () => {
      live = false;
    };
  }, [owner]);
  const dismiss = useCallback(() => {
    if (!owner) return;
    setSeen({ owner, value: true });
    void write(noteKey(owner), 'seen').catch(() => undefined);
  }, [owner]);
  return { seen: owner && seen?.owner === owner ? seen.value : null, dismiss };
}
