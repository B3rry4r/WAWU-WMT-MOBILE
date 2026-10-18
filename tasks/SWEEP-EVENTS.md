---
id: SWEEP-EVENTS
title: Events sweep: the low findings of events and the door
owner: YOU
area: SWEEP
order: 251
priority: launch
repo: all
type: backend-refactor
status: verifying
depends_on: [EVENTS-11]
decisions: [R-49]
passes: [V1, V2, V3, V9]
artboards: []
---
# SWEEP-EVENTS · Events sweep: the low findings of events and the door

## Current state

As of 18 Oct 2026, merging (lead): rows added at MERGE-17; SWEEP-IEA stacked in batch 19 (MERGE-19); SWEEP-LATE stacked in batch 21 (MERGE-21).
- **MERGE-21:** SWEEP-LATE (mobile `b866e107`, backend `3bdf8fa`) merged. EVENTS-12 L2 and N1 are ruled no with the reason in the row; EVENTS-06 W4b N2 keeps SWEEP-IEA's corrected ruling (SWEEP-LATE's loose-reason mark says the same); FIX-12 L1 waits for the Hub naming the retired tier (G-FIX-12-1). No row added; 17 rows: 5 fixed, 11 ruled no, 1 waiting.
- **MERGE-19:** SWEEP-IEA (mobile `357908a4`, backend `2c8a989`) merged. Text conflicts resolved: EVENTS-11 O7 and O8 stay Fixed by FIX-12 (backend `wmt/S9` `50066b9`, batch 17; SWEEP-IEA still had them waiting for EVENTS-11); EVENTS-06 W4b N2 takes SWEEP-IEA's ruling (no, reason corrected); EVENTS-12 L1, L2, N1 and FIX-12 L1 are kept as they were.
- **SWEEP-LATE (18 Oct 2026, `wmt/SWEEP-LATE` from MERGE-18):** worked the 4 rows with no outcome: EVENTS-06 W4b N2, EVENTS-12 L2 and N1 ruled no with the reason in the row; FIX-12 L1 waits for the Hub naming the retired tier (G-FIX-12-1, a contract change). The table has 17 rows: 16 settled, 1 open.
- **MERGE-17:** 4 rows added from the S9 verifier's report and FIX-12's gap (EVENTS-12 L1 ruled no, L2 and N1 open; FIX-12 L1 open). EVENTS-11 O7 and O8 were the 2 waiting rows: both are fixed by FIX-12 (backend `wmt/S9` `50066b9`).
- **Status:** merging (lead). Built by the W4b sweep builder (Sonnet) on `wmt/SWEEP-W4b`; verifier PASS, no blocker, high or medium (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/SWEEP-W4b.md`: the 16 fixed rows check out, 12 red before and green after, the ruled-no reasons read hold). Stacked in batch 15 by MERGE-15 (backend, mobile and WAWU ID `wmt/MERGE-15`); not on main.
- **Branches:** mobile `wmt/SWEEP-W4b`; backend `wmt/SWEEP-W4b`; wawu-id `wmt/SWEEP-W4b` (heads in the hand-back; the last column of the table names the commit or ruling for each row).
- **Rows:** 17 in the table: 5 fixed (EVENTS-11 O7 and O8 by FIX-12), 11 ruled no with the reason in the row (EVENTS-12 L2 and N1 by SWEEP-LATE at MERGE-21), 1 waiting (FIX-12 L1: the Hub naming the retired tier, G-FIX-12-1), 0 open. The SWEEP-IEA builder (Sonnet, `wmt/SWEEP-IEA`) worked the 3 rows that had no outcome: EVENTS-06 W4b N2 ruled no (reason corrected); EVENTS-11 O7 and O8 were waiting for EVENTS-11, which is in batch 17, where FIX-12 fixed both.
- **Next:** the batch 15 pull request (the lead). The verifier's lows are rows of this table (last column Open).

## Read first

- `docs/WORKFLOW.md`, section 4 ("Severity, sweeps and task files")
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md`
- the verifier report named in each row

## Goal

Every low finding in the table is fixed, or ruled "no" with the reason written in its row, so that nothing a verifier reported as low is lost and no round was spent on it.

## Scope

Events, tickets and the door scan: EVENTS tasks. Backend and mobile. Only the rows in the table; nothing else is touched. A row whose task is not merged yet waits for that merge (or is fixed on that task's branch if the lead says so).

## Capability checks

- [ ] Each row in the table is fixed with a test or a measurement that fails without the fix, or is ruled "no" with the reason in the row.
- [ ] Every row names the commit that closes it, or the ruling.

## Open lows

| Source task | Id | Finding | Verifier report | Closed by |
|---|---|---|---|---|
| EVENTS-11 | O7 | Spec gap: three mutants of the tier-retire logic survive (the organiser's `remaining` with a retired tier, re-sending a tier identical to a retired one). | branch `wmt/EVENTS-11`, `tasks/EVENTS-11.md`, Verifier report, round 5, line 298 | Fixed, backend `wmt/S9` `50066b9` (FIX-12, stacked in batch 17): specs for R7, R8 and R10, each failing on a mutant; the S9 verifier killed 10 of 10 mutants of its own. |
| EVENTS-11 | O8 | Once a ticket sold on a retired tier, the sold 409 names two tiers with the same name, one hidden from the host. Confusing message. | branch `wmt/EVENTS-11`, `tasks/EVENTS-11.md`, Verifier report, round 5, line 303 | Fixed, backend `wmt/S9` `50066b9` (FIX-12, stacked in batch 17): the sold-tickets 409 names a tier once; the new spec fails on the code before. |
| EVENTS-09 | N1 | The queue of two or more typed codes is unreachable and untested. Low. | `tasks/EVENTS-09.md`, Verifier report, round 3, line 437 | No: unreachable by design. No "Type the code" button is drawn while a check is on its way or a result is up, so at most one code waits; a test would have to reach a state the screen cannot reach. The queue stays as the safe form. |
| EVENTS-09 | N2 | Two test gaps in the builder's file: a code typed over an unseen problem, and a tap-dismissed verdict followed by a new scan inside 3 s (stale hold timer). | `tasks/EVENTS-09.md`, Verifier report, round 3, line 438 | Fixed, mobile `3c5cfee3`: two tests in `doorScreen.test.tsx` (a code typed over an unseen problem waits and is checked on dismiss; a tap-dismissed verdict leaves no timer, the next scan is held its own 3 s). Mutant: removing the hold timer's cleanup fails the second. |
| EVENTS-07 | R3-1 | Backend: the host-erase hook (`src/event-ticketing/wallet/event-host-erasure.service.ts`) only detaches events that ALREADY have a wallet order. An event with none when the hook reads, that gets a first quote AND a PIN-paid order before the purge deletes the Event row, is still cascade-deleted with the hold left `held` (spec zz-vr3c C1, window simulated by a spy; buyer short 751,575 kobo). Needs the whole purchase inside the purge's runtime. A one-line widening (detach every upcoming or begun event of the host, not only those with wallet orders) closes it. | `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/EVENTS-07.md`, rounds 2 and 3, new finding 1 | No: not worth the risk. The widening makes the account purge detach and settle every event of the host, web (Flutterwave) events included, in a destructive path; the only spec harness (`event-wallet-harness`) is built on the Fintava-named ledger, which this sweep may not run. The race needs a first quote and a PIN-paid order inside the purge's few seconds. Left for the lead. |
| EVENTS-07 | R3-3 | Backend: the wallet-order create answers `wallet_not_open`, `wallet_opening`, `idempotency_key_*` and `fees_not_set` that are only in the operation description of `contract/openapi.json`, not typed errors, so the app client will not get them as typed (accepted by the lead for now). | `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/EVENTS-07.md`, rounds 2 and 3, new finding 3 | No: the lead accepted it for now. Typed errors change `contract/**` (fenced) and the app's generated types; waits for a contract batch. |
| EVENTS-13 | R2-1 | Backend (`src/event-ticketing/tests/event-call-off-refund.contract.spec.ts`, the twenty-buyers test): in 1 of 30 runs a bystander read after the cancel took 1.5 s under load, during the test's post-cancel sweeps (13.3 s against the cancel's end at 12.4 s), at the unchanged max-read assertion. The lead kept the assertion as it is (a slow read during the sweeps is real if it happens). Look at whether those post-cancel sweeps hold connections. | `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/merge-notes.md` (17 Oct 07:30 entry) and `tasks/EVENTS-13.md` | No: read `event-call-off-refund.service.ts`. The sweeps take no transaction or lock across a provider call (its header says so; its only `$transaction` is a two-statement batch). One 1.5 s read in 30 runs on a loaded machine is CPU or pool contention. The assertion stays, as ruled. |
| EVENTS-06 | L1 | src/features/events/useTicketBuy.ts around line 357 (case "refused"): after the Hub refuses for sold out, E2's tier list is not refetched (afterMoney runs only when an order settles), so the page behind still says "Regular 1 left" with Get tickets enabled. Repro: an event with 1 seat, Get tickets, let someone else buy it, Pay, PIN, Try again (t_sold3.py). | `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/EVENTS-06.md, finding 1` | Fixed, mobile `3c5cfee3`: a refused payment invalidates `['events','tickets',eventId]`, so the page behind reads its tiers again. Test in `buyTickets.test.tsx` (fails before). |
| EVENTS-06 | L3 | SHARED-CHANGES EVENTS-06 #1 (filed): the pay button reads "Pay · 7,500", the artboard "Pay 7,500". E3 shows "Bank charge 0" where the artboard says "No fee" (the fee is 0 on this stack). Decide the words. | `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/EVENTS-06.md, finding 3` | No, words decided: "Pay · ₦X" stays until PaySheet takes `amountJoiner` (SHARED-CHANGES EVENTS-06 #1, SCHOOLS-06 #1 and LEGAL-04 #1 ask the same prop; one change rewrites three screens' button assertions, for the lead). "Bank charge ₦0" stays: the fee is the Hub's and PaySheet's test pins a ₦0 fee line. |
| EVENTS-06 | L4 | E2 starts with the first tier the Hub lists; the Hub lists the free tier first, so a mixed event opens with "Free entry 1" and the priced tier at 0 (the artboard has the priced tier first). Unclear whose order is right: Hub list order or the app. | `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/EVENTS-06.md, finding 4` | No: the Hub's list order is the host's order of tiers; the app shows it and starts at the first listed tier. It does not re-sort for the buyer. If priced-first is wanted, it is the host's order (EVENTS-11 edits tiers). |
| EVENTS-08 | L1 | A called-off event's E18 shows "Left 110" and Sold 0: the Hub counts all voided tickets as left. The figures are the Hub's own, but "Left" has no meaning for a called-off event. Hide "Left" once called off. | `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/EVENTS-08.md, finding 1` | Fixed, mobile `3c5cfee3`: E18 draws no "Left" tile once the event is called off. Test in `organiser.test.tsx`. |
| EVENTS-08 | L2 | The buyer's refund line was only checked with a zero Nuvion fee (the stack's book-transfer fee is 0), so "the provider's charge comes back too" (EVENTS-10 ruling) was not seen on the stack; EVENTS-10's own spec covers it. Run it with a non-zero fee. | `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/EVENTS-08.md, finding 2` | No: the refund line is the Hub's figure shown as sent, never recomputed; EVENTS-10's own spec covers the non-zero fee at the Hub. A stack run with a non-zero stand-in fee is a verifier check, not a code change. |
| EVENTS-06 | W4b N2 | Note. The reason given for L4 (ruled no), "does not re-sort", is loose: `EventDetailScreen` partitions open tiers before closed ones, each in the Hub's order. The ruling stands. | `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/SWEEP-W4b.md`, Notes 2 | No: the ruling for L4 stands and its reason is corrected. `EventDetailScreen` does re-order for the buyer in one way: open tiers come before closed ones, each group in the Hub's order; within a group the app starts at the first listed tier and does not sort by price. The free-first order of a mixed event is the host's order of tiers (EVENTS-11 edits tiers). |
| EVENTS-12 | L1 | Differs for a recorded reason (R-43, lead ruling). In `src/event/tests/event.contract.spec.ts` (about lines 341 to 357) the replaced test dropped the `steps` array, the exact `purchasable` price and the em-dash scan over `steps`, because `tier_required` has no `steps` or `purchasable` (they belonged to the tick). It asserts `tierState` and `lowestTier.priceMinor > 0`; the exact equality with `GET /plans` is held by `event-host-tier.contract.spec.ts`. The web reads only code and message. | `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/S9.md`, Findings L1 | No: ruled by the lead (R-43); the verifier saw no action. |
| EVENTS-12 | L2 | Info, inherited from EVENTS-11. In `setTicketTypes` the order is `editableEvent` (404, 403, cancelled 409), the body 400s, the sold 409, then the tier gate, so an ended-tier host with a sale sees the sold 409 and a non-owner sees 404, not `tier_required`. Not widened by this task; harmless. | `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/S9.md`, Findings L2 | No (SWEEP-LATE, 18 Oct 2026): info, inherited from EVENTS-11 and harmless (the order of the refusals is 404, 403, 409 sold, then the tier gate). |
| EVENTS-12 | N1 | Info, stack only. Four older suites (event-running, event-door-scan, event-door-idempotency, event-held-tickets) fail 7 tests on a stack's seeded database (door staff and holder names), identically on the code before this task; they are green in CI. The protected suite run against the stack's own mock WAWU ID gives 8 reds (502 on the verification routes); run it on the suite's own mock. MERGE-17 saw the same 6 door-name reds on `wmt/MERGE-16` and on `wmt/MERGE-17`. | `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/S9.md`, Findings L3 and L4 | No (SWEEP-LATE, 18 Oct 2026): info, stack only (door-name seeds on a stack's database); green in CI. |
| FIX-12 | L1 | A sold-tickets 409 caused only by a sale on a retired tier names a tier the host sees as unsold (the same name, another price). A plainer sentence needs the Hub to say which tier is hidden (G-FIX-12-1). | `tasks/FIX-12.md`, Current state (builder gap G-FIX-12-1) | Waits (SWEEP-LATE, 18 Oct 2026): for the Hub naming the retired tier in the 409 answer (G-FIX-12-1, a contract change). |

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/SWEEP-EVENTS.md](history/SWEEP-EVENTS.md).

## Owner sign-off

_Owner: date, and "go" or what blocks it._
