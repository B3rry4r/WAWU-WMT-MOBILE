/* eslint-disable @typescript-eslint/no-require-imports */
jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn(async () => null), setItemAsync: jest.fn(async () => undefined), deleteItemAsync: jest.fn(async () => undefined) }));
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

let me: Record<string, unknown> = {};
globalThis.fetch = jest.fn(async () => new Response(JSON.stringify({ statusCode: 200, message: 'OK', data: me }), { status: 200, headers: { 'content-type': 'application/json' } })) as typeof fetch;

const { fetchIsCreator } = require('../api') as typeof import('../api');

describe('P10 creator gate: who counts as a creator', () => {
  it('a creator account passes the gate', async () => {
    me = { wawuUserId: 'u1', accountType: 'creator' };
    await expect(fetchIsCreator()).resolves.toBe(true);
  });

  it('a user account is stopped at the gate', async () => {
    me = { wawuUserId: 'u1', accountType: 'user' };
    await expect(fetchIsCreator()).resolves.toBe(false);
  });

  it('a person with no account type yet (null, as the contract allows) is stopped at the gate, not let through', async () => {
    me = { wawuUserId: 'u1', accountType: null };
    await expect(fetchIsCreator()).resolves.toBe(false);
  });

  it('an account type that is not text at all is unreadable', async () => {
    me = { wawuUserId: 'u1', accountType: 7 };
    await expect(fetchIsCreator()).rejects.toBeTruthy();
  });
});
