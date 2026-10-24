/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, waitFor } from '@testing-library/react-native';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

let paths: string[] = [];
let status = 200;
globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  paths.push(`${request.method} ${new URL(request.url).pathname}`);
  const body = { statusCode: status, message: 'OK', data: { countryCode: 'GH', countryName: 'Ghana', countrySource: 'wawu_id', regionCode: null, regionName: null, city: null, wawuIdCountryCode: 'GH', phoneCountryCode: 'GH' } };
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

const { PlaceBridge } = require('../PlaceBridge') as typeof import('../PlaceBridge');
const { myPlaceKey } = require('../useGeo') as typeof import('../useGeo');

async function mount(live: boolean, client = new QueryClient({ defaultOptions: { queries: { retry: false } } })) {
  const tree = (on: boolean) => (
    <QueryClientProvider client={client}>
      <PlaceBridge live={on} />
    </QueryClientProvider>
  );
  const view = await render(tree(live));
  return { client, view, tree };
}

beforeEach(() => {
  paths = [];
  status = 200;
});

describe('the app tells the Hub where the signed-in person is, once per sign-in (GEO-03, R-85)', () => {
  it('a signed-in person is read once, and the answer is kept for Edit profile', async () => {
    const { client } = await mount(true);
    await waitFor(() => expect(paths).toEqual(['GET /api/hub/me/location']));
    await waitFor(() => expect(client.getQueryData(myPlaceKey)).toMatchObject({ countryCode: 'GH' }));
  });

  it('nothing is asked while nobody is signed in or the tabs are not reachable yet', async () => {
    const { view, tree } = await mount(false);
    await view.rerender(tree(false));
    expect(paths).toEqual([]);
    // The tabs become reachable (signed in, sign-up steps done): now it asks.
    await view.rerender(tree(true));
    await waitFor(() => expect(paths).toEqual(['GET /api/hub/me/location']));
  });

  it('a failed read is not shown and does not stop the app', async () => {
    status = 500;
    const { client } = await mount(true);
    await waitFor(() => expect(paths).toHaveLength(1));
    expect(client.getQueryData(myPlaceKey)).toBeUndefined();
  });
});
