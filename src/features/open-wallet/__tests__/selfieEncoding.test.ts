import { base64Bytes, isServerJpeg, isWholeJpeg, SELFIE_LONGEST_SIDE, SELFIE_MAX_SIDE, selfieResize } from '../selfie/encoding';

/*
 * A6's selfie, brought to the server's shape (SHARED-04). `isServerJpeg` is wawu-backend's own walk
 * (`selfie-image.ts`, main 657a152) ported line for line (F1); these cases are the server's rules.
 */

const u16 = (n: number) => [(n >> 8) & 0xff, n & 0xff];

/**
 * A made-up baseline JPEG the server's walk accepts (never a face): SOI, APP0 JFIF, DQT, SOF0 (`width` by
 * `height`, one component), SOS, scan bytes with no `FF`, EOI. `size` is the whole file in bytes (at least 116).
 */
function walkable(size: number, { width = 480, height = 640 } = {}): number[] {
  const head = [
    0xff, 0xd8,
    0xff, 0xe0, ...u16(16), 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00,
    0xff, 0xdb, ...u16(67), 0x00, ...Array.from({ length: 64 }, (_, i) => i + 1),
    0xff, 0xc0, ...u16(11), 0x08, ...u16(height), ...u16(width), 0x01, 0x01, 0x11, 0x00,
    0xff, 0xda, ...u16(8), 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00,
  ];
  const scan = Array.from({ length: Math.max(1, size - head.length - 2) }, (_, i) => (i * 7) % 251);
  return [...head, ...scan, 0xff, 0xd9];
}
const b64 = (bytes: number[]) => Buffer.from(bytes).toString('base64');

describe("A6's selfie, brought to the server's shape (SHARED-04)", () => {
  it('a capture is brought down to 640 on its long side, never up', () => {
    expect(SELFIE_LONGEST_SIDE).toBe(640);
    expect(SELFIE_MAX_SIDE).toBe(2048);
    expect(selfieResize(3000, 4000)).toEqual({ height: 640 });
    expect(selfieResize(4000, 3000)).toEqual({ width: 640 });
    expect(selfieResize(1000, 1000)).toEqual({ width: 640 });
    expect(selfieResize(640, 480)).toBeNull();
    expect(selfieResize(300, 200)).toBeNull();
  });

  it('base64 is read exactly as the server reads it: padding only at the end, nothing but the alphabet', () => {
    for (const size of [3000, 3001, 3002]) {
      const bytes = walkable(size);
      expect(Array.from(base64Bytes(b64(bytes)) as Uint8Array)).toEqual(bytes);
    }
    const text = b64(walkable(3001));
    expect(base64Bytes(text.replace(/=+$/, ''))).toBeNull();
    expect(base64Bytes(`${text.slice(0, 8)}=${text.slice(9)}`)).toBeNull();
    expect(base64Bytes(text.replace(/(.{76})/g, '$1\n'))).toBeNull();
    expect(base64Bytes(`data:image/jpeg;base64,${text}`)).toBeNull();
    expect(base64Bytes(text.replace(/\//g, '_'))).toBeNull();
    expect(base64Bytes('')).toBeNull();
  });

  it('a JPEG the server walks passes, whatever its padding', () => {
    for (const size of [3000, 3001, 3002]) expect(isWholeJpeg(b64(walkable(size)))).toBe(true);
  });

  it('F1: a JPEG with a second JPEG appended (an Ultra HDR layout) is refused, as the server refuses it', () => {
    expect(isWholeJpeg(b64([...walkable(20_000), ...walkable(5_000)]))).toBe(false);
  });

  it('anything after the end marker, a cut-off file, or a stray marker inside the scan is refused', () => {
    expect(isWholeJpeg(b64([...walkable(3000), 0x00]))).toBe(false);
    expect(isWholeJpeg(b64([...walkable(3000), 0xff, 0xd9]))).toBe(false);
    expect(isWholeJpeg(b64(walkable(3000).slice(0, -2)))).toBe(false);
    const stray = walkable(3000);
    stray.splice(500, 0, 0xff, 0xc0);
    expect(isWholeJpeg(b64(stray))).toBe(false);
  });

  it('inside the scan a stuffed FF 00 and the restart markers are taken, as the server takes them', () => {
    const bytes = walkable(3000);
    bytes.splice(400, 0, 0xff, 0x00, 0xff, 0xd0, 0xff, 0xd7);
    expect(isServerJpeg(Uint8Array.from(bytes))).toBe(true);
  });

  it('a progressive JPEG with a table between its scans is taken', () => {
    const bytes = walkable(3000);
    const eoi = bytes.splice(-2, 2);
    const between = [0xff, 0xc4, ...u16(20), 0x00, 1, ...Array(15).fill(0), 0x00];
    const secondScan = [0xff, 0xda, ...u16(8), 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00, 0x11, 0x22];
    expect(isServerJpeg(Uint8Array.from([...bytes, ...between, ...secondScan, ...eoi]))).toBe(true);
  });

  it('a frame over 2,048 pixels a side, a missing frame, a second frame, or a bad scan header is refused', () => {
    expect(isServerJpeg(Uint8Array.from(walkable(3000, { width: 2048, height: 2048 })))).toBe(true);
    expect(isServerJpeg(Uint8Array.from(walkable(3000, { width: 2049, height: 640 })))).toBe(false);
    expect(isServerJpeg(Uint8Array.from(walkable(3000, { width: 480, height: 0 })))).toBe(false);
    // SOI 0-1, APP0 2-19, DQT 20-88, SOF0 89-101, SOS 102-111 (its component count at 106).
    const noFrame = walkable(3000);
    noFrame.splice(89, 13);
    expect(isServerJpeg(Uint8Array.from(noFrame))).toBe(false);
    const twoFrames = walkable(3000);
    twoFrames.splice(102, 0, ...twoFrames.slice(89, 102));
    expect(isServerJpeg(Uint8Array.from(twoFrames))).toBe(false);
    const badScan = walkable(3000);
    badScan[106] = 5;
    expect(isServerJpeg(Uint8Array.from(badScan))).toBe(false);
  });

  it('a PNG, a missing start, or a segment that runs past the end is refused', () => {
    const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0, 0xff, 0xd9];
    expect(isWholeJpeg(b64(png))).toBe(false);
    expect(isServerJpeg(Uint8Array.from(walkable(3000).slice(2)))).toBe(false);
    const runsPast = walkable(3000);
    runsPast[4] = 0xff;
    expect(isServerJpeg(Uint8Array.from(runsPast))).toBe(false);
    expect(isServerJpeg(Uint8Array.from([0xff, 0xd8, 0xff, 0xd9]))).toBe(false);
  });
});
