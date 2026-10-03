/* eslint-disable @typescript-eslint/no-require-imports */
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * The app's sign-in calls follow WAWU ID's published contract (AUTH-05,
 * BACKEND_GAPS G-5): `contract/identity/openapi.json`, copied from wawu-id by
 * `npm run api -- --identity ../wawu-id`, with `src/api/identity.generated.ts`
 * generated from it. A user can sign in, stay signed in and ask for a reset
 * link only if what the app sends is what the server takes.
 */
type Schema = {
  $ref?: string;
  type?: string;
  enum?: string[];
  required?: string[];
  properties?: Record<string, Schema>;
};
type Operation = {
  operationId: string;
  requestBody?: { content: { 'application/json': { schema: Schema } } };
  responses: Record<string, { content?: { 'application/json': { schema: Schema } } }>;
};

const root = join(__dirname, '..', '..');
const contract = JSON.parse(readFileSync(join(root, 'contract', 'identity', 'openapi.json'), 'utf8')) as {
  paths: Record<string, Record<string, Operation>>;
  components: { schemas: Record<string, Schema> };
};
const generated = readFileSync(join(root, 'src', 'api', 'identity.generated.ts'), 'utf8');

const resolve = (schema: Schema): Schema =>
  schema.$ref ? resolve(contract.components.schemas[schema.$ref.replace('#/components/schemas/', '')]) : schema;

/** Is `value` what `schema` describes (required keys, no others, types, enums)? Returns the first problem. */
function problem(value: unknown, schema: Schema, at = 'body'): string | null {
  const s = resolve(schema);
  if (s.enum && !s.enum.includes(value as string)) return `${at} is not one of ${s.enum.join(', ')}`;
  if (s.type === 'string' && typeof value !== 'string') return `${at} is not a string`;
  if (s.type === 'number' && typeof value !== 'number') return `${at} is not a number`;
  if (s.type === 'object' || s.properties) {
    if (typeof value !== 'object' || value === null) return `${at} is not an object`;
    const props = s.properties ?? {};
    for (const key of s.required ?? []) if (!(key in value)) return `${at}.${key} is missing`;
    for (const [key, v] of Object.entries(value)) {
      if (!props[key]) return `${at}.${key} is not in the contract`;
      const inner = problem(v, props[key], `${at}.${key}`);
      if (inner) return inner;
    }
  }
  return null;
}

/** An answer built from the contract: every required key, typed as the contract says. */
function sample(schema: Schema): unknown {
  const s = resolve(schema);
  if (s.enum) return s.enum[0];
  if (s.type === 'string') return 'x';
  if (s.type === 'number') return 1;
  if (s.type === 'boolean') return true;
  return Object.fromEntries((s.required ?? []).map((k) => [k, sample((s.properties ?? {})[k])]));
}

let sent: { path: string; method: string; body: unknown }[] = [];
let answer: (path: string) => unknown;

function boot() {
  jest.resetModules();
  sent = [];
  globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    sent.push({ path: url.pathname, method: (init?.method ?? 'GET').toLowerCase(), body: JSON.parse(String(init?.body)) });
    return new Response(JSON.stringify(answer(url.pathname)), { status: 200, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;
  return require('@/api/identity') as typeof import('@/api/identity');
}

const okAnswer = (path: string) => {
  const op = contract.paths[path].post;
  return sample(op.responses['200'].content!['application/json'].schema);
};

describe("WAWU ID's published contract and the app's sign-in calls", () => {
  beforeEach(() => {
    answer = okAnswer;
  });

  it.each([
    ['sign in', '/auth/login', (id: ReturnType<typeof boot>) => id.loginRequest('ada@example.test', 'a-long-password')],
    ['stay signed in', '/auth/refresh', (id: ReturnType<typeof boot>) => id.refreshRequest('refresh-1')],
    ['ask for a reset link', '/auth/forgot-password', (id: ReturnType<typeof boot>) => id.forgotPasswordRequest('ada@example.test')],
  ])('a user can %s: the app sends exactly the body the contract takes', async (_name, path, run) => {
    const identity = boot();
    await run(identity);
    expect(sent).toHaveLength(1);
    expect(sent[0].method).toBe('post');
    expect(sent[0].path).toBe(path);
    const op = contract.paths[path]?.post;
    expect(op).toBeDefined();
    expect(problem(sent[0].body, op.requestBody!.content['application/json'].schema)).toBeNull();
  });

  it("reads the contract's sign-in and refresh answers into a session", async () => {
    const identity = boot();
    const login = okAnswer('/auth/login') as { data: { accessToken: string; refreshToken: string } };
    await expect(identity.loginRequest('ada@example.test', 'pw')).resolves.toEqual({
      accessToken: login.data.accessToken,
      refreshToken: login.data.refreshToken,
    });
    await expect(identity.refreshRequest('r')).resolves.toEqual({ accessToken: 'x', refreshToken: 'x' });
  });

  it('reads the reset link lifetime the contract describes, and none when it is absent', async () => {
    const identity = boot();
    answer = () => ({ data: { message: 'x', expiresInSeconds: 3600 } });
    expect(problem(answer('/auth/forgot-password'), contract.paths['/auth/forgot-password'].post.responses['200'].content!['application/json'].schema)).toBeNull();
    await expect(identity.forgotPasswordRequest('a@b.test')).resolves.toEqual({ expiresInSeconds: 3600 });
    answer = okAnswer;
    await expect(identity.forgotPasswordRequest('a@b.test')).resolves.toEqual({ expiresInSeconds: null });
  });

  it('has its generated types made from this contract (every operation, by name)', () => {
    const ids = Object.values(contract.paths).flatMap((item) => Object.values(item).map((op) => op.operationId));
    expect(ids).toEqual(expect.arrayContaining(['login', 'refresh', 'forgotPassword', 'signup', 'phoneVerifyConfirm', 'signupResume', 'signupProgress']));
    for (const id of ids) expect(generated).toContain(`operations["${id}"]`);
    const named = [...generated.matchAll(/operations\["(\w+)"\]/g)].map((m) => m[1]);
    expect(new Set(named)).toEqual(new Set(ids));
    expect(readFileSync(join(root, 'contract', 'identity', 'SOURCE_COMMIT'), 'utf8').trim()).not.toBe('');
  });
});
