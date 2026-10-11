import { useCallback, useLayoutEffect, useRef, type RefObject } from 'react';
import { Platform, type TextInput } from 'react-native';

import { caretAfter, countSignificant } from './model';

/** What a browser's text box lets the caret be read and set through. */
type CaretNode = { selectionStart?: number | null; setSelectionRange?: (start: number, end: number) => void };

/**
 * Keeps the caret after the key the person just typed when a box redraws its words (R2-2: "123,456" with a key typed after
 * the 1 gave "17,..." and then sent the caret to the end, so the next key landed there). The browser puts the caret at the end
 * of a text box whose value is replaced; this notes how many digits and points were before the caret when the key was typed
 * and, once the box has its new words, puts the caret after that many. Browsers only: a phone's keyboard is NOT RUN here and
 * is left as it was. `ref` is the text box's; the returned function is called with every change, before the new text is
 * stored.
 */
export function useKeepCaret(ref: RefObject<TextInput | null>, words: string, enabled: boolean): (typed: string) => void {
  const before = useRef<number | null>(null);
  const keep = enabled && Platform.OS === 'web';

  const onTyped = useCallback(
    (typed: string) => {
      if (!keep) return;
      const at = (ref.current as unknown as CaretNode | null)?.selectionStart;
      before.current = typeof at === 'number' ? countSignificant(typed.slice(0, at)) : null;
    },
    [keep, ref],
  );

  useLayoutEffect(() => {
    const count = before.current;
    before.current = null;
    if (!keep || count === null) return;
    const node = ref.current as unknown as CaretNode | null;
    if (typeof node?.setSelectionRange !== 'function') return;
    const to = caretAfter(words, count);
    node.setSelectionRange(to, to);
  }, [words, keep, ref]);

  return onTyped;
}
