# Progress

Rebuilt from the task files by `python3 scripts/tasks/check_tasks.py --write`;
`npm run check` fails if it is out of date. Do not edit by hand.

**Launch tasks done: 36 of 179.**

| | You | Developer | Developer 2 | Developer 3 |
|---|---|---|---|---|
| todo | 55 | 46 | 32 | 32 |
| building | 0 | 0 | 0 | 0 |
| verifying | 0 | 1 | 0 | 0 |
| review | 0 | 0 | 0 | 0 |
| done | 24 | 11 | 2 | 0 |

## Being verified

- [AUTH-05](../tasks/AUTH-05.md) The sign-up sequence end to end (Developer)

## Done

- [OPS-01](../tasks/OPS-01.md) Record the owner's rulings (You)
- [SETUP-01](../tasks/SETUP-01.md) Verify the mobile repo setup (Developer)
- [INBOX-06](../tasks/INBOX-06.md) Free chat between users (Developer 2)
- [OPS-02](../tasks/OPS-02.md) Fintava test keys: the first real calls (You)
- [SHELL-01](../tasks/SHELL-01.md) App shell: the five tabs (Developer)
- [INBOX-01](../tasks/INBOX-01.md) Communities: my communities, links, join decisions (Developer 2)
- [OPS-03](../tasks/OPS-03.md) Run the backend locally for testing (You)
- [SHELL-02](../tasks/SHELL-02.md) Signed-in session and API wiring (Developer)
- [OPS-04](../tasks/OPS-04.md) Designer: Shop to Schools, the ₦ glyph, real numbers (You)
- [SHELL-03](../tasks/SHELL-03.md) Tester builds (Developer)
- [OPS-05](../tasks/OPS-05.md) Update the other repos' CLAUDE.md for today's rulings (You)
- [UI-01](../tasks/UI-01.md) Core components: text, buttons, inputs, money (Developer)
- [MONEY-01](../tasks/MONEY-01.md) Protected route list and regression suite (You)
- [UI-02](../tasks/UI-02.md) Lists, cards, sheets, tabs and states (Developer)
- [CHECK-0](../tasks/CHECK-0.md) Checkpoint 0: safe to start building (You)
- [UI-03](../tasks/UI-03.md) Avatars, ticks and chips (Developer)
- [MONEY-04](../tasks/MONEY-04.md) Money conventions and the wallet contract (You)
- [AUTH-03](../tasks/AUTH-03.md) Phone check at sign-up, and the email trap (Developer)
- [SETTINGS-07](../tasks/SETTINGS-07.md) Notification switches the server honours (Developer)
- [AUTH-01](../tasks/AUTH-01.md) Sign in and password reset (Developer)
- [MONEY-02](../tasks/MONEY-02.md) The PIN sheet (You)
- [AUTH-02](../tasks/AUTH-02.md) Welcome and why you're here (Developer)
- [MONEY-03](../tasks/MONEY-03.md) The pay-from-wallet sheet (You)
- [MONEY-06](../tasks/MONEY-06.md) Fintava client (You)
- [FIX-01](../tasks/FIX-01.md) Fintava timeout covers the whole answer, garbage collection included (You)
- [MONEY-07](../tasks/MONEY-07.md) Fintava webhooks (You)
- [OPS-11](../tasks/OPS-11.md) Rate limits behind nginx (Flutterwave webhook throttle, trust proxy) (You)
- [MONEY-09](../tasks/MONEY-09.md) Transaction PIN (You)
- [MONEY-10](../tasks/MONEY-10.md) The ledger (You)
- [MONEY-08](../tasks/MONEY-08.md) Status checks and the pending sweep (You)
- [MONEY-11](../tasks/MONEY-11.md) Balance (You)
- [KYC-01](../tasks/KYC-01.md) BVN check when someone opens a wallet (You)
- [KYC-02](../tasks/KYC-02.md) Selfie match to the BVN photo (You)
- [MONEY-12](../tasks/MONEY-12.md) Open a Fintava account when someone opens a wallet (You)
- [FIX-02](../tasks/FIX-02.md) The concurrent-tap contract tests hold under load (backend main's deploy) (You)
- [MONEY-13](../tasks/MONEY-13.md) No wallet yet: money screens lead to Open your wallet (You)
- [TEST-01](../tasks/TEST-01.md) Tests pass on a cold cache and a loaded machine (You)

## Next up

- **You:** [OPS-09](../tasks/OPS-09.md) Set WAWU's fees as merchant charges in the Fintava sandbox dashboard, [OPS-08](../tasks/OPS-08.md) Retire Shop on the backend, [KYC-05](../tasks/KYC-05.md) Open your wallet: enter your BVN and NIN
- **Developer:** [ME-17](../tasks/ME-17.md) Ticks unlock uploads; free content, [ME-05](../tasks/ME-05.md) Profile fields, [ME-09](../tasks/ME-09.md) My content: edit, resubmit, rejection reason, sales
- **Developer 2:** [INBOX-08](../tasks/INBOX-08.md) Paid DM threads and the creator's queue, [INBOX-09](../tasks/INBOX-09.md) Pause paid questions for creators who stop replying, [INBOX-02](../tasks/INBOX-02.md) Live updates for chat
- **Developer 3:** [EVENTS-02](../tasks/EVENTS-02.md) Event hosting backend: hybrid events, more event types, tickets sent with the event, [PROS-02](../tasks/PROS-02.md) Professionals backend: the design's fields, city, reply time and price, [SCHOOLS-01](../tasks/SCHOOLS-01.md) Schools data model

## Latest

From `docs/LOG.md`, newest first.

- 3 Oct 2026 · AUTH-05 · Fix round 1: parallel first progress calls never 500 (D1), a repeated email confirm gets the same success (N4), the G-16 script never strands a phone-only account and wawu-id never hands a released marker on as a phone (U1), rollback then redeploy works (N2), 400s in the contract (N3), gaps G-51 (renumbered from G-38) and G-52; status verifying
- 3 Oct 2026 · AUTH-05 · The sign-up sequence in wawu-id: resume before the phone code, server-held progress after it (email proof, A11 or A12 and A13, each only when next), the reset path for a proven email (G-27), wawu-id's published contract and the app's generated sign-in types (G-5), the G-16 keeper rule as an owner-run script; status verifying
- 3 Oct 2026 · MONEY-13 one wallet gate merged (backend PR #42, c1d23b5). A person without an open wallet gets 409 wallet_not_open or wallet_opening on every gated money route, before the PIN, body or Fintava. Non-blocking findings carried as G-48 (gate test hardening) and G-49 (oversized body 500); G-40 route list completed.
- 3 Oct 2026 · MONEY-13 · Verified: no open defect, status review (backend 35b68af on main 6d48c97, mobile f06ce18). On the built Hub with a real login, 9 kinds of person without a wallet got one body per code on all 5 gated routes (180 of 180), and HEAD, trailing slash, case, override headers and a forged user id never got past the gate. Spies saw 0 PIN, argon2, body pipe, opening or Fintava calls on 180 refusals, and a right and a wrong PIN got identical answers with no try used. The holder of sandbox account 1192964482 set and checked a PIN and read the balance (the only sandbox call). 12 of 16 own mutants killed; survivors are coverage limits (a wallet route outside /money without the codes, an array controller path) and two untested header and cache paths. Full suite twice 3,021 passed / 0 failed, protected 253/253, gates identical to main (16 fail / 10 warn), key 0 of 58 windows. Notes: G-40 omits POST /tips and four other Flutterwave routes; an oversized body is a pre-existing 500.
- 3 Oct 2026 · MONEY-13 · Built in wawu-backend (`wmt/MONEY-13`): a wallet gate answers `409 wallet_not_open` ("You don't have a wallet yet. Open your wallet to continue.") or `409 wallet_opening` with one body on every wallet route, before the PIN, the body or Fintava; the PIN routes are now gated (G-12 closed) and the balance uses it; `GET /money/wallet`'s state and the gate share one rule. A coverage spec holds every mounted controller to it. 2 sandbox reads (`34-`). Full suite 3,021 / 0 failed, protected 253/253, gates as main. Gaps G-40, G-41. Status verifying.
- 3 Oct 2026 · MONEY-08 · Verified round 3: no open defect, status review (backend 359ad06 with main 13a6f77, mobile 0846579). Both round-2 defects reproduced on 2c5dee8 and closed: 16 reversal shapes off by a kobo or missing a figure, on a completed or absent-failed send, or a second reversalRef, are noted and move nothing, and a matching reversal is marked once under 5 races of 6 posts, two consumers and checks; 17 empty or inconsistent history pages (empty with a next page, past the total, a changing total, `hasNextPage` "true") wait instead of failing as absent. MONEY-07's body-hash key keeps replays to one row, stores a contradicting delivery (noted), and moves the ledger once for re-serialised copies of every event; its migration keeps 5 old rows intact in either order with MONEY-12. Fee-only differences end pending and noted in both orders and under races. Protected 253/253, contract 2,976 passed / 0 failed, gates 16 fail / 10 warn (+LEDGER-STATUS-CHECK-AFTER only), 8 of 8 spot mutants killed. Findings: a reversal of a completed send stays recorded, so its end depends on arrival order (unclear).
- 3 Oct 2026 · MONEY-08 · Round 3 (backend 359ad06, status verifying): a reversal applies only with the row's amount, fee and total to the kobo and only to a pending or Fintava-failed send, anything else is written on `discrepancy` and moves nothing; a history walk is complete only when Fintava says no next page or it passed the send's time, with every page's figures consistent (an empty page while more follow waits, never failed as absent); a disagreement ends `pending` and noted in either order (a completed row is put back); MONEY-07's store keys on the SHA-256 of the body (additive migration `20261003140000_fintava_webhook_delivery_key`), so a second body for one status reaches the ledger. 18 of 18 mutants killed; both mains merged (MONEY-12, AUTH-02); gaps renumbered G-38, G-39. Finding: every bank send whose sender records a fee other than Fintava's `charges` stops (G-39).
- 3 Oct 2026 · MONEY-08 · Verified round 2: round 1's 4 defects closed, 2 new defects, status building (backend 2c5dee8, mobile caa870c; neither main moved). A new send settles in its first pass behind 3,000 waiting rows, after a restart and in steady state (150 of 150, at most 50 checks a pass); revivals stay swept with no discrepancy; absent never wins against a delivery stored or consumed at any of 6 timings; a cut-off walk waits. Defects: a reversal with other figures (₦200 back for ₦100) is marked reversed with nothing on `discrepancy`; an empty history page while Fintava says more pages follow counts as a complete walk, so a 404 becomes absent. Protected 253/253, contract 2,832 passed, gates 16 fail / 9 warn (same fails as main), migrations with MONEY-12 identical in either order.
- 3 Oct 2026 · MONEY-08 · Round 2 (backend 2c5dee8, status verifying): the sweep's schedule is on the ledger row (additive migration `20261003120000_ledger_status_schedule`), claimed 50 a pass with SKIP LOCKED, fresh rows first, so a new send settles in its first pass behind 3,000 waiting rows and after a restart; a revival goes on `revivedAt`, not `discrepancy`, and stays swept; absent is a compare-and-set (row version, no Fintava sighting, no stored delivery) and needs a complete history walk (MONEY-06 `history_incomplete`); any figure difference through a webhook or revival is a stop that moves no status (MONEY-10 aligned with WORKFLOW section 10). 10 of 10 mutants killed; 3 sandbox GETs.
- 3 Oct 2026 · MONEY-08 · Verified round 1: 4 defects, status building (backend 0eb32a9, mobile 20404c1; neither main moved). Never moves money (182 requests, all GET) and exactly once under two instances, webhooks and checks; FAILURE then two reversals: reversed once; every amount difference stops the row. Defects: a backlog starves new rows (a new withheld-webhook send waits 39 sweeps behind 400 waiting rows after a restart, never within 75 behind 3,000); a same-reference resend after absent is written on `discrepancy` and never swept; a PENDING delivery landing during the absent check is overwritten as failed; MONEY-06's 5-page history cut counts as no row, so a send on page 6 is failed as absent. Protected 253/253, contract 2,821 passed (43 on :4001 re-run 71/71), gates 16 fail / 9 warn (+LEDGER-STATUS-CHECK-AFTER), mobile check exit 0.
- 3 Oct 2026 · MONEY-08 · The pending sweep built in wawu-backend (`wmt/MONEY-08`): every minute, `pending` ledger rows older than 2 minutes are asked about through Fintava's status endpoint (MONEY-06's reconcile and resend rules) and settled when their webhook never came: SUCCESS completed, FAILURE failed (reversed only by Fintava's own reversal, once), Fintava's 404 for our reference past the resend window failed with no money moved, an amount that differs recorded and left for review; nothing is ever sent. A completed row no longer becomes failed (U-1). Read-only sandbox run settled MONEY-10's real sends (`31-money08-status.md`). Gaps G-38, G-39. Status verifying.
- 3 Oct 2026 · FIX-02 · Verified: no open defect, status review (backend 82c139a on main 13a6f77; mobile 8a2ca01). Test-only diff, no expect, test or skip changed (counts equal per file). The 503 is only ever the claiming tap whose own lookup missed its deadline (all lookups failing: 2 claims, 2 503s; Fintava 1.2 s slow inside the timeout: 192 taps, 0 503s; 2.5 s stall: 503 at 2 s, none at production's 15 s), and unmodified main 503s the same way pinned to one CPU (4 of 10). Mutants M1 to M4 (lookup errors ignored, blind resend, answer not late, window ignored) all caught. Per-request server closes with open connections on main in all six specs, none on the fix; minimal repro 540 of 630 reset vs 0. Opening spec 24 of 24 at load 15.9 to 19.7, 10 of 10 pinned, others 3 of 3 each; full suite on :4001 twice 2,913 passed / 0 failed, merged with main cdcb2bc 2,976 / 0; protected 253/253, gates 16/9 as main, tsc 0, mobile check exit 0. Notes: both mains moved (merge before the PR; mobile only PROGRESS conflicts); the real-spec reset not reproduced here in 80 runs (CI log and builder evidence stand).
- 3 Oct 2026 · FIX-02 · Backend main 13a6f77's deploy unblocked at the cause. read ECONNRESET: the specs gave supertest an unlistened app, so the first concurrent tap to finish closed the per-request server and the kernel reset the taps still queued (main 1 of 10 runs at load 8 to 10; minimal repro 540 of 630 reset, 0 listening); the app now listens once per file in the opening spec and the five others that send requests at once. The 503 behind the one-line fix: the claiming tap's lookup timed out at the spec's 300 ms during a 0.5 to 0.9 s CPU stall of the in-process stand-in (5 of 6 at load 15 to 20; a 900 ms injected stall reproduces it), the product's correct answer to an unanswered lookup, so the spec's timeouts are 2 s and late answers 500 ms past them, no assertion changed. Opening spec 50 of 50 at load 17.5 to 20.7; full suite twice 2,873 passed, only the four :4001-hardcoded suites refused (port rule); protected 253/253, gates unchanged (16 fail / 9 warn). Status verifying (backend 82c139a).
- 3 Oct 2026 · AUTH-02 · Fix round 1: the status bar follows the screen in front (D1), A2's 8 px offset (D2), citations (D3), test name (D4), the pick cleared at sign-in and at each signed-out visit (U3), Space and Enter pick on web (U4), G-34 wording; main merged; verifying.
- 2 Oct 2026 · AUTH-02 · Welcome (A1) and why you're here (A2) built, the app opens on A1 signed out, 'New here? Create an account' on A22 opens A2 and A22 gets its Back; gaps G-34, G-35 (filed as G-33, G-34, renumbered after main took G-33); verifying.
