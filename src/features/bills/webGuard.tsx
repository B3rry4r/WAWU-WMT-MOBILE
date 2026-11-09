import { Redirect } from 'expo-router';
import type { ComponentType } from 'react';

import { billsOffered } from './offered';

/**
 * Every route under `src/app/bills/**` is exported through this (WEBAPP-06, R-47): on the web there is no bills entry, so a deep link or a typed
 * address to any bills page goes home. The page itself is not rendered, so none of its hooks run.
 */
export function withBillsGuard(Page: ComponentType): ComponentType {
  function Guarded() {
    return billsOffered() ? <Page /> : <Redirect href="/" />;
  }
  return Guarded;
}
