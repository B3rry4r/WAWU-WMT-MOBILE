/* eslint-disable @typescript-eslint/no-require-imports */
const mockStore = new Map<string, string>();
let mockStoreBroken = false;
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => {
    if (mockStoreBroken) throw new Error('keystore unavailable');
    return mockStore.get(key) ?? null;
  }),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    if (mockStoreBroken) throw new Error('keystore unavailable');
    mockStore.set(key, value);
  }),
  deleteItemAsync: jest.fn(async () => undefined),
}));

/** The session as the claim sees it: one mockCurrent token, and a refresh that hands out the next one. */
let mockCurrent = '';
let mockNextTokens: (string | null | 'offline')[] = [];
const mockRefresh = jest.fn(async (rejected: string): Promise<string | null> => {
  const next = mockNextTokens.shift();
  if (next === 'offline') throw new TypeError('Network request failed');
  if (next === undefined || next === null) return null;
  if (rejected !== mockCurrent) return mockCurrent;
  mockCurrent = next;
  return next;
});
jest.mock('@/api/session', () => ({
  ...jest.requireActual('@/api/session'),
  getAccessToken: async () => mockCurrent,
  refreshAccessToken: (rejected: string) => mockRefresh(rejected),
  isCurrentSessionToken: () => true,
}));

type Plain = { status: number; body: unknown };
let answers: Plain[] = [];
let sentWith: string[] = [];
globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : new Request(String(input), init);
  sentWith.push(request.headers.get('authorization') ?? '');
  const next = answers.length > 1 ? answers.shift()! : answers[0];
  return new Response(JSON.stringify(next.body), { status: next.status, headers: { 'content-type': 'application/json' } });
}) as typeof fetch;

const b64 = (value: unknown) => btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
/** A WAWU ID access token as far as the claim reads it. */
const token = (claims: Record<string, unknown>) => `${b64({ alg: 'RS256' })}.${b64(claims)}.sig`;
const ACCOUNT = 'account-1';
const T1 = token({ sub: ACCOUNT, iat: 1000, emailVerified: false, phoneVerified: true });
const T2 = token({ sub: ACCOUNT, iat: 2000, emailVerified: true, phoneVerified: true });
const T3 = token({ sub: ACCOUNT, iat: 3000, emailVerified: true, phoneVerified: true });

const plan = {
  offerName: 'Event registration',
  days: 30,
  extended: false,
  pointsGranted: 0,
  pointsExpireAt: null,
  tier: { state: 'active', tier: { id: 'verify', name: 'Verify' }, activeFrom: 'a', activeUntil: 'b', productsAllowed: 3, extraProducts: 0, pointsIncluded: 0, firstVoiceIntroIncluded: false, eventPass: null },
};
const ok: Plain = { status: 200, body: { statusCode: 200, message: 'OK', data: plan } };
const refusal = (status: number, code: string): Plain => ({ status, body: { statusCode: status, message: 'words', data: null, reason: { code, message: 'words' } } });
const notVerified = refusal(409, 'contact_not_verified');

type Modules = { claimCode: typeof import('../api').claimCode; noteContactProved: typeof import('../freshToken').noteContactProved };
function load(): Modules {
  let loaded!: Modules;
  jest.isolateModules(() => {
    loaded = { claimCode: require('../api').claimCode, noteContactProved: require('../freshToken').noteContactProved };
  });
  return loaded;
}

beforeEach(() => {
  mockStore.clear();
  mockStoreBroken = false;
  mockCurrent = T1;
  mockNextTokens = [];
  answers = [ok];
  sentWith = [];
  mockRefresh.mockClear();
});

const bearer = (t: string) => `Bearer ${t}`;

describe('a claim reaches the Hub with a token that is not older than what the person has proven (JOIN-03 round 2, N1)', () => {
  it('renews a token issued before the email was proven, and claims with the new one', async () => {
    const { claimCode, noteContactProved } = load();
    await noteContactProved();
    mockNextTokens = [T2];
    await claimCode('5F6C15E4');
    expect(mockRefresh).toHaveBeenCalledTimes(1);
    expect(mockRefresh).toHaveBeenCalledWith(T1);
    expect(sentWith).toEqual([bearer(T2)]);
  });

  it('asks for no new token when nothing was proven since the token was issued', async () => {
    const { claimCode } = load();
    await claimCode('5F6C15E4');
    expect(mockRefresh).not.toHaveBeenCalled();
    expect(sentWith).toEqual([bearer(T1)]);
  });

  it('asks for no new token when the token was issued after the proof', async () => {
    const { claimCode, noteContactProved } = load();
    await noteContactProved();
    mockCurrent = T2;
    await claimCode('5F6C15E4');
    expect(mockRefresh).not.toHaveBeenCalled();
    expect(sentWith).toEqual([bearer(T2)]);
  });

  it('renews once for one proof: the next claim does not renew again', async () => {
    const { claimCode, noteContactProved } = load();
    await noteContactProved();
    mockNextTokens = [T2, T3];
    await claimCode('5F6C15E4');
    await claimCode('5F6C15E4');
    expect(mockRefresh).toHaveBeenCalledTimes(1);
    expect(sentWith).toEqual([bearer(T2), bearer(T2)]);
  });

  it('remembers the proof across a restart of the app (the phone keeps which token was mockCurrent)', async () => {
    const first = load();
    await first.noteContactProved();
    const restarted = load();
    mockNextTokens = [T2];
    await restarted.claimCode('5F6C15E4');
    expect(mockRefresh).toHaveBeenCalledTimes(1);
    expect(sentWith).toEqual([bearer(T2)]);
  });

  it("does not let one account's proof renew another account's token", async () => {
    const first = load();
    await first.noteContactProved();
    mockCurrent = token({ sub: 'someone-else', iat: 1000, emailVerified: false, phoneVerified: true });
    const other = load();
    await other.claimCode('5F6C15E4');
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it('still sends the claim when the renewal cannot be made (offline, or the server gave nothing)', async () => {
    for (const next of ['offline', null] as const) {
      mockRefresh.mockClear();
      sentWith = [];
      mockStore.clear();
      mockCurrent = T1;
      mockNextTokens = [next];
      const { claimCode, noteContactProved } = load();
      await noteContactProved();
      await claimCode('5F6C15E4');
      expect(sentWith).toEqual([bearer(T1)]);
    }
  });

  it('never fails because the phone cannot remember: a broken store means a claim that asks the Hub', async () => {
    mockStoreBroken = true;
    const { claimCode, noteContactProved } = load();
    await expect(noteContactProved()).resolves.toBeUndefined();
    await claimCode('5F6C15E4');
    expect(sentWith).toEqual([bearer(T1)]);
  });

  it('notes nothing for a token it cannot read, and the claim is sent as it is', async () => {
    mockCurrent = 'not-a-jwt';
    const { claimCode, noteContactProved } = load();
    await noteContactProved();
    await claimCode('5F6C15E4');
    expect(mockRefresh).not.toHaveBeenCalled();
    expect(sentWith).toEqual([bearer('not-a-jwt')]);
  });
});

describe('when the Hub still says no contact is confirmed', () => {
  it('renews the token once and sends the claim once more, and that claim is the one that counts', async () => {
    answers = [notVerified, ok];
    mockNextTokens = [T2];
    const { claimCode } = load();
    const result = await claimCode('5F6C15E4');
    expect(result.offerName).toBe('Event registration');
    expect(mockRefresh).toHaveBeenCalledTimes(1);
    expect(sentWith).toEqual([bearer(T1), bearer(T2)]);
  });

  it('gives up after that one retry: a second "not confirmed" is final, with no third claim and no second renewal', async () => {
    answers = [notVerified];
    mockNextTokens = [T2, T3];
    const { claimCode } = load();
    await expect(claimCode('5F6C15E4')).rejects.toMatchObject({ code: 'contact_not_verified' });
    expect(mockRefresh).toHaveBeenCalledTimes(1);
    expect(sentWith).toHaveLength(2);
  });

  it('stands on the first answer when the token cannot be renewed', async () => {
    for (const next of ['offline', null] as const) {
      mockRefresh.mockClear();
      sentWith = [];
      answers = [notVerified];
      mockNextTokens = [next];
      const { claimCode } = load();
      await expect(claimCode('5F6C15E4')).rejects.toMatchObject({ code: 'contact_not_verified' });
      expect(sentWith).toHaveLength(1);
    }
  });

  it('renews for no other refusal, and not for an offline phone', async () => {
    for (const code of ['code_not_found', 'already_claimed', 'code_refunded', 'offer_unavailable']) {
      mockRefresh.mockClear();
      sentWith = [];
      answers = [refusal(code === 'code_not_found' ? 404 : 409, code)];
      const { claimCode } = load();
      await expect(claimCode('5F6C15E4')).rejects.toMatchObject({ code });
      expect(mockRefresh).not.toHaveBeenCalled();
      expect(sentWith).toHaveLength(1);
    }
  });
});
