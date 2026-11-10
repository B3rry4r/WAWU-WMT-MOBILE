import { readFileSync } from 'fs';
import { join } from 'path';

import { darkColors, lightColors } from '@/theme/tokens.generated';

/** WEBAPP-11 (R-131): the manifest, its icons and the head tags the export serves are the app's own, in the theme's colours. */
const ROOT = join(__dirname, '../..');
const manifest = JSON.parse(readFileSync(join(ROOT, 'public/manifest.webmanifest'), 'utf8'));
const png = (p: string) => {
  const b = readFileSync(join(ROOT, 'public', p));
  expect(b.subarray(1, 4).toString()).toBe('PNG');
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
};

describe('the web manifest', () => {
  it('names the app, opens at / standalone, in the theme colours', () => {
    const app = JSON.parse(readFileSync(join(ROOT, 'app.json'), 'utf8')).expo;
    expect(manifest.name).toBe(app.name);
    expect(manifest.start_url).toBe('/');
    expect(manifest.scope).toBe('/');
    expect(manifest.display).toBe('standalone');
    expect(manifest.theme_color).toBe(lightColors.accent);
    expect(manifest.background_color).toBe(darkColors.surfacePage);
  });
  it('has any and maskable icons at 192 and 512, real PNGs of that size', () => {
    for (const purpose of ['any', 'maskable']) {
      for (const size of [192, 512]) {
        const icon = manifest.icons.find((i: { purpose: string; sizes: string }) => i.purpose === purpose && i.sizes === `${size}x${size}`);
        expect(icon).toBeTruthy();
        expect(png(icon.src)).toEqual({ w: size, h: size });
      }
    }
    expect(png('pwa/apple-touch-icon.png')).toEqual({ w: 180, h: 180 });
  });
  it('the page links the manifest and carries the Apple home-screen tags', () => {
    const html = readFileSync(join(ROOT, 'public/index.html'), 'utf8');
    expect(html).toContain('<link rel="manifest" href="/manifest.webmanifest" />');
    expect(html).toContain('rel="apple-touch-icon" href="/pwa/apple-touch-icon.png"');
    expect(html).toContain('name="apple-mobile-web-app-capable" content="yes"');
    expect(html).toContain('name="apple-mobile-web-app-title"');
    expect(html).toContain('name="apple-mobile-web-app-status-bar-style"');
    expect(html).toContain(`name="theme-color" content="${lightColors.accent}"`);
    expect(html).toContain('%WEB_TITLE%');
  });
  it('loads under vercel.json: the CSP falls back to self for the manifest and the icons', () => {
    const csp = JSON.parse(readFileSync(join(ROOT, 'vercel.json'), 'utf8')).headers.flatMap((h: { headers: { key: string; value: string }[] }) => h.headers).find((h: { key: string }) => h.key === 'Content-Security-Policy').value as string;
    expect(csp).toContain("default-src 'self'");
    expect(csp).not.toContain('manifest-src');
    expect(csp).toMatch(/img-src 'self'/);
  });
});
