/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as rtl from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/*
 * I32 · New community (INBOX-14, R-63). The Hub is a stand-in `fetch` installed before the app's modules load. It records every call, so the
 * tests read what the screen sent: a private room is never sent without a price, the price is sent in kobo, and the bounds of the price are
 * the Hub's to refuse (its own words are shown; the phone holds no bound).
 */
// A host's picture, picked: the real picker has no phone to open here.
jest.mock('@/features/profile-edit/pickImage', () => ({
  canPickImage: true,
  pickImage: async () => ({ blob: new Blob(['x'], { type: 'image/jpeg' }), contentType: 'image/jpeg', extension: 'jpg', previewUri: 'file:///cover.jpg' }),
}));
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const hub = {
  rooms: [] as Record<string, unknown>[],
  presigns: [] as Record<string, unknown>[],
  puts: 0,
  priceReads: 0,
  refuse: null as null | { status: number; message: string },
};

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  if (url.host === 'upload.local' && request.method === 'PUT') {
    hub.puts += 1;
    return new Response(null, { status: 200 });
  }
  const path = url.pathname.replace(/^\/api\/hub/, '');
  if (path === '/prices' && request.method === 'GET') {
    hub.priceReads += 1;
    const item = (n: number) => ({ priceNaira: n, priceKobo: n * 100 });
    return json(200, { statusCode: 200, message: 'OK', data: { prices: [500, 1000, 2000, 2500, 5000].map(item), tips: [item(500)] } });
  }
  if (path === '/uploads/presign' && request.method === 'POST') {
    hub.presigns.push((await request.json()) as Record<string, unknown>);
    return json(200, { statusCode: 200, message: 'OK', data: { uploadUrl: 'https://upload.local/cover', key: 'k1', fileUrl: 'https://files.local/cover.jpg' } });
  }
  if (path === '/communities/rooms' && request.method === 'POST') {
    const body = (await request.json()) as Record<string, unknown>;
    hub.rooms.push(body);
    if (hub.refuse) return json(hub.refuse.status, { statusCode: hub.refuse.status, message: hub.refuse.message, data: null, ...(hub.refuse.message.includes('price list') ? { reason: { code: 'price_not_on_list', message: hub.refuse.message } } : {}) });
    return json(201, {
      statusCode: 201,
      message: 'Created',
      data: { id: 'room-1', name: body.name, kind: body.kind, imageUrl: body.imageUrl ?? null, description: body.description, hostWawuId: 'me', memberCount: 1, messagesToday: 0, slug: 'aba', link: 'wawu/c/aba' },
    });
  }
  throw new Error(`no answer for ${request.method} ${path}`);
}) as typeof fetch;

const { NewCommunityScreen } = require('../NewCommunityScreen') as typeof import('../NewCommunityScreen');

rtl.configure({ asyncUtilTimeout: 5000 });

beforeAll(async () => {
  const warm = await rtl.render(<View />);
  warm.unmount();
});

beforeEach(() => {
  Object.assign(hub, { rooms: [], presigns: [], puts: 0, priceReads: 0, refuse: null });
});

const clients: QueryClient[] = [];
afterEach(() => {
  clients.splice(0).forEach((c) => c.clear());
});

async function render(child: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } } });
  clients.push(client);
  return rtl.render(
    <QueryClientProvider client={client}>
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>{child}</SafeAreaProvider>
    </QueryClientProvider>,
  );
}

async function boot() {
  const onClose = jest.fn();
  const onCreated = jest.fn();
  await render(<NewCommunityScreen onClose={onClose} onCreated={onCreated} />);
  await until(() => rtl.screen.getByTestId('new-community-name'));
  await type('new-community-name', 'Aba tailors circle');
  await type('new-community-purpose', 'Tailors in Aba swapping patterns, suppliers and prices.');
  return { onClose, onCreated };
}

/** This renderer draws a state change on its own clock, not inside `act`, so a check is repeated on a real clock until it holds (or 4 seconds pass). */
async function until<T>(check: () => T): Promise<T> {
  const end = Date.now() + 4000;
  for (;;) {
    try {
      return check();
    } catch (error) {
      if (Date.now() > end) throw error;
      await new Promise((resolve) => setTimeout(resolve, 40));
    }
  }
}
/** Types into a field and waits until the screen holds what was typed (or what it kept of it). */
async function type(testID: string, typed: string, kept: string = typed) {
  rtl.fireEvent.changeText(rtl.screen.getByTestId(testID), typed);
  await until(() => expect(rtl.screen.getByTestId(testID).props.value).toBe(kept));
}
const press = async (testID: string) => {
  rtl.fireEvent.press(rtl.screen.getByTestId(testID));
};
const choosePrivate = async () => {
  await press('new-community-private');
  await until(() => rtl.screen.getByTestId('new-community-price'));
};
const create = () => press('new-community-create');

describe('I32: a private community is never made without a price (R-63)', () => {
  it('a host who picks Private sees no price chosen and is asked for one: nothing is sent, and the picker chose nothing itself', async () => {
    await boot();
    await choosePrivate();
    await until(() => rtl.screen.getByTestId('price-stop-2500'));
    expect(rtl.screen.getAllByTestId(/^price-stop-\d+$/).filter((n) => n.props.accessibilityState.selected)).toHaveLength(0);
    expect(rtl.screen.getByText('Price for 30 days')).toBeTruthy();
    await create();
    expect(await until(() => rtl.screen.getByText('Set a price for 30 days.'))).toBeTruthy();
    expect(hub.rooms).toHaveLength(0);
    expect(hub.presigns).toHaveLength(0);
  });

  it('a host who picks a price sees what they earn, and with no picture nothing is sent', async () => {
    await boot();
    await choosePrivate();
    rtl.fireEvent.press(await until(() => rtl.screen.getByTestId('price-stop-2500')));
    await until(() => expect(rtl.screen.getByTestId('price-picker-earn').props.accessibilityLabel).toBe('You earn 2,125 naira a pass'));
    await create();
    expect(await until(() => rtl.screen.getByText('A private community needs a cover picture.'))).toBeTruthy();
    expect(hub.rooms).toHaveLength(0);
  });

  it('a private community with a picked price but no picture is not sent either', async () => {
    await boot();
    await choosePrivate();
    rtl.fireEvent.press(await until(() => rtl.screen.getByTestId('price-stop-2000')));
    await until(() => expect(rtl.screen.getByTestId('price-stop-2000').props.accessibilityState.selected).toBe(true));
    await create();
    expect(await until(() => rtl.screen.getByText('A private community needs a cover picture.'))).toBeTruthy();
    expect(hub.rooms).toHaveLength(0);
  });

  it('a private community is sent with the list price picked, in kobo, and only a list price', async () => {
    const { onCreated } = await boot();
    await choosePrivate();
    rtl.fireEvent.press(await until(() => rtl.screen.getByTestId('price-stop-5000')));
    await until(() => expect(rtl.screen.getByTestId('price-stop-5000').props.accessibilityState.selected).toBe(true));
    rtl.fireEvent.press(rtl.screen.getByTestId('new-community-picture'));
    await until(() => rtl.screen.getByTestId('new-community-picture-image'));
    await create();
    await until(() => expect(onCreated).toHaveBeenCalledTimes(1));
    expect(hub.rooms).toEqual([
      { name: 'Aba tailors circle', description: 'Tailors in Aba swapping patterns, suppliers and prices.', kind: 'private', imageUrl: 'https://files.local/cover.jpg', passPriceKobo: 500_000 },
    ]);
  });

  it('a 400 price_not_on_list reads the list again and shows the Hub\'s sentence', async () => {
    const sentence = 'That price is not on the price list. The nearest are ₦2,000 and ₦2,500.';
    hub.refuse = { status: 400, message: sentence };
    await boot();
    await choosePrivate();
    rtl.fireEvent.press(rtl.screen.getByTestId('new-community-picture'));
    await until(() => rtl.screen.getByTestId('new-community-picture-image'));
    rtl.fireEvent.press(await until(() => rtl.screen.getByTestId('price-stop-2500')));
    await until(() => expect(rtl.screen.getByTestId('price-stop-2500').props.accessibilityState.selected).toBe(true));
    const reads = () => hub.priceReads;
    const before = reads();
    await create();
    expect(await until(() => rtl.screen.getByText(sentence))).toBeTruthy();
    await until(() => expect(reads()).toBeGreaterThan(before));
  });

  it('nothing is typed for the price: the host picks from the list only', async () => {
    await boot();
    await choosePrivate();
    await until(() => rtl.screen.getByTestId('price-stop-500'));
    expect(rtl.screen.queryByPlaceholderText('2000')).toBeNull();
    expect(rtl.screen.getAllByTestId(/^price-stop-\d+$/).map((n) => String(n.props.testID).replace('price-stop-', ''))).toEqual(['500', '1000', '2000', '2500', '5000']);
  });

  it('an open community has no price field and sends none', async () => {
    const { onCreated } = await boot();
    expect(rtl.screen.queryByTestId('new-community-price')).toBeNull();
    await create();
    await until(() => expect(onCreated).toHaveBeenCalledTimes(1));
    expect(hub.rooms).toEqual([{ name: 'Aba tailors circle', description: 'Tailors in Aba swapping patterns, suppliers and prices.', kind: 'open' }]);
    expect(hub.presigns).toHaveLength(0);
  });

  it('whatever the Hub refuses, the screen shows its own words and makes no community', async () => {
    hub.refuse = { status: 400, message: 'The Hub says no, in its own words.' };
    const { onCreated } = await boot();
    await create();
    expect(await until(() => rtl.screen.getByText('The Hub says no, in its own words.'))).toBeTruthy();
    expect(onCreated).not.toHaveBeenCalled();
  });

  it('a name that is too short is not sent', async () => {
    await boot();
    await type('new-community-name', 'ab');
    await create();
    expect(await until(() => rtl.screen.getByText('A name is 3 to 80 characters.'))).toBeTruthy();
    expect(hub.rooms).toHaveLength(0);
  });
});

describe('the room that is sent (roomInput)', () => {
  const { roomInput } = require('../model') as typeof import('../model');
  const form = { name: ' Aba tailors circle ', purpose: ' Tailors in Aba. ', kind: 'private' as const, price: '2000', imageUrl: 'https://files.local/cover.jpg' };

  it('a private room is sent with its price in kobo, its picture, and trimmed words', () => {
    expect(roomInput(form)).toEqual({ name: 'Aba tailors circle', description: 'Tailors in Aba.', kind: 'private', imageUrl: 'https://files.local/cover.jpg', passPriceKobo: 200_000 });
  });

  it('a private room is never made without a price: empty, zero, letters and a missing picture all give nothing to send', () => {
    for (const price of ['', '0', '00', 'abc', '-5', '1.5', '1234567890']) expect(roomInput({ ...form, price })).toBeNull();
    expect(roomInput({ ...form, imageUrl: undefined })).toBeNull();
  });

  it('an open room is never sent a price, even when one was typed', () => {
    expect(roomInput({ ...form, kind: 'open' })).toEqual({ name: 'Aba tailors circle', description: 'Tailors in Aba.', kind: 'open', imageUrl: 'https://files.local/cover.jpg' });
    expect(roomInput({ ...form, kind: 'open', imageUrl: undefined })).not.toHaveProperty('passPriceKobo');
  });
});

describe('a price outside the Hub\'s bounds', () => {
  const { createRoom } = require('../api') as typeof import('../api');

  it('is refused by the Hub, and the call rejects with the Hub\'s own words: the phone holds no bound of its own', async () => {
    hub.refuse = { status: 400, message: 'The price for a pass must be between the launch minimum and maximum.' };
    await expect(createRoom({ name: 'Aba tailors circle', description: 'Tailors.', kind: 'private', imageUrl: 'https://files.local/cover.jpg', passPriceKobo: 500 })).rejects.toMatchObject({
      message: 'The price for a pass must be between the launch minimum and maximum.',
    });
    expect(hub.rooms).toEqual([{ name: 'Aba tailors circle', description: 'Tailors.', kind: 'private', imageUrl: 'https://files.local/cover.jpg', passPriceKobo: 500 }]);
  });
});
