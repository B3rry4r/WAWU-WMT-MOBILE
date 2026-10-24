import { p256 } from '@noble/curves/nist.js';
import * as Crypto from 'expo-crypto';

/**
 * The phone's side of a biometric approval (FIX-108; the Hub's side is MONEY-14, wawu-backend
 * `docs/contract/CONVENTIONS.md` section 5): a P-256 key pair, its public half as the Hub wants it, and an ECDSA
 * SHA-256 signature in DER over the text of one approval.
 *
 * - `@noble/curves` signs (pure JS: nothing installed on the phone signs, BACKEND_GAPS G-43); it never touches the
 *   private key's storage, which is `store.ts` behind the phone's biometric.
 * - `expo-crypto` gives the random bytes the key is made from, and the SHA-256 of the request body.
 */

/** SubjectPublicKeyInfo header of an uncompressed P-256 point: id-ecPublicKey, prime256v1, then the 65-byte point. */
const SPKI_P256 = Uint8Array.from([
  0x30, 0x59, 0x30, 0x13, 0x06, 0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02, 0x01, 0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07, 0x03, 0x42, 0x00,
]);

/** The first line of every signed approval: the scheme and its version. */
export const APPROVAL_TAG = 'wawu-device-approval-v1';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const BITS_PER_CHAR = 6;
const BITS_PER_BYTE = 8;

/** base64url without padding, the Hub's encoding for the key, the challenge and the signature. */
export function base64url(bytes: Uint8Array): string {
  let out = '';
  let buffer = 0;
  let bits = 0;
  for (const byte of bytes) {
    buffer = (buffer << BITS_PER_BYTE) | byte;
    bits += BITS_PER_BYTE;
    while (bits >= BITS_PER_CHAR) {
      bits -= BITS_PER_CHAR;
      out += ALPHABET[(buffer >> bits) & 0x3f];
    }
    buffer &= (1 << bits) - 1;
  }
  if (bits > 0) out += ALPHABET[(buffer << (BITS_PER_CHAR - bits)) & 0x3f];
  return out;
}

export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function fromHex(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i += 1) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

export type DeviceKeyPair = {
  /** The private key, hex: it goes straight into the biometric-locked store and nowhere else. */
  secretKeyHex: string;
  /** The public half as SubjectPublicKeyInfo DER, base64url: `PUT /money/device` `publicKey`. */
  publicKey: string;
};

/** A new key pair from the phone's secure random source. */
export function makeKeyPair(): DeviceKeyPair {
  const secretKey = p256.utils.randomSecretKey(Crypto.getRandomBytes(p256.lengths.seed ?? 48));
  const point = p256.getPublicKey(secretKey, false);
  const spki = new Uint8Array(SPKI_P256.length + point.length);
  spki.set(SPKI_P256, 0);
  spki.set(point, SPKI_P256.length);
  return { secretKeyHex: toHex(secretKey), publicKey: base64url(spki) };
}

/** The SHA-256 hex of the exact body text (the Hub hashes the bytes it received; the text goes out as UTF-8). Nothing: the hash of an empty body. */
export function bodyDigest(body: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, body, { encoding: Crypto.CryptoEncoding.HEX });
}

export type ApprovalText = {
  challengeId: string;
  challenge: string;
  deviceId: string;
  method: string;
  /** The path as sent, with its query: `/api/hub/money/...`. */
  path: string;
  /** SHA-256 hex of the exact body bytes. */
  bodyHash: string;
};

/** The text one approval signs: the lines joined by a newline, exactly as the Hub builds them (`approvalMessage`). */
export function approvalText(a: ApprovalText): string {
  return [APPROVAL_TAG, a.challengeId, a.challenge, a.deviceId, a.method.toUpperCase(), a.path, a.bodyHash].join('\n');
}

/** ECDSA P-256 over SHA-256 of the text, DER, base64url. */
export function signText(secretKeyHex: string, text: string): string {
  const message = new TextEncoder().encode(text);
  return base64url(p256.sign(message, fromHex(secretKeyHex), { prehash: true, format: 'der' }));
}
