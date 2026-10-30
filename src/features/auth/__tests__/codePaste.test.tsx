/* eslint-disable @typescript-eslint/no-require-imports */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { Outcome } from '../signupFailure';

const { CodeScreen } = require('../CodeScreen') as typeof import('../CodeScreen');

const frame = (children: React.ReactNode) => (
  <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>{children}</SafeAreaProvider>
);
const wrong = (): Outcome => ({ kind: 'wrong' });

async function boot(over: Partial<React.ComponentProps<typeof CodeScreen>> = {}) {
  const onSubmit = jest.fn(async () => undefined);
  await render(frame(<CodeScreen navTitle="Verify" subtitle="Sent by SMS." resendIn={0} onSubmit={onSubmit} onResend={async () => 30} classify={wrong} testID="code" {...over} />));
  return onSubmit;
}
const paste = (text: string) => act(async () => void fireEvent.changeText(screen.getByTestId('code-input'), text));
const key = (digit: string) => act(async () => void fireEvent.press(screen.getByLabelText(digit)));

// WALK-FIX M4 (29 Oct walk): the six-digit code was keypad-only, so a code could not be pasted and the phone could not offer it from a text or an email.
describe('the code field takes a pasted or offered code, and the keypad still works', () => {
  it('"123456" fills all six boxes and sends the code once', async () => {
    const onSubmit = await boot();
    await paste('123456');
    expect(screen.getByLabelText('Code, 6 of 6 digits entered')).toBeTruthy();
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith('123456', ''));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('"123 456" (the way a text writes it) fills all six too', async () => {
    const onSubmit = await boot();
    await paste('123 456');
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith('123456', ''));
  });

  it('a pasted line with words around the code takes its digits, and more than six keeps the first six', async () => {
    const onSubmit = await boot();
    await paste('Your WAWU code is 654321. Do not share it.');
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith('654321', ''));
  });

  it('typing on the keypad still works, a digit at a time, and sends at the sixth', async () => {
    const onSubmit = await boot();
    for (const d of '123456') await key(d);
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith('123456', ''));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('a character from a system keyboard is one more digit, and a delete key removes one', async () => {
    const onSubmit = await boot();
    await paste('4');
    await paste('2');
    expect(screen.getByLabelText('Code, 2 of 6 digits entered')).toBeTruthy();
    await act(async () => void fireEvent(screen.getByTestId('code-input'), 'keyPress', { nativeEvent: { key: 'Backspace' } }));
    expect(screen.getByLabelText('Code, 1 of 6 digits entered')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('paste with a second code to enter fills the first and waits for Continue', async () => {
    const onSubmit = await boot({ extra: { label: 'Email code', hint: 'From your email' } });
    await paste('123456');
    expect(screen.getByLabelText('Code, 6 of 6 digits entered')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('a paste is ignored while the code is being checked', async () => {
    let release: () => void = () => undefined;
    const onSubmit = jest.fn(() => new Promise<void>((resolve) => (release = resolve)));
    await boot({ onSubmit });
    await paste('111111');
    await paste('222222');
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith('111111', '');
    release();
  });

  it('a wrong code can be replaced by pasting the right one', async () => {
    let tries = 0;
    const onSubmit = jest.fn(async () => {
      tries += 1;
      if (tries === 1) throw new Error('wrong');
    });
    await boot({ onSubmit });
    await paste('000000');
    await screen.findByText("That code isn't right");
    await paste('123456');
    await waitFor(() => expect(onSubmit).toHaveBeenLastCalledWith('123456', ''));
  });
});

describe('the field asks the phone to offer the code (Android and iOS)', () => {
  const realOs = Platform.OS;
  afterEach(() => {
    Platform.OS = realOs;
  });

  it('on Android it carries the sms-otp hint and a number pad', async () => {
    Platform.OS = 'android';
    await boot();
    expect(screen.getByTestId('code-input').props).toMatchObject({ autoComplete: 'sms-otp', textContentType: 'oneTimeCode', keyboardType: 'number-pad', importantForAutofill: 'yes' });
  });

  it('on iOS it carries the one-time-code type and hint and a number pad', async () => {
    Platform.OS = 'ios';
    await boot();
    expect(screen.getByTestId('code-input').props).toMatchObject({ autoComplete: 'one-time-code', textContentType: 'oneTimeCode', keyboardType: 'number-pad' });
  });

  it('the field never holds the code and is not visible, so the boxes stay the only thing drawn', async () => {
    await boot();
    await paste('123456');
    const input = screen.getByTestId('code-input');
    expect(input.props.value).toBe('');
    expect(input.props.caretHidden).toBe(true);
    expect(input.props.showSoftInputOnFocus).toBe(false);
  });
});
