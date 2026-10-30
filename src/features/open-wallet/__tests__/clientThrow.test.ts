/* eslint-disable @typescript-eslint/no-require-imports */
// WALK-FIX H4: the wallet-opening screens' own `send` wrappers told ANY throw as "No connection" (the OPEN-UPLOAD class). A real network
// failure still is; a throw on the phone is its own error with its own line.
const mockApi = { GET: jest.fn(), POST: jest.fn() };
jest.mock('@/api/client', () => ({ api: mockApi, unwrap: jest.fn() }));

const CLIENT_LINE = 'Something went wrong on this phone. Try again, and if it keeps happening, tell us.';
const documents = require('@/features/open-wallet/api/documents') as typeof import('@/features/open-wallet/api/documents');
const { sendFailure, DOCUMENTS_FALLBACK_TITLE } = require('@/features/open-wallet/documentCopy') as typeof import('@/features/open-wallet/documentCopy');

const file = { blob: new Blob(['x'], { type: 'image/jpeg' }), contentType: 'image/jpeg', name: 'front.jpg' } as unknown as Parameters<typeof documents.uploadDocument>[1];

beforeEach(() => jest.spyOn(console, 'error').mockImplementation(() => undefined));
afterEach(() => jest.restoreAllMocks());

describe('the documents wrapper', () => {
  it('a throw that is not a network failure is kind client, logged, and the screen shows the client line, not No connection', async () => {
    mockApi.POST.mockRejectedValueOnce(new TypeError("Cannot read property 'uri' of undefined"));
    const failure = await documents.uploadDocument('identity', file).catch((error: unknown) => error);
    expect(failure).toMatchObject({ name: 'ApiError', kind: 'client', message: CLIENT_LINE });
    expect(console.error).toHaveBeenCalledTimes(1);
    expect(sendFailure(failure, DOCUMENTS_FALLBACK_TITLE)).toEqual({ title: DOCUMENTS_FALLBACK_TITLE, body: CLIENT_LINE });
  });

  it('a real network failure is still No connection', async () => {
    mockApi.POST.mockRejectedValueOnce(new TypeError('Network request failed'));
    const failure = await documents.uploadDocument('identity', file).catch((error: unknown) => error);
    expect(failure).toMatchObject({ kind: 'network', message: 'No connection. Check your internet and try again.' });
    expect(sendFailure(failure, DOCUMENTS_FALLBACK_TITLE).title).toBe('No connection');
    expect(console.error).not.toHaveBeenCalled();
  });
});
