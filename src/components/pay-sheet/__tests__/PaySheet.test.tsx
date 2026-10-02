import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { PaySheet, type PaySheetProps } from '..';

const charge = { label: "Fintava's charge", amountKobo: 2325 };

function props(overrides: Partial<PaySheetProps> = {}): PaySheetProps {
  return {
    item: { title: 'How I built a ₦2M a month agency', by: 'Chidi Eze', verified: true, subtitle: 'Video · 18 min' },
    amountKobo: 250000,
    details: [{ label: 'Yours', value: 'Forever, in My purchases' }],
    fees: [charge],
    wallet: { kind: 'open', balanceKobo: 48525075 },
    walletName: 'Naira wallet',
    actionLabel: 'Unlock',
    status: { kind: 'review' },
    onPay: jest.fn(),
    onAddMoney: jest.fn(),
    onOpenWallet: jest.fn(),
    onCancel: jest.fn(),
    ...overrides,
  };
}

describe('PaySheet', () => {
  it('lets a user with enough money see the breakdown and pay the total', async () => {
    const p = props();
    await render(<PaySheet {...p} />);
    expect(screen.getByText('₦2,500')).toBeTruthy();
    expect(screen.getByText("Fintava's charge")).toBeTruthy();
    expect(screen.getByText('₦23.25')).toBeTruthy();
    expect(screen.getByText('Total')).toBeTruthy();
    expect(screen.getByText('₦2,523.25')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Unlock · ₦2,523.25' }));
    expect(p.onPay).toHaveBeenCalledTimes(1);
  });

  it("shows the seller's verified tick after their name", async () => {
    await render(<PaySheet {...props()} />);
    expect(screen.getByText('Chidi Eze')).toBeTruthy();
    expect(screen.getByLabelText('Verified')).toBeTruthy();
    expect(screen.getByText('· Video · 18 min')).toBeTruthy();
  });

  it('draws no tick for a seller who is not verified', async () => {
    await render(<PaySheet {...props({ item: { title: 'A talk', by: 'Ada', subtitle: 'Audio' } })} />);
    expect(screen.queryByLabelText('Verified')).toBeNull();
  });

  it('shows a Fees subtotal when the fee has two parts, and none for one part', async () => {
    await render(
      <PaySheet
        {...props({
          amountKobo: 2500000,
          fees: [
            { label: "Fintava's charge", amountKobo: 4000 },
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
    await render(<PaySheet {...props({ fees: [{ label: "Fintava's charge", amountKobo: 0 }] })} />);
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

  it('counts a WAWU fee and the charge in both the total and the shortfall', async () => {
    const p = props({
      amountKobo: 2500000,
      fees: [
        { label: "Fintava's charge", amountKobo: 4000 },
        { label: "WAWU's fee", amountKobo: 2500 },
      ],
      wallet: { kind: 'open', balanceKobo: 2500000 },
    });
    await render(<PaySheet {...p} />);
    expect(screen.getByText('This costs ₦25,065. You have ₦25,000.00.')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Add ₦65' }));
    expect(p.onAddMoney).toHaveBeenCalledWith(6500);
  });

  it('says what the other person gets when a send has a set amount', async () => {
    await render(
      <PaySheet
        {...props({
          amountLabel: 'Amount',
          amountKobo: 2500000,
          fees: [
            { label: "Fintava's charge", amountKobo: 4000 },
            { label: "WAWU's fee", amountKobo: 2500 },
          ],
          recipientGetsKobo: 2500000,
          actionLabel: 'Send',
        })}
      />,
    );
    expect(screen.getByText('They get ₦25,000')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Send · ₦25,065' })).toBeTruthy();
  });

  it('hands a user with no wallet to "Open your wallet"', async () => {
    const p = props({ wallet: { kind: 'none' } });
    await render(<PaySheet {...p} />);
    expect(screen.getByText("You don't have a wallet yet")).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Open your wallet' }));
    expect(p.onOpenWallet).toHaveBeenCalledTimes(1);
    expect(p.onPay).not.toHaveBeenCalled();
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
});
