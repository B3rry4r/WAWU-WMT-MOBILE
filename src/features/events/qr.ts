/**
 * A QR code for a short piece of text (a ticket code), drawn by us: byte mode, error correction level M,
 * versions 1 to 6 (up to 106 bytes). The Hub's ticket code is 19 characters, so it always fits in version 2.
 * The ticket screen draws exactly what the Hub issued; nothing here makes up a code, it only turns the
 * server's text into the picture a door scanner reads. The layout follows ISO/IEC 18004.
 */

type Version = { ec: number; blocks: number; data: number; align: number[] };

/** Level M, by version: error-correction bytes per block, blocks, data bytes in all, alignment pattern centres. */
const VERSIONS: Record<number, Version> = {
  1: { ec: 10, blocks: 1, data: 16, align: [] },
  2: { ec: 16, blocks: 1, data: 28, align: [6, 18] },
  3: { ec: 26, blocks: 1, data: 44, align: [6, 22] },
  4: { ec: 18, blocks: 2, data: 64, align: [6, 26] },
  5: { ec: 24, blocks: 2, data: 86, align: [6, 30] },
  6: { ec: 16, blocks: 4, data: 108, align: [6, 34] },
};

export const MAX_QR_BYTES = 106;

const exp = new Array<number>(512);
const log = new Array<number>(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    exp[i] = x;
    log[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) exp[i] = exp[i - 255];
})();

const mul = (a: number, b: number) => (a === 0 || b === 0 ? 0 : exp[log[a] + log[b]]);

function generator(degree: number): number[] {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    const next = new Array<number>(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= mul(poly[j], exp[i]);
    }
    poly = next;
  }
  return poly;
}

function remainder(data: number[], degree: number): number[] {
  const gen = generator(degree);
  const rest = new Array<number>(degree).fill(0);
  for (const byte of data) {
    const factor = byte ^ (rest.shift() as number);
    rest.push(0);
    for (let i = 0; i < degree; i++) rest[i] ^= mul(gen[i + 1], factor);
  }
  return rest;
}

function utf8(text: string): number[] {
  const out: number[] = [];
  for (const ch of text) {
    const c = ch.codePointAt(0) as number;
    if (c < 0x80) out.push(c);
    else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
    else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    else out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
  }
  return out;
}

const bit = (value: number, i: number) => ((value >>> i) & 1) !== 0;

/** The squares of the code: `modules[row][column]` is true for a dark square. Throws when the text is longer than 106 bytes. */
export function qrModules(text: string): boolean[][] {
  const bytes = utf8(text);
  const version = Number(Object.keys(VERSIONS).find((v) => bytes.length <= VERSIONS[Number(v)].data - 2));
  if (!version) throw new Error(`QR: ${bytes.length} bytes is more than ${MAX_QR_BYTES}`);
  const spec = VERSIONS[version];
  const size = version * 4 + 17;

  // Data bits: mode 0100, an 8 bit count, the bytes, the terminator, then padding bytes.
  const bits: number[] = [];
  const push = (value: number, count: number) => {
    for (let i = count - 1; i >= 0; i--) bits.push((value >>> i) & 1);
  };
  push(0b0100, 4);
  push(bytes.length, 8);
  for (const b of bytes) push(b, 8);
  push(0, Math.min(4, spec.data * 8 - bits.length));
  while (bits.length % 8 !== 0) bits.push(0);
  const codewords: number[] = [];
  for (let i = 0; i < bits.length; i += 8) codewords.push(parseInt(bits.slice(i, i + 8).join(''), 2));
  for (let pad = 0xec; codewords.length < spec.data; pad ^= 0xec ^ 0x11) codewords.push(pad);

  // Split into blocks, add each block's error correction, and interleave.
  const per = spec.data / spec.blocks;
  const blocks = Array.from({ length: spec.blocks }, (_, i) => codewords.slice(i * per, (i + 1) * per));
  const eccs = blocks.map((b) => remainder(b, spec.ec));
  const stream: number[] = [];
  for (let i = 0; i < per; i++) for (const b of blocks) stream.push(b[i]);
  for (let i = 0; i < spec.ec; i++) for (const e of eccs) stream.push(e[i]);
  const dataBits: boolean[] = [];
  for (const cw of stream) for (let i = 7; i >= 0; i--) dataBits.push(bit(cw, i));
  if (version >= 2) for (let i = 0; i < 7; i++) dataBits.push(false);

  const grid: boolean[][] = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  const fixed: boolean[][] = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  const set = (x: number, y: number, dark: boolean) => {
    grid[y][x] = dark;
    fixed[y][x] = true;
  };

  // Timing lines, then the three finders with their separators.
  for (let i = 0; i < size; i++) {
    set(6, i, i % 2 === 0);
    set(i, 6, i % 2 === 0);
  }
  const finder = (cx: number, cy: number) => {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const x = cx + dx;
        const y = cy + dy;
        if (x < 0 || y < 0 || x >= size || y >= size) continue;
        const dist = Math.max(Math.abs(dx), Math.abs(dy));
        set(x, y, dist !== 2 && dist !== 4);
      }
    }
  };
  finder(3, 3);
  finder(size - 4, 3);
  finder(3, size - 4);
  // Alignment patterns (not on a finder).
  for (const cy of spec.align) {
    for (const cx of spec.align) {
      const onFinder = (cx === 6 && cy === 6) || (cx === 6 && cy === spec.align[spec.align.length - 1]) || (cy === 6 && cx === spec.align[spec.align.length - 1]);
      if (onFinder) continue;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }
  }
  // Reserve the format squares and the dark square.
  const drawFormat = (mask: number) => {
    const data = (0 << 3) | mask; // level M is 00
    let rem = data;
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    const code = ((data << 10) | rem) ^ 0x5412;
    for (let i = 0; i <= 5; i++) set(8, i, bit(code, i));
    set(8, 7, bit(code, 6));
    set(8, 8, bit(code, 7));
    set(7, 8, bit(code, 8));
    for (let i = 9; i < 15; i++) set(14 - i, 8, bit(code, i));
    for (let i = 0; i < 8; i++) set(size - 1 - i, 8, bit(code, i));
    for (let i = 8; i < 15; i++) set(8, size - 15 + i, bit(code, i));
    set(8, size - 8, true);
  };
  drawFormat(0);

  // The data, in the zigzag the standard fixes, from the bottom right.
  let at = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let v = 0; v < size; v++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const upward = ((right + 1) & 2) === 0;
        const y = upward ? size - 1 - v : v;
        if (!fixed[y][x] && at < dataBits.length) grid[y][x] = dataBits[at++];
      }
    }
  }

  const masks: ((x: number, y: number) => boolean)[] = [
    (x, y) => (x + y) % 2 === 0,
    (_x, y) => y % 2 === 0,
    (x) => x % 3 === 0,
    (x, y) => (x + y) % 3 === 0,
    (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
    (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
    (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
    (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
  ];
  const flip = (mask: number) => {
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!fixed[y][x] && masks[mask](x, y)) grid[y][x] = !grid[y][x];
  };

  let best = 0;
  let bestScore = Infinity;
  for (let mask = 0; mask < 8; mask++) {
    flip(mask);
    drawFormat(mask);
    const score = penalty(grid, size);
    if (score < bestScore) {
      best = mask;
      bestScore = score;
    }
    flip(mask);
  }
  flip(best);
  drawFormat(best);
  return grid;
}

/** The standard's four penalty rules; the mask with the lowest total is the one drawn. */
function penalty(grid: boolean[][], size: number): number {
  let total = 0;
  const runs = (line: boolean[]) => {
    let run = 1;
    for (let i = 1; i <= line.length; i++) {
      if (i < line.length && line[i] === line[i - 1]) run++;
      else {
        if (run >= 5) total += run - 2;
        run = 1;
      }
    }
  };
  const finderLike = (line: boolean[]) => {
    for (let i = 0; i + 11 <= line.length; i++) {
      const a = [true, false, true, true, true, false, true, false, false, false, false];
      const b = [false, false, false, false, true, false, true, true, true, false, true];
      if (a.every((v, k) => line[i + k] === v)) total += 40;
      if (b.every((v, k) => line[i + k] === v)) total += 40;
    }
  };
  for (let y = 0; y < size; y++) {
    const row = grid[y];
    const col = grid.map((r) => r[y]);
    runs(row);
    runs(col);
    finderLike(row);
    finderLike(col);
  }
  for (let y = 0; y < size - 1; y++) {
    for (let x = 0; x < size - 1; x++) {
      const c = grid[y][x];
      if (c === grid[y][x + 1] && c === grid[y + 1][x] && c === grid[y + 1][x + 1]) total += 3;
    }
  }
  let dark = 0;
  for (const row of grid) for (const c of row) if (c) dark++;
  total += (Math.ceil(Math.abs(dark * 20 - size * size * 10) / (size * size)) - 1) * 10;
  return total;
}
