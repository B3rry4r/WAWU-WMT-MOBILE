# WEBAPP-12 · round history

Moved out of [tasks/WEBAPP-12.md](../WEBAPP-12.md) word for word, oldest first. The current state is in that file.

## Builder report

Files: `app.json`, `vercel.json`, `scripts/design/gen_icons.js`, `src/components/icon/icons.generated.ts` (regenerated), `public/wmt-sw.js` (new), `src/lib/pictureCache.ts` (new), `src/lib/WebFrame.tsx`, `src/__tests__/pictureCache.test.ts` (new), `SHARED-CHANGES.md` (3 rows, applied in this commit), this file, `tasks/history/WEBAPP-12.md`, `docs/LOG.md`. Capability checks: before and after numbers above, same method; second visit pictures from cache proven by the warm-sw rows (0 bytes, all cached); pictures of each screen loading and loaded at 390 light, 390 dark and 1440 in `/tmp/wmt-shots/webapp-12/`. Tests: the worker's own file is run in a fake browser (same picture signed twice is fetched once; unsigned, own-site, POST, video and script requests are not touched); android and ios do nothing. Gate counts: 0 fail, 17 warn before and after (no new). Not run: see Current state.

## Verifier report

