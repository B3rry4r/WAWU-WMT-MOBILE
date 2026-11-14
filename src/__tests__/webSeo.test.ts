import { readFileSync } from 'fs';
import { join } from 'path';

/** SEO-APPS: the head tags the web export serves for search engines and link previews. */
const ROOT = join(__dirname, '../..');
const html = readFileSync(join(ROOT, 'public/index.html'), 'utf8');
const content = (attr: string, name: string) => new RegExp(`<meta ${attr}="${name}" content="([^"]*)"`).exec(html)?.[1];

describe('the web page head for search and sharing', () => {
  it('has a plain description under 160 characters and no dashes', () => {
    const d = content('name', 'description') as string;
    expect(d.length).toBeGreaterThan(50);
    expect(d.length).toBeLessThan(160);
    expect(d).not.toMatch(/[–—]/);
  });
  it('has Open Graph, a Twitter card and a canonical address on usewmt.com', () => {
    for (const k of ['og:title', 'og:description', 'og:url', 'og:image', 'og:type']) expect(content('property', k)).toBeTruthy();
    for (const k of ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image']) expect(content('name', k)).toBeTruthy();
    expect(html).toContain('<link rel="canonical" href="https://usewmt.com" />');
    expect(content('property', 'og:url')).toBe('https://usewmt.com');
  });
  it('shares an image the repo ships, at an absolute address', () => {
    const img = content('property', 'og:image') as string;
    expect(img.startsWith('https://usewmt.com/')).toBe(true);
    expect(() => readFileSync(join(ROOT, 'public', img.replace('https://usewmt.com/', '')))).not.toThrow();
  });
  it('ships robots.txt and a sitemap that name the site', () => {
    expect(readFileSync(join(ROOT, 'public/robots.txt'), 'utf8')).toContain('Sitemap: https://usewmt.com/sitemap.xml');
    expect(readFileSync(join(ROOT, 'public/sitemap.xml'), 'utf8')).toContain('<loc>https://usewmt.com</loc>');
  });
  it('keeps signed-in screens out of robots.txt and the public pages in', () => {
    const lines = readFileSync(join(ROOT, 'public/robots.txt'), 'utf8').split('\n');
    const blocked = lines.filter((l) => l.startsWith('Disallow: ')).map((l) => l.slice('Disallow: '.length));
    const isBlocked = (path: string) => blocked.some((b) => path.startsWith(b));
    for (const p of ['/settings', '/wallet', '/checkout', '/withdraw', '/open-wallet-pin', '/chat/1', '/create-upload', '/inbox', '/transactions', '/profile/x']) expect(isBlocked(p)).toBe(true);
    for (const p of ['/', '/welcome', '/sign-in', '/sign-up', '/about', '/terms', '/privacy-policy', '/u/someone', '/c/x', '/r/x', '/works/x', '/content/x', '/events/abc']) expect(isBlocked(p)).toBe(false);
    expect(lines).toContain('Allow: /');
  });
});
