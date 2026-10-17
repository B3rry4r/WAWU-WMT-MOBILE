/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

let drafts: unknown[] = [];
globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const path = new URL(request.url).pathname;
  if (request.method === 'GET' && path === '/api/hub/product-drafts') {
    return new Response(JSON.stringify({ statusCode: 200, message: 'OK', data: drafts }), { status: 200, headers: { 'content-type': 'application/json' } });
  }
  return new Response(JSON.stringify({ statusCode: 404, message: 'Not Found', data: null }), { status: 404 });
}) as typeof fetch;

const { ContentGrid } = require('@/features/me/ContentGrid') as typeof import('@/features/me/ContentGrid');
const { CreateScreen } = require('@/features/create/CreateScreen') as typeof import('@/features/create/CreateScreen');

const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };
const frame = (children: React.ReactNode) => (
  <SafeAreaProvider initialMetrics={metrics}>
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false } } })}>{children}</QueryClientProvider>
  </SafeAreaProvider>
);

const tile = (id: string, draft: boolean) => ({ id, title: id, still: null, kind: 'pdf' as const, locked: false, caption: id, spoken: draft ? `${id}, draft` : id, draft });

beforeEach(() => jest.useFakeTimers({ doNotFake: ['queueMicrotask'] }));
afterEach(() => jest.useRealTimers());

describe('the entries VERIFY-01 adds', () => {
  it('M1: a draft tile opens Your shop, a published piece is not pressed', async () => {
    const onOpenDraft = jest.fn();
    await render(frame(<ContentGrid tiles={[tile('d1', true), tile('p1', false)]} onOpenDraft={onOpenDraft} />));
    await fireEvent.press(screen.getByTestId('me-tile-d1'));
    expect(onOpenDraft).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('me-tile-p1').props.onPress).toBeUndefined();
  });

  it('M1: without the entry a draft tile is drawn as before and is not pressable', async () => {
    await render(frame(<ContentGrid tiles={[tile('d1', true)]} />));
    expect(screen.getByTestId('me-tile-d1').props.onPress).toBeUndefined();
  });

  it('M19: the draft row says how many drafts the Hub holds and opens Your shop', async () => {
    drafts = [{ id: 'a' }, { id: 'b' }];
    const onShop = jest.fn();
    await render(frame(<CreateScreen onClose={jest.fn()} onContent={jest.fn()} onEvent={jest.fn()} onService={jest.fn()} onShop={onShop} />));
    expect(await screen.findByText(/2 drafts · drafts are free/)).toBeTruthy();
    await fireEvent.press(screen.getByTestId('create-shop-row'));
    expect(onShop).toHaveBeenCalledTimes(1);
  });

  it('M19: without the entry there is no draft row', async () => {
    await render(frame(<CreateScreen onClose={jest.fn()} onContent={jest.fn()} onEvent={jest.fn()} onService={jest.fn()} />));
    expect(screen.queryByTestId('create-shop-row')).toBeNull();
  });
});
