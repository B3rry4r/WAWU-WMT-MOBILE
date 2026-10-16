# FIX-18 · round history

Moved out of [tasks/FIX-18.md](../FIX-18.md) word for word, oldest first. The current state is in that file.

## Builder report

Backend `wmt/FIX-18` 0841821.
- **Files:** `src/wallet/wallet-history-take.ts` (new), `src/wallet/wallet.controller.ts`, `src/data-export-request/data-export-download.controller.ts`, `src/hub-app-options.ts`. Specs: `src/wallet/tests/wallet-history-take.spec.ts` (new, unit), and added tests in `wallet.contract.spec.ts`, `data-export.contract.spec.ts`, `hub-rate-limits.contract.spec.ts`. No existing test edited.
- **Declared types kept:** the two controllers still declare `take?: string` and `token: string | undefined`. Widening them to `string | string[]` changed the query schema in `contract/openapi.json` to `{}`, so the reader takes `unknown` instead and the contract is byte-identical.
- **Which `take` values were 500 (probed on main, 69 values plus 12 boundary values):** NaN, `-Infinity`, anything at or below -2^63 (the boundary is exact: -9223372036854774784 works, -9223372036854775808 fails), and a repeated `take` (an array is NaN as a number). Everything else answered 200 and still does: fractions, negatives (the last rows), `1e2`, `0x10`, `Infinity`, `take=` (empty is not sent), `take[]=5` (the simple parser makes that a different key).
- **How the socket-gone case reproduces:** Express asks the trust function about the peer only when `X-Forwarded-For` is present. A GET with that header followed by bytes that are not a request (`{"a":1}`) makes Node answer 400 and destroy the socket while the guard runs, so `remoteAddress` is `undefined`. 3 of 3 on main. The new spec does this over a raw socket and fails on main.
- **Capability checks:** each of the three requests answers its 4xx (specs and live run, above). Clean requests to both routes are byte-identical to main (live comparison). Protected routes 253/253 is left to the CI run on the push; the lock is untouched and `GET /wallet/history` with no `take` is what the lock probes.
- **Not done:** nothing open. No gap rows, no shared-change rows (no fenced file touched).

## Verifier report

_Not started._

