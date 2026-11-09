# WEBAPP-01 · round history

Moved out of [tasks/WEBAPP-01.md](../WEBAPP-01.md) word for word, oldest first. The current state is in that file.

## Builder report

Files: `package.json` (`web:export`), `vercel.json`, `src/lib/appLinks.ts`, `src/features/content-detail/model.ts` (contentLink uses the shared helper), `src/__tests__/webLinkOrigin.test.ts`, `docs/WEB-DEPLOY.md`.
- Open or refresh any path: `npm run web:export` EXIT 0; `dist/` served by a local static server with the vercel.json rewrite (port 16090): /content/abc, /wallet, /u/ada, /receipt/X1 and / all returned 200 with the app's index.html. Server stopped.
- Links: `webLinkOrigin.test.ts` proves ios and android keep wawuafrica.com, web uses window.location.origin (usewmt.com), and web with no window falls back. 26 suites, 235 tests passed (appLinks, content-detail, me, selfie link specs). tsc and eslint on changed files EXIT 0.
- CSP hosts: self; api.wawuafrica.com and id.wawuafrica.com (Hub, WAWU ID); *.digitaloceanspaces.com (bucket, uploads PUT and media); *.amazonaws.com (movie poster images, Flixora S3); wawuafrica.com (media, theme track); fastly.jsdelivr.net plus wasm-unsafe-eval (the QR scanner loads zxing-wasm from it, found in the built bundle). checkout.flutterwave.com left out: the bills WebView does not draw on the web (readiness section 2), so the page never calls it.
- NOT RUN: a real Vercel build (owner deploys); the browser actually enforcing the CSP (no browser here), so a blocked host would show only in a real page; no picture checks (T0). The bucket region is not in the repo, so the wildcard Spaces host is used. Gate counts: full `npm run check` not run (T0, batch).

## Verifier report

