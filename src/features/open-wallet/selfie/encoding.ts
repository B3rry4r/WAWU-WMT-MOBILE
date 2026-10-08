/**
 * The shape A6's selfie must have before it is sent (KYC-02, KYC-03): the
 * server refuses anything else, and every match is charged, a refused one
 * too. Both builds bring the capture down to `SELFIE_LONGEST_SIDE` and step
 * the JPEG quality down until it fits `SELFIE_MAX_BASE64_CHARS`
 * (`@/api/walletIdentity`); the phone build also checks the encoder's output
 * here before it goes anywhere.
 */

/** The longest side of the re-encoded selfie, in pixels: far inside the server's 2,048, and enough for a face. */
export const SELFIE_LONGEST_SIDE = 640;

/**
 * The most pixels the server takes on either side of a selfie (contract
 * `SelfieMatchDto.image`: "at most 2,048 pixels on each side"; wawu-backend
 * `SELFIE_MAX_SIDE_PX`).
 */
export const SELFIE_MAX_SIDE = 2048;

/** JPEG qualities tried in turn until the capture fits `SELFIE_MAX_BASE64_CHARS`. */
export const SELFIE_QUALITIES = [0.85, 0.7, 0.55, 0.4] as const;

/** What a capture of `width` by `height` is resized to: its long side brought down to `SELFIE_LONGEST_SIDE`, never up. Null when it already fits. */
export function selfieResize(width: number, height: number): { width: number } | { height: number } | null {
  if (Math.max(width, height) <= SELFIE_LONGEST_SIDE) return null;
  return width >= height ? { width: SELFIE_LONGEST_SIDE } : { height: SELFIE_LONGEST_SIDE };
}

const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
/** Base64 carries 3 bytes in each group of 4 characters. */
const GROUP = 4;
/** The value of each base64 character, -1 for anything else. */
const BASE64_VALUE = (() => {
  const values = new Int16Array(128).fill(-1);
  for (let i = 0; i < BASE64_ALPHABET.length; i += 1) values[BASE64_ALPHABET.charCodeAt(i)] = i;
  return values;
})();

/**
 * The bytes of `base64`: whole groups of 4, padding only at the very end (as the
 * server's `^[A-Za-z0-9+/]+={0,2}$` and its length check require). Null for
 * anything else: a space, a line break, a `data:` prefix, a URL-safe letter.
 */
export function base64Bytes(base64: string): Uint8Array | null {
  if (base64.length === 0 || base64.length % GROUP !== 0) return null;
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  const bytes = new Uint8Array((base64.length / GROUP) * 3 - padding);
  let out = 0;
  for (let at = 0; at < base64.length; at += GROUP) {
    let bits = 0;
    for (let i = 0; i < GROUP; i += 1) {
      const code = base64.charCodeAt(at + i);
      const last = at + GROUP === base64.length;
      const pad = code === 0x3d && last && i >= GROUP - padding;
      const value = pad ? 0 : code < 128 ? BASE64_VALUE[code] : -1;
      if (value < 0) return null;
      bits = (bits << 6) | value;
    }
    for (const shift of [16, 8, 0]) if (out < bytes.length) bytes[out++] = (bits >> shift) & 0xff;
  }
  return bytes;
}

/*
 * The server's JPEG check, ported line for line from wawu-backend
 * `src/money/identity/selfie-image.ts` (`isJpeg`, `sofIsSane`, `sosIsSane`, main
 * 657a152; KYC-02), so the phone refuses exactly what the server refuses and never
 * spends a charged match on a file it would turn away. It walks the file from its
 * first byte to its last: SOI first; each marker segment's length inside the file;
 * one frame header (SOF, sides 1 to 2,048) before the first scan; each scan header
 * well formed; inside a scan's data an `FF` is followed only by `00`, a restart
 * marker, a segment allowed between scans, or EOI, which must be the last two bytes.
 * So a JPEG with a second JPEG appended (an Ultra HDR file's layout) is refused.
 */

/** Start-of-frame markers: baseline, extended, progressive, lossless, arithmetic. */
const JPEG_SOF = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
const SOS = 0xda;
const EOI = 0xd9;
/** Marker segments that may sit between the frame's scans (DHT, DAC, DQT, DRI, COM). */
const JPEG_BETWEEN_SCANS = new Set([0xc4, 0xcc, 0xdb, 0xdd, 0xfe]);

const u16 = (bytes: Uint8Array, at: number) => (bytes[at] << 8) | bytes[at + 1];

/** SOF: a precision of 8, 12 or 16, a height and width of 1 to `SELFIE_MAX_SIDE`, 1 to 4 components. */
function sofIsSane(s: Uint8Array): boolean {
  if (s.length < 6) return false;
  const components = s[5];
  const side = (n: number) => n > 0 && n <= SELFIE_MAX_SIDE;
  return (s[0] === 8 || s[0] === 12 || s[0] === 16) && side(u16(s, 1)) && side(u16(s, 3)) && components >= 1 && components <= 4 && s.length === 6 + 3 * components;
}

/** SOS: 1 to 4 components, and the length that says. */
function sosIsSane(s: Uint8Array): boolean {
  if (s.length < 1) return false;
  const components = s[0];
  return components >= 1 && components <= 4 && s.length === 4 + 2 * components;
}

/** True when `bytes` is a JPEG the server's walk accepts. */
export function isServerJpeg(bytes: Uint8Array): boolean {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return false;
  let pos = 2;
  let frame = false;
  let scans = 0;
  for (;;) {
    // A marker segment.
    if (pos + 4 > bytes.length || bytes[pos] !== 0xff) return false;
    const marker = bytes[pos + 1];
    const length = u16(bytes, pos + 2);
    if (length < 2 || pos + 2 + length > bytes.length) return false;
    const segment = bytes.subarray(pos + 4, pos + 2 + length);
    pos += 2 + length;

    if (JPEG_SOF.has(marker)) {
      if (frame || scans > 0) return false;
      if (!sofIsSane(segment)) return false;
      frame = true;
      continue;
    }
    if (marker === SOS) {
      if (!frame || !sosIsSane(segment)) return false;
      scans += 1;
      // The scan's entropy-coded data, up to the next marker.
      for (;;) {
        if (pos >= bytes.length) return false;
        if (bytes[pos] !== 0xff) {
          pos += 1;
          continue;
        }
        if (pos + 1 >= bytes.length) return false;
        const next = bytes[pos + 1];
        if (next === 0x00 || (next >= 0xd0 && next <= 0xd7)) {
          pos += 2;
          continue;
        }
        if (next === EOI) return pos + 2 === bytes.length;
        if (JPEG_BETWEEN_SCANS.has(next) || next === SOS) break;
        return false;
      }
      continue;
    }
    if (scans > 0) {
      if (!JPEG_BETWEEN_SCANS.has(marker)) return false;
      continue;
    }
    // Before the first scan: APPn, comments and tables only.
    const header = (marker >= 0xe0 && marker <= 0xef) || JPEG_BETWEEN_SCANS.has(marker);
    if (!header) return false;
  }
}

/**
 * True when `base64` is plain base64 (whole groups, padding only at the end) of
 * a JPEG the server's walk accepts: from its start marker to its end marker as
 * the last two bytes, with nothing appended.
 */
export function isWholeJpeg(base64: string): boolean {
  const bytes = base64Bytes(base64);
  return bytes !== null && isServerJpeg(bytes);
}
