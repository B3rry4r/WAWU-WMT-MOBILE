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

describe('the selfie match calls (KYC-02)', () => {
  // A made-up image: JPEG magic bytes, then filler (never a photo of anyone).
  const image = `/9j/4AAQ${'A'.repeat(4000)}`;
  const matched = { matchedAt: '2026-10-02T20:59:47.000Z', checksLeft: 2 };

  it('a user who takes a selfie that matches gets A7; the BVN and image go in the body, never the URL', async () => {
    const calls = boot();
    answer = { status: 200, body: { statusCode: 200, message: 'OK', data: matched } };
    await expect(
      calls.matchSelfie({ bvn: '2229 0000 111', image: `data:image/jpeg;base64,${image.slice(0, 50)}\n${image.slice(50)}` }),
    ).resolves.toEqual(matched);
    expect(seen).toHaveLength(1);
    expect(seen[0].method).toBe('POST');
    expect(seen[0].url).toMatch(/\/api\/hub\/money\/identity\/selfie$/);
    expect(seen[0].url).not.toMatch(/22290000111|4AAQ/);
    expect(JSON.parse(seen[0].body)).toEqual({ bvn: '22290000111', image });
  });

  it('a selfie that does not match is A16 ("not_matched"); the fourth of the day is the retry rule ("limit")', async () => {
    const calls = boot();
    answer = refusal(
      422,
      'selfie_not_matched',
      "We couldn't match your face. It must match your BVN photo. Good light, no glasses or cap.",
      { checksLeft: 2 },
    );
    const failed = await calls.matchSelfie({ bvn: '22290000111', image }).catch((e: unknown) => e);
    expect(failed).toMatchObject({
      status: 422,
      code: 'selfie_not_matched',
      message: "We couldn't match your face. It must match your BVN photo. Good light, no glasses or cap.",
    });
    expect(calls.selfieProblem(failed)).toBe('not_matched');

    answer = refusal(429, 'selfie_checks_exhausted', 'You have used today’s selfie checks. Try again later.', {
      retryAfterSeconds: 86000,
    });
    const limited = await calls.matchSelfie({ bvn: '22290000111', image }).catch((e: unknown) => e);
    expect(limited).toMatchObject({ status: 429, code: 'selfie_checks_exhausted' });
    expect(calls.selfieProblem(limited)).toBe('limit');
  });

  it('each other refusal of a selfie has its own state', async () => {
    const calls = boot();
    const cases: [ReturnType<typeof refusal>, string][] = [
      [refusal(409, 'selfie_already_matched', 'Your selfie already matches your BVN.'), 'already_matched'],
      [refusal(409, 'bvn_not_checked', 'Confirm your BVN first.'), 'not_checked'],
      [refusal(409, 'wallet_already_open', 'Your wallet is already open.'), 'wallet_open'],
      [refusal(503, 'provider_unreachable', 'We could not check your selfie right now. Try again in a moment.'), 'unreachable'],
    ];
    for (const [refused, problem] of cases) {
      answer = refused;
      const error = await calls.matchSelfie({ bvn: '22290000111', image }).catch((e: unknown) => e);
      expect({ problem: calls.selfieProblem(error) }).toEqual({ problem });
    }
    answer = { status: 429, body: { statusCode: 429, message: 'ThrottlerException: Too Many Requests', data: null } };
    expect(calls.selfieProblem(await calls.matchSelfie({ bvn: '22290000111', image }).catch((e: unknown) => e))).toBe('other');
    answer = 'offline';
    expect(calls.selfieProblem(await calls.fetchSelfieMatch().catch((e: unknown) => e))).toBe('other');
  });

  it('an empty or oversized selfie is refused without sending it (each match is charged)', async () => {
    const calls = boot();
    answer = { status: 200, body: { statusCode: 200, message: 'OK', data: matched } };
    for (const bad of ['', '   ', 'data:image/jpeg;base64,', 'A'.repeat(calls.SELFIE_MAX_BASE64_CHARS + 4)]) {
      await expect(calls.matchSelfie({ bvn: '22290000111', image: bad })).rejects.toMatchObject({ kind: 'validation' });
    }
    expect(seen).toHaveLength(0);
    await expect(calls.matchSelfie({ bvn: '22290000111', image: 'A'.repeat(calls.SELFIE_MAX_BASE64_CHARS) })).resolves.toEqual(
      matched,
    );
    expect(seen).toHaveLength(1);
  });

  it('reads the selfie step; an unreadable answer is refused', async () => {
    const calls = boot();
    answer = { status: 200, body: { statusCode: 200, message: 'OK', data: { matchedAt: null, checksLeft: 3 } } };
    await expect(calls.fetchSelfieMatch()).resolves.toEqual({ matchedAt: null, checksLeft: 3 });
    expect(seen[0].method).toBe('GET');
    expect(seen[0].url).toMatch(/\/api\/hub\/money\/identity\/selfie$/);
    for (const data of [null, {}, { matchedAt: null }, { matchedAt: 5, checksLeft: 1 }, { matchedAt: null, checksLeft: 'two' }]) {
      answer = { status: 200, body: { statusCode: 200, message: 'OK', data } };
      await expect(calls.fetchSelfieMatch()).rejects.toMatchObject({ kind: 'unknown' });
    }
    expect(calls.selfieMatchQuery.staleTime).toBe(0);
    expect(calls.selfieMatchQuery.queryKey).toEqual(['money', 'identity', 'selfie']);
  });
});
