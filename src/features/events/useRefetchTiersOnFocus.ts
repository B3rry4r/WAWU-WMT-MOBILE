import { ticketsKey } from './api';
import { useRefetchOnFocus } from './useRefetchOnFocus';

/** E2 asks for the tiers again when the screen is shown again after being left. */
export function useRefetchTiersOnFocus(id: string): void {
  useRefetchOnFocus(ticketsKey(id));
}
