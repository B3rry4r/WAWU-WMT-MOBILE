/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { ActivityIndicator, Animated, Image, Linking, Pressable, ScrollView, Text as NativeText, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/**
 * H33 in the TGIF reader (ADS-01): the sponsored card is a sixth step before the takeaway, from `GET /ads?placement=tgif_card`,
 * and each view, tap and skip is reported once (`POST /ads/{id}/events`).
 */
type Answer = { status: number; body: unknown } | 'offline' | 'hold' | 'late';
let answers: Record<string, Answer[]> = {};
let sent: { key: string; query: string; body: unknown }[] = [];
let releaseLate: (() => void) | null = null;

const ok = (data: unknown): Answer => ({ status: 200, body: { statusCode: 200, message: 'OK', data } });
const refused = (status: number, message: string): Answer => ({ status, body: { statusCode: status, message, data: null } });

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const key = `${request.method} ${url.pathname.replace(/^\/api\/hub/, '')}`;
  const text = request.method === 'GET' || request.method === 'DELETE' ? '' : await request.clone().text();
  sent.push({ key, query: url.search, body: text ? JSON.parse(text) : undefined });
  const answer = answers[key]?.[0];
  if (answers[key] && answers[key].length > 1) answers[key].shift();
  if (!answer) throw new Error(`no answer for ${key}`);
  if (answer === 'hold') return new Promise<Response>(() => undefined);
  if (answer === 'late') {
    // The card is on its way and is let through by the test, when it chooses.
    return new Promise<Response>((resolve) => {
      releaseLate = () => resolve(new Response(JSON.stringify({ statusCode: 200, message: 'OK', data: AD }), { status: 200, headers: { 'content-type': 'application/json' } }));
    });
  }
  if (answer === 'offline') throw new TypeError('Network request failed');
  return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

const { TgifReader } = require('../../tgif/TgifReader') as typeof import('../../tgif/TgifReader');
void [ActivityIndicator, Animated, Image, Linking, Pressable, ScrollView, NativeText, View];

beforeAll(async () => {
  const warm = await rtl.render(<View />);
  warm.unmount();
});

const clients: QueryClient[] = [];

async function render(child: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity } } });
  clients.push(client);
  await rtl.render(
    <QueryClientProvider client={client}>
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>{child}</SafeAreaProvider>
    </QueryClientProvider>,
  );
}

const opened = new Date(2025, 8, 26, 9, 41);
const DATE = '2025-09-26';
const AD_ID = '11111111-1111-4111-8111-111111111111';
const EVENT_ID = '22222222-2222-4222-8222-222222222222';

const day = {
  date: DATE,
  series: 'SONS, NOT SLAVES',
  seriesTheme: 'Who you are',
  verse: 'This is the day which the LORD hath made; we will rejoice and be glad in it.',
  verseReference: 'Psalm 118:24 (KJV)',
  reality: 'Today is not a leftover from yesterday.',
  remember: "I don't have to earn today.",
  prayer: 'Lord, thank you for this day.',
  takeaway: "Before your first meeting, write down one thing today that you're glad for.",
  shareLink: 'wawu/tgif',
};

/** Words the Hub served: none of them is in the app. */
const AD = {
  id: AD_ID,
  advertiser: 'Night Live Ltd',
  headline: 'Harvest Praise Night',
  subline: 'Lagos · Sun 2 November · from ₦3,500',
  ctaLabel: 'Book a seat',
  ctaDestination: 'event',
  ctaDestinationId: EVENT_ID,
  artworkUrl: 'https://cdn.example.test/harvest.jpg',
};

const stats = { date: DATE, cards: [], readers: 0, shares: 0, readByMe: false, sharedByMe: false };
const events = `POST /ads/${AD_ID}/events`;
const calls = (key: string) => sent.filter((s) => s.key === key);
const reported = () => calls(events).map((c) => (c.body as { type: string }).type);
const press = async (testID: string) => {
  await rtl.fireEvent.press(rtl.screen.getByTestId(testID));
};

async function boot(props: { withEvents?: boolean } = {}) {
  const onClose = jest.fn();
  const onOpenEvent = jest.fn();
  await render(<TgifReader onClose={onClose} onOpenEvent={props.withEvents === false ? undefined : onOpenEvent} now={opened} />);
  await rtl.screen.findByTestId('tgif-text');
  return { onClose, onOpenEvent };
}

/** Taps forward until the card on screen is the sponsored one, or the last card (the arrow is gone there). */
async function toSponsored() {
  while (!rtl.screen.queryByTestId('sponsored-step') && rtl.screen.queryByTestId('tgif-next')) {
    await rtl.fireEvent.press(rtl.screen.getByTestId('tgif-next'));
  }
}

const hiddenOk = { includeHiddenElements: true };
const segments = () => rtl.screen.getByTestId('tgif-progress').props.accessibilityValue as { now: number; max: number };

beforeEach(() => {
  answers = {
    [`GET /tgif/${DATE}`]: [ok(day)],
    [`GET /tgif/${DATE}/stats`]: [ok(stats)],
    [`POST /tgif/${DATE}/read`]: [ok({ readers: 1, counted: true })],
    'GET /ads': [ok(AD)],
    [events]: [ok({ accepted: true })],
  };
  sent = [];
  releaseLate = null;
});

afterEach(async () => {
  await rtl.act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
  clients.splice(0).forEach((c) => c.clear());
});

describe('H33 · the sponsored card in the reader', () => {
  it('asks the Hub for the TGIF placement, and the card is the sixth of six steps, before the takeaway', async () => {
    await boot();
    await rtl.waitFor(() => expect(calls('GET /ads')).toHaveLength(1));
    expect(calls('GET /ads')[0].query).toBe('?placement=tgif_card');
    await rtl.waitFor(() => expect(segments().max).toBe(6));
    await toSponsored();
    expect(rtl.screen.getByTestId('sponsored-step')).toBeTruthy();
    expect(segments()).toMatchObject({ now: 5, max: 6 });
    expect(rtl.screen.queryByTestId('tgif-text')).toBeNull();
  });

  it("draws the advertiser's words and the button word the Hub served, and the app's own SPONSORED, and nothing the Hub did not serve", async () => {
    await boot();
    await rtl.waitFor(() => expect(segments().max).toBe(6));
    await toSponsored();
    expect(rtl.screen.getByText('SPONSORED')).toBeTruthy();
    expect(rtl.screen.getByTestId('sponsored-headline')).toHaveTextContent('Harvest Praise Night');
    expect(rtl.screen.getByTestId('sponsored-subline')).toHaveTextContent('Lagos · Sun 2 November · from ₦3,500');
    expect(rtl.screen.getByText('Book a seat')).toBeTruthy();
    expect(rtl.screen.getByRole('button', { name: 'Skip' })).toBeTruthy();
    // Not backed by anything in the system: the canvas's line about ads paying for TGIF, and the TGIF pills and hint.
    expect(rtl.screen.queryByText(/keep TGIF free/i)).toBeNull();
    expect(rtl.screen.queryByTestId('tgif-amen')).toBeNull();
    expect(rtl.screen.queryByTestId('tgif-share')).toBeNull();
    expect(rtl.screen.queryByTestId('tgif-hint')).toBeNull();
    expect(rtl.screen.getByTestId('sponsored-artwork', hiddenOk).props.source).toEqual([{ uri: AD.artworkUrl }]);
  });

  it('draws a card with no line under the headline without that line, never an empty line or frame, and always with its picture', async () => {
    answers['GET /ads'] = [ok({ ...AD, subline: null })];
    await boot();
    await rtl.waitFor(() => expect(segments().max).toBe(6));
    await toSponsored();
    expect(rtl.screen.getByTestId('sponsored-headline')).toBeTruthy();
    expect(rtl.screen.queryByTestId('sponsored-subline')).toBeNull();
    expect(rtl.screen.getByTestId('sponsored-artwork', hiddenOk).props.source).toEqual([{ uri: AD.artworkUrl }]);
    expect(rtl.screen.getByTestId('sponsored-backdrop')).toBeTruthy();
    expect(rtl.screen.queryByTestId('tgif-backdrop')).toBeNull();
  });

  it('counts a view when the card is on screen, once, and not before the person gets there', async () => {
    await boot();
    await rtl.waitFor(() => expect(segments().max).toBe(6));
    expect(reported()).toEqual([]);
    await toSponsored();
    await rtl.waitFor(() => expect(reported()).toEqual(['view']));
    // Another look at the same card in the same reading changes nothing.
    await rtl.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 30));
    });
    expect(reported()).toEqual(['view']);
  });

  it('opens the event from the button, counts the tap once however often it is pressed, and stays on the card for the way back', async () => {
    const { onOpenEvent } = await boot();
    await rtl.waitFor(() => expect(segments().max).toBe(6));
    await toSponsored();
    await rtl.waitFor(() => expect(reported()).toEqual(['view']));
    await press('sponsored-cta');
    await press('sponsored-cta');
    expect(onOpenEvent).toHaveBeenCalledWith(EVENT_ID);
    // The button opens the event each time it is pressed; only the count is once.
    expect(onOpenEvent).toHaveBeenCalledTimes(2);
    await rtl.waitFor(() => expect(reported().filter((t) => t === 'tap')).toHaveLength(1));
    expect(rtl.screen.getByTestId('sponsored-step')).toBeTruthy();
  });

  it('skips to the takeaway, counts the skip once, and the takeaway is the last card with Done', async () => {
    const { onClose } = await boot();
    await rtl.waitFor(() => expect(segments().max).toBe(6));
    await toSponsored();
    await rtl.waitFor(() => expect(reported()).toEqual(['view']));
    await press('sponsored-skip');
    expect(await rtl.screen.findByTestId('tgif-text')).toHaveTextContent(/Before your first meeting/);
    expect(rtl.screen.getByTestId('tgif-label')).toHaveTextContent('TAKEAWAY');
    expect(rtl.screen.queryByTestId('sponsored-step')).toBeNull();
    expect(segments()).toMatchObject({ now: 6, max: 6 });
    await rtl.waitFor(() => expect(reported()).toEqual(['view', 'skip']));
    await press('tgif-done');
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(reported()).toEqual(['view', 'skip']);
  });

  it('a tap on the words or the picture does not skip the card', async () => {
    await boot();
    await rtl.waitFor(() => expect(segments().max).toBe(6));
    await toSponsored();
    await rtl.fireEvent.press(rtl.screen.getByTestId('sponsored-headline'));
    await rtl.fireEvent.press(rtl.screen.getByTestId('sponsored-step'));
    expect(rtl.screen.getByTestId('sponsored-step')).toBeTruthy();
    expect(reported().filter((t) => t === 'skip')).toHaveLength(0);
  });

  it('closes from the card, and counts nothing but the view', async () => {
    const { onClose } = await boot();
    await rtl.waitFor(() => expect(segments().max).toBe(6));
    await toSponsored();
    await press('tgif-close');
    expect(onClose).toHaveBeenCalledTimes(1);
    await rtl.waitFor(() => expect(reported()).toEqual(['view']));
  });

  it('keeps going when a report cannot be sent: the card still opens the event and skips', async () => {
    answers[events] = [refused(404, 'Not found')];
    const { onOpenEvent } = await boot();
    await rtl.waitFor(() => expect(segments().max).toBe(6));
    await toSponsored();
    await rtl.waitFor(() => expect(calls(events)).toHaveLength(1));
    await press('sponsored-cta');
    expect(onOpenEvent).toHaveBeenCalledWith(EVENT_ID);
    await press('sponsored-skip');
    expect(await rtl.screen.findByTestId('tgif-text')).toHaveTextContent(/Before your first meeting/);
  });
});

describe('the reader with no sponsored card', () => {
  it('with no live campaign (data: null), the five cards run as before and the progress has five steps', async () => {
    answers['GET /ads'] = [ok(null)];
    await boot();
    await rtl.waitFor(() => expect(calls('GET /ads')).toHaveLength(1));
    await rtl.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    expect(segments().max).toBe(5);
    await toSponsored();
    expect(rtl.screen.queryByTestId('sponsored-step')).toBeNull();
    expect(rtl.screen.getByTestId('tgif-label')).toHaveTextContent('TAKEAWAY');
    expect(calls(events)).toHaveLength(0);
  });

  it.each([
    ['the Hub answers with an error', refused(500, 'Server error')],
    ['there is no connection', 'offline' as const],
    ['the card is for a destination this build cannot open', ok({ ...AD, ctaDestination: 'link' })],
    ['the card has no picture (R-59)', ok({ ...AD, artworkUrl: null })],
    ['the picture is not a web address', ok({ ...AD, artworkUrl: 'javascript:alert(1)' })],
  ])('when %s, the five cards run as before and no frame or message about it is drawn', async (_why, answer) => {
    answers['GET /ads'] = [answer];
    await boot();
    await rtl.waitFor(() => expect(calls('GET /ads')).toHaveLength(1));
    await rtl.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    expect(segments().max).toBe(5);
    await toSponsored();
    expect(rtl.screen.getByTestId('tgif-label')).toHaveTextContent('TAKEAWAY');
    expect(rtl.screen.queryByText('SPONSORED')).toBeNull();
    expect(calls(events)).toHaveLength(0);
  });

  it('while the card is still on its way the cards are read, and the reader does not wait for it', async () => {
    answers['GET /ads'] = ['hold'];
    await boot();
    expect(rtl.screen.getByTestId('tgif-text')).toBeTruthy();
    expect(segments().max).toBe(5);
  });

  it('a card that arrives once the person is on the takeaway is not put in front of them', async () => {
    answers['GET /ads'] = ['late'];
    await boot();
    await rtl.waitFor(() => expect(releaseLate).not.toBeNull());
    await toSponsored();
    expect(rtl.screen.getByTestId('tgif-label')).toHaveTextContent('TAKEAWAY');
    await rtl.act(async () => {
      releaseLate?.();
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    expect(rtl.screen.getByTestId('tgif-label')).toHaveTextContent('TAKEAWAY');
    expect(segments()).toMatchObject({ now: 5, max: 5 });
    expect(calls(events)).toHaveLength(0);
  });

  it('a card that arrives while the person is still on an earlier card joins the steps', async () => {
    answers['GET /ads'] = ['late'];
    await boot();
    await rtl.waitFor(() => expect(releaseLate).not.toBeNull());
    expect(segments().max).toBe(5);
    await rtl.act(async () => {
      releaseLate?.();
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    await rtl.waitFor(() => expect(segments().max).toBe(6));
  });

  it('a reader that has nowhere to open an event never asks for a card, so it never draws a button that does nothing', async () => {
    await boot({ withEvents: false });
    await rtl.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    expect(calls('GET /ads')).toHaveLength(0);
    expect(segments().max).toBe(5);
  });
});
