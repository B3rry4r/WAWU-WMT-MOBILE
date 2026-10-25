/* eslint-disable @typescript-eslint/no-require-imports */
import * as rtl from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/**
 * R2-SOCIAL (g), CHECK-3 defect 7: I33's board line "Members pay 1 credit a message and reading is free." follows the first sentence.
 * It is written from what the Hub says a message costs (`GET /communities/message-cost`, R-62), so it is true whatever the Hub prices,
 * and until that is read nothing is said beyond the first sentence.
 */
let cost: { status: number; body: unknown } = { status: 200, body: {} };
const ROOM = { id: 'room-1', name: 'Lagos photographers', kind: 'open', imageUrl: null, description: 'About', hostWawuId: 'me', memberCount: 1, messagesToday: 0, slug: 'lagos-photographers', link: 'wawu/c/lagos-photographers', pending: 0 };
const ok = (data: unknown) => ({ status: 200, body: { statusCode: 200, message: 'OK', data } });

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const path = new URL(request.url).pathname.replace(/^\/api\/hub/, '');
  const answer = path === '/communities/message-cost' ? cost : ok(ROOM);
  return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

const { CreatedScreen } = require('../CreatedScreen') as typeof import('../CreatedScreen');
const { queryClient } = require('@/api/query') as typeof import('@/api/query');

const costs = (text: number, photo = 1, video = 3, voice = 3) => ok({ creditsPerMessage: text, creditsByKind: { text, photo, video, voice } });

afterEach(() => {
  queryClient.clear();
});

async function boot() {
  await rtl.render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <CreatedScreen id="room-1" onOpenRoom={jest.fn()} />
    </SafeAreaProvider>,
  );
  await rtl.screen.findByTestId('created-title');
}

describe('I33 · what members pay', () => {
  it('names what the Hub prices and says reading is free, after the first sentence', async () => {
    cost = costs(0);
    await boot();
    expect(await rtl.screen.findByText('Share the link or post your first message. Chat and reading are free. Credits are for photos, video and voice notes.')).toBeTruthy();
  });

  it('is the board\'s own words while the Hub prices a text message at a credit', async () => {
    cost = costs(1);
    await boot();
    expect(await rtl.screen.findByText('Share the link or post your first message. Members pay 1 credit a message and reading is free.')).toBeTruthy();
  });

  it('says nothing about prices when the Hub\'s answer cannot be read, and never guesses one', async () => {
    cost = { status: 500, body: { statusCode: 500, message: 'Server error' } };
    await boot();
    await rtl.act(async () => new Promise((resolve) => setTimeout(resolve, 150)));
    expect(rtl.screen.getByTestId('created-line').props.children).toBe('Share the link or post your first message.');
    expect(rtl.screen.queryByText(/credit/i)).toBeNull();
  });
});
