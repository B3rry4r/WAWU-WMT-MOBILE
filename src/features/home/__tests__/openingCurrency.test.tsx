import * as rtl from '@testing-library/react-native';

import { homeView } from '@/features/wallet/home/model';

import { MoneyCard } from '../MoneyCard';
import { moneyCard } from '../model';

/*
 * FIX-P6 L1 (CHECK-3 sixth pass, 08-home-opening.png): a person outside Nigeria whose first account is USD (R-87) saw Home's card say
 * "Naira" while the wallet was opening. The Hub's `GET /money/wallet` names the opening's own currency in `world.firstCurrency`; the card
 * names that, never Naira by default and never a guess from the phone's country.
 */

const read = <T,>(data: T | undefined) => ({ data, error: null, isPending: data === undefined });
const world = (firstCurrency: string | null) => ({ country: 'US', firstCurrency, state: 'opening' as const });

describe('Home money card while the wallet is opening: the currency being opened (FIX-P6 L1)', () => {
  it('reads the opening currency from the Hub: USD for a world opening, Naira for a Nigerian one', () => {
    const usd = moneyCard(homeView(read({ state: 'opening', account: null, world: world('USD') } as never), read(undefined)));
    expect(usd).toMatchObject({ kind: 'notice', state: 'opening', title: 'Your account is opening', currency: 'USD' });
    const gbp = moneyCard(homeView(read({ state: 'opening', account: null, world: world('GBP') } as never), read(undefined)));
    expect(gbp).toMatchObject({ currency: 'GBP' });
    const naira = moneyCard(homeView(read({ state: 'opening', account: null }), read(undefined)));
    expect(naira).toMatchObject({ kind: 'notice', state: 'opening', currency: 'NGN' });
  });

  it('names no currency when the Hub has not said which one is opening (never Naira by default)', () => {
    const unsaid = moneyCard(homeView(read({ state: 'opening', account: null, world: world(null) } as never), read(undefined)));
    expect(unsaid).toMatchObject({ kind: 'notice', state: 'opening', currency: null });
  });

  const props = {
    masked: false,
    onToggleMask: jest.fn(),
    onOpenWallet: jest.fn(),
    onRetryWallet: jest.fn(),
    onRetryBalance: jest.fn(),
    retrying: false,
    onSend: jest.fn(),
    onAdd: jest.fn(),
  };

  it('draws the Dollar flag and word on the card of a USD opening, and not Naira', async () => {
    const state = moneyCard(homeView(read({ state: 'opening', account: null, world: world('USD') } as never), read(undefined)));
    if (state.kind === 'none') throw new Error('a card');
    await rtl.render(<MoneyCard {...props} state={state} />);
    expect(rtl.screen.getByText('Dollar')).toBeTruthy();
    expect(rtl.screen.getByLabelText('Dollar')).toBeTruthy();
    expect(rtl.screen.queryByText('Naira')).toBeNull();
    expect(rtl.screen.queryByText('₦')).toBeNull();
    expect(rtl.screen.getByText('Your account is opening')).toBeTruthy();
  });

  it('draws the Naira flag and word on the card of a Naira opening', async () => {
    const state = moneyCard(homeView(read({ state: 'opening', account: null }), read(undefined)));
    if (state.kind === 'none') throw new Error('a card');
    await rtl.render(<MoneyCard {...props} state={state} />);
    expect(rtl.screen.getByText('Naira')).toBeTruthy();
    expect(rtl.screen.queryByText('Dollar')).toBeNull();
  });

  it('draws no currency chip when the Hub has not said which one is opening', async () => {
    const state = moneyCard(homeView(read({ state: 'opening', account: null, world: world(null) } as never), read(undefined)));
    if (state.kind === 'none') throw new Error('a card');
    await rtl.render(<MoneyCard {...props} state={state} />);
    expect(rtl.screen.queryByText('Naira')).toBeNull();
    expect(rtl.screen.queryByText('Dollar')).toBeNull();
    expect(rtl.screen.getByText('Your account is opening')).toBeTruthy();
  });
});
