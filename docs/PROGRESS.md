# Progress

Rebuilt from the task files by `python3 scripts/tasks/check_tasks.py --write`;
`npm run check` fails if it is out of date. Do not edit by hand.

**Launch tasks done: 39 of 179.**

| | You | Developer | Developer 2 | Developer 3 |
|---|---|---|---|---|
| todo | 52 | 46 | 32 | 32 |
| building | 0 | 0 | 0 | 0 |
| verifying | 0 | 0 | 0 | 0 |
| review | 1 | 0 | 0 | 0 |
| done | 26 | 12 | 2 | 0 |

## Built and verified, waiting for the owner's sign-off

- [WALLET-14](../tasks/WALLET-14.md) Saved recipients and payout account (You)

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
- [AUTH-05](../tasks/AUTH-05.md) The sign-up sequence end to end (Developer)
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
- [MONEY-14](../tasks/MONEY-14.md) Reset the PIN, and approve with fingerprint or face (You)
- [MONEY-15](../tasks/MONEY-15.md) Transaction history and detail (You)
- [TEST-01](../tasks/TEST-01.md) Tests pass on a cold cache and a loaded machine (You)

## Next up

- **You:** [OPS-09](../tasks/OPS-09.md) Set WAWU's fees as merchant charges in the Fintava sandbox dashboard, [OPS-08](../tasks/OPS-08.md) Retire Shop on the backend, [KYC-05](../tasks/KYC-05.md) Open your wallet: enter your BVN and NIN
- **Developer:** [AUTH-04](../tasks/AUTH-04.md) Sign-up: email and phone, [ME-17](../tasks/ME-17.md) Ticks unlock uploads; free content, [ME-05](../tasks/ME-05.md) Profile fields
- **Developer 2:** [INBOX-08](../tasks/INBOX-08.md) Paid DM threads and the creator's queue, [INBOX-09](../tasks/INBOX-09.md) Pause paid questions for creators who stop replying, [INBOX-02](../tasks/INBOX-02.md) Live updates for chat
- **Developer 3:** [EVENTS-02](../tasks/EVENTS-02.md) Event hosting backend: hybrid events, more event types, tickets sent with the event, [PROS-02](../tasks/PROS-02.md) Professionals backend: the design's fields, city, reply time and price, [SCHOOLS-01](../tasks/SCHOOLS-01.md) Schools data model

## Latest

From `docs/LOG.md`, newest first.

- 3 Oct 2026 · WALLET-14 · Merged main for the pull request (backend d89f7e5 with main ad1e515, mobile with main 8a58a67), status review: gate route lists hold MONEY-14, MONEY-15 and WALLET-14 routes; one test added (two people saving the same place get their own rows, kills M2); full suite 132 suites 3,196 passed 0 failed, protected 253/253; main's committed contract is not byte-reproducible by its own build (order only).
- 3 Oct 2026 · WALLET-14 · Verified round 3: no open defect, status review (backend ab459bc on main 48b9043; mobile 6a5a17b with main 331a6fa; neither main moved). Defect 3 closed: a purged person is a byte-identical 404 to the person who saved them and to a stranger (3 rounds, 20 concurrent re-saves all 404, list and count unchanged), a wallet-less one a byte-identical 409; a reopened wallet answers the original row, no duplicate. No regression: full-list re-saves answer their row with no name check, the cap counts the list (1 x 201, 19 x 409 after a purge), duplicates stay one row, isolation holds. Full suite 130/130 suites (3,148 passed, 0 failed), protected 253/253, gates 16 fail / 13 warn (only BENEFICIARIES-MAX added), 6 of 7 mutants killed (survivor: no test has two people save the same person), mobile merge keeps both sides, 0 key windows, 0 Fintava calls.
- 3 Oct 2026 · WALLET-14 · Round 3 (backend ab459bc, status verifying): re-saving a saved person whose account was deleted now answers 404 (or 409 without a wallet) as for anyone else, never a hidden row; the existing-row shortcut is pinned by a full-list re-save test; mobile main 331a6fa merged; full suite 130 suites 3,148 passed 0 failed, protected 253/253.
- 3 Oct 2026 · WALLET-14 · Verified round 2: 1 minor defect, status building (backend 377ea31 with main 48b9043; mobile 7755de8; mobile main moved to 331a6fa meanwhile). Round 1's defects closed: a keyless join over 8 BVN-checked people links no stored name hash to another person or to any word (0 of 23 hashes shared, 0 of 464 unkeyed candidates), and old-scheme, other-check, other-person and rotated-key values read null; after a real purge of a saved person, list, count and cap agree, and 20 parallel saves at the edge give 1 x 201 and 19 x 409 (3 rounds plus a mixed run). Migrations deploy cleanly onto main's applied set and onto a fresh database, status clean. New: re-saving a saved person whose account was deleted answers 201 with a row the list never shows (anyone else gets 404). Full suite 130/130 suites (3,147 passed), protected 253/253, gates 16 fail / 13 warn (only BENEFICIARIES-MAX added), 9 of 11 mutants killed, 0 key windows, 0 Fintava calls.
- 3 Oct 2026 · WALLET-14 · Round 2 (backend 377ea31 with main 48b9043, status verifying): BVN name keys bound to the person and the check (a keyless join links nothing; old-scheme or rotated-key values read null), the 50-place cap counts what the list shows, the bank list fetched once for parallel saves and its hour pinned by a test; full suite 130 suites 3,147 passed 0 failed, protected 253/253; mobile `npm run check` exit 0.
- 3 Oct 2026 · WALLET-14 · Verified: 2 defects, status building (backend 514d3ad on main 6d48c97 with MONEY-13 35b68af; mobile 4fdc0b5; neither main moved). D1: the BVN name words are hashed with the key alone, the same hash for everyone, so a database reader without the key reads names back by matching them to the plain names beside them (an unwalleted person's first name recovered from 7 people). D2: a saved person whose account is deleted still holds one of the 50 places, hidden and never removable (list 49, save refused). Passed: name-check-only saves (bad codes, refused checks, a body name all refused), other people's rows untouched, the cap exact under 20 parallel saves at 49, one row under 20 parallel duplicates, the match rule on 27 edge cases; full suite on :4001 126 suites / 3,065 passed / 0 failed, protected 253/253, gates 16 fail / 11 warn (+BENEFICIARIES-MAX only), contract byte-stable, 13 of 14 own mutants killed (bank-list hour untested), mobile check exit 0. One stray sandbox BVN lookup by the verifier disclosed.
- 3 Oct 2026 · WALLET-14 · Lead follow-up (backend 514d3ad, status verifying): merged `wmt/MONEY-13` (35b68af), the five routes now run its wallet gate and the stand-in is deleted (G-47 handled); the 6 suites on :4001 pass 62/62 and the full suite on a fresh database is 3,065 passed, 0 failed; protected 253/253.
- 3 Oct 2026 · WALLET-14 · Built (backend a53fe14, status verifying): beneficiaries and the payout account served (`/money/beneficiaries`, `/money/payout-account`), each bank account name-checked through Fintava with its real bank code and the bank's name; the BVN check now keeps the BVN name as keyed word hashes, so a payout account in another name is flagged (`matchesBvnName: false`); additive migration, G-46 and G-47 filed, 3 free sandbox name checks.
- 3 Oct 2026 · MONEY-15 transaction history, monthly summary and detail merged (backend PR #44, ad1e515). Three verifier rounds: grouped earnings never drop from a scroll except in the narrow case filed as G-53 (corrected by a refresh).
- 3 Oct 2026 · MONEY-15 · Verified round 3: status review (backend c0d9a12, mobile 46095e8; neither main moved). Defect 2 is closed: the three year-0000 requests answer 400. 129 forged dates across the cursor, the group key and the month (year 0000 and 10000+, negative years, leap seconds, long fractions) brought 0 unexpected answers on the built server. Blind spot A is closed for writes that commit within Prisma's 5 s timer (a real uncommitted write at page 1, 10 ms to 4.9 s, 14 runs: nothing lost). The margin brought no regression (15 walks at page sizes 1 to 3). New `unclear` finding 4: a writer whose event loop is late reaching the timer commits after 5 s (5.6 s measured), and the loss returns; CONVENTIONS section 6 calls 5 s a hard limit. Full suite 130/130 suites, 3,144 passed, 0 failed; protected 253/253; gates as main; 12 of 14 mutants killed.
- 3 Oct 2026 · MONEY-15 · Round 3 (backend c0d9a12, status verifying): a cursor or group key dated year 0000 is now a 400, not a 500 (defect 2). A scroll groups only unlocks completed by its snapshot less 5 s, Prisma's default transaction timeout that the ledger writes under, so a write in flight at page 1 can no longer move a group (blind spot A). CONVENTIONS section 6 now lists what a refresh still corrects. Full suite 130/130, 0 failed; protected 253/253.
- 3 Oct 2026 · MONEY-15 · Verified round 2: back to building (backend a622812, mobile 92bf3ea; main 48b9043 merged). Defect 1 closed. Every movement that existed before page 1 showed exactly once on the built server and in 24 stress runs (arrival, settling, an older one settling below the cursor; page sizes 1 to 6; an event after every page), with 4 groups straddling pages and around Lagos midnight. New defect 2 (minor): a forged cursor or group key dated year 0000 is a 500, not a 400. Unclear: a pending row the sweep settles with Fintava's earlier time is shown twice in one scroll. The in-flight write loses a group for one scroll (a window of about 5 s), and a reopened unlock only duplicates. Full suite 130/130, 3,141 passed, 0 failed (an earlier run had 1 flaky MONEY-14 leak check, 3/3 alone). Protected 253/253, gates as main (16 / 12), 9 of 12 own mutants killed (3 equivalent).
- 3 Oct 2026 · MONEY-15 · Round 2 (backend a622812, status verifying): a scroll groups as of its snapshot. The cursor and the group key carry the first page's time, and a group's members are the unlocks completed by then, so an unlock landing or settling mid-scroll no longer moves a group across a cursor (defect 1; tests P1, P1b, P1c). Reference order and the exactly-full last page are pinned by tests; `q` is trimmed before its length check. Backend main 48b9043 merged in. Full suite 130/130, 0 failed; protected 253/253.
- 3 Oct 2026 · MONEY-15 · Verified round 1: 1 defect, status building (backend 35e4e33, mobile 857ca5e; neither main moved). Grouped unlock earnings drop out of a scroll when an unlock of the same piece and Lagos day lands or settles between pages (reproduced on the built server). Isolation, status, the month summary at Lagos edges (leap month too), search escaping and both capability checks held; full suite 126/126 suites, 3,058 passed, 0 failed; protected 253/253; gates as main; 13 of 16 new mutants killed, 2 test gaps (reference order, last full page).
- 3 Oct 2026 · MONEY-15 · Backend `wmt/MONEY-15` merged `wmt/MONEY-13` (35b68af) at the lead's request (35e4e33): the three history routes are behind the single wallet gate (`@RequireOpenWallet()`, `@CurrentWallet()`); full suite on a fresh database 126/126 suites, 3,058 passed, 0 failed; protected 253/253.
