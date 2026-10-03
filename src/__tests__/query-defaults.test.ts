import { MutationObserver, QueryObserver } from '@tanstack/react-query';

import { ApiError, type ApiErrorKind } from '@/api/errors';
import { createQueryClient } from '@/api/query';

/**
 * The query defaults every screen gets unless it sets its own (`src/api/query.ts`). FIX-04 made the app's
 * root use them, so they are live for every query: these tests pin them (FIX-04 round 2, finding 2).
 */

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-10-03T12:00:00.000Z'));
});

afterEach(() => {
  jest.useRealTimers();
});

const failWith = (kind: ApiErrorKind, status: number) => new ApiError(kind, status, 'No.');

/** Runs one query the way a screen does (an observer, so the client's retry rule applies) until it settles. */
async function attemptsFor(error: unknown) {
  const client = createQueryClient();
  const queryFn = jest.fn(async () => {
    throw error;
  });
  const observer = new QueryObserver(client, { queryKey: ['defaults', String(Math.random())], queryFn });
  const unsubscribe = observer.subscribe(() => undefined);
  await jest.advanceTimersByTimeAsync(60_000);
  const result = observer.getCurrentResult();
  unsubscribe();
  return { attempts: queryFn.mock.calls.length, status: result.status };
}

describe('the app-wide query defaults', () => {
  it('an answer stays fresh for 30 seconds: read again within 30 s it comes from the cache, after that it is fetched again', async () => {
    const client = createQueryClient();
    const queryFn = jest.fn(async () => 'answer');
    const read = () => client.fetchQuery({ queryKey: ['defaults', 'fresh'], queryFn });

    await read();
    jest.setSystemTime(new Date('2026-10-03T12:00:29.000Z'));
    await read();
    expect(queryFn).toHaveBeenCalledTimes(1);

    jest.setSystemTime(new Date('2026-10-03T12:00:31.000Z'));
    await read();
    expect(queryFn).toHaveBeenCalledTimes(2);
  });

  it.each([
    ['network', 0],
    ['server', 500],
    ['server', 503],
  ] as const)('a %s failure (%i) is tried again at most twice: three tries in all, then the error', async (kind, status) => {
    await expect(attemptsFor(failWith(kind, status))).resolves.toEqual({ attempts: 3, status: 'error' });
  });

  it.each([
    ['unauthorized', 401],
    ['forbidden', 403],
    ['not_found', 404],
    ['conflict', 409],
    ['validation', 422],
    ['rate_limited', 429],
    ['unknown', 418],
  ] as const)('a %s answer (%i) is final: one try, never repeated', async (kind, status) => {
    await expect(attemptsFor(failWith(kind, status))).resolves.toEqual({ attempts: 1, status: 'error' });
  });

  it('a failure that is not an API error (a thrown TypeError) is tried again at most twice, like a lost connection', async () => {
    await expect(attemptsFor(new TypeError('Network request failed'))).resolves.toEqual({ attempts: 3, status: 'error' });
  });

  it.each([
    ['network', 0],
    ['server', 500],
  ] as const)('a mutation is never tried again, even after a %s failure (%i)', async (kind, status) => {
    const client = createQueryClient();
    const mutationFn = jest.fn(async () => {
      throw failWith(kind, status);
    });
    const observer = new MutationObserver(client, { mutationFn });
    const done = observer.mutate().catch((error: unknown) => error);
    await jest.advanceTimersByTimeAsync(60_000);
    await expect(done).resolves.toMatchObject({ kind });
    expect(mutationFn).toHaveBeenCalledTimes(1);
    expect(observer.getCurrentResult().status).toBe('error');
  });
});
