import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

/**
 * How far a sheet that holds a text field rises for the phone's keyboard. `BottomSheet` is a modal on iOS, which the keyboard
 * covers instead of pushing up, so the sheet adds this much room under its last row. Android resizes the window itself and the
 * web has no keyboard, so there it is 0.
 */
export function useKeyboardLift(): number {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    if (Platform.OS !== 'ios') return undefined;
    const show = Keyboard.addListener('keyboardWillShow', (e) => setHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener('keyboardWillHide', () => setHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return height;
}
