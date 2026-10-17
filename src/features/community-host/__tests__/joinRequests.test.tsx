/* eslint-disable @typescript-eslint/no-require-imports */
import * as rtl from '@testing-library/react-native';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/*
 * I34 · Join requests (INBOX-14). In a room that sells a pass a waiting row is a member the host removed (INBOX-24 round 2, G-INBOX-24-6),
 * not someone who asked: the row says so, and its one button, "Let back in", lets them back (Decline is not drawn: the Hub keeps a removed row, INBOX-24
 * round 3). In any other private room the row is the board's "asked 2h ago", with Decline and Approve.
 */
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const ID = 'c0000000-0000-4000-8000-000000000009';
const hub = { sellsPass: true, passUnreadable: false, passGate: null as Promise<void> | null, requests: [] as Record<string, unknown>[], approved: [] as string[], declined: [] as string[] };

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/hub/, '');
  const ok = (data: unknown, extra: object = {}) => json(200, { statusCode: 200, message: 'OK', data, ...extra });
  if (path === `/communities/${ID}/room`) {
    return ok({ id: ID, name: 'Founders under 30', kind: 'private', imageUrl: null, description: 'A room', hostWawuId: 'me', memberCount: 12, messagesToday: 0, slug: 'f', link: 'wawu/c/f', role: 'host', messageCostInCredits: 0 });
  }
  if (path === `/communities/${ID}/pass`) {
    if (hub.passGate) await hub.passGate;
    if (hub.passUnreadable) return json(404, { statusCode: 404, message: 'Not found', data: null });
    return ok({ communityId: ID, sellsPass: hub.sellsPass, priceKobo: hub.sellsPass ? 200_000 : null, periodDays: 30, passUntil: null, active: false, canRenew: false, canBuy: false, isHost: true });
  }
  if (path === `/communities/${ID}/requests` && request.method === 'GET') return ok(hub.requests, { pagination: { nextPage: null, total: hub.requests.length } });
  const approve = path.match(/^\/communities\/[^/]+\/requests\/([^/]+)\/approve$/);
  if (approve && request.method === 'POST') {
    hub.approved.push(approve[1] as string);
    hub.requests = hub.requests.filter((r) => r.userWawuId !== approve[1]);
    return ok({ approved: true });
  }
  const decline = path.match(/^\/communities\/[^/]+\/requests\/([^/]+)$/);
  if (decline && request.method === 'DELETE') {
    hub.declined.push(decline[1] as string);
    hub.requests = hub.requests.filter((r) => r.userWawuId !== decline[1]);
    return ok({ declined: true });
  }
  throw new Error(`no answer for ${request.method} ${path}`);
}) as typeof fetch;

const { queryClient } = require('@/api/query') as typeof import('@/api/query');
const { JoinRequestsScreen } = require('../JoinRequestsScreen') as typeof import('../JoinRequestsScreen');

rtl.configure({ asyncUtilTimeout: 5000 });

beforeAll(async () => {
  const warm = await rtl.render(<View />);
  warm.unmount();
});

beforeEach(() => {
  queryClient.clear();
  hub.sellsPass = true;
  hub.passUnreadable = false;
  hub.passGate = null;
  hub.approved = [];
  hub.declined = [];
  hub.requests = [{ id: 'q1', userWawuId: 'u9', status: 'pending', requestedAt: new Date(Date.now() - 2 * 3_600_000).toISOString(), communityId: ID, joinedAt: null, handle: 'tolu', avatarUrl: null }];
});

async function open() {
  return rtl.render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <JoinRequestsScreen id={ID} onBack={jest.fn()} />
    </SafeAreaProvider>,
  );
}

describe('I34 in a room that sells a pass', () => {
  it('a waiting member is a removed one: the row says so, and "Let back in" is its only button', async () => {
    await open();
    await rtl.screen.findByTestId('request-u9');
    await rtl.waitFor(() => expect(rtl.screen.getByText('Removed from this room')).toBeTruthy());
    expect(rtl.screen.queryByText(/asked/)).toBeNull();
    // Decline does nothing for a removed member (the Hub keeps the row), so it is not drawn.
    expect(rtl.screen.queryByText('Decline')).toBeNull();
    expect(rtl.screen.queryByTestId('decline-u9')).toBeNull();
    expect(rtl.screen.queryByText('Approve')).toBeNull();
    expect(rtl.screen.getByText('Let back in')).toBeTruthy();
    rtl.fireEvent.press(rtl.screen.getByTestId('approve-u9'));
    await rtl.waitFor(() => expect(hub.approved).toEqual(['u9']));
    expect(hub.declined).toEqual([]);
    await rtl.screen.findByTestId('requests-empty');
    expect(rtl.screen.getByText('People you remove from this room wait here until you let them back in.')).toBeTruthy();
  });

  it('while the room is still being read, no button is drawn for the row', async () => {
    let open_!: () => void;
    hub.passGate = new Promise<void>((resolve) => {
      open_ = resolve;
    });
    await open();
    await rtl.screen.findByTestId('request-u9');
    expect(rtl.screen.queryByTestId('approve-u9')).toBeNull();
    expect(rtl.screen.queryByTestId('decline-u9')).toBeNull();
    open_();
    await rtl.screen.findByText('Let back in');
    expect(rtl.screen.queryByTestId('decline-u9')).toBeNull();
  });
});

describe('I34 in a room that sells no pass', () => {
  it('a waiting row is a request, with how long ago it was made', async () => {
    hub.sellsPass = false;
    await open();
    await rtl.screen.findByTestId('request-u9');
    await rtl.waitFor(() => expect(rtl.screen.getByText('asked 2h ago')).toBeTruthy());
    expect(rtl.screen.queryByText('Removed from this room')).toBeNull();
  });

  it('a real request can be declined or approved: Decline sends the decline', async () => {
    hub.sellsPass = false;
    await open();
    await rtl.screen.findByTestId('decline-u9');
    expect(rtl.screen.getByText('Decline')).toBeTruthy();
    expect(rtl.screen.getByText('Approve')).toBeTruthy();
    expect(rtl.screen.queryByText('Let back in')).toBeNull();
    rtl.fireEvent.press(rtl.screen.getByTestId('decline-u9'));
    await rtl.waitFor(() => expect(hub.declined).toEqual(['u9']));
  });
});

describe('I34 when the room cannot be read', () => {
  it('Approve alone is drawn, because it works for a request and for a removed member', async () => {
    hub.passUnreadable = true;
    await open();
    await rtl.screen.findByTestId('approve-u9');
    await rtl.waitFor(() => expect(rtl.screen.queryByTestId('decline-u9')).toBeNull());
    expect(rtl.screen.getByText('Approve')).toBeTruthy();
    rtl.fireEvent.press(rtl.screen.getByTestId('approve-u9'));
    await rtl.waitFor(() => expect(hub.approved).toEqual(['u9']));
  });
});
