# Progress

Rebuilt from the task files by `python3 scripts/tasks/check_tasks.py --write`;
`npm run check` fails if it is out of date. Do not edit by hand.

**Launch tasks done: 24 of 177.**

| | You | Developer | Developer 2 | Developer 3 |
|---|---|---|---|---|
| todo | 61 | 49 | 33 | 32 |
| building | 0 | 0 | 0 | 0 |
| verifying | 1 | 0 | 0 | 0 |
| review | 0 | 0 | 0 | 0 |
| done | 15 | 9 | 1 | 0 |

## Being verified

- [OPS-11](../tasks/OPS-11.md) Rate limits behind nginx (Flutterwave webhook throttle, trust proxy) (You)

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
- [TEST-01](../tasks/TEST-01.md) Tests pass on a cold cache and a loaded machine (You)

## Next up

- **You:** [OPS-09](../tasks/OPS-09.md) Set WAWU's fees as merchant charges in the Fintava sandbox dashboard, [OPS-08](../tasks/OPS-08.md) Retire Shop on the backend, [MONEY-10](../tasks/MONEY-10.md) The ledger
- **Developer:** [AUTH-01](../tasks/AUTH-01.md) Sign in and password reset, [AUTH-05](../tasks/AUTH-05.md) The sign-up sequence end to end, [ME-17](../tasks/ME-17.md) Ticks unlock uploads; free content
- **Developer 2:** [INBOX-01](../tasks/INBOX-01.md) Communities: my communities, links, join decisions, [INBOX-08](../tasks/INBOX-08.md) Paid DM threads and the creator's queue, [INBOX-09](../tasks/INBOX-09.md) Pause paid questions for creators who stop replying
- **Developer 3:** [EVENTS-02](../tasks/EVENTS-02.md) Event hosting backend: hybrid events, more event types, tickets sent with the event, [PROS-02](../tasks/PROS-02.md) Professionals backend: the design's fields, city, reply time and price, [SCHOOLS-01](../tasks/SCHOOLS-01.md) Schools data model

## Latest

From `docs/LOG.md`, newest first.

- 2 Oct 2026 · OPS-11 · Rate limits behind nginx built in wawu-backend (`wmt/OPS-11` 0067351): the Flutterwave webhook skips every named throttler (30 signed deliveries in a second, 30 x 200; the old bare decorator gives 10 x 429), and `trust proxy` trusts one hop from a loopback peer only (nginx), so each caller has its own 20/s and 200/min and a direct connection's `X-Forwarded-For` is ignored. Port 3001 is closed by ufw per `deploy/provision.sh`; the app still listens on every interface (kept for local Wi-Fi testing). Protected 253/253; the same 16 gates as main. G-20 to verifying. Status verifying.
- 2 Oct 2026 · SETTINGS-07 fix round 1: test leak and stale test title fixed, real admin reject checked, gaps G-19 to G-22 corrected; back to verify
- 2 Oct 2026 · SETTINGS-07 · notification switches moneyIn and contentReviews stored and honoured by the senders in wawu-backend (additive migration); communityMessages has no sender (G-19); built, to verify
- 2 Oct 2026 · INBOX-06 · Verified round 2: no defects (backend 8077ee9, mobile e012709). Chat media is held to 512 MB; the branch includes main `ac2a057` and its migrations apply cleanly on a fresh database; read marks hold for two messages in the same millisecond. Contract 99 suites 1964 passed; protected 253/253; the same 16 gates as main; mobile check exits 0. 2 unclear items for the owner (pending upload keys, CHAT-LIMITS). Status review.
- 2 Oct 2026 · INBOX-06 · Verified: 2 defects (a chat video is not held to the 512 MB upload limit; the backend branch conflicts with main `ac2a057` in the schema and contract), 3 unclear for the owner. Both capability checks pass over HTTP through real wawu-id sign-ins; contract 99 suites 1962 passed after merging main; protected 253/253; the same 16 gates as main; mobile check exits 0. Back to building.
- 2 Oct 2026 · INBOX-06 · Free chat between two users in wawu-backend: new `/chats` routes (open, list, messages with photos, videos and PDFs, read marks, upload links), a block either way refuses opening and sending (403 `chat_blocked`), sent messages show `sent` then `read`. Additive migration, three new tables. To verifying.
- 2 Oct 2026 · MONEY-07 · Round 2: the verifier's 2 defects fixed. The webhook skips every named rate limit (`short`, `medium`; a bare `@SkipThrottle()` skipped none), tested through the real global guard (30 deliveries in a second, 30 stored); a delivery with a NUL is stored once (raw body as bytes, NUL as U+FFFD in the parsed copy and the key). Backend and mobile main merged in. G-20 filed (Flutterwave webhook throttle, `trust proxy`). Back to verifying.
- 2 Oct 2026 · MONEY-07 · Fintava webhooks built in wawu-backend (`wmt/MONEY-07` 9941aa0): `POST /api/hub/webhooks/fintava`, HMAC-SHA512 of the raw body checked in constant time (fails closed), each delivery stored once in `FintavaWebhookEvent` keyed on event, transaction reference and Fintava status (`ON CONFLICT DO NOTHING`), pending for MONEY-10 and MONEY-08; nothing moves money. Tested with documented payloads signed locally (no tunnel, R-25); no secret or personal data in logs. Gap G-19 (which field holds which reference). To verifying.
- 2 Oct 2026 · MONEY-11 · Verified: PASS, no defects (backend 03a1503, mobile 3d7a04e). Balance equals Fintava after a ₦10 round trip in the sandbox; unreachable, unknown wallet and unconfigured production all answer 503, never 0; contract 89 suites 1852 passed; protected 253/253; the same 16 gates as main; mobile check exits 0. 9 suites on :4001 NOT RUN. One unclear item for the owner (the `src/api` fence). Status review.
- 2 Oct 2026 · MONEY-11 · Round 2: the backend starts in production with no Fintava settings (client unconfigured, one warning, balance 503, nothing sent); test boots AppModule that way. Mobile merged main (R-37). Status verifying.
- 2 Oct 2026 · MONEY-11 · `GET /money/wallet/balance` served in wawu-backend (`wmt/MONEY-11`): Fintava's availableBalance in kobo on every call, `503 provider_unreachable` (W6) never 0, `423 wallet_frozen`, `409 wallet_not_open`; new `FintavaWallet` table; app call `src/api/money.ts`; sandbox: route equals Fintava after two ₦10 sends. Status verifying.
- 2 Oct 2026 · MONEY-06 · Round 2: the verifier's 5 defects fixed (exact Fintava hosts only; only Fintava's own `404 "Transaction not found!"` counts as absent; no resend before the money timeout plus a 10-minute safety window and only when history also lacks the send; a repeated reference is an unknown outcome; the `{}` timing in the docs matches the evidence); key fragments masked in logs. Back to verifying.
- 2 Oct 2026 · MONEY-06 · Fintava client built in wawu-backend `src/fintava/` beside Flutterwave (no route served): every plan call typed in kobo, our reference on every send, reconcile before any resend, no secret in logs; sandbox run 25 passed, 5 NOT RUN (charged checks, no new customers, payouts blocked by question 17, webhooks are MONEY-07's); new fact: lookups answer `200 {}` for SUCCESS records too. To verifying.
- 2 Oct 2026 · AUTH-03 merged (Developer 1): phone check at sign-up in WAWU ID (wawu-id PR #3), phone-verified sign-in for new sign-ups only, PROVISIONAL limits, Nigerian numbers at launch (R-36). Existing accounts unchanged.
- 2 Oct 2026 · AUTH-03 fix round 2: sign-up returns an `attempt` secret that the phone routes need (a later sign-up can no longer capture someone else's code), no session by any route before the phone code, a held email moves only with a mailbox code, strangers spend nothing of a number's budget, the daily text budget is exact, IPv6 /64 counted as one, expired sign-ups release web `register`. AUTH-04 must send `attempt` (BACKEND_GAPS G-13).
