import { Redirect } from 'expo-router';
import type { ComponentType } from 'react';

import { useSession } from '@/api/session';
import { useStartHref } from '@/features/shell/startHref';

import { billsOffered } from './offered';

/**
 * Every route under `src/app/bills/**` is exported through this (WEBAPP-06, R-47): on the web there is no bills entry, so a deep link or a typed
 * address to any bills page goes home. The page itself is not rendered, so none of its hooks run.
 */
export function withBillsGuard(Page: ComponentType): ComponentType {
  function Guarded() {
    const { status } = useSession();
    const start = useStartHref();
    if (billsOffered()) return <Page />;
    // The route graph is ready once the session is read: a redirect before that draws nothing.
    return status === 'restoring' ? null : <Redirect href={start} />;
  }
  return Guarded;
}
