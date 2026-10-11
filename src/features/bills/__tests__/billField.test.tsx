/* eslint-disable @typescript-eslint/no-require-imports */
import * as rtl from '@testing-library/react-native';

/**
 * The amount box tells the caret keeper about every change (BILLS-01 round 3, R2-2). The keeper itself is tested in
 * `useKeepCaret.test.tsx`; this pins the wiring between the box and the keeper, which a browser is the only place to feel.
 */

const mockUseKeepCaret = jest.fn();
const mockOnTyped = jest.fn();
jest.mock('../useKeepCaret', () => ({
  useKeepCaret: (...args: unknown[]) => mockUseKeepCaret(...args),
}));

const { BillField } = require('../parts') as typeof import('../parts');

const calls: string[] = [];

beforeEach(() => {
  calls.length = 0;
  mockOnTyped.mockReset().mockImplementation((typed: string) => calls.push(`keeper:${typed}`));
  mockUseKeepCaret.mockReset().mockReturnValue(mockOnTyped);
});

const field = (props: Partial<import('react').ComponentProps<typeof BillField>> = {}) =>
  rtl.render(
    <BillField
      testID="box"
      label="Amount"
      value="1,234"
      onChangeText={(typed) => calls.push(`screen:${typed}`)}
      {...props}
    />,
  );

describe('BillField and the caret keeper', () => {
  it('tells the keeper about a change before the screen, with the text typed', async () => {
    await field({ keepCaret: true });
    await rtl.act(async () => rtl.fireEvent.changeText(rtl.screen.getByTestId('box'), '12,2345'));
    expect(mockOnTyped).toHaveBeenCalledTimes(1);
    expect(calls).toEqual(['keeper:12,2345', 'screen:12,2345']);
  });

  it('hands the keeper the box’s words, and asks it to keep the caret only when the box says so', async () => {
    const view = await field({ keepCaret: true });
    expect(mockUseKeepCaret).toHaveBeenLastCalledWith(expect.objectContaining({ current: expect.anything() }), '1,234', true);
    await view.rerender(<BillField testID="box" label="Amount" value="12,345" onChangeText={jest.fn()} />);
    expect(mockUseKeepCaret).toHaveBeenLastCalledWith(expect.anything(), '12,345', false);
    await view.rerender(<BillField testID="box" label="Amount" value="12,345" keepCaret={false} onChangeText={jest.fn()} />);
    expect(mockUseKeepCaret).toHaveBeenLastCalledWith(expect.anything(), '12,345', false);
  });

  it('still tells the screen of a change when the box keeps no caret', async () => {
    await field();
    await rtl.act(async () => rtl.fireEvent.changeText(rtl.screen.getByTestId('box'), '9'));
    expect(calls).toContain('screen:9');
  });
});
