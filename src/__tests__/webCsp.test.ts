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
