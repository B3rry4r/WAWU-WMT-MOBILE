---
id: OPS-26
title: Money oversight lists the Hub could not serve (earnings in review, stuck wallet openings, identity holds), read-only, and the dashboard sections for them
owner: YOU
area: OPS
order: -153
priority: launch
repo: all
type: backend-endpoint
status: verifying
depends_on: []
decisions: [R-1, R-6, R-11, R-47, R-55]
passes: [V1, V2, V3, V4, V6, V7, V9]
artboards: []
tier: T2
---
# OPS-26 · Money oversight lists

## Current state

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
