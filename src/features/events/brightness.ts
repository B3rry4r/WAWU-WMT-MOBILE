/**
 * "Brightness goes up when this opens" (E7). The phone's screen brightness is `expo-brightness`, which is in
 * SHARED-CHANGES.md row 8 (one batch of native modules and one new development build) and is not installed yet.
 * Until it is, the app does not promise what it cannot do: the ticket screen draws the note only when this is
 * true. When row 8 is applied, `boostBrightness` becomes `Brightness.setBrightnessAsync(1)` with the old value
 * restored by the function it returns, and `canBoostBrightness` becomes true (EVENTS-03 #1 in SHARED-CHANGES.md).
 */
export const canBoostBrightness = false;

/** Raises the screen to full brightness and returns the call that puts it back. */
export function boostBrightness(): () => void {
  return () => undefined;
}
