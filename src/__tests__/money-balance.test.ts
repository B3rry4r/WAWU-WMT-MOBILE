/* eslint-disable @typescript-eslint/no-require-imports */
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

type Answer = { status: number; body: unknown } | 'offline';

let answer: Answer;
const seen: { method: string; url: string }[] = [];

function installFetch() {
  globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(String(input), init);
    seen.push({ method: request.method, url: request.url });
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
  return {
    money: require('@/api/money') as typeof import('@/api/money'),
    errors: require('@/api/errors') as typeof import('@/api/errors'),
    Money: require('@/components/Money') as typeof import('@/components/Money'),
  };
}

const refusal = (statusCode: number, code: string, message: string, extra: Record<string, unknown> = {}) => ({
  status: statusCode,
  body: { statusCode, message, data: null, reason: { code, message, ...extra } },
});

beforeEach(() => {
  seen.length = 0;
});

describe('the wallet balance call (MONEY-11)', () => {
  it('a user with a wallet gets the balance in integer kobo, untouched, ready for Money', async () => {
    const { money, Money } = boot();
    answer = { status: 200, body: { statusCode: 200, message: 'OK', data: { availableKobo: 123456, asOf: '2026-10-02T17:30:37.285Z' } } };
    const balance = await money.fetchWalletBalance();
    expect(balance).toEqual({ availableKobo: 123456, asOf: '2026-10-02T17:30:37.285Z' });
    expect(Number.isInteger(balance.availableKobo)).toBe(true);
    // R-21: kobo goes through Money as it is; no conversion on the way.
    expect(Money.formatMoney(balance.availableKobo)).toBe('₦1,234.56');
    expect(seen).toEqual([{ method: 'GET', url: expect.stringMatching(/\/api\/hub\/money\/wallet\/balance$/) }]);
  });

  it('an answer without a whole-kobo balance is refused, never shown as 0', async () => {
    const { money } = boot();
    for (const data of [null, {}, { availableKobo: 1234.56, asOf: 'x' }, { availableKobo: '123456', asOf: 'x' }, { availableKobo: 0 }]) {
      answer = { status: 200, body: { statusCode: 200, message: 'OK', data } };
      const error = await money.fetchWalletBalance().catch((e: unknown) => e);
      expect(error).toMatchObject({ kind: 'unknown' });
      expect(money.balanceProblem(error)).toBe('other');
    }
  });

  it('asks the server every time: the query is never fresh from the cache', () => {
    const { money } = boot();
    expect(money.walletBalanceQuery.staleTime).toBe(0);
    expect(money.walletBalanceQuery.queryFn).toBe(money.fetchWalletBalance);
  });

  it('bank unreachable is W6 ("unreachable"), a rejection and never a 0', async () => {
    const { money, errors } = boot();
    answer = refusal(503, 'provider_unreachable', 'We could not reach your account. Your money is safe. Try again in a moment.', {
      retryAfterSeconds: 30,
    });
    const error = await money.fetchWalletBalance().then(
      (value) => ({ resolved: value }),
      (e: unknown) => e,
    );
    expect(errors.isApiError(error)).toBe(true);
    expect(error).toMatchObject({ kind: 'server', status: 503, code: 'provider_unreachable' });
    expect(money.balanceProblem(error)).toBe('unreachable');
  });

  it('no wallet yet, still opening and frozen each have their own state', async () => {
    const { money } = boot();
    const cases: [ReturnType<typeof refusal>, string][] = [
      [refusal(409, 'wallet_not_open', 'Open your wallet to see your balance.'), 'no_wallet'],
      [refusal(409, 'wallet_opening', 'Your account is still being opened.'), 'opening'],
      [refusal(423, 'wallet_frozen', 'This wallet cannot send or receive money right now.'), 'frozen'],
    ];
    for (const [refused, problem] of cases) {
      answer = refused;
      const error = await money.fetchWalletBalance().catch((e: unknown) => e);
      expect({ problem: money.balanceProblem(error) }).toEqual({ problem });
    }
  });

  it('anything else is the usual error state, not W6 and not a balance', async () => {
    const { money } = boot();
    answer = 'offline';
    expect(money.balanceProblem(await money.fetchWalletBalance().catch((e: unknown) => e))).toBe('other');
    answer = { status: 401, body: { statusCode: 401, message: 'Unauthorized', data: null } };
    expect(money.balanceProblem(await money.fetchWalletBalance().catch((e: unknown) => e))).toBe('other');
    answer = { status: 500, body: { statusCode: 500, message: 'Internal server error', data: null } };
    expect(money.balanceProblem(await money.fetchWalletBalance().catch((e: unknown) => e))).toBe('other');
    expect(money.balanceProblem(new Error('not an api error'))).toBe('other');
  });

  it('every money refusal carries its reason.code as the error code; other codes are unchanged', () => {
    const { errors } = boot();
    expect(errors.toApiError(403, { statusCode: 403, message: 'Wrong PIN.', reason: { code: 'pin_incorrect', triesLeft: 3 } })).toMatchObject({
      kind: 'forbidden',
      code: 'pin_incorrect',
    });
    expect(errors.toApiError(403, { statusCode: 403, message: 'Confirm your email.', code: 'EMAIL_NOT_VERIFIED' })).toMatchObject({
      code: 'EMAIL_NOT_VERIFIED',
    });
    expect(errors.toApiError(400, { statusCode: 400, message: ['bad'] }).code).toBeUndefined();
    expect(errors.toApiError(409, { statusCode: 409, message: 'x', reason: 'not an object' }).code).toBeUndefined();
  });
});
