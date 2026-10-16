import { useCallback, useLayoutEffect, useRef, type RefObject } from 'react';
import { Platform, type TextInput } from 'react-native';

import { caretAfter, countSignificant } from './model';

/** What a browser's text box lets the caret be read and set through. */
type CaretNode = {
  selectionStart?: number | null;
  selectionEnd?: number | null;
  setSelectionRange?: (start: number, end: number) => void;
};

/** Where the caret (or the selected stretch) stood, as places in the box's words. */
type Caret = { start: number; end: number };

const caretOf = (node: CaretNode | null): Caret | null => {
  const start = node?.selectionStart;
  const end = node?.selectionEnd;
  return typeof start === 'number' && typeof end === 'number' ? { start, end } : null;
};

/**
 * Whether a key down with the caret at `pre` can be the one that turned the box's `words` into `typed`: it put text in over
 * the stretch it selected (or at the caret), or it was a Delete that took the one character after the caret. (A Backspace needs
 * no key down: the caret was just after what it took out, which is what the change itself says.) A key down that changed
 * nothing (an arrow, a Shift) is left behind by the next change that has no key down of its own (a paste from a menu, a drop),
 * and is not that change's.
 */
function fits(words: string, typed: string, pre: Caret): boolean {
  const shapes: [from: number, to: number, takesText: boolean][] = [[pre.start, pre.end, true]];
  if (pre.start === pre.end) shapes.push([pre.start, pre.end + 1, false]);
  return shapes.some(
    ([from, to, takesText]) =>
      from >= 0 &&
      to <= words.length &&
      typed.startsWith(words.slice(0, from)) &&
      typed.endsWith(words.slice(to)) &&
      (takesText ? typed.length >= from + words.length - to : typed.length === from + words.length - to),
  );
}

export type KeepCaret = {
  /**
   * The box's `onKeyPress` (a browser's key down): notes where the caret stood before the key changed anything. It is
   * `undefined` when the box keeps no caret or this is not a browser, so a phone's box is handed no handler it has no use for.
   */
  onKeyPress: (() => void) | undefined;
  /** Called with every change, before the new text is stored. */
  onTyped: (typed: string) => void;
};

/**
 * Keeps the caret where the person is working when a box redraws its words (the amount's commas). The browser puts the caret
 * at the end of a text box whose value is replaced; so, in a browser only (a phone's keyboard is NOT RUN here and is left as
 * it was):
 * - a key the box takes (R2-2: "123,456" with a key typed after the 1 gave "17,..." and then sent the caret to the end):
 *   `onTyped` notes how many digits and points were before the caret, and once the box has its new words the caret is put
 *   after that many;
 * - a key the box refuses or does nothing with (R3-3: a letter, a second point, a comma deleted that the box draws again, a
 *   paste it will not take): the words do not change, nothing is drawn again, and the browser still puts the caret at the end.
 *   Once the event is over and no new words came, the caret is put back where it stood before the key: `onKeyPress` notes it
 *   at the key down, and a change that came with no key down of its own (a paste from a menu, a drop) is placed from the
 *   change itself.
 * Each note is used once and cleared (M20): a later change of the words that no key made (a quick amount tapped) never
 * moves the caret from an old note.
 */
export function useKeepCaret(ref: RefObject<TextInput | null>, words: string, enabled: boolean): KeepCaret {
  /** Digits and points before the caret after the key; set by `onTyped`, taken by the layout effect. */
  const before = useRef<number | null>(null);
  /** Where the caret stood before the key, used only when no new words came. */
  const stay = useRef<Caret | null>(null);
  /** The caret at the last key down. */
  const keyDown = useRef<Caret | null>(null);
  const keep = enabled && Platform.OS === 'web';

  const onKeyPress = useCallback(() => {
    if (!keep) return;
    keyDown.current = caretOf(ref.current as unknown as CaretNode | null);
  }, [keep, ref]);

  const onTyped = useCallback(
    (typed: string) => {
      if (!keep) return;
      const now = caretOf(ref.current as unknown as CaretNode | null);
      before.current = now === null ? null : countSignificant(typed.slice(0, now.start));
      // Without a key down that fits the change, the caret was where the change began: after the text taken out, before the
      // text put in.
      const guess = now === null ? null : Math.min(Math.max(now.start + words.length - typed.length, 0), words.length);
      const down = keyDown.current;
      keyDown.current = null;
      stay.current = down !== null && fits(words, typed, down) ? down : guess === null ? null : { start: guess, end: guess };
      // React draws the new words (and the layout effect below takes the note) before this runs, when there are some.
      void Promise.resolve().then(() => {
        const unchanged = before.current !== null ? stay.current : null;
        before.current = null;
        stay.current = null;
        const node = ref.current as unknown as CaretNode | null;
        if (unchanged === null || typeof node?.setSelectionRange !== 'function') return;
        node.setSelectionRange(unchanged.start, unchanged.end);
      });
    },
    [keep, ref, words],
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

  return { onKeyPress: keep ? onKeyPress : undefined, onTyped };
}
