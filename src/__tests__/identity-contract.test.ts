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
    sent.push({ path: url.pathname, method: (init?.method ?? 'GET').toLowerCase(), body: init?.body ? JSON.parse(String(init.body)) : undefined });
    return new Response(JSON.stringify(answer(url.pathname)), { status: 200, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;
  return require('@/api/identity') as typeof import('@/api/identity');
}

const okAnswer = (path: string) => {
  const op = contract.paths[path].post ?? contract.paths[path].get;
  return sample((op.responses['200'] ?? op.responses['201']).content!['application/json'].schema);
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
    expect(ids).toEqual(expect.arrayContaining(['login', 'refresh', 'forgotPassword', 'signup', 'phoneVerifyConfirm', 'signupEmailCodeStart', 'signupEmailCodeConfirm', 'signupResume', 'signupProgress', 'signupChannel']));
    for (const id of ids) expect(generated).toContain(`operations["${id}"]`);
    const named = [...generated.matchAll(/operations\["(\w+)"\]/g)].map((m) => m[1]);
    expect(new Set(named)).toEqual(new Set(ids));
    expect(readFileSync(join(root, 'contract', 'identity', 'SOURCE_COMMIT'), 'utf8').trim()).not.toBe('');
  });
});

describe("WAWU ID's published contract and the app's sign-up calls (AUTH-04)", () => {
  const token = 'access-token-1';
  const calls: [string, string, string, (id: ReturnType<typeof boot>) => Promise<unknown>][] = [
    ['start a sign-up', 'post', '/auth/signup', (id) => id.signupRequest({ email: 'ada@example.test', phone: '08031234412', password: 'a-long-password', accountType: 'creator' })],
    ['ask for another code', 'post', '/auth/phone/verify/start', (id) => id.phoneVerifyStartRequest({ phone: '+2348031234412', attempt: 'secret' })],
    ['confirm the phone code', 'post', '/auth/phone/verify/confirm', (id) => id.phoneVerifyConfirmRequest({ phone: '+2348031234412', attempt: 'secret', code: '481902', emailCode: '123456' })],
    ['ask for another mailed code (AUTH-07)', 'post', '/auth/signup/email-code/start', (id) => id.signupEmailCodeStartRequest({ phone: '+2348031234412', attempt: 'secret' })],
    ['confirm the mailed code (AUTH-07)', 'post', '/auth/signup/email-code/confirm', (id) => id.signupEmailCodeConfirmRequest({ phone: '+2348031234412', attempt: 'secret', code: '481902' })],
    ['know which way the code will travel (AUTH-07 round 3)', 'get', '/auth/signup/channel', (id) => id.signupChannelRequest()],
    ['resume a sign-up', 'post', '/auth/signup/resume', (id) => id.signupResumeRequest({ phone: '+2348031234412', attempt: 'secret' })],
    ['read the sign-up progress', 'get', '/auth/signup/progress', (id) => id.signupProgressRequest(token)],
    ['put the email step off', 'post', '/auth/signup/progress', (id) => id.signupCompleteStepRequest(token, 'email')],
    ['have the email code mailed', 'post', '/auth/signup/email/start', (id) => id.signupEmailStartRequest(token)],
    ['prove the email', 'post', '/auth/signup/email/confirm', (id) => id.signupEmailConfirmRequest(token, '123456')],
  ];

  beforeEach(() => {
    answer = okAnswer;
  });

  it.each(calls)('a user can %s: the app sends the method and body the contract takes', async (_name, method, path, run) => {
    const identity = boot();
    await run(identity);
    expect(sent).toHaveLength(1);
    expect(sent[0].method).toBe(method);
    expect(sent[0].path).toBe(path);
    const op = contract.paths[path]?.[method];
    expect(op).toBeDefined();
    if (op.requestBody) expect(problem(sent[0].body, op.requestBody.content['application/json'].schema)).toBeNull();
    else expect(sent[0].body).toBeUndefined();
  });

  it('reads the channel the contract describes, and none for a value it does not know', async () => {
    const identity = boot();
    const schema = contract.components.schemas.SignupChannelSchema.properties!.channel;
    expect(schema.enum).toEqual(['phone', 'email']);
    for (const channel of ['phone', 'email']) {
      answer = () => ({ data: { channel } });
      await expect(identity.signupChannelRequest()).resolves.toBe(channel);
    }
    for (const channel of ['sms', 'both', '', 7, null]) {
      answer = () => ({ data: { channel } });
      await expect(identity.signupChannelRequest()).resolves.toBeNull();
    }
    answer = () => ({});
    await expect(identity.signupChannelRequest()).resolves.toBeNull();
  });

  it('reads that a mailed sign-up was made without the number typed, and says nothing otherwise', async () => {
    const identity = boot();
    const base = { phone: '+2348031234412', attempt: 'secret', expiresIn: 600, resendIn: 60, emailCodeRequired: false, channel: 'email', maskedEmail: 'a•••@example.test' };
    answer = () => ({ data: { ...base, phoneNotSaved: true } });
    await expect(identity.signupRequest({ email: 'a@b.test', phone: '08031234412', password: 'a-long-password' })).resolves.toMatchObject({ phoneNotSaved: true });
    for (const phoneNotSaved of [undefined, false, 'true', 1]) {
      answer = () => ({ data: { ...base, phoneNotSaved } });
      const out = await identity.signupRequest({ email: 'a@b.test', phone: '08031234412', password: 'a-long-password' });
      expect(out).not.toHaveProperty('phoneNotSaved');
    }
  });

  it('refuses an answer that lacks what the screens use', async () => {
    const identity = boot();
    answer = () => ({ data: {} });
    await expect(identity.signupRequest({ email: 'a@b.test', phone: '08031234412', password: 'a-long-password' })).rejects.toThrow();
    await expect(identity.signupProgressRequest(token)).rejects.toThrow();
    await expect(identity.signupEmailStartRequest(token)).rejects.toThrow();
  });

  it('sends the access token as a Bearer header on the signed-in sign-up calls only', async () => {
    const identity = boot();
    const seen: (string | null)[] = [];
    const inner = globalThis.fetch;
    globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      seen.push(new Headers(init?.headers).get('authorization'));
      return inner(input, init);
    }) as typeof fetch;
    await identity.signupProgressRequest(token);
    await identity.signupRequest({ email: 'a@b.test', phone: '08031234412', password: 'a-long-password' });
    expect(seen).toEqual([`Bearer ${token}`, null]);
  });
});
