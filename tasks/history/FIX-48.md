# FIX-48 · round history

Moved out of [tasks/FIX-48.md](../FIX-48.md) word for word, oldest first. The current state is in that file.

## Builder report

Sonnet builder, 17 Oct 2026. Branch `wmt/FIX-48` on `wmt/MERGE-7` `04e49020`. Test setup only.
- **Guard:** `jest/network-guard.js` wraps `fetch`, `XMLHttpRequest.prototype.open` (when the global exists) and `WebSocket` (a Proxy, so statics and `instanceof` still work). Installed by `jest.network-guard.js` in jest `setupFilesAfterEnv`. In this jest environment `fetch` is React Native's, `WebSocket` is React Native's, and `XMLHttpRequest` is undefined until a test supplies one (the Create tests do, with a scripted fake).
- **Env:** `jest.mock('./src/api/env', ...)` in the setup file: Hub `http://127.0.0.1:9`, WAWU ID `http://localhost:9`.
- **Full run on the guard (198 suites, 3551 tests):** no existing test tripped the guard. The only failures were 2 cases in `src/__tests__/auth-signup.test.tsx` ("nothing at sign-up goes to the Hub", "nothing in the mailed sign-up asks WAWU ID for a text"). They asserted `calls.filter((c) => c.url.startsWith(apiBaseUrl))` is empty, and my first stub gave the Hub and WAWU ID one address, so every WAWU ID call matched. Fixed in the stub (two addresses), not in the test: no test file was edited, no assertion touched.
- **Tests that mock `@/api/env` themselves** (auth-guard, route-graph, routeGuard, pushFlow, signOutPush) and **tests that swap fetch after the client is built** (for example meMenuRoute): unchanged. The first now win over the stub; the second send through the guarded fetch to `127.0.0.1:9`, never to production.
- **Deliberate proof:** `fetch('https://api.wawuafrica.com/api/hub/users/me')` in a throwaway test failed with `NetworkGuardError: Blocked a real network request from a test: fetch to host "api.wawuafrica.com" (https://api.wawuafrica.com/api/hub/users/me). Tests may only reach localhost or 127.0.0.1. ...`; a second throwaway test that caught the error failed with `This test sent 1 request(s) toward a real host`. Both removed.
