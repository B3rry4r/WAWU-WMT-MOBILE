import { createHash } from 'crypto';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const root = join(__dirname, '..', '..');
const csp = (): string => {
  const rule = (JSON.parse(readFileSync(join(root, 'vercel.json'), 'utf8')).headers as { headers: { key: string; value: string }[] }[])
    .flatMap((h) => h.headers)
    .find((h) => h.key === 'Content-Security-Policy');
  return rule?.value ?? '';
};
const scriptSrc = (): string => csp().split(';').map((d) => d.trim()).find((d) => d.startsWith('script-src ')) ?? '';

/** WEBAPP-01: tokens live in localStorage on the web, so scripts are the guard: no inline script unless its hash is listed. */
describe('WEBAPP-01: the web CSP allows no unlisted inline script', () => {
  it('script-src never says unsafe-inline', () => {
    expect(scriptSrc()).not.toBe('');
    expect(scriptSrc()).not.toContain("'unsafe-inline'");
  });

  const dist = join(root, 'dist', 'index.html');
  (existsSync(dist) ? it : it.skip)('every inline script in the exported index.html has its sha256 in script-src (run npm run web:export first)', () => {
    const html = readFileSync(dist, 'utf8');
    const inline = [...html.matchAll(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
    for (const body of inline) {
      const hash = `'sha256-${createHash('sha256').update(body).digest('base64')}'`;
      expect(scriptSrc()).toContain(hash);
    }
  });
});

const directive = (name: string): string[] => (csp().split(';').map((d) => d.trim()).find((d) => d.startsWith(`${name} `)) ?? '').split(/\s+/).slice(1);

/** WEBAPP-08 F2, F3: a host source with scheme https never covers wss:, and the live socket is a Hub call; media-src covers where video and audio come from. */
describe('WEBAPP-08: the web CSP lets the live socket and the media through', () => {
  it('connect-src names the Hub for https and for the live socket (wss)', () => {
    expect(directive('connect-src')).toEqual(expect.arrayContaining(['https://api.wawuafrica.com', 'wss://api.wawuafrica.com']));
  });
  it('the live socket address the app builds is covered by connect-src', () => {
    expect(directive('connect-src')).toContain('wss://api.wawuafrica.com');
    expect('https://api.wawuafrica.com'.replace(/^http/i, 'ws')).toBe('wss://api.wawuafrica.com');
  });
  it('media-src names the own bucket (DigitalOcean Spaces), the partner trailers (S3) and the theme song host', () => {
    expect(directive('media-src')).toEqual(expect.arrayContaining(['https://*.digitaloceanspaces.com', 'https://*.amazonaws.com', 'https://wawuafrica.com']));
  });
});
