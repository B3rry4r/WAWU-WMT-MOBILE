# Progress

Rebuilt from the task files by `python3 scripts/tasks/check_tasks.py --write`;
`npm run check` fails if it is out of date. Do not edit by hand.

**Launch tasks done: 47 of 181.**

| | You | Developer | Developer 2 | Developer 3 |
|---|---|---|---|---|
| todo | 49 | 45 | 32 | 31 |
| building | 0 | 0 | 0 | 0 |
| verifying | 0 | 0 | 0 | 0 |
| review | 0 | 0 | 0 | 0 |
| done | 32 | 13 | 2 | 1 |

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
- [KYC-05](../tasks/KYC-05.md) Open your wallet: enter your BVN and NIN (You)
- [WALLET-15](../tasks/WALLET-15.md) Fee quotes (You)
- [MONEY-14](../tasks/MONEY-14.md) Reset the PIN, and approve with fingerprint or face (You)
- [FIX-03](../tasks/FIX-03.md) The PIN reset spec's leak scan never matches by chance (backend main's deploy) (You)
- [MONEY-15](../tasks/MONEY-15.md) Transaction history and detail (You)
- [WALLET-14](../tasks/WALLET-14.md) Saved recipients and payout account (You)
- [WALLET-11](../tasks/WALLET-11.md) Payout bank account (You)
- [FIX-04](../tasks/FIX-04.md) One person's cached answers are never shown to the next person (You)
- [TEST-01](../tasks/TEST-01.md) Tests pass on a cold cache and a loaded machine (You)

## Next up

- **You:** [OPS-09](../tasks/OPS-09.md) Set WAWU's fees as merchant charges in the Fintava sandbox dashboard, [OPS-08](../tasks/OPS-08.md) Retire Shop on the backend, [KYC-03](../tasks/KYC-03.md) Open your wallet: confirm details and address, selfie
- **Developer:** [AUTH-04](../tasks/AUTH-04.md) Sign-up: email and phone, [ME-05](../tasks/ME-05.md) Profile fields, [ME-09](../tasks/ME-09.md) My content: edit, resubmit, rejection reason, sales
- **Developer 2:** [INBOX-08](../tasks/INBOX-08.md) Paid DM threads and the creator's queue, [INBOX-09](../tasks/INBOX-09.md) Pause paid questions for creators who stop replying, [INBOX-02](../tasks/INBOX-02.md) Live updates for chat
- **Developer 3:** [EVENTS-02](../tasks/EVENTS-02.md) Event hosting backend: hybrid events, more event types, tickets sent with the event, [PROS-02](../tasks/PROS-02.md) Professionals backend: the design's fields, city, reply time and price, [SCHOOLS-02](../tasks/SCHOOLS-02.md) Admin: create and edit schools, courses and intakes

## Latest

From `docs/LOG.md`, newest first.

- 3 Oct 2026 · WALLET-15 · Merged to main by the lead (cc7ed7f): fee quotes, served from backend PR #52 (44fdd7d); mobile contract synced. BILLS-02 told to take every fee from the quote (R-31 question to the owner). Carried forward: G-64, FEE_QUOTE_KEY on the droplet, verifier follow-ups for the paying tasks.
- 3 Oct 2026 · KYC-05 · Merged to main by the lead (mobile only, 265ed2a). Open your wallet, step 1 (BVN and NIN): a passed check is kept only for the person and session that ran it, and any answer that lands after a session ends writes nothing. Carried forward: check 1 waits on SHARED-CHANGES KYC-05 #1; device not run. OTA update follows.
- 3 Oct 2026 · KYC-05 · Verified round 7: no open defect, status review (mobile 81669b0 with main e7dc879). Defect 3 closed: a pass landing in the session-end window leaves no A26 cache entry with A's identity (probe Q2), and a refusal or end landing there moves no screen state for B (3 of 3). Audit: no write after an await unchecked against the ticket or session. R6-2 now killed (2 tests), and R7-1 and R7-2 killed. `npm run check` exit 0, 485 tests, 0 act warnings.
- 3 Oct 2026 · KYC-05 · Round 7, status verifying: a check answer from an ended session writes nothing (ticket checked before the cache write; a refusal under a void ticket moves no screen state); tests with the app's createQueryClient for both, and the start-over's unsubscribe pinned; mutants Q2, Q2b, R6-2 killed; the verifier's probe-r6 passes 4 of 4.
- 3 Oct 2026 · KYC-05 · Verified round 6: 1 defect, status building (mobile 4a43404 with main e7dc879; Hub fe1ec6c). Defect 2 closed: probe P1 to P5 pass 5 of 5 (failed P1, P3 before); four session ends in a row, a session end after unmount, and 20 mounts with 0 listeners left all behave; the browser switch to B by a refresh answering B's pair and by sign-out shows B only loading, then B's own form, light and dark; the relaxed session-end test still kills R6-3. New defect 3 (privacy): a check answer landing between A26's session-end restart and the re-render is not kept but is still written into the query cache under A's id while B is signed in (probe Q2). `npm run check` 2 of 2 exit 0, 481 tests, 0 act warnings.
- 3 Oct 2026 · KYC-05 · Round 6, status verifying: kept BVN details now end on every session end (keptCheck subscribes with onSessionEnd, FIX-04), including a sign-in replacing a session and a refresh to another account; A26 starts over on a session end, so A to B to A no longer sticks on loading; tested with the app's createQueryClient (verifier's P1 to P5 pass), mutants K1 to K4 killed; duplicate SHARED-CHANGES KYC-05 #4 row removed.
- 3 Oct 2026 · KYC-05 · Verified round 5 on the merge with main e7dc879 (FIX-04): 1 defect, status building (supersedes the `review` line below, written before main moved). Merge 797a95a (PROGRESS.md regenerated; SHARED-CHANGES now holds two KYC-05 #4 rows). `npm run check` 3 of 3 exit 0, 476 tests, 0 act warnings; A26's sign-out and refused-refresh tests pass. Defect 2 (privacy): keptCheck does not subscribe to `onSessionEnd`, so after a refresh answering another account, or a sign-in replacing a session, A's kept name, date of birth and gender stay in memory (owner-tagged, never read by B) until B's account read reaches A26 or A26 closes (jest probe P1, P3 with the app's own query client). Not reachable from the UI today. Fix: `onSessionEnd(forgetKeptCheck)` in keptCheck.ts.
- 3 Oct 2026 · KYC-05 · Verified round 5: no open defect, status review (mobile ef47494, main 6bc420e already in). Defect 1 closed: R4-4 re-applied fails 3 of 45 of the builder's tests. 400 tokens minted with wawu-id's own signing library and claim set (102 with `-` or `_`) give their `sub`, and ~6,100 malformed or fuzzed tokens give null without throwing, under jest's atob and a line-for-line port of Hermes's atob (V1 and legacy tags read). The builder's 3 surviving mutants are equivalent on Hermes too; 4 own mutants killed. `npm run check` 3 of 3 exit 0, 448 tests, 0 act warnings. NOT RUN: a live id.wawuafrica.com token, check 1, V10.
- 3 Oct 2026 · KYC-05 · Round 5, status verifying: A26's token reading is tested with real-shaped tokens (a payload with - and _ and no padding, the same padded, a non-ASCII sub read as UTF-8, twelve malformed tokens) and tightened (three parts, base64url, UTF-8, an object with a string sub); R4-4 killed; the verifier's probe passes; sign-out tests settle inside act.
- 3 Oct 2026 · KYC-05 · Verified round 4: 1 defect, status building (mobile 4021cd5, main 6bc420e already in; Hub fe1ec6c). Round 3's privacy defect closed: `cross_fast`, `cross_account`, `cross_wallet` show A's phone or wallet to B on 801aeaa and only the loading view, then B's own data, on 4021cd5 (both themes); the guard held against an unreadable token `sub`, tokens rotated mid-visit, B signing in while A's reads were in flight, an account read answering for another account, the same phone, and rapid A to B to A. Privacy scan of 94 typed numbers: 0 hits outside request bodies. New defect 1 (tests): mutant R4-4 (token payload decoded without the base64url alphabet) survives all 39 open-wallet tests, though a real-shaped token whose payload holds `-` or `_` then leaves A26 loading for good (jest probe). 4 of 8 own mutants killed, 3 equivalent.
- 3 Oct 2026 · KYC-05 · Round 4, status verifying: A26 never paints another account's reads (its reads keyed by visit and account, shown only for the token's account, dropped on close and session end); one-cache jest across a sign-out and a sign-in as someone else; 10 of 10 mutants; the verifier's cross cases reproduced on 801aeaa and clean on this build. V9 on backend main fe1ec6c. App-wide cache clear: FIX-04.
- 3 Oct 2026 · KYC-05 · Verified round 3: 1 defect, status building (mobile 84c0dad, main 6bc420e already in; Hub fe1ec6c). Round 2's defect closed: `race_back` and `race_signout` show "BVN confirmed" on de27d15 and the form on 84c0dad (both themes); two checks in flight, A's check landing after B signs in, and a token renewed mid-check (pass still kept) all behave. New defect 1 (privacy, predates round 3): after an account change A26 first paints the previous account's cached phone and wallet state (one QueryClient, never cleared; `cross_fast`, `cross_account`, `cross_wallet`). Privacy scan of 90 typed numbers: 0 hits outside request bodies. 7 of 9 own mutants killed, 2 equivalent.
- 3 Oct 2026 · KYC-05 · Round 3, status verifying: a BVN check answering after A26 closed or after its session ended is never kept (store writes need a ticket that every forget voids; the form drops late answers); jest races and 8 of 8 mutants; the verifier's race cases reproduced on de27d15 and clean on this build, light and dark. V9 on backend main 7601a5f.
- 3 Oct 2026 · KYC-05 · Verified round 2: 1 defect, status building (mobile f55585a, main c42595b already in; Hub 7601a5f). Round 1's defects 2 to 5 closed (ten pastes keep 11 digits; the Hub unreachable for 30 s stays a banner with the numbers; waits come from the answer: "in a minute", "in about an hour" from Retry-After-medium 3527, "in about 24 hours"). Defect 1 is closed only while A26 is on screen: tap Back while the check runs, and the answer is kept after A26 has gone, so the BVN name, date of birth and gender survive sign-out, and the same person signing in again sees "BVN confirmed" with no new check. Privacy scan: 0 of 78 numbers anywhere stored or logged.
- 3 Oct 2026 · KYC-05 · Round 2, status verifying: kept BVN details forgotten on sign-out, session end, account change and leaving A26; pasted BVN and NIN keep all 11 digits (no raw maxLength); a check refused while the Hub is unreachable stays a banner with the numbers; limit banners say the server's wait in words or "later"; M5 and M7 killed (10 of 10 mutants). V9 rerun on backend main 7601a5f. SHARED-CHANGES KYC-05 #3, #4.
