/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { darkColors, lightColors } from '@/theme/tokens.generated';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

type Answer = { status: number; body: unknown } | 'offline' | 'hold';
let answers: Record<string, Answer[]> = {};
let sent: { key: string; body: unknown }[] = [];
let held: (() => void)[] = [];

const ok = (data: unknown): Answer => ({ status: 200, body: { statusCode: 200, message: 'OK', data } });
const refusal = (status: number, code: string, message: string, extra: Record<string, unknown> = {}): Answer => ({
  status,
  body: { statusCode: status, message, data: null, reason: { code, message, ...extra } },
});

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
  if (answer === 'hold') {
    return new Promise<Response>((resolve) =>
      held.push(() => resolve(new Response(JSON.stringify({ statusCode: 500, message: 'Released.' }), { status: 500, headers: { 'content-type': 'application/json' } }))),
    );
  }
  if (answer === 'offline') throw new TypeError('Network request failed');
  return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

// Loaded after `fetch` is replaced: the API client keeps the fetch it finds when it is created.
const { queryClient } = require('@/api/query') as typeof import('@/api/query');
const { BillsScreen } = require('../BillsScreen') as typeof import('../BillsScreen');
const { ElectricityBillersScreen } = require('../ElectricityBillersScreen') as typeof import('../ElectricityBillersScreen');
const { MeterAmountScreen } = require('../MeterAmountScreen') as typeof import('../MeterAmountScreen');
const { METER_CHECK_DELAY_MS, takeAmount } = require('../model') as typeof import('../model');

// The app retries a failed read twice before it shows the error; these tests turn that off so the error shows at once.
queryClient.setDefaultOptions({ queries: { ...queryClient.getDefaultOptions().queries, retry: false } });

const BILLERS_PATH = 'GET /bills/electricity/billers';
const PREVIEW_PATH = 'POST /bills/electricity/meter-preview';
const PRESETS = [200000, 500000, 1000000, 2000000];
const biller = (over: Record<string, unknown>) => ({ code: 'X', name: 'X', plan: 'prepaid', minimumKobo: 50000, maximumKobo: 50000000, presetsKobo: PRESETS, ...over });
const IKEJA = biller({ code: 'Ikeja_Electric_Bill_Payment', name: 'Ikeja Electric' });
const EKO_PRE = biller({ code: 'Eko_Prepaid', name: 'Eko Electricity', minimumKobo: 100000, maximumKobo: 50000000, presetsKobo: [200000, 500000, 1000000, 2000000] });
const EKO_POST = biller({ code: 'Eko_Postpaid', name: 'Eko Electricity', plan: 'postpaid', minimumKobo: 90000, maximumKobo: 30000000000 });
const IBADAN = biller({ code: 'Ibadan_Disco_Prepaid', name: 'Ibadan Electric', minimumKobo: 0, maximumKobo: 100000000, presetsKobo: [200000, 500000] });
const PH = biller({ code: 'PhED_Electricity', name: 'Port Harcourt Electric', maximumKobo: 10000000, presetsKobo: PRESETS });
const LIST = ok({ available: true, billers: [IKEJA, EKO_PRE, EKO_POST, IBADAN, PH] });
const NOT_ON = ok({ available: false, billers: [] });
const found = (over: Record<string, unknown> = {}) =>
  ok({ meterNumber: '04123456789', code: 'Ikeja_Electric_Bill_Payment', plan: 'prepaid', name: 'Chidinma Okoro', address: '14 Admiralty Way', ...over });

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
/** A person types in a box. */
const type = (testID: string, text: string) =>
  rtl.act(async () => {
    rtl.fireEvent.changeText(rtl.screen.getByTestId(testID), text);
  });
/** The longest the meter box waits after the last key, and then the answer. */
const LATER = { timeout: METER_CHECK_DELAY_MS + 2500 };

beforeEach(() => {
  answers = {};
  sent = [];
  queryClient.clear();
});

afterEach(async () => {
  held.splice(0).forEach((release) => release());
  await queryClient.cancelQueries();
  await settle(10);
  rtl.cleanup();
  queryClient.clear();
});

describe('S2 · Pay a bill', () => {
  const open = (props: Partial<import('../BillsScreen').BillsScreenProps> = {}) => rtl.render(wrap(<BillsScreen onBack={jest.fn()} onOpenElectricity={jest.fn()} {...props} />));

  it('a user can pick Electricity and its companies (S3) open', async () => {
    answers[BILLERS_PATH] = [LIST];
    const onOpenElectricity = jest.fn();
    await open({ onOpenElectricity });
    await rtl.act(async () => rtl.fireEvent.press(await rtl.screen.findByRole('button', { name: 'Electricity' })));
    expect(onOpenElectricity).toHaveBeenCalledTimes(1);
    expect(rtl.screen.getByText('What are you paying for?')).toBeTruthy();
    expect(rtl.screen.getByText('Pay a bill')).toBeTruthy();
  });

  it('draws what is built: Electricity, and none of the Airtime, Data and Cable TV tiles, the Bill reminders banner or the Recent list (R-47)', async () => {
    answers[BILLERS_PATH] = [LIST];
    await open();
    await rtl.screen.findByRole('button', { name: 'Electricity' });
    expect(rtl.screen.queryByText(/Airtime|Data|Cable TV|Bill reminders|Recent|due in/i)).toBeNull();
    expect(rtl.screen.queryByTestId('bills-not-live')).toBeNull();
    expect(rtl.screen.getAllByRole('button').map((b) => b.props.accessibilityLabel)).toEqual(['Back', 'Electricity']);
  });

  it('asks the Hub for the companies once, and nothing else', async () => {
    answers[BILLERS_PATH] = [LIST];
    await open();
    await rtl.screen.findByRole('button', { name: 'Electricity' });
    expect(sent.map((s) => s.key)).toEqual([BILLERS_PATH]);
  });

  it('shows S13 and a tile that does nothing when the Hub says no company is available', async () => {
    answers[BILLERS_PATH] = [NOT_ON];
    const onOpenElectricity = jest.fn();
    await open({ onOpenElectricity });
    expect(await rtl.screen.findByTestId('bills-not-live')).toBeTruthy();
    expect(rtl.screen.getByText("Bill payments aren't switched on yet")).toBeTruthy();
    expect(rtl.screen.getByText("You'll be able to pay airtime, data, electricity and cable from your wallet here soon.")).toBeTruthy();
    expect(rtl.screen.getByText('Electricity')).toBeTruthy();
    // The greyed tile is not a button.
    expect(rtl.screen.queryByRole('button', { name: 'Electricity' })).toBeNull();
    expect(onOpenElectricity).not.toHaveBeenCalled();
    expect(rtl.screen.getByTestId('bills-not-live-tiles').props.style).toEqual(expect.arrayContaining([expect.objectContaining({ opacity: 0.45 })]));
  });

  it('is S13 only on the Hub’s answer: with companies listed the note is not drawn, and a failed read is not S13', async () => {
    answers[BILLERS_PATH] = [refusal(503, 'provider_unreachable', 'Bill payments are not available right now. Try again in a moment.', { retryAfterSeconds: 30 })];
    await open();
    expect(await rtl.screen.findByTestId('bills-error')).toBeTruthy();
    expect(rtl.screen.queryByTestId('bills-not-live')).toBeNull();
    expect(rtl.screen.queryByText(/switched on/)).toBeNull();
  });

  it('shows the loading shapes while the read is out, with nothing to press but Back', async () => {
    answers[BILLERS_PATH] = ['hold'];
    await open();
    expect(await rtl.screen.findByTestId('bills-loading')).toBeTruthy();
    expect(rtl.screen.queryByRole('button', { name: 'Electricity' })).toBeNull();
    expect(rtl.screen.queryByTestId('bills-not-live')).toBeNull();
  });

  it('a read that fails says so, and Try again asks again and draws the tile', async () => {
    answers[BILLERS_PATH] = [refusal(503, 'provider_unreachable', 'x'), LIST];
    await open();
    expect(await rtl.screen.findByText("Bills didn't load")).toBeTruthy();
    expect(rtl.screen.getByText('We could not reach the bills service. Try again in a moment.')).toBeTruthy();
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Try again' })));
    expect(await rtl.screen.findByRole('button', { name: 'Electricity' })).toBeTruthy();
    expect(asked(BILLERS_PATH)).toBe(2);
  });

  it('with no connection it says so, not that the service is down', async () => {
    answers[BILLERS_PATH] = ['offline'];
    await open();
    expect(await rtl.screen.findByText('No connection. Check your internet and try again.')).toBeTruthy();
    expect(rtl.screen.queryByTestId('bills-not-live')).toBeNull();
  });

  it('an answer it cannot read is an error, never an empty or switched-off screen', async () => {
    answers[BILLERS_PATH] = [ok({ available: true, billers: [{ code: 'x' }] })];
    await open();
    expect(await rtl.screen.findByTestId('bills-error')).toBeTruthy();
    expect(rtl.screen.queryByTestId('bills-not-live')).toBeNull();
  });

  it('back is the bar’s back button', async () => {
    answers[BILLERS_PATH] = [LIST];
    const onBack = jest.fn();
    await open({ onBack });
    await rtl.screen.findByRole('button', { name: 'Electricity' });
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Back' })));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

describe('S3 · Biller', () => {
  const open = (props: Partial<import('../ElectricityBillersScreen').ElectricityBillersScreenProps> = {}) =>
    rtl.render(wrap(<ElectricityBillersScreen onBack={jest.fn()} onChangeCategory={jest.fn()} onPick={jest.fn()} onUnavailable={jest.fn()} {...props} />));

  it('a user sees each company the Hub lists, with its plan, and a company with two plans twice', async () => {
    answers[BILLERS_PATH] = [LIST];
    await open();
    expect(await rtl.screen.findByRole('button', { name: 'Ikeja Electric, Prepaid' })).toBeTruthy();
    const rows = rtl.within(rtl.screen.getByTestId('billers-list')).getAllByRole('button').map((b) => b.props.accessibilityLabel);
    expect(rows).toEqual([
      'Ikeja Electric, Prepaid',
      'Eko Electricity, Prepaid',
      'Eko Electricity, Postpaid',
      'Ibadan Electric, Prepaid',
      'Port Harcourt Electric, Prepaid',
    ]);
    expect(rtl.screen.getByText('Who are you paying?')).toBeTruthy();
    // The canvas's own words are not copied: only what the Hub sends is drawn.
    expect(rtl.screen.queryByText('Prepaid and postpaid')).toBeNull();
    expect(rtl.screen.queryByText('Abuja Electric')).toBeNull();
  });

  it('every row is the Hub’s: a different list draws a different set of companies', async () => {
    answers[BILLERS_PATH] = [ok({ available: true, billers: [biller({ code: 'Aba_Power_Postpaid', name: 'Aba Power', plan: 'postpaid' })] })];
    await open();
    expect(await rtl.screen.findByRole('button', { name: 'Aba Power, Postpaid' })).toBeTruthy();
    expect(rtl.screen.queryByText('Ikeja Electric')).toBeNull();
    expect(rtl.within(rtl.screen.getByTestId('biller-Aba_Power_Postpaid')).getByText('AP', { includeHiddenElements: true })).toBeTruthy();
  });

  it('draws the badge from the first letters of the name and the paying-for chip with its X', async () => {
    answers[BILLERS_PATH] = [LIST];
    const onChangeCategory = jest.fn();
    await open({ onChangeCategory });
    await rtl.screen.findByTestId('billers-list');
    expect(rtl.within(rtl.screen.getByTestId('biller-Ikeja_Electric_Bill_Payment')).getByText('IE', { includeHiddenElements: true })).toBeTruthy();
    expect(rtl.within(rtl.screen.getByTestId('biller-PhED_Electricity')).getByText('PH', { includeHiddenElements: true })).toBeTruthy();
    expect(rtl.screen.getByText('Paying for')).toBeTruthy();
    expect(rtl.screen.getByText('Electricity')).toBeTruthy();
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Change what you are paying for' })));
    expect(onChangeCategory).toHaveBeenCalledTimes(1);
  });

  it('a user can pick a company and its code goes on to S4', async () => {
    answers[BILLERS_PATH] = [LIST];
    const onPick = jest.fn();
    await open({ onPick });
    await rtl.act(async () => rtl.fireEvent.press(await rtl.screen.findByRole('button', { name: 'Eko Electricity, Postpaid' })));
    expect(onPick).toHaveBeenCalledWith('Eko_Postpaid');
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Eko Electricity, Prepaid' })));
    expect(onPick).toHaveBeenLastCalledWith('Eko_Prepaid');
  });

  it('sends the person back to S2 when the Hub says bills are not on, and draws no company', async () => {
    answers[BILLERS_PATH] = [NOT_ON];
    const onUnavailable = jest.fn();
    await open({ onUnavailable });
    await rtl.waitFor(() => expect(onUnavailable).toHaveBeenCalledTimes(1));
    expect(rtl.screen.queryByTestId('billers-list')).toBeNull();
  });

  it('shows loading shapes while the read is out', async () => {
    answers[BILLERS_PATH] = ['hold'];
    await open();
    expect(await rtl.screen.findByTestId('billers-loading')).toBeTruthy();
    expect(rtl.screen.queryByTestId('billers-list')).toBeNull();
  });

  it('shows an error with Try again when the read fails, and Try again draws the list', async () => {
    answers[BILLERS_PATH] = [refusal(503, 'provider_unreachable', 'x'), LIST];
    await open();
    expect(await rtl.screen.findByTestId('billers-error')).toBeTruthy();
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Try again' })));
    expect(await rtl.screen.findByTestId('billers-list')).toBeTruthy();
  });
});

describe('S4 · Meter and amount (S10 when the meter is not found)', () => {
  const open = (code = 'Ikeja_Electric_Bill_Payment', props: Partial<import('../MeterAmountScreen').MeterAmountScreenProps> = {}) =>
    rtl.render(
      wrap(
        <MeterAmountScreen code={code} onBack={jest.fn()} onChangeCategory={jest.fn()} onChangeBiller={jest.fn()} onMissing={jest.fn()} onUnavailable={jest.fn()} {...props} />,
      ),
    );
  const ready = async (code?: string, props?: Partial<import('../MeterAmountScreen').MeterAmountScreenProps>) => {
    answers[BILLERS_PATH] = [LIST];
    await open(code, props);
    await rtl.screen.findByTestId('meter-amount');
  };

  it('shows the chosen kind and company, and each X takes its choice back', async () => {
    const onChangeCategory = jest.fn();
    const onChangeBiller = jest.fn();
    await ready('Eko_Postpaid', { onChangeCategory, onChangeBiller });
    expect(rtl.screen.getByText('Eko Electricity · Postpaid')).toBeTruthy();
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Change the company' })));
    expect(onChangeBiller).toHaveBeenCalledTimes(1);
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Change what you are paying for' })));
    expect(onChangeCategory).toHaveBeenCalledTimes(1);
  });

  it('draws no Continue: its screen (S5) is BILLS-02’s (R-47)', async () => {
    await ready();
    expect(rtl.screen.queryByText('Continue')).toBeNull();
    expect(rtl.screen.queryByRole('button', { name: /continue/i })).toBeNull();
  });

  it('a user can enter a meter number and see the name and address on it', async () => {
    await ready();
    answers[PREVIEW_PATH] = [found()];
    await type('meter-number', '0412 3456 789');
    expect(rtl.screen.getByTestId('meter-number').props.value).toBe('0412 3456 789');
    // Nothing is asked while the person is still typing.
    expect(asked(PREVIEW_PATH)).toBe(0);
    expect(await rtl.screen.findByText('Chidinma Okoro · 14 Admiralty Way', undefined, LATER)).toBeTruthy();
    expect(rtl.screen.getByTestId('meter-line')).toBeTruthy();
    expect(sent.filter((s) => s.key === PREVIEW_PATH).map((s) => s.body)).toEqual([{ code: 'Ikeja_Electric_Bill_Payment', meterNumber: '04123456789' }]);
  });

  it('says only the name when the Hub has no address', async () => {
    await ready();
    answers[PREVIEW_PATH] = [found({ address: null })];
    await type('meter-number', '04123456789');
    expect(await rtl.screen.findByText('Chidinma Okoro', undefined, LATER)).toBeTruthy();
    expect(rtl.screen.queryByText(/Meter found/)).toBeNull();
  });

  it('never draws "Meter found": an answer without a name (an older Hub) is a meter that could not be confirmed (D2)', async () => {
    await ready();
    answers[PREVIEW_PATH] = [found({ name: null, address: null })];
    await type('meter-number', '04123456789');
    expect(await rtl.screen.findByText("We couldn't confirm this meter.", undefined, LATER)).toBeTruthy();
    expect(rtl.screen.queryByText(/Meter found/)).toBeNull();
    expect(rtl.screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
  });

  it('an answer with a blank name is not a found meter either', async () => {
    await ready();
    answers[PREVIEW_PATH] = [found({ name: '   ', address: '14 Admiralty Way' })];
    await type('meter-number', '04123456789');
    expect(await rtl.screen.findByText("We couldn't confirm this meter.", undefined, LATER)).toBeTruthy();
    expect(rtl.screen.queryByText(/Admiralty/)).toBeNull();
  });

  it('D2: a meter the Hub could not confirm says so in plain words with Try again, never green and never "not found"', async () => {
    await ready();
    answers[PREVIEW_PATH] = [refusal(502, 'meter_unconfirmed', "We couldn't confirm this meter. Try again."), found()];
    await type('meter-number', '04123456789');
    expect(await rtl.screen.findByText("We couldn't confirm this meter.", undefined, LATER)).toBeTruthy();
    expect(rtl.screen.queryByText(/couldn't find/)).toBeNull();
    expect(rtl.screen.queryByText(/Meter found/)).toBeNull();
    // The line is an alert in the danger colour, with Try again beside it.
    const line = rtl.screen.getByTestId('meter-line');
    expect(line.props.accessibilityRole).toBe('alert');
    const words = rtl.within(line).getByText("We couldn't confirm this meter.");
    expect(StyleSheet.flatten(words.props.style).color).not.toBe(lightColors.positive);
    expect([lightColors.danger, darkColors.danger]).toContain(StyleSheet.flatten(words.props.style).color);
    // The box is not reddened as a meter that does not exist is.
    const box = StyleSheet.flatten(rtl.screen.getByTestId('meter-number').parent!.props.style);
    expect([lightColors.danger, darkColors.danger]).not.toContain(box.borderColor);
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Try again' })));
    expect(await rtl.screen.findByText('Chidinma Okoro · 14 Admiralty Way')).toBeTruthy();
    expect(asked(PREVIEW_PATH)).toBe(2);
  });

  it('every word under the number is the Hub’s: another name and address are drawn as they come', async () => {
    await ready();
    answers[PREVIEW_PATH] = [found({ name: 'Ada Eze', address: '2 Bode Thomas Street' })];
    await type('meter-number', '04123456789');
    expect(await rtl.screen.findByText('Ada Eze · 2 Bode Thomas Street', undefined, LATER)).toBeTruthy();
    expect(rtl.screen.queryByText(/Chidinma|Admiralty/)).toBeNull();
  });

  it('D9: text from the provider wraps inside S4: the words can shrink to the row and break a long word, with no line running off the edge', async () => {
    await ready();
    const name = 'N'.repeat(200);
    answers[PREVIEW_PATH] = [found({ name, address: 'A'.repeat(200) })];
    await type('meter-number', '04123456789');
    const words = await rtl.screen.findByText(`${name} · ${'A'.repeat(200)}`, undefined, LATER);
    const style = StyleSheet.flatten(words.props.style);
    expect(style.flexShrink).toBe(1);
    // A flex item's default minimum is its longest word: without this the web draws a 200 character name past the right edge.
    expect(style.minWidth).toBe(0);
    expect(words.props.numberOfLines).toBeUndefined();
  });

  it('D1: the amount box offers a keyboard with a decimal point, so kobo can be typed on a phone', async () => {
    await ready();
    expect(rtl.screen.getByTestId('amount').props.keyboardType).toBe('decimal-pad');
    // The meter number is digits only.
    expect(rtl.screen.getByTestId('meter-number').props.keyboardType).toBe('number-pad');
  });

  it('S10: a meter Fintava does not know says "We couldn\'t find this meter. Check the number." and reddens the box', async () => {
    await ready();
    answers[PREVIEW_PATH] = [refusal(422, 'meter_not_found', "We couldn't find this meter. Check the number.")];
    await type('meter-number', '1111111111111');
    expect(await rtl.screen.findByText("We couldn't find this meter. Check the number.", undefined, LATER)).toBeTruthy();
    expect(rtl.screen.getByTestId('meter-line')).toBeTruthy();
    const box = StyleSheet.flatten(rtl.screen.getByTestId('meter-number').parent!.props.style);
    expect([lightColors.danger, darkColors.danger]).toContain(box.borderColor);
    expect(box.borderWidth).toBe(1.5);
    expect(rtl.screen.queryByText('Meter found')).toBeNull();
  });

  it('asks for a check only once ten digits are typed and the person has stopped (U3)', async () => {
    await ready();
    answers[PREVIEW_PATH] = [found()];
    // Five to nine digits, and a long pause: nothing is asked and nothing is said, so no red sentence flashes mid-typing.
    await type('meter-number', '99999');
    await settle(METER_CHECK_DELAY_MS + 300);
    expect(asked(PREVIEW_PATH)).toBe(0);
    expect(rtl.screen.queryByTestId('meter-line')).toBeNull();
    await type('meter-number', '041234567');
    await settle(METER_CHECK_DELAY_MS + 300);
    expect(asked(PREVIEW_PATH)).toBe(0);
    expect(rtl.screen.queryByTestId('meter-line')).toBeNull();
    await type('meter-number', '0412345678');
    await rtl.waitFor(() => expect(asked(PREVIEW_PATH)).toBe(1), LATER);
    expect(sent.filter((s) => s.key === PREVIEW_PATH)[0].body).toEqual({ code: 'Ikeja_Electric_Bill_Payment', meterNumber: '0412345678' });
  });

  describe('D3: the wait after the last key is 600 ms, pinned with a literal and fake timers', () => {
    // The real timers of the other tests are put back whatever happens here.
    afterEach(() => jest.useRealTimers());
    const flush = () =>
      rtl.act(async () => {
        for (let i = 0; i < 5; i += 1) await new Promise((resolve) => setImmediate(resolve));
      });
    const advance = async (ms: number) => {
      await rtl.act(async () => {
        jest.advanceTimersByTime(ms);
      });
      await flush();
    };

    it('eleven digits typed 100 ms apart ask nothing until 600 ms after the last, and then ask once', async () => {
      await ready();
      answers[PREVIEW_PATH] = [found()];
      jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] });
      const digits = '04123456789';
      for (let i = 1; i <= digits.length; i += 1) {
        await type('meter-number', digits.slice(0, i));
        await advance(100);
      }
      // 100 ms have passed since the last key. Another 499 ms is 599 in all: still nothing asked, nothing said.
      await advance(499);
      expect(asked(PREVIEW_PATH)).toBe(0);
      expect(rtl.screen.queryByTestId('meter-line')).toBeNull();
      // One more millisecond is the 600th: exactly one check.
      await advance(1);
      expect(asked(PREVIEW_PATH)).toBe(1);
      expect(sent.filter((s) => s.key === PREVIEW_PATH)[0].body).toEqual({ code: 'Ikeja_Electric_Bill_Payment', meterNumber: digits });
      // Quiet for much longer asks nothing more.
      await advance(5000);
      expect(asked(PREVIEW_PATH)).toBe(1);
    });

    it('a key pressed 599 ms after the last starts the wait again', async () => {
      await ready();
      answers[PREVIEW_PATH] = [found(), found({ meterNumber: '041234567890' })];
      jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] });
      await type('meter-number', '0412345678');
      await advance(599);
      expect(asked(PREVIEW_PATH)).toBe(0);
      await type('meter-number', '04123456789');
      await advance(599);
      expect(asked(PREVIEW_PATH)).toBe(0);
      await advance(1);
      expect(asked(PREVIEW_PATH)).toBe(1);
      expect(sent.filter((s) => s.key === PREVIEW_PATH)[0].body).toMatchObject({ meterNumber: '04123456789' });
    });

    it('ten digits are enough and nine are not, however long the person waits', async () => {
      await ready();
      answers[PREVIEW_PATH] = [found()];
      jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] });
      await type('meter-number', '041234567');
      await advance(60_000);
      expect(asked(PREVIEW_PATH)).toBe(0);
      await type('meter-number', '0412345678');
      await advance(599);
      expect(asked(PREVIEW_PATH)).toBe(0);
      await advance(1);
      expect(asked(PREVIEW_PATH)).toBe(1);
    });
  });

  it('takes digits only, from a number pasted with letters, spaces and dashes, and at most twenty', async () => {
    await ready();
    answers[PREVIEW_PATH] = [found()];
    await type('meter-number', 'ab04-12 34x56789');
    expect(rtl.screen.getByTestId('meter-number').props.value).toBe('0412 3456 789');
    await type('meter-number', '1'.repeat(30));
    expect(rtl.screen.getByTestId('meter-number').props.value.replace(/ /g, '')).toHaveLength(20);
  });

  it('never shows the answer for an earlier number: editing the number clears the line until the new check answers', async () => {
    await ready();
    answers[PREVIEW_PATH] = [found(), found({ name: 'Second Person', address: null })];
    await type('meter-number', '04123456789');
    expect(await rtl.screen.findByText('Chidinma Okoro · 14 Admiralty Way', undefined, LATER)).toBeTruthy();
    await type('meter-number', '041234567890');
    expect(rtl.screen.queryByText(/Chidinma/)).toBeNull();
    expect(rtl.screen.queryByTestId('meter-line')).toBeNull();
    expect(await rtl.screen.findByText('Second Person', undefined, LATER)).toBeTruthy();
  });

  it('says "Checking this meter" while the check is out', async () => {
    await ready();
    answers[PREVIEW_PATH] = ['hold'];
    await type('meter-number', '04123456789');
    expect(await rtl.screen.findByText('Checking this meter', undefined, LATER)).toBeTruthy();
  });

  it('a check that could not be made says so in the Hub’s words and Try again asks again', async () => {
    await ready();
    answers[PREVIEW_PATH] = [refusal(503, 'provider_unreachable', 'Bill payments are not available right now. Try again in a moment.', { retryAfterSeconds: 30 }), found()];
    await type('meter-number', '04123456789');
    expect(await rtl.screen.findByText('Bill payments are not available right now. Try again in a moment.', undefined, LATER)).toBeTruthy();
    expect(rtl.screen.queryByText("We couldn't find this meter. Check the number.")).toBeNull();
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Try again' })));
    expect(await rtl.screen.findByText('Chidinma Okoro · 14 Admiralty Way')).toBeTruthy();
    expect(asked(PREVIEW_PATH)).toBe(2);
  });

  it('too many checks says so in the Hub’s words, not that the meter was not found', async () => {
    await ready();
    answers[PREVIEW_PATH] = [refusal(429, 'bills_rate_limited', 'You have checked a lot of meters. Wait a moment, then try again.', { retryAfterSeconds: 20 })];
    await type('meter-number', '04123456789');
    expect(await rtl.screen.findByText('You have checked a lot of meters. Wait a moment, then try again.', undefined, LATER)).toBeTruthy();
    expect(rtl.screen.queryByText(/couldn't find/)).toBeNull();
  });

  it('goes to S2 (S13) and asks the list again when the check says bills are not switched on', async () => {
    const onUnavailable = jest.fn();
    await ready(undefined, { onUnavailable });
    answers[PREVIEW_PATH] = [refusal(503, 'bills_unavailable', "Bill payments aren't switched on yet.")];
    await type('meter-number', '04123456789');
    await rtl.waitFor(() => expect(onUnavailable).toHaveBeenCalledTimes(1), LATER);
    await rtl.waitFor(() => expect(asked(BILLERS_PATH)).toBe(2));
  });

  it('D6: S2 is S13 at once: the kept list is replaced by "not available" before S2 is drawn, not after the next read', async () => {
    const seen: unknown[] = [];
    // The list is asked again after the check; this answer is the Hub still holding a list that looks fine (the old behaviour).
    answers[BILLERS_PATH] = [LIST];
    answers[PREVIEW_PATH] = [refusal(503, 'bills_unavailable', "Bill payments aren't switched on yet.")];
    await ready(undefined, {
      onUnavailable: () => seen.push(queryClient.getQueryData(['bills', 'electricity', 'billers'])),
    });
    await type('meter-number', '04123456789');
    await rtl.waitFor(() => expect(seen).toHaveLength(1), LATER);
    // At the moment S4 hands over to S2 the list S2 will draw already says S13.
    expect(seen[0]).toEqual({ available: false, billers: [] });
  });

  it('offers the Hub’s quick amounts for this company, in order, and a tap fills the amount box', async () => {
    await ready('Ibadan_Disco_Prepaid');
    const chips = rtl.within(rtl.screen.getByTestId('amount-presets')).getAllByRole('button').map((b) => b.props.accessibilityLabel);
    expect(chips).toEqual(['₦2,000', '₦5,000']);
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByRole('button', { name: '₦5,000' })));
    expect(rtl.screen.getByTestId('amount').props.value).toBe('5,000');
    expect(rtl.screen.getByTestId('amount-glyph', { includeHiddenElements: true })).toBeTruthy();
    expect(rtl.screen.getByRole('button', { name: '₦5,000' }).props.accessibilityState.selected).toBe(true);
    expect(rtl.screen.getByRole('button', { name: '₦2,000' }).props.accessibilityState.selected).toBe(false);
  });

  it('draws no quick amount when the Hub sends none', async () => {
    answers[BILLERS_PATH] = [ok({ available: true, billers: [biller({ code: 'A', name: 'Alpha Power', presetsKobo: [] })] })];
    await open('A');
    await rtl.screen.findByTestId('meter-amount');
    expect(rtl.screen.queryByTestId('amount-presets')).toBeNull();
  });

  it('a user can type their own amount, drawn in naira with commas', async () => {
    await ready();
    await type('amount', '12500');
    expect(rtl.screen.getByTestId('amount').props.value).toBe('12,500');
    await type('amount', '₦12,500x9');
    expect(rtl.screen.getByTestId('amount').props.value).toBe('125,009');
    await type('amount', '000');
    expect(rtl.screen.getByTestId('amount').props.value).toBe('');
    expect(rtl.screen.getByTestId('amount').props.placeholder).toBe('Amount');
    // Nothing typed: no naira sign beside the placeholder.
    expect(rtl.screen.queryByTestId('amount-glyph', { includeHiddenElements: true })).toBeNull();
  });

  describe('D1: a decimal point is kobo, never more naira', () => {
    const kobo = (text: string, previous = '') => takeAmount(text, previous);

    it('"10,000.00" is ten thousand naira and "1,500.50" is ₦1,500.50, typed or pasted', async () => {
      await ready('Eko_Postpaid');
      await type('amount', '10,000.00');
      expect(rtl.screen.getByTestId('amount').props.value).toBe('10,000.00');
      // Eko postpaid allows ₦300,000,000: a million would have been accepted without a word.
      expect(rtl.screen.queryByTestId('amount-line')).toBeNull();
      expect(rtl.screen.getByRole('button', { name: '₦10,000' }).props.accessibilityState.selected).toBe(true);
      await type('amount', '1,500.50');
      expect(rtl.screen.getByTestId('amount').props.value).toBe('1,500.50');
      expect(rtl.screen.getByRole('button', { name: '₦10,000' }).props.accessibilityState.selected).toBe(false);
      expect(kobo('1,500.50')).toBe('1500.50');
    });

    it('keys typed one at a time reach the same figure, and the third kobo digit and a second point are not taken', async () => {
      await ready('Eko_Postpaid');
      for (const typed of ['1', '15', '150', '1,500', '1,500.', '1,500.5', '1,500.50', '1,500.505', '1,500.50.']) await type('amount', typed);
      expect(rtl.screen.getByTestId('amount').props.value).toBe('1,500.50');
    });

    it('a paste with too many kobo digits or two points is not taken at all, not cut to fit', async () => {
      await ready('Eko_Postpaid');
      await type('amount', '5000');
      await type('amount', '10.999');
      expect(rtl.screen.getByTestId('amount').props.value).toBe('5,000');
      await type('amount', '1.2.3');
      expect(rtl.screen.getByTestId('amount').props.value).toBe('5,000');
      await type('amount', '1'.repeat(15));
      expect(rtl.screen.getByTestId('amount').props.value).toBe('5,000');
    });

    it('checks the limits in kobo: ₦999.99 is below a ₦1,000 minimum and ₦1,000.01 is not', async () => {
      await ready('Eko_Prepaid');
      await type('amount', '999.99');
      expect(rtl.screen.getByText('The least you can pay is ₦1,000.')).toBeTruthy();
      await type('amount', '1,000.01');
      expect(rtl.screen.queryByTestId('amount-line')).toBeNull();
      await type('amount', '500,000.01');
      expect(rtl.screen.getByText('The most you can pay is ₦500,000.')).toBeTruthy();
      await type('amount', '500,000.00');
      expect(rtl.screen.queryByTestId('amount-line')).toBeNull();
    });

    it('words a limit that has kobo with its kobo', async () => {
      answers[BILLERS_PATH] = [ok({ available: true, billers: [biller({ code: 'K', name: 'Kobo Power', minimumKobo: 100050, maximumKobo: 10000005, presetsKobo: [] })] })];
      await open('K');
      await rtl.screen.findByTestId('meter-amount');
      await type('amount', '1000');
      expect(rtl.screen.getByText('The least you can pay is ₦1,000.50.')).toBeTruthy();
      await type('amount', '100,000.06');
      expect(rtl.screen.getByText('The most you can pay is ₦100,000.05.')).toBeTruthy();
    });
  });

  it('D8: the naira sign beside the amount is drawn in the phone’s own face, which has it, and the digits in the app’s face', async () => {
    await ready();
    await type('amount', '10000');
    const glyph = rtl.screen.getByTestId('amount-glyph', { includeHiddenElements: true });
    expect(glyph.props.children).toBe('₦');
    const glyphStyle = StyleSheet.flatten(glyph.props.style);
    expect(glyphStyle.fontFamily).toBe('System');
    const inputStyle = StyleSheet.flatten(rtl.screen.getByTestId('amount').props.style);
    expect(String(inputStyle.fontFamily)).toMatch(/AlanSans/);
    // Same size and line as the digits, so the two read as one figure.
    expect(glyphStyle.fontSize).toBe(inputStyle.fontSize);
    expect(glyphStyle.lineHeight).toBe(inputStyle.lineHeight);
    // The sign is not read out twice, and the input still says what it is for.
    expect(rtl.screen.getByTestId('amount').props.accessibilityLabel).toBe('Amount');
  });

  it('an amount below this company’s own minimum says so with that minimum, and one above its maximum with that maximum', async () => {
    await ready('Eko_Prepaid');
    await type('amount', '999');
    expect(rtl.screen.getByText('The least you can pay is ₦1,000.')).toBeTruthy();
    await type('amount', '1000');
    expect(rtl.screen.queryByTestId('amount-line')).toBeNull();
    await type('amount', '500000');
    expect(rtl.screen.queryByTestId('amount-line')).toBeNull();
    await type('amount', '500001');
    expect(rtl.screen.getByText('The most you can pay is ₦500,000.')).toBeTruthy();
  });

  it('the limits are each company’s own: Port Harcourt stops at ₦100,000', async () => {
    await ready('PhED_Electricity');
    await type('amount', '100001');
    expect(rtl.screen.getByText('The most you can pay is ₦100,000.')).toBeTruthy();
    await type('amount', '100000');
    expect(rtl.screen.queryByTestId('amount-line')).toBeNull();
  });

  it('a company that lists no minimum takes any amount from ₦1', async () => {
    await ready('Ibadan_Disco_Prepaid');
    await type('amount', '1');
    expect(rtl.screen.queryByTestId('amount-line')).toBeNull();
  });

  it('a code that is not on the list now goes back to the companies, and asks about no meter', async () => {
    const onMissing = jest.fn();
    answers[BILLERS_PATH] = [LIST];
    await open('Nope_Disco', { onMissing });
    await rtl.waitFor(() => expect(onMissing).toHaveBeenCalledTimes(1));
    expect(rtl.screen.queryByTestId('meter-number')).toBeNull();
    expect(asked(PREVIEW_PATH)).toBe(0);
  });

  it('goes to S2 when the list says bills are not on', async () => {
    const onUnavailable = jest.fn();
    answers[BILLERS_PATH] = [NOT_ON];
    await open('Ikeja_Electric_Bill_Payment', { onUnavailable });
    await rtl.waitFor(() => expect(onUnavailable).toHaveBeenCalledTimes(1));
    expect(rtl.screen.queryByTestId('meter-number')).toBeNull();
  });

  it('shows loading shapes while the list is out', async () => {
    answers[BILLERS_PATH] = ['hold'];
    await open();
    expect(await rtl.screen.findByTestId('meter-skeleton')).toBeTruthy();
    expect(rtl.screen.queryByTestId('meter-number')).toBeNull();
  });

  it('shows an error with Try again when the list fails, and Try again draws the form', async () => {
    answers[BILLERS_PATH] = [refusal(503, 'provider_unreachable', 'x'), LIST];
    await open();
    expect(await rtl.screen.findByText("Couldn't load this company")).toBeTruthy();
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Try again' })));
    expect(await rtl.screen.findByTestId('meter-amount')).toBeTruthy();
  });

  it('back is the bar’s back button', async () => {
    const onBack = jest.fn();
    await ready(undefined, { onBack });
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Back' })));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
