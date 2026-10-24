import { router } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { inboxKey } from '@/features/inbox/api';

import { openSupportThread, type SupportReference } from './api';

/** What a person is told when the Hub could not be reached or answered something unreadable. */
export const SUPPORT_FAILED = 'We couldn’t open the support chat. Try again.';

/**
 * Opens the support chat from H18, W27 or W35 with the payment already attached (R-30), and lands in it (I12). One tap at a time: a
 * second tap while the first is on its way does nothing (it goes to the chat through expo-router's own `router`, so a sheet over the
 * feed, which has no navigation of its own, can lead there too), and a retry after a failure asks again with the same reference, which the
 * Hub answers with the same thread and the same message. The Hub's own words are shown for a refusal (a payment that is not the
 * person's, or is gone), and a plain line otherwise.
 */
export function useOpenSupport() {
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);

  const open = useCallback(
    async (reference?: SupportReference) => {
      if (busy.current) return;
      busy.current = true;
      setOpening(true);
      setError(null);
      try {
        const thread = await openSupportThread(reference);
        // The thread has a message now: the inbox shows its row the next time it is read.
        void queryClient.invalidateQueries({ queryKey: inboxKey });
        router.push({ pathname: '/chat/[id]', params: { id: thread.chatId } });
      } catch (e) {
        setError(isApiError(e) && e.kind !== 'network' && e.message ? e.message : SUPPORT_FAILED);
      } finally {
        busy.current = false;
        setOpening(false);
      }
    },
    [],
  );

  return { open, opening, error, clearError: () => setError(null) };
}
