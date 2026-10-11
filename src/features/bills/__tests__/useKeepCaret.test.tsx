import * as rtl from '@testing-library/react-native';
import { act, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Platform, type TextInput } from 'react-native';

import { useKeepCaret, type KeepCaret } from '../useKeepCaret';

/**
 * The caret stays where the person is working when the amount box redraws its commas (BILLS-01 round 3, R2-2; round 4, R3-3
 * and M20). The browser is the only place this runs; the text box here is a stand-in with the things the hook uses from a
 * browser's: where the caret is, and setting it.
 *
 * A key is played the way a browser delivers it: the key goes down with the caret where it is, the browser changes the text
 * and moves the caret, and the screen stores its new words, all in one go (React draws at the end of the event, the layout
 * effect puts the caret, and only after that does the next microtask run). React's own `act` with a function that is not
 * async does that, so the order here is the order in the browser.
 */

type FakeNode = { selectionStart?: number | null; selectionEnd?: number | null; setSelectionRange?: jest.Mock };
type Handle = KeepCaret & { setWords: (words: string) => void };
let handle: Handle | null = null;

function Harness({ start, enabled = true, node }: { start: string; enabled?: boolean; node: FakeNode | null }) {
  const [words, setWords] = useState(start);
  const ref = useRef<TextInput | null>(null);
  // Set before the hook's own layout effect runs (effects run in the order they are written).
  useLayoutEffect(() => {
    ref.current = node as unknown as TextInput | null;
  }, [node]);
  const caret = useKeepCaret(ref, words, enabled);
  useEffect(() => {
    handle = { ...caret, setWords };
  }, [caret]);
  return null;
}

function node(selectionStart: number | null | undefined, selectionEnd = selectionStart): FakeNode {
  return { selectionStart, selectionEnd, setSelectionRange: jest.fn() };
}

type Key = {
  /** The caret (or selected stretch) when the key went down; omitted for a change that came with no key down (a menu paste). */
  from?: [number, number];
  /** What the browser put in the box. */
  typed: string;
  /** Where the browser put the caret; null when the box cannot say. */
  at: number | null;
  /** What the screen stores as the box's words afterwards. */
  words: string;
};

/** One change, as the browser delivers it, then the microtasks that follow the event. */
async function change(box: FakeNode, { from, typed, at, words }: Key) {
  act(() => {
    if (from) {
      box.selectionStart = from[0];
      box.selectionEnd = from[1];
      handle!.onKeyPress?.();
    }
    box.selectionStart = at;
    box.selectionEnd = at;
    if (at === null) {
      box.selectionStart = undefined;
      box.selectionEnd = undefined;
    }
    handle!.onTyped(typed);
    handle!.setWords(words);
  });
  await rtl.act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

/** The words change with no key: a quick amount tapped. */
const tap = (words: string) =>
  rtl.act(async () => {
    handle!.setWords(words);
  });

describe('useKeepCaret', () => {
  let platform: jest.ReplaceProperty<typeof Platform.OS>;
  beforeEach(() => {
    platform = jest.replaceProperty(Platform, 'OS', 'web');
  });
  afterEach(() => {
    platform.restore();
    handle = null;
  });

  describe('a key the box takes: the caret goes after the key just typed (R2-2)', () => {
    it('123,456 with a 7 after the 1 leaves the caret after the 7', async () => {
      const box = node(1);
      await rtl.render(<Harness start="123,456" node={box} />);
      await change(box, { from: [1, 1], typed: '17,23,456', at: 2, words: '1,723,456' });
      expect(box.setSelectionRange).toHaveBeenCalledTimes(1);
      expect(box.setSelectionRange).toHaveBeenCalledWith(3, 3);
    });

    it('does it for the next key too: an 8 after the 7 leaves the caret after the 8', async () => {
      const box = node(1);
      await rtl.render(<Harness start="123,456" node={box} />);
      await change(box, { from: [1, 1], typed: '17,23,456', at: 2, words: '1,723,456' });
      await change(box, { from: [3, 3], typed: '1,78' + '23,456', at: 4, words: '17,823,456' });
      expect(box.setSelectionRange).toHaveBeenLastCalledWith(4, 4);
      expect(box.setSelectionRange).toHaveBeenCalledTimes(2);
    });

    it('puts the caret after a key typed before everything', async () => {
      const box = node(0);
      await rtl.render(<Harness start="1,234" node={box} />);
      await change(box, { from: [0, 0], typed: '91,234', at: 1, words: '91,234' });
      expect(box.setSelectionRange).toHaveBeenCalledWith(1, 1);
    });

    it('puts the caret after a key typed at the end', async () => {
      const box = node(5);
      await rtl.render(<Harness start="1,234" node={box} />);
      await change(box, { from: [5, 5], typed: '1,2345', at: 6, words: '12,345' });
      expect(box.setSelectionRange).toHaveBeenCalledWith(6, 6);
    });

    it('moves the caret once for a key, not again on a later draw of the same words', async () => {
      const box = node(1);
      const view = await rtl.render(<Harness start="123,456" node={box} />);
      await change(box, { from: [1, 1], typed: '17,23,456', at: 2, words: '1,723,456' });
      await view.rerender(<Harness start="123,456" node={box} />);
      await tap('1,723,456');
      expect(box.setSelectionRange).toHaveBeenCalledTimes(1);
    });

    it('does not set the caret a second time once the event is over: the microtask finds the note used', async () => {
      const box = node(1);
      await rtl.render(<Harness start="123,456" node={box} />);
      await change(box, { from: [1, 1], typed: '17,23,456', at: 2, words: '1,723,456' });
      await rtl.act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 20));
      });
      expect(box.setSelectionRange).toHaveBeenCalledTimes(1);
    });
  });

  describe('a note is used once and cleared (M20)', () => {
    it('a later change of the words that no key made (a quick amount tapped) does not move the caret', async () => {
      const box = node(1);
      await rtl.render(<Harness start="123,456" node={box} />);
      await change(box, { from: [1, 1], typed: '17,23,456', at: 2, words: '1,723,456' });
      expect(box.setSelectionRange).toHaveBeenCalledTimes(1);
      await tap('5,000');
      await tap('20,000');
      expect(box.setSelectionRange).toHaveBeenCalledTimes(1);
    });

    it('a second draw straight after the key, before anything else runs, does not use the note again', async () => {
      const box = node(1);
      await rtl.render(<Harness start="123,456" node={box} />);
      act(() => {
        box.selectionStart = 1;
        box.selectionEnd = 1;
        handle!.onKeyPress?.();
        box.selectionStart = 2;
        box.selectionEnd = 2;
        handle!.onTyped('17,23,456');
        handle!.setWords('1,723,456');
      });
      // The screen draws once more in the same event (its own state moved the words again).
      act(() => {
        handle!.setWords('17,234,56');
      });
      await rtl.act(async () => {
        await Promise.resolve();
      });
      expect(box.setSelectionRange).toHaveBeenCalledTimes(1);
    });

    it('a note left by a key that changed nothing is cleared too: a quick amount tapped after it moves nothing', async () => {
      const box = node(1);
      await rtl.render(<Harness start="12" node={box} />);
      await change(box, { from: [0, 0], typed: 'x12', at: 1, words: '12' });
      expect(box.setSelectionRange).toHaveBeenCalledTimes(1);
      await tap('5,000');
      expect(box.setSelectionRange).toHaveBeenCalledTimes(1);
    });

    it('the caret noted at a key down is used for that key only', async () => {
      const box = node(0);
      await rtl.render(<Harness start="12" node={box} />);
      await change(box, { from: [0, 0], typed: 'x12', at: 1, words: '12' });
      // The next change comes with no key down (a menu paste at the end): placed from the change, not from the old note.
      await change(box, { typed: '12abc', at: 5, words: '12' });
      expect(box.setSelectionRange).toHaveBeenLastCalledWith(2, 2);
    });
  });

  describe('a key the box refuses or does nothing with: the caret stays where it was (R3-3)', () => {
    it('a letter typed at the start of 12 leaves the caret at the start', async () => {
      const box = node(0);
      await rtl.render(<Harness start="12" node={box} />);
      await change(box, { from: [0, 0], typed: 'x12', at: 1, words: '12' });
      expect(box.setSelectionRange).toHaveBeenCalledTimes(1);
      expect(box.setSelectionRange).toHaveBeenCalledWith(0, 0);
    });

    it('a second point typed at the start of 1.5 leaves the caret at the start', async () => {
      const box = node(0);
      await rtl.render(<Harness start="1.5" node={box} />);
      await change(box, { from: [0, 0], typed: '.1.5', at: 1, words: '1.5' });
      expect(box.setSelectionRange).toHaveBeenCalledWith(0, 0);
    });

    it('a letter typed in the middle of 1,234 leaves the caret in the middle', async () => {
      const box = node(3);
      await rtl.render(<Harness start="1,234" node={box} />);
      await change(box, { from: [3, 3], typed: '1,2x34', at: 4, words: '1,234' });
      expect(box.setSelectionRange).toHaveBeenCalledWith(3, 3);
    });

    it('a Backspace after the comma of 1,234, which the box draws again, leaves the caret after the comma', async () => {
      const box = node(2);
      await rtl.render(<Harness start="1,234" node={box} />);
      await change(box, { from: [2, 2], typed: '1234', at: 1, words: '1,234' });
      expect(box.setSelectionRange).toHaveBeenCalledTimes(1);
      expect(box.setSelectionRange).toHaveBeenCalledWith(2, 2);
    });

    it('a Delete before the comma of 1,234 leaves the caret before the comma', async () => {
      const box = node(1);
      await rtl.render(<Harness start="1,234" node={box} />);
      await change(box, { from: [1, 1], typed: '1234', at: 1, words: '1,234' });
      expect(box.setSelectionRange).toHaveBeenCalledWith(1, 1);
    });

    it('a zero typed in front of 5, which the box drops, leaves the caret in front', async () => {
      const box = node(0);
      await rtl.render(<Harness start="5" node={box} />);
      await change(box, { from: [0, 0], typed: '05', at: 1, words: '5' });
      expect(box.setSelectionRange).toHaveBeenCalledWith(0, 0);
    });

    it('a paste the box will not take leaves the caret and the selected stretch as they were', async () => {
      const box = node(1);
      await rtl.render(<Harness start="1,234" node={box} />);
      await change(box, { from: [1, 4], typed: '1abc4', at: 4, words: '1,234' });
      expect(box.setSelectionRange).toHaveBeenCalledWith(1, 4);
    });

    it('places a change that came with no key down (a paste from a menu) from the change itself', async () => {
      const box = node(2);
      await rtl.render(<Harness start="1,234" node={box} />);
      // abc put in at 2: the caret is after it, at 5; before it the caret was at 2.
      await change(box, { typed: '1,abc234', at: 5, words: '1,234' });
      expect(box.setSelectionRange).toHaveBeenCalledWith(2, 2);
      // Something taken out and drawn again: the caret was after it.
      await change(box, { typed: '1234', at: 1, words: '1,234' });
      expect(box.setSelectionRange).toHaveBeenLastCalledWith(2, 2);
    });

    it('does not take the key down of a key that changed nothing for the next change: an arrow, then a paste from a menu', async () => {
      const box = node(2);
      await rtl.render(<Harness start="1,234" node={box} />);
      // The right arrow went down with the caret at 1 and changed nothing; the paste that follows has no key down.
      act(() => {
        box.selectionStart = 1;
        box.selectionEnd = 1;
        handle!.onKeyPress?.();
      });
      await change(box, { typed: '1,1e3234', at: 5, words: '1,234' });
      expect(box.setSelectionRange).toHaveBeenCalledTimes(1);
      expect(box.setSelectionRange).toHaveBeenCalledWith(2, 2);
    });

    it('does not take it for a selection either: a shift and an arrow, then something pasted over what they selected', async () => {
      const box = node(2);
      await rtl.render(<Harness start="1,234" node={box} />);
      act(() => {
        box.selectionStart = 4;
        box.selectionEnd = 5;
        handle!.onKeyPress?.();
      });
      await change(box, { typed: '1,2abc', at: 6, words: '1,234' });
      expect(box.setSelectionRange).toHaveBeenCalledWith(5, 5);
    });

    it('the key down noted for one key is not used for the next change when that has none of its own', async () => {
      const box = node(1);
      await rtl.render(<Harness start="1,234" node={box} />);
      // A Delete before the comma, which the box draws again: the caret stays before the comma.
      await change(box, { from: [1, 1], typed: '1234', at: 1, words: '1,234' });
      expect(box.setSelectionRange).toHaveBeenLastCalledWith(1, 1);
      // The same text taken out again with no key down (a cut from a menu): placed from the change, after the stretch.
      await change(box, { typed: '1234', at: 1, words: '1,234' });
      expect(box.setSelectionRange).toHaveBeenLastCalledWith(2, 2);
    });

    it.each([
      ['a Backspace', [2, 2], '1234', 1],
      ['a Delete', [1, 1], '1234', 1],
      ['a letter typed at the caret', [2, 2], '1,x234', 3],
      ['a letter typed over a selection', [1, 4], '1x4', 2],
      ['a cut', [1, 4], '14', 1],
      ['a paste over a selection', [1, 4], '1abc4', 4],
    ] as [string, [number, number], string, number][])(
      'puts the caret back after %s',
      async (_k, from, typed, at) => {
        const box = node(from[0], from[1]);
        await rtl.render(<Harness start="1,234" node={box} />);
        await change(box, { from, typed, at, words: '1,234' });
        expect(box.setSelectionRange).toHaveBeenCalledWith(from[0], from[1]);
      },
    );

    it('does not put the caret at all when the box cannot say where it is', async () => {
      const box = node(0);
      await rtl.render(<Harness start="12" node={box} />);
      await change(box, { typed: 'x12', at: null, words: '12' });
      expect(box.setSelectionRange).not.toHaveBeenCalled();
    });
  });

  it('hands the box a key down handler only when it keeps the caret in a browser', async () => {
    await rtl.render(<Harness start="1" node={node(0)} />);
    expect(handle!.onKeyPress).toEqual(expect.any(Function));
    await rtl.render(<Harness start="1" node={node(0)} enabled={false} />);
    expect(handle!.onKeyPress).toBeUndefined();
    platform.restore();
    platform = jest.replaceProperty(Platform, 'OS', 'ios');
    await rtl.render(<Harness start="1" node={node(0)} />);
    expect(handle!.onKeyPress).toBeUndefined();
  });

  it('does nothing when the box does not keep the caret', async () => {
    const box = node(1);
    await rtl.render(<Harness start="123,456" node={box} enabled={false} />);
    await change(box, { from: [1, 1], typed: '17,23,456', at: 2, words: '1,723,456' });
    await change(box, { from: [0, 0], typed: 'x1,723,456', at: 1, words: '1,723,456' });
    expect(box.setSelectionRange).not.toHaveBeenCalled();
  });

  it('does nothing on a phone: only the browser is handled here', async () => {
    platform.restore();
    platform = jest.replaceProperty(Platform, 'OS', 'ios');
    const box = node(1);
    await rtl.render(<Harness start="123,456" node={box} />);
    await change(box, { from: [1, 1], typed: '17,23,456', at: 2, words: '1,723,456' });
    await change(box, { from: [0, 0], typed: 'x1,723,456', at: 1, words: '1,723,456' });
    expect(box.setSelectionRange).not.toHaveBeenCalled();
  });

  it('leaves the caret alone for a taken key when the box cannot say where it was', async () => {
    const box = node(0);
    await rtl.render(<Harness start="123,456" node={box} />);
    await change(box, { typed: '17,23,456', at: null, words: '1,723,456' });
    expect(box.setSelectionRange).not.toHaveBeenCalled();
  });

  it('does nothing when the box cannot set the caret', async () => {
    const box = node(1);
    delete box.setSelectionRange;
    await rtl.render(<Harness start="123,456" node={box} />);
    await change(box, { from: [1, 1], typed: '17,23,456', at: 2, words: '1,723,456' });
    await change(box, { from: [0, 0], typed: 'x1,723,456', at: 1, words: '1,723,456' });
  });

  it('does nothing when there is no box to set it on', async () => {
    await rtl.render(<Harness start="1" node={null} />);
    await change(node(0), { from: [0, 0], typed: 'x1', at: 1, words: '1' });
  });
});
