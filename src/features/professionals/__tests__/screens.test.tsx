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

const ok = (data: unknown): Answer => ({ status: 200, body: { statusCode: 200, message: 'OK', data } });
const failed = (status: number, message: string): Answer => ({ status, body: { statusCode: status, message } });
/** A page as the Hub's response interceptor sends it: the items in `data`, the counts in `pagination`. */
const page = (items: unknown[], currentPage: number, total: number, perPage = 20): Answer => ({
  status: 200,
  body: { statusCode: 200, message: 'OK', data: items, pagination: { currentPage, nextPage: currentPage * perPage < total ? currentPage + 1 : null, perPage, total } },
});

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const key = `${request.method} ${url.pathname.replace(/^\/api\/hub/, '')}`;
  sent.push(`${key}${url.search}`);
  const queue = answers[`${key}${url.search}`] ?? answers[key];
  const answer = queue?.[0];
  if (queue && queue.length > 1) queue.shift();
  if (!answer) throw new Error(`no answer for ${key}${url.search}`);
  if (answer === 'hold') return new Promise<Response>(() => undefined);
  if (answer === 'offline') throw new TypeError('Network request failed');
  return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

// Loaded after `fetch` is replaced: the API client keeps the fetch it finds when it is created.
const { queryClient } = require('@/api/query') as typeof import('@/api/query');
const { DirectoryScreen } = require('../DirectoryScreen') as typeof import('../DirectoryScreen');
const { ProfileScreen } = require('../ProfileScreen') as typeof import('../ProfileScreen');

const fieldOf = (id: string, label: string, categories: string[]) => ({ id, label, categories, applyCategory: categories[0], regulated: false });
const FIELDS = [
  fieldOf('accounting_tax', 'Accounting & Tax', ['finance']),
  fieldOf('legal_compliance', 'Legal & Compliance', ['legal_services']),
  fieldOf('engineering', 'Engineering', ['engineering']),
];
const ticks = (professional: boolean) => ({ creator: { verified: false, expiresAt: null }, professional: { verified: professional, expiresAt: null } });

function entry(id: string, name: string, fieldId: string, fieldLabel: string, over: Record<string, unknown> = {}) {
  return {
    id,
    wawuId: `w-${id}`,
    name,
    handle: null,
    category: 'finance',
    headline: `${name} headline, 9 years`,
    services: [],
    verification: ticks(true),
    avatarUrl: null,
    pieceCount: 0,
    dmEnabled: true,
    dmResponseHours: 24,
    ratingAvg: null,
    reviewCount: 0,
    field: { id: fieldId, label: fieldLabel },
    city: null,
    usualReplyMinutes: null,
    answeredMessageCount: 0,
    messagePriceKobo: 500000,
    ...over,
  };
}

const FUNMI = entry('p1', 'Funmi Adeyemi', 'accounting_tax', 'Accounting & Tax');
const TUNDE = entry('p2', 'Tunde Bakare', 'legal_compliance', 'Legal & Compliance', { messagePriceKobo: 750000 });
const ALL_1 = 'GET /professionals/directory?page=1&perPage=20';
const ALL_2 = 'GET /professionals/directory?page=2&perPage=20';
const LEGAL_1 = 'GET /professionals/directory?page=1&perPage=20&field=legal_compliance';
const ENG_1 = 'GET /professionals/directory?page=1&perPage=20&field=engineering';

function wrap(children: ReactNode) {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, left: 0, right: 0, bottom: 34 } }}>{children}</SafeAreaProvider>
    </QueryClientProvider>
  );
}

/** The list reached its end, as a person's scroll makes it. */
async function scrollToEnd() {
  await rtl.act(async () => {
    rtl.fireEvent(rtl.screen.getByTestId('pros-list'), 'endReached');
  });
}

const settle = (ms = 50) =>
  rtl.act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });

beforeEach(() => {
  answers = { 'GET /professionals/fields': [ok(FIELDS)] };
  sent = [];
  queryClient.clear();
});

afterEach(async () => {
  await queryClient.cancelQueries();
  await settle(10);
  rtl.cleanup();
  queryClient.clear();
});

const directory = (props: Partial<import('../DirectoryScreen').DirectoryScreenProps> = {}) =>
  rtl.render(wrap(<DirectoryScreen onBack={jest.fn()} onOpen={jest.fn()} onOfferServices={jest.fn()} {...props} />));

describe('P1 · Professionals', () => {
  it('a user sees a loading view while the directory loads, and no empty or error words', async () => {
    answers[ALL_1] = ['hold'];
    await directory();
    expect(await rtl.screen.findByTestId('pros-loading')).toBeTruthy();
    expect(rtl.screen.queryByTestId('pros-empty')).toBeNull();
    expect(rtl.screen.queryByTestId('pros-error')).toBeNull();
  });

  it('a user reads each professional: name, headline, field and the Hub’s price of a message', async () => {
    answers[ALL_1] = [page([FUNMI, TUNDE], 1, 2)];
    await directory();
    const row = await rtl.screen.findByTestId('pros-row-p1');
    expect(rtl.within(row).getByText('Funmi Adeyemi')).toBeTruthy();
    expect(rtl.within(row).getByText('Funmi Adeyemi headline, 9 years')).toBeTruthy();
    expect(rtl.within(row).getByText('Accounting & Tax')).toBeTruthy();
    expect(rtl.within(row).getByText('a message')).toBeTruthy();
    expect(rtl.within(row).getByTestId('tick-pro')).toBeTruthy();
    expect(rtl.screen.getByTestId('pros-price-p1').props.accessibilityLabel).toBe('5,000 naira');
    expect(rtl.screen.getByTestId('pros-price-p2').props.accessibilityLabel).toBe('7,500 naira');
    expect(rtl.screen.getByText('Vetted practitioners.')).toBeTruthy();
    // The chips: All, then the Hub's fields.
    expect(rtl.screen.getByTestId('pros-chips-all').props.accessibilityState.checked).toBe(true);
    expect(rtl.screen.getByTestId('pros-chips-engineering')).toBeTruthy();
  });

  it('no price shows for someone not taking messages or with no price, and no tick for an unverified one', async () => {
    answers[ALL_1] = [page([entry('p3', 'Ngozi Umeh', 'accounting_tax', 'Accounting & Tax', { dmEnabled: false }), entry('p4', 'Emeka Obi', 'accounting_tax', 'Accounting & Tax', { messagePriceKobo: null, verification: ticks(false) })], 1, 2)];
    await directory();
    await rtl.screen.findByTestId('pros-row-p3');
    expect(rtl.screen.queryByTestId('pros-price-p3')).toBeNull();
    expect(rtl.screen.queryByTestId('pros-price-p4')).toBeNull();
    expect(rtl.screen.queryByText('a message')).toBeNull();
    expect(rtl.within(rtl.screen.getByTestId('pros-row-p4')).queryByTestId('tick-pro')).toBeNull();
  });

  it('a user can filter by field: the Hub is asked for that field and only its professionals show', async () => {
    const onChange = jest.fn();
    answers[ALL_1] = [page([FUNMI, TUNDE], 1, 2)];
    answers[LEGAL_1] = [page([TUNDE], 1, 1)];
    await directory({ onChange });
    await rtl.screen.findByTestId('pros-row-p1');
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('pros-chips-legal_compliance')));
    await rtl.screen.findByTestId('pros-row-p2');
    await rtl.waitFor(() => expect(rtl.screen.queryByTestId('pros-row-p1')).toBeNull());
    expect(sent).toContain(LEGAL_1);
    expect(onChange).toHaveBeenCalledWith('legal_compliance');
    expect(rtl.screen.getByTestId('pros-chips-legal_compliance').props.accessibilityState.checked).toBe(true);
  });

  it('a link with ?field= opens on that field', async () => {
    answers[LEGAL_1] = [page([TUNDE], 1, 1)];
    await directory({ initial: 'legal_compliance' });
    await rtl.screen.findByTestId('pros-row-p2');
    expect(sent).not.toContain(ALL_1);
  });

  it('a user can tap a professional to open their profile (P2)', async () => {
    const onOpen = jest.fn();
    answers[ALL_1] = [page([FUNMI], 1, 1)];
    await directory({ onOpen });
    await rtl.act(async () => rtl.fireEvent.press(await rtl.screen.findByTestId('pros-row-p1')));
    expect(onOpen).toHaveBeenCalledWith('p1');
  });

  it('P4: an empty field says nobody is listed in it, and Offer your services starts P5 in that field', async () => {
    const onOfferServices = jest.fn();
    answers[ALL_1] = [page([FUNMI], 1, 1)];
    answers[ENG_1] = [page([], 1, 0)];
    await directory({ onOfferServices });
    await rtl.screen.findByTestId('pros-row-p1');
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('pros-chips-engineering')));
    expect(await rtl.screen.findByText('Nobody listed in Engineering yet')).toBeTruthy();
    expect(rtl.screen.getByText('If you do this work, apply to be listed here.')).toBeTruthy();
    expect(rtl.screen.queryByText('Vetted practitioners.')).toBeNull();
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Offer your services' })));
    expect(onOfferServices).toHaveBeenCalledWith('engineering');
  });

  it('with nobody listed at all, the empty state says so and Offer your services starts P5 with no field', async () => {
    const onOfferServices = jest.fn();
    answers[ALL_1] = [page([], 1, 0)];
    await directory({ onOfferServices });
    expect(await rtl.screen.findByText('Nobody listed yet')).toBeTruthy();
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Offer your services' })));
    expect(onOfferServices).toHaveBeenCalledWith(undefined);
  });

  it('a failed first load shows the error with Try again, and Try again loads the list', async () => {
    answers[ALL_1] = [failed(400, 'The directory could not be read.'), page([FUNMI], 1, 1)];
    await directory();
    expect(await rtl.screen.findByTestId('pros-error')).toBeTruthy();
    expect(rtl.screen.getByText('The directory could not be read.')).toBeTruthy();
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Try again' })));
    expect(await rtl.screen.findByTestId('pros-row-p1')).toBeTruthy();
  });

  it('offline: a user is told there is no connection, with Try again', async () => {
    answers[ALL_1] = ['offline', 'offline', 'offline'];
    await directory();
    expect(await rtl.screen.findByText('No connection. Check your internet and try again.', {}, { timeout: 6000 })).toBeTruthy();
    expect(rtl.screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
  }, 10000);

  it('the fields failing shows the error, and Try again asks for the fields again', async () => {
    answers['GET /professionals/fields'] = [failed(403, 'Not allowed.'), ok(FIELDS)];
    answers[ALL_1] = [page([FUNMI], 1, 1)];
    await directory();
    expect(await rtl.screen.findByTestId('pros-error')).toBeTruthy();
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Try again' })));
    expect(await rtl.screen.findByTestId('pros-row-p1')).toBeTruthy();
  });

  it('a refresh that fails keeps the rows on screen with an inline Try again', async () => {
    answers[ALL_1] = [page([FUNMI], 1, 1), failed(403, 'Not allowed.'), page([FUNMI, TUNDE], 1, 2)];
    await directory();
    await rtl.screen.findByTestId('pros-row-p1');
    await rtl.act(async () => {
      await queryClient.refetchQueries({ queryKey: ['professionals'] });
    });
    expect(await rtl.screen.findByTestId('pros-refresh-failed')).toBeTruthy();
    expect(rtl.screen.getByTestId('pros-row-p1')).toBeTruthy();
    expect(rtl.screen.queryByTestId('pros-error')).toBeNull();
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('pros-refresh-failed-retry')));
    expect(await rtl.screen.findByTestId('pros-row-p2')).toBeTruthy();
    expect(rtl.screen.queryByTestId('pros-refresh-failed')).toBeNull();
  });

  it('paging: reaching the end asks for page 2 once, never page 1 again, and stops on the last page', async () => {
    const first = Array.from({ length: 20 }, (_, i) => entry(`a${i}`, `Person ${i}`, 'accounting_tax', 'Accounting & Tax'));
    answers[ALL_1] = [page(first, 1, 21)];
    answers[ALL_2] = [page([entry('b0', 'Last Person', 'accounting_tax', 'Accounting & Tax')], 2, 21)];
    await directory();
    await rtl.screen.findByTestId('pros-row-a0');
    await scrollToEnd();
    // The list draws rows as they scroll into view, so page 2's row is read from what the list holds.
    await rtl.waitFor(() => expect(sent).toContain(ALL_2));
    await settle();
    expect(rtl.screen.queryByTestId('pros-loading-more')).toBeNull();
    await scrollToEnd();
    await settle();
    expect(sent.filter((s) => s === ALL_1)).toHaveLength(1);
    expect(sent.filter((s) => s === ALL_2)).toHaveLength(1);
    expect(sent.some((s) => s.includes('page=3'))).toBe(false);
  });

  it('reaching the end again while page 2 is on its way, or after it failed, does not ask again', async () => {
    const first = Array.from({ length: 20 }, (_, i) => entry(`a${i}`, `Person ${i}`, 'accounting_tax', 'Accounting & Tax'));
    answers[ALL_1] = [page(first, 1, 21)];
    answers[ALL_2] = ['hold'];
    await directory();
    await rtl.screen.findByTestId('pros-row-a0');
    await scrollToEnd();
    await scrollToEnd();
    await settle();
    expect(sent.filter((s) => s === ALL_2)).toHaveLength(1);
    rtl.cleanup();
    queryClient.clear();
    sent = [];
    answers[ALL_1] = [page(first, 1, 21)];
    answers[ALL_2] = [failed(400, 'Bad page.')];
    await directory();
    await rtl.screen.findByTestId('pros-row-a0');
    await scrollToEnd();
    expect(await rtl.screen.findByTestId('pros-more-error')).toBeTruthy();
    await scrollToEnd();
    await settle();
    expect(sent.filter((s) => s === ALL_2)).toHaveLength(1);
  });

  it('a failed page 2 keeps page 1 and offers Try again under it, which asks for page 2', async () => {
    const first = Array.from({ length: 20 }, (_, i) => entry(`a${i}`, `Person ${i}`, 'accounting_tax', 'Accounting & Tax'));
    answers[ALL_1] = [page(first, 1, 21)];
    answers[ALL_2] = [failed(400, 'Bad page.'), page([entry('b0', 'Last Person', 'accounting_tax', 'Accounting & Tax')], 2, 21)];
    await directory();
    await rtl.screen.findByTestId('pros-row-a0');
    await scrollToEnd();
    expect(await rtl.screen.findByTestId('pros-more-error')).toBeTruthy();
    expect(rtl.screen.getByTestId('pros-row-a0')).toBeTruthy();
    expect(rtl.screen.queryByTestId('pros-refresh-failed')).toBeNull();
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('pros-more-retry')));
    await rtl.waitFor(() => expect(sent.filter((s) => s === ALL_2)).toHaveLength(2));
    await rtl.waitFor(() => expect(rtl.screen.queryByTestId('pros-more-error')).toBeNull());
    expect(sent.filter((s) => s === ALL_1)).toHaveLength(1);
  });

  it('a user can go back with the on-screen back', async () => {
    const onBack = jest.fn();
    answers[ALL_1] = [page([FUNMI], 1, 1)];
    await directory({ onBack });
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('pros-back')));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

const PROFILE = {
  ...FUNMI,
  services: ['Tax filing', 'CAC annual returns', 'Bookkeeping', 'Payroll'],
  about: 'I help creators and small businesses file taxes, keep books and register with CAC.',
  issuingBody: 'ICAN',
  credentialKind: 'licence',
};
const PROFILE_PATH = 'GET /professionals/directory/p1';
const profile = (onBack = jest.fn()) => rtl.render(wrap(<ProfileScreen id="p1" onBack={onBack} />));

describe('P2 · Profile and P3 · Not taking messages', () => {
  it('a user can read the profile, what they take on and their credentials (P2)', async () => {
    answers[PROFILE_PATH] = [ok(PROFILE)];
    await profile();
    expect(await rtl.screen.findByText('Funmi Adeyemi')).toBeTruthy();
    expect(rtl.screen.getByText('Funmi Adeyemi headline, 9 years')).toBeTruthy();
    expect(rtl.screen.getByText('Accounting & Tax')).toBeTruthy();
    expect(rtl.screen.getByText('I help creators and small businesses file taxes, keep books and register with CAC.')).toBeTruthy();
    for (const s of PROFILE.services) expect(rtl.within(rtl.screen.getByTestId('pro-services')).getByText(s)).toBeTruthy();
    expect(rtl.screen.getByText('Practising licence')).toBeTruthy();
    expect(rtl.screen.getByText('Issued by ICAN · checked by WAWU')).toBeTruthy();
    expect(rtl.screen.getByTestId('tick-pro')).toBeTruthy();
    // Taking messages: not P3. The Ask button is INBOX-10's.
    expect(rtl.screen.queryByTestId('pro-closed')).toBeNull();
    expect(rtl.screen.queryByText(/Ask a question/)).toBeNull();
  });

  it('P3: a professional not taking messages shows the closed state and its line, with nothing to press', async () => {
    answers[PROFILE_PATH] = [ok({ ...PROFILE, dmEnabled: false })];
    await profile();
    const closed = await rtl.screen.findByTestId('pro-closed');
    expect(rtl.within(closed).getByText('Not taking messages')).toBeTruthy();
    expect(rtl.within(closed).getByText('Check back later, or find someone else in this field.')).toBeTruthy();
    expect(rtl.within(closed).queryByRole('button')).toBeNull();
  });

  it('no services and no issuer: the section is left out and the credential line says only that it was checked', async () => {
    answers[PROFILE_PATH] = [ok({ ...PROFILE, services: [], issuingBody: null, credentialKind: 'portfolio' })];
    await profile();
    await rtl.screen.findByText('Funmi Adeyemi');
    expect(rtl.screen.queryByTestId('pro-services')).toBeNull();
    expect(rtl.screen.getByText('Work samples')).toBeTruthy();
    expect(rtl.screen.getByText('Checked by WAWU')).toBeTruthy();
  });

  it('a listing that is gone (not listed, or blocked) says so, and offers the way back', async () => {
    const onBack = jest.fn();
    answers[PROFILE_PATH] = [failed(404, 'Professional not found')];
    await profile(onBack);
    expect(await rtl.screen.findByText('This listing isn’t available')).toBeTruthy();
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Back to professionals' })));
    expect(onBack).toHaveBeenCalled();
  });

  it('a user sees a loading view while the profile loads', async () => {
    answers[PROFILE_PATH] = ['hold'];
    await profile();
    expect(await rtl.screen.findByTestId('pro-loading')).toBeTruthy();
  });

  it('a failed load shows the error with Try again, which loads the profile', async () => {
    answers[PROFILE_PATH] = [failed(403, 'Not allowed.'), ok(PROFILE)];
    await profile();
    expect(await rtl.screen.findByTestId('pro-error')).toBeTruthy();
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByRole('button', { name: 'Try again' })));
    expect(await rtl.screen.findByText('Funmi Adeyemi')).toBeTruthy();
  });

  it('a refresh that fails keeps the profile on screen with an inline Try again', async () => {
    answers[PROFILE_PATH] = [ok(PROFILE), failed(403, 'Not allowed.'), ok({ ...PROFILE, dmEnabled: false })];
    await profile();
    await rtl.screen.findByText('Funmi Adeyemi');
    await rtl.act(async () => {
      await queryClient.refetchQueries({ queryKey: ['professionals'] });
    });
    expect(await rtl.screen.findByTestId('pro-refresh-failed')).toBeTruthy();
    expect(rtl.screen.getByText('Funmi Adeyemi')).toBeTruthy();
    await rtl.act(async () => rtl.fireEvent.press(rtl.screen.getByTestId('pro-refresh-failed-retry')));
    expect(await rtl.screen.findByTestId('pro-closed')).toBeTruthy();
  });
});
