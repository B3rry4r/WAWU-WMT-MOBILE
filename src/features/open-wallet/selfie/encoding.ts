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
/** JPEG's start-of-image marker, its first two bytes. */
const SOI = [0xff, 0xd8] as const;
/** JPEG's end-of-image marker: the server refuses any byte after it. */
const EOI = [0xff, 0xd9] as const;

/** The bytes of whole base64 groups (padding included), or null when a character is not base64. */
function bytesOf(groups: string): number[] | null {
  const bytes: number[] = [];
  for (let at = 0; at < groups.length; at += GROUP) {
    const group = groups.slice(at, at + GROUP);
    const padding = group.endsWith('==') ? 2 : group.endsWith('=') ? 1 : 0;
    const values = [...group.slice(0, GROUP - padding)].map((char) => BASE64_ALPHABET.indexOf(char));
    if (values.length + padding !== GROUP || values.some((value) => value < 0)) return null;
    while (values.length < GROUP) values.push(0);
    const bits = (values[0] << 18) | (values[1] << 12) | (values[2] << 6) | values[3];
    bytes.push((bits >> 16) & 0xff, (bits >> 8) & 0xff, bits & 0xff);
    bytes.length -= padding;
  }
  return bytes;
}

/**
 * True when `base64` is whole, padded groups (the server refuses any other
 * length) of a JPEG that starts with its start marker and ends exactly at its
 * end marker, with nothing after it. Only the first and last groups are read:
 * the encoder writes the rest, and the server walks it.
 */
export function isWholeJpeg(base64: string): boolean {
  if (base64.length < 2 * GROUP || base64.length % GROUP !== 0) return false;
  const head = bytesOf(base64.slice(0, GROUP));
  const tail = bytesOf(base64.slice(-2 * GROUP));
  if (!head || !tail || tail.length < EOI.length) return false;
  const last = tail.slice(-EOI.length);
  return head[0] === SOI[0] && head[1] === SOI[1] && last[0] === EOI[0] && last[1] === EOI[1];
}
