import type { Href } from 'expo-router';

/**
 * Where A11 (Set up your account) returns to when it was opened from a screen that needed a creator account (SERVICES-FEEDBACK 3).
 * The link carries a name from this list, never a path: a name that is not here is ignored, so a link can only come back to a screen the
 * app chose.
 */
export const SETUP_RETURNS = { 'professional-apply': '/professional-apply' } as const satisfies Record<string, Href>;

export type SetupReturnName = keyof typeof SETUP_RETURNS;

/** The screen a `next` value names, or null for no value or one this list does not hold. */
export function setupReturnOf(value: unknown): (typeof SETUP_RETURNS)[SetupReturnName] | null {
  return typeof value === 'string' && Object.hasOwn(SETUP_RETURNS, value) ? SETUP_RETURNS[value as SetupReturnName] : null;
}
