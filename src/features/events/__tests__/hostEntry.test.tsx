/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

globalThis.fetch = jest.fn(async (input: RequestInfo | URL) => {
  const path = new URL(input instanceof Request ? input.url : String(input)).pathname;
  const data = path.endsWith('/events/options') ? { categories: [], formats: [], types: [] } : path.endsWith('/events/count') ? { count: 0 } : [];
  return new Response(JSON.stringify({ statusCode: 200, message: 'OK', data, pagination: { currentPage: 1, nextPage: null, perPage: 20, total: 0 } }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}) as typeof fetch;

async function boot(onHost?: () => void) {
  const { EventsScreen } = require('../EventsScreen') as typeof import('../EventsScreen');
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  await rtl.render(
    <QueryClientProvider client={client}>
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
        <EventsScreen onBack={jest.fn()} onOpenEvent={jest.fn()} onHost={onHost} />
      </SafeAreaProvider>
    </QueryClientProvider>,
  );
  return client;
}

describe('E1 to E13 · the way into hosting', () => {
  it('opens the host wizard from the Host event tab', async () => {
    const onHost = jest.fn();
    const client = await boot(onHost);
    await rtl.fireEvent.press(await rtl.screen.findByTestId('events-tab-host'));
    expect(onHost).toHaveBeenCalledTimes(1);
    client.clear();
  });

  it('opens it from the Host your event banner', async () => {
    const onHost = jest.fn();
    const client = await boot(onHost);
    expect(await rtl.screen.findByText('Host your event')).toBeTruthy();
    await rtl.fireEvent.press(rtl.screen.getByTestId('events-host-start'));
    expect(onHost).toHaveBeenCalledTimes(1);
    client.clear();
  });

  it('draws no banner when the screen is given nowhere to send it', async () => {
    const client = await boot(undefined);
    await rtl.screen.findByTestId('events-screen');
    expect(rtl.screen.queryByTestId('events-host-banner')).toBeNull();
    client.clear();
  });
});
