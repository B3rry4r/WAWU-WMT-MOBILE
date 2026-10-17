/* eslint-disable @typescript-eslint/no-require-imports */
import http from 'node:http';
import type { AddressInfo } from 'node:net';

/**
 * FIX-51: what an ID or address upload really puts on the wire. The Hub's documents route is an HTTP server on
 * 127.0.0.1 that reads the request the way the real one does (multipart, `kind` and `file` parts). The app side is the
 * real thing end to end: the real `api` client (openapi-fetch and its sign-in middleware) and the real `uploadDocument`.
 * Only the transport is swapped: jest's global `fetch` is Expo's native one and reaches no socket, so a small
 * `fetch` hands each request to node's `http`. Nothing is mocked above that, which is what the unit tests with a
 * mocked client could not see: openapi-fetch skips the body serializer when `body` is undefined, so the upload
 * used to leave the app empty and the Hub answered "Say which document this is".
 */
jest.mock('expo-secure-store', () => {
  const vault = new Map<string, string>();
  return {
    getItemAsync: jest.fn(async (key: string) => vault.get(key) ?? null),
    setItemAsync: jest.fn(async (key: string, value: string) => {
      vault.set(key, value);
    }),
    deleteItemAsync: jest.fn(async (key: string) => {
      vault.delete(key);
    }),
  };
});

// FIX-48's setup points '@/api/env' at a closed port; this test needs its own address, so it mocks '@/api/env' itself
// (the way jest.network-guard.js says to). The address is read when the client is first loaded, after beforeAll set it.
jest.mock('@/api/env', () => ({
  get apiBaseUrl() {
    return process.env.EXPO_PUBLIC_API_URL as string;
  },
  identityBaseUrl: 'http://localhost:9',
}));

type Seen = { method: string; path: string; headers: http.IncomingHttpHeaders; bytes: number };
type Part = { key: string; value?: string; name?: string; type?: string; size?: number };

const documentsView = {
  required: true,
  open: true,
  documents: [
    { kind: 'identity', state: 'confirming', sides: ['front'], uploadedAt: null },
    { kind: 'proof_of_address', state: 'missing', sides: [], uploadedAt: null },
  ],
  submitted: false,
  waitingFor: ['proof_of_address'],
  maxBytes: 10485760,
  acceptedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
};

let seen: Seen[] = [];
let parts: Part[][] = [];
let server: http.Server;
const realFetch = globalThis.fetch;

/** The Hub's reading of the documents route: no `kind` part is the 400 the Hub gives an empty request. */
async function hubAnswer(headers: http.IncomingHttpHeaders, body: Buffer): Promise<{ status: number; json: unknown }> {
  let form: FormData | null = null;
  const type = String(headers['content-type'] ?? '');
  if (body.length > 0 && type.startsWith('multipart/form-data')) {
    try {
      form = (await new Response(new Uint8Array(body), { headers: { 'content-type': type } }).formData()) as unknown as FormData;
    } catch {
      form = null;
    }
  }
  const list: Part[] = [];
  form?.forEach((value, key) => {
    list.push(typeof value === 'string' ? { key, value } : { key, name: (value as File).name, type: (value as File).type, size: (value as File).size });
  });
  parts.push(list);
  const kind = form?.get('kind');
  if (kind !== 'identity' && kind !== 'proof_of_address') {
    const message = 'Say which document this is: identity or proof_of_address.';
    return { status: 400, json: { statusCode: 400, message, reason: { code: 'document_request_invalid', message } } };
  }
  return { status: 200, json: { statusCode: 200, message: 'OK', data: documentsView } };
}

beforeAll(async () => {
  server = http.createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', async () => {
      const body = Buffer.concat(chunks);
      seen.push({ method: req.method ?? '', path: req.url ?? '', headers: req.headers, bytes: body.length });
      const answer = await hubAnswer(req.headers, body);
      res.writeHead(answer.status, { 'content-type': 'application/json' });
      res.end(JSON.stringify(answer.json));
    });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  // Set before the client module is first loaded: it reads the address and the global fetch when it is created.
  process.env.EXPO_PUBLIC_API_URL = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(String(input), init);
    const body = Buffer.from(await request.arrayBuffer());
    const url = new URL(request.url);
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });
    return new Promise<Response>((resolve, reject) => {
      const out = http.request({ host: url.hostname, port: url.port, path: url.pathname + url.search, method: request.method, headers }, (res) => {
        const reply: Buffer[] = [];
        res.on('data', (chunk: Buffer) => reply.push(chunk));
        res.on('end', () => resolve(new Response(new Uint8Array(Buffer.concat(reply)), { status: res.statusCode, headers: { 'content-type': String(res.headers['content-type'] ?? '') } })));
      });
      out.on('error', reject);
      out.end(body);
    });
  }) as typeof fetch;
  const vault = require('expo-secure-store') as { setItemAsync: (key: string, value: string) => Promise<void> };
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  await vault.setItemAsync('wawu.session.access', `${part({ alg: 'RS256' })}.${part({ sub: '00000000-0000-4000-8000-000000000051' })}.signature`);
  await vault.setItemAsync('wawu.session.refresh', 'refresh-51');
});

afterAll(async () => {
  globalThis.fetch = realFetch;
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

beforeEach(() => {
  seen = [];
  parts = [];
});

const documents = () => require('../api/documents') as typeof import('../api/documents');
const picked = (name: string, contentType: string, bytes: number[]) => ({ blob: new Blob([new Uint8Array(bytes)], { type: contentType }), name, contentType });

describe('the upload on the wire (real client, local Hub on 127.0.0.1)', () => {
  it('sends an ID with both sides as one multipart request carrying kind, file and file_back', async () => {
    const view = await documents().uploadDocument('identity', picked('front.jpg', 'image/jpeg', [1, 2, 3, 4]), picked('back.png', 'image/png', [5, 6, 7]));

    expect(seen).toHaveLength(1);
    expect(seen[0].method).toBe('POST');
    expect(seen[0].path).toBe('/api/hub/money/identity/documents');
    expect(String(seen[0].headers['content-type'])).toMatch(/^multipart\/form-data; boundary=\S+/);
    expect(seen[0].bytes).toBeGreaterThan(7);
    expect(String(seen[0].headers.authorization)).toMatch(/^Bearer \S+/);
    expect(parts[0]).toEqual([
      { key: 'kind', value: 'identity' },
      { key: 'file', name: 'front.jpg', type: 'image/jpeg', size: 4 },
      { key: 'file_back', name: 'back.png', type: 'image/png', size: 3 },
    ]);
    // The answer is read the way the screens read it.
    expect(view.documents.map((row) => [row.kind, row.state])).toEqual([
      ['identity', 'confirming'],
      ['proof_of_address', 'missing'],
    ]);
  });

  it('sends a proof of address as one multipart request carrying kind and file', async () => {
    await documents().uploadDocument('proof_of_address', picked('bill.pdf', 'application/pdf', [9, 9, 9, 9, 9]));

    expect(seen).toHaveLength(1);
    expect(String(seen[0].headers['content-type'])).toMatch(/^multipart\/form-data; boundary=\S+/);
    expect(parts[0]).toEqual([
      { key: 'kind', value: 'proof_of_address' },
      { key: 'file', name: 'bill.pdf', type: 'application/pdf', size: 5 },
    ]);
  });

  it('is not the empty request the Hub refuses: no 400 "Say which document this is" for a well-formed upload', async () => {
    await expect(documents().uploadDocument('identity', picked('front.jpg', 'image/jpeg', [1, 2]))).resolves.toBeDefined();
    expect(seen[0].bytes).toBeGreaterThan(0);
    expect(parts[0].map((part) => part.key)).toEqual(['kind', 'file']);
  });
});
