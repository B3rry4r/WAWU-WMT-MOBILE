/* eslint-disable @typescript-eslint/no-require-imports */
import * as rtl from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/*
 * Confirm your email (G-486) on the real code screen, with WAWU ID's two calls as stand-ins at the identity client: what the screen
 * asks (mail a code, check it) and what it does with each answer. The wire shapes of both calls are the sign-up wizard's, tested there.
 */
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));
jest.mock('@/features/auth/signupApi', () => ({ authed: async (run: (token: string) => Promise<unknown>) => run('access-1') }));
jest.mock('@/features/claim/freshToken', () => ({ noteContactProved: jest.fn(async () => undefined) }));
const mockStart = jest.fn();
const mockConfirm = jest.fn();
jest.mock('@/api/identity', () => ({
  signupEmailStartRequest: (token: string) => mockStart(token),
  signupEmailConfirmRequest: (token: string, code: string) => mockConfirm(token, code),
}));

const { ApiError } = require('@/api/errors') as typeof import('@/api/errors');
const { ConfirmEmailScreen } = require('../ConfirmEmailScreen') as typeof import('../ConfirmEmailScreen');
const { noteContactProved } = require('@/features/claim/freshToken') as { noteContactProved: jest.Mock };

const frame = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };
const draw = async () => {
  const onBack = jest.fn();
  const onConfirmed = jest.fn();
  await rtl.render(
    <SafeAreaProvider initialMetrics={frame}>
      <ConfirmEmailScreen onBack={onBack} onConfirmed={onConfirmed} />
    </SafeAreaProvider>,
  );
  return { onBack, onConfirmed };
};
const typeDigits = async (digits: string) => {
  for (const digit of digits) await rtl.fireEvent.press(rtl.screen.getByRole('button', { name: digit }));
};
const refuse = (status: number, code: string, retryAfterSeconds?: number) => new ApiError(status === 409 ? 'conflict' : status === 429 ? 'rate_limited' : status >= 500 ? 'server' : 'validation', status, code, code, retryAfterSeconds);

beforeEach(() => {
  mockStart.mockReset();
  mockConfirm.mockReset();
  noteContactProved.mockClear();
  mockStart.mockResolvedValue({ email: 'l***x@wawu.africa', expiresIn: 600, resendIn: 30 });
});

describe('G-486 · Confirm your email', () => {
  it('opening it mails a code to the account\'s own address and says where it went', async () => {
    await draw();
    expect(await rtl.screen.findByText('Sent to l***x@wawu.africa')).toBeTruthy();
    expect(mockStart).toHaveBeenCalledTimes(1);
    expect(mockStart).toHaveBeenCalledWith('access-1');
    expect(rtl.screen.getByText('Confirm your email')).toBeTruthy();
    expect(rtl.screen.queryByText('Later')).toBeNull();
  });

  it('a right code proves the email and hands back to the screen that sent the person here', async () => {
    mockConfirm.mockResolvedValue({ step: 'done' });
    const { onConfirmed } = await draw();
    await rtl.screen.findByText('Sent to l***x@wawu.africa');
    await typeDigits('123456');
    await rtl.waitFor(() => expect(onConfirmed).toHaveBeenCalledTimes(1));
    expect(mockConfirm).toHaveBeenCalledWith('access-1', '123456');
    expect(noteContactProved).toHaveBeenCalledTimes(1);
  });

  it('a wrong code says so and confirms nothing', async () => {
    mockConfirm.mockRejectedValue(refuse(400, 'EMAIL_CODE_INVALID'));
    const { onConfirmed } = await draw();
    await rtl.screen.findByText('Sent to l***x@wawu.africa');
    await typeDigits('222222');
    await rtl.waitFor(() => expect(mockConfirm).toHaveBeenCalledTimes(1));
    expect(await rtl.screen.findByTestId('confirm-email-error')).toBeTruthy();
    expect(onConfirmed).not.toHaveBeenCalled();
    expect(noteContactProved).not.toHaveBeenCalled();
  });

  it('an address proven already is not asked again: it hands back at once, with no code screen', async () => {
    mockStart.mockRejectedValue(refuse(409, 'EMAIL_ALREADY_PROVEN'));
    const { onConfirmed } = await draw();
    await rtl.waitFor(() => expect(onConfirmed).toHaveBeenCalledTimes(1));
    expect(mockConfirm).not.toHaveBeenCalled();
  });

  it('an account with no address says so and asks for nothing', async () => {
    mockStart.mockRejectedValueOnce(refuse(409, 'EMAIL_NOT_SET'));
    const { onConfirmed } = await draw();
    expect(await rtl.screen.findByTestId('confirm-email-none')).toBeTruthy();
    expect(onConfirmed).not.toHaveBeenCalled();
    expect(mockConfirm).not.toHaveBeenCalled();
  });

  it('a code mailed a moment ago shows the wait instead of failing', async () => {
    mockStart.mockRejectedValueOnce(refuse(429, 'EMAIL_CODE_RESEND_TOO_SOON', 33));
    await draw();
    expect(await rtl.screen.findByText('Sent to your email address')).toBeTruthy();
    expect(rtl.screen.getByText('Resend in 0:33')).toBeTruthy();
  });

  it('a failed mailing says so with Try again, and Try again mails again', async () => {
    mockStart.mockRejectedValueOnce(refuse(503, 'EMAIL_SEND_FAILED'));
    await draw();
    expect(await rtl.screen.findByTestId('confirm-email-failed')).toBeTruthy();
    await rtl.fireEvent.press(rtl.screen.getByText('Try again'));
    expect(await rtl.screen.findByText('Sent to l***x@wawu.africa')).toBeTruthy();
    expect(mockStart).toHaveBeenCalledTimes(2);
  });
});
