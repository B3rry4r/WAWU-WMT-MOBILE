---
id: OPS-26
title: Money oversight lists the Hub could not serve (earnings in review, stuck wallet openings, identity holds), read-only, and the dashboard sections for them
owner: YOU
area: OPS
order: -153
priority: launch
repo: all
type: backend-endpoint
status: building
depends_on: []
decisions: [R-1, R-6, R-11, R-47, R-55]
passes: [V1, V2, V3, V4, V6, V7, V9]
artboards: []
tier: T2
---
# OPS-26 · Money oversight lists

## Current state

**Verifier (24 Oct 2026, lean T2 check, a separate Sonnet agent): FIX.** One medium: `reason` on `GET /admin/money/earnings/in-review` sends the `discrepancy` column as written, so a crafted row puts a BVN-like string, phone, hash and name on the wire (F1 below). Everything else held: read-only (no row changed across the reads, no provider call), roles, paging with ties, the dashboard gate fix (comment only), all checks green. Status back to building for F1; lows F2 to F4 go to `tasks/SWEEP-APP.md`.

As of 24 Oct 2026, built by a Sonnet builder (T2, bundle B16): backend `wmt/OPS-26` on `origin/main` `b69aa7f`, dashboard `wmt/OPS-26` on `origin/wmt/OPS-23` `ca16990` (merged in, no rebase). Status verifying. Nothing here moves a naira, calls a provider or changes a row: three `GET` routes over tables that already exist, and the dashboard sections that read them.

Default (lead), owner may override: read-only admin `GET` routes over existing money tables are allowed (lead ruling, 24 Oct 2026). Each is additive, guarded by `AdminAuthGuard` + `AdminRolesGuard`, a cursor page per `docs/contract/CONVENTIONS.md` section 6 (20 rows, 1 to 100, oldest first), answers in kobo from the row (never summed) or by WAWU account id, and says no BVN, hash, phone, name or provider text. No schema change, no migration, no protected route touched.

| # | Before (`origin/main`) | After |
|---|---|---|
| 1 | no list of earnings a person has to look at (G-OPS-25-1); R-55 sends a refused move to review 72 hours after the first refusal and only the log said so | `GET /admin/money/earnings/in-review` (`superadmin`, `finance`): daily moves (`EarningMove.reviewSince`) and single earnings (`EarningSettlement.reviewSince`) in review, one row each (an earning inside a move in review is the move's row, never listed twice), with kind, payee id, `amountKobo` from the row, earnings count, day or title, provider, first refused at, in review since, and our own reason. Dashboard: "Earnings a person has to look at" |
| 2 | no list of wallet openings that are stuck (G-OPS-25-2, G-37) | `GET /admin/wallet-openings/stuck` (`superadmin`, `support`): openings with no wallet that wait on the provider or a person: `conflict` at once, `opening`, `unknown` or `open` after 60 minutes (`STUCK_AFTER_MINUTES`) without finishing. State, our failure code (anything not a snake_case code is not sent), provider, tries, started, the provider's review stage. Dashboard: "Wallet openings that are stuck" |
| 3 | no list of identity holds; the release needs an account id nobody could find (G-OPS-25-2) | `GET /admin/identity-holds` (`superadmin`, `support`, as the release): openings in `review` or `stopped` that still hold a BVN (not `released:`) with no wallet, longest held first: exactly what the release can act on. Dashboard: "Identity holds" with a "Let go" button per row, which opens the same confirm as the paste-an-id form and calls the release route the Hub already offers |
| 4 | `finance/payouts/page.tsx:39` failed the dashboard's deferrals gate ("nobody reads" in a comment read as known dead code), so the dashboard CI gates job was red | the comment is reworded; the gate and its baseline are untouched: `scripts/gates/run.py` EXIT 0 (0 fail, 6 accepted as before), `check_baseline.py` EXIT 0 |

Gap rows (BACKEND_GAPS.md): G-OPS-25-1 and G-OPS-25-2 are served by this task (the brief's "identity holds" list is the one G-OPS-25-2 also names). G-OPS-25-3 (dm-refunds retry, the Flutterwave rail) stays open: it is not one of the three lists and the web keeps that rail until after launch.

Proof (backend, `wmt/OPS-26` `b124ee6`; dashboard `62a47b3`):

- Specs against a real database with planted rows: `earnings-in-review.contract.spec.ts` 9 tests, `admin-opening-lists.contract.spec.ts` 18 tests (no token 401, `finance`/`reviewer`/`support` refused as each route says, order, paging by 1, 2 and 3, a bad limit or cursor 400, nothing leaked: no hash, phone, BVN or provider words, nothing changed by reading). With the existing identity-hold spec and the two route inventories (`publishing-gate-coverage`, `hub-rate-limits`): 5 suites, 81 tests, EXIT 0. `test:protected` 253 tests EXIT 0 (needs `db:seed` on the test database). `contract:build` EXIT 0, +361 lines, 3 paths and 6 schemas added, no line removed. Backend gates EXIT 0 (0 fail, 88 accepted as before), `check_baseline.py` EXIT 0, `tsc` and `eslint` on the changed files EXIT 0.
- Dashboard: `tsc`, `eslint src`, `check:oversight-contract` (against backend `wmt/OPS-26`), `check:invariants`, `check:contrast`, gates and baseline, all EXIT 0.
- Live (local stack `b16ov`, Nuvion stand-in, planted rows, three signed-in admins): the three routes answered 200 for the allowed roles, 403 for the others and 401 with no token; the dashboard showed all three sections at 1440 px light and dark, per-section refusals for `finance` and for `support`, a row's "Let go" opened the confirm, released a hold (opening `expired`, one `AdminOpsAudit` row, the person told once, the hold off the list), and a paste of an account with no opening showed the Hub's own words ("That account has no wallet opening with a hold to release."). Pictures: `scratchpad/dash-b16/oversight-superadmin-1440-{light,dark}.png`, `oversight-{finance,support}-1440-light.png`, `oversight-release-{confirm,done,refused,again}-1440-light.png`. The stack, the dashboard and every port are stopped.

Not done, NOT RUN: the dashboard on a phone width; "Load more" clicked in a browser (the stack held 4, 4 and 3 rows against pages of 25; paging is proved in the specs and by the live `nextCursor` on `limit=2`); the backend suite on GitHub (the lead watches CI); `check:contract` and `check:ops-contract` of the dashboard (they fail on this machine before reading a line: no web checkout for the first, the second reads `main.ts` for a prefix that moved to `hub-app-config.ts`, both from before this task).

Open low, for `tasks/SWEEP-APP.md`: (a) the 60 minutes is a constant, not a setting; a Nuvion review that really takes longer than an hour lists as `open` with stage "Being checked", which is accurate but not stuck; (b) `finance` reads earnings only: the opening lists follow the release route's roles; (c) the lists count and page with `NOT EXISTS` over `FintavaWallet` and no new index, fine at today's volume; (d) the dashboard's older generators (`check:contract`, `check:ops-contract`) need their own repair.

## Verifier report

Under check: backend `origin/wmt/OPS-26` `b124ee6` against `origin/main` `b69aa7f`; dashboard `62a47b3` against `origin/wmt/OPS-23` `ca16990`. Verdict **FIX** (one medium). The lean check ran the brief's three tests plus the listed commands; V4, V6 (browser states) and V7 (flow walk) were NOT RUN here (no pictures taken, no browser; the builder's live pictures were not re-taken).

| Check | Result | Evidence |
|-------|--------|----------|
| 1 Read-only | passed | Code: only `findMany`, `count` and `SELECT` raw queries; no write, no provider import (`earnings-in-review.service.ts`, `admin-opening-lists.service.ts`; `reviewStageOf` is pure). Live (own stack `v26ov`, Nuvion stand-in): md5 of every row of 208 tables identical before and after 130+ reads of the three routes (`CommunityNoticeCursor` left out: it ticks every 10 s with no request at all, shown); the stand-in saw no new request. |
| 2a Nothing personal leaks (openings) | passed | A planted `failure` holding an 11-digit BVN-like number came back as `failureCode: null`; planted phone and `bvnHash` never on the wire; a `NuvionEntity` whose refusal reasons held a BVN-like string gave only the stage word. Response keys are the typed ones only. |
| 2b Nothing personal leaks (earnings) | **failed** | F1. |
| 2c Roles | passed | Allowed roles 200 (`in-review`: superadmin, finance; `stuck` and `identity-holds`: superadmin, support); every other admin role 403; no token 401; junk token 401; a real user token (mock WAWU ID, RS256) 401, the same answer the existing `before-start` route gives, not 403. `Cache-Control: no-store` on all three. |
| 2d Cursor paging | passed | Limits 1, 2, 3, 4, 7 each equal the `limit=100` list exactly (no repeat, no gap) over ties: a daily move and an earning at the same instant (move first), two moves at the same instant, openings at the same instant with ids `A_1`, `Zed-1`, `zed-1` (C collation order). 60-minute edge: 59 min not listed, 61 listed; `conflict` listed at once; wallet, `released:` hash, `failed`, `expired`, `landed` moves and a move's member earning all left out. Bad `limit` (0, 101, abc, -1, 1.5), bad cursor, other list's prefix, 301 chars and an injection-shaped cursor all 400 with the fixed sentence, nothing echoed. |
| 3 Dashboard gate fix | passed | Diff of `finance/payouts/page.tsx` is the 2 comment lines only; `scripts/gates/**` and `baseline.json` not in the diff. OPS-23 base: gates EXIT 1 (1 fail, `deferrals`, `payouts/page.tsx:39`, 142 files, 6 accepted); OPS-26: EXIT 0 (0 fail, 6 accepted, 146 files). |
| Backend commands | passed | `tsc --noEmit` EXIT 0; `eslint` (no `--fix`) on the 11 changed `.ts` files EXIT 0; 5 suites, 81 tests EXIT 0 (`earnings-in-review` 9, `admin-opening-lists` 18, `admin-identity-holds`, `publishing-gate-coverage`, `hub-rate-limits`; the specs named "fintava" only in table names and one source path string, no Fintava double); `test:protected` 253 tests EXIT 0 (`db:seed` first); `contract:build` EXIT 0, `git status` clean; gates EXIT 0 (1810 files, 0 fail, 135 warn, 88 accepted); `check_baseline.py` EXIT 0 (124 entries). |
| Dashboard commands | passed | `tsc --noEmit` EXIT 0; `eslint src` EXIT 0; `check:oversight-contract` EXIT 0 (current against `origin/wmt/OPS-26`); `check:invariants` EXIT 0 (146 files); `check:contrast` EXIT 0; gates EXIT 0; baseline EXIT 0 (6 entries); `npm run build` EXIT 0. |

Findings, ranked:

- **F1, medium, defect.** `reason` is the raw `discrepancy` column. `src/money/earnings/earnings-in-review.service.ts:164` (daily move) and `:180` (single earning) send `clip(...)` (`:86-89`, only a 400-character cut). Repro: insert an `EarningMove` with `reviewSince` set and `discrepancy` holding a sentence with a BVN-like 11-digit number, a phone, a 32-character hash and a name (made-up test values), then `GET /api/hub/admin/money/earnings/in-review` as `finance`: the whole string comes back, and the dashboard's "Why" cell (`src/components/oversight/EarningsInReview.tsx`) prints it. Every writer today writes one of our own sentences (`earning-settlement.service.ts:463-472, 927-953, 1195-1344`), so real rows are clean; but the task says "no BVN, hash, phone, name or provider text", the opening lists already guard `failure` with a snake_case shape (`admin-opening-lists.service.ts:40, 94`), and the spec plants only our own sentences (`earnings-in-review.contract.spec.ts:224-233`). Send a reason only when it is one of the known sentences (or a reason code), else `null`, and plant a crafted `discrepancy` in the spec.
- **F2, low.** `provider` is echoed as stored on all three lists (`earnings-in-review.service.ts:161,178`; `admin-opening-lists.service.ts:98,144,189`): a planted provider value holding an 11-digit BVN-like number came back. A single earning's `title` is echoed too (an item title, as `before-start` already does). Both are system-written columns. Sweep: map `provider` to `fintava` or `nuvion` and send nothing else.
- **F3, low.** The holds list is not limited to the provider the server runs, but the release acts only on its own provider's rows (`reviewed-opening.ts` `releaseHold`, `isRowOf`), so "exactly what the release can act on" holds for one provider. Repro on the Nuvion stack: an opening in `review` with provider `fintava` and no wallet is listed, and `POST /admin/identity-holds/<id>/release` answers 404 "That account has no wallet opening with a hold to release." (the `nuvion` row released, 200). A Fintava row is never in `review` or `stopped` in real data. (This one release ran on my own stack after the read checks.)
- **F4, low, note.** Cursor ids must match `^[A-Za-z0-9_-]{1,64}$` (`admin-opening-lists.service.ts:38`, `earnings-in-review.service.ts:35`); an account id with another character would make page 2 a 400. WAWU ids are UUIDs.

Test-gap note: both new specs mount a small module, not `AppModule`; the live run above shows the routes mounted and the throttler (20 per second) in front of them.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md`
- `tasks/OPS-25.md` (the screen these sections join) and `BACKEND_GAPS.md` rows G-OPS-25-1 to G-OPS-25-3
- Backend `src/money/earnings/earnings-in-review.service.ts`, `src/admin/identity-holds/admin-opening-lists.service.ts` (`wmt/OPS-26`)
- Dashboard `src/components/oversight/` (`EarningsInReview.tsx`, `StuckOpenings.tsx`, `IdentityHolds.tsx`), `scripts/generate-oversight-contract.mjs`

## Goal

Finance sees which earnings are waiting on a person, and support sees which wallet openings are stuck and which identity holds can be let go of, from the dashboard, without asking the log.

## Scope

`wawu-backend`: `src/money/earnings/` (one handler, one service, one DTO, one type), `src/admin/identity-holds/` (two read-only controllers, a service, types, a DTO), one provider line in `src/money/money.module.ts`, `contract/openapi.json` (regenerated). `wawu-dashboard`: `src/components/oversight/`, `src/lib/api/admin-money-oversight.ts`, the oversight generator and its generated file, the page description, the one comment in `finance/payouts/page.tsx`.

## Capability checks

- [x] Finance can read the daily moves and single earnings in review, oldest first, each in kobo from its row, and load more.
- [x] Support can read the wallet openings that are stuck and the identity holds, and a role a route refuses sees a plain refusal for that section only (live: `finance` and `support`).
- [x] Support can let go of a hold from its row and sees the Hub's answer in its own words (live: released, already released, and a refusal).
- [x] Nothing on the page moves money, marks anything paid or shows a BVN, a hash or a phone number.
- [ ] On a phone: NOT RUN (no device in this session).
