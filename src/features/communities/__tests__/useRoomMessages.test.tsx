/* eslint-disable @typescript-eslint/no-require-imports */
import * as rtl from '@testing-library/react-native';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

type Answer = { status: number; body: unknown } | 'hold';
let answers: Record<string, Answer[]> = {};
let posts = 0;
const ok = (data: unknown, extra: object = {}): Answer => ({ status: 200, body: { statusCode: 200, message: 'OK', data, ...extra } });

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const key = `${request.method} ${url.pathname.replace(/^\/api\/hub/, '')}`;
  if (key === 'POST /communities/r1/messages') posts += 1;
  const answer = answers[key]?.[0];
  if (!answer) throw new TypeError('Network request failed');
  if (answer === 'hold') return new Promise<Response>(() => undefined);
  return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

const { queryClient } = require('@/api/query') as typeof import('@/api/query');
const { useRoomMessages } = require('../useRoomMessages') as typeof import('../useRoomMessages');

beforeEach(() => {
  posts = 0;
  queryClient.clear();
  answers = {
    'GET /communities/r1/messages': [ok([], { pagination: { currentPage: 1, nextPage: null, perPage: 20, total: 0 } })],
    'GET /users/me': [ok({ wawuUserId: 'me', firstName: 'Ada', lastName: 'Obi', handle: 'ada', avatarUrl: null })],
    'POST /communities/r1/messages': ['hold'],
  };
});

afterEach(async () => {
  await queryClient.cancelQueries();
  queryClient.clear();
});

describe('the hook that sends (its own guard, apart from the Composer\'s)', () => {
  it('two sends in the same instant post once and leave one message on its way', async () => {
    const hook = await rtl.renderHook(() => useRoomMessages('r1', true));
    await rtl.waitFor(() => expect(hook.result.current.isSuccess).toBe(true));
    await rtl.act(async () => {
      hook.result.current.send('only once');
      hook.result.current.send('only once');
      hook.result.current.send('and not this one either');
    });
    expect(posts).toBe(1);
    expect(hook.result.current.outgoing).toHaveLength(1);
    expect(hook.result.current.outgoing[0]?.text).toBe('only once');
  });

  it('two presses of Send again in the same instant post once', async () => {
    answers['POST /communities/r1/messages'] = [{ status: 400, body: { statusCode: 400, message: 'Nope.', data: null } }];
    const hook = await rtl.renderHook(() => useRoomMessages('r1', true));
    await rtl.waitFor(() => expect(hook.result.current.isSuccess).toBe(true));
    await rtl.act(async () => {
      hook.result.current.send('try me');
    });
    await rtl.waitFor(() => expect(hook.result.current.outgoing[0]?.status).toBe('failed'));
    expect(posts).toBe(1);
    answers['POST /communities/r1/messages'] = ['hold'];
    const id = hook.result.current.outgoing[0]?.localId as string;
    await rtl.act(async () => {
      hook.result.current.retry(id);
      hook.result.current.retry(id);
    });
    expect(posts).toBe(2);
  });

  it('sends nothing for words that are empty after trimming', async () => {
    const hook = await rtl.renderHook(() => useRoomMessages('r1', true));
    await rtl.waitFor(() => expect(hook.result.current.isSuccess).toBe(true));
    let taken = true;
    await rtl.act(async () => {
      taken = hook.result.current.send('   ');
    });
    expect(taken).toBe(false);
    expect(posts).toBe(0);
  });
});
