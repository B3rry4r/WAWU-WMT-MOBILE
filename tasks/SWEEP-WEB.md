---
id: SWEEP-WEB
title: Web sweep: the low findings of the website tasks
owner: YOU
area: SWEEP
order: 327
priority: after-launch
repo: all
type: web-port
status: todo
depends_on: [WEBPAY-01]
decisions: [R-49]
passes: [V1, V3, V4, V5, V6, V7, V9]
artboards: []
---
# SWEEP-WEB · Web sweep: the low findings of the website tasks

## Current state

As of 16 Oct 2026.
- **Status:** todo. Not scheduled: the lead schedules a sweep (docs/WORKFLOW.md section 4, 15 Oct 2026). No branch.
- **Open lows:** 8, in the table below. Collected from the open tasks and the lead's log of 10 to 15 Oct. Lows in older, merged tasks' reports are not collected here.
- **Waits on:** WEBPAY-01 (not merged yet; its lows are listed now so none is lost). The WALLET-40 rows wait for batch 7 to merge (the code they name is on its branch until then).
- **Next:** when scheduled, a builder fixes each row or rules it "no" with the reason in the row; a verifier checks each row.

## Read first

- `docs/WORKFLOW.md`, section 4 ("Severity, sweeps and task files")
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md`
- the verifier report named in each row

## Goal

Every low finding in the table is fixed, or ruled "no" with the reason written in its row, so that nothing a verifier reported as low is lost and no round was spent on it.

## Scope

The website (`wawuafrica`): WEBPAY and WEB tasks. Paused with the website (R-49), hence after launch. Only the rows in the table; nothing else is touched. A row whose task is not merged yet waits for that merge (or is fixed on that task's branch if the lead says so).

## Capability checks

- [ ] Each row in the table is fixed with a test or a measurement that fails without the fix, or is ruled "no" with the reason in the row.
- [ ] Every row names the commit that closes it, or the ruling.

## Open lows

| Source task | Id | Finding | Verifier report |
|---|---|---|---|
| WEBPAY-01 | D6 | The account number wraps at 390 px ("819 933" then "1992"), the one thing on that card a person copies. Note. | branch `wmt/WEBPAY-01`, `tasks/WEBPAY-01.md`, Verifier report, line 140 |
| WEBPAY-01 | D7 | The step rail changes length mid-flow when the selfie is on ("of 4" then "of 5"). Note. | branch `wmt/WEBPAY-01`, `tasks/WEBPAY-01.md`, Verifier report, line 141 |
| WEBPAY-01 | D9 | `globals.css` sets `color-scheme` on every `input[type="date"]` site-wide; the builder's report does not list it. Note. | branch `wmt/WEBPAY-01`, `tasks/WEBPAY-01.md`, Verifier report, line 143 |
| WEBPAY-01 | D10 | Neither the details form nor the PIN is a `<form>`: Enter does not submit; Chrome logs a password-field warning. Note. | branch `wmt/WEBPAY-01`, `tasks/WEBPAY-01.md`, Verifier report, line 144 |
| WEBPAY-01 | D11 | The selfie hand-off assigns whatever URL the server answers with no https check. Note. | branch `wmt/WEBPAY-01`, `tasks/WEBPAY-01.md`, Verifier report, line 145 |
| WEBPAY-01 | D12 | The wallet screen is not exactly as on main for a creator: one more call, and an "Open your wallet" card above the old payout wallet. Note. | branch `wmt/WEBPAY-01`, `tasks/WEBPAY-01.md`, Verifier report, line 146 |
| HOME-16 | F2 | Web (follows the app after launch, R-49): a `tgif_daily` row now appears in the web's GET /notifications; the web has no case for the kind and its button goes to /notifications. Safe and additive; give the web a case when it follows. | `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/HOME-16.md`, finding 2 |
| WALLET-40 | info 4 | Web (follows the app after launch, R-49): the web's /notifications has no `wallet_ready` in its kind type; an unknown kind shows the label "Update", the Bell icon and the href /notifications (`kinds.ts` `default`, `NotificationCard.tsx` `??`). Sensible and additive, the same as `money_in`. Give the web the kind when it follows. | `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/WALLET-40.md`, finding 4 (info) |

## Builder report

_Filled in by the builder._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md)._

## Owner sign-off

_Owner: date, and "go" or what blocks it._
