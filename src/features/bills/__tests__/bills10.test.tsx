/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

jest.mock('../CheckoutModal', () => ({ CheckoutModal: () => null }));

/**
 * BILLS-10 (owner's TestFlight run, 29 Oct 2026, the live Hub and the provider's real lists). The stand-ins below are shaped like
 * the website's documented real data (wawuafrica `src/app/(app)/services/pay/page.tsx` and `src/lib/api/lifestyle.ts`): the
 * category list carries CODES (AIRTIME, MOBILEDATA, CABLEBILLS, UTILITYBILLS, INTSERVICE); the provider lists four airtime billers
 * and, under EVERY one of them, the same four AT099 items named after all four networks; a DSTV bouquet has its own item code, its
 * price, and the label "SmartCard Number".
 */
type Answer = { status: number; body: unknown } | 'offline';
let answers: Record<string, Answer[]> = {};
let sent: { key: string; body: unknown }[] = [];

const ok = (data: unknown): Answer => ({ status: 200, body: { statusCode: 200, message: 'OK', data } });

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

const { queryClient } = require('@/api/query') as typeof import('@/api/query');
const { BillsScreen } = require('../BillsScreen') as typeof import('../BillsScreen');
const { BillersScreen } = require('../BillersScreen') as typeof import('../BillersScreen');
const { ItemsScreen } = require('../ItemsScreen') as typeof import('../ItemsScreen');
const { NumberScreen } = require('../NumberScreen') as typeof import('../NumberScreen');
const { PhoneBillScreen } = require('../PhoneBillScreen') as typeof import('../PhoneBillScreen');
const { ReceiptScreen } = require('../ReceiptScreen') as typeof import('../ReceiptScreen');
const { StepChip } = require('../parts') as typeof import('../parts');
const { billDraft } = require('../draft') as typeof import('../draft');
const { METER_CHECK_DELAY_MS } = require('../model') as typeof import('../model');

queryClient.setDefaultOptions({ queries: { ...queryClient.getDefaultOptions().queries, retry: false } });

const CATEGORIES = [
  { id: 1, name: 'Airtime', code: 'AIRTIME' },
  { id: 2, name: 'Mobile Data Service', code: 'MOBILEDATA' },
  { id: 3, name: 'Cable Bill Payment', code: 'CABLEBILLS' },
  { id: 4, name: 'Utility Bills', code: 'UTILITYBILLS' },
  { id: 5, name: 'Internet Service', code: 'INTSERVICE' },
];

/** A row as the provider writes it: every field it sends, not only the ones the app reads. */
const row = (over: Record<string, unknown>) => ({
  id: 1,
  biller_code: 'BIL000',
  name: 'Item',
  default_commission: 0.3,
  date_added: '2020-02-11T13:21:38.017Z',
  country: 'NG',
  is_airtime: false,
  biller_name: 'Biller',
  item_code: 'X1',
  short_name: 'Item',
  fee: 0,
  commission_on_fee: false,
  reg_expression: '^[0-9]+$',
  label_name: 'Mobile Number',
  amount: 0,
  ...over,
});

/** The four airtime billers, the way the provider lists them (raw upper-case names, long). */
const AIRTIME_BILLERS = [
  { id: 1, name: 'MTN NIGERIA', biller_code: 'BIL099' },
  { id: 2, name: 'AIRTEL NIGERIA', biller_code: 'BIL100' },
  { id: 3, name: 'GLO NIGERIA', biller_code: 'BIL102' },
  { id: 4, name: '9MOBILE NIGERIA', biller_code: 'BIL103' },
];
/** Under EVERY airtime biller: the same four AT099 items, named after all four networks. */
const airtimeItems = (billerCode: string) =>
  ['MTN VTU', 'GLO Nigeria', '9Mobile', 'Airtel Nigeria'].map((name, i) => row({ id: i + 1, biller_code: billerCode, name, item_code: 'AT099', label_name: 'Mobile Number', is_airtime: true, amount: 0 }));

const DSTV = { id: 20, name: 'DSTV', biller_code: 'BIL119' };
const GOTV = { id: 21, name: 'GOTV', biller_code: 'BIL120' };
const BOUQUETS = [
  { name: 'DSTV PADI', item_code: 'CB181', amount: 4400 },
  { name: 'DSTV YANGA', item_code: 'CB182', amount: 6000 },
  { name: 'DSTV COMPACT', item_code: 'CB177', amount: 15700 },
  { name: 'DSTV COMPACT PLUS', item_code: 'CB178', amount: 25000 },
  { name: 'DSTV PREMIUM', item_code: 'CB179', amount: 44500 },
].map((b, i) => row({ id: 100 + i, biller_code: 'BIL119', biller_name: 'DSTV', short_name: b.name, fee: 100, label_name: 'SmartCard Number', ...b }));

const IKEJA = { id: 30, name: 'IKEJA ELECTRIC', biller_code: 'BIL112' };
const IKEJA_ITEMS = [
  row({ id: 200, biller_code: 'BIL112', name: 'IKEDC PREPAID', item_code: 'UB157', label_name: 'Meter Number', amount: 0 }),
  row({ id: 201, biller_code: 'BIL112', name: 'IKEDC POSTPAID', item_code: 'UB158', label_name: 'Meter Number', amount: 0 }),
];

const MTN_DATA = { id: 40, name: 'MTN DATA', biller_code: 'BIL104' };
const DATA_BUNDLES = [
  { name: 'MTN 1GB 1 day', item_code: 'MD201', amount: 350 },
  { name: 'MTN 2GB 30 days', item_code: 'MD202', amount: 1500 },
  { name: 'MTN 10GB 30 days', item_code: 'MD203', amount: 3500 },
].map((b, i) => row({ id: 300 + i, biller_code: 'BIL104', label_name: 'Mobile Number', ...b }));

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
const disabled = (testID: string) => rtl.screen.getByTestId(testID).props.accessibilityState?.disabled === true;

beforeEach(() => {
  answers = { 'GET /users/me': [ok(ME)], 'GET /bills/categories': [ok(CATEGORIES)] };
  sent = [];
  billDraft.clear();
  queryClient.clear();
});

afterEach(async () => {
  await queryClient.cancelQueries();
  await settle(10);
  await rtl.cleanup();
  queryClient.clear();
});

describe('airtime: the number is checked on the phone, never by the provider', () => {
  const open = (kind: 'airtime' | 'data' = 'airtime', over: Partial<import('../PhoneBillScreen').PhoneBillScreenProps> = {}) =>
    rtl.render(wrap(<PhoneBillScreen kind={kind} onBack={jest.fn()} onChangeCategory={jest.fn()} onContinue={jest.fn()} {...over} />));
  const airtimeAnswers = () => {
    answers['GET /bills/categories/AIRTIME/billers'] = [ok(AIRTIME_BILLERS)];
    for (const b of AIRTIME_BILLERS) answers[`GET /bills/billers/${b.biller_code}/items`] = [ok(airtimeItems(b.biller_code))];
  };

  it('the owner’s case: Airtel, 0808 992 5524, ₦500 can be bought, and the provider is never asked to validate it', async () => {
    airtimeAnswers();
    const onContinue = jest.fn();
    await open('airtime', { onContinue });
    await rtl.screen.findByTestId('networks');
    await press('networks-BIL100');
    await type('phone-number', '0808 992 5524');
    await rtl.screen.findByTestId('amount-presets');
    await type('amount', '500');
    expect(disabled('phone-bill-buy')).toBe(false);
    expect(rtl.screen.queryByText("We couldn't confirm this number. Check it.")).toBeNull();
    await press('phone-bill-buy');
    expect(onContinue).toHaveBeenCalledTimes(1);
    expect(asked('POST /bills/validate')).toBe(0);
    expect(billDraft.get()).toMatchObject({
      kind: 'airtime',
      categoryName: 'Airtime',
      categoryCode: 'AIRTIME',
      biller: { code: 'BIL100', name: 'Airtel' },
      item: { code: 'AT099' },
      customer: '08089925524',
      amount: 500,
    });
  });

  it('a number is allowed once it is eleven digits from 07, 08 or 09, and not before', async () => {
    airtimeAnswers();
    await open();
    await rtl.screen.findByTestId('networks');
    await press('networks-BIL099');
    await type('phone-number', '0803 123 441');
    expect(rtl.screen.queryByTestId('phone-line')).toBeNull();
    await type('phone-number', '0703 123 4412');
    await rtl.screen.findByTestId('amount');
    await type('amount', '500');
    expect(disabled('phone-bill-buy')).toBe(false);
    await type('phone-number', '0903 123 4412');
    expect(disabled('phone-bill-buy')).toBe(false);
    expect(asked('POST /bills/validate')).toBe(0);
  });

  it('eleven digits that are not a Nigerian mobile number say so and are not bought for', async () => {
    airtimeAnswers();
    await open();
    await rtl.screen.findByTestId('networks');
    await press('networks-BIL099');
    await type('phone-number', '0103 123 4412');
    await rtl.screen.findByTestId('amount');
    await type('amount', '500');
    expect(rtl.screen.getByTestId('phone-line')).toBeTruthy();
    expect(rtl.screen.getByText(/Nigerian mobile number/)).toBeTruthy();
    expect(disabled('phone-bill-buy')).toBe(true);
    expect(asked('POST /bills/validate')).toBe(0);
  });

  it('a number in the +234 form is taken as the same number', async () => {
    airtimeAnswers();
    await open();
    await rtl.screen.findByTestId('networks');
    await press('networks-BIL102');
    await type('phone-number', '+234 808 992 5524');
    expect(rtl.screen.getByTestId('phone-number').props.value).toBe('0808 992 5524');
    await rtl.screen.findByTestId('amount');
    await type('amount', '1000');
    expect(disabled('phone-bill-buy')).toBe(false);
    await press('phone-bill-buy');
    expect(billDraft.get()?.customer).toBe('08089925524');
  });

  it('data checks the number on the phone too, and lists the bundles with their prices', async () => {
    answers['GET /bills/categories/MOBILEDATA/billers'] = [ok([MTN_DATA, { id: 41, name: 'AIRTEL DATA', biller_code: 'BIL105' }])];
    answers['GET /bills/billers/BIL104/items'] = [ok(DATA_BUNDLES)];
    const onContinue = jest.fn();
    await open('data', { onContinue });
    await rtl.screen.findByTestId('networks');
    await press('networks-BIL104');
    await rtl.screen.findByTestId('bundles');
    expect(rtl.screen.getByText('MTN 2GB 30 days')).toBeTruthy();
    await press('item-MD202');
    await type('phone-number', '08031234412');
    expect(disabled('phone-bill-buy')).toBe(false);
    await press('phone-bill-buy');
    expect(asked('POST /bills/validate')).toBe(0);
    expect(billDraft.get()).toMatchObject({ kind: 'data', biller: { code: 'BIL104', name: 'MTN' }, item: { code: 'MD202', amount: 1500 }, customer: '08031234412', amount: 1500 });
    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});

describe('the network chips read whole', () => {
  it('MTN, Airtel, Glo and 9mobile, never the provider’s raw long names', async () => {
    answers['GET /bills/categories/AIRTIME/billers'] = [ok(AIRTIME_BILLERS)];
    await rtl.render(wrap(<PhoneBillScreen kind="airtime" onBack={jest.fn()} onChangeCategory={jest.fn()} onContinue={jest.fn()} />));
    await rtl.screen.findByTestId('networks');
    for (const name of ['MTN', 'Airtel', 'Glo', '9mobile']) expect(rtl.screen.getByText(name)).toBeTruthy();
    for (const raw of ['MTN NIGERIA', 'AIRTEL NIGERIA', 'GLO NIGERIA', '9MOBILE NIGERIA']) expect(rtl.screen.queryByText(raw)).toBeNull();
    // A chip is one short line: it is never cut with "..." in its place.
    const chip = rtl.screen.getByText('9mobile');
    expect(chip.props.numberOfLines).toBe(1);
    expect(rtl.screen.getByTestId('networks-BIL103').props.accessibilityLabel).toBe('9mobile');
  });

  it('the company’s name is tidy wherever it is drawn: the list of companies, Recent, and the receipt', async () => {
    answers['GET /bills/categories/CABLEBILLS/billers'] = [ok([DSTV, GOTV])];
    await rtl.render(wrap(<BillersScreen kind="cable" onBack={jest.fn()} onChangeCategory={jest.fn()} onPick={jest.fn()} />));
    await rtl.screen.findByTestId('biller-BIL119');
    expect(rtl.screen.getByText('DStv')).toBeTruthy();
    expect(rtl.screen.getByText('GOtv')).toBeTruthy();
    expect(rtl.screen.queryByText('DSTV')).toBeNull();
  });

  it('Recent and the receipt draw a bill recorded with the raw name in the tidy one', async () => {
    const BILL = {
      id: 'bill-9',
      category: 'Airtime',
      billerName: 'AIRTEL NIGERIA',
      customerRef: '08089925524',
      amount: 500,
      fee: 0,
      status: 'delivered',
      providerReference: 'BPUSSD9',
      failureReason: null,
      createdAt: '2026-10-29T10:42:00.000Z',
      deliveredAt: '2026-10-29T10:43:00.000Z',
      refundReference: null,
      refundedAt: null,
    };
    answers['GET /bills/mine'] = [ok({ items: [BILL], currentPage: 1, perPage: 50, total: 1 })];
    await rtl.render(wrap(<BillsScreen onBack={jest.fn()} onOpen={jest.fn()} onOpenBill={jest.fn()} />));
    await rtl.screen.findByTestId('bills-recent-bill-9');
    expect(rtl.screen.getByText('Airtel')).toBeTruthy();
    expect(rtl.screen.queryByText('AIRTEL NIGERIA')).toBeNull();
    await rtl.cleanup();
    queryClient.clear();
    answers['GET /bills/mine'] = [ok({ items: [BILL], currentPage: 1, perPage: 50, total: 1 })];
    await rtl.render(wrap(<ReceiptScreen id="bill-9" onDone={jest.fn()} onTryAgain={jest.fn()} />));
    await rtl.screen.findByTestId('receipt-card');
    expect(rtl.screen.getByText('Airtel')).toBeTruthy();
    expect(rtl.screen.queryByText(/AIRTEL NIGERIA/)).toBeNull();
  });
});

describe('cable: picking a company shows its bouquets, and the smartcard comes next', () => {
  const startCable = () => billDraft.start({ kind: 'cable', categoryName: 'Cable Bill Payment', categoryCode: 'CABLEBILLS', biller: { code: 'BIL119', name: 'DStv' } });
  const openItems = (over: Partial<import('../ItemsScreen').ItemsScreenProps> = {}) =>
    rtl.render(wrap(<ItemsScreen onBack={jest.fn()} onChangeCategory={jest.fn()} onChangeBiller={jest.fn()} onMissing={jest.fn()} onContinue={jest.fn()} {...over} />));

  it('the provider’s real DSTV list is drawn as bouquets with their prices', async () => {
    startCable();
    answers['GET /bills/billers/BIL119/items'] = [ok(BOUQUETS)];
    await openItems();
    await rtl.screen.findByTestId('items-list');
    for (const id of ['CB181', 'CB182', 'CB177', 'CB178', 'CB179']) expect(rtl.screen.getByTestId(`item-${id}`)).toBeTruthy();
    expect(rtl.screen.getByText('DSTV COMPACT')).toBeTruthy();
    expect(rtl.screen.queryByTestId('items-none')).toBeNull();
  });

  it('every row is kept whatever way its price arrives: a number, digits in text, or nothing', async () => {
    startCable();
    const odd = [
      { ...BOUQUETS[0], amount: '4400' },
      { ...BOUQUETS[1], amount: '6000.00' },
      { ...BOUQUETS[2], amount: null },
      (({ amount: _dropped, ...rest }) => rest)(BOUQUETS[3]),
      BOUQUETS[4],
    ];
    answers['GET /bills/billers/BIL119/items'] = [ok(odd)];
    await openItems();
    await rtl.screen.findByTestId('items-list');
    for (const id of ['CB181', 'CB182', 'CB177', 'CB178', 'CB179']) expect(rtl.screen.getByTestId(`item-${id}`)).toBeTruthy();
    // A text price is the same price.
    expect(rtl.screen.getByTestId('item-CB181').props.accessibilityLabel).toBe('DSTV PADI, ₦4,400');
  });

  it('a provider that wraps the list in a page still gives its bouquets', async () => {
    startCable();
    answers['GET /bills/billers/BIL119/items'] = [ok({ items: BOUQUETS, currentPage: 1, perPage: 50, total: BOUQUETS.length })];
    await openItems();
    await rtl.screen.findByTestId('items-list');
    expect(rtl.screen.getByTestId('item-CB177')).toBeTruthy();
  });

  it('a bouquet carries its price and its smartcard label to the smartcard step, where the provider checks the card', async () => {
    startCable();
    answers['GET /bills/billers/BIL119/items'] = [ok(BOUQUETS)];
    const onContinue = jest.fn();
    await openItems({ onContinue });
    await rtl.screen.findByTestId('items-list');
    await press('item-CB177');
    await press('items-continue');
    expect(onContinue).toHaveBeenCalledWith(false);
    expect(billDraft.get()?.item).toEqual({ code: 'CB177', name: 'DSTV COMPACT', amount: 15700, label: 'SmartCard Number' });
    await rtl.cleanup();
    answers['POST /bills/validate'] = [ok({ customer: '7021345688', name: 'Chidinma Okoro', fee: 0, minimum: 0, maximum: 0 })];
    const next = jest.fn();
    await rtl.render(wrap(<NumberScreen onBack={jest.fn()} onChangeCategory={jest.fn()} onChangeBiller={jest.fn()} onMissing={jest.fn()} onContinue={next} />));
    // The field is named by the provider’s own label.
    expect(rtl.screen.getByText('Smartcard number')).toBeTruthy();
    expect(rtl.screen.queryByTestId('amount')).toBeNull();
    await type('meter-number', '7021345688');
    await rtl.screen.findByText('Chidinma Okoro', undefined, LATER);
    expect(bodyOf('POST /bills/validate')).toEqual([{ itemCode: 'CB177', customer: '7021345688' }]);
    await press('number-continue');
    expect(next).toHaveBeenCalledTimes(1);
    expect(billDraft.get()).toMatchObject({ customer: '7021345688', amount: 15700 });
  });

  it('the provider’s own page of rows ({ data: [...] }) still gives its bouquets', async () => {
    startCable();
    answers['GET /bills/billers/BIL119/items'] = [ok({ current_page: 1, per_page: 50, total: BOUQUETS.length, data: BOUQUETS })];
    await openItems();
    await rtl.screen.findByTestId('items-list');
    expect(rtl.screen.getByTestId('item-CB178')).toBeTruthy();
  });

  it('a company with no row the app can read says so, with a way back, and never a blank list', async () => {
    startCable();
    answers['GET /bills/billers/BIL119/items'] = [ok([{ id: 1, biller_code: 'BIL119' }, { id: 2 }])];
    await openItems();
    await rtl.screen.findByTestId('items-none');
    expect(rtl.screen.queryByTestId('items-list')).toBeNull();
  });
});

describe('electricity: prepaid and postpaid, and the meter field', () => {
  it('both plans are offered, and the meter field takes the provider’s label', async () => {
    billDraft.start({ kind: 'electricity', categoryName: 'Utility Bills', categoryCode: 'UTILITYBILLS', biller: { code: 'BIL112', name: 'Ikeja Electric' } });
    answers['GET /bills/billers/BIL112/items'] = [ok(IKEJA_ITEMS)];
    const onContinue = jest.fn();
    await rtl.render(wrap(<ItemsScreen onBack={jest.fn()} onChangeCategory={jest.fn()} onChangeBiller={jest.fn()} onMissing={jest.fn()} onContinue={onContinue} />));
    await rtl.screen.findByTestId('items-list');
    expect(rtl.screen.getByText('Which plan?')).toBeTruthy();
    expect(rtl.screen.getByText('IKEDC PREPAID')).toBeTruthy();
    expect(rtl.screen.getByText('IKEDC POSTPAID')).toBeTruthy();
    await press('item-UB158');
    await press('items-continue');
    expect(billDraft.get()?.item).toEqual({ code: 'UB158', name: 'IKEDC POSTPAID', amount: 0, label: 'Meter Number' });
    await rtl.cleanup();
    await rtl.render(wrap(<NumberScreen onBack={jest.fn()} onChangeCategory={jest.fn()} onChangeBiller={jest.fn()} onMissing={jest.fn()} onContinue={jest.fn()} />));
    expect(rtl.screen.getByText('Meter number')).toBeTruthy();
    expect(rtl.screen.getByTestId('bills-step-biller')).toBeTruthy();
    expect(asked('POST /bills/validate')).toBe(0);
  });

  it('a company that sells one plan passes the step by, and the whole chain from the category list works', async () => {
    answers['GET /bills/categories/UTILITYBILLS/billers'] = [ok([IKEJA])];
    answers['GET /bills/billers/BIL112/items'] = [ok([IKEJA_ITEMS[0]])];
    const onPick = jest.fn();
    await rtl.render(wrap(<BillersScreen kind="electricity" onBack={jest.fn()} onChangeCategory={jest.fn()} onPick={onPick} />));
    await rtl.screen.findByTestId('biller-BIL112');
    expect(rtl.screen.getByText('Ikeja Electric')).toBeTruthy();
    await press('biller-BIL112');
    expect(billDraft.get()?.biller).toEqual({ code: 'BIL112', name: 'Ikeja Electric' });
    await rtl.cleanup();
    const onContinue = jest.fn();
    await rtl.render(wrap(<ItemsScreen onBack={jest.fn()} onChangeCategory={jest.fn()} onChangeBiller={jest.fn()} onMissing={jest.fn()} onContinue={onContinue} />));
    await rtl.waitFor(() => expect(onContinue).toHaveBeenCalledWith(true));
    expect(billDraft.get()?.item).toMatchObject({ code: 'UB157', label: 'Meter Number' });
  });
});

describe('"Paying for" and "Biller" sit on one line', () => {
  it('the label never wraps and never gives up room to the value, at any text size', async () => {
    await rtl.render(wrap(<StepChip testID="chip" label="Paying for" value="Cable TV" clearLabel="Change" onClear={jest.fn()} />));
    const label = rtl.screen.getByText('Paying for');
    expect(label.props.numberOfLines).toBe(1);
    const style = StyleSheet.flatten(label.props.style);
    // A fixed 64 wide box wraps "Paying for" once the text is bigger than the board's; the label is as wide as its words (never narrower than the board's column).
    expect(style.width).toBeUndefined();
    expect(style.flexShrink).toBe(0);
    expect(style.minWidth).toBe(64);
    await rtl.cleanup();
    await rtl.render(wrap(<StepChip testID="chip" label="Biller" value="DStv" clearLabel="Change" onClear={jest.fn()} />));
    expect(rtl.screen.getByText('Biller').props.numberOfLines).toBe(1);
  });
});
