import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// The API client captures `fetch` when it loads, so the screens are required after the stand-in is in place.
/* eslint-disable @typescript-eslint/no-require-imports */

const ID = '00000000-0000-4000-8000-000000000001';
const event = {
  id: 'e', name: 'Creators Summit', startsAt: '2026-10-12T09:00:00Z', endsAt: null, timezone: null, timeLabel: null,
  format: 'in_person', location: 'Lagos', venueName: null, bannerUrl: null, status: 'published', cancelledAt: null,
};
let failing = false;
globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const path = new URL(request.url).pathname.replace(/^\/api\/hub/, '');
  if (failing) {
    return new Response(JSON.stringify({ statusCode: 500, message: 'Boom from server' }), { status: 500, headers: { 'content-type': 'application/json' } });
  }
  const wrap = (data: unknown) =>
    new Response(JSON.stringify({ statusCode: 200, message: 'OK', data }), { status: 200, headers: { 'content-type': 'application/json' } });
  if (path === `/events/tickets/held/${ID}`) {
    return wrap({
      id: ID, orderId: 'o', code: 'K7QX-4M2P-9WLA-3RTE', status: 'valid', checkedInAt: null, tierName: 'Regular', holderName: 'Chidi Umeh',
      event, siblings: [{ id: ID, status: 'valid', checkedInAt: null }],
    });
  }
  if (path === '/events/tickets/held') {
    return new Response(
      JSON.stringify({
        statusCode: 200, message: 'OK',
        data: [{ orderId: 'o', ticketTypeId: 't', tierName: 'Regular', quantity: 1, event, tickets: [{ id: ID, status: 'valid', checkedInAt: null }] }],
        pagination: { currentPage: 1, nextPage: null, perPage: 20, total: 1 },
      }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
  }
  throw new Error(`no answer for ${path}`);
}) as typeof fetch;

const screens = () => ({
  ...(require('../MyTicketsScreen') as typeof import('../MyTicketsScreen')),
  ...(require('../TicketScreen') as typeof import('../TicketScreen')),
  ...(require('../ticketsApi') as typeof import('../ticketsApi')),
});

const shell = (child: React.ReactElement, client: QueryClient) => (
  <QueryClientProvider client={client}>
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      {child}
    </SafeAreaProvider>
  </QueryClientProvider>
);
const newClient = () => new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });

beforeEach(() => {
  failing = false;
});

it('a user whose ticket list is on screen keeps the rows when a refetch fails, and can retry', async () => {
  const { MyTicketsScreen, TicketScreen, heldKey, heldTicketKey } = screens();
  const client = newClient();
  await rtl.render(shell(<MyTicketsScreen onBack={jest.fn()} onOpenTicket={jest.fn()} />, client));
  expect(await rtl.screen.findByText('Creators Summit')).toBeTruthy();
  failing = true;
  await rtl.act(async () => {
    await client.refetchQueries({ queryKey: heldKey('upcoming') });
  });
  expect(await rtl.screen.findByTestId('my-tickets-refresh-failed')).toBeTruthy();
  expect(rtl.screen.getByText('Creators Summit')).toBeTruthy();
  expect(rtl.screen.queryByTestId('my-tickets-error')).toBeNull();
  failing = false;
  await rtl.act(async () => {
    rtl.fireEvent.press(rtl.screen.getByText('Try again'));
  });
  await rtl.waitFor(() => expect(rtl.screen.queryByTestId('my-tickets-refresh-failed')).toBeNull());
  expect(rtl.screen.getByText('Creators Summit')).toBeTruthy();
});

it('a user whose ticket is on screen keeps the ticket and its QR when a refetch fails', async () => {
  const { MyTicketsScreen, TicketScreen, heldKey, heldTicketKey } = screens();
  const client = newClient();
  await rtl.render(shell(<TicketScreen id={ID} onBack={jest.fn()} onOpenTicket={jest.fn()} />, client));
  expect(await rtl.screen.findByTestId('ticket-qr')).toBeTruthy();
  failing = true;
  await rtl.act(async () => {
    await client.refetchQueries({ queryKey: heldTicketKey(ID) });
  });
  expect(await rtl.screen.findByTestId('ticket-refresh-failed')).toBeTruthy();
  expect(rtl.screen.getByTestId('ticket-qr')).toBeTruthy();
  expect(rtl.screen.getByText('K7QX-4M2P-9WLA-3RTE')).toBeTruthy();
  expect(rtl.screen.queryByTestId('ticket-error')).toBeNull();
});

it('a user whose first load fails sees the error screen on both screens', async () => {
  const { MyTicketsScreen, TicketScreen } = screens();
  failing = true;
  await rtl.render(shell(<MyTicketsScreen onBack={jest.fn()} onOpenTicket={jest.fn()} />, newClient()));
  expect(await rtl.screen.findByTestId('my-tickets-error')).toBeTruthy();
  await rtl.screen.unmount();
  await rtl.render(shell(<TicketScreen id={ID} onBack={jest.fn()} onOpenTicket={jest.fn()} />, newClient()));
  expect(await rtl.screen.findByTestId('ticket-error')).toBeTruthy();
});
