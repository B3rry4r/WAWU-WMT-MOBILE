jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

/* eslint-disable @typescript-eslint/no-require-imports */
// The API client keeps the fetch it finds when it loads, so the stand-in goes in first and each test sets what it answers.
let answer: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response> = () => new Promise<Response>(() => undefined);
globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => answer(input, init)) as typeof fetch;
const { uploadVoiceSample } = require('../voiceApi') as typeof import('../voiceApi');

/** VF10a (R2-AUTHME3): an upload whose host never answers must end in a sentence, not in a spinner. */
const FILE = { uri: 'blob:take-1', contentType: 'audio/mp4', extension: 'm4a' };
const presigned = () =>
  new Response(JSON.stringify({ statusCode: 201, message: 'OK', data: { uploadUrl: 'https://files.test/put', fileUrl: 'voice/sample/u1/a.m4a' } }), {
    status: 201,
    headers: { 'content-type': 'application/json' },
  });

afterEach(() => jest.useRealTimers());

describe('uploadVoiceSample waits only so long', () => {
  it('a storage host that never takes the bytes ends in the failed-upload sentence after a minute', async () => {
    jest.useFakeTimers();
    answer = (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input instanceof Request ? input.url : String(input);
      if (url === 'blob:take-1') return Promise.resolve({ blob: async () => ({ size: 3 }) } as unknown as Response);
      if (url === 'https://files.test/put') {
        return new Promise<Response>((_, reject) => init?.signal?.addEventListener('abort', () => reject(new Error('aborted'))));
      }
      return Promise.resolve(presigned());
    };
    const caught = uploadVoiceSample(FILE).catch((error: unknown) => error);
    await jest.advanceTimersByTimeAsync(120_000);
    expect(await caught).toMatchObject({ code: 'upload_failed', message: 'Your recording is taking too long to upload. Check your connection and try again.' });
  });

  it('a take that the browser never hands over ends in "We could not read your recording"', async () => {
    jest.useFakeTimers();
    answer = () => new Promise<Response>(() => undefined);
    const caught = uploadVoiceSample(FILE).catch((error: unknown) => error);
    await jest.advanceTimersByTimeAsync(60_000);
    expect(await caught).toMatchObject({ code: 'upload_failed', message: 'We could not read your recording. Record it again.' });
  });
});
