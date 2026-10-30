/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * OPEN-UPLOAD: what an ID or a bill upload does on the phone's own network layer.
 *
 * On the phone the app's `fetch` is Expo's (`expo/fetch`, installed by `expo`'s winter runtime), not React Native's.
 * Expo's fetch turns a `FormData` into bytes in JavaScript (`convertFormDataAsync`), and it cannot read a part that is
 * React Native's `{ uri, name, type }`: it throws "Unsupported FormDataPart implementation" before anything is sent.
 * The app mapped that throw to "No connection", and the owner's Android build (29 Oct 2026) never put one document on
 * the wire. Jest's own `FormData` is Node's, which turns a `{ uri }` object into the text "[object Object]" and so
 * never saw it either.
 *
 * So this test builds the phone's runtime: React Native's `FormData` with Expo's patch (what `expo` installs on the
 * phone), Expo's real `fetch` and its real form conversion, and `Platform.OS` set to android. Only the last step is a
 * stand-in, the native request that would hit the network: it records the URL, the headers and the body bytes.
 */
import type { PickedFile } from '../documents/types';

const mockThrown: string[] = [];
const mockStarted: { url: string; headers: [string, string][]; method?: string; body: Uint8Array | null }[] = [];

const view = {
  required: true,
  open: true,
  documents: [
    { kind: 'identity', state: 'confirming', sides: ['front', 'back'], uploadedAt: null },
    { kind: 'proof_of_address', state: 'missing', sides: [], uploadedAt: null },
  ],
  selfie: 'not_used',
  submitted: false,
  waitingFor: ['proof_of_address'],
  maxBytes: 10485760,
  acceptedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
};

/** The phone's client: the form the app builds goes through Expo's real `fetch`; the answer is the Hub's. */
jest.mock('@/api/client', () => ({
  api: {
    POST: async (path: string, options: { body: unknown; bodySerializer: (body: unknown) => FormData }) => {
      const { fetch: expoFetch } = require('expo/fetch') as typeof import('expo/fetch');
      const form = options.bodySerializer(options.body);
      try {
        // openapi-fetch hands `fetch` a Request; on the phone the global one is React Native's (whatwg-fetch), which keeps the form as `_bodyInit`.
        await expoFetch(new Request(`http://hub.test${path}`, { method: 'POST', body: form }) as never);
      } catch (error) {
        // The client's `onError` makes every throw of the transport the same "No connection" failure.
        const { networkError } = require('@/api/errors') as typeof import('@/api/errors');
        mockThrown.push(String(error));
        throw networkError();
      }
      return { data: { statusCode: 200, message: 'OK', data: view }, response: { ok: true, status: 200 } };
    },
    GET: jest.fn(),
  },
}));

beforeAll(() => {
  // What `expo`'s winter runtime does on the phone: React Native's FormData, patched, is the global one.
  const RNFormData = require('react-native/Libraries/Network/FormData').default as typeof FormData;
  const { installFormDataPatch } = jest.requireActual('expo/src/winter/FormData') as { installFormDataPatch: (form: typeof FormData) => unknown };
  installFormDataPatch(RNFormData);
  globalThis.FormData = RNFormData;
  globalThis.Request = (require('whatwg-fetch') as { Request: typeof Request }).Request;
  const { Platform } = require('react-native') as typeof import('react-native');
  Platform.OS = 'android';
  const { ExpoFetchModule } = require('expo/src/winter/fetch/ExpoFetchModule') as { ExpoFetchModule: { NativeRequest: { prototype: { start: unknown } } } };
  ExpoFetchModule.NativeRequest.prototype.start = async function start(url: string, init: { headers: [string, string][]; method?: string }, body: Uint8Array | null) {
    mockStarted.push({ url, headers: init.headers, method: init.method, body });
  };
});

beforeEach(() => {
  mockStarted.length = 0;
  mockThrown.length = 0;
});

// Expo's fetch must take the form as it is: a throw there is what the app used to show as "No connection".
afterEach(() => {
  expect(mockThrown).toEqual([]);
});

const documents = () => require('../api/documents') as typeof import('../api/documents');

/** A file the way the phone's picker holds it: the bytes in memory and the app's own copy on disk (a file uri). */
function onPhone(name: string, contentType: string, bytes: number[], blobType = contentType): PickedFile {
  return { blob: new Blob([new Uint8Array(bytes)], { type: blobType }), name, contentType, uri: `file:///data/user/0/africa.wawu/cache/ImageManipulator/${name}` };
}

const text = (body: Uint8Array | null) => Buffer.from(body ?? new Uint8Array()).toString('latin1');

describe('the upload through the phone\'s own fetch (Expo), Platform.OS android', () => {
  it('sends an ID with both sides as one multipart request: kind, file and file_back, each with its name, type and bytes', async () => {
    const answer = await documents().uploadDocument(
      'identity',
      onPhone('id-front.jpg', 'image/jpeg', [0xff, 0xd8, 0x01, 0x02, 0x03, 0xff, 0xd9]),
      onPhone('id-back.png', 'image/png', [0x89, 0x50, 0x4e, 0x47, 0x0a]),
    );

    expect(answer.documents.map((row) => row.kind)).toEqual(['identity', 'proof_of_address']);
    expect(mockStarted).toHaveLength(1);
    const request = mockStarted[0];
    expect(request.method).toBe('POST');
    const type = request.headers.find(([key]) => key.toLowerCase() === 'content-type')?.[1] ?? '';
    expect(type).toMatch(/^multipart\/form-data; boundary=\S+/);
    const body = text(request.body);
    expect(body).toMatch(/content-disposition: form-data; name="kind"\r\n\r\nidentity\r\n/i);
    expect(body).toMatch(/name="file"; filename="id-front\.jpg"\r\ncontent-type: image\/jpeg\r\n\r\n\xff\xd8\x01\x02\x03\xff\xd9\r\n/i);
    expect(body).toMatch(/name="file_back"; filename="id-back\.png"\r\ncontent-type: image\/png\r\n\r\n\x89PNG\n\r\n/i);
  });

  it('sends a bill (a PDF from the phone\'s files) as one multipart request with its bytes', async () => {
    await documents().uploadDocument('proof_of_address', onPhone('proof-of-address.pdf', 'application/pdf', [0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]));

    expect(mockStarted).toHaveLength(1);
    const body = text(mockStarted[0].body);
    expect(body).toMatch(/name="kind"\r\n\r\nproof_of_address\r\n/);
    expect(body).toMatch(/name="file"; filename="proof-of-address\.pdf"\r\ncontent-type: application\/pdf\r\n\r\n%PDF-1\r\n/i);
  });

  it('names the file\'s type from the picker, not from whatever the file read gave the bytes', async () => {
    // The phone's file read answers a guess from the file name; the part must carry the type the app checked and the Hub takes.
    await documents().uploadDocument('proof_of_address', onPhone('proof-of-address.pdf', 'application/pdf', [1, 2, 3], 'application/octet-stream'));

    expect(text(mockStarted[0].body)).toMatch(/filename="proof-of-address\.pdf"\r\ncontent-type: application\/pdf\r\n/i);
    expect(text(mockStarted[0].body)).not.toMatch(/octet-stream/i);
  });
});
