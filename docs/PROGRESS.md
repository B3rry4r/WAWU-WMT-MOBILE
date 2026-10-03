# Progress

Rebuilt from the task files by `python3 scripts/tasks/check_tasks.py --write`;
`npm run check` fails if it is out of date. Do not edit by hand.

**Launch tasks done: 27 of 177.**

| | You | Developer | Developer 2 | Developer 3 |
|---|---|---|---|---|
| todo | 59 | 48 | 32 | 32 |
| building | 1 | 0 | 0 | 0 |
| verifying | 0 | 0 | 0 | 0 |
| review | 0 | 0 | 1 | 0 |
| done | 17 | 10 | 1 | 0 |

## Built and verified, waiting for the owner's sign-off

- [INBOX-01](../tasks/INBOX-01.md) Communities: my communities, links, join decisions (Developer 2)

## Being built (or fixing verifier findings)

- [KYC-02](../tasks/KYC-02.md) Selfie match to the BVN photo (You)

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
- [MONEY-03](../tasks/MONEY-03.md) The pay-from-wallet sheet (You)
- [MONEY-06](../tasks/MONEY-06.md) Fintava client (You)
- [MONEY-07](../tasks/MONEY-07.md) Fintava webhooks (You)
- [MONEY-09](../tasks/MONEY-09.md) Transaction PIN (You)
- [MONEY-10](../tasks/MONEY-10.md) The ledger (You)
- [MONEY-11](../tasks/MONEY-11.md) Balance (You)
- [KYC-01](../tasks/KYC-01.md) BVN check when someone opens a wallet (You)
- [TEST-01](../tasks/TEST-01.md) Tests pass on a cold cache and a loaded machine (You)

## Next up

- **You:** [OPS-09](../tasks/OPS-09.md) Set WAWU's fees as merchant charges in the Fintava sandbox dashboard, [OPS-08](../tasks/OPS-08.md) Retire Shop on the backend, [OPS-11](../tasks/OPS-11.md) Rate limits behind nginx (Flutterwave webhook throttle, trust proxy)
- **Developer:** [AUTH-02](../tasks/AUTH-02.md) Welcome and why you're here, [AUTH-05](../tasks/AUTH-05.md) The sign-up sequence end to end, [ME-17](../tasks/ME-17.md) Ticks unlock uploads; free content
- **Developer 2:** [INBOX-08](../tasks/INBOX-08.md) Paid DM threads and the creator's queue, [INBOX-09](../tasks/INBOX-09.md) Pause paid questions for creators who stop replying, [INBOX-02](../tasks/INBOX-02.md) Live updates for chat
- **Developer 3:** [EVENTS-02](../tasks/EVENTS-02.md) Event hosting backend: hybrid events, more event types, tickets sent with the event, [PROS-02](../tasks/PROS-02.md) Professionals backend: the design's fields, city, reply time and price, [SCHOOLS-01](../tasks/SCHOOLS-01.md) Schools data model

## Latest

From `docs/LOG.md`, newest first.

- 3 Oct 2026 · KYC-02 · Verified round 3: back to building (backend 4475c2b and its local merge with main 837d6ec, mobile 70fb533). Round 2's defects closed: only the exact allowlisted answer is a match (215 socket answers, 200,000 mutations, the strict parser agrees with JSON.parse on 53,082 accepted texts) and every earlier polyglot is refused while 33 Pillow images pass; the BVN binding holds (100/100 hooked, 0 of 450 natural). New: 1, on the merge OPS-11's hub-rate-limits spec fails 2 of 10 (the selfie route's throttle override is not in its list); 2 (low), the answer has no size cap and parses about 45 times slower than JSON.parse (200 MB blocks the Hub 42 s). One sandbox call, refused as before.
- 3 Oct 2026 · KYC-02 · Round 3: the selfie answer is read by allowlist (HTTP 200, JSON, no duplicate keys, exactly the envelope around one verdict field; anything else a counted 503, so no selfie passes until Fintava shows its success body, G-25 edited); every shape both verifiers sent is tested through client and route, plus 28,320 one-extra-key bodies; round 2's reader put back matches 63 of them. Images walked whole (PNG chunks, CRCs and pixel data; JPEG markers and scans); tests use Pillow-made images. Mains merged into both branches (backend 66339b9, mobile 94d202b); verifying.
- 3 Oct 2026 · KYC-02 · Verified round 2 (restarted after an interrupted first attempt): back to building (backend dbd7b56 and its local merge with main 66339b9, mobile 27d94b3). Defect 2 closed (0 of 750 natural races and 100 of 100 hooked ones kept a selfie to its own BVN check; round 1's binding fails the same sweep 55 of 300). Defect 1 still open: `match: true` beside `mismatch: true`, a `false` 7 objects below `data`, or `passed: false` is a match on the built app. Defect 3 partly: a file with JPEG or PNG start and end bytes passes whatever is between. Protected 253/253, contract 110 suites 2173 passed (the 40 failures in the 4 :4001 suites pass 40/40 on a free :4001, 1 load timeout passes alone), gates 16 fail / 8 warn (main 16 / 7, plus SELFIE-CHECKS-PER-DAY), mobile check exit 0; 1 sandbox selfie call, 400.
- 2 Oct 2026 · KYC-02 · Round 2: the selfie answer is read failing closed (only an explicit `true` verdict is a match; an explicit "no" is A16, no verdict is a counted 503, so no selfie passes until Fintava shows its success body, G-25 edited); each match is tied to the BVN check it was compared against (two nullable columns, race test); JPEG/PNG ends checked (polyglots refused); masking threshold and cap pinned; mains merged into both branches; verifying.
- 2 Oct 2026 · KYC-02 · Verified: 3 defects, back to building (backend 60dfe3f, mobile da43e46, mains unmoved). 1: any 2xx without a `false` verdict counts as a match (the documented `{}`, `status: "failed"`, `match: "false"`: 11 shapes); 2: a selfie matched to one BVN can count for a BVN check that passed during the request (2 of 100 natural races); 3 (low): JPEG/PNG polyglots pass the image check. Passed: nothing stored or logged (502 columns, 3 boots), 3 a day (10 at once: Fintava saw 3), production boot 503, protected 253/253, contract 2058 + 185, migration additive and applies with MONEY-10's same-timestamp one in any order. One sandbox selfie (docs example BVN, synthetic image, 422).
- 2 Oct 2026 · KYC-02 · selfie match to the BVN photo in wawu-backend (`POST`/`GET /money/identity/selfie`, additive migration, 3 a day per person, outcome and time stored, never the image); typed calls in `src/api/walletIdentity.ts`; 2 sandbox calls, both refused and charged ₦10; built, to verify
- 2 Oct 2026 · AUTH-01 · Fix round 1: dev routes leave for Home or sign in in a release build (F1), tests for the held splash on a slow vault read (F6), keyboard handling and A23 autofocus (F5, F9), gaps G-26 to G-30; verifying.
- 2 Oct 2026 · AUTH-01 · Sign in, wrong password, forgot password and check your email built (A22 to A25) behind a signed-in/signed-out route guard; wawu-id's reset-link answer now carries the link's real lifetime (additive); 41 tests, 20 revert proofs, real login and reset run on the local stack; verifying.
- 2 Oct 2026 · INBOX-01 · Round 2: approvals and declines that race now give one outcome and one notification (conditional on the request still pending; parallel tests added); main merged into both branches, gaps renumbered G-31, G-32; contract suite 106 suites, 0 failed. Back to verifying.
- 2 Oct 2026 · INBOX-01 · Communities backend built (`wmt/INBOX-01`): `GET /communities/mine` with last message and unread, `POST /communities/:id/read`, share links `wawu/c/<slug>` (`GET /communities/:id/link`, `GET /communities/links/:slug`), `POST /communities/rooms` (private needs a cover), and a notification to the requester when a host approves or declines. Two new tables, nothing the web calls changes. G-31, G-32 filed. To verifying.
- 2 Oct 2026 · MONEY-10 · Verified round 2: PASS, no open defect, status review (backend 11c6602 checked also merged with main 368fab0 locally, mobile f2c3a27). Defects 1 to 3 fixed: a WAWU number at any bank but 090620 or an unknown customerId writes nothing, every bad figure fails at once with no Fintava call, 15 of 16 one-line reverts killed by the builder's specs (the RangeError backstop is untested). Protected 253/253, contract 108/108 suites, gates the same 16 fails as main, migrations identical in both landing orders with INBOX-01 and KYC-02. The G-33 row conflicts with main's G-33 (renumber at merge).
- 2 Oct 2026 · MONEY-10 · Round 2 (backend 11c6602): the verifier's 3 defects fixed. A wallet is never matched by account number alone (Fintava customerId first; an account at another bank is never a WAWU user, only Fintava's bank 090620 counts); bad figures (non-positive amount or total, negative fee, past 2^53) fail at once with no Fintava call; both mains merged, gap row now G-33, sandbox file 30. Three race guards and the quiet waiting note have tests. To verifying.
- 2 Oct 2026 · MONEY-10 · Verified: 3 defects, back to building (backend da74274, mobile 35eb611, checked with backend main d27ad37 and mobile main bfdd584 merged locally). Exactly once held across every path in 36 raced movements, two processes sweeping one database applied 180 deliveries once each, and a ₦10 sandbox round trip wrote one row per side. Defects: a wallet matched by account number alone puts another bank's money on an unrelated user; a negative or zero amount never settles; main moved (G-25 and sandbox file 28 now taken by KYC-01).
- 2 Oct 2026 · MONEY-10 · The ledger built in wawu-backend (`wmt/MONEY-10` da74274): `FintavaLedgerEntry` in BIGINT kobo, one row per wallet side, recorded once by a reference key (any of ours, Fintava's, tagapay, id: G-19), fed from MONEY-07's stored deliveries by a 30-second sweep, confirmed with Fintava when no side is held; a reversal marks the debit reversed, never a second row. Sandbox: two ₦10 round trips, 8 rows for 4 movements, balances back. Never a balance, no route. Gap filed (now G-33). To verifying.
- 2 Oct 2026 · SETTINGS-07 fix round 1: test leak and stale test title fixed, real admin reject checked, gaps G-19 to G-22 corrected; back to verify
