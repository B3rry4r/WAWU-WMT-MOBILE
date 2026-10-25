import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { Text } from 'react-native';

import { motion } from '@/theme';

import { PaySheet, type PaySheetProps } from '..';

const charge = { label: "Bank charge", amountKobo: 2325 };

function props(overrides: Partial<PaySheetProps> = {}): PaySheetProps {
  return {
    item: { title: 'How I built a ₦2M a month agency', by: 'Chidi Eze', verified: 'pro', subtitle: 'Video · 18 min' },
    amountKobo: 250000,
    details: [{ label: 'Yours', value: 'Forever, in My purchases' }],
    fees: [charge],
    wallet: { kind: 'open', balanceKobo: 48525075 },
    walletName: 'Naira wallet',
    actionLabel: 'Unlock',
    status: { kind: 'review' },
    onPay: jest.fn(),
    onAddMoney: jest.fn(),
    onCancel: jest.fn(),
    ...overrides,
  };
}

describe('PaySheet', () => {
  it('lets a user with enough money see the breakdown and pay the total', async () => {
    const p = props();
    await render(<PaySheet {...p} />);
    expect(screen.getByText('₦2,500')).toBeTruthy();
    expect(screen.getByText("Bank charge")).toBeTruthy();
    expect(screen.getByText('₦23.25')).toBeTruthy();
    expect(screen.getByText('Total')).toBeTruthy();
    expect(screen.getByText('₦2,523.25')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Unlock · ₦2,523.25' }));
    expect(p.onPay).toHaveBeenCalledTimes(1);
  });

  it("shows the seller's verified tick after their name", async () => {
    await render(<PaySheet {...props()} />);
    expect(screen.getByText('Chidi Eze')).toBeTruthy();
    expect(screen.getByTestId('tick-pro')).toBeTruthy();
    expect(screen.getByText('· Video · 18 min')).toBeTruthy();
  });

  it('INBOX-20 L1: a header with no picture is the title alone, with no empty tile before it', async () => {
    const view = props({ item: { title: 'Pay Ada' }, wallet: { kind: 'open', balanceKobo: 100 } });
    await render(<PaySheet {...view} />);
    expect(screen.getByText('Pay Ada')).toBeTruthy();
    // The head holds the words and nothing before them: one child, the words.
    expect(screen.getByTestId('pay-sheet-head').children).toHaveLength(1);
  });

  it('SWEEP-APP-4 row 140: a header with a lead tile (S19, SC5) draws it before the words, and still no empty square', async () => {
    const view = props({ item: { title: 'Video consultation', subtitle: 'Thu 2 Oct, 12:00 · 30 min', lead: <Text testID="lead-tile">V</Text> } });
    await render(<PaySheet {...view} />);
    expect(screen.getByTestId('pay-sheet-lead-row').children).toHaveLength(2);
    expect(screen.getByTestId('pay-sheet-lead')).toContainElement(screen.getByTestId('lead-tile'));
    expect(screen.getByText('Video consultation')).toBeTruthy();
    expect(screen.queryByTestId('pay-sheet-head-image')).toBeNull();
  });

  it('SWEEP-APP-4 row 140: without a lead the header is as it was, with no lead row', async () => {
    await render(<PaySheet {...props({ item: { title: 'Pay Ada' } })} />);
    expect(screen.queryByTestId('pay-sheet-lead-row')).toBeNull();
  });

  it('a header with a picture still draws it before the title', async () => {
    await render(<PaySheet {...props({ item: { title: 'A talk', image: 'https://example.test/a.jpg' } })} />);
    expect(screen.getByTestId('pay-sheet-head').children).toHaveLength(2);
    expect(screen.getByTestId('pay-sheet-head-image')).toBeTruthy();
  });

  it('draws no tick for a seller who is not verified', async () => {
    await render(<PaySheet {...props({ item: { title: 'A talk', by: 'Ada', subtitle: 'Audio' } })} />);
    expect(screen.queryByTestId('tick-pro')).toBeNull();
    expect(screen.queryByTestId('tick-creator')).toBeNull();
  });

  it('shows a Fees subtotal when the fee has two parts, and none for one part', async () => {
    await render(
      <PaySheet
        {...props({
          amountKobo: 2500000,
          fees: [
            { label: "Bank charge", amountKobo: 4000 },
            { label: "WAWU's fee", amountKobo: 2500 },
          ],
        })}
      />,
    );
    expect(screen.getByText('Fees')).toBeTruthy();
    expect(screen.getByText('₦65')).toBeTruthy();
    expect(screen.getByText('₦25,065')).toBeTruthy();
    await screen.rerender(<PaySheet {...props()} />);
    expect(screen.queryByText('Fees')).toBeNull();
  });

  it('pays once when a user double-taps Pay', async () => {
    jest.useFakeTimers();
    try {
      const p = props();
      await render(<PaySheet {...p} />);
      const button = screen.getByRole('button', { name: 'Unlock · ₦2,523.25' });
      await fireEvent.press(button);
      await fireEvent.press(button);
      expect(p.onPay).toHaveBeenCalledTimes(1);
      await act(async () => {
        jest.runOnlyPendingTimers();
      });
      await fireEvent.press(button);
      expect(p.onPay).toHaveBeenCalledTimes(2);
    } finally {
      jest.useRealTimers();
    }
  });

  it('ignores another tap on Pay until the payment promise settles', async () => {
    let settle: () => void = () => undefined;
    const onPay = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          settle = resolve;
        }),
    );
    await render(<PaySheet {...props({ onPay })} />);
    const button = screen.getByRole('button', { name: 'Unlock · ₦2,523.25' });
    await fireEvent.press(button);
    await fireEvent.press(button);
    await fireEvent.press(button);
    expect(onPay).toHaveBeenCalledTimes(1);
    await act(async () => {
      settle();
    });
    await fireEvent.press(button);
    expect(onPay).toHaveBeenCalledTimes(2);
  });

  it('lets a user pay again once the status has moved on', async () => {
    const onPay = jest.fn(() => new Promise<void>(() => undefined));
    await render(<PaySheet {...props({ onPay })} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Unlock · ₦2,523.25' }));
    await screen.rerender(<PaySheet {...props({ onPay, status: { kind: 'paying' } })} />);
    await screen.rerender(<PaySheet {...props({ onPay, status: { kind: 'review' } })} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Unlock · ₦2,523.25' }));
    expect(onPay).toHaveBeenCalledTimes(2);
  });

  it('shows a ₦0 fee line and a total equal to the price', async () => {
    await render(<PaySheet {...props({ fees: [{ label: "Bank charge", amountKobo: 0 }] })} />);
    expect(screen.getByText('₦0')).toBeTruthy();
    expect(screen.getAllByText('₦2,500')).toHaveLength(2); // the price row and the Total row
    expect(screen.getByRole('button', { name: 'Unlock · ₦2,500' })).toBeTruthy();
  });

  it('lets a user with too little money see the shortfall and add exactly that', async () => {
    const p = props({ wallet: { kind: 'open', balanceKobo: 120000 } });
    await render(<PaySheet {...p} />);
    expect(screen.getByText('Not enough in your Naira wallet')).toBeTruthy();
    expect(screen.getByText('This costs ₦2,523.25. You have ₦1,200.00.')).toBeTruthy();
    expect(screen.getByText('Top up at least')).toBeTruthy();
    expect(screen.getByText('₦1,323.25')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Unlock/ })).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Add ₦1,323.25' }));
    expect(p.onAddMoney).toHaveBeenCalledWith(132325);
    await fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));
    expect(p.onCancel).toHaveBeenCalledTimes(1);
  });

  it('draws no Add button when the caller has no way to add money, and keeps the notice and Cancel', async () => {
    const p = props({ wallet: { kind: 'open', balanceKobo: 120000 }, onAddMoney: undefined });
    await render(<PaySheet {...p} />);
    expect(screen.getByText('Not enough in your Naira wallet')).toBeTruthy();
    expect(screen.getByText('Top up at least')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /^Add / })).toBeNull();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy();
  });

  it('counts a WAWU fee and the charge in both the total and the shortfall', async () => {
    const p = props({
      amountKobo: 2500000,
      fees: [
        { label: "Bank charge", amountKobo: 4000 },
        { label: "WAWU's fee", amountKobo: 2500 },
      ],
      wallet: { kind: 'open', balanceKobo: 2500000 },
    });
    await render(<PaySheet {...p} />);
    expect(screen.getByText('This costs ₦25,065. You have ₦25,000.00.')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Add ₦65' }));
    expect(p.onAddMoney).toHaveBeenCalledWith(6500);
  });

  const send = (): Partial<PaySheetProps> => ({
    variant: 'send',
    item: { title: 'Chidinma Adaeze Okoro', displayName: 'Chidinma Okoro', avatar: { hue: 'coral' } },
    amountKobo: 2500000,
    details: [
      { label: 'Bank', value: 'Guaranty Trust Bank' },
      { label: 'Account', value: '0123456789' },
    ],
    fees: [
      { label: "Bank charge", amountKobo: 4000 },
      { label: "WAWU's fee", amountKobo: 2500 },
    ],
    notes: [{ label: 'Note', value: 'Rent contribution' }],
    recipientGetsKobo: 2500000,
    actionLabel: 'Send',
  });

  it('lets a sender review W10: who, how much, the fees and the Total, and what they receive on the button (R2-MONEY D-02)', async () => {
    const p = props(send());
    await render(<PaySheet {...p} />);
    // The avatar is decorative (the line beside it says the name); its initials come from the short display name, as W10 draws "CO".
    expect(screen.getByText('CO', { includeHiddenElements: true })).toBeTruthy();
    expect(screen.getByText('Sending to Chidinma Adaeze Okoro')).toBeTruthy();
    expect(screen.getByText('₦25,000.00')).toBeTruthy();
    expect(screen.getByText('₦25,065.00')).toBeTruthy();
    expect(screen.queryByText(/They get/)).toBeNull();
    expect(screen.queryByRole('button', { name: 'Send ₦25,065' })).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Send ₦25,000' }));
    expect(p.onPay).toHaveBeenCalledTimes(1);
  });

  it('on a send page the status buttons sit in the foot, as the not-enough state and the canvas draw them: blocked, still confirming and failed', async () => {
    const states = [
      { kind: 'blocked', title: 'Over today’s limit', message: 'You can send ₦15,000 more today.' },
      { kind: 'confirming', line: 'Check Wallet activity for the result.' },
      { kind: 'failed', message: 'The bank turned this send down.' },
    ] as const;
    for (const status of states) {
      const { unmount } = await render(<PaySheet {...props({ ...send(), status, onRefresh: jest.fn(), onRetry: jest.fn() })} />);
      const foot = screen.getByTestId('pay-sheet-foot');
      expect(foot).toHaveStyle({ marginTop: 'auto' });
      expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
      for (const button of screen.getAllByRole('button')) expect(foot).toContainElement(button);
      await unmount();
    }
  });

  it('a still-confirming sheet says what the host gives it, and its own sentence when the host gives none', async () => {
    const { unmount } = await render(<PaySheet {...props({ ...send(), status: { kind: 'confirming', line: 'Check Wallet activity for the result.' } })} />);
    expect(screen.getByText('Check Wallet activity for the result.')).toBeTruthy();
    await unmount();
    await render(<PaySheet {...props({ ...send(), status: { kind: 'confirming' } })} />);
    expect(screen.getByText(/hasn't been confirmed yet/)).toBeTruthy();
  });

  it('shows every send amount with its kobo faded, as W10 draws it', async () => {
    await render(<PaySheet {...props(send())} />);
    for (const whole of ['₦40.00', '₦25.00', '₦65.00', '₦25,065.00']) expect(screen.getByText(whole)).toBeTruthy();
    const kobo = screen.getAllByText('.00');
    expect(kobo.length).toBeGreaterThanOrEqual(5);
    for (const k of kobo) expect(k).toHaveStyle({ opacity: 0.5 });
  });

  it('puts the Note after Total on a send, as W10 does', async () => {
    await render(<PaySheet {...props(send())} />);
    const labels = screen
      .getAllByText(/^(Bank|Account|Bank charge|WAWU's fee|Fees|Total|Note)$/)
      .map((n) => n.props.children);
    expect(labels).toEqual(['Bank', 'Account', "Bank charge", "WAWU's fee", 'Fees', 'Total', 'Note']);
    expect(screen.queryByText('Price')).toBeNull();
  });

  it('clears the double-tap guard when the sheet closes', async () => {
    const set = jest.spyOn(global, 'setTimeout');
    const clear = jest.spyOn(global, 'clearTimeout');
    try {
      await render(<PaySheet {...props()} />);
      await fireEvent.press(screen.getByRole('button', { name: 'Unlock · ₦2,523.25' }));
      const guard = set.mock.results[set.mock.calls.findIndex((c) => c[1] === motion.slow)];
      expect(guard).toBeDefined();
      await screen.unmount();
      expect(clear).toHaveBeenCalledWith(guard.value);
    } finally {
      set.mockRestore();
      clear.mockRestore();
    }
  });

  it('shows a user with no wallet no balance and no Pay button', async () => {
    const p = props({ wallet: { kind: 'none' } });
    await render(<PaySheet {...p} />);
    expect(screen.getByText("You don't have a wallet yet")).toBeTruthy();
    expect(screen.queryByText(/available/)).toBeNull();
    expect(screen.queryByText(/485,250/)).toBeNull();
    expect(screen.queryByRole('button', { name: /Unlock|Pay|Open your wallet/ })).toBeNull();
    expect(p.onPay).not.toHaveBeenCalled();
  });

  it('lets a user with ₦5,000 unlock a ₦2,500 piece for ₦2,523.25 (BRIEF H14)', async () => {
    const p = props({ wallet: { kind: 'open', balanceKobo: 500000 } });
    await render(<PaySheet {...p} />);
    expect(screen.getByText('₦2,500')).toBeTruthy();
    expect(screen.getByText('₦23.25')).toBeTruthy();
    expect(screen.getByText('₦2,523.25')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Unlock · ₦2,523.25' }));
    expect(p.onPay).toHaveBeenCalledTimes(1);
  });

  it('does not let a user pay twice while the payment is going through', async () => {
    const p = props({ status: { kind: 'paying' } });
    await render(<PaySheet {...p} />);
    const button = screen.getByRole('button', { name: 'Paying' });
    expect(button).toBeDisabled();
    await fireEvent.press(button);
    expect(p.onPay).not.toHaveBeenCalled();
  });

  it('does not let a user pay before the balance has loaded', async () => {
    await render(<PaySheet {...props({ wallet: { kind: 'loading' } })} />);
    expect(screen.getByText('Checking your balance')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Unlock · ₦2,523.25' })).toBeDisabled();
  });

  it('lets a user whose payment is still confirming check again', async () => {
    const p = props({ status: { kind: 'confirming' }, onRefresh: jest.fn(), onContactSupport: jest.fn() });
    await render(<PaySheet {...p} />);
    expect(screen.getByText('Still confirming')).toBeTruthy();
    expect(screen.getByText(/₦2,523\.25 hasn't been confirmed yet/)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Refresh' }));
    expect(p.onRefresh).toHaveBeenCalledTimes(1);
    await fireEvent.press(screen.getByRole('button', { name: 'Contact support' }));
    expect(p.onContactSupport).toHaveBeenCalledTimes(1);
  });

  it('lets a user whose payment failed read why and try again', async () => {
    const p = props({ status: { kind: 'failed', message: 'The bank is not responding.' }, onRetry: jest.fn() });
    await render(<PaySheet {...p} />);
    expect(screen.getByText("Payment didn't go through")).toBeTruthy();
    expect(screen.getByText('The bank is not responding.')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(p.onRetry).toHaveBeenCalledTimes(1);
    await fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));
    expect(p.onCancel).toHaveBeenCalledTimes(1);
  });

  it('shows a blocked payment as a warning with Cancel only: nothing was tried, so no failed mark and no "didn\'t go through"', async () => {
    const p = props({ status: { kind: 'blocked', title: 'Over today’s limit', message: 'You can send ₦15,000 more today.' }, onRetry: jest.fn() });
    await render(<PaySheet {...p} />);
    expect(screen.getByText('Over today’s limit')).toBeTruthy();
    expect(screen.getByText('You can send ₦15,000 more today.')).toBeTruthy();
    expect(screen.queryByText("Payment didn't go through")).toBeNull();
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));
    expect(p.onCancel).toHaveBeenCalledTimes(1);
  });

  it('offers Try again on a blocked payment only when the host asks for it', async () => {
    const p = props({ status: { kind: 'blocked', title: 'We couldn’t work out the total', message: 'Try again.', tryAgain: true }, onRetry: jest.fn() });
    await render(<PaySheet {...p} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(p.onRetry).toHaveBeenCalledTimes(1);
  });
});
