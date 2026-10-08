import { isWholeJpeg, SELFIE_LONGEST_SIDE, SELFIE_MAX_SIDE, selfieResize } from '../selfie/encoding';

/** A made-up JPEG of `size` bytes: the start marker, filler, the end marker, then `after` (bytes that must not be there). */
function jpeg(size: number, after: number[] = []): string {
  const body = Array.from({ length: Math.max(0, size - 4) }, (_, i) => (i * 7) % 251);
  return Buffer.from([0xff, 0xd8, ...body, 0xff, 0xd9, ...after]).toString('base64');
}

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

  it('a JPEG that ends at its end marker passes, whatever its padding', () => {
    // 3,000, 3,001 and 3,002 bytes: no padding, "==" and "=".
    for (const size of [3000, 3001, 3002]) {
      const base64 = jpeg(size);
      expect(base64.length % 4).toBe(0);
      expect(isWholeJpeg(base64)).toBe(true);
    }
  });

  it('anything after the end marker, a missing start, an unpadded or broken string is refused', () => {
    expect(isWholeJpeg(jpeg(3000, [0x00]))).toBe(false);
    expect(isWholeJpeg(jpeg(3000, [0xff, 0xd9, 0x00]))).toBe(false);
    expect(isWholeJpeg(jpeg(3000, [0x50, 0x4b, 0x03, 0x04]))).toBe(false);
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0, 0xff, 0xd9]).toString('base64');
    expect(isWholeJpeg(png)).toBe(false);
    expect(isWholeJpeg(jpeg(3001).replace(/=+$/, ''))).toBe(false);
    expect(isWholeJpeg(`data:image/jpeg;base64,${jpeg(3000)}`)).toBe(false);
    expect(isWholeJpeg(`${jpeg(3000).slice(0, -4)}-_AA`)).toBe(false);
    expect(isWholeJpeg('')).toBe(false);
    expect(isWholeJpeg('/9j/')).toBe(false);
  });
});
