/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '@/features/store/testing/webPath';

/*
 * REPORT-UGC round 1 (store gap B): the asker's side of a paid thread has the same "..." menu as the creator's side, Report above
 * Block. On Platform.OS android, the real screen, the Hub's thread as a stand-in `fetch`; the report and block routes are stand-ins.
 */
jest.mock('expo-router', () => ({ useIsFocused: () => true }));
jest.mock('@/features/visitor/api', () => {
  const actual = jest.requireActual('@/features/visitor/api');
  return { ...actual, blockPerson: jest.fn(async () => undefined) };
});
jest.mock('@/features/report/api', () => ({ sendReport: jest.fn(async () => ({ id: 'r1', alreadyReported: false })) }));

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const ok = (data: unknown) => json(200, { statusCode: 200, message: 'OK', data });
const CREATOR = '00000000-0000-4000-8000-0000000000c1';
const HOUR = 3_600_000;
const iso = (ms: number) => new Date(Date.now() + ms).toISOString();
const tick = (verified: boolean) => ({ verified, expiresAt: null });
const other = { wawuId: CREATOR, name: 'Chidi Eze', handle: 'chidi', avatarUrl: null, verification: { creator: tick(true), professional: tick(false) } };
const question = { id: 'w1', text: 'How did you price your first retainer?', amountKobo: 150_000, status: 'awaiting_response', mine: true, sentAt: iso(-6 * HOUR), deadlineAt: iso(18 * HOUR), respondedAt: null, replies: [] };
let thread: Record<string, unknown> | null;

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const path = new URL(request.url).pathname.replace(/^\/api\/hub/, '');
  if (path === `/paid-dm/threads/${CREATOR}`) return thread ? ok(thread) : json(404, { statusCode: 404, message: 'No paid questions with this person', data: null });
  if (path === `/users/${CREATOR}/visitor-profile`) {
    return ok({ name: 'Chidi Eze', own: false, following: false, profile: { wawuUserId: CREATOR, handle: 'chidi', avatarUrl: null, verification: other.verification, dmEnabled: true, dmPrice: 1500, dmResponseHours: 24 }, fields: {}, listings: [] });
  }
  if (path === `/paid-dm/creators/${CREATOR}/availability`) return ok({ creatorWawuId: CREATOR, paused: false, pausedUntil: null });
  if (path === '/money/wallet/balance') return ok({ availableKobo: 4_000_000, asOf: '2026-10-17T09:00:00.000Z' });
  if (path === '/dm/send/wallet/w1') return json(404, { statusCode: 404, message: 'We could not find that question.', data: null });
  if (path === '/prices') return json(404, { statusCode: 404, message: 'Not Found', data: null });
  throw new Error(`no answer for ${request.method} ${path}`);
}) as typeof fetch;

const clients: QueryClient[] = [];
async function boot() {
  const { PaidThreadScreen } = require('../PaidThreadScreen') as typeof import('../PaidThreadScreen');
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  clients.push(client);
  const onBack = jest.fn();
  await rtl.render(
    <QueryClientProvider client={client}>
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
        <PaidThreadScreen wawuId={CREATOR} onBack={onBack} pay={{ onOpenWallet: jest.fn(), onSetPin: jest.fn(), onForgotPin: jest.fn(), onAddMoney: jest.fn() }} />
      </SafeAreaProvider>
    </QueryClientProvider>,
  );
  return { onBack };
}
const { blockPerson } = require('@/features/visitor/api') as { blockPerson: jest.Mock };
const { sendReport } = require('@/features/report/api') as { sendReport: jest.Mock };

rtl.configure({ asyncUtilTimeout: 6000 });
beforeEach(() => {
  jest.replaceProperty(Platform, 'OS', 'android');
  thread = { thread: { other, side: 'fan', questionCount: 1, waitingCount: 1, nextDeadlineAt: null, lastActivityAt: iso(-1000), lastText: 'x', lastTextMine: true }, questions: [question], nextCursor: null };
  blockPerson.mockClear().mockResolvedValue(undefined);
  sendReport.mockClear().mockResolvedValue({ id: 'r1', alreadyReported: false });
});
afterEach(async () => {
  await rtl.act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
  clients.splice(0).forEach((c) => c.clear());
  jest.restoreAllMocks();
});

describe('the asker\'s side of a paid thread has the creator side\'s menu', () => {
  it('"..." opens Report this conversation above Block Chidi Eze; Report sends the conversation\'s kind and the newest question, and says thanks', async () => {
    await boot();
    await rtl.fireEvent.press(await rtl.screen.findByTestId('paid-thread-menu'));
    const rows = (await rtl.screen.findAllByTestId(/^paid-thread-menu-sheet-(report|block)$/)).map((n) => n.props.testID);
    expect(rows).toEqual(['paid-thread-menu-sheet-report', 'paid-thread-menu-sheet-block']);
    expect(rtl.screen.getByText('Report this conversation')).toBeTruthy();
    expect(rtl.screen.getByText('Block Chidi Eze')).toBeTruthy();
    await rtl.fireEvent.press(rtl.screen.getByTestId('paid-thread-menu-sheet-report'));
    await rtl.fireEvent.press(await rtl.screen.findByTestId('report-sheet-reason-harassment'));
    await rtl.fireEvent.press(rtl.screen.getByTestId('report-sheet-send'));
    await rtl.waitFor(() => expect(sendReport).toHaveBeenCalledWith(expect.objectContaining({ kind: 'direct_message', targetId: 'w1', reason: 'harassment' })));
    expect(await rtl.screen.findByText('Thanks. We’ll review this.')).toBeTruthy();
  });

  it('Block asks first, blocks through the existing route and closes the conversation; the Android back button closes the menu without blocking', async () => {
    const { onBack } = await boot();
    await rtl.fireEvent.press(await rtl.screen.findByTestId('paid-thread-menu'));
    await rtl.screen.findByTestId('paid-thread-menu-sheet-block');
    await rtl.fireEvent(rtl.screen.getByTestId('paid-thread-menu-sheet'), 'requestClose');
    await rtl.waitFor(() => expect(rtl.screen.queryByTestId('paid-thread-menu-sheet-block')).toBeNull());
    expect(blockPerson).not.toHaveBeenCalled();

    await rtl.fireEvent.press(rtl.screen.getByTestId('paid-thread-menu'));
    await rtl.fireEvent.press(await rtl.screen.findByTestId('paid-thread-menu-sheet-block'));
    expect(await rtl.screen.findByText('Block Chidi Eze?')).toBeTruthy();
    await rtl.fireEvent.press(rtl.screen.getByTestId('paid-thread-menu-sheet-block-yes'));
    await rtl.waitFor(() => expect(blockPerson).toHaveBeenCalledWith(CREATOR));
    await rtl.waitFor(() => expect(onBack).toHaveBeenCalledTimes(1));
  });

  it('a person with no question yet can still be blocked, and there is nothing to report', async () => {
    thread = null;
    await boot();
    await rtl.fireEvent.press(await rtl.screen.findByTestId('paid-thread-menu'));
    expect(await rtl.screen.findByTestId('paid-thread-menu-sheet-block')).toBeTruthy();
    expect(rtl.screen.queryByTestId('paid-thread-menu-sheet-report')).toBeNull();
  });
});
