import { createContext, useCallback, useContext, useEffect, useRef, type Ref } from 'react';
import { Platform, ScrollView, TextInput, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent, type ScrollViewProps } from 'react-native';

import { useKeyboardLift } from '@/features/feedpay/useKeyboardLift';
import { space } from '@/theme';

/** Room kept above and below the field that is brought into view, so its label and its error line show with it. */
const ROOM = space.xl;

/** A field tells the scroll it sits in that it has the focus (`TextField` does), so a second field is brought into view while the keyboard stays up. */
export const FieldFocusContext = createContext<(() => void) | null>(null);

/** What a field calls from its focus: the nearest `FieldScroll` looks again. Outside one it does nothing. */
export function useAnnounceFocus(): () => void {
  const announce = useContext(FieldFocusContext);
  return announce ?? noop;
}
const noop = () => undefined;

/**
 * R-117 · the bottom padding of a pinned foot (a Continue button under a form): the phone's bottom inset, or, while the keyboard is up
 * (it covers that inset), a plain gap, so the button sits right on the keyboard and not a hand's width above it.
 */
export function useFootBottom(resting: number, whileTyping: number = space.md): number {
  return useKeyboardLift() > 0 ? whileTyping : resting;
}

export type FieldScrollProps = Omit<ScrollViewProps, 'ref'> & { ref?: Ref<ScrollView> };

/**
 * A ScrollView that keeps the field being typed in on screen (R-117 part B, owner: "my keyboard sits upon it"). The frame around it is
 * padded by the keyboard (`KeyboardAvoidingView`, 'padding', both phones), which shortens this scroll; a ScrollView does not move a focused
 * field into the room that is left, so this one does: whenever its own height changes (the keyboard came up or went) and whenever a field in
 * it takes the focus, it finds the focused input, measures it against its content and scrolls the least that brings it, with `ROOM` around
 * it, inside what is visible. A field already in view does not move the page. The web needs none of this (the browser does it).
 */
export function FieldScroll({ ref, onScroll, onLayout, scrollEventThrottle, children, ...rest }: FieldScrollProps) {
  const scroll = useRef<ScrollView | null>(null);
  const offset = useRef(0);
  const height = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const keep = useCallback(() => {
    if (Platform.OS === 'web') return;
    const view = scroll.current;
    const inner = view?.getInnerViewNode();
    if (!view || !inner || height.current <= 0) return;
    let field: ReturnType<typeof TextInput.State.currentlyFocusedInput> | null = null;
    try {
      field = TextInput.State.currentlyFocusedInput();
    } catch {
      field = null;
    }
    if (!field) return;
    try {
      field.measureLayout(
        inner,
        (_x, y, _width, tall) => {
          const top = y - ROOM;
          const bottom = y + tall + ROOM;
          const shown = height.current;
          const at = offset.current;
          // Below what is visible: bring the field's foot up to the foot of the scroll (a field taller than the scroll shows its top).
          if (bottom > at + shown) view.scrollTo({ y: Math.max(0, Math.min(bottom - shown, top)), animated: true });
          // Above it: bring its head down.
          else if (top < at) view.scrollTo({ y: Math.max(0, top), animated: true });
        },
        () => undefined,
      );
    } catch {
      // A field the phone cannot measure stays where it is.
    }
  }, []);

  // A look a moment later, so the field's own focus (and the page's layout after it) has settled.
  const soon = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      keep();
    }, 0);
  }, [keep]);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const take = (node: ScrollView | null) => {
    scroll.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) (ref as { current: ScrollView | null }).current = node;
  };

  return (
    <FieldFocusContext.Provider value={soon}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        {...rest}
        ref={take}
        scrollEventThrottle={scrollEventThrottle ?? 32}
        onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
          offset.current = e.nativeEvent.contentOffset.y;
          onScroll?.(e);
        }}
        onLayout={(e: LayoutChangeEvent) => {
          const changed = height.current !== e.nativeEvent.layout.height;
          height.current = e.nativeEvent.layout.height;
          onLayout?.(e);
          if (changed) soon();
        }}
      >
        {children}
      </ScrollView>
    </FieldFocusContext.Provider>
  );
}
