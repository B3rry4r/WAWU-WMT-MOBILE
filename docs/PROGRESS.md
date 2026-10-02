# Progress

Rebuilt from the task files by `python3 scripts/tasks/check_tasks.py --write`;
`npm run check` fails if it is out of date. Do not edit by hand.

**Launch tasks done: 25 of 177.**

| | You | Developer | Developer 2 | Developer 3 |
|---|---|---|---|---|
| todo | 61 | 49 | 32 | 32 |
| building | 0 | 0 | 0 | 0 |
| verifying | 0 | 0 | 1 | 0 |
| review | 0 | 0 | 0 | 0 |
| done | 16 | 9 | 1 | 0 |

## Being verified

- [INBOX-01](../tasks/INBOX-01.md) Communities: my communities, links, join decisions (Developer 2)

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
- [MONEY-02](../tasks/MONEY-02.md) The PIN sheet (You)
- [MONEY-03](../tasks/MONEY-03.md) The pay-from-wallet sheet (You)
- [MONEY-06](../tasks/MONEY-06.md) Fintava client (You)
- [MONEY-07](../tasks/MONEY-07.md) Fintava webhooks (You)
- [MONEY-09](../tasks/MONEY-09.md) Transaction PIN (You)
- [MONEY-11](../tasks/MONEY-11.md) Balance (You)
- [KYC-01](../tasks/KYC-01.md) BVN check when someone opens a wallet (You)
- [TEST-01](../tasks/TEST-01.md) Tests pass on a cold cache and a loaded machine (You)

## Next up

- **You:** [OPS-09](../tasks/OPS-09.md) Set WAWU's fees as merchant charges in the Fintava sandbox dashboard, [OPS-08](../tasks/OPS-08.md) Retire Shop on the backend, [OPS-11](../tasks/OPS-11.md) Rate limits behind nginx (Flutterwave webhook throttle, trust proxy)
- **Developer:** [AUTH-01](../tasks/AUTH-01.md) Sign in and password reset, [AUTH-05](../tasks/AUTH-05.md) The sign-up sequence end to end, [ME-17](../tasks/ME-17.md) Ticks unlock uploads; free content
- **Developer 2:** [INBOX-08](../tasks/INBOX-08.md) Paid DM threads and the creator's queue, [INBOX-09](../tasks/INBOX-09.md) Pause paid questions for creators who stop replying, [INBOX-02](../tasks/INBOX-02.md) Live updates for chat
- **Developer 3:** [EVENTS-02](../tasks/EVENTS-02.md) Event hosting backend: hybrid events, more event types, tickets sent with the event, [PROS-02](../tasks/PROS-02.md) Professionals backend: the design's fields, city, reply time and price, [SCHOOLS-01](../tasks/SCHOOLS-01.md) Schools data model

## Latest

From `docs/LOG.md`, newest first.

- 2 Oct 2026 · INBOX-01 · Round 2: approvals and declines that race now give one outcome and one notification (conditional on the request still pending; parallel tests added); main merged into both branches, gaps renumbered G-26, G-27; contract suite 106 suites, 0 failed. Back to verifying.
- 2 Oct 2026 · INBOX-01 · Communities backend built (`wmt/INBOX-01`): `GET /communities/mine` with last message and unread, `POST /communities/:id/read`, share links `wawu/c/<slug>` (`GET /communities/:id/link`, `GET /communities/links/:slug`), `POST /communities/rooms` (private needs a cover), and a notification to the requester when a host approves or declines. Two new tables, nothing the web calls changes. G-26, G-27 filed. To verifying.
- 2 Oct 2026 · SETTINGS-07 fix round 1: test leak and stale test title fixed, real admin reject checked, gaps G-19 to G-22 corrected; back to verify
- 2 Oct 2026 · SETTINGS-07 · notification switches moneyIn and contentReviews stored and honoured by the senders in wawu-backend (additive migration); communityMessages has no sender (G-19); built, to verify
- 2 Oct 2026 · INBOX-06 · Verified round 2: no defects (backend 8077ee9, mobile e012709). Chat media is held to 512 MB; the branch includes main `ac2a057` and its migrations apply cleanly on a fresh database; read marks hold for two messages in the same millisecond. Contract 99 suites 1964 passed; protected 253/253; the same 16 gates as main; mobile check exits 0. 2 unclear items for the owner (pending upload keys, CHAT-LIMITS). Status review.
- 2 Oct 2026 · INBOX-06 · Verified: 2 defects (a chat video is not held to the 512 MB upload limit; the backend branch conflicts with main `ac2a057` in the schema and contract), 3 unclear for the owner. Both capability checks pass over HTTP through real wawu-id sign-ins; contract 99 suites 1962 passed after merging main; protected 253/253; the same 16 gates as main; mobile check exits 0. Back to building.
- 2 Oct 2026 · INBOX-06 · Free chat between two users in wawu-backend: new `/chats` routes (open, list, messages with photos, videos and PDFs, read marks, upload links), a block either way refuses opening and sending (403 `chat_blocked`), sent messages show `sent` then `read`. Additive migration, three new tables. To verifying.
- 2 Oct 2026 · KYC-01 · Verified: PASS, no defects (backend 7a64a51, mobile 5776ac3, checked with backend main 14a7fb2 and mobile main ca6d6cb merged). Full BVN and NIN in 0 of 823 columns and 0 log lines across six real boots; keyed HMAC confirmed; 14 of 14 mutants killed; 10 parallel checks never passed 3; production boots without settings (BVN check 503); protected 253/253; contract 105 suites, 2054 passed. One sandbox BVN lookup (docs example, refused, 422). Merge note: renumber this branch's BACKEND_GAPS G-21 (main now has G-21 to G-24).
- 2 Oct 2026 · KYC-01 · BVN check served in wawu-backend (`wmt/KYC-01`): `POST /money/identity/bvn` gives A5's prefill once, A14 as `422 bvn_phone_mismatch`, stores only keyed hashes and last 4 digits (log capture and a whole-database scan prove it), 3 checks a day per person plus a per-caller throttle; production boots with no Fintava settings (503). App calls in `src/api/walletIdentity.ts`. Sandbox: 2 lookups, both refused (no sandbox BVN known). Status verifying.
- 2 Oct 2026 · MONEY-07 · Round 2: the verifier's 2 defects fixed. The webhook skips every named rate limit (`short`, `medium`; a bare `@SkipThrottle()` skipped none), tested through the real global guard (30 deliveries in a second, 30 stored); a delivery with a NUL is stored once (raw body as bytes, NUL as U+FFFD in the parsed copy and the key). Backend and mobile main merged in. G-20 filed (Flutterwave webhook throttle, `trust proxy`). Back to verifying.
- 2 Oct 2026 · MONEY-07 · Fintava webhooks built in wawu-backend (`wmt/MONEY-07` 9941aa0): `POST /api/hub/webhooks/fintava`, HMAC-SHA512 of the raw body checked in constant time (fails closed), each delivery stored once in `FintavaWebhookEvent` keyed on event, transaction reference and Fintava status (`ON CONFLICT DO NOTHING`), pending for MONEY-10 and MONEY-08; nothing moves money. Tested with documented payloads signed locally (no tunnel, R-25); no secret or personal data in logs. Gap G-19 (which field holds which reference). To verifying.
- 2 Oct 2026 · MONEY-11 · Verified: PASS, no defects (backend 03a1503, mobile 3d7a04e). Balance equals Fintava after a ₦10 round trip in the sandbox; unreachable, unknown wallet and unconfigured production all answer 503, never 0; contract 89 suites 1852 passed; protected 253/253; the same 16 gates as main; mobile check exits 0. 9 suites on :4001 NOT RUN. One unclear item for the owner (the `src/api` fence). Status review.
- 2 Oct 2026 · MONEY-11 · Round 2: the backend starts in production with no Fintava settings (client unconfigured, one warning, balance 503, nothing sent); test boots AppModule that way. Mobile merged main (R-37). Status verifying.
- 2 Oct 2026 · MONEY-11 · `GET /money/wallet/balance` served in wawu-backend (`wmt/MONEY-11`): Fintava's availableBalance in kobo on every call, `503 provider_unreachable` (W6) never 0, `423 wallet_frozen`, `409 wallet_not_open`; new `FintavaWallet` table; app call `src/api/money.ts`; sandbox: route equals Fintava after two ₦10 sends. Status verifying.
- 2 Oct 2026 · MONEY-06 · Round 2: the verifier's 5 defects fixed (exact Fintava hosts only; only Fintava's own `404 "Transaction not found!"` counts as absent; no resend before the money timeout plus a 10-minute safety window and only when history also lacks the send; a repeated reference is an unknown outcome; the `{}` timing in the docs matches the evidence); key fragments masked in logs. Back to verifying.
