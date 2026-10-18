/*
 * FIX-87: every write that carries an Idempotency-Key is classified, so a new one cannot get (or miss) the 30 s timeout by accident.
 *
 * A write passes `fetch: resendsUnderKey` (src/api/client.ts) exactly when its screen sends it again under that SAME key when no
 * answer came. The writes that carry a key and do not are listed here with the reason. This test reads the source: a call that
 * carries an Idempotency-Key and is in neither list fails it, and so does an entry that no longer matches a call.
 */
import fs from 'fs';
import path from 'path';

const SRC = path.resolve(__dirname, '..');

/** Keyed writes that are NOT re-sent under the same key by their screen, by the call's path, with why. */
const NEVER_ABORTED: Record<string, string> = {
  '/api/hub/dm/{creatorWawuId}/send/wallet':
    'Asking a paid question: the key is made fresh on every ask (useAsk.ts), so a repeat is a new draft, not a re-send under the key.',
  '/api/hub/events/{id}/door/check-in':
    'The door scan keeps its own 10 s wait and Try again (doorApi.ts, ANSWER_WAIT_MS), shorter than the shared one.',
};

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '__tests__' || entry.name === 'testing' || entry.name === 'node_modules') continue;
      sourceFiles(full, out);
    } else if (/\.(ts|tsx)$/.test(entry.name) && !/\.generated\.ts$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

type Site = { file: string; route: string; optedIn: boolean };

/** Every `api.POST(` / `api.PUT(` call in the app's source whose text names an Idempotency-Key header. */
function keyedWrites(): Site[] {
  const sites: Site[] = [];
  for (const file of sourceFiles(SRC)) {
    const text = fs.readFileSync(file, 'utf8');
    for (const match of text.matchAll(/api\.(POST|PUT)\(\s*'([^']+)'/g)) {
      let depth = 0;
      let i = (match.index ?? 0) + match[0].indexOf('(');
      for (; i < text.length; i += 1) {
        if (text[i] === '(') depth += 1;
        else if (text[i] === ')') {
          depth -= 1;
          if (depth === 0) break;
        }
      }
      const call = text.slice(match.index, i + 1);
      if (!call.includes("'Idempotency-Key'")) continue;
      sites.push({ file: path.relative(SRC, file), route: match[2], optedIn: /\bfetch:\s*resendsUnderKey\b/.test(call) });
    }
  }
  return sites;
}

describe('every write that carries an Idempotency-Key is classified', () => {
  const sites = keyedWrites();

  it('finds the keyed writes (so an empty scan cannot pass)', () => {
    expect(sites.length).toBeGreaterThanOrEqual(24);
  });

  it('each one either passes fetch: resendsUnderKey or is listed as never aborted, with a reason', () => {
    const unclassified = sites.filter((s) => !s.optedIn && !(s.route in NEVER_ABORTED)).map((s) => `${s.file}: ${s.route}`);
    expect(unclassified).toEqual([]);
  });

  it('no call is both opted in and listed as never aborted', () => {
    const both = sites.filter((s) => s.optedIn && s.route in NEVER_ABORTED).map((s) => `${s.file}: ${s.route}`);
    expect(both).toEqual([]);
  });

  it('every never-aborted entry still matches a keyed write', () => {
    const present = new Set(sites.map((s) => s.route));
    expect(Object.keys(NEVER_ABORTED).filter((route) => !present.has(route))).toEqual([]);
  });
});
