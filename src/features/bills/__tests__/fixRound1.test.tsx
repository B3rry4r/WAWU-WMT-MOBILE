/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));
jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn(async () => true) }));

let mockCheckout: { visible: boolean; config: unknown; customer: { email: string }; onEvent: (event: unknown) => void } | null = null;
jest.mock('../CheckoutModal', () => ({
  CheckoutModal: (props: NonNullable<typeof mockCheckout>) => {
    mockCheckout = props;
    return null;
  },
}));

/**
 * BILLS-09 fix round 1 (verifier, lead rulings): an abandoned checkout is never shown as a paid bill; S7 says so when a delivered
 * electricity bill has no token yet; S12 draws the reference it points to and, when the payment went through and the bill failed, says
 * a refund is owed and never "Payment didn't go through".
 */

type Answer = { status: number; body: unknown } | 'offline';
let answers: Record<string, Answer[]> = {};
let sent: string[] = [];
let initGate: Promise<void> | null = null;

const ok = (data: unknown): Answer => ({ status: 200, body: { statusCode: 200, message: 'OK', data } });

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const key = `${request.method} ${url.pathname.replace(/^\/api\/hub/, '')}`;
  sent.push(key);
  if (key === 'POST /bills/init' && initGate) await initGate;
  const queue = answers[key];
  const answer = queue?.[0];
  if (queue && queue.length > 1) queue.shift();
  if (!answer) throw new Error(`no answer for ${key}`);
  if (answer === 'offline') throw new TypeError('Network request failed');
  return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

const { queryClient } = require('@/api/query') as typeof import('@/api/query');
const { BillsScreen } = require('../BillsScreen') as typeof import('../BillsScreen');
const { ReviewScreen } = require('../ReviewScreen') as typeof import('../ReviewScreen');
const { ReceiptScreen, RECEIPT_WORDS, STATUS_READ } = require('../ReceiptScreen') as typeof import('../ReceiptScreen');
const { billDraft } = require('../draft') as typeof import('../draft');

queryClient.setDefaultOptions({ queries: { ...queryClient.getDefaultOptions().queries, retry: false } });

const CATEGORIES = [
  { id: 1, name: 'Airtime', code: 'AIRTIME' },
  { id: 3, name: 'Utility Bills', code: 'UTILITYBILLS' },
];
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
  token: null,
  units: null,
  ...over,
});
const mine = (...items: unknown[]) => [ok({ items, currentPage: 1, perPage: 50, total: items.length })];
const status = (over: Record<string, unknown> = {}) =>
  ok({ id: 'bill-1', status: 'processing', token: null, units: null, providerReference: 'BPUSSD123', ...over });
const ME = { wawuUserId: 'u-1', email: 'ada@example.com', phone: '+2348031234412', firstName: 'Ada', lastName: 'Eze' };
const TOKEN = '4821 0937 5510 2286 7734';

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
const asked = (key: string) => sent.filter((s) => s === key).length;
const press = (testID: string) =>
  rtl.act(async () => {
    rtl.fireEvent.press(rtl.screen.getByTestId(testID));
  });
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
  initGate = null;
  billDraft.clear();
  queryClient.clear();
});

afterEach(async () => {
  jest.useRealTimers();
  await queryClient.cancelQueries();
  rtl.cleanup();
  queryClient.clear();
});

describe('an abandoned checkout is never a paid bill', () => {
  it('Recent never lists a pending bill', async () => {
    answers['GET /bills/categories'] = [ok(CATEGORIES)];
    answers['GET /bills/mine'] = mine(BILL({ id: 'bill-9', status: 'pending', providerReference: null }), BILL({ id: 'bill-2', status: 'delivered' }));
    await rtl.render(wrap(<BillsScreen onBack={jest.fn()} onOpen={jest.fn()} onOpenBill={jest.fn()} />));
    await rtl.screen.findByTestId('bills-recent');
    expect(rtl.screen.queryByTestId('bills-recent-bill-9')).toBeNull();
    expect(rtl.screen.getByTestId('bills-recent-bill-2')).toBeTruthy();
  });

  it('Recent draws nothing when a pending bill is all there is', async () => {
    answers['GET /bills/categories'] = [ok(CATEGORIES)];
    answers['GET /bills/mine'] = mine(BILL({ id: 'bill-9', status: 'pending', providerReference: null }));
    await rtl.render(wrap(<BillsScreen onBack={jest.fn()} onOpen={jest.fn()} onOpenBill={jest.fn()} />));
    await rtl.screen.findByTestId('bills-electricity');
    await settle();
    expect(rtl.screen.queryByTestId('bills-recent')).toBeNull();
  });

  it('the receipt of a pending bill never says the payment was received, offers no share, and says what to do', async () => {
    answers['GET /bills/mine'] = mine(BILL({ id: 'bill-9', status: 'pending', providerReference: null }));
    await rtl.render(wrap(<ReceiptScreen id="bill-9" onDone={jest.fn()} onTryAgain={jest.fn()} />));
    await rtl.screen.findByTestId('receipt-unpaid');
    expect(screenText()).not.toMatch(/Payment received/);
    expect(screenText()).not.toMatch(/on its way/i);
    expect(rtl.screen.queryByTestId('receipt-share')).toBeNull();
    expect(rtl.screen.queryByTestId('receipt-card')).toBeNull();
    expect(rtl.screen.getByText(RECEIPT_WORDS.unpaidTitle)).toBeTruthy();
    expect(rtl.screen.getByText(RECEIPT_WORDS.unpaidLine)).toBeTruthy();
    expect(RECEIPT_WORDS.unpaidLine).not.toMatch(/nothing (was )?charged/i);
    expect(RECEIPT_WORDS.unpaidLine).not.toContain('—');
  });

  it('the list is read again for a paid or pending bill every 15 seconds, and not after 3 minutes', async () => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] });
    answers['GET /bills/mine'] = mine(BILL({ status: 'paid' }));
    await rtl.render(wrap(<ReceiptScreen id="bill-1" onDone={jest.fn()} onTryAgain={jest.fn()} />));
    const flush = async () => {
      for (let i = 0; i < 6; i++) {
        await rtl.act(async () => {
          jest.advanceTimersByTime(1);
          await Promise.resolve();
          await new Promise<void>((resolve) => setImmediate(resolve));
        });
      }
    };
    await flush();
    await flush();
    expect(asked('GET /bills/mine')).toBe(1);
    expect(STATUS_READ.forMs).toBe(180_000);
    for (let s = 0; s < 190; s += 15) {
      await rtl.act(async () => {
        jest.advanceTimersByTime(15_000);
      });
      await flush();
    }
    const after = asked('GET /bills/mine');
    expect(after).toBeGreaterThanOrEqual(12);
    expect(after).toBeLessThanOrEqual(14);
    for (let s = 0; s < 120; s += 15) {
      await rtl.act(async () => {
        jest.advanceTimersByTime(15_000);
      });
      await flush();
    }
    expect(asked('GET /bills/mine')).toBe(after);
  });
});

describe('S5 · closing the window, and Pay once', () => {
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
  const ready = async () => {
    start();
    answers['POST /bills/init'] = [INIT];
    await rtl.render(wrap(<ReviewScreen onBack={jest.fn()} onMissing={jest.fn()} onSettled={jest.fn()} />));
    await rtl.screen.findByTestId('review-pay');
    await rtl.waitFor(() => expect(asked('GET /users/me')).toBe(1));
    await settle();
  };

  it('closing the window without a completed charge says it, in the lead’s words, and claims nothing about what was or was not charged', async () => {
    await ready();
    await press('review-pay');
    await rtl.waitFor(() => expect(mockCheckout?.visible).toBe(true));
    await rtl.act(async () => {
      mockCheckout?.onEvent({ kind: 'closed' });
    });
    await rtl.waitFor(() => expect(mockCheckout?.visible).toBe(false));
    expect(rtl.screen.getByTestId('review-closed')).toBeTruthy();
    expect(rtl.screen.getByText('You closed the payment window. If you finished paying, your bill still goes through and shows in Recent.')).toBeTruthy();
    expect(screenText()).not.toMatch(/nothing (was )?charged/i);
    expect(screenText()).not.toContain('—');
    // It is not an error, and Pay is still there.
    expect(rtl.screen.queryByTestId('review-error')).toBeNull();
    expect(rtl.screen.getByTestId('review-pay')).toBeTruthy();
  });

  it('the line goes when Pay is tapped again', async () => {
    await ready();
    await press('review-pay');
    await rtl.waitFor(() => expect(mockCheckout?.visible).toBe(true));
    await rtl.act(async () => {
      mockCheckout?.onEvent({ kind: 'closed' });
    });
    await rtl.screen.findByTestId('review-closed');
    answers['POST /bills/init'] = [INIT];
    await press('review-pay');
    await rtl.waitFor(() => expect(mockCheckout?.visible).toBe(true));
    expect(rtl.screen.queryByTestId('review-closed')).toBeNull();
  });

  it('a double tap on Pay records one bill: one init at a time', async () => {
    await ready();
    let release: () => void = () => undefined;
    initGate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const button = rtl.screen.getByTestId('review-pay');
    await rtl.act(async () => {
      rtl.fireEvent.press(button);
      rtl.fireEvent.press(button);
      rtl.fireEvent.press(button);
    });
    await settle(10);
    release();
    await rtl.waitFor(() => expect(mockCheckout?.visible).toBe(true));
    expect(asked('POST /bills/init')).toBe(1);
  });

  it('after a refused init Pay works again', async () => {
    await ready();
    answers['POST /bills/init'] = [{ status: 503, body: { statusCode: 503, message: 'Bill payments are briefly unavailable while we top up. Nothing has been charged. Please try again shortly.', data: null } }, INIT];
    await press('review-pay');
    await rtl.screen.findByTestId('review-error');
    await press('review-pay');
    await rtl.waitFor(() => expect(mockCheckout?.visible).toBe(true));
    expect(asked('POST /bills/init')).toBe(2);
  });
});

describe('S7 · a delivered electricity bill with no token yet', () => {
  it('says the token is not here yet, draws the reference it points to, and keeps checking', async () => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] });
    answers['GET /bills/mine'] = mine(BILL({ status: 'delivered' }));
    answers['GET /bills/bill-1/status'] = [status({ status: 'delivered' }), status({ status: 'delivered' }), status({ status: 'delivered', token: '48210937551022867734', units: '45.2' })];
    await rtl.render(wrap(<ReceiptScreen id="bill-1" onDone={jest.fn()} onTryAgain={jest.fn()} />));
    const flush = async () => {
      for (let i = 0; i < 6; i++) {
        await rtl.act(async () => {
          jest.advanceTimersByTime(1);
          await Promise.resolve();
          await new Promise<void>((resolve) => setImmediate(resolve));
        });
      }
    };
    await flush();
    await flush();
    expect(rtl.screen.getByTestId('receipt-token-missing')).toBeTruthy();
    expect(rtl.screen.getByText("Your token isn't here yet. We'll keep checking. If it doesn't show soon, contact support with the reference below.")).toBeTruthy();
    expect(rtl.screen.getByText('Reference')).toBeTruthy();
    expect(rtl.screen.getByText('BPUSSD123')).toBeTruthy();
    expect(rtl.screen.queryByTestId('receipt-token-card')).toBeNull();
    // Paid, as before.
    expect(screenText()).toContain('10,000paid');
    expect(asked('GET /bills/bill-1/status')).toBe(1);
    for (let i = 0; i < 2; i++) {
      await rtl.act(async () => {
        jest.advanceTimersByTime(10_000);
      });
      await flush();
    }
    expect(asked('GET /bills/bill-1/status')).toBe(3);
    await rtl.screen.findByTestId('receipt-token-card');
    expect(rtl.screen.queryByTestId('receipt-token-missing')).toBeNull();
    expect(rtl.screen.getByText('45.2 kWh')).toBeTruthy();
    for (let i = 0; i < 3; i++) {
      await rtl.act(async () => {
        jest.advanceTimersByTime(10_000);
      });
      await flush();
    }
    expect(asked('GET /bills/bill-1/status')).toBe(3);
  });

  it('stops checking after 3 minutes and keeps the line', async () => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] });
    answers['GET /bills/mine'] = mine(BILL({ status: 'delivered' }));
    answers['GET /bills/bill-1/status'] = [status({ status: 'delivered' })];
    await rtl.render(wrap(<ReceiptScreen id="bill-1" onDone={jest.fn()} onTryAgain={jest.fn()} />));
    const flush = async () => {
      for (let i = 0; i < 6; i++) {
        await rtl.act(async () => {
          jest.advanceTimersByTime(1);
          await Promise.resolve();
          await new Promise<void>((resolve) => setImmediate(resolve));
        });
      }
    };
    await flush();
    await flush();
    for (let s = 0; s < 200; s += 10) {
      await rtl.act(async () => {
        jest.advanceTimersByTime(10_000);
      });
      await flush();
    }
    const after = asked('GET /bills/bill-1/status');
    expect(after).toBeLessThanOrEqual(19);
    for (let s = 0; s < 100; s += 10) {
      await rtl.act(async () => {
        jest.advanceTimersByTime(10_000);
      });
      await flush();
    }
    expect(asked('GET /bills/bill-1/status')).toBe(after);
    expect(rtl.screen.getByTestId('receipt-token-missing')).toBeTruthy();
  });

  it('a delivered airtime bill says nothing about a token and is not read', async () => {
    answers['GET /bills/mine'] = mine(BILL({ status: 'delivered', category: 'Airtime', customerRef: '08031234412' }));
    await rtl.render(wrap(<ReceiptScreen id="bill-1" onDone={jest.fn()} onTryAgain={jest.fn()} />));
    await rtl.screen.findByTestId('receipt-card');
    await settle(50);
    expect(rtl.screen.queryByTestId('receipt-token-missing')).toBeNull();
    expect(asked('GET /bills/bill-1/status')).toBe(0);
  });

  it('a delivered electricity bill with its token has no missing line', async () => {
    answers['GET /bills/mine'] = mine(BILL({ status: 'delivered', token: TOKEN }));
    await rtl.render(wrap(<ReceiptScreen id="bill-1" onDone={jest.fn()} onTryAgain={jest.fn()} />));
    await rtl.screen.findByTestId('receipt-token-card');
    expect(rtl.screen.queryByTestId('receipt-token-missing')).toBeNull();
    expect(asked('GET /bills/bill-1/status')).toBe(0);
  });
});

describe('S12 · a bill the biller could not deliver after the payment went through', () => {
  const HUB = 'Your payment went through but Ikeja Electric could not deliver it, so nothing was bought. You will be refunded in full within 3 working days. Quote wawu-bill-9f3 if you need to chase it.';

  it('draws the reference row, follows the Hub’s words, and never says the payment did not go through', async () => {
    answers['GET /bills/mine'] = mine(BILL({ id: 'f-1', status: 'failed', providerReference: 'BPUSSD123' }));
    billDraft.rememberFailure('f-1', HUB);
    await rtl.render(wrap(<ReceiptScreen id="f-1" onDone={jest.fn()} onTryAgain={jest.fn()} />));
    await rtl.screen.findByTestId('failed-card');
    expect(screenText()).not.toMatch(/didn.t go through/i);
    expect(rtl.screen.getByText(RECEIPT_WORDS.failedTitle)).toBeTruthy();
    expect(rtl.screen.getByText(HUB)).toBeTruthy();
    expect(rtl.screen.getByTestId('failed-reference')).toBeTruthy();
    expect(rtl.screen.getByText('BPUSSD123')).toBeTruthy();
    expect(rtl.screen.getByTestId('failed-status')).toBeTruthy();
    expect(rtl.screen.getByText(RECEIPT_WORDS.refundOnItsWay)).toBeTruthy();
    // Money is not said to be back: the Hub has not recorded a refund.
    expect(rtl.screen.queryByText('Refunded')).toBeNull();
    expect(rtl.screen.getByTestId('receipt-retry')).toBeTruthy();
  });

  it('with no provider reference, the reference is the one the Hub quoted in its sentence', async () => {
    answers['GET /bills/mine'] = mine(BILL({ id: 'f-2', status: 'failed', providerReference: null }));
    billDraft.rememberFailure('f-2', HUB);
    await rtl.render(wrap(<ReceiptScreen id="f-2" onDone={jest.fn()} onTryAgain={jest.fn()} />));
    await rtl.screen.findByTestId('failed-card');
    expect(rtl.screen.getByTestId('failed-reference')).toBeTruthy();
    expect(rtl.screen.getByText('wawu-bill-9f3')).toBeTruthy();
  });

  it('reopened from Recent (no sentence kept), the same refund promise comes from the Hub’s record, with its reference below', async () => {
    answers['GET /bills/mine'] = mine(BILL({ id: 'f-3', status: 'failed', providerReference: 'BPUSSD123' }));
    await rtl.render(wrap(<ReceiptScreen id="f-3" onDone={jest.fn()} onTryAgain={jest.fn()} />));
    await rtl.screen.findByTestId('failed-card');
    expect(screenText()).not.toMatch(/didn.t go through/i);
    expect(rtl.screen.getByText(RECEIPT_WORDS.failedTitle)).toBeTruthy();
    expect(rtl.screen.getByTestId('failed-reason').props.children).toBe(
      'Your payment went through but Ikeja Electric could not deliver it, so nothing was bought. You will be refunded in full. Quote the reference below if you need to chase it.',
    );
    expect(rtl.screen.getByText(RECEIPT_WORDS.refundOnItsWay)).toBeTruthy();
    expect(rtl.screen.getByText('BPUSSD123')).toBeTruthy();
  });

  it('reopened with no reference at all, it does not point at a reference that is not there', async () => {
    answers['GET /bills/mine'] = mine(BILL({ id: 'f-4', status: 'failed', providerReference: null }));
    await rtl.render(wrap(<ReceiptScreen id="f-4" onDone={jest.fn()} onTryAgain={jest.fn()} />));
    await rtl.screen.findByTestId('failed-card');
    expect(rtl.screen.queryByTestId('failed-reference')).toBeNull();
    expect(String(rtl.screen.getByTestId('failed-reason').props.children)).not.toMatch(/below/);
    expect(String(rtl.screen.getByTestId('failed-reason').props.children)).toMatch(/refunded in full/);
  });

  it('a refunded bill says so in its own words, with the Hub’s refund reference', async () => {
    answers['GET /bills/mine'] = mine(BILL({ id: 'f-5', status: 'refunded', refundReference: 'RFD-9' }));
    await rtl.render(wrap(<ReceiptScreen id="f-5" onDone={jest.fn()} onTryAgain={jest.fn()} />));
    await rtl.screen.findByTestId('failed-card');
    expect(screenText()).not.toMatch(/didn.t go through/i);
    expect(rtl.screen.getByText(RECEIPT_WORDS.refundedTitle)).toBeTruthy();
    expect(rtl.screen.getByText('Refunded')).toBeTruthy();
    expect(rtl.screen.getByText('RFD-9')).toBeTruthy();
    expect(rtl.screen.getByText('BPUSSD123')).toBeTruthy();
  });
});

describe('the window loads any https page and nothing else (lead ruling, BILLS-02)', () => {
  const { allowsLoad } = require('../checkoutPage') as typeof import('../checkoutPage');
  it('a bank’s own 3-D Secure page may take over the window, wherever it is hosted', () => {
    expect(allowsLoad('https://checkout.flutterwave.com/v3/hosted/pay/abc')).toBe(true);
    expect(allowsLoad('https://secure.acs-bank.example/3ds/challenge?x=1')).toBe(true);
    expect(allowsLoad('https://sandbox.example.co.ng/otp')).toBe(true);
  });
  it('every other scheme, and every app intent, is refused', () => {
    for (const url of ['http://secure.bank.example', 'intent://pay#Intent;scheme=bank;end', 'market://details?id=x', 'whatsapp://send', 'mailto:a@b.c', 'tel:123', 'sms:123', 'javascript:alert(1)', 'data:text/html,hi', 'file:///etc/passwd', 'ftp://x', 'wawu://wallet']) {
      expect(allowsLoad(url)).toBe(false);
    }
  });
});
