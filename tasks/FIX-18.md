---
id: FIX-18
title: Three small 500s: wallet history paging, a repeated export token, a request whose socket has gone
owner: YOU
area: FIX
order: 222
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: [FIX-08]
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# FIX-18 · Three small 500s: wallet history paging, a repeated export token, a request whose socket has gone

## Current state

As of 16 Oct 2026.
- **Status:** merging (lead). Checked once by an independent verifier (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/FIX-18.md`): verdict merge, nothing medium or worse. Batch 3: stacked on `wmt/FIX-26` (this branch contains it); API types regenerated from backend `wmt/FIX-18` (e0ad2a0).
- **Branches:** backend `wmt/FIX-18` 0841821 (on main 56f94d0). Mobile `wmt/FIX-18` carries only this file, `docs/LOG.md` and `docs/PROGRESS.md`. No migration, no contract change (`contract/openapi.json` rebuilds byte-identical), no new route.
- **Built:**
  - `GET /wallet/history`: `take` that is not a number (`abc`, `NaN`, `1_0`), sent twice or more, or a negative Prisma cannot take (`-Infinity`, `-1e21`, at or below -2^63) answers 400 "take must be a single number." or "take is out of range.". Code in `src/wallet/wallet-history-take.ts`.
  - `GET /settings/privacy/export/download`: a repeated `token` answers the route's own 404 ("This link is not valid or has expired."), the same bytes as any failed link.
  - `hubTrustProxy` and `isLoopbackAddress` (`src/hub-app-options.ts`): an `undefined` address is not loopback and never throws.
- **Judgement call to confirm:** the task says "not a whole number" answers 400, and also that every answer that is not a 500 today stays byte-identical. A fraction (`1.5`, `0.5`, `-0.5`) answers 200 today (Prisma truncates it), so it stays 200; only values that answered 500 changed. If the owner wants fractions refused, that is a behaviour change of `/wallet/history` and the lock must be re-read first.
- **Evidence:** a live Hub from this branch against the unmodified one, 94 requests (69 `take` values, 18 `token` values, 4 signed-link cases, 3 repeated-token variants) and raw sockets. 67 answers that were not 500 are identical (status, content type, body; only timestamps differ in the genuine download). 27 former 500s now answer 400 or 404. 7 raw-socket variants with an `X-Forwarded-For` header: 0 `toLowerCase` errors on the branch, 6 per 3 requests on main for the three variants that reproduce it (a GET followed by bytes that are not a request).
- **Checks:** `tsc --noEmit` EXIT 0; eslint clean on every changed non-wallet-contract file and on all added lines (the wallet contract spec has 70 older findings of its own, none new); 4 specs, 61 tests, EXIT 0; the 5 new tests carrying "FIX-18" fail on main's code (4 fail, the byte-identical one passes, as it should).
- **Open findings:** blocker 0, high 0, medium 0. Lows: nuvion-opening.contract.spec draws its test address at random from 249 values, so two equal draws give a 429 (test robustness, not this branch). They are in tasks/SWEEP-APP.md with the report path.
- **Next:** the lead opens one pull request per repo from the last batch 3 head, for the owner to merge after batch 2; then mobile sign-off.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows; section 4, fenced files)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `tasks/FIX-17.md` ("Findings, for a follow-up") and `tasks/FIX-08.md` (verifier note O2)

## Goal

Verifiers found three requests that answer 500 on main, each outside the task that found it:
- `GET /wallet/history?take=<not a number>` (and `take` sent twice): the controller passes `Number(take)` (NaN) to Prisma's `take`.
- `GET /settings/privacy/export/download?token=a&token=b` (a repeated `token`): an array reaches `verifyExportLink`.
- When the socket is already gone before anything reads `req.ip` (a `GET` with an unframed body), `hubTrustProxy` calls `isLoopbackAddress(undefined)` and throws a TypeError, logged as a 500 (OPS-11's file).

## Scope

- `take` that is not a whole number, or sent twice, answers 400 naming `take`. Every answer that is not a 500 today stays byte-identical. `/wallet/history` is a protected route: if the lock captures any request this changes, stop and say so.
- A repeated or non-string `token` answers the route's own 404 for a failed link, the same bytes as any other failed link.
- An unknown socket address is treated as not loopback (never trusted) and never throws.
- No em-dashes in any new message.

## Capability checks

- [ ] Each of the three requests answers its 4xx, not 500 (specs and a live run).
- [ ] Clean requests to the two routes answer byte-identically to main.
- [ ] Protected routes 253/253 with the lock unchanged.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/FIX-18.md](history/FIX-18.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
