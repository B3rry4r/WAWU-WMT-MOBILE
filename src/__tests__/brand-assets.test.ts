import { readFileSync, statSync } from 'fs';
import { join } from 'path';
import { inflateSync } from 'zlib';

import { darkColors } from '@/theme/tokens.generated';

import appConfig from '../../app.json';

/**
 * BRAND-01: the app's own picture files, read as pixels. The adaptive icon is cropped by the phone's launcher
 * (a circle, a squircle or a rounded square, showing the middle 66 to 72 dp of a 108 dp canvas), so what matters
 * is where the opaque pixels are, not that the file exists.
 */
const ROOT = join(__dirname, '../..');
const read = (path: string) => readFileSync(join(ROOT, path.replace(/^\.\//, '')));

type Png = { width: number; height: number; channels: number; px: Uint8Array };

/** A minimal PNG reader: 8-bit RGB or RGBA, not interlaced (what the icon script writes). */
function decodePng(file: Buffer): Png {
  let at = 8;
  let width = 0;
  let height = 0;
  let channels = 0;
  const idat: Buffer[] = [];
  while (at < file.length) {
    const length = file.readUInt32BE(at);
    const type = file.toString('ascii', at + 4, at + 8);
    const data = file.subarray(at + 8, at + 8 + length);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      if (data[8] !== 8 || data[12] !== 0) throw new Error('only 8-bit, not interlaced');
      channels = data[9] === 6 ? 4 : data[9] === 2 ? 3 : 0;
      if (!channels) throw new Error(`colour type ${data[9]} not read`);
    } else if (type === 'IDAT') idat.push(data);
    at += 12 + length;
  }
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const px = new Uint8Array(height * stride);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    for (let x = 0; x < stride; x++) {
      const value = raw[y * (stride + 1) + 1 + x];
      const left = x >= channels ? px[y * stride + x - channels] : 0;
      const up = y > 0 ? px[(y - 1) * stride + x] : 0;
      const upLeft = y > 0 && x >= channels ? px[(y - 1) * stride + x - channels] : 0;
      let out: number;
      if (filter === 0) out = value;
      else if (filter === 1) out = value + left;
      else if (filter === 2) out = value + up;
      else if (filter === 3) out = value + ((left + up) >> 1);
      else {
        const p = left + up - upLeft;
        const pa = Math.abs(p - left);
        const pb = Math.abs(p - up);
        const pc = Math.abs(p - upLeft);
        out = value + (pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft);
      }
      px[y * stride + x] = out & 255;
    }
  }
  return { width, height, channels, px };
}

const alphaOf = (png: Png, x: number, y: number) => (png.channels === 4 ? png.px[(y * png.width + x) * 4 + 3] : 255);
const rgbOf = (png: Png, x: number, y: number): [number, number, number] => {
  const i = (y * png.width + x) * png.channels;
  return [png.px[i], png.px[i + 1], png.px[i + 2]];
};
const hex = (rgb: number[]) => `#${rgb.map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase()}`;

/** Where the opaque pixels are: the box they fill, their centre of weight and the farthest one from a point. */
function shape(png: Png, from: (x: number, y: number) => boolean) {
  let minX = png.width;
  let minY = png.height;
  let maxX = -1;
  let maxY = -1;
  let sx = 0;
  let sy = 0;
  let n = 0;
  const marks: [number, number][] = [];
  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      if (!from(x, y)) continue;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
      sx += x;
      sy += y;
      n += 1;
      marks.push([x, y]);
    }
  }
  const farthest = (cx: number, cy: number) => {
    let far = 0;
    for (const [x, y] of marks) far = Math.max(far, Math.hypot(x - cx, y - cy));
    return far;
  };
  return { minX, minY, maxX, maxY, width: maxX - minX + 1, height: maxY - minY + 1, cx: sx / n, cy: sy / n, n, farthest };
}

const adaptive = appConfig.expo.android.adaptiveIcon;
const plugins = appConfig.expo.plugins as unknown as (string | [string, Record<string, unknown>])[];
/** The options app.json gives a plugin. */
function optionsOf(name: string): Record<string, unknown> {
  const hit = plugins.find((plugin) => Array.isArray(plugin) && plugin[0] === name);
  if (!hit || typeof hit === 'string') throw new Error(`app.json gives ${name} no options`);
  return hit[1];
}
const CANVAS = 1024;
/** Android's adaptive icon: a 108 dp canvas, of which a circle 66 dp across is always visible. */
const SAFE_RADIUS = ((66 / 108) * CANVAS) / 2;

describe('BRAND-01: the launcher icon fits the phone', () => {
  const foreground = decodePng(read(adaptive.foregroundImage));
  const opaque = (x: number, y: number) => alphaOf(foreground, x, y) > 16;
  const seen = shape(foreground, opaque);

  it('keeps the whole logo, drip included, inside the 66 dp safe circle with clear margin', () => {
    expect(foreground.width).toBe(CANVAS);
    expect(foreground.height).toBe(CANVAS);
    // The farthest opaque pixel from the middle of the canvas stays inside 90% of the circle: a launcher that
    // shows only the safe zone (Samsung's One UI does) cuts nothing.
    expect(seen.farthest(CANVAS / 2, CANVAS / 2)).toBeLessThanOrEqual(SAFE_RADIUS * 0.9);
  });

  it('draws the logo at 40 to 45% of the canvas, centred on its visual weight', () => {
    expect(seen.height / CANVAS).toBeGreaterThanOrEqual(0.4);
    expect(seen.height / CANVAS).toBeLessThanOrEqual(0.45);
    expect(Math.abs(seen.cx - CANVAS / 2)).toBeLessThan(24);
    expect(Math.abs(seen.cy - CANVAS / 2)).toBeLessThan(24);
  });

  it('puts the monochrome icon where the foreground is, as a white silhouette with the letters knocked out', () => {
    const mono = decodePng(read(adaptive.monochromeImage));
    const solid = shape(mono, (x, y) => alphaOf(mono, x, y) > 16);
    expect(mono.width).toBe(CANVAS);
    expect(Math.abs(solid.minX - seen.minX)).toBeLessThanOrEqual(4);
    expect(Math.abs(solid.maxX - seen.maxX)).toBeLessThanOrEqual(4);
    expect(Math.abs(solid.minY - seen.minY)).toBeLessThanOrEqual(4);
    expect(Math.abs(solid.maxY - seen.maxY)).toBeLessThanOrEqual(4);
    let notWhite = 0;
    let clearInside = 0;
    for (let y = solid.minY; y <= solid.maxY; y++) {
      for (let x = solid.minX; x <= solid.maxX; x++) {
        if (alphaOf(mono, x, y) > 16 && rgbOf(mono, x, y).some((v) => v !== 255)) notWhite += 1;
        if (alphaOf(mono, x, y) <= 16) clearInside += 1;
      }
    }
    expect(notWhite).toBe(0);
    // A plain silhouette leaves about a quarter of its box clear; with the letters and strokes knocked out it is half.
    expect(clearInside / (solid.width * solid.height)).toBeGreaterThan(0.4);
  });

  it('keeps the background layer flat brand purple, the same as the colour app.json names', () => {
    const background = decodePng(read(adaptive.backgroundImage));
    expect(hex(rgbOf(background, 0, 0))).toBe(darkColors.accent);
    expect(hex(rgbOf(background, 512, 512))).toBe(darkColors.accent);
    expect(adaptive.backgroundColor).toBe(darkColors.accent);
  });

  it('gives the store and iPhone icon a full square on the brand purple, its logo clear of a circle mask', () => {
    const icon = decodePng(read(appConfig.expo.icon));
    expect(icon.width).toBe(CANVAS);
    expect(icon.height).toBe(CANVAS);
    expect(icon.channels).toBe(3);
    expect(hex(rgbOf(icon, 4, 4))).toBe(darkColors.accent);
    const [pr, pg, pb] = rgbOf(icon, 4, 4);
    const logo = shape(icon, (x, y) => {
      const [r, g, b] = rgbOf(icon, x, y);
      return Math.abs(r - pr) + Math.abs(g - pg) + Math.abs(b - pb) > 40;
    });
    // 512 is the radius of a circle that touches the edges of the square.
    expect(logo.farthest(CANVAS / 2, CANVAS / 2)).toBeLessThanOrEqual(512 * 0.75);
    expect(Math.abs(logo.cx - CANVAS / 2)).toBeLessThan(40);
  });

  it('gives notifications a white silhouette that fills its square (a status-bar icon is 24 dp)', () => {
    const note = decodePng(read(optionsOf('expo-notifications').icon as string));
    const logo = shape(note, (x, y) => alphaOf(note, x, y) > 16);
    expect(logo.height / note.height).toBeGreaterThanOrEqual(0.85);
    expect(logo.height / note.height).toBeLessThanOrEqual(0.95);
    let notWhite = 0;
    for (let y = 0; y < note.height; y++) for (let x = 0; x < note.width; x++) if (alphaOf(note, x, y) > 16 && rgbOf(note, x, y).some((v) => v !== 255)) notWhite += 1;
    expect(notWhite).toBe(0);
  });
});

describe('BRAND-01: the opening screen', () => {
  const splash = optionsOf('expo-splash-screen') as { image: string; imageWidth: number; backgroundColor: string };
  const art = decodePng(read(splash.image));

  it('shows the logo at a sensible size, not the 96 dp it was', () => {
    expect(splash.imageWidth).toBeGreaterThanOrEqual(120);
  });

  it('keeps the logo inside the circle Android 12 and later cut the splash icon to (192 dp of a 288 dp square)', () => {
    // expo-splash-screen fits the picture into a square `imageWidth` dp across (its taller side), centred.
    const taller = Math.max(art.width, art.height);
    const scale = splash.imageWidth / taller;
    const logo = shape(art, (x, y) => alphaOf(art, x, y) > 16);
    const radiusDp = logo.farthest(art.width / 2, art.height / 2) * scale;
    expect(radiusDp).toBeLessThanOrEqual((192 / 2) * 0.95);
  });

  it('keeps the near-black ground the first screens are drawn on', () => {
    expect(splash.backgroundColor).toBe(darkColors.surfacePage);
  });
});

describe('ONBOARD-LOGO (R-90): the welcome screen\'s mark and its glow', () => {
  /** The three files `scripts/design/make_welcome_mark.py` writes: 190 pt of mark and 80 pt of glow on every side, at 1x, 2x and 3x. */
  const files = [
    { path: 'assets/images/welcome-mark.png', scale: 1 },
    { path: 'assets/images/welcome-mark@2x.png', scale: 2 },
    { path: 'assets/images/welcome-mark@3x.png', scale: 3 },
  ];

  it.each(files)('is $scale x as many pixels across in $path as the 350 x 367 pt picture the screen draws', ({ path, scale }) => {
    const png = decodePng(read(path));
    expect(png.channels).toBe(4);
    expect(png.width).toBe(350 * scale);
    expect(png.height).toBe(367 * scale);
  });

  it.each(files)('lets the glow fade to nothing before the edge of $path, so the page shows no box around the mark', ({ path }) => {
    const png = decodePng(read(path));
    let strongest = 0;
    for (let x = 0; x < png.width; x++) strongest = Math.max(strongest, alphaOf(png, x, 0), alphaOf(png, x, png.height - 1));
    for (let y = 0; y < png.height; y++) strongest = Math.max(strongest, alphaOf(png, 0, y), alphaOf(png, png.width - 1, y));
    expect(strongest).toBeLessThanOrEqual(2);
  });

  it('holds the white logo and lights it with the accent colour, not another purple', () => {
    const png = decodePng(read('assets/images/welcome-mark@3x.png'));
    let white = 0;
    let glow = 0;
    let glowInAccent = 0;
    for (let y = 0; y < png.height; y++) {
      for (let x = 0; x < png.width; x++) {
        const a = alphaOf(png, x, y);
        if (a === 255 && rgbOf(png, x, y).every((v) => v >= 0xf0)) white++;
        else if (a > 30 && a < 255) {
          glow++;
          if (hex(rgbOf(png, x, y)) === darkColors.accent) glowInAccent++;
        }
      }
    }
    expect(white).toBeGreaterThan(20_000);
    expect(glow).toBeGreaterThan(100_000);
    expect(glowInAccent / glow).toBeGreaterThan(0.9);
  });

  it('stays small enough for the app bundle (all three files under 400 KB)', () => {
    const bytes = files.reduce((sum, { path }) => sum + statSync(join(ROOT, path)).size, 0);
    expect(bytes).toBeLessThan(400 * 1024);
  });

  it('no longer ships the welcome photo', () => {
    expect(() => statSync(join(ROOT, 'assets/images/welcome-cover.jpg'))).toThrow();
  });
});
