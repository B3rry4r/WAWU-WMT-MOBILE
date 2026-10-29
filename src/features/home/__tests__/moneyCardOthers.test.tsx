import * as rtl from '@testing-library/react-native';

import { MoneyCard } from '../MoneyCard';

/*
 * D1 (owner, 26 Oct 2026): Home's money card shows the other balances a person holds, each the provider's own figure in its own currency
 * with its sign, never added into one figure, and an "Add a currency" button while the Hub offers one. A person with nothing to show and
 * nothing to add sees today's card.
 */
const base = {
  state: { kind: 'figure', kobo: 120_000 } as const,
  masked: false,
  onToggleMask: jest.fn(),
  onOpenWallet: jest.fn(),
  onRetryWallet: jest.fn(),
  onRetryBalance: jest.fn(),
  retrying: false,
  onSend: jest.fn(),
  onAdd: jest.fn(),
  onOpenBills: jest.fn(),
};
const OTHERS = [
  { code: 'USD', minor: 1_240, decimals: 2 },
  { code: 'GBP', minor: 310, decimals: 2 },
  { code: 'USDT', minor: 32_000, decimals: 2 },
] as const;

describe('Home money card: other currencies (D1)', () => {
  it('draws each other balance in its own sign beside the naira figure, with no total', async () => {
    await rtl.render(<MoneyCard {...base} others={OTHERS} />);
    expect(rtl.screen.getByLabelText('USD balance $12.40')).toBeTruthy();
    expect(rtl.screen.getByLabelText('GBP balance £3.10')).toBeTruthy();
    expect(rtl.screen.getByLabelText('USDT balance 320.00 USDT')).toBeTruthy();
    expect(rtl.screen.getByText('$12.40')).toBeTruthy();
    expect(rtl.screen.getByText('£3.10')).toBeTruthy();
    expect(rtl.screen.queryByText(/Total|total/)).toBeNull();
  });

  it('hides them behind dots with the eye, as it hides the naira figure', async () => {
    await rtl.render(<MoneyCard {...base} masked others={OTHERS} />);
    expect(rtl.screen.queryByText('$12.40')).toBeNull();
    expect(rtl.screen.getByLabelText('USD balance hidden')).toBeTruthy();
  });

  it('draws Add a currency only when it has somewhere to lead, and presses through to it', async () => {
    const onAddCurrency = jest.fn();
    await rtl.render(<MoneyCard {...base} others={[]} onAddCurrency={onAddCurrency} />);
    await rtl.fireEvent.press(rtl.screen.getByTestId('today-add-currency'));
    expect(onAddCurrency).toHaveBeenCalledTimes(1);
    await rtl.cleanup();
    await rtl.render(<MoneyCard {...base} />);
    expect(rtl.screen.queryByTestId('today-other-balances')).toBeNull();
    expect(rtl.screen.queryByTestId('today-add-currency')).toBeNull();
  });

  it('draws none of it where there is no naira figure (no wallet yet): today\'s card', async () => {
    const state = { kind: 'notice', state: 'no_wallet', title: 'Open your wallet', message: 'Takes a few minutes.', action: 'open_wallet' } as const;
    await rtl.render(<MoneyCard {...base} state={state} others={OTHERS} onAddCurrency={jest.fn()} />);
    expect(rtl.screen.queryByTestId('today-other-balances')).toBeNull();
  });
});
