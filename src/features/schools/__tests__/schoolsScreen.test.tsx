/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

type Answer = { status: number; body: unknown } | 'offline' | 'hold';
let answers: Record<string, Answer[]> = {};
let sent: string[] = [];
/** Reads that never answer until the test ends, so "on its way" is a real state. */
let held: (() => void)[] = [];

const ok = (data: unknown): Answer => ({ status: 200, body: { statusCode: 200, message: 'OK', data } });
const failed = (status: number, message: string): Answer => ({ status, body: { statusCode: status, message } });
const page = (items: unknown[], nextCursor: string | null = null): Answer => ok({ items, nextCursor });

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const key = `${request.method} ${url.pathname.replace(/^\/api\/hub/, '')}`;
  sent.push(`${key}${url.search}`);
  const queue = answers[`${key}${url.search}`] ?? answers[key];
  const answer = queue?.[0];
  if (queue && queue.length > 1) queue.shift();
  if (!answer) throw new Error(`no answer for ${key}${url.search}`);
  if (answer === 'hold') return new Promise<Response>((resolve) => held.push(() => resolve(new Response(JSON.stringify({ statusCode: 500, message: 'Released.' }), { status: 500, headers: { 'content-type': 'application/json' } }))));
  if (answer === 'offline') throw new TypeError('Network request failed');
  return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

// Loaded after `fetch` is replaced: the API client keeps the fetch it finds when it is created.
const { queryClient } = require('@/api/query') as typeof import('@/api/query');
const { SchoolsScreen } = require('../SchoolsScreen') as typeof import('../SchoolsScreen');
const { SEARCH_DELAY_MS } = require('../useDebounced') as typeof import('../useDebounced');

function card(id: string, name: string, over: Record<string, unknown> = {}) {
  return {
    id,
    name,
    category: 'tech',
    location: 'Yaba, Lagos',
    logo: null,
    foundedYear: 2016,
    expertise: ['Product design'],
    courseCount: 18,
    fromPriceKobo: 4500000,
    matchedCourses: [],
    ...over,
  };
}

const GREENFIELD = card('s1', 'Greenfield Tech Academy');
const ABA = card('s2', 'Aba Fashion Institute', { category: 'creative', location: 'Aba', courseCount: 9, fromPriceKobo: 3000000 });
const LIST = 'GET /schools?limit=20';

function wrap(children: ReactNode) {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, left: 0, right: 0, bottom: 34 } }}>{children}</SafeAreaProvider>
    </QueryClientProvider>
  );
}

const settle = (ms = 50) =>
  rtl.act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });

/** What a person does: types, then the box waits for a pause before it asks. */
async function type(text: string) {
  await rtl.act(async () => {
    rtl.fireEvent.changeText(rtl.screen.getByTestId('schools-search'), text);
  });
}

const open = (props: Partial<import('../SchoolsScreen').SchoolsScreenProps> = {}) =>
  rtl.render(wrap(<SchoolsScreen onBack={jest.fn()} onOpen={jest.fn()} {...props} />));

beforeEach(() => {
  answers = {};
  sent = [];
  queryClient.clear();
});

afterEach(async () => {
  held.splice(0).forEach((release) => release());
  await queryClient.cancelQueries();
  await settle(10);
  rtl.cleanup();
  queryClient.clear();
});

describe('SC1 · Schools', () => {
  it('a user sees each school with its place, its course count and its lowest fee, and no rating', async () => {
    answers[LIST] = [page([GREENFIELD, ABA])];
    await open();
    expect(await rtl.screen.findByText('Greenfield Tech Academy')).toBeTruthy();
    expect(rtl.screen.getByText('Yaba, Lagos · 18 courses')).toBeTruthy();
    expect(rtl.screen.getByText('Aba · 9 courses')).toBeTruthy();
    expect(rtl.screen.getAllByText('from')).toHaveLength(2);
    // The fee is the API's, in naira, whole.
    expect(rtl.screen.getByLabelText('45,000 naira')).toBeTruthy();
    expect(rtl.screen.getByLabelText('30,000 naira')).toBeTruthy();
    // Whole naira: no kobo drawn after the figure.
    expect(rtl.within(rtl.screen.getByTestId('schools-price-s1')).queryByText('.00')).toBeNull();
    expect(rtl.screen.getByRole('button', { name: 'Greenfield Tech Academy, Yaba, Lagos · 18 courses, from ₦45,000' })).toBeTruthy();
    // No rating anywhere (R-32): no star, no figure out of five.
    expect(rtl.screen.queryByText(/\b[0-5]\.\d\b/)).toBeNull();
    expect(rtl.screen.queryByText(/rating|review/i)).toBeNull();
    expect(rtl.screen.queryByLabelText(/rating|review|star/i)).toBeNull();
  });

  it('every value on a card is the API’s: a different school draws different words and a different fee', async () => {
    answers[LIST] = [page([card('x9', 'Kano Skills Workshop', { location: 'Kano', courseCount: 1, fromPriceKobo: 123456700 })])];
    await open();
    expect(await rtl.screen.findByText('Kano Skills Workshop')).toBeTruthy();
    expect(rtl.screen.getByText('Kano · 1 course')).toBeTruthy();
    expect(rtl.screen.getByLabelText('1,234,567 naira')).toBeTruthy();
    expect(rtl.screen.queryByText('Greenfield Tech Academy')).toBeNull();
  });

  it('a lowest fee with kobo keeps its kobo on the card, neither floored nor rounded', async () => {
    answers[LIST] = [page([card('s6', 'Kobo College', { fromPriceKobo: 1234567 }), GREENFIELD])];
    await open();
    await rtl.screen.findByText('Kobo College');
    const price = rtl.screen.getByTestId('schools-price-s6');
    expect(price.props.accessibilityLabel).toBe('12,345 naira 67 kobo');
    expect(rtl.within(price).getByText('.67')).toBeTruthy();
    expect(rtl.screen.getByRole('button', { name: 'Kobo College, Yaba, Lagos · 18 courses, from ₦12,345.67' })).toBeTruthy();
    expect(rtl.screen.queryByLabelText('12,345 naira')).toBeNull();
    // The other school's whole-naira fee still drops its .00.
    expect(rtl.screen.getByTestId('schools-price-s1').props.accessibilityLabel).toBe('45,000 naira');
    expect(rtl.within(rtl.screen.getByTestId('schools-price-s1')).queryByText('.00')).toBeNull();
    expect(rtl.screen.getAllByText('from')).toHaveLength(2);
  });

  it('a school whose lowest fee is 0 reads "Free" on its card, with no "from" and no naira sign', async () => {
    answers[LIST] = [page([card('s7', 'Free Lessons Academy', { fromPriceKobo: 0, courseCount: 1 }), GREENFIELD])];
    await open();
    await rtl.screen.findByText('Free Lessons Academy');
    const row = rtl.within(rtl.screen.getByTestId('schools-row-s7'));
    expect(row.getByText('Free')).toBeTruthy();
    expect(row.queryByText('from')).toBeNull();
    expect(row.queryByText('₦')).toBeNull();
    expect(rtl.screen.getByTestId('schools-price-s7').props.accessibilityLabel).toBe('Free');
    expect(rtl.screen.getByRole('button', { name: 'Free Lessons Academy, Yaba, Lagos · 1 course, Free' })).toBeTruthy();
    // The other card still says from and its fee.
    expect(rtl.within(rtl.screen.getByTestId('schools-row-s1')).getByText('from')).toBeTruthy();
    expect(rtl.screen.queryByLabelText('0 naira')).toBeNull();
  });

  it('the logo is the school’s picture when it has one, and its initials when it has not', async () => {
    answers[LIST] = [page([GREENFIELD, card('s3', 'Kano Skills Workshop', { logo: 'https://files.example/kano.png' })])];
    await open();
    await rtl.screen.findByText('Greenfield Tech Academy');
    expect(rtl.within(rtl.screen.getByTestId('schools-logo-s1')).getByText('GT')).toBeTruthy();
    expect(rtl.screen.queryByTestId('schools-logo-s1-image')).toBeNull();
    expect(rtl.screen.getByTestId('schools-logo-s3-image')).toBeTruthy();
    expect(rtl.within(rtl.screen.getByTestId('schools-logo-s3')).queryByText('KS')).toBeNull();
  });

  it('a school with no course draws no price and says 0 courses', async () => {
    answers[LIST] = [page([card('s4', 'Ibadan Languages Centre', { courseCount: 0, fromPriceKobo: null, location: 'Ibadan' })])];
    await open();
    expect(await rtl.screen.findByText('Ibadan · 0 courses')).toBeTruthy();
    expect(rtl.screen.queryByText('from')).toBeNull();
    expect(rtl.screen.queryByTestId('schools-price-s4')).toBeNull();
  });

  it('a user can tap a school and its id goes to SC2', async () => {
    answers[LIST] = [page([GREENFIELD, ABA])];
    const onOpen = jest.fn();
    await open({ onOpen });
    await rtl.act(async () => rtl.fireEvent.press(await rtl.screen.findByTestId('schools-row-s2')));
    expect(onOpen).toHaveBeenCalledWith('s2');
  });

  it('back is the bar’s back button', async () => {
    answers[LIST] = [page([GREENFIELD])];
    const onBack = jest.fn();
    await open({ onBack });
    await rtl.screen.findByText('Greenfield Tech Academy');
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('schools-back')));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('the first read asks for the plain list: no category, no search, a page of 20', async () => {
    answers[LIST] = [page([GREENFIELD])];
    await open();
    await rtl.screen.findByText('Greenfield Tech Academy');
    expect(sent).toEqual([LIST]);
  });

  it('draws the chips All, Tech, Business, Creative, Languages and Vocational, and the search box with its words', async () => {
    answers[LIST] = [page([GREENFIELD])];
    await open();
    await rtl.screen.findByText('Greenfield Tech Academy');
    const chips = rtl.within(rtl.screen.getByTestId('schools-chips')).getAllByRole('radio').map((c) => c.props.accessibilityLabel);
    expect(chips).toEqual(['All', 'Tech', 'Business', 'Creative', 'Languages', 'Vocational']);
    expect(rtl.screen.getByPlaceholderText('Search schools or courses')).toBeTruthy();
    expect(rtl.screen.getByLabelText('Search schools or courses')).toBeTruthy();
    expect(rtl.screen.getByRole('header', { name: 'Schools' })).toBeTruthy();
  });
});

describe('SC1 · category chips', () => {
  it('a user can pick a category and the list is that category’s, asked of the Hub', async () => {
    answers[LIST] = [page([GREENFIELD, ABA])];
    answers['GET /schools?limit=20&category=creative'] = [page([ABA])];
    await open();
    await rtl.screen.findByText('Greenfield Tech Academy');
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('schools-chips-creative')));
    await rtl.waitFor(() => expect(rtl.screen.queryByText('Greenfield Tech Academy')).toBeNull());
    expect(rtl.screen.getByText('Aba Fashion Institute')).toBeTruthy();
    expect(sent).toContain('GET /schools?limit=20&category=creative');
    expect(rtl.screen.getByTestId('schools-chips-creative').props.accessibilityState.checked).toBe(true);
    // All goes back to the plain list.
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('schools-chips-all')));
    expect(await rtl.screen.findByText('Greenfield Tech Academy')).toBeTruthy();
  });

  it('each category sends its own id', async () => {
    for (const id of ['tech', 'business', 'creative', 'languages', 'vocational']) answers[`GET /schools?limit=20&category=${id}`] = [page([])];
    answers[LIST] = [page([GREENFIELD])];
    await open();
    await rtl.screen.findByText('Greenfield Tech Academy');
    for (const id of ['tech', 'business', 'creative', 'languages', 'vocational']) {
      await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId(`schools-chips-${id}`)));
      await rtl.waitFor(() => expect(sent).toContain(`GET /schools?limit=20&category=${id}`));
    }
  });

  it('a category and a search go together', async () => {
    answers[LIST] = [page([GREENFIELD])];
    answers['GET /schools?limit=20&category=tech'] = [page([GREENFIELD])];
    answers['GET /schools?limit=20&category=tech&q=design'] = [page([card('s1', 'Greenfield Tech Academy', { matchedCourses: ['Product Design'] })])];
    await open();
    await rtl.screen.findByText('Greenfield Tech Academy');
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('schools-chips-tech')));
    await type('design');
    await rtl.waitFor(() => expect(sent).toContain('GET /schools?limit=20&category=tech&q=design'), { timeout: 3000 });
  });
});

describe('SC1 · search', () => {
  it('a user can search: the box waits for a pause, then asks the Hub with the words typed', async () => {
    answers[LIST] = [page([GREENFIELD, ABA])];
    answers['GET /schools?limit=20&q=design'] = [page([GREENFIELD])];
    await open();
    await rtl.screen.findByText('Aba Fashion Institute');
    await type('d');
    await type('de');
    await type('design');
    // Nothing is asked while keys are still coming.
    await settle(SEARCH_DELAY_MS / 3);
    expect(sent).toEqual([LIST]);
    await rtl.waitFor(() => expect(sent).toContain('GET /schools?limit=20&q=design'), { timeout: 3000 });
    // One search for the three keys, not three.
    expect(sent.filter((s) => s.includes('q='))).toEqual(['GET /schools?limit=20&q=design']);
    await rtl.waitFor(() => expect(rtl.screen.queryByText('Aba Fashion Institute')).toBeNull());
    expect(rtl.screen.getByText('Greenfield Tech Academy')).toBeTruthy();
  });

  it('the search key asks at once', async () => {
    answers[LIST] = [page([GREENFIELD])];
    answers['GET /schools?limit=20&q=aba'] = [page([ABA])];
    await open();
    await rtl.screen.findByText('Greenfield Tech Academy');
    await type('aba');
    await rtl.act(async () => {
      rtl.fireEvent(rtl.screen.getByTestId('schools-search'), 'submitEditing');
    });
    await rtl.waitFor(() => expect(sent).toContain('GET /schools?limit=20&q=aba'), { timeout: 1000 });
  });

  it('the rows from before stay while the next search is on its way', async () => {
    answers[LIST] = [page([GREENFIELD])];
    answers['GET /schools?limit=20&q=aba'] = ['hold'];
    await open();
    await rtl.screen.findByText('Greenfield Tech Academy');
    await type('aba');
    await rtl.waitFor(() => expect(sent).toContain('GET /schools?limit=20&q=aba'), { timeout: 3000 });
    expect(rtl.screen.getByText('Greenfield Tech Academy')).toBeTruthy();
    expect(rtl.screen.queryByTestId('schools-empty')).toBeNull();
  });

  it('after an empty answer, the next search shows the loading shapes while the Hub is held, never the old empty words or the new ones', async () => {
    answers[LIST] = [page([GREENFIELD])];
    answers['GET /schools?limit=20&q=zzz'] = [page([])];
    answers['GET /schools?limit=20&q=zzzy'] = ['hold'];
    await open();
    await rtl.screen.findByText('Greenfield Tech Academy');
    await type('zzz');
    expect(await rtl.screen.findByText('No schools for "zzz"', {}, { timeout: 3000 })).toBeTruthy();
    // Typing again with the Hub held: there are no rows from before to keep, so the shapes show, not empty words.
    await type('zzzy');
    await rtl.waitFor(() => expect(sent).toContain('GET /schools?limit=20&q=zzzy'), { timeout: 3000 });
    expect(rtl.screen.getByTestId('schools-loading')).toBeTruthy();
    expect(rtl.screen.queryByTestId('schools-empty')).toBeNull();
    expect(rtl.screen.queryByText('No schools for "zzz"')).toBeNull();
    expect(rtl.screen.queryByText('No schools for "zzzy"')).toBeNull();
    expect(rtl.screen.queryByTestId('schools-error')).toBeNull();
    // The search box keeps what was typed while it waits.
    expect(rtl.screen.getByTestId('schools-search').props.value).toBe('zzzy');
  });

  it('a NUL or a control character never reaches the Hub: it is a space, and the request is clean', async () => {
    answers[LIST] = [page([GREENFIELD])];
    answers['GET /schools?limit=20&q=a+b+c'] = [page([ABA])];
    answers['GET /schools?limit=20&q=a%20b%20c'] = [page([ABA])];
    await open();
    await rtl.screen.findByText('Greenfield Tech Academy');
    await type('a\u0000b\tc\u001f');
    await rtl.waitFor(() => expect(sent.length).toBe(2), { timeout: 3000 });
    const request = decodeURIComponent(sent[1].replace(/\+/g, ' '));
    expect(request).toBe('GET /schools?limit=20&q=a b c');
    expect(sent[1]).not.toMatch(/%00|%1F|%09/i);
  });

  it('a search of nothing but control characters or spaces is no search', async () => {
    answers[LIST] = [page([GREENFIELD])];
    await open();
    await rtl.screen.findByText('Greenfield Tech Academy');
    await type('\u0000 \t');
    await settle(SEARCH_DELAY_MS + 150);
    expect(sent).toEqual([LIST]);
  });

  it('the box takes at most what the Hub does, and a broken character is dropped before it is sent', async () => {
    answers[LIST] = [page([GREENFIELD])];
    answers['GET /schools?limit=20&q=ab'] = [page([ABA])];
    await open();
    await rtl.screen.findByText('Greenfield Tech Academy');
    expect(rtl.screen.getByTestId('schools-search').props.maxLength).toBe(100);
    await type('a\uD83Db');
    await rtl.waitFor(() => expect(sent).toContain('GET /schools?limit=20&q=ab'), { timeout: 3000 });
  });

  it('a search with a wildcard or a quote in it is sent as it is, to be matched as text', async () => {
    answers[LIST] = [page([GREENFIELD])];
    answers[`GET /schools?limit=20&q=${encodeURIComponent('50%_"x"').replace(/%20/g, '+')}`] = [page([])];
    await open();
    await rtl.screen.findByText('Greenfield Tech Academy');
    await type('50%_"x"');
    await rtl.waitFor(() => expect(sent.length).toBe(2), { timeout: 3000 });
    expect(new URL(`http://x/${sent[1].split(' ')[1]}`).searchParams.get('q')).toBe('50%_"x"');
  });
});

describe('SC10 · No results', () => {
  it('a search no school matches says so, with the search in its words, and keeps the search and the chips', async () => {
    answers[LIST] = [page([GREENFIELD])];
    answers['GET /schools?limit=20&q=drone+piloting'] = [page([])];
    answers['GET /schools?limit=20&q=drone%20piloting'] = [page([])];
    await open();
    await rtl.screen.findByText('Greenfield Tech Academy');
    await type('drone piloting');
    expect(await rtl.screen.findByText('No schools for "drone piloting"', {}, { timeout: 3000 })).toBeTruthy();
    expect(rtl.screen.getByText('Try a shorter search, or browse a category.')).toBeTruthy();
    expect(rtl.screen.getByTestId('schools-empty')).toBeTruthy();
    expect(rtl.screen.queryByText('Greenfield Tech Academy')).toBeNull();
    // The person can still edit the search and pick a chip.
    expect(rtl.screen.getByTestId('schools-search').props.value).toBe('drone piloting');
    expect(rtl.screen.getByTestId('schools-chips-all').props.accessibilityState.checked).toBe(true);
  });

  it('the person can edit the search from there, and the schools come back', async () => {
    answers[LIST] = [page([GREENFIELD])];
    answers['GET /schools?limit=20&q=drone'] = [page([])];
    await open();
    await rtl.screen.findByText('Greenfield Tech Academy');
    await type('drone');
    await rtl.screen.findByText('No schools for "drone"', {}, { timeout: 3000 });
    await type('');
    expect(await rtl.screen.findByText('Greenfield Tech Academy', {}, { timeout: 3000 })).toBeTruthy();
    expect(rtl.screen.queryByTestId('schools-empty')).toBeNull();
  });

  it('the person can pick a category from there', async () => {
    answers[LIST] = [page([GREENFIELD])];
    answers['GET /schools?limit=20&q=drone'] = [page([])];
    answers['GET /schools?limit=20&category=creative&q=drone'] = [page([ABA])];
    await open();
    await rtl.screen.findByText('Greenfield Tech Academy');
    await type('drone');
    await rtl.screen.findByText('No schools for "drone"', {}, { timeout: 3000 });
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('schools-chips-creative')));
    expect(await rtl.screen.findByText('Aba Fashion Institute')).toBeTruthy();
  });

  it('the empty list says what is true for a category nobody is in, and for no school at all', async () => {
    answers[LIST] = [page([])];
    answers['GET /schools?limit=20&category=languages'] = [page([])];
    await open();
    expect(await rtl.screen.findByText('No schools yet')).toBeTruthy();
    expect(rtl.screen.getByText('Check back later.')).toBeTruthy();
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('schools-chips-languages')));
    expect(await rtl.screen.findByText('No Languages schools yet')).toBeTruthy();
    expect(rtl.screen.getByText('Try another category.')).toBeTruthy();
  });

  it('the words of an empty list carry no em-dash', async () => {
    answers[LIST] = [page([])];
    await open();
    await rtl.screen.findByText('No schools yet');
    const words = rtl.screen.queryAllByText(/.*/).map((node) => String(node.props.children));
    expect(words).toContain('No schools yet');
    expect(words.join(' ')).not.toContain(String.fromCharCode(0x2014));
  });
});

describe('SC1 · loading, failing, paging', () => {
  it('while the first read is on its way, a user sees the shapes of the cards and no school, empty line or error', async () => {
    answers[LIST] = ['hold'];
    await open();
    expect(await rtl.screen.findByTestId('schools-loading')).toBeTruthy();
    expect(rtl.screen.getByLabelText('Loading schools')).toBeTruthy();
    expect(rtl.screen.queryByTestId('schools-empty')).toBeNull();
    expect(rtl.screen.queryByTestId('schools-error')).toBeNull();
    // The bar, the search and the chips are there while it waits.
    expect(rtl.screen.getByTestId('schools-search')).toBeTruthy();
    expect(rtl.screen.getByTestId('schools-chips-tech')).toBeTruthy();
  });

  it('when the Hub answers with a failure, a user sees why and can try again', async () => {
    answers[LIST] = [failed(500, 'Something went wrong on our side'), failed(500, 'Something went wrong on our side'), failed(500, 'Something went wrong on our side'), page([GREENFIELD])];
    await open();
    expect(await rtl.screen.findByTestId('schools-error', {}, { timeout: 8000 })).toBeTruthy();
    expect(rtl.screen.getByText('Couldn’t load schools')).toBeTruthy();
    expect(rtl.screen.getByText('Something went wrong on our side')).toBeTruthy();
    expect(rtl.screen.queryByTestId('schools-empty')).toBeNull();
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Try again' })));
    expect(await rtl.screen.findByText('Greenfield Tech Academy')).toBeTruthy();
    expect(rtl.screen.queryByTestId('schools-error')).toBeNull();
  }, 15000);

  it('with no connection a user is told so', async () => {
    answers[LIST] = ['offline', 'offline', 'offline', page([GREENFIELD])];
    await open();
    expect(await rtl.screen.findByText('No connection. Check your internet and try again.', {}, { timeout: 8000 })).toBeTruthy();
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Try again' })));
    expect(await rtl.screen.findByText('Greenfield Tech Academy')).toBeTruthy();
  }, 15000);

  it('a body the Hub sent that is not a list of schools reads as a failure, never as an empty list', async () => {
    answers[LIST] = [ok({ nope: true }), ok({ nope: true }), ok({ nope: true })];
    await open();
    expect(await rtl.screen.findByTestId('schools-error', {}, { timeout: 8000 })).toBeTruthy();
    expect(rtl.screen.queryByTestId('schools-empty')).toBeNull();
  }, 15000);

  it('a user reads on: the end of the list asks for the next page with the Hub’s cursor, once', async () => {
    answers[LIST] = [page([GREENFIELD], 'CURSOR-1')];
    answers['GET /schools?limit=20&cursor=CURSOR-1'] = [page([ABA], null)];
    await open();
    await rtl.screen.findByText('Greenfield Tech Academy');
    await rtl.act(async () => {
      rtl.fireEvent(rtl.screen.getByTestId('schools-list'), 'endReached');
      rtl.fireEvent(rtl.screen.getByTestId('schools-list'), 'endReached');
    });
    expect(await rtl.screen.findByText('Aba Fashion Institute')).toBeTruthy();
    expect(rtl.screen.getByText('Greenfield Tech Academy')).toBeTruthy();
    expect(sent.filter((s) => s.includes('cursor='))).toEqual(['GET /schools?limit=20&cursor=CURSOR-1']);
    // The last page: reaching the end again asks for nothing.
    await rtl.act(async () => rtl.fireEvent(rtl.screen.getByTestId('schools-list'), 'endReached'));
    expect(sent).toHaveLength(2);
  });

  it('a page that fails keeps the schools read and offers to try again', async () => {
    answers[LIST] = [page([GREENFIELD], 'CURSOR-1')];
    answers['GET /schools?limit=20&cursor=CURSOR-1'] = [failed(500, 'Down'), failed(500, 'Down'), failed(500, 'Down'), page([ABA], null)];
    await open();
    await rtl.screen.findByText('Greenfield Tech Academy');
    await rtl.act(async () => rtl.fireEvent(rtl.screen.getByTestId('schools-list'), 'endReached'));
    expect(await rtl.screen.findByTestId('schools-more-error', {}, { timeout: 8000 })).toBeTruthy();
    expect(rtl.screen.getByText('Couldn’t load more schools.')).toBeTruthy();
    expect(rtl.screen.getByText('Greenfield Tech Academy')).toBeTruthy();
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('schools-more-retry')));
    expect(await rtl.screen.findByText('Aba Fashion Institute')).toBeTruthy();
  }, 15000);

  it('after a page fails, reaching the end again asks for nothing; only Try again asks, once', async () => {
    answers[LIST] = [page([GREENFIELD], 'CURSOR-1')];
    answers['GET /schools?limit=20&cursor=CURSOR-1'] = [failed(500, 'Down'), failed(500, 'Down'), failed(500, 'Down'), page([ABA], null)];
    await open();
    await rtl.screen.findByText('Greenfield Tech Academy');
    await rtl.act(async () => rtl.fireEvent(rtl.screen.getByTestId('schools-list'), 'endReached'));
    expect(await rtl.screen.findByTestId('schools-more-error', {}, { timeout: 8000 })).toBeTruthy();
    // The read and its two retries are in; nothing more is asked while the person only keeps reaching the end.
    const asked = sent.length;
    expect(sent.filter((s) => s.includes('cursor='))).toHaveLength(3);
    await rtl.act(async () => {
      rtl.fireEvent(rtl.screen.getByTestId('schools-list'), 'endReached');
      rtl.fireEvent(rtl.screen.getByTestId('schools-list'), 'endReached');
    });
    await settle(200);
    expect(sent).toHaveLength(asked);
    expect(rtl.screen.getByTestId('schools-more-error')).toBeTruthy();
    expect(rtl.screen.getByText('Greenfield Tech Academy')).toBeTruthy();
    // Try again is the one way to ask, and it asks once.
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('schools-more-retry')));
    expect(await rtl.screen.findByText('Aba Fashion Institute')).toBeTruthy();
    expect(sent).toHaveLength(asked + 1);
  }, 15000);

  it('a new search starts from the first page, not from the old cursor', async () => {
    answers[LIST] = [page([GREENFIELD], 'CURSOR-1')];
    answers['GET /schools?limit=20&q=aba'] = [page([ABA], null)];
    await open();
    await rtl.screen.findByText('Greenfield Tech Academy');
    await type('aba');
    expect(await rtl.screen.findByText('Aba Fashion Institute', {}, { timeout: 3000 })).toBeTruthy();
    expect(sent.some((s) => s.includes('cursor='))).toBe(false);
  });

  it('a pull asks for the first page again, and if that fails the rows stay with a line that says so', async () => {
    answers[LIST] = [page([GREENFIELD]), failed(500, 'Down'), failed(500, 'Down'), failed(500, 'Down'), page([GREENFIELD])];
    await open();
    await rtl.screen.findByText('Greenfield Tech Academy');
    const refresh = rtl.screen.getByTestId('schools-list').props.refreshControl;
    await rtl.act(async () => {
      await refresh.props.onRefresh();
    });
    expect(await rtl.screen.findByTestId('schools-refresh-failed', {}, { timeout: 8000 })).toBeTruthy();
    expect(rtl.screen.getByText('Greenfield Tech Academy')).toBeTruthy();
    expect(rtl.screen.queryByTestId('schools-error')).toBeNull();
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('schools-refresh-failed-retry')));
    await rtl.waitFor(() => expect(rtl.screen.queryByTestId('schools-refresh-failed')).toBeNull());
  }, 20000);

  it('a refresh that fails over an empty list draws no "Could not check for updates." line: the empty words stay', async () => {
    answers[LIST] = [page([]), failed(500, 'Down'), failed(500, 'Down'), failed(500, 'Down'), page([])];
    await open();
    expect(await rtl.screen.findByText('No schools yet')).toBeTruthy();
    const refresh = rtl.screen.getByTestId('schools-list').props.refreshControl;
    await rtl.act(async () => {
      await refresh.props.onRefresh();
    });
    // The refresh and its two retries all failed: three more asks of the plain list after the first read.
    await rtl.waitFor(() => expect(sent.filter((s) => s === LIST)).toHaveLength(4), { timeout: 8000 });
    await settle(100);
    expect(rtl.screen.queryByTestId('schools-refresh-failed')).toBeNull();
    expect(rtl.screen.queryByText('Could not check for updates.')).toBeNull();
    expect(rtl.screen.getByTestId('schools-empty')).toBeTruthy();
    expect(rtl.screen.getByText('No schools yet')).toBeTruthy();
    expect(rtl.screen.queryByTestId('schools-error')).toBeNull();
  }, 20000);
});
