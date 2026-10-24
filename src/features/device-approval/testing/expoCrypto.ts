import { createHash, randomBytes } from 'node:crypto';

/** A stand-in for `expo-crypto` (a native module jest has no phone for), made of Node's own: random bytes and SHA-256 of the UTF-8 text. */
export const CryptoDigestAlgorithm = { SHA256: 'SHA-256' };
export const CryptoEncoding = { HEX: 'hex', BASE64: 'base64' };
export const getRandomBytes = (count: number): Uint8Array => new Uint8Array(randomBytes(count));
export const digestStringAsync = async (_algorithm: string, data: string): Promise<string> => createHash('sha256').update(data, 'utf8').digest('hex');
