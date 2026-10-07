/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { cardLabels, cardOrder } from '../model';

type Answer = { status: number; body: unknown } | 'offline' | 'hold';
let answers: Record<string, Answer[]> = {};
let sent: { key: string; body: unknown }[] = [];

const ok = (data: unknown, status = 200): Answer => ({ status, body: { statusCode: status, message: 'OK', data } });
const refused = (status: number, message: string): Answer => ({ status, body: { statusCode: status, message, data: null } });

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const path = new URL(request.url).pathname.replace(/^\/api\/hub/, '');
  const key = `${request.method} ${path}`;
  const text = request.method === 'GET' || request.method === 'DELETE' ? '' : await request.clone().text();
  sent.push({ key, body: text ? JSON.parse(text) : undefined });
  const answer = answers[key]?.[0];
  if (answers[key] && answers[key].length > 1) answers[key].shift();
  if (!answer) throw new Error(`no answer for ${key}`);
  if (answer === 'hold') return new Promise<Response>(() => undefined);
  if (answer === 'offline') throw new TypeError('Network request failed');
  return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

const clients: QueryClient[] = [];

async function render(child: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } } });
  clients.push(client);
  await rtl.render(
    <QueryClientProvider client={client}>
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>{child}</SafeAreaProvider>
    </QueryClientProvider>,
  );
  return client;
}

/** A Friday, so the header reads as H29 draws it. */
const opened = new Date(2025, 8, 26, 9, 41);
const DATE = '2025-09-26';

const day = {
  date: DATE,
  series: 'SONS, NOT SLAVES',
  seriesTheme: 'Who you are',
  verse: 'This is the day which the LORD hath made; we will rejoice and be glad in it.',
  verseReference: 'Psalm 118:24 (KJV)',
  reality: 'Today is not a leftover from yesterday. It was made, on purpose, and handed to you whole.',
  remember: "I don't have to earn today. I get to live it.",
  prayer: 'Lord, thank you for this day. Help me see it as a gift, and spend it well.',
  takeaway: "Before your first meeting, write down one thing today that you're glad for.",
  shareLink: 'wawu/tgif',
};

const statsOf = (amen: Partial<Record<(typeof cardOrder)[number], number>>, mine: (typeof cardOrder)[number][] = []) => ({
  date: DATE,
  cards: cardOrder.map((card) => ({ card, amen: amen[card] ?? 0, amenByMe: mine.includes(card) })),
  readers: 0,
  shares: 0,
  readByMe: false,
  sharedByMe: false,
});

async function boot(props: { onClose?: () => void; onOpenInbox?: () => void } = {}) {
  const { TgifReader } = require('../TgifReader') as typeof import('../TgifReader');
  const onClose = props.onClose ?? jest.fn();
  await render(<TgifReader onClose={onClose} onOpenInbox={props.onOpenInbox} now={opened} />);
  return { onClose };
}

const text = () => rtl.screen.getByTestId('tgif-text').props.children as string;
const label = () => rtl.screen.getByTestId('tgif-label').props.children as string;
const calls = (key: string) => sent.filter((s) => s.key === key);
const flat = (testID: string) => StyleSheet.flatten(rtl.screen.getByTestId(testID).props.style) as Record<string, unknown>;

beforeEach(() => {
  answers = {
    [`GET /tgif/${DATE}`]: [ok(day)],
    [`GET /tgif/${DATE}/stats`]: [ok(statsOf({ verse: 2149, prayer: 8999 }))],
    [`POST /tgif/${DATE}/read`]: [ok({ readers: 1, counted: true })],
  };
  sent = [];
});

afterEach(async () => {
  await rtl.act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
  clients.splice(0).forEach((c) => c.clear());
});

describe('H29 · the verse card', () => {
  it('shows a loading view while the day is on its way, and no card', async () => {
    answers[`GET /tgif/${DATE}`] = ['hold'];
    await boot();
    expect(rtl.screen.getByTestId('tgif-loading')).toBeTruthy();
    expect(rtl.screen.queryByTestId('tgif-text')).toBeNull();
  });

  it("shows the Hub's verse, its reference, the day and the series, and the first of five steps", async () => {
    await boot();
    expect(await rtl.screen.findByTestId('tgif-text')).toBeTruthy();
    expect(label()).toBe("TODAY'S VERSE");
    expect(text()).toBe(`\u201c${day.verse}\u201d`);
    expect(rtl.screen.getByTestId('tgif-reference').props.children).toBe('Psalm 118:24 (KJV)');
    expect(rtl.screen.getByTestId('tgif-header-line').props.children).toBe('Friday 26 September \u00b7 SONS, NOT SLAVES');
    expect(rtl.screen.getByText('TGIF')).toBeTruthy();
    expect(rtl.screen.getByLabelText('Card 1 of 5')).toBeTruthy();
    expect(rtl.screen.getByText('Tap to continue')).toBeTruthy();
    expect(JSON.stringify(rtl.screen.toJSON())).not.toMatch(/WAWU|Fintava|Flutterwave|\u2014/);
  });

  it('writes the Amen count as the Hub has it, 2.1K, and no second count beside it', async () => {
    await boot();
    await rtl.screen.findByTestId('tgif-text');
    expect(await rtl.screen.findByLabelText('Amen 2.1K')).toBeTruthy();
    expect(rtl.screen.queryByText('3.4K')).toBeNull();
    expect(rtl.screen.queryByTestId('icon-Heart')).toBeNull();
  });

  it('draws no number on an Amen nobody has said', async () => {
    answers[`GET /tgif/${DATE}/stats`] = [ok(statsOf({}))];
    await boot();
    await rtl.screen.findByTestId('tgif-text');
    expect(await rtl.screen.findByLabelText('Amen')).toBeTruthy();
  });

  it('counts the person as a reader once, however many cards they move through', async () => {
    await boot();
    await rtl.screen.findByTestId('tgif-text');
    await rtl.waitFor(() => expect(calls(`POST /tgif/${DATE}/read`)).toHaveLength(1));
    await rtl.fireEvent.press(rtl.screen.getByTestId('tgif-next'));
    await rtl.fireEvent.press(rtl.screen.getByTestId('tgif-next'));
    expect(calls(`POST /tgif/${DATE}/read`)).toHaveLength(1);
  });
});

describe('Amen', () => {
  it('a user can say Amen: the count moves at once, the Hub is told which card, and the pill shows it is theirs', async () => {
    answers[`POST /tgif/${DATE}/react`] = [ok({ card: 'verse', amen: 2150, amenByMe: true })];
    answers[`GET /tgif/${DATE}/stats`] = [ok(statsOf({ verse: 2149 })), ok(statsOf({ verse: 2150 }, ['verse']))];
    await boot();
    await rtl.fireEvent.press(await rtl.screen.findByLabelText('Amen 2.1K'));
    await rtl.waitFor(() => expect(calls(`POST /tgif/${DATE}/react`)).toHaveLength(1));
    expect(calls(`POST /tgif/${DATE}/react`)[0].body).toEqual({ card: 'verse' });
    const pill = await rtl.screen.findByTestId('tgif-amen');
    expect(pill.props.accessibilityState.selected).toBe(true);
  });

  it('moves the count at once, before the Hub has answered', async () => {
    answers[`GET /tgif/${DATE}/stats`] = [ok(statsOf({ verse: 2199 }))];
    answers[`POST /tgif/${DATE}/react`] = ['hold'];
    await boot();
    await rtl.fireEvent.press(await rtl.screen.findByLabelText('Amen 2.1K'));
    expect(await rtl.screen.findByLabelText('Amen 2.2K')).toBeTruthy();
    expect(rtl.screen.getByTestId('tgif-amen').props.accessibilityState.selected).toBe(true);
    expect(rtl.screen.getByTestId('tgif-amen').props.accessibilityState.disabled).toBe(true);
  });

  it('a user can take their Amen back: the Hub is told, and the count returns', async () => {
    answers[`GET /tgif/${DATE}/stats`] = [ok(statsOf({ verse: 3 }, ['verse'])), ok(statsOf({ verse: 2 }))];
    answers[`DELETE /tgif/${DATE}/react/verse`] = [ok({ card: 'verse', amen: 2, amenByMe: false })];
    await boot();
    const pill = await rtl.screen.findByLabelText('Amen 3');
    expect(pill.props.accessibilityState.selected).toBe(true);
    await rtl.fireEvent.press(pill);
    await rtl.waitFor(() => expect(calls(`DELETE /tgif/${DATE}/react/verse`)).toHaveLength(1));
    expect(await rtl.screen.findByLabelText('Amen 2')).toBeTruthy();
    expect(rtl.screen.getByTestId('tgif-amen').props.accessibilityState.selected).toBe(false);
  });

  it('puts the count back and says so when the Amen could not be saved', async () => {
    answers[`POST /tgif/${DATE}/react`] = [refused(500, 'Something went wrong')];
    await boot();
    await rtl.fireEvent.press(await rtl.screen.findByLabelText('Amen 2.1K'));
    expect(await rtl.screen.findByTestId('tgif-amen-problem')).toBeTruthy();
    expect(await rtl.screen.findByLabelText('Amen 2.1K')).toBeTruthy();
    expect(rtl.screen.getByTestId('tgif-amen').props.accessibilityState.selected).toBe(false);
  });

  it('says Amen to the card on screen: the reality card is not the verse card', async () => {
    answers[`POST /tgif/${DATE}/react`] = [ok({ card: 'reality', amen: 1, amenByMe: true })];
    await boot();
    await rtl.screen.findByTestId('tgif-text');
    await rtl.fireEvent.press(rtl.screen.getByTestId('tgif-next'));
    expect(label()).toBe('THE REALITY');
    await rtl.fireEvent.press(rtl.screen.getByTestId('tgif-amen'));
    await rtl.waitFor(() => expect(calls(`POST /tgif/${DATE}/react`)).toHaveLength(1));
    expect(calls(`POST /tgif/${DATE}/react`)[0].body).toEqual({ card: 'reality' });
  });

  it('still reads the cards, with Amen and no count, when the numbers cannot be loaded', async () => {
    answers[`GET /tgif/${DATE}/stats`] = [refused(500, 'Something went wrong')];
    await boot();
    expect(await rtl.screen.findByTestId('tgif-text')).toBeTruthy();
    expect(await rtl.screen.findByLabelText('Amen')).toBeTruthy();
  });
});

describe('H30 to H34 · tap to continue', () => {
  it('a user can move through the five cards by the arrow, with the words and label of each, and finish with Done', async () => {
    const { onClose } = await boot();
    await rtl.screen.findByTestId('tgif-text');
    const seen: [string, string][] = [[label(), text()]];
    for (let i = 1; i < 5; i += 1) {
      await rtl.fireEvent.press(rtl.screen.getByTestId('tgif-next'));
      expect(rtl.screen.getByLabelText(`Card ${i + 1} of 5`)).toBeTruthy();
      seen.push([label(), text()]);
    }
    expect(seen).toEqual([
      ["TODAY'S VERSE", `“${day.verse}”`],
      ['THE REALITY', day.reality],
      ['REMEMBER', day.remember],
      ['PRAYER', day.prayer],
      ['TAKEAWAY', day.takeaway],
    ]);
    expect(cardOrder.map((c) => cardLabels[c])).toEqual(seen.map(([l]) => l));
    expect(rtl.screen.queryByTestId('tgif-next')).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
    await rtl.fireEvent.press(rtl.screen.getByTestId('tgif-done'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('a tap on the words, or on "Tap to continue", moves on too, and a tap on the last card does not leave it', async () => {
    const { onClose } = await boot();
    await rtl.fireEvent.press(await rtl.screen.findByTestId('tgif-card-verse'));
    expect(label()).toBe('THE REALITY');
    await rtl.fireEvent.press(rtl.screen.getByTestId('tgif-hint'));
    expect(label()).toBe('REMEMBER');
    await rtl.fireEvent.press(rtl.screen.getByTestId('tgif-card-remember'));
    await rtl.fireEvent.press(rtl.screen.getByTestId('tgif-card-prayer'));
    expect(label()).toBe('TAKEAWAY');
    await rtl.fireEvent.press(rtl.screen.getByTestId('tgif-card-takeaway'));
    expect(label()).toBe('TAKEAWAY');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('fills the progress bar up to the card on screen', async () => {
    await boot();
    await rtl.screen.findByTestId('tgif-text');
    const filled = () => [0, 1, 2, 3, 4].map((i) => flat(`tgif-segment-${i}`).opacity === 1);
    expect(filled()).toEqual([true, false, false, false, false]);
    await rtl.fireEvent.press(rtl.screen.getByTestId('tgif-next'));
    await rtl.fireEvent.press(rtl.screen.getByTestId('tgif-next'));
    expect(filled()).toEqual([true, true, true, false, false]);
  });

  it('a user can close the reader from any card', async () => {
    const { onClose } = await boot();
    await rtl.screen.findByTestId('tgif-text');
    await rtl.fireEvent.press(rtl.screen.getByTestId('tgif-next'));
    await rtl.fireEvent.press(rtl.screen.getByTestId('tgif-close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('keeps a text that is longer than the canvas draws on the screen: the reality at 409 characters is set smaller, at 23', async () => {
    const long = 'Be strong. '.repeat(37).trim();
    answers[`GET /tgif/${DATE}`] = [ok({ ...day, reality: long })];
    await boot();
    await rtl.screen.findByTestId('tgif-text');
    expect(flat('tgif-text').fontSize).toBe(32);
    await rtl.fireEvent.press(rtl.screen.getByTestId('tgif-next'));
    expect(long.length).toBeGreaterThan(400);
    expect(flat('tgif-text').fontSize).toBe(23);
    expect(rtl.screen.getByTestId('tgif-body')).toBeTruthy();
  });
});

describe('H32 · the prayer', () => {
  it('has an Amen inside the prayer that says the same Amen as the one under it', async () => {
    answers[`POST /tgif/${DATE}/react`] = [ok({ card: 'prayer', amen: 9000, amenByMe: true })];
    answers[`GET /tgif/${DATE}/stats`] = [ok(statsOf({ prayer: 8999 })), ok(statsOf({ prayer: 9000 }, ['prayer']))];
    await boot();
    await rtl.screen.findByTestId('tgif-text');
    for (let i = 0; i < 3; i += 1) await rtl.fireEvent.press(rtl.screen.getByTestId('tgif-next'));
    expect(label()).toBe('PRAYER');
    expect(await rtl.screen.findByLabelText('Amen 8.9K')).toBeTruthy();
    await rtl.fireEvent.press(rtl.screen.getByTestId('tgif-amen-inline'));
    await rtl.waitFor(() => expect(calls(`POST /tgif/${DATE}/react`)).toHaveLength(1));
    expect(calls(`POST /tgif/${DATE}/react`)[0].body).toEqual({ card: 'prayer' });
    expect(await rtl.screen.findByLabelText('Amen 9K')).toBeTruthy();
    expect(rtl.screen.getByTestId('tgif-amen').props.accessibilityState.selected).toBe(true);
  });

  it('shows the inline Amen on the prayer and on no other card', async () => {
    await boot();
    await rtl.screen.findByTestId('tgif-text');
    expect(rtl.screen.queryByTestId('tgif-amen-inline')).toBeNull();
    await rtl.fireEvent.press(rtl.screen.getByTestId('tgif-next'));
    expect(rtl.screen.queryByTestId('tgif-amen-inline')).toBeNull();
  });
});

describe('States', () => {
  it('says there is no connection when the day cannot be reached, and a retry shows the cards', async () => {
    answers[`GET /tgif/${DATE}`] = ['offline', ok(day)];
    await boot();
    expect(await rtl.screen.findByText('No connection')).toBeTruthy();
    expect(rtl.screen.getByTestId('tgif-close')).toBeTruthy();
    await rtl.fireEvent.press(rtl.screen.getByLabelText('Try again'));
    expect(await rtl.screen.findByTestId('tgif-text')).toBeTruthy();
  });

  it('shows the Hub\'s own sentence when the day is refused, and can still be closed', async () => {
    answers[`GET /tgif/${DATE}`] = [refused(500, 'Something broke on our side')];
    const { onClose } = await boot();
    expect(await rtl.screen.findByText("Today's TGIF could not be loaded")).toBeTruthy();
    expect(rtl.screen.getByText('Something broke on our side')).toBeTruthy();
    await rtl.fireEvent.press(rtl.screen.getByTestId('tgif-close'));
    expect(onClose).toHaveBeenCalled();
  });

  it('refuses an answer that has no verse, as unreadable, and does not draw a card from it', async () => {
    answers[`GET /tgif/${DATE}`] = [ok({ date: DATE })];
    await boot();
    expect(await rtl.screen.findByTestId('tgif-error')).toBeTruthy();
    expect(rtl.screen.queryByTestId('tgif-text')).toBeNull();
  });

  it('opens the share sheet from any card', async () => {
    await boot();
    await rtl.screen.findByTestId('tgif-text');
    await rtl.fireEvent.press(rtl.screen.getByTestId('tgif-next'));
    expect(rtl.screen.queryByTestId('tgif-share-sheet')).toBeNull();
    await rtl.fireEvent.press(rtl.screen.getByTestId('tgif-share'));
    expect(await rtl.screen.findByTestId('tgif-share-sheet')).toBeTruthy();
  });
});
