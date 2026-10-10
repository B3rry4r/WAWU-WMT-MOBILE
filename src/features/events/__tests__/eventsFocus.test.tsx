import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { EventView } from '../api';

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

let ticketCalls = 0;
globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const path = new URL(request.url).pathname.replace(/^\/api\/hub/, '');
  const wrap = (data: unknown) =>
    new Response(JSON.stringify({ statusCode: 200, message: 'OK', data }), { status: 200, headers: { 'content-type': 'application/json' } });
  if (path === '/events/e-1/tickets') {
    ticketCalls += 1;
    return wrap([
      {
        id: 't-1', tier: 'regular', name: 'Regular', priceNaira: 7500, quantity: 100, sold: 10,
        remaining: ticketCalls === 1 ? 90 : 12, soldOut: false, salesStartAt: null, salesEndAt: null,
      },
    ]);
  }
  if (path === '/events/e-1')
    return wrap({
      id: 'e-1', hostWawuId: 'h', hostVerification: { creator: { verified: false, expiresAt: null }, professional: { verified: false, expiresAt: null } },
      name: 'Creators Summit', description: 'x', hostOrg: 'Hosts', hostOrgBio: null, format: 'in_person', type: 'summit',
      startsAt: new Date(Date.now() + 86400000).toISOString(), endsAt: null, timeLabel: null, timezone: null, location: 'Lagos',
      address: null, venueName: null, externalUrl: null, bannerUrl: null, category: 'conference', contactEmail: null, contactPhone: null,
      cancelledAt: null, cancelReason: null, hasRecap: false, recapUrl: null, recapText: null, featured: false, status: 'published',
      goingCount: 0, userGoing: false, userSaved: false, ticketed: true, priceFromNaira: 7500, speakers: [], createdAt: new Date().toISOString(),
      lastDecisionReason: null,
    } satisfies EventView);
  throw new Error(`no answer for ${path}`);
}) as typeof fetch;

it('asks for the tiers again when the screen is shown again, and not on the first showing', async () => {
  const { EventDetailScreen } = require('../EventDetailScreen') as typeof import('../EventDetailScreen');
  const { useRefetchTiersOnFocus } = require('../useRefetchTiersOnFocus') as typeof import('../useRefetchTiersOnFocus');
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  const Route = () => {
    useRefetchTiersOnFocus('e-1');
    return <EventDetailScreen id="e-1" onBack={jest.fn()} />;
  };
  const tree = (
    <QueryClientProvider client={client}>
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
        <Route />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
  const view = await rtl.render(tree);
  expect(await rtl.screen.findByText('90 left')).toBeTruthy();
  expect(ticketCalls).toBe(1);

  // The focus effect's cleanup is the screen being left; running the effect again is it coming back.
  const effect = effects[effects.length - 1];
  await rtl.act(async () => {
    effect()?.call(undefined);
    effect();
  });
  expect(await rtl.screen.findByText('12 left')).toBeTruthy();
  expect(ticketCalls).toBe(2);
  view.unmount();
  client.clear();
});
