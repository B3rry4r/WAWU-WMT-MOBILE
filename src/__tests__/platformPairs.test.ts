import { readdirSync, statSync } from 'fs';
import { join } from 'path';

const SRC = join(__dirname, '..');
const PLATFORMS = ['web', 'native', 'ios', 'android'];

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    if (name === 'node_modules') return [];
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });

/**
 * WEBAPP-08 F1: Metro tries the source extensions in turn for a file, so `x.web.tsx` beside a plain `x.ts` bundled the plain file in the web export
 * (jest never showed it: it resolves another way). A platform file and the plain file it stands over must have the SAME extension.
 */
describe('a platform file shares its extension with the plain file beside it', () => {
  const files = walk(SRC).filter((f) => !f.includes('__tests__'));
  const pairs = files.flatMap((f) => {
    const m = /^(.*)\.(web|native|ios|android)\.(tsx?|jsx?)$/.exec(f);
    if (!m) return [];
    const [, base, platform, ext] = m;
    const plain = files.filter((o) => /\.(tsx?|jsx?)$/.test(o) && o.startsWith(`${base}.`) && o.slice(base.length + 1).split('.').length === 1);
    return [{ platform, file: f, ext, plain }];
  });

  it('finds the platform files (the walk is not empty)', () => {
    expect(pairs.length).toBeGreaterThan(10);
    expect(PLATFORMS).toContain(pairs[0].platform);
  });

  it.each(pairs.map((p) => [p.file.slice(SRC.length + 1), p] as const))('%s', (_name, p) => {
    for (const o of p.plain) expect(o.endsWith(`.${p.ext}`)).toBe(true);
  });
});
