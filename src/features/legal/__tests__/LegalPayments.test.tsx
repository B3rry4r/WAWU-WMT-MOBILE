/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import { userEvent } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { Linking, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { hub, installHub, OPTIONS, R1, request, resetHub } from '../testing/legalHub';

/*
 * Booking and paying a consultation (LEGAL-04: S18, S19, S20, S25) and the quote, the letter, the fee to start, the documents and the fixed-price request
 * (LEGAL-06: S21 to S24, S26), on the real screens with the Hub as a stand-in `fetch` installed before the app's modules load. The stand-in keeps the
 * Hub's rules for a payment: a key it knows is answered with the first payment, and a debit is counted once per key.
 */
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));
jest.mock('@/features/open-wallet/sessionAccount', () => ({ useSessionAccount: () => 'owner-1' }));
const mockCalendar = jest.fn(async (_event: unknown) => ({ action: 'done' }));
jest.mock('expo-calendar/legacy', () => ({ createEventInCalendarAsync: (event: unknown) => mockCalendar(event) }));

installHub();
const { BookScreen } = require('../book/BookScreen') as typeof import('../book/BookScreen');
const { MatterScreen } = require('../matter/MatterScreen') as typeof import('../matter/MatterScreen');
const { FixedPriceScreen } = require('../fixed/FixedPriceScreen') as typeof import('../fixed/FixedPriceScreen');
void View;

rtl.configure({ asyncUtilTimeout: 5000 });

beforeAll(async () => {
  const warm = await rtl.render(<View />);
  warm.unmount();
});
beforeEach(() => {
  (require('@/features/money-attempt/attempts') as typeof import('@/features/money-attempt/attempts')).forgetAttempts();
  resetHub();
  mockCalendar.mockClear();
});

const clients: QueryClient[] = [];
afterEach(() => {
  clients.splice(0).forEach((c) => c.clear());
});

async function render(child: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } } });
  clients.push(client);
  return rtl.render(
    <QueryClientProvider client={client}>
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>{child}</SafeAreaProvider>
    </QueryClientProvider>,
  );
}

const wallet = () => ({ onOpenWallet: jest.fn(), onSetPin: jest.fn(), onForgotPin: jest.fn(), onAddMoney: jest.fn() });

async function enterPin(pin: string) {
  const user = userEvent.setup();
  for (const d of pin) await user.press(await rtl.screen.findByRole('button', { name: d }));
}

const press = (id: string) => rtl.fireEvent.press(rtl.screen.getByTestId(id));

describe('S18 · Book', () => {
  async function boot(w = wallet()) {
    const onBooked = jest.fn();
    await render(<BookScreen requestId={R1} onBack={jest.fn()} onBooked={onBooked} wallet={w} />);
    await rtl.screen.findByTestId('legal-medium-zoom');
    // The calendar for a video call is read after the cards: nothing is picked before it is on screen.
    await rtl.screen.findByTestId('legal-slot-12:00');
    return { onBooked, w };
  }

  it('a user sees each kind with the length and price WAWU set, picks a day and a time, and Pay shows the price', async () => {
    await boot();
    expect(rtl.screen.getByText('Video call')).toBeTruthy();
    expect(rtl.screen.getByText('30 minutes')).toBeTruthy();
    expect(rtl.screen.getByText('Phone call')).toBeTruthy();
    expect(rtl.screen.getByText('20 minutes')).toBeTruthy();
    expect(rtl.screen.getByText('Arranged by email, fee per matter')).toBeTruthy();
    expect(rtl.screen.getByText('On request')).toBeTruthy();
    // Nothing is picked yet: Pay waits for an hour.
    expect(rtl.screen.getByTestId('legal-book-pay').props.accessibilityState.disabled).toBe(true);
    // A taken hour stays on the grid and cannot be picked.
    expect(rtl.screen.getByTestId('legal-slot-09:00').props.accessibilityState.disabled).toBe(true);
    await press('legal-slot-12:00');
    expect(rtl.screen.getByTestId('legal-picked').props.children).toBe('Fri 2 Oct, 12:00 (Lagos time)');
    expect(rtl.screen.getByRole('button', { name: 'Pay ₦15,000' }).props.accessibilityState.disabled).toBeFalsy();
  });

  it('a user who taps Pay twice holds the hour once, is quoted once, and sees the price, the bank charge and the total on the sheet', async () => {
    await boot();
    await press('legal-slot-12:00');
    // The second tap lands while the first is still under way (the Hub has not answered the hold).
    let release!: () => void;
    hub.bookGate = new Promise<void>((resolve) => {
      release = resolve;
    });
    await press('legal-book-pay');
    await press('legal-book-pay');
    release();
    await rtl.screen.findByText('Bank charge');
    expect(hub.bookings).toEqual([{ medium: 'zoom', scheduledFor: '2099-10-02T11:00:00.000Z' }]);
    expect(hub.quoteCalls).toBe(1);
    expect(rtl.screen.getByText('Video consultation')).toBeTruthy();
    // SWEEP-APP-4 row 140: S19's head draws the call's icon tile before the words.
    expect(rtl.screen.getByTestId('pay-sheet-lead-row')).toBeTruthy();
    expect(rtl.screen.getByTestId('pay-sheet-lead')).toBeTruthy();
    expect(rtl.screen.getByText('Total')).toBeTruthy();
    expect(rtl.screen.getByRole('button', { name: 'Pay · ₦15,015.75' })).toBeTruthy();
  });

  async function reachPin() {
    await press('legal-slot-12:00');
    await press('legal-book-pay');
    await rtl.fireEvent.press(await rtl.screen.findByRole('button', { name: 'Pay · ₦15,015.75' }));
    await rtl.screen.findByText(/^₦15,015.75 for your consultation/);
  }

  it('a user pays with the PIN: the debit is the quote total, with one Idempotency-Key and the PIN in its header, and the matter opens', async () => {
    const { onBooked } = await boot();
    await reachPin();
    await enterPin('4829');
    await rtl.waitFor(() => expect(onBooked).toHaveBeenCalledTimes(1));
    expect(hub.pays).toHaveLength(1);
    expect(hub.pays[0].pin).toBe('4829');
    expect(hub.pays[0].key).toBeTruthy();
    expect(hub.pays[0].body).toEqual({ expectedTotalKobo: 1_501_575, quoteToken: 'tok-2' });
    expect(hub.payments).toBe(1);
  });

  it('a wrong PIN moves nothing, and the PIN typed again goes with the SAME key: one debit', async () => {
    hub.wrongFirst = true;
    const { onBooked } = await boot();
    await reachPin();
    await enterPin('1111');
    await rtl.screen.findByText(/Wrong PIN/);
    expect(hub.payments).toBe(0);
    await enterPin('4829');
    await rtl.waitFor(() => expect(onBooked).toHaveBeenCalled());
    expect(hub.pays).toHaveLength(2);
    expect(hub.pays[1].key).toBe(hub.pays[0].key);
    expect(hub.pays[1].body).toEqual(hub.pays[0].body);
    expect(hub.payments).toBe(1);
  });

  it('a lost answer, then the PIN again: the same key goes again and the Hub debits once', async () => {
    hub.mode = 'lost_after';
    const { onBooked } = await boot();
    await reachPin();
    await enterPin('4829');
    // The Hub took the payment and its answer never came: the keypad asks again, and nothing says it failed.
    await rtl.waitFor(() => expect(hub.pays).toHaveLength(1));
    expect(onBooked).not.toHaveBeenCalled();
    await enterPin('4829');
    await rtl.waitFor(() => expect(onBooked).toHaveBeenCalledTimes(1));
    expect(hub.pays).toHaveLength(2);
    expect(hub.pays[1].key).toBe(hub.pays[0].key);
    expect(hub.payments).toBe(1);
  });

  it('F3: the answer was lost and the person LEFT the page; paying the same fee when they come back sends the same key, and the Hub debits once', async () => {
    hub.mode = 'lost_after';
    await boot();
    await reachPin();
    await enterPin('4829');
    await rtl.waitFor(() => expect(hub.pays).toHaveLength(1));
    // The wait ends, the person leaves the booking page and opens it again for the same consultation.
    await rtl.cleanup();
    const { onBooked } = await boot();
    await reachPin();
    await enterPin('4829');
    await rtl.waitFor(() => expect(onBooked).toHaveBeenCalledTimes(1));
    expect(hub.pays).toHaveLength(2);
    expect(hub.pays[1].key).toBe(hub.pays[0].key);
    expect(hub.pays[1].body).toEqual(hub.pays[0].body);
    expect(hub.payments).toBe(1);
  });

  it('F3: a fee that moved while the person was away is another payment, under a new key and the new total', async () => {
    hub.mode = 'lost_after';
    // Two quotes for the first visit (the sheet opens, Pay asks again), then the fee is 16,000 for the visit after.
    hub.prices = [1_500_000, 1_500_000, 1_600_000];
    await boot();
    await reachPin();
    await enterPin('4829');
    await rtl.waitFor(() => expect(hub.pays).toHaveLength(1));
    await rtl.cleanup();
    const { onBooked } = await boot();
    await press('legal-slot-12:00');
    await press('legal-book-pay');
    await rtl.fireEvent.press(await rtl.screen.findByRole('button', { name: 'Pay · ₦16,015.75' }));
    await rtl.screen.findByText(/^₦16,015.75 for your consultation/);
    await enterPin('4829');
    await rtl.waitFor(() => expect(onBooked).toHaveBeenCalledTimes(1));
    expect(hub.pays).toHaveLength(2);
    expect(hub.pays[1].key).not.toBe(hub.pays[0].key);
    expect(hub.pays[1].body.expectedTotalKobo).toBe(1_601_575);
  });

  it('a short balance is the bank figure on the sheet, with the amount to add, and nothing is debited', async () => {
    hub.mode = 'short';
    await boot();
    await reachPin();
    await enterPin('4829');
    await rtl.screen.findByText('Not enough in your Naira wallet');
    expect(rtl.screen.getByText(/You have ₦5,000.00/)).toBeTruthy();
    expect(hub.payments).toBe(0);
  });

  it('a price that moved with the stage is asked for again, shown, and never sent to the PIN on the old total', async () => {
    hub.prices = [1_500_000, 1_600_000];
    await boot();
    await press('legal-slot-12:00');
    await press('legal-book-pay');
    await rtl.fireEvent.press(await rtl.screen.findByRole('button', { name: 'Pay · ₦15,015.75' }));
    await rtl.screen.findByText('The price changed. Check the new total before you pay.');
    expect(hub.pays).toHaveLength(0);
    expect(rtl.screen.queryByText(/for your consultation/)).toBeNull();
    // The sheet now draws the new total.
    expect(await rtl.screen.findByRole('button', { name: 'Pay · ₦16,015.75' })).toBeTruthy();
  });

  it('a total the Hub refuses with quote_changed shows the new quote and charges nothing', async () => {
    hub.mode = 'changed';
    hub.prices = [1_500_000, 1_500_000, 1_700_000];
    await boot();
    await reachPin();
    await enterPin('4829');
    await rtl.screen.findByText('The price changed. Check the new total before you pay.');
    expect(hub.payments).toBe(0);
    expect(await rtl.screen.findByRole('button', { name: 'Pay · ₦17,015.75' })).toBeTruthy();
  });

  it('a request cancelled before paying says so in the Hub\'s words and opens no PIN', async () => {
    hub.quoteRefusal = { status: 409, reason: { code: 'target_not_payable', message: 'This request was cancelled.' } };
    await boot();
    await press('legal-slot-12:00');
    await press('legal-book-pay');
    expect(await rtl.screen.findByText('This request was cancelled.')).toBeTruthy();
    expect(hub.pays).toHaveLength(0);
    expect(rtl.screen.queryByText(/for your consultation/)).toBeNull();
  });

  it('a user with no wallet who taps Pay lands in Open your wallet (R-6)', async () => {
    hub.quoteRefusal = { status: 409, reason: { code: 'wallet_not_open', message: 'Open your wallet first.' } };
    const w = wallet();
    await boot(w);
    await press('legal-slot-12:00');
    await press('legal-book-pay');
    await rtl.waitFor(() => expect(w.onOpenWallet).toHaveBeenCalledTimes(1));
    expect(hub.pays).toHaveLength(0);
  });

  it('an hour that has just been taken is the Hub\'s sentence, and the calendar is read again', async () => {
    hub.bookFails = { status: 409, reason: { code: 'conflict', message: 'That time has just been taken. Pick another.' } };
    await boot();
    await press('legal-slot-12:00');
    await press('legal-book-pay');
    expect(await rtl.screen.findByText('That time has just been taken. Pick another.')).toBeTruthy();
    expect(hub.quoteCalls).toBe(0);
  });
});

describe('S18 · a price or a request that changes under the page', () => {
  async function boot() {
    await render(<BookScreen requestId={R1} onBack={jest.fn()} onBooked={jest.fn()} wallet={wallet()} />);
    await rtl.screen.findByTestId('legal-medium-zoom');
    await rtl.screen.findByTestId('legal-slot-12:00');
  }

  it('the card and the button follow a price WAWU changed while the sheet was open', async () => {
    hub.prices = [1_500_000, 1_600_000];
    await boot();
    await press('legal-slot-12:00');
    await press('legal-book-pay');
    const sheetPay = await rtl.screen.findByRole('button', { name: 'Pay · ₦15,015.75' });
    // Admin sets the new price while the sheet is open: the next quote carries it, and the Hub's options say it too.
    hub.options = OPTIONS.map((o) => (o.medium === 'zoom' ? { ...o, priceKobo: 1_600_000 } : o));
    await rtl.fireEvent.press(sheetPay);
    await rtl.screen.findByText('The price changed. Check the new total before you pay.');
    expect(await rtl.screen.findByRole('button', { name: 'Pay · ₦16,015.75' })).toBeTruthy();
    // The page under the sheet follows: the card and the button say the new price, and the old one is nowhere.
    expect(await rtl.screen.findByRole('button', { name: 'Pay ₦16,000', hidden: true })).toBeTruthy();
    expect(rtl.screen.getByTestId('legal-medium-zoom', { hidden: true }).props.accessibilityLabel).toContain('₦16,000');
    expect(rtl.screen.queryByRole('button', { name: 'Pay ₦15,000', hidden: true })).toBeNull();
  });

  it('a request the Hub says is cancelled draws no Pay under its sentence, and picking another hour asks again', async () => {
    hub.quoteRefusal = { status: 409, reason: { code: 'target_not_payable', message: 'This request was cancelled.' } };
    await boot();
    await press('legal-slot-12:00');
    await press('legal-book-pay');
    expect(await rtl.screen.findByText('This request was cancelled.')).toBeTruthy();
    expect(rtl.screen.queryByTestId('legal-book-pay')).toBeNull();
    expect(rtl.screen.queryByRole('button', { name: /^Pay/ })).toBeNull();
    expect(hub.pays).toHaveLength(0);
    // A different pick is a new question: Pay is drawn again and the old sentence goes.
    hub.quoteRefusal = null;
    await press('legal-slot-14:00');
    expect(rtl.screen.queryByText('This request was cancelled.')).toBeNull();
    expect(await rtl.screen.findByRole('button', { name: 'Pay ₦15,000' })).toBeTruthy();
  });

  it('a price that could not be asked for for another reason keeps Pay, so the person can try again', async () => {
    hub.quoteRefusal = { status: 503, reason: { code: 'provider_unreachable', message: 'The bank is not answering. Try again.' } };
    await boot();
    await press('legal-slot-12:00');
    await press('legal-book-pay');
    expect(await rtl.screen.findByText('The bank is not answering. Try again.')).toBeTruthy();
    expect(rtl.screen.getByRole('button', { name: 'Pay ₦15,000' })).toBeTruthy();
  });
});

describe('S25 · No slots, and in person', () => {
  it('with no hour free the screen says so, and Request in person records the request and opens the matter', async () => {
    hub.days = [{ date: '2099-10-02', slots: [{ startsAt: '2099-10-02T08:00:00.000Z', available: false }] }];
    const onBooked = jest.fn();
    await render(<BookScreen requestId={R1} onBack={jest.fn()} onBooked={onBooked} wallet={wallet()} />);
    expect(await rtl.screen.findByText('No slots in the next three weeks')).toBeTruthy();
    expect(rtl.screen.getByText("Choose in person and we'll arrange a time by email.")).toBeTruthy();
    await press('legal-book-pay');
    await rtl.waitFor(() => expect(onBooked).toHaveBeenCalledTimes(1));
    expect(hub.bookings).toEqual([{ medium: 'physical' }]);
    expect(hub.quoteCalls).toBe(0);
  });

  it('In person, priced per matter, offers Request in person and no hours', async () => {
    const onBooked = jest.fn();
    await render(<BookScreen requestId={R1} onBack={jest.fn()} onBooked={onBooked} wallet={wallet()} />);
    await rtl.fireEvent.press(await rtl.screen.findByTestId('legal-medium-physical'));
    expect(rtl.screen.queryByTestId('legal-book-when')).toBeNull();
    expect(rtl.screen.getByRole('button', { name: 'Request in person' })).toBeTruthy();
  });

  it('draws no card for a kind WAWU has not priced and switched on, and says so when none is', async () => {
    hub.options = [];
    await render(<BookScreen requestId={R1} onBack={jest.fn()} onBooked={jest.fn()} wallet={wallet()} />);
    expect(await rtl.screen.findByText('No consultations right now')).toBeTruthy();
    expect(rtl.screen.queryByTestId('legal-book-pay')).toBeNull();
  });
});

describe('S20 · Booked', () => {
  const booked = () =>
    request({ status: 'consultation_scheduled', consultationMedium: 'zoom', consultationFee: 15000, consultationPaidAt: '2099-09-20T09:00:00.000Z', scheduledFor: '2099-10-02T11:00:00.000Z' });

  it('a user sees the steps, the hour and the kind, and can add it to the calendar', async () => {
    hub.req = booked();
    await render(<MatterScreen requestId={R1} onBack={jest.fn()} wallet={wallet()} />);
    expect(await rtl.screen.findByText('Consultation booked.')).toBeTruthy();
    expect(rtl.screen.getByText('Fri 2 Oct, 12:00 · video')).toBeTruthy();
    expect(rtl.screen.getByText('Answers read by your consultant')).toBeTruthy();
    expect(rtl.screen.getByTestId('legal-step-consultation').props.accessibilityLabel).toMatch(/now$/);
    expect(rtl.screen.getByTestId('legal-step-sent').props.accessibilityLabel).toMatch(/done$/);
    await press('legal-add-calendar');
    await rtl.waitFor(() => expect(mockCalendar).toHaveBeenCalledTimes(1));
    expect(mockCalendar.mock.calls[0][0]).toMatchObject({ title: 'Tenancy agreement review consultation' });
  });

  it('a request closed by WAWU says so and asks for nothing', async () => {
    hub.req = request({ status: 'cancelled', cancellationReason: 'The consultant is unavailable.', cancelledAt: '2099-09-21T09:00:00.000Z' });
    await render(<MatterScreen requestId={R1} onBack={jest.fn()} wallet={wallet()} />);
    expect(await rtl.screen.findByText('The consultant is unavailable.')).toBeTruthy();
    expect(rtl.screen.queryByTestId('legal-sign')).toBeNull();
    expect(rtl.screen.queryByTestId('legal-pay-start')).toBeNull();
  });
});

describe('S21 · Quote and sign, S22 · Pay to start', () => {
  const quoted = () => request({ status: 'quoted', consultationPaidAt: '2099-09-20T09:00:00.000Z', quoteAmount: 45000 });

  async function toPay() {
    hub.req = quoted();
    hub.stage = 'service';
    hub.prices = [4_500_000];
    await render(<MatterScreen requestId={R1} onBack={jest.fn()} wallet={wallet()} />);
    await rtl.screen.findByTestId('legal-quote');
    expect(rtl.screen.getByTestId('legal-quote-amount')).toBeTruthy();
    await press('legal-read-letter');
    expect(await rtl.screen.findByText(/ENGAGEMENT LETTER/)).toBeTruthy();
    await press('legal-letter-close');
    expect(rtl.screen.getByTestId('legal-sign').props.accessibilityState.disabled).toBe(true);
    await rtl.fireEvent.changeText(rtl.screen.getByTestId('legal-sign-name'), 'Lennox Emmanuel');
    await press('legal-sign');
    await rtl.screen.findByTestId('legal-fee-card');
  }

  it('a user reads the letter, types their full name, signs, then sees the price, the bank charge and the total', async () => {
    await toPay();
    expect(hub.signs).toEqual([{ fullName: 'Lennox Emmanuel' }]);
    expect(rtl.screen.getByText('Signed as')).toBeTruthy();
    expect(rtl.screen.getByText('Lennox Emmanuel')).toBeTruthy();
    expect(rtl.screen.getByText('Price')).toBeTruthy();
    expect(rtl.screen.getByText('Bank charge')).toBeTruthy();
    expect(await rtl.screen.findByRole('button', { name: 'Pay ₦45,015.75 to start' })).toBeTruthy();
    expect(rtl.screen.getByText('Pay from wallet')).toBeTruthy();
  });

  it('a user pays to start with the PIN: one debit of the total, the matter moves to the documents step', async () => {
    await toPay();
    await rtl.fireEvent.press(await rtl.screen.findByRole('button', { name: 'Pay ₦45,015.75 to start' }));
    await rtl.screen.findByText(/^₦45,015.75 for starting your request/);
    await enterPin('4829');
    await rtl.waitFor(() => expect(hub.payments).toBe(1));
    expect(hub.pays[0].body).toMatchObject({ expectedTotalKobo: 4_501_575 });
    expect(hub.pays[0].pin).toBe('4829');
    await rtl.waitFor(() => expect(rtl.screen.getByTestId('legal-step-delivered').props.accessibilityLabel).toMatch(/now$/));
    expect(rtl.screen.queryByTestId('legal-pay-start')).toBeNull();
  });

  it('a payment the Hub took and has not finished says it is still confirming and is never asked for again', async () => {
    hub.mode = 'pending';
    await toPay();
    await rtl.fireEvent.press(await rtl.screen.findByRole('button', { name: 'Pay ₦45,015.75 to start' }));
    await rtl.screen.findByText(/^₦45,015.75 for starting your request/);
    await enterPin('4829');
    expect(await rtl.screen.findByTestId('legal-fee-confirming')).toBeTruthy();
    expect(hub.payments).toBe(1);
    expect(rtl.screen.queryByTestId('legal-pay-start')).toBeNull();
  });

  it('a request cancelled before the fee is paid draws no price and no Pay, only the Hub\'s sentence', async () => {
    hub.req = request({ status: 'contract_signed', contractSigned: true, contractSignedAs: 'Lennox Emmanuel', quoteAmount: 45000 });
    hub.stage = 'service';
    hub.quoteRefusal = { status: 409, reason: { code: 'target_not_payable', message: 'This request was cancelled.' } };
    await render(<MatterScreen requestId={R1} onBack={jest.fn()} wallet={wallet()} />);
    expect(await rtl.screen.findByTestId('legal-fee-problem')).toBeTruthy();
    expect(rtl.screen.getByText('This request was cancelled.')).toBeTruthy();
    // A Pay that cannot work is not drawn, not even greyed (S4 round 2, F1).
    expect(rtl.screen.queryByTestId('legal-pay-start')).toBeNull();
    expect(rtl.screen.queryByTestId('legal-fee-card')).toBeNull();
    expect(hub.pays).toHaveLength(0);
  });

  const requoted = (amountNaira: number) => {
    hub.req = { ...hub.req, status: 'quoted', quoteAmount: amountNaira };
  };
  const reread = () => rtl.act(async () => void (await clients[0].invalidateQueries({ queryKey: ['legal', 'request', R1] })));

  it('a quote changed after signing: a tap on Pay drops the old price and the Pay, reads the matter again and says what the Hub now says', async () => {
    await toPay();
    expect(await rtl.screen.findByRole('button', { name: 'Pay ₦45,015.75 to start' })).toBeTruthy();
    // Ops quotes again: the Hub's request moves back to quoted and it will take no fee for the signed letter.
    requoted(52000);
    hub.quoteRefusal = { status: 409, reason: { code: 'target_not_payable', message: 'There is no fee to pay on this request now.' } };
    await press('legal-pay-start');
    expect(await rtl.screen.findByText('There is no fee to pay on this request now.')).toBeTruthy();
    expect(rtl.screen.getByText('Nothing to pay right now')).toBeTruthy();
    expect(rtl.screen.queryByTestId('legal-fee-card')).toBeNull();
    expect(rtl.screen.queryByText('Price')).toBeNull();
    expect(rtl.screen.queryByTestId('legal-pay-start')).toBeNull();
    expect(rtl.screen.queryByRole('button', { name: /to start/ })).toBeNull();
    expect(hub.pays).toHaveLength(0);
    expect(hub.payments).toBe(0);
  });

  it('a quote changed while the page is open: the old price and the Pay go without a tap, and the matter is read again', async () => {
    await toPay();
    expect(await rtl.screen.findByRole('button', { name: 'Pay ₦45,015.75 to start' })).toBeTruthy();
    const reads = (globalThis.fetch as jest.Mock).mock.calls.filter(([u]) => String(u instanceof Request ? u.url : u).endsWith(`/legal/requests/${R1}`)).length;
    requoted(52000);
    hub.quoteRefusal = { status: 409, reason: { code: 'target_not_payable', message: 'There is no fee to pay on this request now.' } };
    await reread();
    expect(await rtl.screen.findByText('There is no fee to pay on this request now.')).toBeTruthy();
    expect(rtl.screen.queryByTestId('legal-fee-card')).toBeNull();
    expect(rtl.screen.queryByTestId('legal-pay-start')).toBeNull();
    const after = (globalThis.fetch as jest.Mock).mock.calls.filter(([u]) => String(u instanceof Request ? u.url : u).endsWith(`/legal/requests/${R1}`)).length;
    expect(after).toBeGreaterThan(reads);
    expect(hub.pays).toHaveLength(0);
  });

  it('a quote changed while the page is open and the Hub still takes a fee: the page shows the new price and says it changed', async () => {
    await toPay();
    expect(await rtl.screen.findByRole('button', { name: 'Pay ₦45,015.75 to start' })).toBeTruthy();
    hub.req = { ...hub.req, quoteAmount: 52000 };
    hub.prices = [5_200_000];
    hub.quoteCalls = 0;
    await reread();
    expect(await rtl.screen.findByRole('button', { name: 'Pay ₦52,015.75 to start' })).toBeTruthy();
    expect(rtl.screen.queryByRole('button', { name: 'Pay ₦45,015.75 to start' })).toBeNull();
    expect(rtl.screen.getByText('The price changed. Check the new total before you pay.')).toBeTruthy();
  });

  it('a user with no wallet is offered Open your wallet in Pay\'s place (R-6)', async () => {
    hub.req = request({ status: 'contract_signed', contractSigned: true, contractSignedAs: 'Lennox Emmanuel', quoteAmount: 45000 });
    hub.stage = 'service';
    hub.quoteRefusal = { status: 409, reason: { code: 'wallet_not_open', message: 'Open your wallet first.' } };
    const w = wallet();
    await render(<MatterScreen requestId={R1} onBack={jest.fn()} wallet={w} />);
    await rtl.fireEvent.press(await rtl.screen.findByTestId('legal-open-wallet'));
    expect(w.onOpenWallet).toHaveBeenCalledTimes(1);
    expect(rtl.screen.queryByTestId('legal-pay-start')).toBeNull();
    expect(rtl.screen.getByText("You don't have a wallet yet")).toBeTruthy();
  });
});

describe('S23 · Delivered', () => {
  it('a user sees every delivered file with its pages and can open one', async () => {
    hub.req = request({ status: 'delivered', consultationPaidAt: 'x', quoteAmount: 45000, contractSigned: true, servicePaidAt: 'x', deliveredAt: '2099-09-22T09:00:00.000Z' });
    hub.deliverables = [
      { id: 'd1', fileName: 'Reviewed tenancy agreement.pdf', url: 'https://files.example/a.pdf', pages: 12, chatMessageId: 'm1', postedAt: '2099-09-22T09:00:00.000Z' },
      { id: 'd2', fileName: 'Consultant notes.pdf', url: 'https://files.example/b.pdf', pages: 3, chatMessageId: 'm2', postedAt: '2099-09-22T09:00:00.000Z' },
    ];
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    await render(<MatterScreen requestId={R1} onBack={jest.fn()} wallet={wallet()} />);
    expect(await rtl.screen.findByText('Reviewed tenancy agreement.pdf')).toBeTruthy();
    expect(rtl.screen.getByText('12 pages')).toBeTruthy();
    expect(rtl.screen.getByText('Consultant notes.pdf')).toBeTruthy();
    expect(rtl.screen.getByText('3 pages')).toBeTruthy();
    await rtl.fireEvent.press(rtl.screen.getByTestId('legal-document-d2'));
    expect(open).toHaveBeenCalledWith('https://files.example/b.pdf');
    expect(rtl.screen.getByTestId('legal-step-delivered').props.accessibilityLabel).toMatch(/done$/);
    open.mockRestore();
  });
});

describe('S26 · Fixed-price request', () => {
  /** What the Hub serves on the conversation (R2-LEGAL2, G-LEGAL-06-1): the service, the price WAWU set in admin, how long it takes and what to hand over. */
  const FIXED = {
    code: 'cac-registration',
    name: 'Business name registration',
    blurb: 'Register your business name with the Corporate Affairs Commission.',
    priceNaira: 35000,
    turnaround: '5 to 7 working days',
    needs: ['ID', '2 name options', 'address'],
  };
  const conversation = (over: Record<string, unknown> = {}) => ({
    id: 'i1', stage: 'profiling', matter: 'business_registration', matterLabel: 'Business registration', messages: [], quickReplies: [], brief: null,
    awaitingReply: false, legalRequestId: null, requestStatus: null, requestPath: null, fixedPrice: FIXED, consultant: null, assistantStopped: false, ...over,
  });
  const screen = (onStarted = jest.fn()) => render(<FixedPriceScreen threadId="i1" onBack={jest.fn()} onStarted={onStarted} />);

  it('a user sees the price, the bank charge and the total, what it takes and what to hand over, types a name and Continue starts ONE request however often it is tapped', async () => {
    hub.thread = conversation();
    const onStarted = jest.fn();
    await screen(onStarted);
    expect(await rtl.screen.findByText('Bank charge')).toBeTruthy();
    expect(rtl.screen.getByText('Price')).toBeTruthy();
    expect(rtl.screen.getByText('Takes')).toBeTruthy();
    expect(rtl.screen.getByText('5 to 7 working days')).toBeTruthy();
    expect(rtl.screen.getByText("You'll need")).toBeTruthy();
    expect(rtl.screen.getByText('ID, 2 name options, address')).toBeTruthy();
    expect(await rtl.screen.findByRole('button', { name: 'Continue · ₦35,015.75' })).toBeTruthy();
    expect(rtl.screen.getByTestId('legal-fixed-continue').props.accessibilityState.disabled).toBe(true);
    await rtl.fireEvent.changeText(rtl.screen.getByTestId('legal-fixed-name'), 'Lennox Films');
    await press('legal-fixed-continue');
    await press('legal-fixed-continue');
    await rtl.waitFor(() => expect(onStarted).toHaveBeenCalledWith(R1));
    expect(hub.starts).toEqual([{ firstNameChoice: 'Lennox Films' }]);
  });

  it('draws no Takes or You\'ll need row when the Hub names none', async () => {
    hub.thread = conversation({ fixedPrice: { ...FIXED, turnaround: null, needs: [] } });
    await screen();
    expect(await rtl.screen.findByText('Price')).toBeTruthy();
    expect(rtl.screen.queryByText('Takes')).toBeNull();
    expect(rtl.screen.queryByText("You'll need")).toBeNull();
  });

  it('draws no bank charge or total when the Hub has no fee figure, and the button says Continue', async () => {
    hub.thread = conversation();
    hub.feeQuoteFails = true;
    await screen();
    expect(await rtl.screen.findByText('Price')).toBeTruthy();
    await rtl.waitFor(() => expect(rtl.screen.getByRole('button', { name: 'Continue' })).toBeTruthy());
    expect(rtl.screen.queryByText('Bank charge')).toBeNull();
    expect(rtl.screen.queryByText('Total')).toBeNull();
  });

  it('offers nothing when the conversation has no fixed price', async () => {
    hub.thread = conversation({ fixedPrice: null });
    await screen();
    expect(await rtl.screen.findByTestId('legal-fixed-unavailable')).toBeTruthy();
    expect(rtl.screen.queryByTestId('legal-fixed-continue')).toBeNull();
  });

  it('opens the matter at once when the request was already started', async () => {
    hub.thread = conversation({ fixedPrice: null, stage: 'sent', legalRequestId: R1, requestStatus: 'quoted', requestPath: 'simple' });
    const onStarted = jest.fn();
    await screen(onStarted);
    await rtl.waitFor(() => expect(onStarted).toHaveBeenCalledWith(R1));
    expect(hub.starts).toEqual([]);
  });

  it("shows the Hub's sentence when the request is refused, and a second Continue asks again", async () => {
    hub.thread = conversation();
    hub.startFails = { status: 409, code: 'not_fixed_price', message: 'This one needs a consultant first. Send it to a consultant instead.' };
    await screen();
    await rtl.screen.findByRole('button', { name: /^Continue/ });
    await rtl.fireEvent.changeText(rtl.screen.getByTestId('legal-fixed-name'), 'Lennox Films');
    await press('legal-fixed-continue');
    expect(await rtl.screen.findByText('This one needs a consultant first. Send it to a consultant instead.')).toBeTruthy();
    hub.startFails = null;
    await press('legal-fixed-continue');
    await rtl.waitFor(() => expect(hub.starts).toHaveLength(2));
  });
});
