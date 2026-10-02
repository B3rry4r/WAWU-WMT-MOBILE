import { act, render, screen, userEvent } from '@testing-library/react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { ActivityIndicator, Modal, Platform, Pressable, Text, View } from 'react-native';
import Svg from 'react-native-svg';

import {
  PinEntry,
  PinSheet,
  detectBiometric,
  type BiometricKind,
  type BiometricResult,
  type PinCheckResult,
  type PinSheetProps,
} from '@/components/pin-sheet';
import { lockedLine, sheetAmount, waitClock } from '@/components/pin-sheet/format';

/*
 * Nothing here depends on how fast the machine is or how warm Jest's cache is.
 *
 * Package imports are loaded on first use (babel-preset-expo's lazy imports),
 * so the first render used to pay for transforming React Native's Modal (and
 * its jest-expo mock) and react-native-svg: about 5 s with a cold cache, all
 * inside the first test's 5 s budget. Touching them here moves that one-off
 * cost to file load, where no test timeout applies; the render then takes
 * milliseconds whatever the cache holds.
 */
void [ActivityIndicator, Modal, Pressable, Text, View, Svg];

/*
 * Every test runs on Jest's fake clock: presses advance the fake clock instead
 * of waiting 130 ms each, and the lock countdown is moved by hand.
 */

jest.mock('expo-local-authentication', () => ({
  AuthenticationType: { FINGERPRINT: 1, FACIAL_RECOGNITION: 2, IRIS: 3 },
  hasHardwareAsync: jest.fn(),
  isEnrolledAsync: jest.fn(),
  supportedAuthenticationTypesAsync: jest.fn(),
}));

const auth = jest.mocked(LocalAuthentication);
const { FINGERPRINT, FACIAL_RECOGNITION } = LocalAuthentication.AuthenticationType;

/** What the phone has, as expo-local-authentication reports it. */
function phone(hardware: boolean, enrolled: boolean, types: LocalAuthentication.AuthenticationType[]) {
  auth.hasHardwareAsync.mockResolvedValue(hardware);
  auth.isEnrolledAsync.mockResolvedValue(enrolled);
  auth.supportedAuthenticationTypesAsync.mockResolvedValue(types);
}

/** Runs the test as if on `os`. */
function on(os: 'ios' | 'android') {
  jest.replaceProperty(Platform, 'OS', os);
}

const NOW = new Date('2026-10-02T10:00:00Z');
const MINUTE = 60_000;

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers({ now: NOW });
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

const press = () => userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
type User = ReturnType<typeof press>;

/** Lets pending promise callbacks run and React apply what they set. */
const flush = () => act(async () => undefined);

const answer = (r: PinCheckResult) => jest.fn((_pin: string) => Promise.resolve(r));

function setup(overrides: Partial<PinSheetProps> = {}): PinSheetProps {
  return {
    visible: true,
    onClose: jest.fn(),
    approval: { totalKobo: 2_506_500, payee: 'Chidinma Okoro' },
    onSubmit: answer({ code: 'approved' }),
    ...overrides,
  };
}

async function enter(user: User, pin: string) {
  for (const d of pin) await user.press(screen.getByRole('button', { name: d }));
}

function deferred<T>() {
  let resolve: (v: T) => void = () => undefined;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}

describe('PinSheet', () => {
  it('lets a user enter a PIN, correct a digit, and submit it', async () => {
    const user = press();
    const props = setup();
    await render(<PinSheet {...props} />);

    expect(screen.getByRole('header', { name: 'Enter your PIN' })).toBeOnTheScreen();
    expect(screen.getByText('Approve ₦25,065 to Chidinma Okoro')).toBeOnTheScreen();

    await enter(user, '12');
    expect(screen.getByLabelText('2 of 4 digits entered')).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: 'Delete' }));
    expect(screen.getByLabelText('1 of 4 digits entered')).toBeOnTheScreen();

    await enter(user, '579');
    expect(props.onSubmit).toHaveBeenCalledTimes(1);
    expect(props.onSubmit).toHaveBeenCalledWith('1579');
  });

  it('shows a user their PIN was refused (403 pin_incorrect) with the tries left, then lets them try again', async () => {
    const user = press();
    const onSubmit = jest
      .fn<Promise<PinCheckResult>, [string]>()
      .mockResolvedValueOnce({ code: 'pin_incorrect', triesLeft: 2 })
      .mockResolvedValueOnce({ code: 'pin_incorrect', triesLeft: 1 });
    await render(<PinSheet {...setup({ onSubmit })} />);

    await enter(user, '0000');
    await flush();
    expect(screen.getByText('Wrong PIN. 2 tries left.')).toBeOnTheScreen();
    expect(screen.getByLabelText('0 of 4 digits entered')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: '5' })).toBeEnabled();

    await enter(user, '1111');
    await flush();
    expect(screen.getByText('Wrong PIN. 1 try left.')).toBeOnTheScreen();
    expect(onSubmit).toHaveBeenNthCalledWith(2, '1111');
  });

  it('shows a user the locked state (423 pin_locked) counting down to lockedUntil, and unlocks when it passes', async () => {
    const user = press();
    const lockedUntil = new Date(NOW.getTime() + 14 * MINUTE).toISOString();
    await render(<PinSheet {...setup({ onSubmit: answer({ code: 'pin_locked', lockedUntil }) })} />);

    await enter(user, '9999');
    await flush();
    expect(screen.getByRole('header', { name: 'PIN locked' })).toBeOnTheScreen();
    expect(screen.getByText(/Try again in 1[34]:\d\d\./)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: '1' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled();

    await act(async () => {
      jest.setSystemTime(new Date(lockedUntil).getTime() - 30_000);
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByText(/Try again in 0:(29|30)\./)).toBeOnTheScreen();

    await act(async () => {
      jest.setSystemTime(new Date(lockedUntil).getTime() + 1);
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByRole('header', { name: 'Enter your PIN' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: '1' })).toBeEnabled();
  });

  it('opens locked when GET /money/pin says the PIN is locked', async () => {
    const lockedUntil = new Date(NOW.getTime() + 3 * 60 * MINUTE).toISOString();
    await render(<PinSheet {...setup({ lockedUntil })} />);
    expect(screen.getByRole('header', { name: 'PIN locked' })).toBeOnTheScreen();
    expect(screen.getByText('Too many wrong tries. Try again in 3:00:00.')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: '0' })).toBeDisabled();
  });

  it('opens on the keypad when lockedUntil is null', async () => {
    await render(<PinSheet {...setup({ lockedUntil: null })} />);
    expect(screen.getByRole('header', { name: 'Enter your PIN' })).toBeOnTheScreen();
  });

  it('shows a user the PIN is being checked, and takes no more digits or a close meanwhile', async () => {
    const user = press();
    const pending = deferred<PinCheckResult>();
    const onSubmit = jest.fn((_pin: string) => pending.promise);
    const props = setup({ onSubmit });
    await render(<PinSheet {...props} />);

    await enter(user, '4321');
    expect(screen.getByLabelText('Checking your PIN')).toBeOnTheScreen();
    expect(screen.getByLabelText('4 of 4 digits entered')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: '7' })).toBeDisabled();
    await user.press(screen.getByRole('button', { name: 'Close' }));
    await user.press(screen.getByTestId('sheet-backdrop', { includeHiddenElements: true }));
    expect(props.onClose).not.toHaveBeenCalled();

    await act(async () => pending.resolve({ code: 'unanswered' }));
    expect(screen.getByText("We couldn't check your PIN. Try again.")).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: '7' })).toBeEnabled();
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('treats a request that failed without an answer as one the user can retry', async () => {
    const user = press();
    const onSubmit = jest.fn((_pin: string) => Promise.reject(new Error('network')));
    await render(<PinSheet {...setup({ onSubmit })} />);
    await enter(user, '1234');
    await flush();
    expect(screen.getByText("We couldn't check your PIN. Try again.")).toBeOnTheScreen();
  });

  it('lets a user close the sheet after it was hidden mid-check and opened again', async () => {
    const user = press();
    const pending = deferred<PinCheckResult>();
    const props = setup({ onSubmit: jest.fn((_pin: string) => pending.promise) });
    const view = await render(<PinSheet {...props} />);

    await enter(user, '4321');
    await view.rerender(<PinSheet {...props} visible={false} />);
    await act(async () => pending.resolve({ code: 'approved' }));
    await view.rerender(<PinSheet {...props} visible />);

    await user.press(screen.getByRole('button', { name: 'Close' }));
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('tells the frame it is no longer busy when it unmounts mid-check', async () => {
    const user = press();
    const onBusyChange = jest.fn();
    const pending = deferred<PinCheckResult>();
    const view = await render(
      <PinEntry
        approval={{ totalKobo: 100, payee: 'Femi' }}
        onSubmit={() => pending.promise}
        onBusyChange={onBusyChange}
      />,
    );
    await enter(user, '1234');
    expect(onBusyChange).toHaveBeenLastCalledWith(true);

    await view.unmount();
    expect(onBusyChange).toHaveBeenLastCalledWith(false);
    await act(async () => pending.resolve({ code: 'approved' }));
    expect(onBusyChange).toHaveBeenCalledTimes(2);
  });

  it('lets a user reach Forgot PIN when the payment offers it', async () => {
    const user = press();
    const onForgotPin = jest.fn();
    await render(<PinSheet {...setup({ onForgotPin })} />);
    await user.press(screen.getByRole('button', { name: 'Forgot PIN?' }));
    expect(onForgotPin).toHaveBeenCalledTimes(1);
  });

  it('writes the approval line with the total for a purpose (M13)', async () => {
    await render(<PinSheet {...setup({ approval: { totalKobo: 202_325, purpose: 'the professional tick' } })} />);
    expect(screen.getByText('₦2,023.25 for the professional tick')).toBeOnTheScreen();
  });

  it('lets a user close the sheet from the grabber or the dimmed page behind it', async () => {
    const user = press();
    const props = setup();
    await render(<PinSheet {...props} />);
    await user.press(screen.getByRole('button', { name: 'Close' }));
    await user.press(screen.getByTestId('sheet-backdrop', { includeHiddenElements: true }));
    expect(props.onClose).toHaveBeenCalledTimes(2);
  });
});

describe('PinSheet biometric key (owner, 2 Oct 2026: whatever the phone has)', () => {
  const approvesWith = (result: BiometricResult) =>
    jest.fn((_kind: BiometricKind) => Promise.resolve(result));

  it('shows a fingerprint key on an Android phone with a fingerprint reader', async () => {
    on('android');
    phone(true, true, [FINGERPRINT]);
    await render(<PinSheet {...setup({ biometric: { onPress: approvesWith({ code: 'approved' }) } })} />);
    await flush();
    expect(screen.getByRole('button', { name: 'Use fingerprint' })).toBeOnTheScreen();
    expect(screen.getByTestId('icon-Fingerprint', { includeHiddenElements: true })).toBeTruthy();
  });

  it('shows Face ID on an iPhone with Face ID', async () => {
    on('ios');
    phone(true, true, [FACIAL_RECOGNITION]);
    await render(<PinSheet {...setup({ biometric: { onPress: approvesWith({ code: 'approved' }) } })} />);
    await flush();
    expect(screen.getByRole('button', { name: 'Use Face ID' })).toBeOnTheScreen();
    expect(screen.getByTestId('icon-ScanFace', { includeHiddenElements: true })).toBeTruthy();
  });

  it('shows face unlock on an Android phone with only a face scanner', async () => {
    on('android');
    phone(true, true, [FACIAL_RECOGNITION]);
    await render(<PinSheet {...setup({ biometric: { onPress: approvesWith({ code: 'approved' }) } })} />);
    await flush();
    expect(screen.getByRole('button', { name: 'Use face unlock' })).toBeOnTheScreen();
    expect(screen.getByTestId('icon-ScanFace', { includeHiddenElements: true })).toBeTruthy();
  });

  it('prefers the fingerprint on an Android phone with both, and the face on an iPhone', async () => {
    phone(true, true, [FINGERPRINT, FACIAL_RECOGNITION]);
    await expect(detectBiometric('android')).resolves.toBe('fingerprint');
    await expect(detectBiometric('ios')).resolves.toBe('face');
  });

  it.each([
    ['no biometric hardware', false, true, [FINGERPRINT]],
    ['nothing enrolled', true, false, [FINGERPRINT]],
    ['no fingerprint or face type', true, true, []],
  ])('shows no biometric key with %s', async (_why, hardware, enrolled, types) => {
    on('android');
    phone(hardware as boolean, enrolled as boolean, types as LocalAuthentication.AuthenticationType[]);
    const onPress = approvesWith({ code: 'approved' });
    await render(<PinSheet {...setup({ biometric: { onPress } })} />);
    await flush();
    expect(screen.queryByRole('button', { name: /^Use / })).not.toBeOnTheScreen();
    expect(screen.getByRole('button', { name: '1' })).toBeEnabled();
  });

  it('shows no biometric key when the payment does not offer one, whatever the phone has', async () => {
    phone(true, true, [FINGERPRINT]);
    await render(<PinSheet {...setup()} />);
    await flush();
    expect(screen.queryByRole('button', { name: /^Use / })).not.toBeOnTheScreen();
    expect(auth.hasHardwareAsync).not.toHaveBeenCalled();
  });

  it('tells a user "Fingerprint failed. Use your PIN." and gives the keypad back, using no PIN try', async () => {
    on('android');
    phone(true, true, [FINGERPRINT]);
    const user = press();
    const onPress = approvesWith({ code: 'failed' });
    const props = setup({ biometric: { onPress } });
    await render(<PinSheet {...props} />);
    await flush();

    await user.press(screen.getByRole('button', { name: 'Use fingerprint' }));
    await flush();
    expect(onPress).toHaveBeenCalledWith('fingerprint');
    expect(screen.getByRole('alert')).toHaveTextContent('Fingerprint failed. Use your PIN.');
    expect(screen.getByRole('button', { name: '1' })).toBeEnabled();
    expect(props.onSubmit).not.toHaveBeenCalled();
  });

  it('tells a user "Face ID failed. Use your PIN." when the approval request itself fails', async () => {
    on('ios');
    phone(true, true, [FACIAL_RECOGNITION]);
    const user = press();
    const onPress = jest.fn((_kind: BiometricKind) => Promise.reject(new Error('network')));
    await render(<PinSheet {...setup({ biometric: { onPress } })} />);
    await flush();

    await user.press(screen.getByRole('button', { name: 'Use Face ID' }));
    await flush();
    expect(screen.getByRole('alert')).toHaveTextContent('Face ID failed. Use your PIN.');
  });

  it('goes back to the keypad without a message when the user cancels the prompt', async () => {
    const user = press();
    const onPress = approvesWith({ code: 'cancelled' });
    await render(<PinSheet {...setup({ biometric: { kind: 'fingerprint', onPress } })} />);

    await user.press(screen.getByRole('button', { name: 'Use fingerprint' }));
    await flush();
    expect(screen.queryByRole('alert')).not.toBeOnTheScreen();
    expect(screen.getByRole('button', { name: '1' })).toBeEnabled();
    expect(auth.hasHardwareAsync).not.toHaveBeenCalled();
  });

  it('keeps the keys off once the biometric approves', async () => {
    const user = press();
    const onPress = approvesWith({ code: 'approved' });
    await render(<PinSheet {...setup({ biometric: { kind: 'fingerprint', onPress } })} />);
    await user.press(screen.getByRole('button', { name: 'Use fingerprint' }));
    await flush();
    expect(screen.getByRole('button', { name: '1' })).toBeDisabled();
  });
});

describe('PIN sheet copy', () => {
  it('formats kobo as naira the way the canvas writes it', () => {
    expect(sheetAmount(2_506_500)).toBe('₦25,065');
    expect(sheetAmount(252_325)).toBe('₦2,523.25');
    expect(sheetAmount(5)).toBe('₦0.05');
  });

  it('counts the wait like the canvas clock and rounds seconds up, never to 0:00 while locked', () => {
    expect(waitClock(1)).toBe('0:01');
    expect(waitClock(42_000)).toBe('0:42');
    expect(waitClock(14 * MINUTE)).toBe('14:00');
    expect(waitClock(61 * MINUTE)).toBe('1:01:00');
    expect(lockedLine(60_001)).toBe('Too many wrong tries. Try again in 1:01.');
  });
});
