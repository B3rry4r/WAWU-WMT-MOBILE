import { forgetSignupChannel, knownSignupChannel, signupChannel } from '@/features/auth/signupFlow';

/** SWEEP-AUTH AUTH-07 N-2: what a newly mounted A3 draws first is the latest ask's answer, never a late answer to an earlier one. */
const mockRequest = jest.fn();
jest.mock('@/api/identity', () => ({ ...jest.requireActual('@/api/identity'), signupChannelRequest: (...args: unknown[]) => mockRequest(...args) }));

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

beforeEach(() => {
  mockRequest.mockReset();
  forgetSignupChannel();
});

describe('signupChannel', () => {
  it('N-2: a late answer to an earlier ask does not replace the latest ask\'s answer', async () => {
    const first = deferred<'phone' | 'email' | null>();
    const second = deferred<'phone' | 'email' | null>();
    mockRequest.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const earlier = signupChannel();
    const later = signupChannel();
    second.resolve('email');
    expect(await later).toBe('email');
    expect(knownSignupChannel()).toBe('email');
    first.resolve('phone');
    // the earlier caller still gets its own answer; the module keeps the latest
    expect(await earlier).toBe('phone');
    expect(knownSignupChannel()).toBe('email');
  });

  it('N-2: a late failure of an earlier ask does not clear the latest ask\'s answer', async () => {
    const first = deferred<'phone' | 'email' | null>();
    mockRequest.mockReturnValueOnce(first.promise).mockResolvedValueOnce('phone');
    const earlier = signupChannel();
    await signupChannel();
    first.reject(new Error('late'));
    expect(await earlier).toBeNull();
    expect(knownSignupChannel()).toBe('phone');
  });

  it('keeps the single-ask behaviour: the answer is kept, and a failed ask clears it', async () => {
    mockRequest.mockResolvedValueOnce('email').mockRejectedValueOnce(new Error('down'));
    expect(await signupChannel()).toBe('email');
    expect(knownSignupChannel()).toBe('email');
    expect(await signupChannel()).toBeNull();
    expect(knownSignupChannel()).toBeNull();
  });

  it('an ask still on its way when the channel is forgotten does not set it back', async () => {
    const pending = deferred<'phone' | 'email' | null>();
    mockRequest.mockReturnValueOnce(pending.promise);
    const ask = signupChannel();
    forgetSignupChannel();
    pending.resolve('email');
    await ask;
    expect(knownSignupChannel()).toBeNull();
  });
});
