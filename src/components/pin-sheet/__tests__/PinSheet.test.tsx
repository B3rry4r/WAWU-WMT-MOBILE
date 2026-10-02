import { act, render, screen, userEvent } from '@testing-library/react-native';

import { PinSheet, type PinCheckResult, type PinSheetProps } from '@/components/pin-sheet';
import { formatNaira, lockedLine } from '@/components/pin-sheet/format';

const MINUTE = 60_000;

function setup(overrides: Partial<PinSheetProps> = {}) {
  const props: PinSheetProps = {
    visible: true,
    onClose: jest.fn(),
    approval: { totalKobo: 2_506_500, payee: 'Chidinma Okoro' },
    onSubmit: jest.fn(() => Promise.resolve<PinCheckResult>({ status: 'ok' })),
    ...overrides,
  };
  return props;
}

async function enter(user: ReturnType<typeof userEvent.setup>, pin: string) {
  for (const d of pin) await user.press(screen.getByRole('button', { name: d }));
}

describe('PinSheet', () => {
  it('lets a user enter a PIN, correct a digit, and submit it', async () => {
    const user = userEvent.setup();
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

  it('shows a user their PIN was rejected and how many tries are left, then lets them try again', async () => {
    const user = userEvent.setup();
    const onSubmit = jest
      .fn<Promise<PinCheckResult>, [string]>()
      .mockResolvedValueOnce({ status: 'wrong', triesLeft: 2 })
      .mockResolvedValueOnce({ status: 'wrong', triesLeft: 1 });
    await render(<PinSheet {...setup({ onSubmit })} />);

    await enter(user, '0000');
    expect(await screen.findByText('Wrong PIN. 2 tries left.')).toBeOnTheScreen();
    expect(screen.getByLabelText('0 of 4 digits entered')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: '5' })).toBeEnabled();

    await enter(user, '1111');
    expect(await screen.findByText('Wrong PIN. 1 try left.')).toBeOnTheScreen();
    expect(onSubmit).toHaveBeenNthCalledWith(2, '1111');
  });

  it('shows a user the locked state with the wait from the server, and unlocks when it passes', async () => {
    jest.useFakeTimers({ now: new Date('2026-10-02T10:00:00Z') });
    try {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const until = new Date(Date.now() + 14 * MINUTE).toISOString();
      const onSubmit = jest.fn(() => Promise.resolve<PinCheckResult>({ status: 'locked', until }));
      await render(<PinSheet {...setup({ onSubmit })} />);

      await enter(user, '9999');
      expect(await screen.findByRole('header', { name: 'PIN locked' })).toBeOnTheScreen();
      expect(screen.getByText(/Try again in 14 minutes\./)).toBeOnTheScreen();
      expect(screen.getByRole('button', { name: '1' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled();

      await act(async () => {
        jest.advanceTimersByTime(13 * MINUTE + 30_000);
      });
      expect(screen.getByText(/Try again in 30 seconds\./)).toBeOnTheScreen();

      await act(async () => {
        jest.advanceTimersByTime(31_000);
      });
      expect(screen.getByRole('header', { name: 'Enter your PIN' })).toBeOnTheScreen();
      expect(screen.getByRole('button', { name: '1' })).toBeEnabled();
    } finally {
      jest.useRealTimers();
    }
  });

  it('opens locked when the server already locked the PIN', async () => {
    const lockedUntil = new Date(Date.now() + 3 * 60 * MINUTE);
    await render(<PinSheet {...setup({ lockedUntil })} />);
    expect(screen.getByRole('header', { name: 'PIN locked' })).toBeOnTheScreen();
    expect(screen.getByText(/Try again in 3 hours\./)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: '0' })).toBeDisabled();
  });

  it('shows a user the PIN is being checked, and takes no more digits or a close meanwhile', async () => {
    const user = userEvent.setup();
    let answer: (r: PinCheckResult) => void = () => undefined;
    const onSubmit = jest.fn(() => new Promise<PinCheckResult>((resolve) => (answer = resolve)));
    const props = setup({ onSubmit });
    await render(<PinSheet {...props} />);

    await enter(user, '4321');
    expect(screen.getByLabelText('Checking your PIN')).toBeOnTheScreen();
    expect(screen.getByLabelText('4 of 4 digits entered')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: '7' })).toBeDisabled();

    await user.press(screen.getByRole('button', { name: 'Close' }));
    expect(props.onClose).not.toHaveBeenCalled();

    await act(async () => answer({ status: 'error' }));
    expect(screen.getByText("We couldn't check your PIN. Try again.")).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: '7' })).toBeEnabled();
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('treats a failed request as an error the user can retry', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn(() => Promise.reject(new Error('network')));
    await render(<PinSheet {...setup({ onSubmit })} />);
    await enter(user, '1234');
    expect(await screen.findByText("We couldn't check your PIN. Try again.")).toBeOnTheScreen();
  });

  it('offers Face ID only when it is set up, and handles its answer like a PIN', async () => {
    const user = userEvent.setup();
    const { rerender } = await render(<PinSheet {...setup()} />);
    expect(screen.queryByRole('button', { name: 'Use Face ID' })).not.toBeOnTheScreen();

    const onPress = jest.fn(() => Promise.resolve<PinCheckResult>({ status: 'wrong', triesLeft: 3 }));
    await rerender(<PinSheet {...setup({ biometric: { label: 'Face ID', onPress } })} />);
    await user.press(screen.getByRole('button', { name: 'Use Face ID' }));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('Wrong PIN. 3 tries left.')).toBeOnTheScreen();
  });

  it('lets a user reach Forgot PIN when the payment offers it', async () => {
    const user = userEvent.setup();
    const onForgotPin = jest.fn();
    await render(<PinSheet {...setup({ onForgotPin })} />);
    await user.press(screen.getByRole('button', { name: 'Forgot PIN?' }));
    expect(onForgotPin).toHaveBeenCalledTimes(1);
  });

  it('writes the approval line with the total for a purpose (M13)', async () => {
    await render(
      <PinSheet {...setup({ approval: { totalKobo: 202_325, purpose: 'the professional tick' } })} />,
    );
    expect(screen.getByText('₦2,023.25 for the professional tick')).toBeOnTheScreen();
  });

  it('lets a user close the sheet from the scrim', async () => {
    const user = userEvent.setup();
    const props = setup();
    await render(<PinSheet {...props} />);
    await user.press(screen.getByRole('button', { name: 'Close' }));
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });
});

describe('PIN sheet copy', () => {
  it('formats kobo as naira the way the canvas writes it', () => {
    expect(formatNaira(2_506_500)).toBe('₦25,065');
    expect(formatNaira(252_325)).toBe('₦2,523.25');
    expect(formatNaira(5)).toBe('₦0.05');
  });

  it('rounds the wait up so it never reads zero while locked', () => {
    expect(lockedLine(1)).toBe('Too many wrong tries. Try again in 1 second.');
    expect(lockedLine(60_001)).toBe('Too many wrong tries. Try again in 2 minutes.');
  });
});
