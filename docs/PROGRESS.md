# Progress

Rebuilt from the task files by `python3 scripts/tasks/check_tasks.py --write`;
`npm run check` fails if it is out of date. Do not edit by hand.

**Launch tasks done: 35 of 179.**

| | You | Developer | Developer 2 | Developer 3 |
|---|---|---|---|---|
| todo | 55 | 47 | 32 | 32 |
| building | 0 | 0 | 0 | 0 |
| verifying | 1 | 0 | 0 | 0 |
| review | 0 | 0 | 0 | 0 |
| done | 23 | 11 | 2 | 0 |

## Being verified

- [MONEY-14](../tasks/MONEY-14.md) Reset the PIN, and approve with fingerprint or face (You)

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
- [TEST-01](../tasks/TEST-01.md) Tests pass on a cold cache and a loaded machine (You)

## Next up

- **You:** [OPS-09](../tasks/OPS-09.md) Set WAWU's fees as merchant charges in the Fintava sandbox dashboard, [OPS-08](../tasks/OPS-08.md) Retire Shop on the backend, [MONEY-13](../tasks/MONEY-13.md) No wallet yet: money screens lead to Open your wallet
- **Developer:** [AUTH-05](../tasks/AUTH-05.md) The sign-up sequence end to end, [ME-17](../tasks/ME-17.md) Ticks unlock uploads; free content, [ME-05](../tasks/ME-05.md) Profile fields
- **Developer 2:** [INBOX-08](../tasks/INBOX-08.md) Paid DM threads and the creator's queue, [INBOX-09](../tasks/INBOX-09.md) Pause paid questions for creators who stop replying, [INBOX-02](../tasks/INBOX-02.md) Live updates for chat
- **Developer 3:** [EVENTS-02](../tasks/EVENTS-02.md) Event hosting backend: hybrid events, more event types, tickets sent with the event, [PROS-02](../tasks/PROS-02.md) Professionals backend: the design's fields, city, reply time and price, [SCHOOLS-01](../tasks/SCHOOLS-01.md) Schools data model

## Latest

From `docs/LOG.md`, newest first.

- 3 Oct 2026 · MONEY-14 · Built (backend da76d13, status verifying): PIN reset by a 6-digit code texted through Fintava to the BVN-proved phone (hashed, 5 tries, single use, 5 texts a day), and biometric approval as a registered phone's P-256 signature over a one-time challenge and the request (`X-Device-Approval`, refusals never use a PIN try); MONEY-13's wallet gate merged in and in front of every new route. Sandbox refuses every text (G-42); app-side key is G-43.
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
- 3 Oct 2026 · MONEY-12 · Verified round 2: no open defect, status review (backend 9902ca1 on main e8535d8, which did not move; also merged locally with wmt/MONEY-08 2c5dee8, migrations in either order; mobile cb6907b, mobile main since moved to ddafc76 and merges cleanly apart from the BACKEND_GAPS rows). D1 fixed: a phone's Fintava customer is adopted only when the HMAC of its `userInfo.bvn` equals the person's; 26 record shapes and every adopting path (before the create, details, list, sweep, "already exists") never adopt a stranger, and 23 stopped rows stayed 409 with 0 Fintava calls through taps, a second instance, sweeps and a day's ageing. N1: read to the end; the >1,000-row residual needs two Fintava faults (note). N2: two real Hubs at +12 and -12 min on one database, 1 create each. Full suite 2,913 passed / 0 failed, protected 253/253, gates 16/9 (only WALLET-BANK-NAME), contract byte-stable, 1 read-only sandbox GET. Notes N4 to N6.
- 3 Oct 2026 · MONEY-12 · Round 2: an existing Fintava customer for the person's phone is adopted only when the keyed hash of the BVN on Fintava's record equals the person's checked BVN; another BVN or none adopts and creates nothing, stops the opening for review (G-37, an owner stop) and answers `409 phone_held_by_other_identity` (D1, the verifier's A1 to A4 now refused). The customer list is read to its end or trusted only newest first (N1), and every opening time is the database's clock (N2). Sandbox: 5 reads, the same phone with another BVN refused, the record's own BVN adopted `1192964482`, no create. Contract 2,913 passed, protected 253/253, gates 16 fail / 9 warn as before, mobile check exit 0. Status verifying (backend 9902ca1).
- 3 Oct 2026 · MONEY-12 · Verified: 1 defect, back to building (backend d056461 on main e8535d8, also merged locally with wmt/MONEY-08 0eb32a9; mobile 3b500ab; neither main moved). D1: an existing Fintava customer is adopted on the phone alone, never compared with the checked BVN, so a recycled phone, a customer made outside WAWU or a deleted account's number hands one person another's account (spec and live: the stranger's account number and name shown, balance read from it); Fintava's own read carries the full `userInfo.bvn` to compare (sandbox), and a repeated phone was answered 500 with nothing made. Passed: one create under every race (two real Hubs, 3 accounts on one BVN, sweep, server killed mid-create), identity read once, nothing stored or logged, full contract 2,879 passed / 3 skipped / 0 failed, protected 253/253 lock unchanged, gates 16 fail / 9 warn (only PROVISIONAL(WALLET-BANK-NAME) added), contract byte-stable, mobile check exit 0. Notes N1 (list order assumed) and N2 (Hub clocks); G-36 confirmed, owner's call.
- 3 Oct 2026 · MONEY-12 · Built: `POST /money/wallet/open` opens the person's Fintava account (identity read once, the selfie tied to that exact check), `GET /money/wallet` shows the account number or "opening"; one opening per person (claimed before anything is sent, BVN and phone unique), Fintava asked by phone first, a lost answer reconciled (details 404, the list, the resend window), never resent blindly. Sandbox: a real account opened through the route with the identity steps as stand-ins (`sandbox/32-`). Status verifying.
