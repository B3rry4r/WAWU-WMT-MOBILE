import { useRef, type RefObject } from 'react';
import { ScrollView, View } from 'react-native';

import { TextField, type TextFieldProps } from '@/components/TextField';
import { space } from '@/theme';

/** Room left above a field that is scrolled into view, so its label shows with it. */
const FOCUS_MARGIN = space.xl;

export type AuthFieldProps = TextFieldProps & {
  /** The form's ScrollView (give the same one to `AuthFrame`). */
  scrollRef: RefObject<ScrollView | null>;
};

/**
 * A TextField that keeps itself on screen. The keyboard shortens the form's
 * scrolling area and the ScrollView does not move a focused field into the
 * space that is left, so the field scrolls the form to itself when it takes
 * focus. It is measured then, not earlier: the browser reports a layout only
 * when a size changes, so a banner appearing above would leave an earlier
 * reading stale.
 */
export function AuthField({ scrollRef, onFocus, ...field }: AuthFieldProps) {
  const spot = useRef<View>(null);
  return (
    <View ref={spot}>
      <TextField
        {...field}
        onFocus={(event) => {
          onFocus?.(event);
          scrollToSpot(scrollRef, spot);
        }}
      />
    </View>
  );
}

/**
 * Scrolls the form so the View in `spot` is on screen with room above it. Called from a field's focus: `AuthField` does it for
 * itself, and the phone field (a shared component `AuthField` cannot wrap) is given the same call by the form that holds it.
 */
export function scrollToSpot(scrollRef: RefObject<ScrollView | null>, spot: RefObject<View | null>): void {
  const inner = scrollRef.current?.getInnerViewNode();
  if (!spot.current || !inner) return;
  spot.current.measureLayout(
    inner,
    (_x, y) => scrollRef.current?.scrollTo({ y: Math.max(0, y - FOCUS_MARGIN), animated: false }),
    () => undefined,
  );
}
