import * as Brightness from 'expo-brightness';
import { Platform } from 'react-native';

/**
 * "Brightness goes up when this opens" (E7). `expo-brightness` is in the app's native modules (SHARED-CHANGES row 8, EVENTS-03 #1), so
 * the promise can be kept on a phone: the screen goes to full brightness while a valid ticket is open, so a door scanner can read it,
 * and goes back when it closes. Only the app's own window is changed: no system permission is asked. The module does nothing on the web,
 * so there the note is not drawn (the screen draws it only when this is true).
 */
export const canBoostBrightness = Platform.OS === 'ios' || Platform.OS === 'android';

/**
 * Raises the screen to full brightness and returns the call that puts it back. A phone that cannot change its brightness, or a call
 * that fails, leaves the screen as it was: the ticket still shows and nothing is said about it. Closing before the raise lands puts
 * it back as soon as it does, once.
 */
export function boostBrightness(): () => void {
  let before: number | null = null;
  let applied = false;
  let closed = false;

  const putBack = () => {
    // Android: the activity stops overriding the system's own value. iOS: the value the person had is written back.
    const undo = Platform.OS === 'android' ? Brightness.restoreSystemBrightnessAsync() : before === null ? Promise.resolve() : Brightness.setBrightnessAsync(before);
    void undo.catch(() => undefined);
  };

  void (async () => {
    try {
      if (!(await Brightness.isAvailableAsync())) return;
      const was = await Brightness.getBrightnessAsync();
      if (closed) return;
      before = was;
      await Brightness.setBrightnessAsync(1);
      applied = true;
      if (closed) putBack();
    } catch {
      // The screen stays as it was.
    }
  })();

  return () => {
    if (closed) return;
    closed = true;
    if (applied) putBack();
  };
}
