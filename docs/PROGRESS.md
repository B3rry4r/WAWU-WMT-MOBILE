# Progress

Rebuilt from the task files by `python3 scripts/tasks/check_tasks.py --write`;
`npm run check` fails if it is out of date. Do not edit by hand.

**Launch tasks done: 32 of 179.**

| | You | Developer | Developer 2 | Developer 3 |
|---|---|---|---|---|
| todo | 57 | 47 | 32 | 32 |
| building | 0 | 0 | 0 | 0 |
| verifying | 1 | 0 | 0 | 0 |
| review | 0 | 0 | 1 | 0 |
| done | 21 | 11 | 1 | 0 |

## Built and verified, waiting for the owner's sign-off

- [INBOX-01](../tasks/INBOX-01.md) Communities: my communities, links, join decisions (Developer 2)

## Being verified

- [FIX-02](../tasks/FIX-02.md) The concurrent-tap contract tests hold under load (backend main's deploy) (You)

## Done

- [OPS-01](../tasks/OPS-01.md) Record the owner's rulings (You)
- [SETUP-01](../tasks/SETUP-01.md) Verify the mobile repo setup (Developer)
- [INBOX-06](../tasks/INBOX-06.md) Free chat between users (Developer 2)
- [OPS-02](../tasks/OPS-02.md) Fintava test keys: the first real calls (You)
- [SHELL-01](../tasks/SHELL-01.md) App shell: the five tabs (Developer)
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
- [MONEY-11](../tasks/MONEY-11.md) Balance (You)
- [KYC-01](../tasks/KYC-01.md) BVN check when someone opens a wallet (You)
- [KYC-02](../tasks/KYC-02.md) Selfie match to the BVN photo (You)
- [MONEY-12](../tasks/MONEY-12.md) Open a Fintava account when someone opens a wallet (You)
- [TEST-01](../tasks/TEST-01.md) Tests pass on a cold cache and a loaded machine (You)

## Next up

- **You:** [OPS-09](../tasks/OPS-09.md) Set WAWU's fees as merchant charges in the Fintava sandbox dashboard, [OPS-08](../tasks/OPS-08.md) Retire Shop on the backend, [MONEY-08](../tasks/MONEY-08.md) Status checks and the pending sweep
- **Developer:** [AUTH-05](../tasks/AUTH-05.md) The sign-up sequence end to end, [ME-17](../tasks/ME-17.md) Ticks unlock uploads; free content, [ME-05](../tasks/ME-05.md) Profile fields
- **Developer 2:** [INBOX-08](../tasks/INBOX-08.md) Paid DM threads and the creator's queue, [INBOX-09](../tasks/INBOX-09.md) Pause paid questions for creators who stop replying, [INBOX-02](../tasks/INBOX-02.md) Live updates for chat
- **Developer 3:** [EVENTS-02](../tasks/EVENTS-02.md) Event hosting backend: hybrid events, more event types, tickets sent with the event, [PROS-02](../tasks/PROS-02.md) Professionals backend: the design's fields, city, reply time and price, [SCHOOLS-01](../tasks/SCHOOLS-01.md) Schools data model

## Latest

From `docs/LOG.md`, newest first.

- 3 Oct 2026 · FIX-02 · Backend main 13a6f77's deploy unblocked at the cause. read ECONNRESET: the specs gave supertest an unlistened app, so the first concurrent tap to finish closed the per-request server and the kernel reset the taps still queued (main 1 of 10 runs at load 8 to 10; minimal repro 540 of 630 reset, 0 listening); the app now listens once per file in the opening spec and the five others that send requests at once. The 503 behind the one-line fix: the claiming tap's lookup timed out at the spec's 300 ms during a 0.5 to 0.9 s CPU stall of the in-process stand-in (5 of 6 at load 15 to 20; a 900 ms injected stall reproduces it), the product's correct answer to an unanswered lookup, so the spec's timeouts are 2 s and late answers 500 ms past them, no assertion changed. Opening spec 50 of 50 at load 17.5 to 20.7; full suite twice 2,873 passed, only the four :4001-hardcoded suites refused (port rule); protected 253/253, gates unchanged (16 fail / 9 warn). Status verifying (backend 82c139a).
- 3 Oct 2026 · AUTH-02 · Fix round 1: the status bar follows the screen in front (D1), A2's 8 px offset (D2), citations (D3), test name (D4), the pick cleared at sign-in and at each signed-out visit (U3), Space and Enter pick on web (U4), G-34 wording; main merged; verifying.
- 2 Oct 2026 · AUTH-02 · Welcome (A1) and why you're here (A2) built, the app opens on A1 signed out, 'New here? Create an account' on A22 opens A2 and A22 gets its Back; gaps G-34, G-35 (filed as G-33, G-34, renumbered after main took G-33); verifying.
- 3 Oct 2026 · MONEY-12 · Verified round 2: no open defect, status review (backend 9902ca1 on main e8535d8, which did not move; also merged locally with wmt/MONEY-08 2c5dee8, migrations in either order; mobile cb6907b, mobile main since moved to ddafc76 and merges cleanly apart from the BACKEND_GAPS rows). D1 fixed: a phone's Fintava customer is adopted only when the HMAC of its `userInfo.bvn` equals the person's; 26 record shapes and every adopting path (before the create, details, list, sweep, "already exists") never adopt a stranger, and 23 stopped rows stayed 409 with 0 Fintava calls through taps, a second instance, sweeps and a day's ageing. N1: read to the end; the >1,000-row residual needs two Fintava faults (note). N2: two real Hubs at +12 and -12 min on one database, 1 create each. Full suite 2,913 passed / 0 failed, protected 253/253, gates 16/9 (only WALLET-BANK-NAME), contract byte-stable, 1 read-only sandbox GET. Notes N4 to N6.
- 3 Oct 2026 · MONEY-12 · Round 2: an existing Fintava customer for the person's phone is adopted only when the keyed hash of the BVN on Fintava's record equals the person's checked BVN; another BVN or none adopts and creates nothing, stops the opening for review (G-37, an owner stop) and answers `409 phone_held_by_other_identity` (D1, the verifier's A1 to A4 now refused). The customer list is read to its end or trusted only newest first (N1), and every opening time is the database's clock (N2). Sandbox: 5 reads, the same phone with another BVN refused, the record's own BVN adopted `1192964482`, no create. Contract 2,913 passed, protected 253/253, gates 16 fail / 9 warn as before, mobile check exit 0. Status verifying (backend 9902ca1).
- 3 Oct 2026 · MONEY-12 · Verified: 1 defect, back to building (backend d056461 on main e8535d8, also merged locally with wmt/MONEY-08 0eb32a9; mobile 3b500ab; neither main moved). D1: an existing Fintava customer is adopted on the phone alone, never compared with the checked BVN, so a recycled phone, a customer made outside WAWU or a deleted account's number hands one person another's account (spec and live: the stranger's account number and name shown, balance read from it); Fintava's own read carries the full `userInfo.bvn` to compare (sandbox), and a repeated phone was answered 500 with nothing made. Passed: one create under every race (two real Hubs, 3 accounts on one BVN, sweep, server killed mid-create), identity read once, nothing stored or logged, full contract 2,879 passed / 3 skipped / 0 failed, protected 253/253 lock unchanged, gates 16 fail / 9 warn (only PROVISIONAL(WALLET-BANK-NAME) added), contract byte-stable, mobile check exit 0. Notes N1 (list order assumed) and N2 (Hub clocks); G-36 confirmed, owner's call.
- 3 Oct 2026 · MONEY-12 · Built: `POST /money/wallet/open` opens the person's Fintava account (identity read once, the selfie tied to that exact check), `GET /money/wallet` shows the account number or "opening"; one opening per person (claimed before anything is sent, BVN and phone unique), Fintava asked by phone first, a lost answer reconciled (details 404, the list, the resend window), never resent blindly. Sandbox: a real account opened through the route with the identity steps as stand-ins (`sandbox/32-`). Status verifying.
- 3 Oct 2026 · FIX-01 · Verified: no defect, status review (backend 9ea3b90 on main 13b6ac4, mobile f2342d0 on main 983418c; neither main moved). My own stall server (plain and TLS, separate process): all 34 client methods against headers-then-stall, partial body, drip, chunked and close-delimited bodies and stalled 400/404/500 end at the 400 ms timeout (400 to 435 ms) as the no-headers outcome with the socket closed, with and without forced GC (508/510 per run, the 2 others the selfie cap); main's client hangs on 474 of 476 under GC. Bodies done before the deadline are read, after it time out; 8,000 calls leave 0 timers and 0 sockets, heap flat. Built Hub, 5 s check timeout, forced GC or not: BVN check and KYC-02's u4 selfie stall answer 503 at 5.0 to 5.1 s, counted, socket closed at the deadline; a stalled 400 is a counted 503; main no answer at 60 s. No send becomes resendable (stalled lookups give wait). Contract 2,801 passed, protected 253/253, gates 16 fail / 8 warn as main, mobile check exit 0. Findings: a mid-body reset is still read as empty (unchanged); the builder's spec does not pin the abort when no headers arrive.
- 3 Oct 2026 · FIX-01 · MONEY-06's Fintava timeout now covers headers and body and survives garbage collection (KYC-02 round 4 finding 1): one deadline per request that aborts, cancels the body reader and races fetch, cleared once the body is read. Every client method against a headers-then-stalled body ends at its timeout as the existing timeout error, with and without forced GC (108/108); main's client hangs on the same spec (40 still waiting); built Hub BVN check with a stalled Fintava: 503 at 5.3 s under load, main no answer at 60 s. A stalled 400 on a check is now a counted 503, not a failed match. Contract 2,801 passed, protected 253/253, gates unchanged (16 fail / 8 warn). Status verifying (backend 9ea3b90).
- 3 Oct 2026 · KYC-02 · Verified round 4: no open defect, status review (backend eb3af98 with main 837d6ec merged, mobile 364e830 with main 78c96c4; neither main moved). OPS-11's rate-limit spec passes 10/10 with only the selfie route and its exact limits added (16 of 17 override mutants killed, the survivor equivalent); oversize selfie answers end within milliseconds of the 4,096-byte cap as a counted 503 (200 MB, endless, declared, chunked, and compressed bombs up to 2 GB; no memory growth), the exact-cap answer still matches; 2,048 px a side passes phone-sized selfies and refuses 2,049 and the 4000x4190 PNG at its header; rounds 1 to 3 hold (100/100 hooked and 0 of 450 natural BVN races, counting, 817 images, 0 leaks); protected 253/253, contract 2,653 passed plus 40/40 on :4001, gates 16 fail / 8 warn (only SELFIE-CHECKS-PER-DAY added). Finding: MONEY-06's check timeout is lost to garbage collection after the headers on main too, so a stalled Fintava body is held for 300 s (reproduced on the selfie route and main's BVN check)
- 3 Oct 2026 · KYC-02 · Round 4: backend main 837d6ec (OPS-11) and mobile main 78c96c4 merged in; OPS-11's rate-limit spec names the selfie route with its exact limits (10/10); the selfie answer is read as a stream with a 4 KB cap, any status (200 MB, endless and declared-oversize answers end within milliseconds of the cap as a counted 503, against 26 s to never on round 3's code); selfies at most 2,048 px a side; 13 mutants killed. Status verifying (backend eb3af98).
- 3 Oct 2026 · KYC-02 · Verified round 3: back to building (backend 4475c2b and its local merge with main 837d6ec, mobile 70fb533). Round 2's defects closed: only the exact allowlisted answer is a match (215 socket answers, 200,000 mutations, the strict parser agrees with JSON.parse on 53,082 accepted texts) and every earlier polyglot is refused while 33 Pillow images pass; the BVN binding holds (100/100 hooked, 0 of 450 natural). New: 1, on the merge OPS-11's hub-rate-limits spec fails 2 of 10 (the selfie route's throttle override is not in its list); 2 (low), the answer has no size cap and parses about 45 times slower than JSON.parse (200 MB blocks the Hub 42 s). One sandbox call, refused as before.
- 3 Oct 2026 · KYC-02 · Round 3: the selfie answer is read by allowlist (HTTP 200, JSON, no duplicate keys, exactly the envelope around one verdict field; anything else a counted 503, so no selfie passes until Fintava shows its success body, G-25 edited); every shape both verifiers sent is tested through client and route, plus 28,320 one-extra-key bodies; round 2's reader put back matches 63 of them. Images walked whole (PNG chunks, CRCs and pixel data; JPEG markers and scans); tests use Pillow-made images. Mains merged into both branches (backend 66339b9, mobile 94d202b); verifying.
- 3 Oct 2026 · KYC-02 · Verified round 2 (restarted after an interrupted first attempt): back to building (backend dbd7b56 and its local merge with main 66339b9, mobile 27d94b3). Defect 2 closed (0 of 750 natural races and 100 of 100 hooked ones kept a selfie to its own BVN check; round 1's binding fails the same sweep 55 of 300). Defect 1 still open: `match: true` beside `mismatch: true`, a `false` 7 objects below `data`, or `passed: false` is a match on the built app. Defect 3 partly: a file with JPEG or PNG start and end bytes passes whatever is between. Protected 253/253, contract 110 suites 2173 passed (the 40 failures in the 4 :4001 suites pass 40/40 on a free :4001, 1 load timeout passes alone), gates 16 fail / 8 warn (main 16 / 7, plus SELFIE-CHECKS-PER-DAY), mobile check exit 0; 1 sandbox selfie call, 400.
- 2 Oct 2026 · KYC-02 · Round 2: the selfie answer is read failing closed (only an explicit `true` verdict is a match; an explicit "no" is A16, no verdict is a counted 503, so no selfie passes until Fintava shows its success body, G-25 edited); each match is tied to the BVN check it was compared against (two nullable columns, race test); JPEG/PNG ends checked (polyglots refused); masking threshold and cap pinned; mains merged into both branches; verifying.
