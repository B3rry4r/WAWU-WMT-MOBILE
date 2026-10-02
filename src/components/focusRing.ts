import { useState } from 'react';
import { Platform, type NativeSyntheticEvent, type TargetedEvent, type ViewStyle } from 'react-native';

import { useWawu } from '@/theme';

/**
 * The keyboard focus ring: a page-coloured gap, then the accent ring outside it.
 * The gap is what keeps the ring visible against a filled accent button, where
 * the accent ring alone is the same colour as the button in light mode.
 */
export const focusRingWidth = 1.5;
export const focusRingGap = 2;

/** The browser draws its own outline on a focused element; the designed ring replaces it. */
export const browserOutlineOff = { outlineStyle: 'none', outlineWidth: 0 } as object;

/**
 * On the web a click also focuses the element, but the ring is for the keyboard:
 * only `:focus-visible` shows it. Native focus only comes from a keyboard or
 * switch device, so it always shows.
 */
export function showsFocusRing(e: NativeSyntheticEvent<TargetedEvent>): boolean {
  if (Platform.OS !== 'web') return true;
  const target = e.target as unknown as { matches?: (selector: string) => boolean } | undefined;
  return typeof target?.matches === 'function' ? target.matches(':focus-visible') : true;
}

/** Spread `handlers` and `style` on a Pressable; the ring shows only while the keyboard has it, and a web browser's own outline never does. */
export function useFocusRing() {
  const { colors } = useWawu();
  const [focused, setFocused] = useState(false);
  const style: ViewStyle[] = [];
  if (Platform.OS === 'web') style.push(browserOutlineOff as ViewStyle);
  if (focused) {
    style.push({ boxShadow: `0 0 0 ${focusRingGap}px ${colors.surfacePage}, 0 0 0 ${focusRingGap + focusRingWidth}px ${colors.accentFg}` });
  }
  return {
    focused,
    style,
    handlers: {
      onFocus: (e: NativeSyntheticEvent<TargetedEvent>) => setFocused(showsFocusRing(e)),
      onBlur: () => setFocused(false),
    },
  };
}
