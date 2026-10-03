# Progress

Rebuilt from the task files by `python3 scripts/tasks/check_tasks.py --write`;
`npm run check` fails if it is out of date. Do not edit by hand.

**Launch tasks done: 38 of 179.**

| | You | Developer | Developer 2 | Developer 3 |
|---|---|---|---|---|
| todo | 53 | 46 | 32 | 32 |
| building | 0 | 0 | 0 | 0 |
| verifying | 0 | 0 | 0 | 0 |
| review | 1 | 0 | 0 | 0 |
| done | 25 | 12 | 2 | 0 |

## Built and verified, waiting for the owner's sign-off

- [MONEY-15](../tasks/MONEY-15.md) Transaction history and detail (You)

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
- [TEST-01](../tasks/TEST-01.md) Tests pass on a cold cache and a loaded machine (You)

## Next up

- **You:** [OPS-09](../tasks/OPS-09.md) Set WAWU's fees as merchant charges in the Fintava sandbox dashboard, [OPS-08](../tasks/OPS-08.md) Retire Shop on the backend, [KYC-05](../tasks/KYC-05.md) Open your wallet: enter your BVN and NIN
- **Developer:** [AUTH-04](../tasks/AUTH-04.md) Sign-up: email and phone, [ME-17](../tasks/ME-17.md) Ticks unlock uploads; free content, [ME-05](../tasks/ME-05.md) Profile fields
- **Developer 2:** [INBOX-08](../tasks/INBOX-08.md) Paid DM threads and the creator's queue, [INBOX-09](../tasks/INBOX-09.md) Pause paid questions for creators who stop replying, [INBOX-02](../tasks/INBOX-02.md) Live updates for chat
- **Developer 3:** [EVENTS-02](../tasks/EVENTS-02.md) Event hosting backend: hybrid events, more event types, tickets sent with the event, [PROS-02](../tasks/PROS-02.md) Professionals backend: the design's fields, city, reply time and price, [SCHOOLS-01](../tasks/SCHOOLS-01.md) Schools data model

## Latest

From `docs/LOG.md`, newest first.

- 3 Oct 2026 · MONEY-15 · Verified round 3: status review (backend c0d9a12, mobile 46095e8; neither main moved). Defect 2 is closed: the three year-0000 requests answer 400. 129 forged dates across the cursor, the group key and the month (year 0000 and 10000+, negative years, leap seconds, long fractions) brought 0 unexpected answers on the built server. Blind spot A is closed for writes that commit within Prisma's 5 s timer (a real uncommitted write at page 1, 10 ms to 4.9 s, 14 runs: nothing lost). The margin brought no regression (15 walks at page sizes 1 to 3). New `unclear` finding 4: a writer whose event loop is late reaching the timer commits after 5 s (5.6 s measured), and the loss returns; CONVENTIONS section 6 calls 5 s a hard limit. Full suite 130/130 suites, 3,144 passed, 0 failed; protected 253/253; gates as main; 12 of 14 mutants killed.
- 3 Oct 2026 · MONEY-15 · Round 3 (backend c0d9a12, status verifying): a cursor or group key dated year 0000 is now a 400, not a 500 (defect 2). A scroll groups only unlocks completed by its snapshot less 5 s, Prisma's default transaction timeout that the ledger writes under, so a write in flight at page 1 can no longer move a group (blind spot A). CONVENTIONS section 6 now lists what a refresh still corrects. Full suite 130/130, 0 failed; protected 253/253.
- 3 Oct 2026 · MONEY-15 · Verified round 2: back to building (backend a622812, mobile 92bf3ea; main 48b9043 merged). Defect 1 closed. Every movement that existed before page 1 showed exactly once on the built server and in 24 stress runs (arrival, settling, an older one settling below the cursor; page sizes 1 to 6; an event after every page), with 4 groups straddling pages and around Lagos midnight. New defect 2 (minor): a forged cursor or group key dated year 0000 is a 500, not a 400. Unclear: a pending row the sweep settles with Fintava's earlier time is shown twice in one scroll. The in-flight write loses a group for one scroll (a window of about 5 s), and a reopened unlock only duplicates. Full suite 130/130, 3,141 passed, 0 failed (an earlier run had 1 flaky MONEY-14 leak check, 3/3 alone). Protected 253/253, gates as main (16 / 12), 9 of 12 own mutants killed (3 equivalent).
- 3 Oct 2026 · MONEY-15 · Round 2 (backend a622812, status verifying): a scroll groups as of its snapshot. The cursor and the group key carry the first page's time, and a group's members are the unlocks completed by then, so an unlock landing or settling mid-scroll no longer moves a group across a cursor (defect 1; tests P1, P1b, P1c). Reference order and the exactly-full last page are pinned by tests; `q` is trimmed before its length check. Backend main 48b9043 merged in. Full suite 130/130, 0 failed; protected 253/253.
- 3 Oct 2026 · MONEY-15 · Verified round 1: 1 defect, status building (backend 35e4e33, mobile 857ca5e; neither main moved). Grouped unlock earnings drop out of a scroll when an unlock of the same piece and Lagos day lands or settles between pages (reproduced on the built server). Isolation, status, the month summary at Lagos edges (leap month too), search escaping and both capability checks held; full suite 126/126 suites, 3,058 passed, 0 failed; protected 253/253; gates as main; 13 of 16 new mutants killed, 2 test gaps (reference order, last full page).
- 3 Oct 2026 · MONEY-15 · Backend `wmt/MONEY-15` merged `wmt/MONEY-13` (35b68af) at the lead's request (35e4e33): the three history routes are behind the single wallet gate (`@RequireOpenWallet()`, `@CurrentWallet()`); full suite on a fresh database 126/126 suites, 3,058 passed, 0 failed; protected 253/253.
- 3 Oct 2026 · MONEY-15 · History served from the ledger (backend `wmt/MONEY-15`, status verifying): `GET /money/transactions` with search, filter chips, month, cursor pages and grouped unlock earnings, `/summary` (the month's completed rows by direction, Africa/Lagos) and `/{id}`; the caller's own rows only, each with the ledger's status, never a balance or a Fintava call. Search by a recipient's name finds their transfers, including rows a delivery wrote (named from the other wallet's account name); the month's In and Out equal its rows. Sandbox: one ₦10 round trip read back through the routes (`36-money15-history.md`). Gaps G-44 (two receipt references for one transfer) and G-45 (no bank name on delivery-written rows).
- 3 Oct 2026 · AUTH-05 sign-up sequence merged (Developer 1; wawu-id PR #5, dbcb2f8). The server enforces the sign-up order; identity contract re-synced to wawu-id main. The G-16 duplicate-phones script runs only when the owner runs it with `--owner-approved`.
- 3 Oct 2026 · AUTH-05 · Fix round 2: the G-16 script's revert undoes a set with a held phone-only row and still refuses a new row on the number (D2); U3 recorded as a default; status verifying
- 3 Oct 2026 · AUTH-05 · Fix round 1: parallel first progress calls never 500 (D1), a repeated email confirm gets the same success (N4), the G-16 script never strands a phone-only account and wawu-id never hands a released marker on as a phone (U1), rollback then redeploy works (N2), 400s in the contract (N3), gaps G-51 (renumbered from G-38) and G-52; status verifying
- 3 Oct 2026 · AUTH-05 · The sign-up sequence in wawu-id: resume before the phone code, server-held progress after it (email proof, A11 or A12 and A13, each only when next), the reset path for a proven email (G-27), wawu-id's published contract and the app's generated sign-in types (G-5), the G-16 keeper rule as an owner-run script; status verifying
- 3 Oct 2026 · MONEY-14 PIN reset and fingerprint or face approval merged (backend PR #43, 48b9043). The reset code is texted only to the BVN-proved phone; a device key signs each approval and a refusal uses no PIN try. Real texts wait on Fintava (G-42), and the app side waits on a signing package (G-43). Follow-ups: G-50 (a PIN change should end an open reset), plus two test gaps added to G-48.
- 3 Oct 2026 · MONEY-13 one wallet gate merged (backend PR #42, c1d23b5). A person without an open wallet gets 409 wallet_not_open or wallet_opening on every gated money route, before the PIN, body or Fintava. Non-blocking findings carried as G-48 (gate test hardening) and G-49 (oversized body 500); G-40 route list completed.
- 3 Oct 2026 · MONEY-13 · Verified: no open defect, status review (backend 35b68af on main 6d48c97, mobile f06ce18). On the built Hub with a real login, 9 kinds of person without a wallet got one body per code on all 5 gated routes (180 of 180), and HEAD, trailing slash, case, override headers and a forged user id never got past the gate. Spies saw 0 PIN, argon2, body pipe, opening or Fintava calls on 180 refusals, and a right and a wrong PIN got identical answers with no try used. The holder of sandbox account 1192964482 set and checked a PIN and read the balance (the only sandbox call). 12 of 16 own mutants killed; survivors are coverage limits (a wallet route outside /money without the codes, an array controller path) and two untested header and cache paths. Full suite twice 3,021 passed / 0 failed, protected 253/253, gates identical to main (16 fail / 10 warn), key 0 of 58 windows. Notes: G-40 omits POST /tips and four other Flutterwave routes; an oversized body is a pre-existing 500.
- 3 Oct 2026 · MONEY-13 · Built in wawu-backend (`wmt/MONEY-13`): a wallet gate answers `409 wallet_not_open` ("You don't have a wallet yet. Open your wallet to continue.") or `409 wallet_opening` with one body on every wallet route, before the PIN, the body or Fintava; the PIN routes are now gated (G-12 closed) and the balance uses it; `GET /money/wallet`'s state and the gate share one rule. A coverage spec holds every mounted controller to it. 2 sandbox reads (`34-`). Full suite 3,021 / 0 failed, protected 253/253, gates as main. Gaps G-40, G-41. Status verifying.
