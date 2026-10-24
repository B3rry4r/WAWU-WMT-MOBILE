/* eslint-disable @typescript-eslint/no-require-imports */
import { act } from '@testing-library/react-native';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('@/api/session', () => ({
  ...jest.requireActual('@/api/session'),
  getAccessToken: async () => 'access-1',
  refreshAccessToken: async () => null,
  isCurrentSessionToken: () => true,
}));
jest.mock('@/api/tokenStore', () => ({
  ...jest.requireActual('@/api/tokenStore'),
  loadTokens: async () => ({ accessToken: 'access-1', refreshToken: 'refresh-1' }),
}));

type Answer = { status: number; body: unknown } | 'offline';
let answers: Record<string, Answer | Answer[]> = {};
let sent: { method: string; path: string; body: unknown }[] = [];

globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  const url = new URL(request.url);
  const text = request.method === 'GET' ? '' : await request.text();
  sent.push({ method: request.method, path: url.pathname, body: text ? JSON.parse(text) : undefined });
  const queued = answers[`${request.method} ${url.pathname}`];
  const answer = Array.isArray(queued) ? (queued.length > 1 ? queued.shift()! : queued[0]) : queued;
  if (!answer) return new Response(JSON.stringify({ statusCode: 404, message: 'Not Found', data: null }), { status: 404 });
  if (answer === 'offline') throw new TypeError('Network request failed');
  return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

// The Hub client keeps the `fetch` it finds when it is first loaded, so the screens load after the stand-in is in place.
const { queryClient } = require('@/api/query') as typeof import('@/api/query');
const { refreshSignupGate, resetSignupGate, signupGateState, stepLabel } = require('@/features/auth/signupGate') as typeof import('@/features/auth/signupGate');

const ok = (data: unknown): Answer => ({ status: 200, body: { statusCode: 200, message: 'OK', data } });
const calls = (method: string, path: string) => sent.filter((s) => s.method === method && s.path === path);

const progress = (over: Record<string, unknown> = {}) =>
  ok({ step: 'creator_setup', inSequence: true, accountType: 'creator', steps: ['email', 'creator_setup'], emailProven: true, ...over });
afterEach(() => {
  queryClient.clear();
});

beforeEach(() => {
  answers = {};
  sent = [];
  queryClient.clear();
  resetSignupGate();
});

describe('the account type reaches the Hub right after sign-up (G-17)', () => {
  it('a new account is copied to the Hub profile before the gate opens, once, and again after a failure', async () => {
    answers['GET /auth/signup/progress'] = progress();
    answers['PUT /api/hub/users/me/account-type'] = ['offline', ok({ accountType: 'creator' })];
    await act(async () => refreshSignupGate());
    // The Hub did not answer: the app still opens, and the copy waits for the next read.
    expect(signupGateState().phase).toBe('ready');
    expect(calls('PUT', '/api/hub/users/me/account-type')).toHaveLength(1);
    await act(async () => refreshSignupGate());
    expect(calls('PUT', '/api/hub/users/me/account-type')).toHaveLength(2);
    expect(calls('PUT', '/api/hub/users/me/account-type')[1].body).toEqual({ accountType: 'creator' });
    await act(async () => refreshSignupGate());
    expect(calls('PUT', '/api/hub/users/me/account-type')).toHaveLength(2);
  });

  it('a person who is not in the sign-up sequence, or whose account has no type, sends nothing', async () => {
    answers['GET /auth/signup/progress'] = progress({ inSequence: false, step: 'done' });
    await act(async () => refreshSignupGate());
    resetSignupGate();
    answers['GET /auth/signup/progress'] = progress({ accountType: null });
    await act(async () => refreshSignupGate());
    expect(calls('PUT', '/api/hub/users/me/account-type')).toHaveLength(0);
  });

  describe('FIX-68 F-4: a finished sign-up writes only when the Hub does not hold the type already', () => {
    const done = (type: 'user' | 'creator') => progress({ step: 'done', inSequence: true, accountType: type, steps: ['email', 'creator_setup', 'interests', 'follows'] });
    const mine = (type: 'user' | 'creator' | null) => ok({ wawuUserId: '00000000-0000-4000-8000-000000000001', accountType: type, firstName: 'Ada', lastName: 'Obi', handle: 'ada' });

    it('a Hub that already holds the type is not written to on any start', async () => {
      answers['GET /auth/signup/progress'] = done('creator');
      answers['GET /api/hub/users/me'] = mine('creator');
      await act(async () => refreshSignupGate());
      resetSignupGate();
      await act(async () => refreshSignupGate());
      expect(signupGateState().phase).toBe('ready');
      expect(calls('PUT', '/api/hub/users/me/account-type')).toHaveLength(0);
    });

    it('a person who picked user and became a creator since is not written back to user', async () => {
      answers['GET /auth/signup/progress'] = done('user');
      answers['GET /api/hub/users/me'] = mine('creator');
      await act(async () => refreshSignupGate());
      expect(calls('PUT', '/api/hub/users/me/account-type')).toHaveLength(0);
    });

    it('a Hub that never got the type (the copy failed all through the steps) is written to once, and not again', async () => {
      answers['GET /auth/signup/progress'] = done('creator');
      answers['GET /api/hub/users/me'] = mine(null);
      answers['PUT /api/hub/users/me/account-type'] = ok({ accountType: 'creator' });
      await act(async () => refreshSignupGate());
      expect(calls('PUT', '/api/hub/users/me/account-type')).toHaveLength(1);
      expect(calls('PUT', '/api/hub/users/me/account-type')[0].body).toEqual({ accountType: 'creator' });
      await act(async () => refreshSignupGate());
      expect(calls('PUT', '/api/hub/users/me/account-type')).toHaveLength(1);
    });

    it('a Hub that cannot be read sends nothing and still opens the app; the next start looks again', async () => {
      answers['GET /auth/signup/progress'] = done('creator');
      answers['GET /api/hub/users/me'] = 'offline';
      await act(async () => refreshSignupGate());
      expect(signupGateState().phase).toBe('ready');
      expect(calls('PUT', '/api/hub/users/me/account-type')).toHaveLength(0);
      answers['GET /api/hub/users/me'] = mine('creator');
      await act(async () => refreshSignupGate());
      // Each start also reads the name and username (SIGNUP-NAMES, R-82): two reads of the same route per start.
      expect(calls('GET', '/api/hub/users/me')).toHaveLength(4);
      expect(calls('PUT', '/api/hub/users/me/account-type')).toHaveLength(0);
    });
  });

  it('the bar shows where a step stands among the steps WAWU ID lists after the email, and nothing when it is alone', () => {
    const user = { step: 'interests', inSequence: true, accountType: 'user', emailProven: true, steps: ['email', 'interests', 'follows'] } as never;
    expect(stepLabel(user, 'interests')).toBe('1 of 2');
    expect(stepLabel(user, 'follows')).toBe('2 of 2');
    const creator = { step: 'creator_setup', inSequence: true, accountType: 'creator', emailProven: true, steps: ['email', 'creator_setup'] } as never;
    expect(stepLabel(creator, 'creator_setup')).toBeUndefined();
  });
});
