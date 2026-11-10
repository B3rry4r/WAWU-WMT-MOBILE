import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

/**
 * How far a sheet that holds a text field rises for the phone's keyboard. `BottomSheet` is a modal, which the keyboard covers instead of
 * pushing up, so the sheet adds this much room under its last row. The iPhone says it before the keyboard opens (`keyboardWillShow`).
 * Android 15 and SDK 57 draw the app edge to edge, so the phone no longer resizes the window for the keyboard (R-117, part B; the sheets
 * on Android sat under the keyboard): it says it once the keyboard is up (`keyboardDidShow`) and the sheet rises then. The web has no
 * keyboard events (the browser shrinks the viewport), so there it is 0.
 */
export function useKeyboardLift(): number {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') return undefined;
    const ios = Platform.OS === 'ios';
    const show = Keyboard.addListener(ios ? 'keyboardWillShow' : 'keyboardDidShow', (e) => setHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener(ios ? 'keyboardWillHide' : 'keyboardDidHide', () => setHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return height;
}
