/* eslint-disable @typescript-eslint/no-require-imports */
import { createHash, createPublicKey, verify } from 'node:crypto';

import { approvalText, base64url, bodyDigest, fromHex, makeKeyPair, signText, toHex } from '../crypto';

jest.mock('expo-crypto', () => require('../testing/expoCrypto'));

/*
 * The phone's key and signature, checked the way the Hub checks them (wawu-backend `approval-device.service.ts`): Node's `crypto`
 * reads the public key as SubjectPublicKeyInfo DER and verifies ECDSA P-256 over SHA-256 with a DER signature.
 */
const CHALLENGE = { challengeId: '5f0c3d2e-7a41-4c6b-9d2e-0a1b2c3d4e5f', challenge: 'q7Yb3vN0cX1pQe6mT9uWk2LrZsA4hJdG8fVoIyB5nEw', deviceId: 'a8b1c2d3-e4f5-4a6b-8c7d-9e0f1a2b3c4d' };

describe('FIX-108 · the phone’s key and its signature', () => {
  it('makes a P-256 key the Hub reads as SubjectPublicKeyInfo, a new one each time', () => {
    const one = makeKeyPair();
    const two = makeKeyPair();
    expect(one.publicKey).not.toBe(two.publicKey);
    expect(one.secretKeyHex).toMatch(/^[0-9a-f]{64}$/);
    const key = createPublicKey({ key: Buffer.from(one.publicKey, 'base64url'), format: 'der', type: 'spki' });
    expect(key.asymmetricKeyType).toBe('ec');
    expect(key.asymmetricKeyDetails?.namedCurve).toBe('prime256v1');
    expect(one.publicKey).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('signs one request in a way the Hub accepts, and refuses it for any other method, path, body, challenge or key', async () => {
    const pair = makeKeyPair();
    const other = makeKeyPair();
    const body = JSON.stringify({ amountKobo: 2_500_000, note: 'Thanks ₦ 🙏' });
    const text = approvalText({ ...CHALLENGE, method: 'post', path: '/api/hub/money/transfers/wawu', bodyHash: await bodyDigest(body) });
    expect(text.split('\n')).toEqual([
      'wawu-device-approval-v1',
      CHALLENGE.challengeId,
      CHALLENGE.challenge,
      CHALLENGE.deviceId,
      'POST',
      '/api/hub/money/transfers/wawu',
      createHash('sha256').update(Buffer.from(body, 'utf8')).digest('hex'),
    ]);

    const key = createPublicKey({ key: Buffer.from(pair.publicKey, 'base64url'), format: 'der', type: 'spki' });
    const check = (message: string, signature: string, against = key) => verify('sha256', Buffer.from(message, 'utf8'), { key: against, dsaEncoding: 'der' }, Buffer.from(signature, 'base64url'));
    const signature = signText(pair.secretKeyHex, text);
    expect(check(text, signature)).toBe(true);
    expect(check(text.replace('/wawu', '/bank'), signature)).toBe(false);
    expect(check(text.replace('POST', 'PUT'), signature)).toBe(false);
    expect(check(text.replace(createHash('sha256').update(body).digest('hex'), createHash('sha256').update('{}').digest('hex')), signature)).toBe(false);
    expect(check(text.replace(CHALLENGE.challenge, 'x'), signature)).toBe(false);
    expect(check(text, signText(other.secretKeyHex, text))).toBe(false);
  });

  it('hashes no body as the Hub does (the SHA-256 of nothing), and writes base64url and hex both ways', async () => {
    expect(await bodyDigest('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    const bytes = Uint8Array.from([0xfb, 0xff, 0xfe, 0x00, 0x01, 0x02, 0x03]);
    expect(base64url(bytes)).toBe(Buffer.from(bytes).toString('base64url'));
    expect(base64url(new Uint8Array(0))).toBe('');
    expect(toHex(fromHex('00ff10ab'))).toBe('00ff10ab');
  });
});
