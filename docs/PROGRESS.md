# Progress

Rebuilt from the task files by `python3 scripts/tasks/check_tasks.py --write`;
`npm run check` fails if it is out of date. Do not edit by hand.

**Launch tasks done: 44 of 181.**

| | You | Developer | Developer 2 | Developer 3 |
|---|---|---|---|---|
| todo | 51 | 45 | 32 | 31 |
| building | 0 | 0 | 0 | 0 |
| verifying | 1 | 0 | 0 | 0 |
| review | 0 | 0 | 0 | 0 |
| done | 29 | 13 | 2 | 1 |

## Being verified

- [FIX-04](../tasks/FIX-04.md) One person's cached answers are never shown to the next person (You)

## Done

- [OPS-01](../tasks/OPS-01.md) Record the owner's rulings (You)
- [SETUP-01](../tasks/SETUP-01.md) Verify the mobile repo setup (Developer)
- [INBOX-06](../tasks/INBOX-06.md) Free chat between users (Developer 2)
- [OPS-02](../tasks/OPS-02.md) Fintava test keys: the first real calls (You)
- [SHELL-01](../tasks/SHELL-01.md) App shell: the five tabs (Developer)
- [INBOX-01](../tasks/INBOX-01.md) Communities: my communities, links, join decisions (Developer 2)
- [OPS-03](../tasks/OPS-03.md) Run the backend locally for testing (You)
- [SHELL-02](../tasks/SHELL-02.md) Signed-in session and API wiring (Developer)
- [SCHOOLS-01](../tasks/SCHOOLS-01.md) Schools data model (Developer 3)
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
- [AUTH-05](../tasks/AUTH-05.md) The sign-up sequence end to end (Developer)
- [MONEY-06](../tasks/MONEY-06.md) Fintava client (You)
- [FIX-01](../tasks/FIX-01.md) Fintava timeout covers the whole answer, garbage collection included (You)
- [MONEY-07](../tasks/MONEY-07.md) Fintava webhooks (You)
- [OPS-11](../tasks/OPS-11.md) Rate limits behind nginx (Flutterwave webhook throttle, trust proxy) (You)
- [ME-17](../tasks/ME-17.md) Ticks unlock uploads; free content (Developer)
- [MONEY-09](../tasks/MONEY-09.md) Transaction PIN (You)
- [MONEY-10](../tasks/MONEY-10.md) The ledger (You)
- [MONEY-08](../tasks/MONEY-08.md) Status checks and the pending sweep (You)
- [MONEY-11](../tasks/MONEY-11.md) Balance (You)
- [KYC-01](../tasks/KYC-01.md) BVN check when someone opens a wallet (You)
- [KYC-02](../tasks/KYC-02.md) Selfie match to the BVN photo (You)
- [MONEY-12](../tasks/MONEY-12.md) Open a Fintava account when someone opens a wallet (You)
- [FIX-02](../tasks/FIX-02.md) The concurrent-tap contract tests hold under load (backend main's deploy) (You)
- [MONEY-13](../tasks/MONEY-13.md) No wallet yet: money screens lead to Open your wallet (You)
- [MONEY-14](../tasks/MONEY-14.md) Reset the PIN, and approve with fingerprint or face (You)
- [FIX-03](../tasks/FIX-03.md) The PIN reset spec's leak scan never matches by chance (backend main's deploy) (You)
- [MONEY-15](../tasks/MONEY-15.md) Transaction history and detail (You)
- [WALLET-14](../tasks/WALLET-14.md) Saved recipients and payout account (You)
- [WALLET-11](../tasks/WALLET-11.md) Payout bank account (You)
- [TEST-01](../tasks/TEST-01.md) Tests pass on a cold cache and a loaded machine (You)

## Next up

- **You:** [OPS-09](../tasks/OPS-09.md) Set WAWU's fees as merchant charges in the Fintava sandbox dashboard, [OPS-08](../tasks/OPS-08.md) Retire Shop on the backend, [KYC-05](../tasks/KYC-05.md) Open your wallet: enter your BVN and NIN
- **Developer:** [AUTH-04](../tasks/AUTH-04.md) Sign-up: email and phone, [ME-05](../tasks/ME-05.md) Profile fields, [ME-09](../tasks/ME-09.md) My content: edit, resubmit, rejection reason, sales
- **Developer 2:** [INBOX-08](../tasks/INBOX-08.md) Paid DM threads and the creator's queue, [INBOX-09](../tasks/INBOX-09.md) Pause paid questions for creators who stop replying, [INBOX-02](../tasks/INBOX-02.md) Live updates for chat
- **Developer 3:** [EVENTS-02](../tasks/EVENTS-02.md) Event hosting backend: hybrid events, more event types, tickets sent with the event, [PROS-02](../tasks/PROS-02.md) Professionals backend: the design's fields, city, reply time and price, [SCHOOLS-02](../tasks/SCHOOLS-02.md) Admin: create and edit schools, courses and intakes

## Latest

From `docs/LOG.md`, newest first.

- 3 Oct 2026 · FIX-04 fix round 2: a request is never sent again in a later session (A's held payout save no longer lands in B's account after B signs in); the app's query defaults are pinned by tests; status verifying.
- 3 Oct 2026 · FIX-04 · Verified: one defect open, status building (mobile c051e67 = merged with main 6bc420e; Hub fe1ec6c). The cached-answer leak is closed: on main B's A21 shows A's 1111111111 with Save enabled, on the branch loading then B's own 2222222220, held 3 s and full speed, light and dark; every session-end path fires and none other does. Defect 1: a save for A in flight when B signs in is sent again with B's token (`refreshAccessToken` hands back whatever token is in memory), so B's payout account became A's typed 3333333330 on the real Hub (main does the same). Finding 2: the app-wide query defaults have no test (2 surviving mutants of 15). Gates exit 0 (25 suites, 413 tests, 109 files, 0 fail); renumber clean. NOT RUN: device, an in-app sign-out control.
- 3 Oct 2026 · FIX-04 built (mobile branch wmt/FIX-04, not merged): the query cache now empties itself whenever a session ends or the account changes, so one person's cached answers (A21's payout account, A26's phone) are never drawn for the next person; new `onSessionEnd` in the session (SHARED-CHANGES KYC-05 #4); the root layout uses the app's query defaults (row 1); status verifying.
- 3 Oct 2026 · ME-17 upload and storage allowance merged (Developer 1; backend PR #51, fe1ec6c). Free accounts: 5 uploads and 1 GB of content; with a tick: 25 and 10 GB (R-7); free pieces count (R-8); KYC, avatar and chat files do not count toward storage.
- 3 Oct 2026 · ME-17 built (backend branch wmt/ME-17, not merged): 5 uploads and 1 GB free, 25 and 10 GB with a tick (R-7), free pieces counted (R-8), new GET /uploads/allowance; status verifying.
- 3 Oct 2026 · WALLET-11 payout bank account screen (A21) merged (mobile). Load, save and read back work against the Hub; a pasted number with spaces keeps all ten digits; flagged when the name is not the BVN name. Bank list and pre-save name check wait on WALLET-09 (G-57). G-59 filed (stand-in WAWU ID shape).
- 3 Oct 2026 · FIX-03 merged (backend PR #50, 7601a5f): the pin-reset leak test draws its PINs from a random pool and keeps test phone tails off it, so a chance collision can no longer fail a deploy. Test files only.
- 3 Oct 2026 · WALLET-11 · Verified round 2: no open defect, status review (mobile dbd990a, main 0b83be8 already in; Hub c197d58). The paste defect is fixed: real Ctrl+V of spaced, hyphenated, padded, no-break-spaced, dotted, labelled and over-long numbers all hold the ten digits, light and dark; a pasted 1111-111-112 saved and read back. Gates exit 0 (24 suites, 403 tests, 108 files, 0 fail); V4, V5 (round-1 recorded differences only), V6 (12 states by real cause), V9 (sign-in through A22, 7 PUT bodies only bankCode and accountNumber, second person null); 10 of 10 mutants killed, including round 1's survivor. NOT RUN: bank list and pre-save name on the real Hub (G-57), entry from M14 or A11, a device paste.
- 3 Oct 2026 · WALLET-11 · Round 2, status verifying: a pasted account number with spaces or hyphens is kept whole (no raw maxLength; digits taken out, then ten kept), proved by a real Ctrl+V in the web export before (8 digits) and after (10); the route's back-after-save rule now tested (verifier's surviving mutant killed); WAWU ID's answer shape corrected in the report to `{ data }`; main 0b83be8 merged.
- 3 Oct 2026 · WALLET-11 · Verified round 1: 1 defect, status building (mobile e8b0027 with main 9d43d9d; Hub a055b4f). An account number pasted with spaces ("0987 654 321") is cut to 8 digits by the field's maxLength before the spaces are stripped. Passed: gates exit 0 on branch and merge (23 suites, 398 tests, 107 files, 0 fail), V4, V5 (recorded differences only), V6 (12 states by real cause, light and dark), V9 (sign-in through A22, load, save, reload, edit; every PUT body only bankCode and accountNumber; second person sees null); 7 of 8 mutants killed (survivor: the route's back-after-save has no test). NOT RUN: bank list and pre-save name on the real Hub (G-57), entry from M14 or A11 (not built).
- 3 Oct 2026 · WALLET-11 · Built A21 Payout bank (`/payout-account`), status verifying: loads the saved account, bank sheet, account number, the bank's name and the server's BVN match after saving (flag when false, name alone when null), no-wallet, opening, loading and error states; 21 tests, 7 of 7 mutants killed; V9 on the built Hub (real sign-in, PUT and read back); G-57 (bank list and name check unserved, WALLET-09) and G-58 (BVN match before saving, the "Creators only" line) filed; SHARED-CHANGES WALLET-11 #1, #2.
- 3 Oct 2026 · SCHOOLS-01 schools data model merged (Developer 3; backend PR #46, c197d58). Additive migration only; no routes yet.
- 3 Oct 2026 · SCHOOLS-01 · Verified: no defect, status review (backend 101785b = b4e6716 with main a055b4f merged, schema append conflict resolved as main's file plus the schools block; mobile with main 68c68ba). Migration applies fresh (83) and onto a seeded main database (row counts unchanged, schema dump 0 lines removed), CHECKs and cascade probed directly, oversell test fails with its CHECK dropped; protected 253/253 before and after; gates 16 fail / 13 warn on both; full suite identical to main except the 4 new passing tests; 2 unclear (SCHOOLS-02 hidden column has no named migration; SCHOOLS-04 seats-left wording).
- 3 Oct 2026 · SCHOOLS-01 · Schools data model built (backend `wmt/SCHOOLS-01`): School, SchoolCourse, CourseIntake, additive migration `20261003180000_schools`, no rating (R-32); status verifying
- 3 Oct 2026 · WALLET-14 saved recipients and the payout account merged (backend PR #45, a055b4f). Bank names come only from Fintava; a payout account in another name is flagged; BVN name words are stored only as person-bound keyed hashes. Three verifier rounds. G-54 filed (contract build order).
