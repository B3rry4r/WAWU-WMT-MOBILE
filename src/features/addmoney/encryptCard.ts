/**
 * Encrypts a card on the phone with the provider's public key, so the card never reaches WAWU's servers in the clear (WALLET-25,
 * R-84: "encrypted on the phone with Nuvion's key"). The scheme is the provider's (core-concepts__encryption): RSA-OAEP with SHA-256
 * (MGF1 over SHA-256, empty label) over a JSON object of the card, base64. Pure JavaScript over `BigInt`, with the hash and the random
 * bytes handed in, so no native module is added (`expo-crypto` is already in the app) and a test proves the output with the private key
 * in Node.
 *
 * Nothing here keeps, logs or returns the card: the one result is the ciphertext.
 */
export type CardPlain = {
  number: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  name: string;
};

export type CryptoParts = {
  sha256: (data: Uint8Array) => Promise<Uint8Array>;
  randomBytes: (length: number) => Uint8Array;
};

const HASH_LEN = 32;
const ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function base64ToBytes(b64: string): Uint8Array {
  const out: number[] = [];
  let bits = 0;
  let acc = 0;
  for (const ch of b64.replace(/=+$/, "")) {
    const v = ALPHABET.indexOf(ch);
    if (v < 0) throw new Error("The key is not base64.");
    acc = (acc << 6) | v;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out.push((acc >> bits) & 0xff);
    }
  }
  return Uint8Array.from(out);
}

export function bytesToBase64(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const n =
      (bytes[i] << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0);
    out += ALPHABET[(n >> 18) & 63] + ALPHABET[(n >> 12) & 63];
    out += i + 1 < bytes.length ? ALPHABET[(n >> 6) & 63] : "=";
    out += i + 2 < bytes.length ? ALPHABET[n & 63] : "=";
  }
  return out;
}

/** One DER element: its tag, where its content starts and ends. */
function element(
  der: Uint8Array,
  at: number,
): { tag: number; start: number; end: number } {
  const tag = der[at];
  let p = at + 1;
  let len = der[p++];
  if (len >= 0x80) {
    const count = len & 0x7f;
    len = 0;
    for (let i = 0; i < count; i += 1) len = len * 256 + der[p++];
  }
  if (tag === undefined || p + len > der.length)
    throw new Error("The key is cut short.");
  return { tag, start: p, end: p + len };
}

const toBig = (bytes: Uint8Array): bigint => {
  let hex = "";
  for (const b of bytes) hex += b.toString(16).padStart(2, "0");
  return BigInt(`0x${hex || "0"}`);
};

function toBytes(n: bigint, length: number): Uint8Array {
  const hex = n.toString(16).padStart(length * 2, "0");
  const out = new Uint8Array(length);
  for (let i = 0; i < length; i += 1)
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

/** The modulus and exponent out of a PEM `SubjectPublicKeyInfo` that holds an RSA key. */
export function readPublicKey(pem: string): {
  n: bigint;
  e: bigint;
  size: number;
} {
  const der = base64ToBytes(
    pem.replace(/-----[A-Z ]+-----/g, "").replace(/\s+/g, ""),
  );
  const spki = element(der, 0);
  if (spki.tag !== 0x30) throw new Error("The key is not an RSA public key.");
  const alg = element(der, spki.start);
  const bits = element(der, alg.end);
  if (alg.tag !== 0x30 || bits.tag !== 0x03)
    throw new Error("The key is not an RSA public key.");
  // The bit string's first byte counts unused bits (0): the key itself is `SEQUENCE { n, e }`.
  const seq = element(der, bits.start + 1);
  const n = element(der, seq.start);
  const e = element(der, n.end);
  if (seq.tag !== 0x30 || n.tag !== 0x02 || e.tag !== 0x02)
    throw new Error("The key is not an RSA public key.");
  let nb = der.slice(n.start, n.end);
  while (nb.length > 1 && nb[0] === 0) nb = nb.slice(1);
  return { n: toBig(nb), e: toBig(der.slice(e.start, e.end)), size: nb.length };
}

function modPow(base: bigint, exp: bigint, mod: bigint): bigint {
  let result = 1n;
  let b = base % mod;
  let e = exp;
  while (e > 0n) {
    if (e & 1n) result = (result * b) % mod;
    b = (b * b) % mod;
    e >>= 1n;
  }
  return result;
}

async function mgf1(
  sha256: CryptoParts["sha256"],
  seed: Uint8Array,
  length: number,
): Promise<Uint8Array> {
  const out = new Uint8Array(Math.ceil(length / HASH_LEN) * HASH_LEN);
  for (let counter = 0; counter * HASH_LEN < length; counter += 1) {
    const input = new Uint8Array(seed.length + 4);
    input.set(seed);
    new DataView(input.buffer).setUint32(seed.length, counter);
    out.set(await sha256(input), counter * HASH_LEN);
  }
  return out.slice(0, length);
}

/** UTF-8 by hand: Hermes has no `unescape` to lean on, and a card's text is short. */
function utf8(s: string): Uint8Array {
  const out: number[] = [];
  for (const ch of s) {
    const c = ch.codePointAt(0)!;
    if (c < 0x80) out.push(c);
    else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
    else if (c < 0x10000)
      out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    else
      out.push(
        0xf0 | (c >> 18),
        0x80 | ((c >> 12) & 63),
        0x80 | ((c >> 6) & 63),
        0x80 | (c & 63),
      );
  }
  return Uint8Array.from(out);
}

/** RSA-OAEP (SHA-256, empty label) of `message` for the key; `base64` ciphertext. */
export async function oaepEncrypt(
  pem: string,
  message: Uint8Array,
  parts: CryptoParts,
): Promise<string> {
  const { n, e, size } = readPublicKey(pem);
  if (message.length > size - 2 * HASH_LEN - 2)
    throw new Error("The card is too long to encrypt.");
  const lHash = await parts.sha256(new Uint8Array(0));
  const db = new Uint8Array(size - HASH_LEN - 1);
  db.set(lHash);
  db[db.length - message.length - 1] = 1;
  db.set(message, db.length - message.length);
  const seed = parts.randomBytes(HASH_LEN);
  const dbMask = await mgf1(parts.sha256, seed, db.length);
  const maskedDb = db.map((b, i) => b ^ dbMask[i]);
  const seedMask = await mgf1(parts.sha256, maskedDb, HASH_LEN);
  const maskedSeed = seed.map((b, i) => b ^ seedMask[i]);
  const em = new Uint8Array(size);
  em.set(maskedSeed, 1);
  em.set(maskedDb, 1 + HASH_LEN);
  return bytesToBase64(toBytes(modPow(toBig(em), e, n), size));
}

/** The card as the provider's JSON object, encrypted. The year is four digits and the month two. */
export async function encryptCard(
  pem: string,
  card: CardPlain,
  parts: CryptoParts,
): Promise<string> {
  const json = JSON.stringify({
    card_number: card.number.replace(/[\s-]/g, ""),
    expiration_month: card.expiryMonth.padStart(2, "0"),
    expiration_year: card.expiryYear,
    cvv: card.cvv,
    card_holder_name: card.name,
  });
  return oaepEncrypt(pem, utf8(json), parts);
}

/** The parts the app uses: `expo-crypto`'s SHA-256 and random bytes (already installed; no new native module). */
export async function appCryptoParts(): Promise<CryptoParts> {
  const Crypto = await import("expo-crypto");
  return {
    sha256: async (data) =>
      new Uint8Array(
        await Crypto.digest(
          Crypto.CryptoDigestAlgorithm.SHA256,
          data as unknown as ArrayBuffer,
        ),
      ),
    randomBytes: (length) => Crypto.getRandomBytes(length),
  };
}
