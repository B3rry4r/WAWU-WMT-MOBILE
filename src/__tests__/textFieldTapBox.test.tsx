import * as rtl from '@testing-library/react-native';
import { createRef } from 'react';
import { Platform, StyleSheet, type TextInput } from 'react-native';

import { TextField } from '@/components/TextField';

/**
 * SWEEP-APP-6b (SHARED-06 L2, SWEEP-APP-3 N1): P5's old multiline input had `minHeight: 52`, so the whole 80 box took a tap. The shared input
 * is content high, so a tap in the box below the first line has to reach the input some other way: the box is a press target that
 * focuses it. The box is not a second control for a screen reader (the input stays the one field), and nothing about the box's size changes.
 */

const flat = (id: string) => StyleSheet.flatten(rtl.screen.getByTestId(id).props.style) ?? {};

async function show(over: Partial<React.ComponentProps<typeof TextField>> = {}) {
  const ref = createRef<TextInput>();
  await rtl.render(<TextField testID="bio" label="Bio" multiline inputRef={ref} value="" onChangeText={() => undefined} {...over} />);
  // The jest TextInput shares one `focus` mock between its instances, so count from here.
  const focus = jest.spyOn(ref.current as TextInput, 'focus');
  focus.mockClear();
  return { ref, focus };
}

describe('SHARED-06 L2: a tap anywhere in a multiline field\'s box focuses its input', () => {
  it('a press on the box (below the first line, not on the input) focuses the input', async () => {
    const { focus } = await show();
    await rtl.userEvent.press(rtl.screen.getByTestId('bio-box'));
    expect(focus).toHaveBeenCalledTimes(1);
  });

  it('a press on the input itself still reaches it and focuses nothing twice', async () => {
    const { focus } = await show();
    await rtl.userEvent.press(rtl.screen.getByTestId('bio'));
    expect(focus.mock.calls.length).toBeLessThanOrEqual(1);
  });

  it('a disabled field takes no press on its box', async () => {
    const { focus } = await show({ disabled: true });
    await rtl.userEvent.press(rtl.screen.getByTestId('bio-box'));
    expect(focus).not.toHaveBeenCalled();
  });

  it('the input stays the one field: the box is no control of its own for a screen reader or the keyboard', async () => {
    await show({ hint: 'A few words about you' });
    const box = rtl.screen.getByTestId('bio-box').props;
    expect(box.accessible).toBe(false);
    expect(box.focusable).toBe(false);
    expect(box.tabIndex).toBe(-1);
    expect(box.accessibilityRole).toBeUndefined();
    expect(box.accessibilityLabel).toBeUndefined();
    expect(rtl.screen.queryAllByRole('button')).toHaveLength(0);
    expect(rtl.screen.getAllByLabelText('Bio')).toHaveLength(1);
    expect(rtl.screen.getByLabelText('Bio').props.accessibilityHint).toBe('A few words about you');
  });

  it('a single-line field is left as it was: its box takes no press', async () => {
    await rtl.render(<TextField testID="name" label="Name" value="" onChangeText={() => undefined} />);
    expect(rtl.screen.getByTestId('name-box').props.onClick).toBeUndefined();
    expect(rtl.screen.getByTestId('name-box').props.onResponderRelease).toBeUndefined();
  });

  it('the field\'s own ref is still given to the form (a callback ref too)', async () => {
    const got: (TextInput | null)[] = [];
    await rtl.render(<TextField testID="bio" label="Bio" multiline inputRef={(n) => {
      got.push(n);
    }} value="" onChangeText={() => undefined} />);
    expect(got.some((n) => n !== null)).toBe(true);
  });
});

/**
 * SWEEP-APP-7: the three rows the verifier left on the tap box (SWEEP-APP-6b L1, L2, L3).
 */
describe('SWEEP-APP-6b L1: a callback ref is told when the input comes and goes, not on every render', () => {
  it('one call with the input at mount and one with null at unmount, however many times the field draws again', async () => {
    const got: (TextInput | null)[] = [];
    const ref = (n: TextInput | null) => {
      got.push(n);
    };
    const tree = (value: string) => <TextField testID="bio" label="Bio" multiline inputRef={ref} value={value} onChangeText={() => undefined} />;
    const view = await rtl.render(tree(''));
    expect(got).toHaveLength(1);
    expect(got[0]).not.toBeNull();
    for (const value of ['a', 'ab', 'abc', 'abcd', 'abcde']) await view.rerender(tree(value));
    expect(got).toHaveLength(1);
    await view.unmount();
    expect(got).toHaveLength(2);
    expect(got[1]).toBeNull();
  });

  it('is given the input again when the field swaps its input for another box (a picker field comes and goes)', async () => {
    const got: (TextInput | null)[] = [];
    const ref = (n: TextInput | null) => {
      got.push(n);
    };
    const tree = (onPress?: () => void) => <TextField testID="bank" label="Bank" inputRef={ref} value="" onPress={onPress} onChangeText={() => undefined} />;
    const view = await rtl.render(tree(() => undefined));
    // A picker field draws no input at all: the form's ref has nothing to hold.
    expect(got.every((n) => n === null)).toBe(true);
    await view.rerender(tree());
    expect(got.at(-1)).not.toBeNull();
  });
});

describe('SWEEP-APP-6b L2: a disabled multiline field on the web', () => {
  afterEach(() => jest.restoreAllMocks());

  it('does not draw the text cursor over a box that takes no typing; an enabled one still does', async () => {
    jest.replaceProperty(Platform, 'OS', 'web');
    await show({ disabled: true });
    expect(flat('bio-box').cursor).toBeUndefined();
    await rtl.screen.unmount();
    await show();
    expect(flat('bio-box').cursor).toBe('text');
  });
});

describe('SWEEP-APP-6b L3: a tap in the padding below the text, on the web, puts the caret at the end', () => {
  afterEach(() => jest.restoreAllMocks());

  it('focuses the input and sets the caret after the last character, so typing does not replace an old selection', async () => {
    jest.replaceProperty(Platform, 'OS', 'web');
    const ref = createRef<TextInput>();
    await rtl.render(<TextField testID="bio" label="Bio" multiline inputRef={ref} value="Hello there" onChangeText={() => undefined} />);
    const setSelection = jest.fn();
    (ref.current as TextInput).setSelection = setSelection;
    await rtl.userEvent.press(rtl.screen.getByTestId('bio-box'));
    expect(setSelection).toHaveBeenCalledWith(11, 11);
  });

  it('an uncontrolled field is left to the browser (no value to measure), and the phones are left as they were', async () => {
    jest.replaceProperty(Platform, 'OS', 'web');
    const ref = createRef<TextInput>();
    await rtl.render(<TextField testID="bio" label="Bio" multiline inputRef={ref} />);
    const setSelection = jest.fn();
    (ref.current as TextInput).setSelection = setSelection;
    await rtl.userEvent.press(rtl.screen.getByTestId('bio-box'));
    expect(setSelection).not.toHaveBeenCalled();
    await rtl.screen.unmount();
    jest.restoreAllMocks();
    const phone = createRef<TextInput>();
    await rtl.render(<TextField testID="bio" label="Bio" multiline inputRef={phone} value="Hello there" onChangeText={() => undefined} />);
    const onPhone = jest.fn();
    (phone.current as TextInput).setSelection = onPhone;
    await rtl.userEvent.press(rtl.screen.getByTestId('bio-box'));
    expect(onPhone).not.toHaveBeenCalled();
  });
});

/**
 * The six multiline TextField callers (NewCommunityScreen, DetailsScreen, EditDetailsScreen, ApplyScreen, EditProfileScreen, DraftFormScreen) pass
 * no style (`style` is not a TextField prop), so the box and the input they draw are the ones asserted here. These are the values the field
 * drew before the box took a press (measured on origin/wmt/SWEEP-APP-5 4e946c77): the box 76 high at least, 14 above and below, the input
 * 15 on a 21 line with no padding of its own.
 */
describe('SHARED-06 L2: every multiline caller draws at the height it drew before', () => {
  it('the box keeps its minimum height, padding and alignment, and its width and border', async () => {
    await show();
    const box = flat('bio-box');
    expect(box).toMatchObject({
      minHeight: 76,
      paddingVertical: 14,
      paddingHorizontal: 16,
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: 12,
    });
    expect(box.height).toBeUndefined();
    expect(box.borderRadius).toBe(18);
    expect(box.flex).toBeUndefined();
    expect(box.position).toBeUndefined();
    expect(box.margin).toBeUndefined();
  });

  it('the input keeps its size: 15 on a 21 line, no padding, flexible in the row', async () => {
    await show();
    const input = flat('bio');
    expect(input).toMatchObject({ fontSize: 15, lineHeight: 21, padding: 0, textAlignVertical: 'top', flex: 1 });
    expect(input.minHeight).toBeUndefined();
    expect(input.height).toBeUndefined();
  });

  it('the box holds the input and nothing else (no wrapper adds a row, a margin or a second box)', async () => {
    await show();
    const box = rtl.screen.getByTestId('bio-box');
    expect(box.children).toHaveLength(1);
    expect(rtl.screen.getByTestId('bio').parent).toBe(box);
  });
});
