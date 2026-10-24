/* eslint-disable @typescript-eslint/no-require-imports */
import * as rtl from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/*
 * The Money chip's sends (I20, FIX-114, G-INBOX-15-1) on the real Inbox screen with the Hub as a stand-in `fetch`: the chip asks for
 * `kind=money`, the Hub answers with requests and sends between two people, and each row opens the chat of the two.
 */
const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useIsFocused: () => true, useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn(), canGoBack: () => true }) }));
jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn(async () => null), setItemAsync: jest.fn(async () => undefined), deleteItemAsync: jest.fn(async () => undefined) }));

type Answer = { status: number; body: unknown };
let answers: Record<string, Answer[]> = {};
let sent: string[] = [];
const ok = (data: unknown): Answer => ({ status: 200, body: { statusCode: 200, message: 'OK', data } });

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/hub/, '');
  const key = `${request.method} ${path}`;
  sent.push(`${key}${url.search}`);
  const queue = answers[`${key}${url.search}`] ?? answers[key];
  const answer = queue?.[0];
  if (!answer) throw new Error(`no answer for ${key}${url.search}`);
  return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

const { queryClient } = require('@/api/query') as typeof import('@/api/query');
const { InboxScreen } = require('@/features/inbox/InboxScreen') as typeof import('@/features/inbox/InboxScreen');
const { moveLine } = require('../ChatInboxRow') as typeof import('../ChatInboxRow');

const verification = { creator: { verified: false, expiresAt: null }, professional: { verified: false, expiresAt: null } };
const amaka = { wawuId: 'u-amaka', name: 'Amaka Nwosu', handle: 'amaka', avatarUrl: null, verification };
const femi = { wawuId: 'u-femi', name: 'Femi Bankole', handle: 'femib', avatarUrl: null, verification };
const kemi = { wawuId: 'u-kemi', name: 'Kemi Okafor', handle: 'kemi.designs', avatarUrl: null, verification };

const moveRow = (id: string, over: Record<string, unknown> = {}, at = new Date().toISOString()) => ({
  id: `money_move:${id}`,
  kind: 'money_move',
  lastActivityAt: at,
  unreadCount: 0,
  preview: null,
  chat: null,
  paidDm: null,
  community: null,
  moneyRequest: null,
  moneyMove: { transferId: id, chatId: 'c-amaka', direction: 'incoming', other: amaka, amountKobo: 500_000, note: null, status: 'completed', canMessage: true, ...over },
});
const requestRow = {
  id: 'money_request:r-1',
  kind: 'money_request',
  lastActivityAt: new Date().toISOString(),
  unreadCount: 0,
  preview: null,
  chat: null,
  paidDm: null,
  community: null,
  moneyRequest: { requestId: 'r-1', chatId: 'c-kemi', direction: 'incoming', other: kemi, amountKobo: 1_200_000, memo: 'Logo edits', status: 'pending', paying: false, canMessage: true },
};
const chatRow = {
  id: 'chat:c-amaka',
  kind: 'chat',
  lastActivityAt: new Date().toISOString(),
  unreadCount: 0,
  preview: { text: 'Thanks', attachment: null, mine: false, senderName: null, sentAt: new Date().toISOString(), moneyRequest: null },
  chat: { chatId: 'c-amaka', other: amaka, canMessage: true },
  paidDm: null,
  community: null,
  moneyRequest: null,
};
const page = (items: unknown[], nextCursor: string | null = null) => ok({ items, nextCursor });

async function renderInbox() {
  return rtl.render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, left: 0, right: 0, bottom: 34 } }}>
      <InboxScreen />
    </SafeAreaProvider>,
  );
}

beforeEach(() => {
  sent = [];
  mockPush.mockClear();
  queryClient.clear();
  answers = {
    'GET /inbox/unread': [ok({ total: 0, chats: 0, paidDms: 0, communities: 0 })],
    'GET /inbox?limit=20': [page([chatRow])],
    'GET /inbox?limit=20&kind=money': [
      page([
        moveRow('t-in'),
        requestRow,
        moveRow('t-out', { direction: 'outgoing', other: femi, amountKobo: 2_500_000, chatId: 'c-femi' }),
        moveRow('t-note', { direction: 'outgoing', other: femi, amountKobo: 1_000_000, note: 'Rent share', chatId: 'c-femi' }),
        moveRow('t-back', { direction: 'outgoing', other: femi, amountKobo: 20_000, status: 'reversed', chatId: 'c-femi' }),
        moveRow('t-wait', { direction: 'outgoing', other: femi, amountKobo: 30_000, status: 'pending', chatId: 'c-femi' }),
      ]),
    ],
  };
});
afterEach(async () => {
  await queryClient.cancelQueries();
  rtl.cleanup();
  queryClient.clear();
});

describe('I20: the sends under the Money chip', () => {
  it('a user taps Money and sees the sends they made and received next to the requests, each as the Hub says', async () => {
    await renderInbox();
    await rtl.screen.findByTestId('row-chat:c-amaka');
    await rtl.fireEvent.press(rtl.screen.getByRole('radio', { name: 'Money' }));
    await rtl.screen.findByTestId('row-money_move:t-in');
    expect(sent).toContain('GET /inbox?limit=20&kind=money');
    expect(rtl.screen.getByText('Sent you ₦5,000')).toBeTruthy();
    expect(rtl.screen.getByText('You sent ₦25,000')).toBeTruthy();
    expect(rtl.screen.getByText('You sent ₦10,000 · Rent share')).toBeTruthy();
    expect(rtl.screen.getByText('Reversed ₦200')).toBeTruthy();
    expect(rtl.screen.getByText('Payment on its way · ₦300')).toBeTruthy();
    // The request is still there, and the chat is not a second row of the same person.
    expect(rtl.screen.getByText('Requested ₦12,000 · Logo edits')).toBeTruthy();
    expect(rtl.screen.queryByTestId('row-chat:c-amaka')).toBeNull();
    // Each send names the other person; no total of the sends is drawn anywhere.
    expect(rtl.screen.getAllByText('Femi Bankole')).toHaveLength(4);
    expect(rtl.screen.getAllByText('Amaka Nwosu')).toHaveLength(1);
    expect(rtl.screen.queryByText(/total|balance/i)).toBeNull();
  });

  it('tapping a send opens the chat of the two people', async () => {
    await renderInbox();
    await rtl.fireEvent.press(await rtl.screen.findByRole('radio', { name: 'Money' }));
    await rtl.fireEvent.press(await rtl.screen.findByTestId('row-money_move:t-in'));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/chat/[id]', params: { id: 'c-amaka' } });
    await rtl.fireEvent.press(rtl.screen.getByTestId('row-money_move:t-out'));
    expect(mockPush).toHaveBeenLastCalledWith({ pathname: '/chat/[id]', params: { id: 'c-femi' } });
  });

  it('a send is never a row in All, even if the Hub served one there', async () => {
    answers['GET /inbox?limit=20'] = [page([chatRow, moveRow('t-in')])];
    await renderInbox();
    await rtl.screen.findByTestId('row-chat:c-amaka');
    expect(rtl.screen.queryByTestId('row-money_move:t-in')).toBeNull();
    expect(sent).not.toContain('GET /inbox?limit=20&kind=money');
  });
});

describe('the words under a name for a send', () => {
  const base = { amountKobo: 2_500_000, note: null };
  it.each([
    [{ outgoing: true, status: 'completed' as const }, 'You sent ₦25,000', undefined],
    [{ outgoing: false, status: 'completed' as const }, 'Sent you ₦25,000', 'money'],
    [{ outgoing: true, status: 'completed' as const, note: ' Rent ' }, 'You sent ₦25,000 · Rent', undefined],
    [{ outgoing: false, status: 'completed' as const, note: 'Rent' }, 'Sent you ₦25,000 · Rent', 'money'],
    [{ outgoing: true, status: 'pending' as const }, 'Payment on its way · ₦25,000', undefined],
    [{ outgoing: true, status: 'reversed' as const }, 'Reversed ₦25,000', 'refund'],
    [{ outgoing: false, status: 'reversed' as const }, 'Reversed ₦25,000', 'refund'],
  ])('%j reads %s', (look, text, kind) => {
    expect(moveLine({ ...base, ...look })).toEqual(kind ? { text, kind } : { text });
  });

  it('keeps the kobo of an amount that is not whole naira', () => {
    expect(moveLine({ outgoing: true, amountKobo: 1_234_550, status: 'completed', note: null }).text).toBe('You sent ₦12,345.50');
  });
});
