---
id: SWEEP-1111
title: Sweep of 11 Nov: the low findings of the day's Hub, WAWU ID and web tasks
owner: YOU
area: SWEEP
order: 391
priority: after-launch
repo: all
type: ops
status: todo
depends_on: []
decisions: [R-133, R-135, R-136, R-137]
passes: [V1, V3]
artboards: []
tier: T1
---
# SWEEP-1111 · Sweep of 11 Nov: the low findings of the day's Hub, WAWU ID and web tasks

## Current state

As of 11 Nov 2026.
- **Status:** todo. Cut by the lead when the day's tasks merged (ID-LINKS, WEB-STRIP, STUDIO-ON, OPS-DEL-TEST, APP-RESET, OPS-CLEAR-ROOMS, LEGAL-ELEVEN). Not scheduled: the lead schedules a sweep (docs/WORKFLOW.md section 4). No branch.
- **Open lows:** 18 rows, in the table below. Every row names the report it came from; the report has the file, line and the test that would kill it.
- **Owner word needed on one row only:** W2 (what the join page says about the App Store and Google Play while the phones are parked, R-134). Until the owner answers, W2 stays as it is.
- **Next:** when scheduled, a builder fixes each row or rules it "no" with the reason in the row; a verifier checks each row.

## Read first

- `docs/WORKFLOW.md`, section 4 ("Severity, sweeps and task files")
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- the report named in each row (`tasks/history/<ID>.md`)

## Goal

Every low finding in the table is fixed, or ruled "no" with the reason written in its row, so that nothing a verifier reported as low is lost and no round was spent on it.

## Scope

Only the rows in the table; nothing else is touched. Hub rows are Hub code (`wawu-backend`), I rows are WAWU ID (`wawu-id`), W rows are the website (`wawuafrica`, which keeps working as built until it follows the app, so a W row that changes behaviour waits for the owner), A rows are this app. The two one-off commands (OPS-DEL-TEST, OPS-CLEAR-ROOMS) are run once by the owner; their rows matter only if they are run again.

| # | From task | Low | Report | Status |
|---|---|---|---|---|
| I1 | ID-LINKS | Test gap: the "this was not me" link is tested only through `securityUrl` with settings unset; the service path is covered only with FRONTEND_URL set. | history/ID-LINKS.md, verifier round 1, low 1 | open |
| I2 | ID-LINKS | Test gap: activation is tested through `sendActivation` only; the resend and create call sites are not exercised. | same, low 2 | open |
| I3 | ID-LINKS | `src/auth/phone-signup.service.spec.ts` fails 4 to 5 tests on wawu-id main (different names each run). Pre-existing, not ID-LINKS's. Root-cause it; never skip or loosen it. | same, low 3 | open |
| A1 | APP-RESET | An expired phone code reads "That code isn't right", and only after the new password is typed. | tasks/APP-RESET.md, Open lows | open |
| A2 | APP-RESET | The New password step after a phone code shows the full +234 number where A4 masks it. | same | open |
| A3 | APP-RESET | Resend is open at once (recorded: WAWU ID names no wait). | same | open |
| A4 | APP-RESET | "Already activated" is matched by the server's English words. | history/APP-RESET.md, verifier lows | open |
| W1 | WEB-STRIP | The Android app's intent filters still list `/activate` and `/reset-password`, so an Android phone with the app may open the app on those mails (phones parked, R-134). | tasks/WEB-STRIP.md, Open | open |
| W2 | WEB-STRIP | The join page still promises the app on the App Store and Google Play (`JoinLanding.tsx:143` and `:346`, `join-content.ts:55`, `page.tsx:20`). | same | waits for the owner's word |
| W3 | WEB-STRIP | `/payment/return` still answers 307 to /join (as on main). | same | open |
| S1 | STUDIO-ON | One person's 403 hides Podcast for everyone in that process for an hour (F3, note). | history/STUDIO-ON.md, F3 | open |
| S2 | STUDIO-ON | `ai.podcast_studio_api_ok` has default and minimum -1; whether the admin dashboard's count input accepts -1 was not seen (F4). | same, F4 | open |
| D1 | OPS-DEL-TEST | The table-walk spec reads only column names, so a payment reference inside a JSON column is invisible to it. | history/OPS-DEL-TEST.md, last verifier round, Low | open |
| C1 | OPS-CLEAR-ROOMS | L1: a CreditSpend with no earning row (before the ledger) is deleted with its room; its lot cannot be known. | history/OPS-CLEAR-ROOMS.md, L1 | open |
| C2 | OPS-CLEAR-ROOMS | L2 to L4: a restored sandbox store pass is kept forever; a completed pass payment mid-refund has no keep rule; Purchases still shows "Room pass" for a gone room and its tap opens a missing room. | same, L2 to L4 | open |
| C3 | OPS-CLEAR-ROOMS | L6, test gap: no spec row for a funded earning with `hostShareKobo = 0` and no settlement (it must clear). | same, L6 | open |
| L1 | LEGAL-ELEVEN | A failed race delete of the legal agent is not logged. | history/LEGAL-ELEVEN.md, verifier round 1 re-check, L1 | open |
| L2 | LEGAL-ELEVEN | L2 and L3: a socket close after a response but before `agent_response_complete` fails the turn; an agent with no `created_at_unix_secs` sorts as oldest. Both are shown or cleared by the first real legal turns. | same, L2 and L3 | open |
| F1 | FEE-01 | G1 (medium, owned here): `settle()` reopens a reversed fee record without restoring `vatMinor`, and a reopened record claims `kept = F - actual` even when fee-back already gave the fee back (a late success after a failure). VAT is off at launch (`tax.vat_on` 0). Test: reverse, then settle; VAT and kept match what was taken. | history/FEE-01.md, verifier round 2 re-check, G1 | open |
| F2 | FEE-01 | G2 (medium hazard, owned here): an admin-set `wallet_to_wallet` fee above Nuvion's charge makes every wallet payment quote answer 503 `fees_not_set` (tickets, paid DMs, credits, tiers, bills), with a misleading message. Seeded state never triggers it (wallet-to-wallet is free, R-139). Until fixed, nobody sets a wallet_to_wallet fee above 0. Fix: the admin route refuses such a row, or the message says why. | same, G2 | open |
| F3 | FEE-01 | G3 (low): the quote-time split (F9) depends on the object identity of `quote.fee`; a clone between `check()` and `legSplit` silently re-reads the schedule. | same, G3 | open |
| F4 | FEE-01 | Not run by the verifier: Nuvion's actual charge differing from the expected one, end to end, and two sends at once with different keys. | same, NOT RUN | open |
| F5 | FEE-02 | Lows 2 to 5: the editor's default start is when the dialog opened (refused after 5 minutes open); swap preview words and a USD 100,000 default; the refusal page keeps the Provider rates header; no automated test on `feeText.ts`. | history/FEE-02.md, verifier, lows 2 to 5 | open |
| F6 | FEE-03 | L2 to L4: crypto send and FX receipt Fee summed in the app; chat send and request pay lack a `totalKobo` versus `totalMinor` spec; round 1 F6 (`maxWithdrawKobo` leaves its last candidate unchecked, submit stays blocked). L1 (abroad receipt without the fee fields) closed by step 3, b9bfc76a. | history/FEE-03.md, verifier round 2 re-check | open |

## Capability checks

- [ ] Each row in the table is fixed with a test or a measurement that fails without the fix, or is ruled "no" with the reason in the row (V1).
- [ ] A user of the app, the website and the dashboard sees nothing change shape: `contract:build` gives no diff and the protected route suite stays green (V3).
- [ ] Every row names the commit that closes it, or the ruling.
