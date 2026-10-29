/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { Share } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

// The payment window is a web view of the provider's own page; here it is a stand-in that records what it was given and lets a test say what the window ended with.
let mockCheckout: { visible: boolean; config: { txRef: string; amount: number; currency: string; publicKey: string } | null; customer: { email: string }; onEvent: (event: unknown) => void } | null = null;
jest.mock('../CheckoutModal', () => ({
  CheckoutModal: (props: NonNullable<typeof mockCheckout>) => {
    mockCheckout = props;
    return null;
  },
}));

type Answer = { status: number; body: unknown } | 'offline';
let answers: Record<string, Answer[]> = {};
let sent: { key: string; body: unknown }[] = [];

const ok = (data: unknown): Answer => ({ status: 200, body: { statusCode: 200, message: 'OK', data } });
const refusal = (status: number, message: string): Answer => ({ status, body: { statusCode: status, message, data: null } });

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const key = `${request.method} ${url.pathname.replace(/^\/api\/hub/, '')}`;
  const text = request.method === 'POST' ? await request.clone().text() : '';
  sent.push({ key, body: text === '' ? undefined : JSON.parse(text) });
  const queue = answers[key];
  const answer = queue?.[0];
  if (queue && queue.length > 1) queue.shift();
  if (!answer) throw new Error(`no answer for ${key}`);
  if (answer === 'offline') throw new TypeError('Network request failed');
  return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

// Loaded after `fetch` is replaced: the API client keeps the fetch it finds when it is created.
const { queryClient } = require('@/api/query') as typeof import('@/api/query');
const { BillsScreen } = require('../BillsScreen') as typeof import('../BillsScreen');
const { BillersScreen } = require('../BillersScreen') as typeof import('../BillersScreen');
const { ItemsScreen } = require('../ItemsScreen') as typeof import('../ItemsScreen');
const { NumberScreen } = require('../NumberScreen') as typeof import('../NumberScreen');
const { PhoneBillScreen } = require('../PhoneBillScreen') as typeof import('../PhoneBillScreen');
const { ReviewScreen } = require('../ReviewScreen') as typeof import('../ReviewScreen');
const { ReceiptScreen } = require('../ReceiptScreen') as typeof import('../ReceiptScreen');
const { billDraft } = require('../draft') as typeof import('../draft');
const { METER_CHECK_DELAY_MS } = require('../model') as typeof import('../model');

// The app retries a failed read twice before it shows the error; these tests turn that off so the error shows at once.
queryClient.setDefaultOptions({ queries: { ...queryClient.getDefaultOptions().queries, retry: false } });

const CATEGORIES = [
  { id: 1, name: 'Airtime', code: 'AIRTIME' },
  { id: 2, name: 'Mobile Data Service', code: 'MOBILEDATA' },
  { id: 3, name: 'Utility Bills', code: 'UTILITYBILLS' },
  { id: 4, name: 'Cable Bill Payment', code: 'CABLEBILLS' },
  { id: 5, name: 'Internet Service', code: 'INTSERVICE' },
];
const item = (over: Record<string, unknown>) => ({ id: 1, biller_code: 'BIL1', name: 'Item', item_code: 'X1', amount: 0, fee: 0, label_name: 'Meter Number', ...over });
const IKEJA = { id: 10, name: 'Ikeja Electric', biller_code: 'BIL_IKEJA' };
const EKO = { id: 11, name: 'Eko Electricity', biller_code: 'BIL_EKO' };
const BILL = (over: Record<string, unknown> = {}) => ({
  id: 'bill-1',
  category: 'Utility Bills',
  billerName: 'Ikeja Electric',
  customerRef: '04123456789',
  amount: 10000,
  fee: 0,
  status: 'processing',
  providerReference: 'BPUSSD123',
  failureReason: null,
  createdAt: '2026-10-29T10:42:00.000Z',
  deliveredAt: null,
  refundReference: null,
  refundedAt: null,
  ...over,
});
const ME = { wawuUserId: 'u-1', email: 'ada@example.com', phone: '+2348031234412', firstName: 'Ada', lastName: 'Eze' };

function wrap(children: ReactNode) {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>{children}</SafeAreaProvider>
    </QueryClientProvider>
  );
}

const settle = (ms = 30) =>
  rtl.act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
const asked = (key: string) => sent.filter((s) => s.key === key).length;
const bodyOf = (key: string) => sent.filter((s) => s.key === key).map((s) => s.body);
const type = (testID: string, text: string) =>
  rtl.act(async () => {
    rtl.fireEvent.changeText(rtl.screen.getByTestId(testID), text);
  });
const press = (testID: string) =>
  rtl.act(async () => {
    rtl.fireEvent.press(rtl.screen.getByTestId(testID));
  });
const LATER = { timeout: METER_CHECK_DELAY_MS + 2500 };

/** Every string the screen draws, so a figure the `Money` component splits into runs can still be looked for as one. */
function screenText(): string {
  const out: string[] = [];
  const walk = (node: unknown) => {
    if (typeof node === 'string') out.push(node);
    else if (Array.isArray(node)) node.forEach(walk);
    else if (node && typeof node === 'object') walk((node as { children?: unknown }).children);
  };
  walk(rtl.screen.toJSON());
  return out.join('');
}

beforeEach(() => {
  answers = { 'GET /users/me': [ok(ME)] };
  sent = [];
  mockCheckout = null;
  billDraft.clear();
  queryClient.clear();
});

afterEach(async () => {
  await queryClient.cancelQueries();
  await settle(10);
  rtl.cleanup();
  queryClient.clear();
});

describe('S2 · Pay a bill', () => {
  const open = (props: Partial<import('../BillsScreen').BillsScreenProps> = {}) => rtl.render(wrap(<BillsScreen onBack={jest.fn()} onOpen={jest.fn()} onOpenBill={jest.fn()} {...props} />));

  it('a user sees the four kinds the provider lists, and each opens its own screen', async () => {
    answers['GET /bills/categories'] = [ok(CATEGORIES)];
    answers['GET /bills/mine'] = [ok({ items: [], currentPage: 1, perPage: 50, total: 0 })];
    const onOpen = jest.fn();
    await open({ onOpen });
    for (const kind of ['airtime', 'data', 'electricity', 'cable']) await rtl.screen.findByTestId(`bills-${kind}`);
    expect(rtl.screen.getByText('What are you paying for?')).toBeTruthy();
    // The provider's Internet Service category has no tile, and bills are live: no "not switched on" screen exists.
    expect(rtl.screen.queryByText('Internet Service')).toBeNull();
    expect(rtl.screen.queryByTestId('bills-not-live')).toBeNull();
    await press('bills-electricity');
    expect(onOpen).toHaveBeenCalledWith('electricity');
    await press('bills-cable');
    expect(onOpen).toHaveBeenCalledWith('cable');
  });

  it('draws only the kinds the provider lists, and no reminders banner or empty Recent', async () => {
    answers['GET /bills/categories'] = [ok([CATEGORIES[0]])];
    answers['GET /bills/mine'] = [ok({ items: [], currentPage: 1, perPage: 50, total: 0 })];
    await open();
    await rtl.screen.findByTestId('bills-airtime');
    expect(rtl.screen.queryByTestId('bills-data')).toBeNull();
    expect(rtl.screen.queryByTestId('bills-electricity')).toBeNull();
    expect(rtl.screen.queryByTestId('bills-cable')).toBeNull();
    expect(rtl.screen.queryByText('Bill reminders')).toBeNull();
    expect(rtl.screen.queryByTestId('bills-recent')).toBeNull();
  });

  it('says there is nothing to pay when the provider lists none of the four', async () => {
    answers['GET /bills/categories'] = [ok([CATEGORIES[4]])];
    answers['GET /bills/mine'] = [ok({ items: [], currentPage: 1, perPage: 50, total: 0 })];
    await open();
    await rtl.screen.findByTestId('bills-none');
  });

  it('draws Recent from what the person paid for, and a row opens its receipt', async () => {
    answers['GET /bills/categories'] = [ok(CATEGORIES)];
    answers['GET /bills/mine'] = [
      ok({
        items: [BILL(), BILL({ id: 'bill-2', category: 'Airtime', billerName: 'MTN', customerRef: '08031234412', amount: 2000 }), BILL({ id: 'bill-3', category: 'Cable Bill Payment', billerName: 'DStv', customerRef: '7021345688', amount: 15700 })],
        currentPage: 1,
        perPage: 50,
        total: 3,
      }),
    ];
    const onOpenBill = jest.fn();
    await open({ onOpenBill });
    await rtl.screen.findByTestId('bills-recent');
    expect(rtl.screen.getByText('Meter 0412 3456 789')).toBeTruthy();
    expect(rtl.screen.getByText('0803 ••• 4412')).toBeTruthy();
    expect(rtl.screen.getByText('Smartcard 7021 ••• 88')).toBeTruthy();
    await press('bills-recent-bill-2');
    expect(onOpenBill).toHaveBeenCalledWith('bill-2');
  });

  it('draws the kinds when Recent cannot be read', async () => {
    answers['GET /bills/categories'] = [ok(CATEGORIES)];
    answers['GET /bills/mine'] = [refusal(500, 'Something broke.')];
    await open();
    await rtl.screen.findByTestId('bills-electricity');
    expect(rtl.screen.queryByTestId('bills-recent')).toBeNull();
  });

  it('a read that fails says so, and Try again asks again and draws the tiles', async () => {
    answers['GET /bills/categories'] = [refusal(502, 'Could not reach the bill payment provider.'), ok(CATEGORIES)];
    answers['GET /bills/mine'] = [ok({ items: [], currentPage: 1, perPage: 50, total: 0 })];
    await open();
    await rtl.screen.findByTestId('bills-error');
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Try again' })));
    await rtl.screen.findByTestId('bills-electricity');
    expect(asked('GET /bills/categories')).toBe(2);
  });
});

describe('S3 · Biller', () => {
  it('lists the companies of the kind’s category by its code, and a row starts the bill', async () => {
    answers['GET /bills/categories'] = [ok(CATEGORIES)];
    answers['GET /bills/categories/UTILITYBILLS/billers'] = [ok([IKEJA, EKO])];
    const onPick = jest.fn();
    await rtl.render(wrap(<BillersScreen kind="electricity" onBack={jest.fn()} onChangeCategory={jest.fn()} onPick={onPick} />));
    await rtl.screen.findByTestId('biller-BIL_IKEJA');
    expect(rtl.screen.getByText('Who are you paying?')).toBeTruthy();
    expect(rtl.screen.getByText('Eko Electricity')).toBeTruthy();
    await press('biller-BIL_EKO');
    expect(onPick).toHaveBeenCalledTimes(1);
    expect(billDraft.get()).toMatchObject({ kind: 'electricity', categoryName: 'Utility Bills', categoryCode: 'UTILITYBILLS', biller: { code: 'BIL_EKO', name: 'Eko Electricity' } });
  });

  it('says so when the provider has no category for the kind or no company in it', async () => {
    answers['GET /bills/categories'] = [ok([CATEGORIES[0]])];
    await rtl.render(wrap(<BillersScreen kind="cable" onBack={jest.fn()} onChangeCategory={jest.fn()} onPick={jest.fn()} />));
    await rtl.screen.findByTestId('billers-none');
  });

  it('a failed read says so with Try again', async () => {
    answers['GET /bills/categories'] = [refusal(502, 'Could not reach the bill payment provider.')];
    await rtl.render(wrap(<BillersScreen kind="cable" onBack={jest.fn()} onChangeCategory={jest.fn()} onPick={jest.fn()} />));
    await rtl.screen.findByTestId('billers-error');
  });
});

describe('S9 · packages', () => {
  const start = () => billDraft.start({ kind: 'cable', categoryName: 'Cable Bill Payment', categoryCode: 'CABLEBILLS', biller: { code: 'BIL_DSTV', name: 'DStv' } });
  const open = (over: Partial<import('../ItemsScreen').ItemsScreenProps> = {}) =>
    rtl.render(wrap(<ItemsScreen onBack={jest.fn()} onChangeCategory={jest.fn()} onChangeBiller={jest.fn()} onMissing={jest.fn()} onContinue={jest.fn()} {...over} />));
  const PACKAGES = [item({ item_code: 'CB1', name: 'Padi', amount: 4400 }), item({ item_code: 'CB2', name: 'Compact', amount: 15700 }), item({ item_code: 'CB3', name: 'Compact Plus', amount: 25000 })];

  it('a user picks a package, and Continue takes it to the number', async () => {
    start();
    answers['GET /bills/billers/BIL_DSTV/items'] = [ok(PACKAGES)];
    const onContinue = jest.fn();
    await open({ onContinue });
    await rtl.screen.findByTestId('item-CB2');
    expect(rtl.screen.getByText('Which package?')).toBeTruthy();
    expect(rtl.screen.getByTestId('items-continue').props.accessibilityState?.disabled).toBe(true);
    await press('item-CB2');
    await press('items-continue');
    expect(onContinue).toHaveBeenCalledWith(false);
    expect(billDraft.get()?.item).toEqual({ code: 'CB2', name: 'Compact', amount: 15700, label: 'Meter Number' });
  });

  it('passes the step by when the company sells one thing, even when the provider lists it more than once', async () => {
    start();
    answers['GET /bills/billers/BIL_DSTV/items'] = [ok([item({ item_code: 'AT099', name: 'MTN VTU' }), item({ item_code: 'AT099', name: 'GLO Nigeria' })])];
    const onContinue = jest.fn();
    await open({ onContinue });
    await rtl.waitFor(() => expect(onContinue).toHaveBeenCalledWith(true));
    expect(billDraft.get()?.item?.code).toBe('AT099');
  });

  it('goes back to the kinds of bill when nothing was started', async () => {
    const onMissing = jest.fn();
    await open({ onMissing });
    await rtl.waitFor(() => expect(onMissing).toHaveBeenCalled());
  });
});

describe('S4 · Meter and amount, S10', () => {
  const start = (kind: 'electricity' | 'cable' = 'electricity', over: Record<string, unknown> = {}) =>
    billDraft.start({
      kind,
      categoryName: kind === 'cable' ? 'Cable Bill Payment' : 'Utility Bills',
      categoryCode: kind === 'cable' ? 'CABLEBILLS' : 'UTILITYBILLS',
      biller: { code: 'BIL_IKEJA', name: 'Ikeja Electric' },
      item: { code: 'UB157', name: 'IKEDC PREPAID', amount: 0, label: 'Meter Number' },
      ...over,
    });
  const open = (over: Partial<import('../NumberScreen').NumberScreenProps> = {}) =>
    rtl.render(wrap(<NumberScreen onBack={jest.fn()} onChangeCategory={jest.fn()} onChangeBiller={jest.fn()} onMissing={jest.fn()} onContinue={jest.fn()} {...over} />));
  const VALID = ok({ customer: '04123456789', name: 'Chidinma Okoro', fee: 0, minimum: 0, maximum: 0 });

  it('a user types a meter, sees its name, picks an amount and continues', async () => {
    start();
    answers['POST /bills/validate'] = [VALID];
    const onContinue = jest.fn();
    await open({ onContinue });
    expect(rtl.screen.getByText('Meter number')).toBeTruthy();
    expect(rtl.screen.getByTestId('number-continue').props.accessibilityState?.disabled).toBe(true);
    await type('meter-number', '0412 3456 789');
    await rtl.screen.findByText('Chidinma Okoro', undefined, LATER);
    expect(bodyOf('POST /bills/validate')).toEqual([{ itemCode: 'UB157', customer: '04123456789' }]);
    // A found meter without an amount is not enough.
    expect(rtl.screen.getByTestId('number-continue').props.accessibilityState?.disabled).toBe(true);
    await press('amount-presets-1000000');
    expect(rtl.screen.getByTestId('number-continue').props.accessibilityState?.disabled).toBeFalsy();
    await press('number-continue');
    expect(onContinue).toHaveBeenCalledTimes(1);
    expect(billDraft.get()).toMatchObject({ customer: '04123456789', customerName: 'Chidinma Okoro', amount: 10000 });
  });

  it('takes whole naira only, and shows the least the Hub takes', async () => {
    start();
    answers['POST /bills/validate'] = [VALID];
    await open();
    await type('meter-number', '04123456789');
    await rtl.screen.findByText('Chidinma Okoro', undefined, LATER);
    await type('amount', '49');
    expect(rtl.screen.getByText('The least you can pay is ₦50.')).toBeTruthy();
    expect(rtl.screen.getByTestId('number-continue').props.accessibilityState?.disabled).toBe(true);
    await type('amount', '1,500.50');
    expect(rtl.screen.getByTestId('amount').props.value).toBe('150,050');
  });

  it('shows the company’s own maximum when it named one, and draws no quick amount above it', async () => {
    start();
    answers['POST /bills/validate'] = [ok({ customer: '04123456789', name: 'Chidinma Okoro', fee: 0, minimum: 1000, maximum: 5000 })];
    await open();
    await type('meter-number', '04123456789');
    await rtl.screen.findByText('Chidinma Okoro', undefined, LATER);
    expect(rtl.screen.queryByTestId('amount-presets-1000000')).toBeNull();
    expect(rtl.screen.getByTestId('amount-presets-200000')).toBeTruthy();
    await type('amount', '5001');
    expect(rtl.screen.getByText('The most you can pay is ₦5,000.')).toBeTruthy();
  });

  it('S10: a number the provider refuses says "We couldn\'t find this meter" and Continue stays shut', async () => {
    start();
    answers['POST /bills/validate'] = [refusal(502, 'Customer not found')];
    await open();
    await type('meter-number', '04123456789');
    await rtl.screen.findByText("We couldn't find this meter. Check the number.", undefined, LATER);
    expect(rtl.screen.getByTestId('number-continue').props.accessibilityState?.disabled).toBe(true);
  });

  it('a provider that cannot be reached is a try again, never S10', async () => {
    start();
    answers['POST /bills/validate'] = [refusal(502, 'Could not reach the bill payment provider.'), VALID];
    await open();
    await type('meter-number', '04123456789');
    await rtl.screen.findByText('Could not reach the bill payment provider.', undefined, LATER);
    expect(rtl.screen.queryByText("We couldn't find this meter. Check the number.")).toBeNull();
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Try again' })));
    await rtl.screen.findByText('Chidinma Okoro');
  });

  it('a package with a price is the amount: no amount box, and the smartcard is named as such', async () => {
    start('cable', { biller: { code: 'BIL_DSTV', name: 'DStv' }, item: { code: 'CB2', name: 'Compact', amount: 15700, label: 'SmartCard Number' } });
    answers['POST /bills/validate'] = [VALID];
    const onContinue = jest.fn();
    await open({ onContinue });
    expect(rtl.screen.getByText('Smartcard number')).toBeTruthy();
    expect(rtl.screen.queryByTestId('amount')).toBeNull();
    expect(screenText()).toContain('15,700');
    await type('meter-number', '7021345688');
    await rtl.screen.findByText('Chidinma Okoro', undefined, LATER);
    await press('number-continue');
    expect(onContinue).toHaveBeenCalledTimes(1);
    expect(billDraft.get()?.amount).toBe(15700);
  });
});

describe('S8 · Airtime and Data', () => {
  const NETWORKS = [
    { id: 1, name: 'MTN', biller_code: 'BIL_MTN' },
    { id: 2, name: 'Airtel', biller_code: 'BIL_AIRTEL' },
  ];
  const open = (kind: 'airtime' | 'data', over: Partial<import('../PhoneBillScreen').PhoneBillScreenProps> = {}) =>
    rtl.render(wrap(<PhoneBillScreen kind={kind} onBack={jest.fn()} onChangeCategory={jest.fn()} onContinue={jest.fn()} {...over} />));
  const FOUND = ok({ customer: '08031234412', name: null, fee: 0, minimum: 0, maximum: 0 });

  it('a user picks a network, enters a number, taps an amount and buys', async () => {
    answers['GET /bills/categories'] = [ok(CATEGORIES)];
    answers['GET /bills/categories/AIRTIME/billers'] = [ok(NETWORKS)];
    // The provider lists airtime as one code under every network: that one is the item.
    answers['GET /bills/billers/BIL_MTN/items'] = [ok([item({ item_code: 'AT099', name: 'MTN VTU' }), item({ item_code: 'AT099', name: 'GLO Nigeria' })])];
    answers['POST /bills/validate'] = [FOUND];
    const onContinue = jest.fn();
    await open('airtime', { onContinue });
    await rtl.screen.findByTestId('networks');
    // No network is chosen for the person, and nothing can be bought yet.
    expect(rtl.screen.getByTestId('phone-bill-buy').props.accessibilityState?.disabled).toBe(true);
    await press('networks-BIL_MTN');
    await type('phone-number', '0803 123 4412');
    // BILLS-10: the number is checked on the phone; the provider's validation is for meters and smartcards only.
    await rtl.screen.findByText('Number looks right');
    expect(asked('POST /bills/validate')).toBe(0);
    await press('amount-presets-200000');
    expect(screenText()).toContain('Buy ₦2,000 airtime');
    await press('phone-bill-buy');
    expect(onContinue).toHaveBeenCalledTimes(1);
    expect(billDraft.get()).toMatchObject({
      kind: 'airtime',
      categoryName: 'Airtime',
      biller: { code: 'BIL_MTN', name: 'MTN' },
      item: { code: 'AT099' },
      customer: '08031234412',
      amount: 2000,
    });
  });

  it('"Mine" fills the account’s own number', async () => {
    answers['GET /bills/categories'] = [ok(CATEGORIES)];
    answers['GET /bills/categories/AIRTIME/billers'] = [ok(NETWORKS)];
    await open('airtime');
    await rtl.screen.findByTestId('phone-mine');
    await press('phone-mine');
    expect(rtl.screen.getByTestId('phone-number').props.value).toBe('0803 123 4412');
  });

  it('Data lists the network’s bundles in place of the quick amounts, and Continue needs one', async () => {
    answers['GET /bills/categories'] = [ok(CATEGORIES)];
    answers['GET /bills/categories/MOBILEDATA/billers'] = [ok(NETWORKS)];
    answers['GET /bills/billers/BIL_MTN/items'] = [ok([item({ item_code: 'D1', name: 'MTN 1.5GB', amount: 1000 }), item({ item_code: 'D2', name: 'MTN 5GB', amount: 2500 })])];
    answers['POST /bills/validate'] = [FOUND];
    const onContinue = jest.fn();
    await open('data', { onContinue });
    await rtl.screen.findByTestId('networks');
    await press('networks-BIL_MTN');
    await rtl.screen.findByTestId('bundles');
    expect(rtl.screen.getByText('Which bundle?')).toBeTruthy();
    expect(rtl.screen.queryByTestId('amount')).toBeNull();
    await press('item-D2');
    await type('phone-number', '08031234412');
    await rtl.screen.findByText('Number looks right');
    expect(asked('POST /bills/validate')).toBe(0);
    await press('phone-bill-buy');
    expect(billDraft.get()).toMatchObject({ kind: 'data', item: { code: 'D2', name: 'MTN 5GB', amount: 2500 }, amount: 2500 });
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it('a number that is not a Nigerian mobile number is not bought for', async () => {
    answers['GET /bills/categories'] = [ok(CATEGORIES)];
    answers['GET /bills/categories/AIRTIME/billers'] = [ok(NETWORKS)];
    answers['GET /bills/billers/BIL_MTN/items'] = [ok([item({ item_code: 'AT099', name: 'MTN VTU' })])];
    await open('airtime');
    await rtl.screen.findByTestId('networks');
    await press('networks-BIL_MTN');
    await type('phone-number', '01031234412');
    await rtl.screen.findByText('Enter a Nigerian mobile number: 11 digits starting with 07, 08 or 09.');
    await press('amount-presets-200000');
    expect(rtl.screen.getByTestId('phone-bill-buy').props.accessibilityState?.disabled).toBe(true);
    expect(asked('POST /bills/validate')).toBe(0);
  });
});

describe('S5 · Review, the payment window, and what follows', () => {
  const start = () =>
    billDraft.start({
      kind: 'electricity',
      categoryName: 'Utility Bills',
      categoryCode: 'UTILITYBILLS',
      biller: { code: 'BIL_IKEJA', name: 'Ikeja Electric' },
      item: { code: 'UB157', name: 'IKEDC PREPAID', amount: 0, label: 'Meter Number' },
      customer: '04123456789',
      customerName: 'Chidinma Okoro',
      amount: 10000,
    });
  const INIT = ok({ billPaymentId: 'bill-1', flutterwaveConfig: { txRef: 'wawu-bill-1', amount: 10000, currency: 'NGN', publicKey: 'FLWPUBK_TEST-x' } });
  const open = (over: Partial<import('../ReviewScreen').ReviewScreenProps> = {}) =>
    rtl.render(wrap(<ReviewScreen onBack={jest.fn()} onMissing={jest.fn()} onSettled={jest.fn()} {...over} />));
  const ready = async (props: Partial<import('../ReviewScreen').ReviewScreenProps> = {}) => {
    start();
    answers['POST /bills/init'] = [INIT];
    await open(props);
    await rtl.screen.findByTestId('review-pay');
    // The account is read for the checkout's email.
    await rtl.waitFor(() => expect(asked('GET /users/me')).toBe(1));
    await settle();
  };
  const pay = async () => {
    await press('review-pay');
    await rtl.waitFor(() => expect(mockCheckout?.visible).toBe(true));
  };
  const windowSays = (event: unknown) =>
    rtl.act(async () => {
      mockCheckout?.onEvent(event);
    });

  it('shows what was picked and the total, with the amount on the button and no fee, wallet or PIN of its own', async () => {
    await ready();
    expect(rtl.screen.getByText('Review')).toBeTruthy();
    expect(rtl.screen.getByText('Ikeja Electric · IKEDC PREPAID')).toBeTruthy();
    expect(rtl.screen.getByText('Chidinma Okoro')).toBeTruthy();
    expect(rtl.screen.getByText('0412 3456 789')).toBeTruthy();
    expect(rtl.screen.getByText('Total')).toBeTruthy();
    expect(screenText()).toContain('Pay ₦10,000');
    expect(rtl.screen.queryByText('Fee')).toBeNull();
    expect(rtl.screen.queryByText('No fee')).toBeNull();
    expect(rtl.screen.queryByText('Pay from wallet')).toBeNull();
    expect(rtl.screen.queryByText(/PIN/)).toBeNull();
    expect(asked('POST /bills/init')).toBe(0);
  });

  it('Pay records the bill with the Hub, opens the window with the Hub’s parameters, and a completed charge is checked once and ends at the receipt', async () => {
    const onSettled = jest.fn();
    await ready({ onSettled });
    answers['POST /bills/bill-1/verify'] = [ok(BILL())];
    await pay();
    expect(bodyOf('POST /bills/init')).toEqual([
      { category: 'Utility Bills', billerCode: 'BIL_IKEJA', itemCode: 'UB157', billerName: 'Ikeja Electric', customerRef: '04123456789', amount: 10000 },
    ]);
    expect(mockCheckout?.config).toEqual({ txRef: 'wawu-bill-1', amount: 10000, currency: 'NGN', publicKey: 'FLWPUBK_TEST-x' });
    expect(mockCheckout?.customer.email).toBe('ada@example.com');
    // The window opening charges nothing and delivers nothing.
    expect(asked('POST /bills/bill-1/verify')).toBe(0);
    await windowSays({ kind: 'paid', transactionId: '4471' });
    await rtl.waitFor(() => expect(onSettled).toHaveBeenCalledWith('bill-1'));
    expect(bodyOf('POST /bills/bill-1/verify')).toEqual([{ transactionId: '4471' }]);
    // A bill the Hub took and is delivering is finished with: Back cannot pay it twice.
    expect(billDraft.get()).toBeNull();
  });

  it('closing the window without paying comes back to the review with nothing charged', async () => {
    await ready();
    await pay();
    await windowSays({ kind: 'closed' });
    await rtl.waitFor(() => expect(mockCheckout?.visible).toBe(false));
    expect(asked('POST /bills/bill-1/verify')).toBe(0);
    expect(rtl.screen.getByTestId('review-pay')).toBeTruthy();
    expect(rtl.screen.queryByTestId('review-error')).toBeNull();
    expect(billDraft.get()).not.toBeNull();
  });

  it('a charge the checkout did not confirm is not delivered and says so', async () => {
    await ready();
    await pay();
    await windowSays({ kind: 'notConfirmed', transactionId: '9' });
    await rtl.screen.findByText("Your payment wasn't confirmed, so nothing was bought. Check your bank before you try again.");
    expect(asked('POST /bills/bill-1/verify')).toBe(0);
  });

  it('the Hub’s refusal before any charge is shown as it wrote it, and no window opens', async () => {
    start();
    const sentence = 'Bill payments are briefly unavailable while we top up. Nothing has been charged. Please try again shortly.';
    answers['POST /bills/init'] = [refusal(503, sentence)];
    await open();
    await rtl.screen.findByTestId('review-pay');
    await settle();
    await press('review-pay');
    await rtl.screen.findByText(sentence);
    expect(mockCheckout?.visible).toBeFalsy();
  });

  it('a person with no email on the account is told so before anything is recorded', async () => {
    start();
    answers['GET /users/me'] = [ok({ ...ME, email: null })];
    await open();
    await rtl.screen.findByTestId('review-pay');
    await settle();
    await press('review-pay');
    await rtl.screen.findByText('We need an email on your account before you can pay.');
    expect(asked('POST /bills/init')).toBe(0);
  });

  it('a check that got no answer never says it failed: it says the payment went through, and Try again sends the same check', async () => {
    const onSettled = jest.fn();
    await ready({ onSettled });
    answers['POST /bills/bill-1/verify'] = ['offline', ok(BILL())];
    await pay();
    await windowSays({ kind: 'paid', transactionId: '4471' });
    await rtl.screen.findByText("We couldn't confirm your payment yet. It went through, so please don't pay again. Try again.");
    expect(onSettled).not.toHaveBeenCalled();
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Try again' })));
    await rtl.waitFor(() => expect(onSettled).toHaveBeenCalledWith('bill-1'));
    expect(bodyOf('POST /bills/bill-1/verify')).toEqual([{ transactionId: '4471' }, { transactionId: '4471' }]);
    // The same transaction id both times, and no second `init`: nothing is charged or recorded twice.
    expect(asked('POST /bills/init')).toBe(1);
  });

  it('a bill the biller could not deliver goes to S12 with the Hub’s own sentence', async () => {
    const onSettled = jest.fn();
    await ready({ onSettled });
    const sentence = 'Your payment went through but Ikeja Electric could not deliver it, so nothing was bought. You will be refunded in full within 3 working days. Quote wawu-bill-1 if you need to chase it.';
    answers['POST /bills/bill-1/verify'] = [refusal(400, sentence)];
    answers['GET /bills/mine'] = [ok({ items: [BILL({ status: 'failed', providerReference: null })], currentPage: 1, perPage: 50, total: 1 })];
    await pay();
    await windowSays({ kind: 'paid', transactionId: '4471' });
    await rtl.waitFor(() => expect(onSettled).toHaveBeenCalledWith('bill-1'));
    expect(billDraft.failureFor('bill-1')).toBe(sentence);
    // The bill being put together stays, so Try again on S12 can come back here.
    expect(billDraft.get()).not.toBeNull();
  });

  it('a payment the provider did not confirm (a 400 that leaves the bill pending) stays on the review with the Hub’s words and Try again', async () => {
    const onSettled = jest.fn();
    await ready({ onSettled });
    answers['POST /bills/bill-1/verify'] = [refusal(400, 'Payment could not be verified.'), ok(BILL())];
    answers['GET /bills/mine'] = [ok({ items: [BILL({ status: 'pending' })], currentPage: 1, perPage: 50, total: 1 })];
    await pay();
    await windowSays({ kind: 'paid', transactionId: '4471' });
    await rtl.screen.findByText('Payment could not be verified.');
    expect(onSettled).not.toHaveBeenCalled();
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Try again' })));
    await rtl.waitFor(() => expect(onSettled).toHaveBeenCalledWith('bill-1'));
  });

  it('opened on its own, with no bill started, it goes back to the kinds of bill and draws nothing', async () => {
    const onMissing = jest.fn();
    await open({ onMissing });
    await rtl.waitFor(() => expect(onMissing).toHaveBeenCalled());
    expect(rtl.screen.queryByTestId('review-pay')).toBeNull();
  });
});

describe('S7 · the receipt, and S12', () => {
  const open = (id = 'bill-1', over: Partial<import('../ReceiptScreen').ReceiptScreenProps> = {}) =>
    rtl.render(wrap(<ReceiptScreen id={id} onDone={jest.fn()} onTryAgain={jest.fn()} {...over} />));
  const mine = (...items: unknown[]) => [ok({ items, currentPage: 1, perPage: 50, total: items.length })];

  it('a delivered bill reads "paid" with its number, reference, date and total, and can be shared', async () => {
    answers['GET /bills/mine'] = mine(BILL({ status: 'delivered', deliveredAt: '2026-10-29T10:45:00.000Z' }));
    const onDone = jest.fn();
    const share = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' });
    await open('bill-1', { onDone });
    await rtl.screen.findByTestId('receipt-card');
    expect(screenText()).toContain('10,000paid');
    expect(rtl.screen.getByText('Ikeja Electric')).toBeTruthy();
    expect(rtl.screen.getByText('0412 3456 789')).toBeTruthy();
    expect(rtl.screen.getByText('BPUSSD123')).toBeTruthy();
    expect(rtl.screen.getByText('Total paid')).toBeTruthy();
    // The provider gives no token and no units, so none is drawn (R-47).
    expect(rtl.screen.queryByText('Your token')).toBeNull();
    await press('receipt-share');
    expect(share).toHaveBeenCalledTimes(1);
    expect(String(share.mock.calls[0][0].message)).toContain('Reference: BPUSSD123');
    await press('receipt-done');
    expect(onDone).toHaveBeenCalledTimes(1);
    share.mockRestore();
  });

  it('a bill the provider has not confirmed reads "on its way", never "delivered", and offers no share', async () => {
    answers['GET /bills/mine'] = mine(BILL({ status: 'processing' }));
    await open();
    await rtl.screen.findByTestId('receipt-title');
    expect(rtl.screen.getByText('Payment received, on its way')).toBeTruthy();
    expect(rtl.screen.getByTestId('receipt-confirming')).toBeTruthy();
    expect(rtl.screen.queryByTestId('receipt-share')).toBeNull();
    expect(rtl.screen.queryByText('paid')).toBeNull();
  });

  it('a failed bill is S12: the Hub’s sentence when this session has it, the amount, and Try again', async () => {
    answers['GET /bills/mine'] = mine(BILL({ status: 'failed', providerReference: null }));
    billDraft.rememberFailure('bill-1', 'Your payment went through but Ikeja Electric could not deliver it, so nothing was bought.');
    const onTryAgain = jest.fn();
    await open('bill-1', { onTryAgain });
    await rtl.screen.findByTestId('failed-card');
    // BILLS-09 round 1 (lead ruling, verifier M): a failed bill is one the Hub took the payment for, so the title is no longer "Payment didn't go through".
    expect(rtl.screen.getByText("We couldn't deliver your bill")).toBeTruthy();
    expect(rtl.screen.getByText('Your payment went through but Ikeja Electric could not deliver it, so nothing was bought.')).toBeTruthy();
    // The app never says money is back until the Hub has recorded a refund.
    expect(rtl.screen.queryByText('Refunded')).toBeNull();
    expect(rtl.screen.queryByText(/wallet/i)).toBeNull();
    await press('receipt-retry');
    expect(onTryAgain).toHaveBeenCalledTimes(1);
  });

  it('a bill the Hub has recorded as refunded says so, with the reference', async () => {
    answers['GET /bills/mine'] = mine(BILL({ status: 'refunded', refundReference: 'RFD-9' }));
    await open();
    await rtl.screen.findByTestId('failed-card');
    expect(rtl.screen.getByText('Refunded')).toBeTruthy();
    expect(rtl.screen.getByText('RFD-9')).toBeTruthy();
  });

  it('a bill that is not the person’s says it cannot be found', async () => {
    answers['GET /bills/mine'] = mine(BILL());
    await open('someone-elses');
    await rtl.screen.findByTestId('receipt-missing');
  });

  it('a failed read says so with Try again', async () => {
    answers['GET /bills/mine'] = [refusal(500, 'Something broke.'), ...mine(BILL({ status: 'delivered' }))];
    await open();
    await rtl.screen.findByTestId('receipt-error');
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Try again' })));
    await rtl.screen.findByTestId('receipt-card');
  });
});
