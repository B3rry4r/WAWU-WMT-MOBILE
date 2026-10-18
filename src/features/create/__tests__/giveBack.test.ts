import { ApiError } from '@/api/errors';

const mockRelease = jest.fn<Promise<void>, [string]>();
jest.mock('../api', () => ({ releaseUpload: (key: string) => mockRelease(key) }));
jest.mock('@/api/session', () => ({ onSessionEnd: jest.fn() }));

const draft = require('../draft') as typeof import('../draft');
const file = { key: 'content/full/u1/a.pdf' } as never;

const busy = (status: number, retryAfter: number | null) => new ApiError(status === 429 ? 'rate_limited' : 'server', status, 'Try again in a moment.', undefined, retryAfter);
const flush = async () => {
  for (let i = 0; i < 6; i += 1) await Promise.resolve();
};

beforeEach(() => {
  jest.useFakeTimers();
  mockRelease.mockReset();
  draft.abandonDraft();
  mockRelease.mockReset();
});
afterEach(() => {
  jest.useRealTimers();
});

/** SWEEP-APP-4 row 80: a release the Hub is too busy to take is asked again after the wait it named. */
describe('giving a file back to the Hub', () => {
  it('asks again after the Retry-After the Hub named when the first release is refused as busy (429)', async () => {
    mockRelease.mockRejectedValueOnce(busy(429, 3)).mockResolvedValueOnce(undefined);
    draft.setFull(file);
    draft.setFull(null);
    await flush();
    expect(mockRelease).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(2900);
    expect(mockRelease).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(200);
    expect(mockRelease).toHaveBeenCalledTimes(2);
    expect(mockRelease).toHaveBeenLastCalledWith('content/full/u1/a.pdf');
    await jest.advanceTimersByTimeAsync(60_000);
    expect(mockRelease).toHaveBeenCalledTimes(2);
  });

  it('waits the fallback when the Hub names no wait, and never longer than the cap', async () => {
    mockRelease.mockRejectedValueOnce(busy(503, null)).mockRejectedValueOnce(busy(429, 600)).mockResolvedValueOnce(undefined);
    draft.setFull(file);
    draft.setFull(null);
    await flush();
    await jest.advanceTimersByTimeAsync(draft.RELEASE_FALLBACK_WAIT_S * 1000);
    expect(mockRelease).toHaveBeenCalledTimes(2);
    await jest.advanceTimersByTimeAsync(draft.RELEASE_MAX_WAIT_S * 1000);
    expect(mockRelease).toHaveBeenCalledTimes(3);
  });

  it('gives up after three tries, and does not retry a refusal that is not about being busy', async () => {
    mockRelease.mockRejectedValue(busy(429, 1));
    draft.setFull(file);
    draft.setFull(null);
    await flush();
    await jest.advanceTimersByTimeAsync(60_000);
    expect(mockRelease).toHaveBeenCalledTimes(draft.RELEASE_TRIES);

    mockRelease.mockReset();
    mockRelease.mockRejectedValue(new ApiError('validation', 400, 'No such file.'));
    draft.setFull(file);
    draft.setFull(null);
    await flush();
    await jest.advanceTimersByTimeAsync(60_000);
    expect(mockRelease).toHaveBeenCalledTimes(1);
  });
});
