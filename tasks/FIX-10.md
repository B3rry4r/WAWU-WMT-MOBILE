---
id: FIX-10
title: Calls to WAWU ID give up after a bounded time
owner: YOU
area: FIX
order: 191
priority: launch
repo: wawu-backend
type: setup
status: review
depends_on: []
decisions: []
passes: [V1, V2, V3]
artboards: []
---
# FIX-10 · Calls to WAWU ID give up after a bounded time

## Current state

As of 16 Oct 2026.
- **Status:** review. Built; a verifier has not started.
- **Branches:** backend `wmt/FIX-10` at ad2b3c0 (from main 56f94d0); mobile `wmt/FIX-10` carries this file and one SHARED-CHANGES row (FIX-10 #1). No migration, no contract change.
- **CI on ad2b3c0:** Branch checks run 38900973732 green (suite 3 of 3 shards, contract, baseline, deploy-test-in-sync, netns); Protected routes run 38900973513 green (253/253); Gates run 38900973587 red with the same 16 FAIL lines as main, none in the files this task touches.
- **Next:** an independent verifier (V1, V2, V3). Merge needs the SHARED-CHANGES row FIX-10 #1 approved (`src/common/**` is fenced).

## Read first

- `docs/WORKFLOW.md` (the rules every task follows; section 4, fenced files)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `tasks/ME-11.md` (round 2: the owner lookup bounded at 2 s, and the note that sockets stay held)
- wawu-backend's `WawuIdClient`

## Goal

When WAWU ID stalls, every Hub request waiting on it holds a socket until WAWU ID answers. ME-11 bounded its own lookup at 2 s, but the client itself has no abort, so the chat, professionals and other callers still wait without limit.

## Scope

`WawuIdClient` aborts each call after a bounded time (an `AbortController`, the bound in one constant, a sensible default per call kind) and frees the socket; callers get a typed timeout they already map to a clear answer. No route's normal answers change.

## Capability checks

- [x] With WAWU ID held, every Hub route that calls it answers within the bound, and the open sockets return to baseline.
- [x] With WAWU ID healthy, answers are unchanged (protected routes 253/253).

## Builder report

Builder, 16 Oct 2026. Backend `wmt/FIX-10` at ad2b3c0 (c588214 is the fix, ad2b3c0 widens the spec's timing margin) from main 56f94d0; mobile `wmt/FIX-10` from main 2f0ca33. Evidence in the builder's scratch folder `fix10/` (`live-stall-check.log`, `live_check.py`, `mutant-no-reader-cancel.log`, `spec-b1.log`, `spec-b2.log`).

- **Fix.** `src/common/auth/wawu-id-exchange.ts` (new) holds one bounded exchange; `WawuIdClient` runs its four calls through it. Headers and body must both arrive inside the bound, or the call is aborted, the body reader cancelled and the socket freed. The deadline is a held `setTimeout`, not `AbortSignal.timeout`, for the reason FIX-01 found for Fintava (a body that stalls after the headers outlives the signal).
- **The bound, in one constant.** `WAWU_ID_TIMEOUT_MS`: reads 3 s (the identity lookup), writes 8 s (`setVerification`, `updateName`, `elevateVerificationTier`). Optional overrides `WAWU_ID_READ_TIMEOUT_MS` and `WAWU_ID_WRITE_TIMEOUT_MS` (whole ms up to 120000, anything else ignored), listed in `.env.example`.
- **What callers get.** A lookup that runs out of time answers the empty map it already answers when WAWU ID fails, so every list falls back to handles. One bound covers all chunks of a lookup (250 ids against a silent server: one request, one bound). A write throws `WawuIdTimeoutException`, a `BadGatewayException` (502) with the words that write already answers on failure; the tier call, which answered a bare 500, now answers 502 "WAWU ID did not answer in time. Try again in a moment.". No caller changed.
- **Live check** (stack `fix_10`, Hub from this branch, mock WAWU ID stopped with SIGSTOP). `GET /settings/privacy/blocked` (a lookup): healthy 200 in 0.04 s; held 200 in 3.03 s with handles; 15 at once all 200 at 3.04 to 3.20 s. `PATCH /users/me` with a name (a write): held 502 at 8.01 s with the same message as healthy. Sockets from the Hub to WAWU ID: 15 during the batch, 0 within 4 s (undici opens one idle connection after each abort and closes it at its 4 s keep-alive); baseline 0 to 1. After SIGCONT the list is byte-identical to the healthy one (length 1372).
- **Spec** `src/common/auth/tests/wawu-id-timeout.spec.ts`, 21 tests: three stall modes (no headers; headers then a stalled body; a body that never ends) under forced garbage collection, each call ending inside the bound plus margin with its typed answer and no socket held; 250-id lookup; 40 stalled lookups at once; healthy answers, refusals (500) and an unreachable server as before; the bound's defaults and config parsing. Mutant: removing the reader cancel fails 7 of the 8 stall-mode tests. The timing margin includes the event loop's own lag, because on a machine at load average 30 one call ended 3.7 s after a 0.3 s bound with nothing wrong in the client.
- **Checks.** `npx tsc --noEmit` 0; eslint and prettier clean on the changed files (two untouched files in `src/common/auth` already fail prettier on main). CI as in Current state.
- **Shared change.** SHARED-CHANGES FIX-10 #1 (`src/common/auth/wawu-id.client.ts` changed, `wawu-id-exchange.ts` new).
- **Not in scope, still unbounded.** `WawuIdAccountClient` (`src/account/wawu-id-account.client.ts`, account deletion and anonymise, two calls) and the JWKS fetch behind sign-in (`jwks-rsa`, its own 30 s default). The task names `WawuIdClient` only; a follow-up can give the account client the same exchange.
- **NOT RUN.** Against the real wawu-id (only the mock was held); the tier call live (the mock answers it, but no Hub route reaches it without an admin queue; the spec covers it).

## Verifier report

_Not started._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
