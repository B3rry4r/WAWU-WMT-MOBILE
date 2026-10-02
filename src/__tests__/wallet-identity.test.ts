/* eslint-disable @typescript-eslint/no-require-imports */
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

type Answer = { status: number; body: unknown } | 'offline';

let answer: Answer;
const seen: { method: string; url: string; body: string }[] = [];

function installFetch() {
  globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(String(input), init);
    seen.push({ method: request.method, url: request.url, body: await request.clone().text() });
    if (answer === 'offline') throw new TypeError('Network request failed');
    return new Response(JSON.stringify(answer.body), {
      status: answer.status,
      headers: { 'content-type': 'application/json' },
    });
  }) as typeof fetch;
}

/** The app's modules, loaded after fetch is in place (openapi-fetch keeps the fetch it was created with). */
function boot() {
  jest.resetModules();
  installFetch();
  return require('@/api/walletIdentity') as typeof import('@/api/walletIdentity');
}

const refusal = (statusCode: number, code: string, message: string, extra: Record<string, unknown> = {}) => ({
  status: statusCode,
  body: { statusCode, message, data: null, reason: { code, message, ...extra } },
});

const identity = { bvn: { last4: '0111', verifiedAt: '2026-10-02T19:37:02.488Z' }, ninLast4: '0999', occupation: null, checksLeft: 2 };
const prefill = { firstName: 'Ada', middleName: null, lastName: 'Sandbox', dateOfBirth: '1992-10-04', gender: 'female' };

beforeEach(() => {
  seen.length = 0;
});

describe('the BVN check calls (KYC-01)', () => {
  it('a user who enters their BVN and NIN gets A5’s prefill; the numbers go in the body, never the URL', async () => {
    const calls = boot();
    answer = { status: 200, body: { statusCode: 200, message: 'OK', data: { identity, prefill } } };
    const result = await calls.checkBvn({ bvn: '2219 0000 111', nin: '70190000999' });
    expect(result).toEqual({ identity, prefill });
    expect(seen).toHaveLength(1);
    expect(seen[0].method).toBe('POST');
    expect(seen[0].url).toMatch(/\/api\/hub\/money\/identity\/bvn$/);
    expect(seen[0].url).not.toMatch(/22190000111|70190000999/);
    expect(JSON.parse(seen[0].body)).toEqual({ bvn: '22190000111', nin: '70190000999' });
  });

  it('a BVN whose phone is not the account’s is A14 ("phone_mismatch"), with nothing from the BVN record', async () => {
    const calls = boot();
    answer = refusal(422, 'bvn_phone_mismatch', "This isn't the number on your BVN. Use that one.", { checksLeft: 2 });
    const error = await calls.checkBvn({ bvn: '22190000222', nin: '70190000999' }).catch((e: unknown) => e);
    expect(error).toMatchObject({ status: 422, code: 'bvn_phone_mismatch', message: "This isn't the number on your BVN. Use that one." });
    expect(calls.identityProblem(error)).toBe('phone_mismatch');
  });

  it('each other refusal has its own state', async () => {
    const calls = boot();
    const cases: [ReturnType<typeof refusal>, string][] = [
      [refusal(422, 'bvn_not_confirmed', 'We could not confirm that BVN. Check the number and try again.'), 'not_confirmed'],
      [refusal(422, 'phone_not_nigerian', 'A Naira wallet needs a Nigerian phone number on your account.'), 'phone_not_nigerian'],
      [refusal(429, 'identity_checks_exhausted', 'You have used today’s BVN checks. Try again later.', { retryAfterSeconds: 86000 }), 'limit'],
      [refusal(409, 'wallet_already_open', 'Your wallet is already open.'), 'wallet_open'],
      [refusal(503, 'provider_unreachable', 'We could not check your BVN right now. Try again in a moment.'), 'unreachable'],
    ];
    for (const [refused, problem] of cases) {
      answer = refused;
      const error = await calls.checkBvn({ bvn: '22190000111', nin: '70190000999' }).catch((e: unknown) => e);
      expect({ problem: calls.identityProblem(error) }).toEqual({ problem });
    }
    answer = { status: 429, body: { statusCode: 429, message: 'ThrottlerException: Too Many Requests', data: null } };
    expect(calls.identityProblem(await calls.checkBvn({ bvn: '22190000111', nin: '70190000999' }).catch((e: unknown) => e))).toBe('other');
    answer = 'offline';
    expect(calls.identityProblem(await calls.fetchWalletIdentity().catch((e: unknown) => e))).toBe('other');
  });

  it('reads the step and saves the occupation; an unreadable answer is refused', async () => {
    const calls = boot();
    answer = { status: 200, body: { statusCode: 200, message: 'OK', data: identity } };
    await expect(calls.fetchWalletIdentity()).resolves.toEqual(identity);
    answer = { status: 200, body: { statusCode: 200, message: 'OK', data: { ...identity, occupation: 'Filmmaker' } } };
    await expect(calls.saveOccupation('Filmmaker')).resolves.toMatchObject({ occupation: 'Filmmaker' });
    expect(seen.map((s) => s.method)).toEqual(['GET', 'PUT']);
    expect(seen[1].url).toMatch(/\/api\/hub\/money\/identity\/occupation$/);
    answer = refusal(409, 'bvn_not_checked', 'Confirm your BVN first.');
    expect(calls.identityProblem(await calls.saveOccupation('Filmmaker').catch((e: unknown) => e))).toBe('not_checked');
    for (const data of [null, {}, { ...identity, checksLeft: 'two' }]) {
      answer = { status: 200, body: { statusCode: 200, message: 'OK', data } };
      await expect(calls.fetchWalletIdentity()).rejects.toMatchObject({ kind: 'unknown' });
    }
    expect(calls.walletIdentityQuery.staleTime).toBe(0);
  });
});
