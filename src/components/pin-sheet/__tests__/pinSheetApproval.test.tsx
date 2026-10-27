import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { PinSheet, type BiometricResult, type PinSheetProps } from '@/components/pin-sheet';
import { approvalLine } from '@/components/pin-sheet/format';

/*
 * FIX-108 (SHARED-CHANGES WALLET-06 #1 and WALLET-02 #5): the PIN sheet with no amount, and the two answers a fingerprint or face
 * approval can add to the sheet's own (no answer, and a PIN lock that refuses a passed approval).
 */
jest.mock('expo-local-authentication', () => ({
  AuthenticationType: { FINGERPRINT: 1, FACIAL_RECOGNITION: 2, IRIS: 3 },
  hasHardwareAsync: jest.fn(),
  isEnrolledAsync: jest.fn(),
  supportedAuthenticationTypesAsync: jest.fn(),
}));

function open(over: Partial<PinSheetProps> & { answer?: BiometricResult }) {
  const { answer, ...rest } = over;
  const props: PinSheetProps = {
    visible: true,
    onClose: jest.fn(),
    approval: { totalKobo: 2_502_575, payee: 'Amaka Nwosu' },
    onSubmit: jest.fn(async () => ({ code: 'approved' as const })),
    unansweredLine: "We didn't get an answer. Try again: it will only happen once.",
    biometric: { kind: 'fingerprint', onPress: jest.fn(async () => answer ?? { code: 'approved' as const }) },
    ...rest,
  };
  return render(<PinSheet {...props} />);
}

const press = async (name: string) => {
  await act(async () => {
    fireEvent.press(screen.getByRole('button', { name }));
  });
};

describe('PIN sheet · fingerprint or face (FIX-108)', () => {
  it('a sheet that moves no money says its purpose in place of an amount', async () => {
    expect(approvalLine({ purpose: 'Turn on fingerprint for payments' })).toBe('Turn on fingerprint for payments');
    expect(approvalLine({ totalKobo: 2_502_575, purpose: 'the professional tick' })).toBe('₦25,025.75 for the professional tick');
    // PAY-FX (R-91): a payment from another currency says what leaves the account, in its sign, not the naira price.
    expect(approvalLine({ totalKobo: 30_000, payee: 'Chidi Eze', amountText: '$1.90' })).toBe('Approve $1.90 to Chidi Eze');
    expect(approvalLine({ totalKobo: 30_000, purpose: 'a video call', amountText: '£1.50' })).toBe('£1.50 for a video call');
    await open({ approval: { purpose: 'Turn on fingerprint for payments' } });
    expect(await screen.findByText('Turn on fingerprint for payments')).toBeTruthy();
    expect(screen.queryByText(/₦/)).toBeNull();
  });

  it('an approval that got no answer says so and keeps the keypad, with no "failed" line', async () => {
    await open({ answer: { code: 'unanswered' } });
    await press('Use fingerprint');
    expect(await screen.findByText("We didn't get an answer. Try again: it will only happen once.")).toBeTruthy();
    expect(screen.queryByText(/failed/)).toBeNull();
    expect(screen.getByRole('button', { name: '1' })).toBeTruthy();
  });

  it('an approval the locked PIN refuses shows the lock, not "failed"', async () => {
    await open({ answer: { code: 'pin_locked', lockedUntil: new Date(Date.now() + 25 * 60_000).toISOString() } });
    await press('Use fingerprint');
    expect(await screen.findByText('PIN locked')).toBeTruthy();
    expect(screen.queryByText(/failed/)).toBeNull();
  });
});
