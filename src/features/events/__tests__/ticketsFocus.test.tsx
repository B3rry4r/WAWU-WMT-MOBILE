/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

type Effect = () => void | (() => void);
let effects: Effect[] = [];

// The screen is shown, left and shown again: the test plays the navigator's focus events.
jest.mock('expo-router', () => {
  const actual = jest.requireActual('expo-router');
  const React = jest.requireActual('react');
  return {
    ...actual,
    useFocusEffect: (effect: Effect) => {
      React.useEffect(() => {
        effects.push(effect);
        const cleanup = effect();
        return () => {
          if (typeof cleanup === 'function') cleanup();
        };
      }, [effect]);
    },
  };
});

const ID = '00000000-0000-4000-8000-000000000001';
let asked = 0;
globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const path = new URL(request.url).pathname.replace(/^\/api\/hub/, '');
  const wrap = (data: unknown) =>
    new Response(JSON.stringify({ statusCode: 200, message: 'OK', data }), { status: 200, headers: { 'content-type': 'application/json' } });
  if (path === `/events/tickets/held/${ID}`) {
    asked += 1;
    const scanned = asked > 1;
    return wrap({
      id: ID, orderId: 'o', code: 'K7QX-4M2P-9WLA-3RTE', status: scanned ? 'checked_in' : 'valid',
      checkedInAt: scanned ? '2026-10-12T08:52:00Z' : null, tierName: 'Regular', holderName: 'Chidi Umeh',
      event: {
        id: 'e', name: 'Creators Summit', startsAt: '2026-10-12T09:00:00Z', endsAt: null, timezone: null, timeLabel: null,
        format: 'in_person', location: 'Lagos', venueName: null, bannerUrl: null, status: 'published', cancelledAt: null,
      },
      siblings: [{ id: ID, status: scanned ? 'checked_in' : 'valid', checkedInAt: null }],
    });
  }
  if (path === '/events/tickets/held') return wrap([]);
  throw new Error(`no answer for ${path}`);
}) as typeof fetch;

const shell = (child: React.ReactElement, client: QueryClient) => (
  <QueryClientProvider client={client}>
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      {child}
    </SafeAreaProvider>
  </QueryClientProvider>
);

it('a ticket scanned while the user was on another screen reads "Already checked in" when they come back, with no timer', async () => {
  const { TicketScreen } = require('../TicketScreen') as typeof import('../TicketScreen');
  const { useRefetchOnFocus } = require('../useRefetchOnFocus') as typeof import('../useRefetchOnFocus');
  const { heldTicketKey } = require('../ticketsApi') as typeof import('../ticketsApi');
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  const Route = () => {
    useRefetchOnFocus(heldTicketKey(ID));
    return <TicketScreen id={ID} onBack={jest.fn()} onOpenTicket={jest.fn()} />;
  };
  await rtl.render(shell(<Route />, client));
  expect(await rtl.screen.findByTestId('ticket-qr')).toBeTruthy();
  expect(rtl.screen.queryByText('Already checked in')).toBeNull();
  // The first showing is the screen's own load.
  expect(asked).toBe(1);

  const effect = effects[effects.length - 1];
  await rtl.act(async () => {
    effect()?.call(undefined);
    effect();
  });
  expect(await rtl.screen.findByText('Already checked in')).toBeTruthy();
  expect(asked).toBe(2);
  // Nothing asks again on its own: no timer is running it.
  await rtl.act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 50));
  });
  expect(asked).toBe(2);
  client.clear();
});
