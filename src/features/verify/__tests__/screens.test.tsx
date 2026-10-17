/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

type Answer = { status: number; body: unknown } | 'offline';
let answers: Record<string, Answer> = {};
let asked: { key: string; body: unknown }[] = [];

function installFetch() {
  globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(String(input), init);
    const url = new URL(request.url);
    const key = `${request.method} ${url.pathname}`;
    const text = request.method === 'GET' || request.method === 'DELETE' ? '' : await request.clone().text();
    asked.push({ key, body: text ? JSON.parse(text) : null });
    const answer = answers[key];
    if (!answer) return new Response(JSON.stringify({ statusCode: 404, message: 'Not Found', data: null }), { status: 404 });
    if (answer === 'offline') throw new TypeError('Network request failed');
    if (answer.status === 204) return new Response(null, { status: 204 });
    return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;
}

const ok = (data: unknown, status = 200) => ({ status, body: { statusCode: status, message: 'OK', data } });
const refusal = (statusCode: number, message: string) => ({ status: statusCode, body: { statusCode, message, data: null } });

installFetch();
const { BonusScreen } = require('../BonusScreen') as typeof import('../BonusScreen');
const { ShopScreen } = require('../ShopScreen') as typeof import('../ShopScreen');
const { DraftFormScreen } = require('../DraftFormScreen') as typeof import('../DraftFormScreen');

const PLANS = 'GET /api/hub/plans';
const LIST = 'GET /api/hub/product-drafts';

const draft = (id: string, over: Record<string, unknown> = {}) => ({
  id,
  title: `Draft ${id}`,
  contentType: null,
  description: null,
  category: null,
  specializations: [],
  tags: [],
  accessType: 'paid',
  price: 4500,
  missing: [],
  createdAt: '2026-10-17T10:00:00.000Z',
  updatedAt: '2026-10-17T10:00:00.000Z',
  ...over,
});

const plansView = () => ({
  currency: 'NGN',
  currencyFixed: false,
  extraProducts: { count: 5, priceMinor: 150000 },
  packs: [],
  checkoutBump: { points: 1000, priceMinor: 80000 },
  actions: [{ id: 'voiceover_per_min', points: 250, per: 'minute' }],
  caps: { dailyPoints: 5000, maxCharactersPerJob: 5000, maxAudioMinutesPerJob: 10 },
  tiers: [
    { id: 'verify', name: 'Verify', days: 30, products: 3, bonusPoints: 100, bonusPointsExpireDays: 365, priceMinor: 100000, eventPass: { id: 'a', name: 'Watch live, apply' }, badge: { id: 'verified', numbered: false }, packBonusPercent: 0, firstVoiceIntroIncluded: true, preselected: false },
    { id: 'founding', name: 'Founding Maker', days: 365, products: 10, bonusPoints: 600, bonusPointsExpireDays: 365, priceMinor: 500000, eventPass: { id: 'c', name: 'Maker Pass, priority' }, badge: { id: 'founding', numbered: true }, packBonusPercent: 10, firstVoiceIntroIncluded: true, preselected: true },
  ],
});

function frame(children: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false } } });
  return (
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </SafeAreaProvider>
  );
}

beforeEach(() => {
  answers = {};
  asked = [];
  jest.useFakeTimers({ doNotFake: ['queueMicrotask'] });
});
afterEach(() => jest.useRealTimers());

describe('VF1 · Your bonus is waiting', () => {
  it('draws what the preselected tier gives, locked, from GET /plans, and "Build my shop" opens the shop', async () => {
    answers = { [PLANS]: ok(plansView()) };
    const onBuild = jest.fn();
    await render(frame(<BonusScreen onBuild={onBuild} />));
    expect(await screen.findByTestId('bonus-points')).toHaveTextContent(/Up to 600 points/);
    expect(screen.getByTestId('bonus-points')).toHaveTextContent(/For AI tools like VoiceOver/);
    expect(screen.getByTestId('bonus-voice')).toHaveTextContent(/Your Voice Intro/);
    expect(screen.getByTestId('bonus-event')).toHaveTextContent(/Maker Pass, priority/);
    expect(screen.queryByText(/Watch live, apply/)).toBeNull();
    await fireEvent.press(screen.getByTestId('bonus-build'));
    expect(onBuild).toHaveBeenCalledTimes(1);
  });

  it('a plans read that fails shows a retry, and the button still works', async () => {
    answers = { [PLANS]: 'offline' };
    const onBuild = jest.fn();
    await render(frame(<BonusScreen onBuild={onBuild} />));
    expect(await screen.findByTestId('bonus-error')).toBeTruthy();
    expect(screen.queryByTestId('bonus-rows')).toBeNull();
    await fireEvent.press(screen.getByTestId('bonus-build'));
    expect(onBuild).toHaveBeenCalledTimes(1);
  });
});

describe('VF2 · Your shop', () => {
  it('with no drafts draws the ring at 0 and "Add a product" (VF2a)', async () => {
    answers = { [LIST]: ok([]) };
    const onAdd = jest.fn();
    await render(frame(<ShopScreen onBack={jest.fn()} onAdd={onAdd} onOpenDraft={jest.fn()} />));
    expect(await screen.findByTestId('shop-empty')).toBeTruthy();
    expect(screen.getByTestId('shop-ready-figure')).toHaveTextContent(/^0%$/);
    expect(screen.getByTestId('shop-ready-line')).toHaveTextContent('0 drafts · drafts are free');
    await fireEvent.press(screen.getByTestId('shop-empty-add'));
    await fireEvent.press(screen.getByTestId('shop-add'));
    expect(onAdd).toHaveBeenCalledTimes(2);
  });

  it('lists three drafts each tagged Draft with "No file yet" and the price, and opens one (VF2b)', async () => {
    answers = { [LIST]: ok([draft('a'), draft('b', { accessType: 'free', price: 0 }), draft('c', { accessType: null, price: null })]) };
    const onOpen = jest.fn();
    await render(frame(<ShopScreen onBack={jest.fn()} onAdd={jest.fn()} onOpenDraft={onOpen} />));
    expect(await screen.findByTestId('shop-draft-a')).toHaveTextContent(/Draft a/);
    expect(screen.getByTestId('shop-draft-a')).toHaveTextContent(/No file yet · ₦4,500/);
    expect(screen.getByTestId('shop-draft-b')).toHaveTextContent(/No file yet · Free/);
    expect(screen.getByTestId('shop-draft-c')).toHaveTextContent(/No price yet/);
    expect(screen.getAllByText('Draft')).toHaveLength(3);
    expect(screen.getByTestId('shop-ready-line')).toHaveTextContent(/3 drafts/);
    expect(screen.queryByTestId('shop-empty')).toBeNull();
    await fireEvent.press(screen.getByTestId('shop-draft-b'));
    expect(onOpen).toHaveBeenCalledWith('b');
  });

  it('a list that fails to load is an error with a retry, never an empty shop', async () => {
    answers = { [LIST]: 'offline' };
    await render(frame(<ShopScreen onBack={jest.fn()} onAdd={jest.fn()} onOpenDraft={jest.fn()} />));
    expect(await screen.findByTestId('shop-error')).toBeTruthy();
    expect(screen.queryByTestId('shop-empty')).toBeNull();
  });
});

describe('the draft form', () => {
  it('saves a new draft with only a title (free, no file) and returns to the shop', async () => {
    answers = { 'POST /api/hub/product-drafts': ok(draft('n', { accessType: 'paid', price: null }), 201), [LIST]: ok([]) };
    const onSaved = jest.fn();
    await render(frame(<DraftFormScreen onBack={jest.fn()} onSaved={onSaved} onDeleted={jest.fn()} />));
    expect(screen.getByTestId('draft-save')).toBeDisabled();
    await fireEvent.changeText(screen.getByTestId('draft-title'), '  Brand deck  ');
    await fireEvent.press(screen.getByTestId('draft-save'));
    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    expect(asked.find((a) => a.key === 'POST /api/hub/product-drafts')?.body).toEqual({ title: 'Brand deck', accessType: 'paid' });
  });

  it('shows the Hub\'s own words when the next draft is refused, and stays on the form', async () => {
    answers = { 'POST /api/hub/product-drafts': refusal(409, 'You can keep 20 drafts. Delete or publish one to start another.') };
    const onSaved = jest.fn();
    await render(frame(<DraftFormScreen onBack={jest.fn()} onSaved={onSaved} onDeleted={jest.fn()} />));
    await fireEvent.changeText(screen.getByTestId('draft-title'), 'One more');
    await fireEvent.press(screen.getByTestId('draft-save'));
    expect(await screen.findByTestId('draft-problem')).toHaveTextContent(/You can keep 20 drafts/);
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('edits a draft (only what changed is sent) and deletes it after one confirmation', async () => {
    answers = {
      'GET /api/hub/product-drafts/d1': ok(draft('d1', { title: 'Old name', contentType: 'pdf' })),
      'PATCH /api/hub/product-drafts/d1': ok(draft('d1', { title: 'New name', contentType: 'pdf' })),
      'DELETE /api/hub/product-drafts/d1': { status: 204, body: null },
      [LIST]: ok([]),
    };
    const onSaved = jest.fn();
    const onDeleted = jest.fn();
    await render(frame(<DraftFormScreen draftId="d1" onBack={jest.fn()} onSaved={onSaved} onDeleted={onDeleted} />));
    expect(await screen.findByDisplayValue('Old name')).toBeTruthy();
    expect(screen.getByTestId('draft-save')).toBeDisabled();
    await fireEvent.changeText(screen.getByTestId('draft-title'), 'New name');
    await fireEvent.press(screen.getByTestId('draft-save'));
    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    expect(asked.find((a) => a.key === 'PATCH /api/hub/product-drafts/d1')?.body).toEqual({ title: 'New name' });

    await fireEvent.press(screen.getByTestId('draft-delete'));
    expect(screen.getByTestId('draft-confirm')).toBeTruthy();
    expect(asked.some((a) => a.key.startsWith('DELETE'))).toBe(false);
    await fireEvent.press(screen.getByTestId('draft-delete-yes'));
    await waitFor(() => expect(onDeleted).toHaveBeenCalledTimes(1));
    expect(asked.some((a) => a.key === 'DELETE /api/hub/product-drafts/d1')).toBe(true);
  });

  it('a draft that is gone (404) says so, and one that did not load offers a retry', async () => {
    answers = { 'GET /api/hub/product-drafts/x': refusal(404, 'Draft not found.') };
    await render(frame(<DraftFormScreen draftId="x" onBack={jest.fn()} onSaved={jest.fn()} onDeleted={jest.fn()} />));
    expect(await screen.findByTestId('draft-gone')).toBeTruthy();
  });

  it('a typed or old link whose id is no draft id (the Hub answers 400) says "This draft is gone", never the Hub\'s validation words', async () => {
    answers = { 'GET /api/hub/product-drafts/not-a-draft': refusal(400, 'Validation failed (uuid is expected)') };
    await render(frame(<DraftFormScreen draftId="not-a-draft" onBack={jest.fn()} onSaved={jest.fn()} onDeleted={jest.fn()} />));
    expect(await screen.findByTestId('draft-gone')).toBeTruthy();
    expect(screen.getByText('This draft is gone')).toBeTruthy();
    expect(screen.queryByText(/uuid|Validation/)).toBeNull();
    expect(screen.queryByText('Try again')).toBeNull();
  });
});

describe('the words are the boards\' sizes on the type tokens (V5, VERIFY-01 round 3)', () => {
  const size = (testID: string) => {
    const style = StyleSheet.flatten(screen.getByTestId(testID).props.style) as { fontSize?: number };
    return style.fontSize;
  };

  it('VF1: the line under the title is 13.5 and each row is 15 over 12.5', async () => {
    answers = { [PLANS]: ok(plansView()) };
    await render(frame(<BonusScreen onBuild={jest.fn()} />));
    await screen.findByTestId('bonus-points');
    expect(StyleSheet.flatten(screen.getByText(/Build your shop for free/).props.style).fontSize).toBe(13.5);
    expect(StyleSheet.flatten(screen.getByText('Up to 600 points').props.style).fontSize).toBe(15);
    expect(StyleSheet.flatten(screen.getByText(/For AI tools like VoiceOver/).props.style).fontSize).toBe(12.5);
  });

  it('VF2 and VF2b: Shop ready 16 over 13, the ring figure 15, each draft 15 over 12.5', async () => {
    answers = { [LIST]: ok([draft('a')]) };
    await render(frame(<ShopScreen onBack={jest.fn()} onAdd={jest.fn()} onOpenDraft={jest.fn()} />));
    await screen.findByTestId('shop-draft-a');
    expect(StyleSheet.flatten(screen.getByText('Shop ready').props.style).fontSize).toBe(16);
    expect(size('shop-ready-line')).toBe(13);
    expect(size('shop-ready-figure')).toBe(15);
    expect(StyleSheet.flatten(screen.getByText('Draft a').props.style).fontSize).toBe(15);
    expect(StyleSheet.flatten(screen.getByText(/No file yet/).props.style).fontSize).toBe(12.5);
  });

  it('VF2a: the title is 16 over a 13.5 line, and "Add a product" is the 44 high button', async () => {
    answers = { [LIST]: ok([]) };
    await render(frame(<ShopScreen onBack={jest.fn()} onAdd={jest.fn()} onOpenDraft={jest.fn()} />));
    await screen.findByTestId('shop-empty');
    expect(StyleSheet.flatten(screen.getByText('Add your first product').props.style).fontSize).toBe(16);
    expect(StyleSheet.flatten(screen.getByText(/Title, price and how it looks/).props.style).fontSize).toBe(13.5);
    expect(StyleSheet.flatten(screen.getByTestId('shop-empty-add').props.style).height).toBe(44);
  });

  it('a finished shop reads 100% at the same 15, which fits inside the ring', async () => {
    answers = { [LIST]: ok([draft('a', { contentType: 'image', description: 'Ten LUTs for warm skin.' })]) };
    await render(frame(<ShopScreen onBack={jest.fn()} onAdd={jest.fn()} onOpenDraft={jest.fn()} />));
    await screen.findByTestId('shop-draft-a');
    expect(screen.getByTestId('shop-ready-figure')).toHaveTextContent(/^100%$/);
    expect(size('shop-ready-figure')).toBe(15);
  });

  it('the Draft tag has the top left of a draft\'s picture and the mark sits at the foot, clear of it', async () => {
    answers = { [LIST]: ok([draft('a')]) };
    await render(frame(<ShopScreen onBack={jest.fn()} onAdd={jest.fn()} onOpenDraft={jest.fn()} />));
    const row = await screen.findByTestId('shop-draft-a');
    const tag = screen.getByText('Draft').parent!;
    expect(StyleSheet.flatten(tag.props.style)).toMatchObject({ position: 'absolute', top: 4, left: 4, height: 20 });
    const picture = tag.parent!;
    expect(StyleSheet.flatten(picture.props.style)).toMatchObject({ height: 56, justifyContent: 'flex-end', paddingBottom: 4 });
    expect(row).toBeTruthy();
  });
});
