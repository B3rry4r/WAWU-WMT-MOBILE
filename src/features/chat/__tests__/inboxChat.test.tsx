/* eslint-disable @typescript-eslint/no-require-imports */
import * as rtl from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/*
 * The Inbox's chat rows (I1) and the Money chip (I20, INBOX-20) on the real screen with the Hub as a stand-in `fetch`.
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
const { requestLine } = require('../ChatInboxRow') as typeof import('../ChatInboxRow');

const verification = { creator: { verified: false, expiresAt: null }, professional: { verified: false, expiresAt: null } };
const kemi = { wawuId: 'u-kemi', name: 'Kemi Okafor', handle: 'kemi.designs', avatarUrl: null, verification };
const femi = { wawuId: 'u-femi', name: 'Femi Bankole', handle: 'femib', avatarUrl: null, verification };

const chatRow = (over: Record<string, unknown> = {}) => ({
  id: 'chat:c-kemi',
  kind: 'chat',
  lastActivityAt: new Date().toISOString(),
  unreadCount: 0,
  preview: { text: 'Logo edits', attachment: null, mine: false, senderName: 'Kemi Okafor', sentAt: new Date().toISOString(), moneyRequest: { amountKobo: 1_200_000, status: 'pending' } },
  chat: { chatId: 'c-kemi', other: kemi, canMessage: true },
  paidDm: null,
  community: null,
  moneyRequest: null,
  ...over,
});
const textRow = () =>
  chatRow({
    id: 'chat:c-femi',
    preview: { text: 'Thanks, got it', attachment: null, mine: true, senderName: null, sentAt: new Date().toISOString(), moneyRequest: null },
    chat: { chatId: 'c-femi', other: femi, canMessage: true },
  });
const requestRow = (over: Record<string, unknown> = {}, id = 'money_request:r-1') => ({
  id,
  kind: 'money_request',
  lastActivityAt: new Date().toISOString(),
  unreadCount: 0,
  preview: null,
  chat: null,
  paidDm: null,
  community: null,
  moneyRequest: { requestId: 'r-1', chatId: 'c-kemi', direction: 'incoming', other: kemi, amountKobo: 1_200_000, memo: 'Logo edits', status: 'pending', paying: false, canMessage: true, ...over },
});
const page = (items: unknown[]) => ok({ items, nextCursor: null });

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
    'GET /inbox?limit=20': [page([chatRow(), textRow(), requestRow()])],
    'GET /inbox?limit=20&kind=money': [page([requestRow(), requestRow({ requestId: 'r-2', direction: 'outgoing', other: femi, status: 'paid', memo: 'Shoot' }, 'money_request:r-2')])],
  };
});
afterEach(async () => {
  await queryClient.cancelQueries();
  rtl.cleanup();
  queryClient.clear();
});

describe('I1: the chats in the Inbox', () => {
  it('a user sees each chat with the last words, and a chat whose last message is a request says so; the request is not a second row', async () => {
    await renderInbox();
    await rtl.screen.findByTestId('row-chat:c-kemi');
    expect(rtl.screen.getByText('Requested ₦12,000 · Logo edits')).toBeTruthy();
    expect(rtl.screen.getByText('You: Thanks, got it')).toBeTruthy();
    expect(rtl.screen.queryByTestId('row-money_request:r-1')).toBeNull();
    expect(rtl.screen.getAllByText('Kemi Okafor')).toHaveLength(1);
  });

  it('the support thread (SUPPORT-01) is the app\'s own row: "Who Made This?" with its mark, the staff words as the preview, unread counted, and it opens like any chat', async () => {
    const support = { wawuId: 'support-account', name: 'Who Made This?', handle: null, avatarUrl: null, verification, support: true };
    const row = chatRow({
      id: 'chat:c-support',
      unreadCount: 1,
      preview: { text: 'We can see it. Looking now.', attachment: null, mine: false, senderName: null, sentAt: new Date().toISOString(), moneyRequest: null },
      chat: { chatId: 'c-support', other: support, canMessage: true },
    });
    answers['GET /inbox?limit=20'] = [page([row, textRow()])];
    await renderInbox();
    await rtl.screen.findByTestId('row-chat:c-support');
    expect(rtl.screen.getByText('Who Made This?')).toBeTruthy();
    expect(rtl.screen.getByText('We can see it. Looking now.')).toBeTruthy();
    // The avatar is decorative (the row says the name), so it is read with the hidden elements.
    expect(rtl.screen.getByTestId('row-chat:c-support-avatar-brand', { includeHiddenElements: true })).toBeTruthy();
    expect(rtl.screen.queryByTestId('row-chat:c-femi-avatar-brand', { includeHiddenElements: true })).toBeNull();
    await rtl.fireEvent.press(rtl.screen.getByTestId('row-chat:c-support'));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/chat/[id]', params: { id: 'c-support' } });
  });

  it('tapping a chat opens it', async () => {
    await renderInbox();
    await rtl.fireEvent.press(await rtl.screen.findByTestId('row-chat:c-femi'));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/chat/[id]', params: { id: 'c-femi' } });
  });
});

describe('I20: the Money chip', () => {
  it('a user taps Money and sees only requests, each opening its chat', async () => {
    await renderInbox();
    await rtl.screen.findByTestId('row-chat:c-kemi');
    await rtl.fireEvent.press(rtl.screen.getByRole('radio', { name: 'Money' }));
    await rtl.screen.findByTestId('row-money_request:r-1');
    expect(sent).toContain('GET /inbox?limit=20&kind=money');
    expect(rtl.screen.getByText('Requested ₦12,000 · Logo edits')).toBeTruthy();
    expect(rtl.screen.getByText('Femi paid ₦12,000 · Shoot')).toBeTruthy();
    expect(rtl.screen.queryByTestId('row-chat:c-femi')).toBeNull();
    await rtl.fireEvent.press(rtl.screen.getByTestId('row-money_request:r-1'));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/chat/[id]', params: { id: 'c-kemi' } });
  });
});

describe('the words under a name for a request', () => {
  const base = { amountKobo: 1_200_000, memo: 'Logo edits', other: 'Kemi Okafor' };
  it.each([
    [{ asker: false, status: 'pending' as const }, 'Requested ₦12,000 · Logo edits'],
    [{ asker: true, status: 'pending' as const }, 'You requested ₦12,000 · Logo edits'],
    [{ asker: false, status: 'paid' as const }, 'You paid ₦12,000 · Logo edits'],
    [{ asker: true, status: 'paid' as const }, 'Kemi paid ₦12,000 · Logo edits'],
    [{ asker: true, status: 'declined' as const }, 'Kemi declined ₦12,000 · Logo edits'],
    [{ asker: false, status: 'declined' as const }, 'You declined ₦12,000 · Logo edits'],
    [{ asker: true, status: 'cancelled' as const }, 'Request for ₦12,000 cancelled · Logo edits'],
  ])('%j reads %s', (look, words) => {
    expect(requestLine({ ...base, ...look }).text).toBe(words);
  });
  it('keeps real kobo and leaves out a missing reason', () => {
    expect(requestLine({ asker: false, status: 'pending', amountKobo: 1_250_050, memo: null, other: 'Kemi' }).text).toBe('Requested ₦12,500.50');
  });
});
