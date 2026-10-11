import * as rtl from '@testing-library/react-native';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { Platform, type TextInput } from 'react-native';

import { useKeepCaret } from '../useKeepCaret';

/**
 * The caret stays after the key just typed when the amount box redraws its commas (BILLS-01 round 3, R2-2). The browser is the
 * only place this runs; the text box here is a stand-in with the two things the hook uses from a browser's.
 */

type FakeNode = { selectionStart?: number | null; setSelectionRange?: jest.Mock };
let typedHandle: ((typed: string) => void) | null = null;
const giveHandle = (handle: (typed: string) => void) => {
  typedHandle = handle;
};

function Harness({ words, enabled = true, node }: { words: string; enabled?: boolean; node: FakeNode | null }) {
  const ref = useRef<TextInput | null>(null);
  // Set before the hook's own layout effect runs (effects run in the order they are written).
  useLayoutEffect(() => {
    ref.current = node as unknown as TextInput | null;
  }, [node]);
  const onTyped = useKeepCaret(ref, words, enabled);
  useEffect(() => giveHandle(onTyped), [onTyped]);
  return null;
}

function node(selectionStart: number | null | undefined): FakeNode {
  return { selectionStart, setSelectionRange: jest.fn() };
}

const type = (typed: string) =>
  rtl.act(async () => {
    typedHandle!(typed);
  });

describe('useKeepCaret', () => {
  let platform: jest.ReplaceProperty<typeof Platform.OS>;
  beforeEach(() => {
    platform = jest.replaceProperty(Platform, 'OS', 'web');
  });
  afterEach(() => {
    platform.restore();
    typedHandle = null;
  });

  it('puts the caret after the key typed once the box has its new words: 123,456 with a 7 after the 1', async () => {
    const box = node(2);
    const view = await rtl.render(<Harness words="123,456" node={box} />);
    await type('17,23,456');
    await view.rerender(<Harness words="1,723,456" node={box} />);
    expect(box.setSelectionRange).toHaveBeenCalledTimes(1);
    expect(box.setSelectionRange).toHaveBeenCalledWith(3, 3);
  });

  it('does it for the next key too: an 8 after the 7 leaves the caret after the 8', async () => {
    const box = node(2);
    const view = await rtl.render(<Harness words="123,456" node={box} />);
    await type('17,23,456');
    await view.rerender(<Harness words="1,723,456" node={box} />);
    box.selectionStart = 4;
    await type('1,78' + '23,456');
    await view.rerender(<Harness words="17,823,456" node={box} />);
    expect(box.setSelectionRange).toHaveBeenLastCalledWith(4, 4);
    expect(box.setSelectionRange).toHaveBeenCalledTimes(2);
  });

  it('puts the caret at the start for a key typed before everything, and at the end for a key at the end', async () => {
    const start = node(0);
    const view = await rtl.render(<Harness words="1,234" node={start} />);
    await type('01,234');
    await view.rerender(<Harness words="1,234" node={start} />);
    // The words did not change, so nothing is redrawn and the caret is not moved.
    expect(start.setSelectionRange).not.toHaveBeenCalled();
    await type('01,2345');
    await view.rerender(<Harness words="12,345" node={start} />);
    expect(start.setSelectionRange).toHaveBeenCalledWith(0, 0);
    const end = node(7);
    const second = await rtl.render(<Harness words="1,234" node={end} />);
    await type('1,2345');
    await second.rerender(<Harness words="12,345" node={end} />);
    expect(end.setSelectionRange).toHaveBeenCalledWith(6, 6);
  });

  it('moves the caret once for a key, not again on a later draw of the same words', async () => {
    const box = node(2);
    const view = await rtl.render(<Harness words="123,456" node={box} />);
    await type('17,23,456');
    await view.rerender(<Harness words="1,723,456" node={box} />);
    await view.rerender(<Harness words="1,723,456" node={box} />);
    expect(box.setSelectionRange).toHaveBeenCalledTimes(1);
  });

  it('does nothing when the box does not keep the caret', async () => {
    const box = node(2);
    const view = await rtl.render(<Harness words="123,456" node={box} enabled={false} />);
    await type('17,23,456');
    await view.rerender(<Harness words="1,723,456" node={box} enabled={false} />);
    expect(box.setSelectionRange).not.toHaveBeenCalled();
  });

  it('does nothing on a phone: only the browser is handled here', async () => {
    platform.restore();
    platform = jest.replaceProperty(Platform, 'OS', 'ios');
    const box = node(2);
    const view = await rtl.render(<Harness words="123,456" node={box} />);
    await type('17,23,456');
    await view.rerender(<Harness words="1,723,456" node={box} />);
    expect(box.setSelectionRange).not.toHaveBeenCalled();
  });

  it('leaves the caret alone when the box cannot say where it was, and when there is no box to set it on', async () => {
    const unknown = node(undefined);
    const view = await rtl.render(<Harness words="123,456" node={unknown} />);
    await type('17,23,456');
    await view.rerender(<Harness words="1,723,456" node={unknown} />);
    expect(unknown.setSelectionRange).not.toHaveBeenCalled();
    const nothing = node(2);
    delete nothing.setSelectionRange;
    await view.rerender(<Harness words="123,456" node={nothing} />);
    await type('17,23,456');
    await view.rerender(<Harness words="1,723,456" node={nothing} />);
    await view.rerender(<Harness words="1,723,456" node={null} />);
    await type('1');
    await view.rerender(<Harness words="1" node={null} />);
  });
});
