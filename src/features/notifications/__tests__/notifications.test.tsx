/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient } from '@tanstack/react-query';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { AppState } from 'react-native';

import { calls, hub, installFetch, ok, refusal, renderFrame, type Sent } from '../../library/__helpers__/hub';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));
/** The screen's focus callbacks, so a test can bring the screen back into focus. */
const mockFocused: (() => void | (() => void))[] = [];
jest.mock('expo-router', () => ({
  useFocusEffect: (run: () => void | (() => void)) => {
    require('react').useEffect(() => {
      mockFocused.push(run);
      return run();
    }, [run]);
  },
}));
// I28 is the credits task's: here it only has to be raised.
jest.mock('@/features/credits/BuyCreditsEntry', () => ({
  BuyCreditsEntry: ({ visible }: { visible: boolean }) => {
    const { createElement } = require('react');
    const { Text } = require('react-native');
    return visible ? createElement(Text, { testID: 'buy-credits-sheet' }, 'Buy credits sheet') : null;
  },
}));

installFetch();
const { NotificationFeedScreen } = require('../NotificationFeedScreen') as typeof import('../NotificationFeedScreen');

const LIST = '/api/hub/me/notifications';
const minutesAgo = (n: number) => new Date(Date.now() - n * 60_000).toISOString();
const note = (id: string, kind: string, title: string, body: string, over: Record<string, unknown> = {}) => ({
  id,
  kind,
  category: 'other',
  title,
  body,
  tone: 'neutral',
  amountKobo: null,
  creditsCount: null,
  actionLabel: null,
  imageUrl: null,
  actionHref: null,
  read: false,
  createdAt: minutesAgo(1),
  target: null,
  actor: null,
  ...over,
});
const feed = [
  note('n1', 'dm_deadline', "Bisi's question: 1h left", 'Miss it and her ₦1,500 is refunded. You earn nothing.', { category: 'messages', tone: 'danger', actionLabel: 'Reply now' }),
  note('n2', 'tip_received', 'Tip from Amaka · +₦2,000', 'On How I light a night shoot', { category: 'money', tone: 'success', amountKobo: 200000, target: { kind: 'profile', id: 'u2', title: null, deadlineAt: null } }),
  note('n3', 'sale', 'New sale · +₦2,550', 'Brand deck template, to Tunde Adeyemi', { category: 'money', tone: 'success' }),
  note('n4', 'content_rejected', "Pricing playbook wasn't approved", 'Charts on pages 22–24 need a source.', { category: 'content', tone: 'danger', read: true, target: { kind: 'content', id: 'piece-1', title: 'Pricing playbook', deadlineAt: null } }),
  note('n5', 'credits_low', '3 credits left', 'Top up to keep posting in communities.', { category: 'money', tone: 'warning', creditsCount: 3, read: true, createdAt: minutesAgo(3 * 24 * 60) }),
  note('n6', 'new_follower', 'Zainab Bello followed you', '', { read: true, createdAt: minutesAgo(3 * 24 * 60 + 60) }),
  note('n7', 'something_new', 'A kind the app has not met', 'Still shown.', { read: true }),
];
const page = (items: unknown[], unreadCount = items.filter((i) => !(i as { read: boolean }).read).length, nextCursor: string | null = null) => ok({ items, nextCursor, unreadCount });
const byChip = (sent: Sent) => {
  const category = /category=(\w+)/.exec(sent.search)?.[1] ?? 'all';
  return page(category === 'all' ? feed : feed.filter((n) => n.category === category));
};

const COUNTS = ['me', 'counts'] as const;
/** The Me menu's and the bell's count is held by the app; reading a notification marks it out of date so it is read again. */
const staleCounts = (client: { getQueryState: (key: readonly string[]) => { isInvalidated: boolean } | undefined }) => client.getQueryState(COUNTS)?.isInvalidated === true;

const open = async () => {
  const handlers = { back: jest.fn(), open: jest.fn(), settings: jest.fn() };
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false }, mutations: { retry: false } } });
  client.setQueryData(COUNTS, { purchases: 0, saved: 0, unreadNotifications: 3 });
  const view = await renderFrame(<NotificationFeedScreen onBack={handlers.back} onOpen={handlers.open} onOpenSettings={handlers.settings} />, client);
  return { ...handlers, ...view };
};

beforeEach(() => {
  // The test renderer's AppState hands back no subscription; the app's returns one with a `remove`.
  jest.spyOn(AppState, 'addEventListener').mockImplementation((() => ({ remove: () => undefined })) as never);
  installFetch();
  hub.answers[`GET ${LIST}`] = byChip;
  hub.answers['POST /api/hub/notifications/n1/read'] = ok(null);
  hub.answers['POST /api/hub/notifications/n3/read'] = ok(null);
  hub.answers['POST /api/hub/notifications/n5/read'] = ok(null);
});

describe('M31 · Notifications', () => {
  it('a user sees each notification in the Hub\'s own words with its time, and a dot only on the new ones', async () => {
    await open();
    expect(await screen.findByText("Bisi's question: 1h left")).toBeTruthy();
    expect(screen.getByText('Miss it and her ₦1,500 is refunded. You earn nothing.')).toBeTruthy();
    expect(screen.getByText('Tip from Amaka · +₦2,000')).toBeTruthy();
    expect(screen.getByText('New sale · +₦2,550')).toBeTruthy();
    expect(screen.getByText('A kind the app has not met')).toBeTruthy();
    for (const id of ['n1', 'n2', 'n3']) expect(screen.getByTestId(`notification-dot-${id}`)).toBeTruthy();
    for (const id of ['n4', 'n5', 'n6', 'n7']) expect(screen.queryByTestId(`notification-dot-${id}`)).toBeNull();
  });

  it('a user can filter by chip, and each chip asks the Hub for its own category', async () => {
    await open();
    await screen.findByText('New sale · +₦2,550');
    await fireEvent.press(screen.getByRole('radio', { name: 'Money' }));
    await waitFor(() => expect(calls('GET', LIST).at(-1)?.search).toContain('category=money'));
    expect(await screen.findByText('New sale · +₦2,550')).toBeTruthy();
    expect(screen.queryByText("Bisi's question: 1h left")).toBeNull();
    await fireEvent.press(screen.getByRole('radio', { name: 'Content' }));
    expect(await screen.findByText("Pricing playbook wasn't approved")).toBeTruthy();
    expect(calls('GET', LIST).at(-1)?.search).toContain('category=content');
  });

  it('opening a new row marks it read on the Hub, clears its dot and reads the counts again', async () => {
    const { open: opened, queryClient } = await open();
    await screen.findByText('New sale · +₦2,550');
    await fireEvent.press(screen.getByTestId('notification-row-n3'));
    await waitFor(() => expect(screen.queryByTestId('notification-dot-n3')).toBeNull());
    await waitFor(() => expect(staleCounts(queryClient)).toBe(true));
    expect(calls('POST', '/api/hub/notifications/n3/read')).toHaveLength(1);
    // A sale opens the earnings (FIX-102: it opened the wallet).
    expect(opened).toHaveBeenCalledWith('/earnings');
    // The others are untouched.
    expect(screen.getByTestId('notification-dot-n1')).toBeTruthy();
  });

  it('a row with nothing to open and nothing to clear is not pressed', async () => {
    await open();
    await screen.findByText('A kind the app has not met');
    expect(screen.queryByRole('button', { name: /A kind the app has not met/ })).toBeNull();
    // FIX-102: a follower opens the follower's profile, or the Me tab when the Hub names none, so its row is pressed (it was not).
    expect(screen.queryByRole('button', { name: /Zainab Bello followed you/ })).not.toBeNull();
  });

  it('a double tap on a new row with nothing to open sends the read once, and a refused read can be sent again', async () => {
    const unknown = note('n8', 'something_new', 'Another kind the app has not met', 'Still shown.', { category: 'other' });
    let refuse: (v: { status: number; body: unknown }) => void = () => undefined;
    hub.answers[`GET ${LIST}`] = page([unknown]);
    // The Hub has not answered yet when the second tap lands.
    hub.answers['POST /api/hub/notifications/n8/read'] = new Promise((resolve) => {
      refuse = resolve;
    });
    await open();
    await screen.findByText('Another kind the app has not met');
    await fireEvent.press(screen.getByTestId('notification-row-n8'));
    await fireEvent.press(screen.getByTestId('notification-row-n8'));
    await waitFor(() => expect(calls('POST', '/api/hub/notifications/n8/read')).toHaveLength(1));
    // The Hub refused, so the dot is back and the next tap sends it again.
    refuse(refusal(500, 'Something went wrong on our side.'));
    await waitFor(() => expect(screen.getByTestId('notification-dot-n8')).toBeTruthy());
    hub.answers['POST /api/hub/notifications/n8/read'] = ok(null);
    await fireEvent.press(screen.getByTestId('notification-row-n8'));
    await waitFor(() => expect(calls('POST', '/api/hub/notifications/n8/read')).toHaveLength(2));
  });

  it('See why on a piece sent back opens M26 for that piece', async () => {
    const { open: opened } = await open();
    await screen.findByText("Pricing playbook wasn't approved");
    await fireEvent.press(screen.getByTestId('notification-action-n4'));
    expect(opened).toHaveBeenCalledWith({ pathname: '/library/[id]', params: { id: 'piece-1' } });
  });

  it('Top up on low credits raises the buy-credits sheet', async () => {
    await open();
    await screen.findByText('3 credits left');
    expect(screen.queryByTestId('buy-credits-sheet')).toBeNull();
    await fireEvent.press(screen.getByTestId('notification-action-n5'));
    expect(await screen.findByTestId('buy-credits-sheet')).toBeTruthy();
    // It was read already, so raising the sheet asks the Hub for nothing more.
    expect(calls('POST', '/api/hub/notifications/n5/read')).toHaveLength(0);
  });

  it('draws no Reply until the paid question screen is built (R-47)', async () => {
    await open();
    await screen.findByText("Bisi's question: 1h left");
    expect(screen.queryByRole('button', { name: 'Reply' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Reply now' })).toBeNull();
    expect(screen.queryByTestId('notification-action-n1')).toBeNull();
  });

  it('the sliders in the bar open notification settings', async () => {
    const { settings } = await open();
    await screen.findByText('New sale · +₦2,550');
    await fireEvent.press(screen.getByRole('button', { name: 'Notification settings' }));
    expect(settings).toHaveBeenCalledTimes(1);
  });

  it('M32 says the person is caught up when there is nothing at all, with no chips', async () => {
    hub.answers[`GET ${LIST}`] = page([]);
    await open();
    expect(await screen.findByText("You're all caught up")).toBeTruthy();
    expect(screen.getByText('Sales, tips, paid questions and reviews show up here.')).toBeTruthy();
    expect(screen.queryByRole('radio', { name: 'Money' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Notification settings' })).toBeTruthy();
  });

  it('M32 centres its words in the space under the bar, as the board draws them, not at the top', async () => {
    hub.answers[`GET ${LIST}`] = page([]);
    await open();
    await screen.findByText("You're all caught up");
    // The block fills what is left of the scrolling body and centres in it, lifted by the board's 120 at the foot (20 kept by the frame).
    expect(screen.getByTestId('notifications-empty-body')).toHaveStyle({ flexGrow: 1, justifyContent: 'center', paddingBottom: 100 });
  });

  it('keeps the chips when one chip is empty, so the person can go back', async () => {
    hub.answers[`GET ${LIST}`] = (sent: Sent) => (/category=messages/.test(sent.search) ? page([]) : page(feed));
    await open();
    await screen.findByText('New sale · +₦2,550');
    await fireEvent.press(screen.getByRole('radio', { name: 'Messages' }));
    expect(await screen.findByText("You're all caught up")).toBeTruthy();
    await fireEvent.press(screen.getByRole('radio', { name: 'All' }));
    expect(await screen.findByText('New sale · +₦2,550')).toBeTruthy();
  });

  it('shows the Hub\'s refusal with Try again, and the list once it answers', async () => {
    hub.answers[`GET ${LIST}`] = refusal(500, 'Something went wrong on our side.');
    await open();
    expect(await screen.findByText("Couldn't load your notifications")).toBeTruthy();
    hub.answers[`GET ${LIST}`] = byChip;
    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('New sale · +₦2,550')).toBeTruthy();
  });

  it('asks for the next page with the cursor the Hub gave', async () => {
    hub.answers[`GET ${LIST}`] = (sent: Sent) => (/cursor=c2/.test(sent.search) ? page([note('n9', 'sale', 'Older sale', 'Long ago', { read: true })], 0) : page(feed, 3, 'c2'));
    await open();
    await screen.findByText('New sale · +₦2,550');
    await fireEvent.scroll(screen.getByTestId('notifications-screen-scroll'), { nativeEvent: { contentOffset: { y: 400 }, contentSize: { height: 900 }, layoutMeasurement: { height: 800 } } });
    expect(await screen.findByText('Older sale')).toBeTruthy();
  });
});

describe('M31 · a notice that lands while the list is open (FIX-105 L5)', () => {
  // A community's notice is written a few seconds after its message, so it can land with the list already drawn.
  const landed = note('n20', 'community_messages', 'New messages in Lagos Creators', 'There are 3 new messages in “Lagos Creators”.', {
    category: 'messages',
    target: { kind: 'community', id: 'c1', title: null, deadlineAt: null },
  });
  const arrive = () => {
    hub.answers[`GET ${LIST}`] = page([landed, ...feed]);
  };

  it('a pull on the list reads the Hub again and the new notice shows', async () => {
    await open();
    await screen.findByText('New sale · +₦2,550');
    expect(screen.queryByText('New messages in Lagos Creators')).toBeNull();
    const reads = calls('GET', LIST).length;
    arrive();
    const control = screen.getByTestId('notifications-screen-scroll').props.refreshControl as { props: { onRefresh: () => void } };
    await act(async () => control.props.onRefresh());
    expect(await screen.findByText('New messages in Lagos Creators')).toBeTruthy();
    expect(calls('GET', LIST).length).toBeGreaterThan(reads);
  });

  it('coming back to the app with the list in front reads the Hub again, and leaving the list stops listening', async () => {
    // Every listener the screen holds right now (one removed on cleanup is not held).
    const held = new Set<(state: string) => void>();
    const listen = jest.spyOn(AppState, 'addEventListener').mockImplementation(((type: string, handler: (state: string) => void) => {
      if (type === 'change') held.add(handler);
      return { remove: () => held.delete(handler) };
    }) as never);
    const { unmount } = await open();
    await screen.findByText('New sale · +₦2,550');
    expect(held.size).toBe(1);
    arrive();
    // Going to the background reads nothing; coming back does.
    const before = calls('GET', LIST).length;
    await act(async () => held.forEach((onChange) => onChange('background')));
    expect(calls('GET', LIST)).toHaveLength(before);
    await act(async () => held.forEach((onChange) => onChange('active')));
    expect(await screen.findByText('New messages in Lagos Creators')).toBeTruthy();
    expect(calls('GET', LIST).length).toBeGreaterThan(before);
    await act(async () => unmount());
    expect(held.size).toBe(0);
    listen.mockRestore();
  });

  it('coming back into focus reads the Hub again (the first focus is the screen opening and reads once)', async () => {
    mockFocused.length = 0;
    await open();
    await screen.findByText('New sale · +₦2,550');
    const opening = calls('GET', LIST).length;
    arrive();
    await act(async () => {
      mockFocused.at(-1)!();
    });
    expect(await screen.findByText('New messages in Lagos Creators')).toBeTruthy();
    expect(calls('GET', LIST).length).toBeGreaterThan(opening);
  });
});
