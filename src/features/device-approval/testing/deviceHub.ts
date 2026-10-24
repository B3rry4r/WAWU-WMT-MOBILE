import { createHash, createPublicKey, randomBytes, randomUUID, verify } from 'node:crypto';

/**
 * The Hub's side of a biometric approval as a test double (MONEY-14; wawu-backend `approval-device.service.ts` and
 * `transaction-pin.guard.ts`, `origin/main`). It checks an approval with Node's `crypto` the way the Hub does, written out here
 * and not taken from the app: the text is the tag, the challenge id and bytes, the device id, the method, the path as sent with its
 * query, and the SHA-256 hex of the exact body bytes, joined by a newline; the signature is ECDSA P-256 over SHA-256, DER.
 */
export type DeviceHub = {
  pin: string;
  device: null | { deviceId: string; publicKey: string; biometric: string };
  challenges: Map<string, { challenge: string; deviceId: string; used: boolean }>;
  /** What each approval check came to, in order. */
  checks: ('approved' | 'refused')[];
  /** The headers `PUT /money/device` and the other device routes carried. */
  puts: { pin: string | null; body: { publicKey?: string; biometric?: string } }[];
  deletes: number;
  verifies: number;
};

export const newDeviceHub = (pin = '1234'): DeviceHub => ({ pin, device: null, challenges: new Map(), checks: [], puts: [], deletes: 0, verifies: 0 });

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
export const ok = (data: unknown) => json(200, { statusCode: 200, message: 'OK', data });
export const refuse = (status: number, reason: Record<string, unknown>) => json(status, { data: null, statusCode: status, message: String(reason.message ?? ''), reason });

const view = (hub: DeviceHub) =>
  hub.device
    ? { registered: true, deviceId: hub.device.deviceId, biometric: hub.device.biometric, registeredAt: '2026-10-24T09:00:00.000Z', lastUsedAt: null }
    : { registered: false, deviceId: null, biometric: null, registeredAt: null, lastUsedAt: null };

/** `approved` only for a signature by the registered phone's key over exactly this request; the challenge is used up either way. */
export async function checkApproval(hub: DeviceHub, request: Request): Promise<'approved' | 'refused'> {
  const header = request.headers.get('x-device-approval') ?? '';
  const parts = /^v1\.([0-9a-f-]{36})\.([A-Za-z0-9_-]{8,200})$/.exec(header);
  const result = await (async (): Promise<'approved' | 'refused'> => {
    if (!parts || !hub.device) return 'refused';
    const challenge = hub.challenges.get(parts[1]);
    if (!challenge || challenge.used || challenge.deviceId !== hub.device.deviceId) return 'refused';
    challenge.used = true;
    const url = new URL(request.url);
    const body = Buffer.from(await request.clone().arrayBuffer());
    const message = ['wawu-device-approval-v1', parts[1], challenge.challenge, hub.device.deviceId, request.method, url.pathname + url.search, createHash('sha256').update(body).digest('hex')].join('\n');
    const key = createPublicKey({ key: Buffer.from(hub.device.publicKey, 'base64url'), format: 'der', type: 'spki' });
    return verify('sha256', Buffer.from(message, 'utf8'), { key, dsaEncoding: 'der' }, Buffer.from(parts[2], 'base64url')) ? 'approved' : 'refused';
  })();
  hub.checks.push(result);
  return result;
}

/** The device routes. Null for any other route, so a test's own double answers those. */
export async function deviceRoutes(hub: DeviceHub, request: Request): Promise<Response | null> {
  const path = new URL(request.url).pathname.replace(/^\/api\/hub/, '');
  const method = request.method;
  if (path === '/money/device' && method === 'GET') return ok(view(hub));
  if (path === '/money/device' && method === 'PUT') {
    const body = (await request.json()) as { publicKey?: string; biometric?: string };
    const pin = request.headers.get('x-transaction-pin');
    hub.puts.push({ pin, body });
    if (pin !== hub.pin) return refuse(403, { code: 'pin_incorrect', message: 'Wrong PIN. 4 tries left.', triesLeft: 4 });
    try {
      const key = createPublicKey({ key: Buffer.from(body.publicKey ?? '', 'base64url'), format: 'der', type: 'spki' });
      if (key.asymmetricKeyType !== 'ec' || key.asymmetricKeyDetails?.namedCurve !== 'prime256v1') throw new Error('not P-256');
    } catch {
      return json(400, { statusCode: 400, message: 'publicKey is not a P-256 public key.' });
    }
    hub.device = { deviceId: randomUUID(), publicKey: body.publicKey as string, biometric: String(body.biometric) };
    return ok(view(hub));
  }
  if (path === '/money/device' && method === 'DELETE') {
    hub.deletes += 1;
    hub.device = null;
    return ok(view(hub));
  }
  if (path === '/money/device/challenge' && method === 'POST') {
    if (!hub.device) return refuse(403, { code: 'device_approval_refused', message: 'Your fingerprint or face could not approve this. Use your PIN.' });
    const challengeId = randomUUID();
    const challenge = randomBytes(32).toString('base64url');
    hub.challenges.set(challengeId, { challenge, deviceId: hub.device.deviceId, used: false });
    return json(201, { statusCode: 201, message: 'Created', data: { challengeId, challenge, deviceId: hub.device.deviceId, expiresAt: '2099-01-01T00:00:00.000Z' } });
  }
  if (path === '/money/approval/verify' && method === 'POST') {
    hub.verifies += 1;
    if ((await checkApproval(hub, request)) === 'refused') return refuse(403, { code: 'device_approval_refused', message: 'Your fingerprint or face could not approve this. Use your PIN.' });
    return ok({ isSet: true, changedAt: null, triesLeft: 5, lockedUntil: null });
  }
  return null;
}
