import { MAX_QR_BYTES, qrModules } from '../qr';

/** FNV-1a over the picture as `#` and `.` rows: a fingerprint of every square. */
function fingerprint(text: string): { size: number; hash: string } {
  const modules = qrModules(text);
  const picture = modules.map((row) => row.map((d) => (d ? '#' : '.')).join('') + '\n').join('');
  let h = 0x811c9dc5;
  for (const c of picture) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return { size: modules.length, hash: h.toString(16) };
}

describe('the QR picture of a ticket code', () => {
  // Fingerprints of the reference encoder's output (the `qrcode` package, byte mode, level M) for the same
  // text: one per version up to 6, one and four blocks included. A different square anywhere changes the hash.
  it.each([
    [14, 'x'.repeat(14), 21, 'd3c0125d'],
    [30, 'y'.repeat(30), 29, 'd5377aad'],
    [40, 'u'.repeat(40), 29, 'ccca9f2b'],
    [62, 'z'.repeat(62), 33, '134052de'],
    [84, 'q'.repeat(84), 37, 'd7f7717'],
    [106, 'w'.repeat(106), 41, '3a8a2d68'],
  ])('draws the same squares as the reference for %i bytes', (_bytes, text, size, hash) => {
    expect(fingerprint(text)).toEqual({ size, hash });
  });

  it('a ticket code (19 characters) is a 25 square version 2 picture', () => {
    expect(qrModules('K7QX-4M2P-9WLA-3RTE')).toHaveLength(25);
  });

  it('draws the three finder squares and the timing line', () => {
    const m = qrModules('K7QX-4M2P-9WLA-3RTE');
    const n = m.length;
    const finderAt = (r: number, c: number) => {
      for (let y = 0; y < 7; y++)
        for (let x = 0; x < 7; x++) {
          const ring = Math.max(Math.abs(x - 3), Math.abs(y - 3));
          if (m[r + y][c + x] !== (ring !== 2)) return false;
        }
      return true;
    };
    expect(finderAt(0, 0)).toBe(true);
    expect(finderAt(0, n - 7)).toBe(true);
    expect(finderAt(n - 7, 0)).toBe(true);
    for (let i = 8; i < n - 8; i++) {
      expect(m[6][i]).toBe(i % 2 === 0);
      expect(m[i][6]).toBe(i % 2 === 0);
    }
  });

  it('the same text always gives the same picture, and different codes give different ones', () => {
    expect(fingerprint('K7QX-4M2P-9WLA-3RTE')).toEqual(fingerprint('K7QX-4M2P-9WLA-3RTE'));
    expect(fingerprint('K7QX-4M2P-9WLA-3RTE')).not.toEqual(fingerprint('K7QX-4M2P-9WLA-3RTF'));
  });

  it('holds exactly 106 bytes and refuses 107; a longer character counts by its bytes', () => {
    expect(() => qrModules('a'.repeat(MAX_QR_BYTES))).not.toThrow();
    expect(() => qrModules('a'.repeat(MAX_QR_BYTES + 1))).toThrow(/more than 106/);
    expect(() => qrModules('€'.repeat(35))).not.toThrow();
    expect(() => qrModules('€'.repeat(36))).toThrow();
  });

  it('every size from the first byte to the last fits a version', () => {
    const sizes = new Set<number>();
    for (let n = 1; n <= MAX_QR_BYTES; n++) sizes.add(qrModules('a'.repeat(n)).length);
    expect([...sizes].sort((a, b) => a - b)).toEqual([21, 25, 29, 33, 37, 41]);
    // The edges of each version: 14, 26, 42, 62, 84 bytes are the most each holds.
    expect([14, 15, 26, 27, 42, 43, 62, 63, 84, 85].map((n) => qrModules('a'.repeat(n)).length)).toEqual([21, 25, 25, 29, 29, 33, 33, 37, 37, 41]);
  });
});
