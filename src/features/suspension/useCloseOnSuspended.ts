import { useEffect } from 'react';

import { onSuspendedRefusal } from '@/api/suspension';

/**
 * USER-SUSPEND (R-121). A sheet is a React Native `Modal`, and on a phone a Modal sits above every screen, so the calm
 * `/suspended` screen the root layout pushes when the Hub refuses a write would open hidden beneath it (a picture of the web
 * export showed the comments sheet over it, 31 Oct). While a sheet is open, a refusal closes it so the screen shows and Back
 * returns to the page the sheet was on. Nothing is written or undone: the sheet is only put away, and what it held is gone with it,
 * as it is when it is dismissed.
 */
export function useCloseOnSuspended(open: boolean, close: () => void): void {
  useEffect(() => {
    if (!open) return;
    return onSuspendedRefusal(() => close());
  }, [open, close]);
}
