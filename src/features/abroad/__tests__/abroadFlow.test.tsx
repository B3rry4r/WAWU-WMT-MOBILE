/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import { fireEvent, renderRouter, screen, waitFor, within } from 'expo-router/testing-library';
import { Text, View } from 'react-native';

import type { ComponentType } from 'react';

/*
 * Send abroad (NUV-11) on the real Expo Router stack: W7's Abroad tab, a new recipient with the fields the Hub draws for the country,
 * the amount with the Hub's quote, the review, the PIN, and the receipt. The Hub is a stand-in `fetch` installed before the app's
 * modules load; it answers in the Hub's shapes and records every send's headers and body.
 */
const mockVault = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockVault.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockVault.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    mockVault.delete(key);
  }),
}));

const field = (key: string, label: string, kind = 'text', extra: Record<string, unknown> = {}) => ({
  key,
  label,
  kind,
  pattern: null,
  hint: null,
  options: null,
  ...extra,
});
const GHANA = {
  country: 'GH',
  name: 'Ghana',
  currency: 'GHS',
  decimals: 2,
  available: true,
  unavailableNote: null,
  rails: [
    {
      method: 'bank',
      label: 'Bank account',
      directory: true,
      minReceiveMinor: null,
      maxReceiveMinor: null,
      schemes: [
        {
          id: null,
          label: 'Bank account',
          speed: 'Same day',
          fields: [
            field('bank', 'Bank', 'bank'),
            field('account_number', 'Account number', 'digits', {
              pattern: '^[0-9A-Za-z -]{4,34}$',
            }),
          ],
        },
      ],
    },
    {
      method: 'mobile_money',
      label: 'Mobile money',
      directory: false,
      minReceiveMinor: 500,
      maxReceiveMinor: 2_500_000,
      schemes: [
        {
          id: 'mtn',
          label: 'MTN',
          speed: 'Instant',
          fields: [
            field('phone_number', 'Mobile money number', 'phone', {
              pattern: '^\\+[1-9][0-9]{7,14}$',
            }),
          ],
        },
        {
          id: 'vodafone',
          label: 'Vodafone',
          speed: 'Instant',
          fields: [
            field('phone_number', 'Mobile money number', 'phone', {
              pattern: '^\\+[1-9][0-9]{7,14}$',
            }),
          ],
        },
      ],
    },
  ],
};
const UGANDA = {
  ...GHANA,
  country: 'UG',
  name: 'Uganda',
  currency: 'UGX',
  available: false,
  unavailableNote: 'We cannot send here yet.',
};
const RECIPIENT = {
  id: '11111111-1111-4111-8111-111111111111',
  country: 'GH',
  countryName: 'Ghana',
  currency: 'GHS',
  method: 'mobile_money',
  scheme: 'mtn',
  holderName: 'Ama Mensah',
  bankName: null,
  last4: '4567',
  summary: 'Ghana, MTN, ending 4567',
  createdAt: '2026-10-24T10:00:00.000Z',
};
const SEND_ID = '22222222-2222-4222-8222-222222222222';

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
const ok = (data: unknown, status = 200) => json(status, { statusCode: status, message: 'OK', data });
const refuse = (status: number, reason: Record<string, unknown>) =>
  json(status, {
    data: null,
    statusCode: status,
    message: String(reason.message ?? ''),
    reason,
  });

type Mode = 'ok' | 'expired' | 'short' | 'no_answer';
const hub = {
  enabled: true,
  mode: 'ok' as Mode,
  rate: 'ready' as 'ready' | 'unavailable',
  /** Accounts the Hub cannot get a rate from (FX-POLISH P3): a quote from one is refused `rate_unavailable`. */
  noRateFrom: [] as string[],
  /** A quote the corridor will not take: its words and the range it gives. */
  outOfRange: null as null | { message: string; minimumMinor: number; maximumMinor: number | null },
  /** The partner fee the Hub shows on a quote (R-10), in the sending currency's smallest unit; null: none configured. */
  partnerFee: 150 as number | null,
  /** WAWU's fee taken from the foreign account the money leaves (WALLET-42), in the sending currency's smallest unit. */
  feeMinor: 0,
  /** The accounts the Hub lists to send from; null: a naira account and a dollar account. */
  sources: null as unknown[] | null,
  /** What the Hub does with the accounts request: answers, never answers (still loading) or fails. */
  sourcesMode: 'ok' as 'ok' | 'hang' | 'fail',
  wrongFirst: false,
  recipients: [] as unknown[],
  saves: [] as Record<string, unknown>[],
  quotes: [] as Record<string, unknown>[],
  sends: [] as {
    pin: string | null;
    key: string | null;
    body: Record<string, unknown>;
  }[],
  status: 'pending',
};

function quoteFor(body: { fromCurrency: string; amountMinor: number; side?: string }) {
  const toMinor = body.side === 'receive' ? body.amountMinor : Math.floor(body.amountMinor * 10.036105);
  const fromMinor = body.side === 'receive' ? Math.ceil(body.amountMinor / 10.036105) : body.amountMinor;
  return {
    id: '33333333-3333-4333-8333-333333333333',
    recipientId: RECIPIENT.id,
    fromCurrency: body.fromCurrency,
    toCurrency: 'GHS',
    fromDecimals: 2,
    toDecimals: 2,
    amountFromMinor: fromMinor,
    amountToMinor: toMinor,
    converted: true,
    rate: '10.036105',
    providerFeeMinor: hub.partnerFee,
    wawuFeeKobo: 0,
    wawuFeeMinor: hub.feeMinor,
    speed: 'Instant',
    expiresAt: new Date(Date.now() + 179_000).toISOString(),
    validForSeconds: 179,
  };
}
const sendView = (status: string) => ({
  id: SEND_ID,
  status,
  recipient: RECIPIENT,
  fromCurrency: (hub.quotes.at(-1) as { fromCurrency?: string } | undefined)?.fromCurrency ?? 'USD',
  toCurrency: 'GHS',
  fromDecimals: 2,
  toDecimals: 2,
  amountFromMinor: 10_000,
  amountToMinor: 100_361,
  rate: '10.036105',
  providerFeeMinor: null,
  wawuFeeKobo: 0,
  wawuFeeMinor: hub.feeMinor,
  narration: null,
  failureReason: null,
  speed: 'Instant',
  createdAt: '2026-10-24T10:00:00.000Z',
  completedAt: null,
});

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/hub/, '');
  const method = request.method;
  if (path === '/money/recipients/recent') return ok([]);
  if (path === '/money/wallet/balance')
    return ok({
      availableKobo: 48_525_075,
      asOf: '2026-10-24T09:00:00.000Z',
    });
  if (path === '/money/abroad/corridors')
    return ok({
      enabled: hub.enabled,
      minReceiveMinor: 100,
      wawuFeeKobo: 0,
      countries: [GHANA, UGANDA],
    });
  if (path === '/money/abroad/banks/GH')
    return ok({
      country: 'GH',
      banks: [
        {
          code: '030100',
          name: 'ABSA BANK OF GHANA LIMITED',
          swiftBic: null,
        },
      ],
    });
  if (path === '/money/abroad/sources' && hub.sourcesMode === 'hang') return new Promise<Response>(() => {});
  if (path === '/money/abroad/sources' && hub.sourcesMode === 'fail') return json(500, { statusCode: 500, message: 'down' });
  if (path === '/money/abroad/sources')
    return ok({
      sources: hub.sources ?? [
        {
          currency: 'NGN',
          name: 'Naira account',
          decimals: 2,
          availableMinor: 5_000_000,
        },
        {
          currency: 'USD',
          name: 'US dollar account',
          decimals: 2,
          availableMinor: 100_000,
        },
      ],
    });
  if (path === '/money/abroad/recipients' && method === 'GET') return ok({ items: hub.recipients });
  if (path === '/money/abroad/recipients' && method === 'POST') {
    hub.saves.push((await request.json()) as Record<string, unknown>);
    hub.recipients = [RECIPIENT];
    return ok(RECIPIENT, 201);
  }
  if (path === '/money/abroad/quotes' && method === 'POST') {
    const body = (await request.json()) as {
      fromCurrency: string;
      amountMinor: number;
      side?: string;
    };
    hub.quotes.push(body);
    if (hub.outOfRange && body.side !== 'receive')
      return refuse(409, { code: 'amount_out_of_range', message: hub.outOfRange.message, minimumMinor: hub.outOfRange.minimumMinor, ...(hub.outOfRange.maximumMinor === null ? {} : { maximumMinor: hub.outOfRange.maximumMinor }), currency: 'GHS' });
    if (hub.rate === 'unavailable' || hub.noRateFrom.includes(body.fromCurrency))
      return refuse(409, {
        code: 'rate_unavailable',
        message: 'We cannot get a rate for this pair of currencies right now. Try again later or send from another account.',
      });
    return ok(quoteFor(body), 201);
  }
  if (path === '/money/abroad/sends' && method === 'POST') {
    const body = (await request.json()) as Record<string, unknown>;
    hub.sends.push({
      pin: request.headers.get('x-transaction-pin'),
      key: request.headers.get('idempotency-key'),
      body,
    });
    if (hub.wrongFirst && hub.sends.length === 1)
      return refuse(403, {
        code: 'pin_incorrect',
        message: 'Wrong PIN. 4 tries left.',
        triesLeft: 4,
      });
    if (hub.mode === 'expired')
      return refuse(409, {
        code: 'quote_expired',
        message: 'This quote has run out. Get a new one and try again.',
      });
    if (hub.mode === 'short')
      return refuse(409, {
        code: 'insufficient_funds',
        message: 'There is not enough money in that account for this send.',
      });
    if (hub.mode === 'no_answer') return json(503, { statusCode: 503, message: 'down' });
    return ok(sendView('pending'), 201);
  }
  if (path === `/money/abroad/sends/${SEND_ID}`) return ok(sendView(hub.status));
  return json(404, {
    statusCode: 404,
    message: `Not here: ${method} ${path}`,
  });
}) as typeof fetch;

const page = (path: string) => (require(path) as { default: ComponentType }).default;
let routes: Record<string, ComponentType>;
let session: typeof import('@/api/session');
let queryClient: typeof import('@/api/query').queryClient;

function pathname(): string {
  const { store } = jest.requireActual('expo-router/build/global-state/router-store') as { store: { getRouteInfo: () => { pathname: string } } };
  return store.getRouteInfo().pathname;
}
const tokenFor = (sub: string) => {
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${part({ alg: 'RS256' })}.${part({ sub })}.signature`;
};
const stub = (name: string) => {
  function Stub() {
    return (
      <View>
        <Text accessibilityRole="header">{name}</Text>
      </View>
    );
  }
  return Stub;
};
function WalletStandIn() {
  const router = useRouter();
  const { WalletActions } = require('@/features/wallet/home/WalletActions') as typeof import('@/features/wallet/home/WalletActions');
  return (
    <View>
      <Text accessibilityRole="header">Wallet tab</Text>
      <WalletActions
        actions={[
          {
            key: 'send',
            icon: 'ArrowUpRight',
            label: 'Send',
            onPress: () => router.push('/send'),
          },
        ]}
      />
    </View>
  );
}

beforeAll(async () => {
  session = require('@/api/session') as typeof import('@/api/session');
  queryClient = (require('@/api/query') as typeof import('@/api/query')).queryClient;
  routes = {
    _layout: () => (
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }} />
      </QueryClientProvider>
    ),
    wallet: WalletStandIn,
    welcome: stub('Welcome'),
    'reset-pin': stub('Reset PIN'),
    'open-wallet': stub('Open your wallet'),
    'open-wallet-pin': stub('Create your PIN'),
    'send/index': page('@/app/send/index'),
    'send/bank': page('@/app/send/bank'),
    'send/abroad/index': page('@/app/send/abroad/index'),
    'send/abroad/new': page('@/app/send/abroad/new'),
    'send/abroad/amount': page('@/app/send/abroad/amount'),
    'send/abroad/review': page('@/app/send/abroad/review'),
    'send/abroad/receipt': page('@/app/send/abroad/receipt'),
  };
  const { unmount } = await renderRouter(routes, { initialUrl: '/wallet' });
  await unmount();
}, 60_000);

beforeEach(() => {
  Object.assign(hub, {
    enabled: true,
    mode: 'ok',
    rate: 'ready',
    noRateFrom: [],
    outOfRange: null,
    partnerFee: 150,
    feeMinor: 0,
    sources: null,
    sourcesMode: 'ok',
    wrongFirst: false,
    recipients: [],
    saves: [],
    quotes: [],
    sends: [],
    status: 'pending',
  });
  queryClient.clear();
  queryClient.setDefaultOptions({
    queries: { ...queryClient.getDefaultOptions().queries, gcTime: 0 },
  });
  mockVault.clear();
  mockVault.set('wawu.session.access', tokenFor('00000000-0000-4000-8000-0000000000f3'));
  mockVault.set('wawu.session.refresh', 'refresh-1');
  session.resetSessionForTests();
});

afterAll(async () => {
  await queryClient.cancelQueries();
  queryClient.clear();
});

const tap = async (digits: string) => {
  for (const d of digits) await fireEvent.press(screen.getByRole('button', { name: d }));
};
const typeIn = (testID: string, text: string) => fireEvent.changeText(screen.getByTestId(testID), text);

async function toAbroad() {
  await renderRouter(routes, { initialUrl: '/wallet' });
  await fireEvent.press(await screen.findByRole('button', { name: 'Send' }));
  await fireEvent.press(await screen.findByRole('tab', { name: 'Abroad' }));
  await screen.findByTestId('abroad-home-screen');
}
async function toAmount() {
  hub.recipients = [RECIPIENT];
  await toAbroad();
  await fireEvent.press(await screen.findByTestId(`abroad-recipient-${RECIPIENT.id}`));
  await screen.findByTestId('abroad-amount-screen');
  await screen.findByTestId('abroad-sources');
}
async function toReview() {
  await toAmount();
  await fireEvent.press(screen.getByTestId('abroad-sources-USD'));
  for (const k of '100') await fireEvent.press(screen.getByTestId(`amount-key-${k}`));
  await screen.findByTestId('abroad-quote');
  await fireEvent.press(screen.getByTestId('abroad-continue'));
  await screen.findByTestId('abroad-review-screen');
}
async function pay(pin = '1234') {
  await fireEvent.press(await screen.findByRole('button', { name: /^Send \$/ }));
  await screen.findByText(/to Ama Mensah in Ghana/);
  await tap(pin);
}

describe('send abroad', () => {
  it('the Abroad tab is drawn only while the Hub says sending abroad is on', async () => {
    hub.enabled = false;
    await renderRouter(routes, { initialUrl: '/wallet' });
    await fireEvent.press(await screen.findByRole('button', { name: 'Send' }));
    await screen.findByTestId('send-recipient-screen');
    await waitFor(() => expect(queryClient.getQueryData(['money', 'abroad', 'corridors', '00000000-0000-4000-8000-0000000000f3'])).toBeDefined());
    expect(screen.queryByRole('tab', { name: 'Abroad' })).toBeNull();
  });

  it('a user opens Abroad from Send, adds a recipient with the fields the Hub draws for the country and way, and lands on the amount', async () => {
    await toAbroad();
    expect(pathname()).toBe('/send/abroad');
    expect(await screen.findByTestId('abroad-recipients-empty')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('abroad-new'));
    await screen.findByTestId('abroad-country-screen');
    // A country the Hub says is not available is shown with its words and cannot be picked.
    expect(screen.getByText('We cannot send here yet.')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('abroad-country-UG'));
    expect(screen.queryByTestId('abroad-recipient-screen')).toBeNull();
    await fireEvent.press(screen.getByTestId('abroad-country-GH'));
    await screen.findByTestId('abroad-recipient-screen');
    // Bank: the bank picker and the account number; Mobile money: only the number (and MTN or Vodafone).
    expect(screen.getByTestId('abroad-field-account_number')).toBeTruthy();
    expect(screen.queryByTestId('abroad-field-phone_number')).toBeNull();
    await fireEvent.press(screen.getByRole('tab', { name: 'Mobile money' }));
    expect(screen.queryByTestId('abroad-field-account_number')).toBeNull();
    await fireEvent.press(screen.getByTestId('abroad-save'));
    expect(hub.saves).toHaveLength(0);
    expect(await screen.findByText('Enter the name on the account.')).toBeTruthy();
    await typeIn('abroad-holder', 'Ama Mensah');
    await typeIn('abroad-field-phone_number', '+233 24 123 4567');
    await fireEvent.press(screen.getByTestId('abroad-save'));
    await screen.findByTestId('abroad-amount-screen');
    expect(hub.saves).toEqual([
      {
        country: 'GH',
        method: 'mobile_money',
        holderName: 'Ama Mensah',
        scheme: 'mtn',
        fields: { phone_number: '+233 24 123 4567' },
      },
    ]);
    expect(pathname()).toBe('/send/abroad/amount');
  });

  it("a user types an amount and sees what the recipient gets from the Hub's quote, then reviews, pays with the PIN and reads the receipt", async () => {
    await toReview();
    // The rate checks for each account (side "receive", the corridor's least) come first; what was typed is the one quote with side "send".
    expect(hub.quotes.filter((q) => q.side === 'send')).toEqual([
      {
        recipientId: RECIPIENT.id,
        fromCurrency: 'USD',
        amountMinor: 10_000,
        side: 'send',
      },
    ]);
    expect(screen.getByTestId('abroad-review-get').props.children).toBe('GH₵1,003.61');
    expect(screen.getByTestId('abroad-review-partner-fee')).toBeTruthy();
    await pay();
    expect(await screen.findByTestId('abroad-receipt-screen')).toBeTruthy();
    expect(hub.sends).toHaveLength(1);
    expect(hub.sends[0].pin).toBe('1234');
    expect(hub.sends[0].key).toBeTruthy();
    expect(hub.sends[0].body).toEqual({
      quoteId: '33333333-3333-4333-8333-333333333333',
    });
    expect(Object.values(hub.sends[0].body)).not.toContain('1234');
    expect((await screen.findByTestId('abroad-status')).props.children ?? true).toBeTruthy();
    expect(await screen.findByText('On its way')).toBeTruthy();
    expect(screen.getByTestId('abroad-receipt-fee')).toHaveTextContent?.('Not named yet');
    await fireEvent.press(screen.getByTestId('abroad-done'));
    await waitFor(() => expect(pathname()).toBe('/wallet'));
  });

  it("the partner's fee is its own row on the amount screen and on the review, before the PIN, and the total is what leaves the account (R-10)", async () => {
    await toAmount();
    await fireEvent.press(screen.getByTestId('abroad-sources-USD'));
    for (const k of '100') await fireEvent.press(screen.getByTestId(`amount-key-${k}`));
    await screen.findByTestId('abroad-quote');
    expect(within(screen.getByTestId('abroad-quote-fee')).getByText('$1.50')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('abroad-continue'));
    await screen.findByTestId('abroad-review-screen');
    expect(within(screen.getByTestId('abroad-review-partner-fee')).getByText('$1.50')).toBeTruthy();
    expect(within(screen.getByTestId('abroad-review-total')).getByText('$101.50')).toBeTruthy();
    expect(screen.getByText('Total from your USD account')).toBeTruthy();
    // The fee is known, so the line that said it would come later is gone, and nothing was sent yet.
    expect(screen.queryByTestId('abroad-provider-fee')).toBeNull();
    expect(hub.sends).toHaveLength(0);
  });

  it('with no partner fee named for the route the review says the receipt will show it, draws no fee row and no total', async () => {
    hub.partnerFee = null;
    await toReview();
    expect(screen.getByTestId('abroad-provider-fee')).toBeTruthy();
    expect(screen.queryByTestId('abroad-review-partner-fee')).toBeNull();
    expect(screen.queryByTestId('abroad-review-total')).toBeNull();
  });

  it('a wrong PIN then the right one sends once, on one key', async () => {
    hub.wrongFirst = true;
    await toReview();
    await pay();
    expect(await screen.findByText('Wrong PIN. 4 tries left.')).toBeTruthy();
    await tap('1234');
    expect(await screen.findByTestId('abroad-receipt-screen')).toBeTruthy();
    expect(hub.sends).toHaveLength(2);
    expect(hub.sends[1].key).toBe(hub.sends[0].key);
  });

  it('a rate the Hub cannot give is said before any amount is typed, and nothing is offered to send from', async () => {
    hub.rate = 'unavailable';
    hub.recipients = [RECIPIENT];
    await toAbroad();
    await fireEvent.press(await screen.findByTestId(`abroad-recipient-${RECIPIENT.id}`));
    expect(await screen.findByTestId('abroad-no-rate')).toBeTruthy();
    expect(screen.getByText(/We cannot get a rate for this pair of currencies right now/)).toBeTruthy();
    expect(screen.queryByTestId('abroad-sources-USD')).toBeNull();
    expect(screen.queryByTestId('amount-key-1')).toBeNull();
    expect(screen.getByTestId('abroad-continue').props.accessibilityState?.disabled).toBe(true);
  });

  it('an account the Hub has no rate from is left out of Send from, with the reason, before an amount is typed', async () => {
    hub.noRateFrom = ['NGN'];
    await toAmount();
    expect(screen.getByTestId('abroad-sources-USD')).toBeTruthy();
    expect(screen.queryByTestId('abroad-sources-NGN')).toBeNull();
    expect(screen.getByTestId('abroad-unrated-NGN').props.children).toBe('No rate from your Naira account to GHS right now, so it is not offered.');
    // The one that can be quoted is the one in front, and what is typed is quoted from it.
    for (const k of '5') await fireEvent.press(screen.getByTestId(`amount-key-${k}`));
    await screen.findByTestId('abroad-quote');
    expect(hub.quotes.at(-1)).toMatchObject({ fromCurrency: 'USD', amountMinor: 500, side: 'send' });
  });

  it('shows the amount as it is typed: thousands grouped, the places of the currency', async () => {
    await toAmount();
    await fireEvent.press(screen.getByTestId('abroad-sources-USD'));
    for (const k of '1000') await fireEvent.press(screen.getByTestId(`amount-key-${k}`));
    expect(screen.getByTestId('abroad-amount').props.children).toBe('$1,000');
    await fireEvent.press(screen.getByTestId('amount-key-point'));
    await fireEvent.press(screen.getByTestId('amount-key-5'));
    expect(screen.getByTestId('abroad-amount').props.children).toBe('$1,000.50');
  });

  it('holding Delete clears everything typed', async () => {
    await toAmount();
    await fireEvent.press(screen.getByTestId('abroad-sources-USD'));
    for (const k of '123') await fireEvent.press(screen.getByTestId(`amount-key-${k}`));
    expect(screen.getByTestId('abroad-amount').props.children).toBe('$123');
    await fireEvent(screen.getByTestId('amount-key-delete'), 'longPress');
    expect(screen.getByTestId('abroad-amount').props.children).toBe('$0');
  });

  it('switching the account to another currency clears an amount typed in the first', async () => {
    await toAmount();
    await fireEvent.press(screen.getByTestId('abroad-sources-NGN'));
    for (const k of '5000') await fireEvent.press(screen.getByTestId(`amount-key-${k}`));
    expect(screen.getByTestId('abroad-amount').props.children).toBe('₦5,000');
    await fireEvent.press(screen.getByTestId('abroad-sources-USD'));
    expect(screen.getByTestId('abroad-amount').props.children).toBe('$0');
    // They receive: the amount is in cedis whichever account it is sent from, so changing the account keeps it.
    await fireEvent.press(screen.getByRole('tab', { name: 'They receive' }));
    for (const k of '40') await fireEvent.press(screen.getByTestId(`amount-key-${k}`));
    expect(screen.getByTestId('abroad-amount').props.children).toBe('GH₵40');
    await fireEvent.press(screen.getByTestId('abroad-sources-NGN'));
    expect(screen.getByTestId('abroad-amount').props.children).toBe('GH₵40');
  });

  it('says an amount over the balance is over the balance, before the Hub is asked', async () => {
    await toAmount();
    await fireEvent.press(screen.getByTestId('abroad-sources-USD'));
    const asked = hub.quotes.length;
    for (const k of '5000') await fireEvent.press(screen.getByTestId(`amount-key-${k}`));
    expect(await screen.findByTestId('abroad-over-balance')).toBeTruthy();
    expect(screen.getByText('That is more than the $1,000.00 in your US dollar account.')).toBeTruthy();
    expect(screen.queryByText(/this corridor can deliver/)).toBeNull();
    expect(hub.quotes).toHaveLength(asked);
    expect(screen.getByTestId('abroad-continue').props.accessibilityState?.disabled).toBe(true);
  });

  it('says the most when an amount is over what the corridor delivers, and the least when it is under', async () => {
    hub.outOfRange = { message: 'That is more than this corridor can deliver.', minimumMinor: 500, maximumMinor: 2_500_000 };
    await toAmount();
    await fireEvent.press(screen.getByTestId('abroad-sources-USD'));
    for (const k of '900') await fireEvent.press(screen.getByTestId(`amount-key-${k}`));
    expect(await screen.findByText('That is more than this corridor can deliver. The most they can get is GH₵25,000.00.')).toBeTruthy();
    expect(screen.queryByText(/The least/)).toBeNull();
    hub.outOfRange = { message: 'That is less than this corridor can deliver.', minimumMinor: 500, maximumMinor: 2_500_000 };
    await fireEvent.press(screen.getByTestId('amount-key-delete'));
    expect(await screen.findByText('That is less than this corridor can deliver. The least they can get is GH₵5.00.')).toBeTruthy();
  });

  it('a quote that has run out, or an account with too little, is said on the review with nothing sent', async () => {
    hub.mode = 'expired';
    await toReview();
    await pay();
    expect(await screen.findByTestId('abroad-failure')).toBeTruthy();
    expect(screen.getByText('This quote has run out. Get a new one and try again.')).toBeTruthy();
    expect(pathname()).toBe('/send/abroad/review');
    hub.mode = 'short';
    await pay();
    expect(await screen.findByText('There is not enough money in that account for this send.')).toBeTruthy();
    expect(hub.sends.length).toBe(2);
    expect(hub.sends[1].key).not.toBe(hub.sends[0].key);
  });
});

/*
 * Send abroad from a foreign account (WALLET-42, R-87): a person with a world wallet has no naira account. The Hub lists only the
 * accounts they hold, with its own balance; the quote is asked in the account's currency; WAWU's fee is the foreign account's, shown
 * in that currency and counted in the total; and no naira figure is drawn for them.
 */
describe('send abroad from a foreign account', () => {
  const GBP_ONLY = [
    {
      currency: 'GBP',
      name: 'British pound account',
      decimals: 2,
      availableMinor: 729,
    },
  ];

  async function toWorldAmount() {
    hub.recipients = [RECIPIENT];
    hub.sources = GBP_ONLY;
    await renderRouter(routes, { initialUrl: '/send/abroad' });
    await fireEvent.press(await screen.findByTestId(`abroad-recipient-${RECIPIENT.id}`));
    await screen.findByTestId('abroad-amount-screen');
    await screen.findByTestId('abroad-sources');
  }

  it('offers only the accounts the person holds, with the Hub balance, and quotes in the account currency', async () => {
    await toWorldAmount();
    expect(screen.getByTestId('abroad-sources-GBP')).toBeTruthy();
    expect(screen.queryByTestId('abroad-sources-NGN')).toBeNull();
    expect(screen.queryByTestId('abroad-sources-USD')).toBeNull();
    expect(screen.getByTestId('abroad-source-balance').props.children).toBe('British pound account: £7.29 available');
    for (const k of '3') await fireEvent.press(screen.getByTestId(`amount-key-${k}`));
    await screen.findByTestId('abroad-quote');
    expect(hub.quotes.at(-1)).toMatchObject({
      fromCurrency: 'GBP',
      amountMinor: 300,
    });
  });

  it("shows WAWU's fee in pounds and counts it in the total from the pound account, then sends once on one key", async () => {
    hub.feeMinor = 175;
    await toWorldAmount();
    for (const k of '3') await fireEvent.press(screen.getByTestId(`amount-key-${k}`));
    await screen.findByTestId('abroad-quote');
    await fireEvent.press(screen.getByTestId('abroad-continue'));
    await screen.findByTestId('abroad-review-screen');
    const rows = within(screen.getByTestId('abroad-review-rows'));
    expect(rows.getByText('£1.75')).toBeTruthy();
    expect(rows.queryByText(/₦/)).toBeNull();
    // £3.00 + the partner's £1.50 + WAWU's £1.50.
    expect(within(screen.getByTestId('abroad-review-total')).getByText('£6.25')).toBeTruthy();
    expect(screen.getByText('Total from your GBP account')).toBeTruthy();
    await fireEvent.press(await screen.findByRole('button', { name: /^Send £/ }));
    await screen.findByText(/to Ama Mensah in Ghana/);
    await tap('1234');
    expect(await screen.findByTestId('abroad-receipt-screen')).toBeTruthy();
    expect(hub.sends).toHaveLength(1);
    expect(hub.sends[0].body).toMatchObject({
      quoteId: '33333333-3333-4333-8333-333333333333',
    });
    expect(within(await screen.findByTestId('abroad-receipt-rows')).getByText('£1.75')).toBeTruthy();
  });

  it('draws no naira figure for a person with no naira wallet when WAWU takes no fee', async () => {
    await toWorldAmount();
    for (const k of '3') await fireEvent.press(screen.getByTestId(`amount-key-${k}`));
    await screen.findByTestId('abroad-quote');
    await fireEvent.press(screen.getByTestId('abroad-continue'));
    await screen.findByTestId('abroad-review-screen');
    const rows = within(screen.getByTestId('abroad-review-rows'));
    expect(rows.queryByText(/₦/)).toBeNull();
    expect(rows.getByText('£0.00')).toBeTruthy();
  });

  async function toAmountScreenWith(mode: 'ok' | 'hang' | 'fail', sources: unknown[] | null) {
    hub.recipients = [RECIPIENT];
    hub.sourcesMode = mode;
    hub.sources = sources;
    await renderRouter(routes, { initialUrl: '/send/abroad' });
    await fireEvent.press(await screen.findByTestId(`abroad-recipient-${RECIPIENT.id}`));
    await screen.findByTestId('abroad-amount-screen');
  }
  function expectNoAmountAndNoNaira() {
    expect(screen.queryByTestId('abroad-amount')).toBeNull();
    expect(screen.queryByTestId('amount-key-1')).toBeNull();
    expect(screen.queryByText(/₦/)).toBeNull();
    expect(hub.quotes).toEqual([]);
  }

  it('draws no amount and no naira figure while the accounts load', async () => {
    await toAmountScreenWith('hang', null);
    expect(await screen.findByTestId('abroad-sources-loading')).toBeTruthy();
    expectNoAmountAndNoNaira();
  });

  it('draws no amount and no naira figure when the accounts cannot be read', async () => {
    await toAmountScreenWith('fail', null);
    expect(await screen.findByTestId('abroad-sources-error', {}, { timeout: 8000 })).toBeTruthy();
    expectNoAmountAndNoNaira();
  });

  it('says so when the person holds no account to send from, and draws no amount', async () => {
    await toAmountScreenWith('ok', []);
    expect(await screen.findByTestId('abroad-no-source')).toBeTruthy();
    expectNoAmountAndNoNaira();
  });
});
