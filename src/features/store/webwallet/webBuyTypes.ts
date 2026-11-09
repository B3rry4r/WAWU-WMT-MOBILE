import type { ReactNode } from 'react';

import type { StorePurchaseView } from '../api';
import type { Said } from '../words';
import type { WebBuySpec } from './api';

export type WebTarget = { spec: WebBuySpec; title: string; grants: object | null; verb: string };

export type WebBuy = {
  /** The quote is being asked for, or a sheet is open: the buy button waits. */
  busy: boolean;
  /** Why no sheet opened (a refused quote, in the Hub's own sentence). */
  said: Said | null;
  granted: StorePurchaseView | null;
  begin: (spec: WebBuySpec, title: string, grants?: object | null, verb?: string) => void;
  clear: () => void;
  sheets: ReactNode;
};

