---
id: FIX-48
title: App tests never reach a real server: a network guard and a closed-port env under every test
owner: YOU
area: FIX
order: 0
priority: launch
repo: wawu-wmt-mobile
type: setup
status: verifying
depends_on: []
decisions: []
passes: [V1]
artboards: []
---
# FIX-48 · App tests never reach a real server: a network guard and a closed-port env under every test

## Current state

As of 17 Oct 2026.
- **Status:** verifying. Built by a Sonnet builder; not yet checked by an independent verifier.
- **Branch:** `wmt/FIX-48` on batch 7 (`wmt/MERGE-7` `04e49020`). Test setup only: no product file, no gate, no baseline, no backend change.
- **Id and order:** order 0 (renumbered at the batch 8 merge: 176 was also STACK-NUV's and FIX-47's, and the only free orders below CHECK-3 (298) were 131 (FIX-50's), 135 and 176; FIX-48 is a setup task, so it sits at the top beside OPS-01 and SETUP-01; the checker takes any whole number). It depends on nothing.
- **Built:** `jest/network-guard.js` and `jest.network-guard.js` (jest `setupFilesAfterEnv` in package.json); `src/__tests__/networkGuard.test.ts` (24 cases).
- **Full run on the guard:** 198 suites; no existing test reached a real host, so no test needed a mock added. One suite (`auth-signup.test.tsx`, 2 cases) failed on the first draft of the env stub, which gave the Hub and WAWU ID the same address; the stub now gives them two addresses (see Scope), and no test was edited.
- **Open findings:** none yet.
- **Next:** an independent verifier; then the lead merges it with the next batch.
- **History:** tasks/history/FIX-48.md.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- `src/api/env.ts` (its fallback is the production Hub) and `src/api/client.ts` (the client keeps the `fetch` it finds when it is created)

## Goal

REF-03's builder found that `src/api/env` falls back to `https://api.wawuafrica.com`. A test that does not mock `@/api/env` and does not replace `fetch` before the API client is built can send a real request from jest (one draft did, with a fake token). After this task a test that forgets its network mock hits a refusal that names the host, or a closed local port, and never production.

## Scope (test setup only; no product file, gate or baseline)

- **The guard** (`jest/network-guard.js`, installed for every test file by `jest.network-guard.js`): `fetch`, `XMLHttpRequest` and `WebSocket` refuse any host that is not `localhost`, `127.0.0.1` or `::1`. The error names the host and the path (never the query) and says what to mock. `fetch` rejects with it; `open` and `new WebSocket` throw it. Relative, `data:`, `file:` and `blob:` addresses carry no host and pass.
- **It sits under the mocks.** A test that sets `globalThis.fetch` (or `XMLHttpRequest`, or `WebSocket`) replaces the guarded global, so its requests are never seen.
- **It is loud even when the code catches the error.** Each refusal is also written to a list that an `afterEach` and an `afterAll` check; the test then fails with "This test sent N request(s) toward a real host". The API client turns a failed `fetch` into a "no connection" answer, so without this a test could go green with a real request attempted.
- **`@/api/env` is a closed local port in tests**: the Hub is `http://127.0.0.1:9` and WAWU ID is `http://localhost:9` (port 9, the discard port, has nothing listening). The two differ on purpose and neither starts with the other: `auth-signup.test.tsx` tells a call to the Hub from a call to WAWU ID with `startsWith(apiBaseUrl)`. The stub is a `jest.mock` of `./src/api/env` (the same module whether imported as `@/api/env` or `./env`); a test's own `jest.mock('@/api/env', ...)` wins over it.
- Not guarded: Node's `http` and `https` modules. Nothing in the app or its dependencies uses them for a request.

## Capability checks

- [ ] A deliberate test that calls `fetch('https://api.wawuafrica.com/api/hub/users/me')` fails with `Blocked a real network request from a test: fetch to host "api.wawuafrica.com"`, and a second one that catches the error still fails with "This test sent 1 request(s) toward a real host".
- [ ] `src/__tests__/networkGuard.test.ts`: a real host throws on fetch, XMLHttpRequest and WebSocket; localhost, 127.0.0.1 and `[::1]` pass; `127.0.0.1.evil.example` and `127.0.0.1@api.wawuafrica.com` are refused; a mocked fetch to `http://hub.test` is not seen; the API client built on a real-host env is stopped before it sends; `@/api/env` is local and closed by default.
- [ ] The full mobile check (`typecheck`, `lint`, `jest`, `gates`, `tasks`) exits 0.
- [ ] `git diff` is test setup only: `package.json` (the one `setupFilesAfterEnv` entry), `jest/network-guard.js`, `jest.network-guard.js`, `src/__tests__/networkGuard.test.ts`, and this task's files.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/FIX-48.md](history/FIX-48.md).

## Owner sign-off
