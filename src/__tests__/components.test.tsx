import { act, fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import { useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text as NativeText,
  TextInput,
  View,
} from 'react-native';

import { Button, IconButton } from '@/components/Button';
import { Credits, formatCredits } from '@/components/Credits';
import { formatMoney, Money } from '@/components/Money';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { Showcase } from '@/features/showcase/Showcase';
import { darkColors, lightColors } from '@/theme/tokens.generated';

/*
 * Nothing here depends on how fast the machine is or how warm Jest's cache is.
 *
 * React Native's components load on first use (babel-preset-expo makes the
 * `react-native` import lazy), so the first render in this file used to pay
 * for transforming them: Modal alone takes about 5 s with a cold cache, all
 * inside one test's 5 s budget. Touching every primitive the components and
 * the showcase draw moves that one-off cost to file load, where no test
 * timeout applies (the same fix as PinSheet.test.tsx).
 */
void [AccessibilityInfo, ActivityIndicator, Modal, Pressable, ScrollView, NativeText, TextInput, View];

let mockScheme: 'light' | 'dark' = 'dark';
jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: () => mockScheme,
}));

/*
 * The showcase draws every kit component, so rendering it once before the
 * first test pays whatever React Native still does on a component's first
 * render (beyond loading its module) with a 60 s budget of its own.
 */
beforeAll(async () => {
  const { unmount } = await render(<Showcase />);
  await unmount();
}, 60_000);

beforeEach(() => {
  mockScheme = 'dark';
});

const flat = (style: unknown): Record<string, unknown> => Object.assign({}, ...[style].flat(Infinity).filter(Boolean));

describe('buttons', () => {
  it('lets a user press a button and runs the action once per press', async () => {
    const onPress = jest.fn();
    await render(<Button label="Continue" onPress={onPress} />);
    await userEvent.press(screen.getByRole('button', { name: 'Continue' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('stops a user sending twice: a loading button ignores presses and says it is busy', async () => {
    const onPress = jest.fn();
    await render(<Button label="Continue" loading onPress={onPress} />);
    const button = screen.getByRole('button', { name: 'Continue' });
    await userEvent.press(button);
    await userEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
    expect(button.props.accessibilityState).toMatchObject({ busy: true, disabled: true });
    expect(screen.getByTestId('button-spinner')).toBeTruthy();
  });

  it('shows a user a disabled button that cannot be pressed', async () => {
    const onPress = jest.fn();
    await render(<Button label="Continue" disabled onPress={onPress} />);
    const button = screen.getByRole('button', { name: 'Continue' });
    await userEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
    expect(button.props.accessibilityState.disabled).toBe(true);
    expect(flat(button.props.style).backgroundColor).toBe(darkColors.surfaceSunken);
  });

  it('shows a user the pressed state while a finger is down', async () => {
    await render(<Button label="Continue" onPress={() => undefined} />);
    const button = screen.getByRole('button', { name: 'Continue' });
    expect(flat(button.props.style).backgroundColor).toBe(darkColors.accent);
    await fireEvent(button, 'responderGrant', {
      persist: () => undefined,
      currentTarget: { measure: (done: (...n: number[]) => void) => done(0, 0, 0, 0, 0, 0) },
      nativeEvent: { touches: [], changedTouches: [], timestamp: 0, pageX: 0, pageY: 0 },
      touchHistory: { touchBank: [], numberActiveTouches: 0, indexOfSingleActiveTouch: -1, mostRecentTimeStamp: 0 },
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });
    expect(flat(screen.getByRole('button', { name: 'Continue' }).props.style).backgroundColor).toBe(darkColors.accentPress);
  });

  it('lets a user press an icon button that a screen reader can name', async () => {
    const onPress = jest.fn();
    await render(<IconButton icon="ChevronLeft" label="Back" onPress={onPress} />);
    await userEvent.press(screen.getByRole('button', { name: 'Back' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('inputs', () => {
  function Harness({ error }: { error?: string }) {
    const [value, setValue] = useState('');
    return <TextField testID="email" label="Email" value={value} onChangeText={setValue} error={error} hint="We never share it" />;
  }

  it('lets a user type into a field and see what they typed', async () => {
    await render(<Harness />);
    await userEvent.type(screen.getByLabelText('Email'), 'a@wawu.africa');
    expect(screen.getByLabelText('Email').props.value).toBe('a@wawu.africa');
  });

  it('shows a user the hint, and swaps it for the error when something is wrong', async () => {
    const { rerender } = await render(<Harness />);
    expect(screen.getByText('We never share it')).toBeTruthy();
    await rerender(<Harness error="Enter a valid email" />);
    expect(screen.getByText('Enter a valid email')).toBeTruthy();
    expect(screen.queryByText('We never share it')).toBeNull();
    expect(screen.getByRole('alert')).toBeTruthy();
  });

  it('shows a user which field has focus', async () => {
    await render(<Harness />);
    const input = screen.getByLabelText('Email');
    const box = () => flat(screen.getByTestId('email-box').props.style);
    expect(box().borderColor).toBe(darkColors.borderHairline);
    await fireEvent(input, 'focus');
    expect(box().borderColor).toBe(darkColors.accent);
    await fireEvent(input, 'blur');
    expect(box().borderColor).toBe(darkColors.borderHairline);
  });

  it('keeps a user from typing in a disabled field', async () => {
    await render(<TextField label="Email" value="a@wawu.africa" onChangeText={() => undefined} disabled />);
    expect(screen.getByLabelText('Email').props.editable).toBe(false);
  });

  it('lets a user show and hide a password', async () => {
    await render(<TextField label="Password" defaultValue="secret-word" secret />);
    expect(screen.getByLabelText('Password').props.secureTextEntry).toBe(true);
    await userEvent.press(screen.getByRole('button', { name: 'Show password' }));
    expect(screen.getByLabelText('Password').props.secureTextEntry).toBe(false);
    await userEvent.press(screen.getByRole('button', { name: 'Hide password' }));
    expect(screen.getByLabelText('Password').props.secureTextEntry).toBe(true);
  });

  it('shows a user that a check is running without stopping them typing', async () => {
    await render(<TextField label="Phone number" loading />);
    expect(screen.getByTestId('field-spinner')).toBeTruthy();
    expect(screen.getByLabelText('Phone number').props.editable).toBe(true);
  });
});

describe('money', () => {
  it('shows a user the balance with the naira sign and kobo, as the wallet draws it', async () => {
    expect(formatMoney(48525075)).toBe('₦485,250.75');
    await render(<Money minorUnits={48525075} testID="balance" />);
    const balance = screen.getByTestId('balance');
    expect(balance).toHaveTextContent('₦485,250.75');
    expect(balance.props.accessibilityLabel).toBe('485,250 naira 75 kobo');
  });

  it('shows a user a whole-naira amount without kobo when decimals are off', async () => {
    await render(<Money minorUnits={2500000} decimals={false} testID="amount" />);
    expect(screen.getByTestId('amount')).toHaveTextContent('₦25,000');
    expect(screen.getByTestId('amount')).not.toHaveTextContent('.00');
  });

  it('shows a user money in as plus in green and money out as minus in full', async () => {
    expect(formatMoney(200000, { sign: true })).toBe('+₦2,000.00');
    expect(formatMoney(-2506500, { sign: true })).toBe('−₦25,065.00');
    await render(
      <>
        <Money minorUnits={200000} signed testID="in" />
        <Money minorUnits={-1060000} signed testID="out" />
      </>,
    );
    expect(screen.getByTestId('in')).toHaveTextContent('+₦2,000.00');
    expect(flat(screen.getByTestId('in').props.style).color).toBe(darkColors.positive);
    expect(screen.getByTestId('out')).toHaveTextContent('−₦10,600.00');
    expect(flat(screen.getByTestId('out').props.style).color).toBe(darkColors.textPrimary);
  });

  it('keeps kobo exact: one kobo and a million naira do not round', async () => {
    expect(formatMoney(1)).toBe('₦0.01');
    expect(formatMoney(100000000)).toBe('₦1,000,000.00');
    expect(formatMoney(0)).toBe('₦0.00');
  });

  it('hides a balance when the user hides it, and shows no figure while it loads', async () => {
    await render(
      <>
        <Money minorUnits={48525075} masked testID="hidden" />
        <Money minorUnits={0} loading testID="loading" />
      </>,
    );
    expect(screen.getByTestId('hidden')).not.toHaveTextContent('485');
    expect(screen.getByTestId('loading')).not.toHaveTextContent('0.00');
    expect(screen.getByRole('progressbar', { name: 'Loading amount' })).toBeTruthy();
  });

  it('lines amounts up with tabular figures', async () => {
    await render(<Money minorUnits={48525075} testID="balance" />);
    expect(flat(screen.getByTestId('balance').props.style).fontVariant).toContain('tabular-nums');
  });

  it('shows a user WAWU Credits as a count, never as naira', async () => {
    expect(formatCredits(1250)).toBe('1,250 credits');
    expect(formatCredits(1)).toBe('1 credit');
    await render(<Credits count={1250} testID="credits" />);
    expect(screen.getByText('1,250 credits')).toBeTruthy();
    expect(screen.queryByText(/₦/)).toBeNull();
  });
});

describe('text', () => {
  it('announces a heading to a screen reader and carries the design colour', async () => {
    await render(<Text variant="title">Wallet</Text>);
    expect(screen.getByRole('header', { name: 'Wallet' })).toBeTruthy();
    expect(flat(screen.getByText('Wallet').props.style).color).toBe(darkColors.textPrimary);
  });

  it('tints secondary copy and takes a colour token when a screen asks', async () => {
    await render(
      <>
        <Text variant="secondary">Tip on your video</Text>
        <Text tone="danger">Wrong PIN</Text>
      </>,
    );
    expect(flat(screen.getByText('Tip on your video').props.style).color).toBe(darkColors.textSecondary);
    expect(flat(screen.getByText('Wrong PIN').props.style).color).toBe(darkColors.danger);
  });
});

describe('themes', () => {
  it('lets a user on a light phone see the light palette, from the same component', async () => {
    mockScheme = 'light';
    await render(<Text variant="body">Hello</Text>);
    expect(flat(screen.getByText('Hello').props.style).color).toBe(lightColors.textPrimary);
    expect(lightColors.textPrimary).not.toBe(darkColors.textPrimary);
  });
});

describe('showcase', () => {
  it('lets a developer press a button on the page and see which one fired', async () => {
    await render(<Showcase />);
    await userEvent.press(screen.getAllByRole('button', { name: 'Continue' })[0]);
    expect(screen.getByText('Last pressed: Continue')).toBeTruthy();
  });
});

describe('back icon', () => {
  it('shows a user a chevron on the back button, not an arrow with a tail', async () => {
    await render(<IconButton icon="ChevronLeft" label="Back" onPress={() => undefined} />);
    expect(screen.getByTestId('icon-ChevronLeft', { includeHiddenElements: true })).toBeTruthy();
    expect(screen.queryByTestId('icon-ArrowLeft', { includeHiddenElements: true })).toBeNull();
  });
});

describe('field sizes match the design', () => {
  it('draws the label at 13, the value at 15.5, the hint at 12.5 and the box at 54 with radius 18', async () => {
    await render(<TextField testID="bvn" label="BVN" hint="Must be the number on your BVN" defaultValue="22" />);
    expect(flat(screen.getByText('BVN').props.style).fontSize).toBe(13);
    expect(flat(screen.getByText('Must be the number on your BVN').props.style).fontSize).toBe(12.5);
    expect(flat(screen.getByTestId('bvn').props.style).fontSize).toBe(15.5);
    const box = flat(screen.getByTestId('bvn-box').props.style);
    expect(box.height).toBe(54);
    expect(box.borderRadius).toBe(18);
  });

  it('writes an error in the same 12.5 size as the hint', async () => {
    await render(<TextField label="BVN" error="Enter 11 digits" />);
    expect(flat(screen.getByText('Enter 11 digits').props.style).fontSize).toBe(12.5);
  });
});

describe('web only behaviour', () => {
  afterEach(() => jest.restoreAllMocks());

  it('shows a web user the designed ring only, with the browser outline switched off', async () => {
    jest.replaceProperty(Platform, 'OS', 'web');
    await render(<TextField testID="email" label="Email" />);
    expect(flat(screen.getByTestId('email').props.style)).toMatchObject({ outlineStyle: 'none', outlineWidth: 0 });
  });

  it('leaves the outline style alone on a phone', async () => {
    await render(<TextField testID="email" label="Email" />);
    expect(flat(screen.getByTestId('email').props.style).outlineStyle).toBeUndefined();
  });

  it('shows a keyboard user the button ring, and a mouse user none', async () => {
    jest.replaceProperty(Platform, 'OS', 'web');
    await render(<Button label="Continue" onPress={() => undefined} />);
    const button = screen.getByRole('button', { name: 'Continue' });
    const ring = () => flat(button.props.style).boxShadow;
    expect(ring()).toBeUndefined();
    await fireEvent(button, 'focus', { target: { matches: () => false } });
    expect(ring()).toBeUndefined();
    await fireEvent(button, 'blur');
    await fireEvent(button, 'focus', { target: { matches: (q: string) => q === ':focus-visible' } });
    expect(ring()).toContain(darkColors.accentFg);
    await fireEvent(button, 'blur');
    expect(ring()).toBeUndefined();
  });

  it('shows a device keyboard user the button ring on a phone', async () => {
    await render(<Button label="Continue" onPress={() => undefined} />);
    const button = screen.getByRole('button', { name: 'Continue' });
    await fireEvent(button, 'focus', {});
    expect(flat(button.props.style).boxShadow).toContain(darkColors.accentFg);
  });
});

describe('money details a user can see and hear', () => {
  it('draws the naira sign in the platform font because Alan Sans has no sign', async () => {
    await render(<Money minorUnits={48525075} testID="balance" />);
    const sign = screen.getByText('₦');
    expect(flat(sign.props.style).fontFamily).toBe('System');
  });

  it('draws kobo smaller and dimmer than the whole figure', async () => {
    await render(<Money minorUnits={48525075} size={40} testID="balance" />);
    const kobo = flat(screen.getByText('.75').props.style);
    expect(kobo.fontSize).toBeCloseTo(28.8);
    expect(kobo.opacity).toBe(0.5);
  });

  it('tells a screen reader about a credit as plus and a debit as minus, in the same words', async () => {
    await render(
      <>
        <Money minorUnits={200000} signed testID="in" />
        <Money minorUnits={-2506500} signed testID="out" />
        <Money minorUnits={200000} testID="plain" />
      </>,
    );
    expect(screen.getByTestId('in').props.accessibilityLabel).toBe('plus 2,000 naira');
    expect(screen.getByTestId('out').props.accessibilityLabel).toBe('minus 25,065 naira');
    expect(screen.getByTestId('plain').props.accessibilityLabel).toBe('2,000 naira');
  });
});
