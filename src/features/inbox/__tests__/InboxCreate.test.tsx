/* eslint-disable @typescript-eslint/no-require-imports */
import * as rtl from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/**
 * R2-SOCIAL (a), CHECK-3 defect 1: the round + above the tab bar on I1 and its sibling boards is the shared Create button
 * (design/_gen/kit.js `Fab`, R-38), a creator's way into Create (M19). The Inbox tab never drew it. These tests drive the tab
 * route itself, so a missing `onCreate` is caught where the wiring lives.
 */
const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useIsFocused: () => true, useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn(), canGoBack: () => true }) }));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

let answers: Record<string, unknown> = {};
const ok = (data: unknown) => ({ statusCode: 200, message: 'OK', data });

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const key = `${request.method} ${url.pathname.replace(/^\/api\/hub/, '')}`;
  const body = answers[key];
  if (body === undefined) throw new Error(`no answer for ${key}`);
  return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

// Loaded after `fetch` is replaced: the API client keeps the fetch it finds when it is created.
const { queryClient } = require('@/api/query') as typeof import('@/api/query');
const InboxTab = (require('../../../app/(tabs)/inbox') as typeof import('../../../app/(tabs)/inbox')).default;
const { createButtonMetrics } = require('@/components/CreateButton') as typeof import('@/components/CreateButton');

const emptyInbox = ok({ items: [], nextCursor: null });

function account(accountType: 'creator' | 'user') {
  answers = {
    'GET /inbox': emptyInbox,
    'GET /inbox/unread': ok({ total: 0, chats: 0, paidDms: 0, communities: 0 }),
    'GET /users/me': ok({ wawuUserId: 'me', accountType }),
    'GET /paid-questions/waiting': ok({ count: 0 }),
    'GET /communities/mine': ok({ items: [], nextCursor: null }),
    'GET /communities': ok({ items: [], nextCursor: null }),
    'GET /credits': ok({ balance: 0 }),
  };
}

async function openInbox() {
  return rtl.render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, left: 0, right: 0, bottom: 34 } }}>
      <InboxTab />
    </SafeAreaProvider>,
  );
}

const settle = () => rtl.act(async () => new Promise((resolve) => setTimeout(resolve, 100)));

afterEach(async () => {
  await queryClient.cancelQueries();
  await rtl.act(async () => new Promise((resolve) => setTimeout(resolve, 10)));
  rtl.cleanup();
  queryClient.clear();
});

beforeEach(() => {
  mockPush.mockClear();
  queryClient.clear();
});

describe('I1 · the Create button over the Inbox (R-38)', () => {
  it('a creator sees the round + above the tab bar, and it opens Create', async () => {
    account('creator');
    const screen = await openInbox();
    const button = await screen.findByTestId('explore-create');
    expect(button.props.accessibilityLabel).toBe('Create');
    await rtl.act(async () => {
      rtl.fireEvent.press(button);
    });
    expect(mockPush).toHaveBeenCalledWith('/create');
  });

  it('the + sits where the board puts it: 58 across, 18 in from the right, 106 above the phone bottom less the bar', async () => {
    account('creator');
    const screen = await openInbox();
    const style = (await rtl.within(screen.getByTestId('inbox-screen')).findByTestId('explore-create')).props.style;
    const flat = Object.assign({}, ...[style].flat(3).filter(Boolean));
    expect(flat).toMatchObject({ position: 'absolute', right: 18, width: 58, height: 58 });
    expect(flat.bottom).toBe(createButtonMetrics.bottom);
  });

  it('it stays over the other chips of the Inbox (the boards draw it on Paid DMs, Communities and Money too)', async () => {
    account('creator');
    const screen = await openInbox();
    await screen.findByTestId('explore-create');
    await rtl.act(async () => {
      rtl.fireEvent.press(screen.getByText('Communities'));
    });
    await settle();
    expect(screen.getByTestId('explore-create')).toBeTruthy();
  });

  it('a person who is not a creator is shown no + (Create is for creator accounts, as on Home, Explore and Me)', async () => {
    account('user');
    const screen = await openInbox();
    await screen.findByTestId('inbox-empty');
    await settle();
    expect(screen.queryByTestId('explore-create')).toBeNull();
  });

  it('nothing is drawn while the account is still being read', async () => {
    account('creator');
    answers['GET /users/me'] = undefined;
    const screen = await openInbox();
    await screen.findByTestId('inbox-empty');
    await settle();
    expect(screen.queryByTestId('explore-create')).toBeNull();
  });
});
