/* eslint-disable @typescript-eslint/no-require-imports */
import * as rtl from '@testing-library/react-native';

import { CheckRow } from '../planParts';

/*
 * SWEEP-APP-3 row 159 (ME-12 S7 F6): on the web, the points offer's tick must say whether it is ticked. react-native-web reads `aria-checked`
 * and a phone's Pressable folds it into the state before the host view sees it (FIX-14, the consent box), so this file watches the props the
 * row hands the Pressable.
 */
const mockPressableProps: Record<string, unknown>[] = [];
jest.mock('react-native/Libraries/Components/Pressable/Pressable', () => {
  const React = require('react');
  const actual = jest.requireActual('react-native/Libraries/Components/Pressable/Pressable');
  const Watched = React.forwardRef(function Watched(props: Record<string, unknown>, ref: unknown) {
    mockPressableProps.push(props);
    return React.createElement(actual.default, { ...props, ref });
  });
  return { __esModule: true, default: Watched };
});

beforeEach(() => {
  mockPressableProps.length = 0;
});

const tick = () => [...mockPressableProps].reverse().find((props) => props.testID === 'tick') as Record<string, unknown>;

describe('the offer tick (VF6)', () => {
  it.each([true, false])('hands the Pressable aria-checked beside the accessibility state when it is %s', async (on) => {
    await rtl.render(<CheckRow testID="tick" label="Add 1,000 points" on={on} disabled={false} onPress={() => undefined} />);
    expect(tick()['aria-checked']).toBe(on);
    expect(tick().accessibilityState).toMatchObject({ checked: on });
    expect(tick().accessibilityRole).toBe('checkbox');
  });
});
