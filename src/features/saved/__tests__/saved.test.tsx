/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient } from '@tanstack/react-query';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { calls, hub, installFetch, ok, refusal, renderFrame, type Sent } from '../../library/__helpers__/hub';
import { resetApp, signInOnly } from '@/features/store/testing/screen';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));
jest.mock('expo-router', () => ({
  useFocusEffect: (run: () => void) => {
    require('react').useEffect(run, [run]);
  },
}));

installFetch();
const { SavedScreen } = require('../SavedScreen') as typeof import('../SavedScreen');

const LIST = '/api/hub/me/saved';
const person = (name: string | null, handle: string | null) => ({ wawuId: `w-${handle}`, displayName: name, handle, avatarUrl: null, verification: { creator: { verified: false, expiresAt: null }, professional: { verified: false, expiresAt: null } } });
const piece = (id: string, title: string, over: Record<string, unknown> = {}) => ({
  id: `s-${id}`,
  kind: 'content',
  savedAt: '2026-10-01T10:00:00.000Z',
  content: { id, title, contentType: 'video', accessType: 'paid', priceKobo: 250000, thumbnailUrl: null, bought: false, creator: person('Chidi Eze', 'chidi'), ...over },
  event: null,
  creator: null,
});
const event = (id: string, name: string, over: Record<string, unknown> = {}) => ({
  id: `s-${id}`,
  kind: 'event',
  savedAt: '2026-10-01T09:00:00.000Z',
  content: null,
  event: { id, name, startsAt: '2031-10-04T15:00:00.000Z', endsAt: null, location: 'Lagos', bannerUrl: null, status: 'published', ...over },
  creator: null,
});
const maker = (id: string, name: string | null, handle: string | null) => ({ id: `s-${id}`, kind: 'creator', savedAt: '2026-10-01T08:00:00.000Z', content: null, event: null, creator: person(name, handle) });
const page = (items: unknown[], nextCursor: string | null = null) => ok({ items, nextCursor });

const all = [
  piece('w6', 'Agency breakdown'),
  event('e1', 'Lagos Creators Meetup'),
  piece('w3', 'Quiet mornings ep. 4', { accessType: 'free', priceKobo: null }),
  piece('c1', 'Pricing playbook', { bought: true }),
  event('e2', 'Abuja Makers Night', { status: 'cancelled' }),
  maker('m1', 'Zainab Bello', 'zainab-pro'),
];
const byTab = (sent: Sent) => {
  const tab = /type=(\w+)/.exec(sent.search)?.[1] ?? 'all';
  const kind = ({ content: 'content', events: 'event', creators: 'creator' } as Record<string, string>)[tab];
  return page(kind ? all.filter((e) => e.kind === kind) : all);
};

const COUNTS = ['me', 'counts'] as const;
/** The Me menu's count is held by the app; a save taken back marks it out of date so it is read again. */
const staleCounts = (client: { getQueryState: (key: readonly string[]) => { isInvalidated: boolean } | undefined }) => client.getQueryState(COUNTS)?.isInvalidated === true;

const open = async () => {
  const handlers = { back: jest.fn(), openEvent: jest.fn(), openContent: jest.fn() };
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false }, mutations: { retry: false } } });
  client.setQueryData(COUNTS, { purchases: 1, saved: 6, unreadNotifications: 0 });
  const view = await renderFrame(<SavedScreen onBack={handlers.back} onOpenEvent={handlers.openEvent} onOpenContent={handlers.openContent} />, client);
  return { ...handlers, ...view };
};

beforeEach(() => {
  installFetch();
  hub.answers[`GET ${LIST}`] = byTab;
});
afterEach(() => resetApp());

describe('M30 · Saved', () => {
  it('a user sees what they kept with its price, day, Free or Bought, from the Hub', async () => {
    // R-101 point 10: on a phone with a store the price is the store's (₦2,500 sells at ₦3,000), never the list price.
    hub.answers['GET /api/hub/prices'] = () => ok({ prices: [{ priceNaira: 2500, priceKobo: 250000, storePriceNaira: 3000 }], tips: [] });
    await signInOnly();
    await open();
    expect(await screen.findByText('Agency breakdown')).toBeTruthy();
    await waitFor(() => expect(screen.getByText('₦3,000')).toBeTruthy());
    expect(screen.queryByText('₦2,500')).toBeNull();
    expect(screen.getByText('Lagos Creators Meetup')).toBeTruthy();
    expect(screen.getByText('Sat 4 Oct 2031')).toBeTruthy();
    expect(screen.getByText('Free')).toBeTruthy();
    expect(screen.getByText('Bought')).toBeTruthy();
    expect(screen.getByText('Called off')).toBeTruthy();
    expect(screen.getByText('Zainab Bello')).toBeTruthy();
    expect(screen.getByText('@zainab-pro')).toBeTruthy();
    for (const name of ['All', 'Content', 'Events', 'Creators']) expect(screen.getByRole('radio', { name })).toBeTruthy();
  });

  it('a user can filter by tab, and each tab asks the Hub for its own kind', async () => {
    await open();
    await screen.findByText('Agency breakdown');
    await fireEvent.press(screen.getByRole('radio', { name: 'Events' }));
    expect(await screen.findByText('Lagos Creators Meetup')).toBeTruthy();
    expect(screen.queryByText('Agency breakdown')).toBeNull();
    expect(calls('GET', LIST).at(-1)?.search).toContain('type=events');
    await fireEvent.press(screen.getByRole('radio', { name: 'Creators' }));
    expect(await screen.findByText('Zainab Bello')).toBeTruthy();
    expect(calls('GET', LIST).at(-1)?.search).toContain('type=creators');
  });

  it('opens a saved event, and a saved creator opens nothing until their profile is built (ME-02, R-47)', async () => {
    const { openEvent, openContent } = await open();
    await screen.findByText('Agency breakdown');
    await fireEvent.press(screen.getByTestId('saved-open-s-e1'));
    expect(openEvent).toHaveBeenCalledWith('e1');
    expect(openContent).not.toHaveBeenCalled();
    expect(screen.queryByTestId('saved-open-s-m1')).toBeNull();
  });

  it('a saved piece opens its own page by the piece\'s id, bought or not, and the mark still takes the save back without opening it', async () => {
    const { openContent, openEvent } = await open();
    await screen.findByText('Agency breakdown');
    await fireEvent.press(screen.getByTestId('saved-open-s-w6'));
    expect(openContent).toHaveBeenLastCalledWith('w6');
    await fireEvent.press(screen.getByTestId('saved-open-s-c1'));
    expect(openContent).toHaveBeenLastCalledWith('c1');
    expect(openContent).toHaveBeenCalledTimes(2);
    expect(openEvent).not.toHaveBeenCalled();
    hub.answers['DELETE /api/hub/content/w6/save'] = { status: 200, body: { statusCode: 200, message: 'OK', data: { saved: false } } };
    await fireEvent.press(screen.getByTestId('saved-remove-s-w6'));
    await waitFor(() => expect(calls('DELETE', '/api/hub/content/w6/save')).toHaveLength(1));
    expect(openContent).toHaveBeenCalledTimes(2);
  });

  it('with nowhere to lead a piece\'s tile is not pressed (R-47)', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false }, mutations: { retry: false } } });
    await renderFrame(<SavedScreen onBack={jest.fn()} onOpenEvent={jest.fn()} />, client);
    await screen.findByText('Agency breakdown');
    expect(screen.queryByTestId('saved-open-s-w6')).toBeNull();
  });

  it('a user can take a save back: the tile goes at once, the Hub is asked, and the menu count is read again', async () => {
    let answer: (v: { status: number; body: unknown }) => void = () => undefined;
    hub.answers['DELETE /api/hub/content/w6/save'] = new Promise((resolve) => {
      answer = resolve;
    });
    const { queryClient } = await open();
    await screen.findByText('Agency breakdown');
    await fireEvent.press(screen.getByTestId('saved-remove-s-w6'));
    await waitFor(() => expect(screen.queryByText('Agency breakdown')).toBeNull());
    expect(calls('DELETE', '/api/hub/content/w6/save')).toHaveLength(1);
    expect(staleCounts(queryClient)).toBe(false);
    answer(ok({}));
    await waitFor(() => expect(staleCounts(queryClient)).toBe(true));
    expect(screen.getByText('Lagos Creators Meetup')).toBeTruthy();
  });

  it('takes an event and a creator back through their own routes', async () => {
    hub.answers['DELETE /api/hub/events/e1/save'] = ok({ saved: false });
    hub.answers['DELETE /api/hub/me/saved/creators/w-zainab-pro'] = ok({ creatorWawuId: 'w-zainab-pro', saved: false });
    const { queryClient } = await open();
    await screen.findByText('Agency breakdown');
    await fireEvent.press(screen.getByTestId('saved-remove-s-e1'));
    await waitFor(() => expect(calls('DELETE', '/api/hub/events/e1/save')).toHaveLength(1));
    await waitFor(() => expect(staleCounts(queryClient)).toBe(true));
    await fireEvent.press(screen.getByTestId('saved-remove-s-m1'));
    await waitFor(() => expect(calls('DELETE', '/api/hub/me/saved/creators/w-zainab-pro')).toHaveLength(1));
    await waitFor(() => expect(screen.queryByText('Zainab Bello')).toBeNull());
  });

  it('puts the tile back and says so when the Hub refuses to take a save back', async () => {
    hub.answers['DELETE /api/hub/content/w6/save'] = refusal(500, 'Something went wrong on our side.');
    await open();
    await screen.findByText('Agency breakdown');
    await fireEvent.press(screen.getByTestId('saved-remove-s-w6'));
    expect(await screen.findByText("Couldn't remove it. Try again.")).toBeTruthy();
    expect(screen.getByText('Agency breakdown')).toBeTruthy();
    await waitFor(() => expect(calls('DELETE', '/api/hub/content/w6/save')).toHaveLength(1));
  });

  describe('two take-backs in flight', () => {
    type Plain = { status: number; body: unknown };
    /** An answer the test gives when it chooses, so two requests can be in flight together. */
    const later = (key: string) => {
      let give: (v: Plain) => void = () => undefined;
      hub.answers[key] = new Promise<Plain>((resolve) => {
        give = resolve;
      });
      return (v: Plain) => give(v);
    };
    const shown = () => screen.getAllByTestId(/^saved-tile-/).map((tile) => tile.props.testID as string);
    const FIRST = ['saved-tile-s-w6', 'saved-tile-s-e1', 'saved-tile-s-w3', 'saved-tile-s-c1', 'saved-tile-s-e2', 'saved-tile-s-m1'];

    it('puts both tiles back, each in its place, when the Hub refuses both', async () => {
      const refuseW6 = later('DELETE /api/hub/content/w6/save');
      const refuseE1 = later('DELETE /api/hub/events/e1/save');
      await open();
      await screen.findByText('Agency breakdown');
      await fireEvent.press(screen.getByTestId('saved-remove-s-w6'));
      await fireEvent.press(screen.getByTestId('saved-remove-s-e1'));
      await waitFor(() => expect(shown()).toEqual(FIRST.slice(2)));
      refuseW6(refusal(500, 'Something went wrong on our side.'));
      await waitFor(() => expect(shown()).toEqual(['saved-tile-s-w6', ...FIRST.slice(2)]));
      refuseE1(refusal(500, 'Something went wrong on our side.'));
      await waitFor(() => expect(shown()).toEqual(FIRST));
      expect(screen.getByText("Couldn't remove it. Try again.")).toBeTruthy();
    });

    it.each([
      ['the refusal comes first', true],
      ['the success comes first', false],
    ])('puts back only the refused tile when the other take-back went through (%s)', async (_name, refusedFirst) => {
      const refuseW6 = later('DELETE /api/hub/content/w6/save');
      const agreeE1 = later('DELETE /api/hub/events/e1/save');
      const { queryClient } = await open();
      await screen.findByText('Agency breakdown');
      await fireEvent.press(screen.getByTestId('saved-remove-s-w6'));
      await fireEvent.press(screen.getByTestId('saved-remove-s-e1'));
      await waitFor(() => expect(shown()).toEqual(FIRST.slice(2)));
      if (refusedFirst) {
        refuseW6(refusal(500, 'Something went wrong on our side.'));
        await waitFor(() => expect(shown()).toEqual(['saved-tile-s-w6', ...FIRST.slice(2)]));
        agreeE1(ok({ saved: false }));
      } else {
        agreeE1(ok({ saved: false }));
        await waitFor(() => expect(staleCounts(queryClient)).toBe(true));
        expect(shown()).toEqual(FIRST.slice(2));
        refuseW6(refusal(500, 'Something went wrong on our side.'));
      }
      await waitFor(() => expect(shown()).toEqual(['saved-tile-s-w6', ...FIRST.slice(2)]));
      await waitFor(() => expect(staleCounts(queryClient)).toBe(true));
      expect(screen.queryByText('Lagos Creators Meetup')).toBeNull();
    });
  });

  it('says what each tab holds when it is empty', async () => {
    hub.answers[`GET ${LIST}`] = page([]);
    await open();
    expect(await screen.findByText('Nothing saved yet')).toBeTruthy();
    await fireEvent.press(screen.getByRole('radio', { name: 'Creators' }));
    expect(await screen.findByText('No saved creators')).toBeTruthy();
  });

  it('shows the Hub\'s refusal with Try again, and the grid once it answers', async () => {
    hub.answers[`GET ${LIST}`] = refusal(500, 'Something went wrong on our side.');
    await open();
    expect(await screen.findByText("Couldn't load your saved items")).toBeTruthy();
    hub.answers[`GET ${LIST}`] = byTab;
    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('Agency breakdown')).toBeTruthy();
  });

  it('asks for the next page with the cursor the Hub gave', async () => {
    hub.answers[`GET ${LIST}`] = (sent: Sent) => (/cursor=c2/.test(sent.search) ? page([piece('w9', 'Second page piece')]) : page(all, 'c2'));
    await open();
    await screen.findByText('Agency breakdown');
    await fireEvent.scroll(screen.getByTestId('saved-screen-scroll'), { nativeEvent: { contentOffset: { y: 400 }, contentSize: { height: 900 }, layoutMeasurement: { height: 800 } } });
    expect(await screen.findByText('Second page piece')).toBeTruthy();
    expect(screen.getByText('Agency breakdown')).toBeTruthy();
  });
});

describe('M30 · Saved school courses (FIX-107)', () => {
  const course = (id: string, title: string, over: Record<string, unknown> = {}) => ({
    id: `s-${id}`,
    kind: 'course',
    savedAt: '2026-10-01T07:00:00.000Z',
    content: null,
    event: null,
    creator: null,
    course: { id, title, schoolName: 'Greenfield Tech Academy', schoolLogo: null, weeks: 12, priceKobo: 15000000, ...over },
  });

  it('a saved school course shows in All with its school and fee, opens its page, and its mark takes the save back through the course route', async () => {
    hub.answers[`GET ${LIST}`] = () => page([course('c1', 'Product Design Bootcamp'), piece('w6', 'Agency breakdown')]);
    hub.answers['DELETE /api/hub/me/saved/courses/c1'] = ok({ courseId: 'c1', saved: false });
    const openCourse = jest.fn();
    const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false }, mutations: { retry: false } } });
    await renderFrame(<SavedScreen onBack={jest.fn()} onOpenEvent={jest.fn()} onOpenCourse={openCourse} />, client);
    await screen.findByText('Product Design Bootcamp');
    expect(screen.getByText('Greenfield Tech Academy · ₦150,000')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('saved-open-s-c1'));
    expect(openCourse).toHaveBeenCalledWith('c1');
    await fireEvent.press(screen.getByTestId('saved-remove-s-c1'));
    await waitFor(() => expect(calls('DELETE', '/api/hub/me/saved/courses/c1')).toHaveLength(1));
    await waitFor(() => expect(screen.queryByText('Product Design Bootcamp')).toBeNull());
    expect(screen.getByText('Agency breakdown')).toBeTruthy();
  });

  it('with nowhere to lead a course tile is not pressed (R-47)', async () => {
    hub.answers[`GET ${LIST}`] = () => page([course('c1', 'Product Design Bootcamp')]);
    const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false }, mutations: { retry: false } } });
    await renderFrame(<SavedScreen onBack={jest.fn()} onOpenEvent={jest.fn()} />, client);
    await screen.findByText('Product Design Bootcamp');
    expect(screen.queryByTestId('saved-open-s-c1')).toBeNull();
  });
});
