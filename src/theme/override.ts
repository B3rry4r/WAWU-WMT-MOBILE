import { useSyncExternalStore } from 'react';

/**
 * The theme a person picked in Settings (Z2): `light` or `dark` pins the app, `system` (or nothing) follows the phone.
 * Kept in memory here and set by `applyTheme` (`features/settings/devicePrefs.ts`) when the saved choice is read at launch and
 * whenever Theme changes, so every screen draws the pick at once, on the phone and in the browser build, where
 * `Appearance.setColorScheme` cannot pin a scheme (SWEEP-FLOWS B7).
 */
export type ThemePick = 'system' | 'light' | 'dark';

let pick: ThemePick = 'system';
const listeners = new Set<() => void>();

export function setThemePick(next: ThemePick): void {
  if (next === pick) return;
  pick = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** The pick for a component: re-draws it when Theme changes. */
export function useThemePick(): ThemePick {
  return useSyncExternalStore(subscribe, () => pick, () => pick);
}

/** Whether the app is dark, given what the phone says (`light`, `dark` or nothing): a pin wins, System follows the phone. Unknown is dark (the design's default). */
export function isDarkFor(system: string | null | undefined, chosen: ThemePick): boolean {
  if (chosen === 'dark') return true;
  if (chosen === 'light') return false;
  return system !== 'light';
}
