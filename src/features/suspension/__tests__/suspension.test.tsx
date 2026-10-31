/* eslint-disable @typescript-eslint/no-require-imports */
// USER-SUSPEND (R-121), on the native platform (Android): the client reports the Hub's `account_suspended` refusal whichever call
// sent it, the calm screen shows the Hub's words with the support address as selectable text and a way back, and the banner on Me
// shows only while the Hub says the person is suspended.
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const WORDS = 'Your account is suspended. Contact support@wawuafrica.com.';
type Answer = { status: number; body: unknown };
let answers: Record<string, Answer> = {};

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const path = `${request.method} ${new URL(request.url).pathname.replace(/^\/api\/hub/, '')}`;
  const answer = answers[path];
  if (!answer) throw new Error(`no answer for ${path}`);
  return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

const refused: Answer = {
  status: 403,
  body: { statusCode: 403, message: WORDS, data: null, reason: { code: 'account_suspended', message: WORDS, supportEmail: 'support@wawuafrica.com' } },
};
const mine = (suspended: boolean): Answer => ({
  status: 200,
  body: { statusCode: 200, message: 'OK', data: { suspended, since: suspended ? '2026-10-31T09:00:00.000Z' : null, message: suspended ? WORDS : '', supportEmail: 'support@wawuafrica.com' } },
});

const clients: QueryClient[] = [];
async function render(child: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } } });
  clients.push(client);
  await rtl.render(
    <QueryClientProvider client={client}>
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>{child}</SafeAreaProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  jest.replaceProperty(Platform, 'OS', 'android');
  answers = {};
});
afterEach(async () => {
  await rtl.act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
  clients.splice(0).forEach((c) => c.clear());
  jest.restoreAllMocks();
});

describe('the client reports the Hub refusal', () => {
  it('reports a suspended person\'s refused write once, with the Hub\'s words and address, and still fails the call with them', async () => {
    const { api, unwrap, isApiError } = require('@/api/client') as typeof import('@/api/client');
    const { onSuspendedRefusal } = require('@/api/suspension') as typeof import('@/api/suspension');
    const heard: unknown[] = [];
    const stop = onSuspendedRefusal((r) => heard.push(r));
    answers['POST /content/abc/comments'] = refused;
    let failure: unknown;
    await unwrap(api.POST('/api/hub/content/{id}/comments', { params: { path: { id: 'abc' } }, body: { text: 'hi' } } as never)).catch((e: unknown) => {
      failure = e;
    });
    stop();
    expect(heard).toEqual([{ message: WORDS, supportEmail: 'support@wawuafrica.com' }]);
    expect(isApiError(failure) && failure.message).toBe(WORDS);
    expect(isApiError(failure) && failure.code).toBe('account_suspended');
  });

  it('ignores another 403 and a 403 that is not JSON', () => {
    const { refusalOf } = require('@/api/suspension') as typeof import('@/api/suspension');
    expect(refusalOf({ statusCode: 403, message: 'No.', reason: { code: 'chat_blocked' } })).toBeNull();
    expect(refusalOf({ statusCode: 403, message: 'No.' })).toBeNull();
    expect(refusalOf('<html>')).toBeNull();
    expect(refusalOf(null)).toBeNull();
  });
});

describe('the calm screen', () => {
  async function boot() {
    const { SuspendedScreen } = require('../SuspendedScreen') as typeof import('../SuspendedScreen');
    const { reportSuspendedRefusal } = require('@/api/suspension') as typeof import('@/api/suspension');
    reportSuspendedRefusal({ message: WORDS, supportEmail: 'support@wawuafrica.com' });
    answers['GET /me/suspension'] = mine(true);
    const onBack = jest.fn();
    await render(<SuspendedScreen onBack={onBack} />);
    return onBack;
  }

  it('shows the Hub\'s words, the support address as selectable text, and a way back', async () => {
    const onBack = await boot();
    expect(rtl.screen.getByText('Your account is suspended')).toBeTruthy();
    expect(rtl.screen.getByTestId('suspended-message').props.children).toBe(WORDS);
    const email = rtl.screen.getByTestId('suspended-email');
    expect(email.props.selectable).toBe(true);
    expect(email.props.children).toBe('support@wawuafrica.com');
    await rtl.userEvent.press(rtl.screen.getByTestId('suspended-go-back'));
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(rtl.screen.toJSON())).not.toMatch(/—/);
  });

  it('offers nothing to get round it: no retry, no other action', async () => {
    await boot();
    expect(rtl.screen.queryByText(/try again|retry|appeal/i)).toBeNull();
    expect(rtl.screen.getAllByRole('button').length).toBeLessThanOrEqual(2); // the bar\'s back and "Go back"
  });

  it('the bar\'s back arrow leaves it the same way (on Android the system Back button is the stack\'s own)', async () => {
    const onBack = await boot();
    await rtl.userEvent.press(rtl.screen.getByTestId('suspended-back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

describe('the banner on Me', () => {
  async function banner(suspended: boolean | 'failed') {
    const { SuspendedBanner } = require('../SuspendedBanner') as typeof import('../SuspendedBanner');
    if (suspended === 'failed') answers['GET /me/suspension'] = { status: 500, body: { statusCode: 500, message: 'x', data: null } };
    else answers['GET /me/suspension'] = mine(suspended);
    const onOpen = jest.fn();
    await render(<SuspendedBanner onOpen={onOpen} />);
    return onOpen;
  }

  it('shows the Hub\'s sentence while suspended, and opens the screen when pressed', async () => {
    const onOpen = await banner(true);
    const el = await rtl.screen.findByTestId('me-suspended-banner');
    expect(rtl.screen.getByText(WORDS)).toBeTruthy();
    await rtl.userEvent.press(el);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('draws nothing when the person is not suspended, or the read failed', async () => {
    await banner(false);
    await rtl.act(async () => { await new Promise((r) => setTimeout(r, 20)); });
    expect(rtl.screen.queryByTestId('me-suspended-banner')).toBeNull();
    await rtl.screen.unmount();
    await banner('failed');
    await rtl.act(async () => { await new Promise((r) => setTimeout(r, 20)); });
    expect(rtl.screen.queryByTestId('me-suspended-banner')).toBeNull();
  });
});
