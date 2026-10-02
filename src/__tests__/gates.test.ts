import { spawnSync } from 'node:child_process';
import path from 'node:path';

describe('gates', () => {
  it('fail every literal colour, spacing and radius, and pass clean code', () => {
    const root = path.resolve(__dirname, '..', '..');
    const run = spawnSync('python3', ['-m', 'unittest', 'discover', '-s', 'scripts/gates/tests'], {
      cwd: root,
      encoding: 'utf8',
    });
    expect(run.stderr + run.stdout).toContain('OK');
    expect(run.status).toBe(0);
  });
});
