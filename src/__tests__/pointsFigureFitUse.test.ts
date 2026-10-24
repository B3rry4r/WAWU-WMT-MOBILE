import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

/**
 * SWEEP-APP row DV2-COMP L3: `PointsFigure fit` fits a width its parent gives it, so where the parent has no width of its own
 * (a pill, a row item) it collapses. The rule was only in the prop's comment; this keeps it where the next screen will trip on it.
 * A screen that wants `fit` goes in the list below after someone has looked at its parent's width.
 */
const ALLOWED = [
  // PT5's balance column, the one place the rule names.
  'src/features/points/parts.tsx',
  // RF1's points tile: a tile of a known width in a two column grid.
  'src/features/referral/parts.tsx',
  // The preview screen that shows the fitted figure on purpose.
  'src/app/preview/points-figure.tsx',
];

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === '__tests__' ? [] : files(path);
    return /\.tsx$/.test(name) ? [path] : [];
  });
}

describe('PointsFigure fit', () => {
  it('is used only where a parent with a width of its own has been checked', () => {
    const root = join(__dirname, '..', '..');
    const using = files(join(root, 'src'))
      .filter((path) => /<PointsFigure\b[^>]*\sfit(\s|\/|>|=)/.test(readFileSync(path, 'utf8')))
      .map((path) => relative(root, path).split('\\').join('/'))
      .sort();
    expect(using).toEqual([...ALLOWED].sort());
  });
});
