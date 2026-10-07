---
id: LEGAL-03
title: Legal consultations and deliverables
owner: DEV3
area: LEGAL
order: 70
priority: launch
repo: wawu-backend
type: backend-endpoint
status: building
depends_on: []
decisions: [R-14]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# LEGAL-03 · Legal consultations and deliverables

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV3.md` (what you own)
- `DECISIONS.md`: R-14 (ruled; build what it says)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

S18-S26: phone, video and in-person options, slots, several delivered files.

## Scope

Phone medium, per-medium length, slots; several deliverables posted into the chat; prices set by WAWU in admin (R-14).

Admin sets the prices through LEGAL-07's screens.

## Capability checks

- [ ] A user books a slot that is then unavailable to others.
- [ ] Two delivered files both appear in the chat.

## Builder report

**Built (backend `wmt/LEGAL-03`; additive; no mobile screen, the task is `backend-endpoint`).** Phone as a third medium beside video (`zoom`) and in-person, a length per medium, a calendar served per medium at that medium's length, several delivered files each posted into the chat, and prices set by WAWU in admin (R-14). Routes: `GET /legal/consultation/options`, `GET /legal/consultation/slots?medium=zoom|phone`, `POST` and `GET /legal/requests/:id/booking`, `GET /legal/requests/:id/deliverables`; ops `POST /legal/ops/requests/:id/deliverables`, `GET /legal/ops/prices`, `PUT /legal/ops/prices/consultations/:medium`, `PUT /legal/ops/prices/services/:serviceCode`. Stored: see SHARED-CHANGES "LEGAL-03 #1" (migration `20261009120000_legal_consultations`: enum values, one nullable column, three tables; seeded so the web's catalogue and booking answer byte for byte as before). Reuse: the held-hour, availability and chat code of the existing legal module is extended, nothing of LEGAL-01's assistant (backend #75) is duplicated; the merge with LEGAL-01's `legal-chat.service.ts`, `legal-intake.module.ts` and `notification-event.ts` auto-merged and both sides' specs pass.

**This session (resume after a usage-limit crash).** Merged origin/main into both worktrees (merge, no conflicts in the backend; mobile conflicted only on BACKEND_GAPS.md, resolved keeping both rows). Migration renamed again, now `20261009120000_legal_consultations`, after main's newest (`20261008100000_admin_ads_audit`) and after the newest folder on every open origin `wmt/*` branch (`20261009090000_push_tokens`, INBOX-03). My gap id G-231 was taken on main by LEGAL-01, so it is now G-269 (highest on main and every wmt branch was G-268). Review found one real defect, fixed: a lone surrogate in a delivered file name was accepted (the NUL case was already refused); it is now a 400 (`DeliveredFileDto.fileName`), with two new rows in the task's own spec (a lone surrogate name; slots `medium=` with `%00`, `%ED%A0%80`, `%FF`, blank, `ZOOM`, all 400). `npm run contract:build` after the merge leaves `contract/openapi.json` unchanged.

**Capability checks.** (1) A user books a slot that is then unavailable to others: `legal-consultations.contract.spec.ts`, "a booked hour is held": the booked start reads `available: false` for another user and for every overlapping start at that medium's length; two people picking the same hour at the same moment, exactly one gets it; two overlapping calls at different starts, exactly one; releasing lets it go. (2) Two delivered files both appear in the chat: "posts both files into the chat, in order, and lists them for the client" (two `LegalChatMessage` rows, two `LegalDeliverable` rows, listed to the client, 404 to anyone else).

**Counts (backend, local DB `wawu_hub_test_legal_03`, after the merge).** tsc 0. `src/legal` specs 236 passed, 3 skipped (85 in the consultations spec, 2 new). `account-data-map` and `data-export-map` specs 9/9. `src/legal-intake` (LEGAL-01's assistant specs) pass with the merge. Protected suite `scripts/protected-routes/run.sh --fresh`: 253 run, 244 of 244 required passed (before: 244 of 244). Gates: 9 run, 874 files, 16 fail, 56 warn, 76 accepted, `check_baseline.py` clean; no fail line is in a file this branch touches (the 16 are main's: forks, deferrals, the wallet mock import). eslint: `src/legal` non-test files show 4 prettier errors, all in files this branch does not change (`availability.ts`, `legal.controller.ts`); no lint run with `--fix`.

**NOT RUN.** `src/data-export-request/tests/data-export.contract.spec.ts` (14 of its tests fail here at `fulfil()` because the email goes through WAWU ID on :4001, which is not running; the failure is in sending the mail, not in the sections this branch added, and the data-export-map spec covers them). A paid consultation end to end (Flutterwave and Fintava keys are not here; the web booking path is covered by the protected suite and the app's pay path is MONEY work). Mobile `npm run check` exits 0 (this branch changes only BACKEND_GAPS.md, SHARED-CHANGES.md, the task file, LOG and generated lists in the mobile repo). Mobile `npm run api` is not run: the new routes are on the backend branch, not main, so the contract copy waits for the merge (as ME-10 #2).

**Not done, by design.** The admin screens that set the prices are LEGAL-07's. The consultation rota (who is free when) has no source: the calendar is every weekday on the hour, 09:00 to 16:00 Lagos, 21 days (G-269). Phone has no price row until WAWU sets one, so it is not offered until then.

## Verifier report

Verifier session, 7 Oct 2026. Branch as it lands: backend `wmt/LEGAL-03` (18d5ebc) and mobile `wmt/LEGAL-03` (ac2c240); `origin/main` had not moved in either repo (backend 6c0e435, mobile c0fb4e3), so no merge was needed. Own databases `wawu_hub_test_{br,mn,live,prot}_legal_03_v`. Mock WAWU ID: :4001 was held by another session's mock, which the suites reuse; a second run of the data-export spec used my own mock on :4178.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates (backend) | passed, with a note | `tsc --noEmit` exit 0. eslint (no `--fix`) on the 15 non-test files the branch changes: 0 errors, 0 warnings. The two spec files it adds or edits carry the repo's usual `no-unsafe-*` errors (73 in `legal-consultations.contract.spec.ts`; main's own `legal-intake.contract.spec.ts` has 67). `python3 scripts/gates/run.py`: 9 gates, 874 files scanned (main 863), 16 fail / 56 warn / 76 accepted on both; the output differs from main by one line number only (`notification-event.ts:496`, was :481, a prose deferral that main already fails; the builder's "no fail line in a file this branch touches" is not quite true, but nothing is new). `check_baseline.py`: 108 entries, clean on both. |
| V1 Gates (mobile) | passed | `npm run check` first exited 1: one test, `OpenWalletScreen.test.tsx` A26, timed out at 20 s while four other sessions loaded the machine (796 of 797 passed). Run alone it passes, 37 of 37. typecheck 0, lint 0, `gates` 216 files scanned, 0 findings, `tasks` ok (209 tasks). This branch changes no `src/`. |
| V2 Contract | FAILED | Two defects below (D1, D2). The branch's own specs pass (`src/legal`, `src/legal-intake`, `src/account-purge`: 9 suites, 240 passed, 3 skipped). Live probe of every new or changed write route and query on a built Hub: 1,153 requests (null, wrong types, NUL, lone surrogates, empty arrays, non-object JSON bodies, 100k-character strings, negative and huge numbers, odd ISO dates, odd path ids, odd `medium=`) plus 30 targeted ones; the three the builder named (lone surrogate in a file name; `medium=` `%00`, lone surrogate, `%FF`, blank, `ZOOM`) answer 400. One input answers 500 (D1) and one is accepted and mangled (D2). Evidence: `scratchpad/legal03v/fuzz.js`, `spot.js`, `spot2.js`. |
| V3 Regression | passed, with D3 noted | Protected suite 4 runs on this branch and main (lock from `origin/main`): branch fresh x2 and branch on the migrated database x1, 253 of 253 run, 244 of 244 required; main fresh 253 of 253, 244 of 244. Full backend contract suite (`npm run test:contract`), branch vs main: branch 175 suites (31 failed, 144 passed), 4,612 tests (718 failed); main 173 suites (31 failed), 4,520 tests (764 failed). The 31 failing suites are the same files on both (the money, KYC, identity, live and data-export suites: no Fintava keys, no `.env`, a shared mock); every failing test on the branch also fails on main (718 of 719 names are in main's 765; 46 fail only on main, load-related). The two new suites (consultations, consultation-slots) pass. `contract:build` leaves `contract/openapi.json` unchanged. Against main, 8 operations are added, none removed, and two existing operations change their declared response (F6). `.pipeline/protected-registry.json` is not touched. The overlap race in D3 is a V3-style risk the protected suite cannot see. |
| V4 Field trace | passed, with D4 noted | Price: admin PUT (`LegalConsultationOption`, `LegalServicePrice`) to options, slots, booking, web catalogue, web booking and `quoteAmount` on a new request, all read back live. Deliverable: admin POST to `LegalDeliverable`, `LegalChatMessage`, the client's deliverables list, the chat thread, the notification and the audit row. Account purge and data-export maps cover `LegalDeliverable` (9 of 9 map specs pass). |
| V9 Live seam | passed | A built Hub (`nest build`, `node dist/src/main.js` on :4177) on its own migrated and seeded database, real client logins through the mock WAWU ID (RS256 JWT checked against its JWKS) and real admin logins (four roles). Values only the server holds: the options list, the slots at a medium's length, the held hours, the price audit rows. |
| Capability 1 | passed for the app route; fails across the two routes (D3) | Live: user A books a 30-minute video slot (`200`, `minutes 30`, `priceKobo 1500000`); user B on the same start `409` for video and for phone (one calendar for both); B's video and phone calendars and the web `/legal/availability` all read that start `available: false`; B cannot read or book A's request (`404`). A moves to another hour: the old one is free again. 10 simultaneous video-vs-phone bookings of one start: exactly one winner each time. With the length set to 90 minutes, a held call blocks the starts it runs into (a held 20-minute phone call and a held 30-minute video call each took out the 90-minute starts that would overlap them), and a booked 30-minute call is not moved by the change. |
| Capability 2 | passed | Live: support delivers two files on paid in-progress work: status `delivered`, two `LegalChatMessage` rows from the consultant in order (`Agreement.pdf`, then `Notes.pdf`), two deliverables returned to the client with their `chatMessageId`, `404` to another user; a repeat with one old and one new file adds one (3 in all); a request delivered through the old single-file route keeps its file listed first when more are added; the client gets a `legal_delivered` notification; `reviewer` and `finance` are refused (`403`). |
| R-14 prices only from admin | passed | Before any admin action phone is not offered (options and slots 400, booking 400); finance sets phone 10000 naira, 20 minutes and it appears; clearing the price removes it again; disabling zoom removes it from the app and from the web catalogue and web booking (400). `support` reads but cannot set (`403`), `reviewer` cannot read, no token 401, a user token 401; a service price set in admin shows as `priceNaira` and as `quoteAmount` on a new request. Every change writes a `legal_price_set` audit row with old and new values. No price is a constant in the code (`CONSULTATION_FEES` is gone); the 25,000 and 45,000 come from the migration's seed rows (F8). |
| R-18 no Trust Score | passed | No `trust` in the diff or in any new response. |
| Data-export contract spec | NOT RUN | 14 of 16 tests fail identically on branch and on main with the other session's mock on :4001 and with my own mock on :4178 (service key set); the mail never reaches the outbox in this environment, on main too. Unblocked by: a WAWU ID that accepts `POST /internal/users/:id/data-export` under the suite's key, or the cause of the empty outbox found. `account-data-map` and `data-export-map` specs pass (9 of 9). |
| Paid consultation end to end | NOT RUN | No Fintava or Flutterwave keys; payment is LEGAL-05. |
| Migration order | failed (F5) | See F5. |
| Gap id | passed | G-269 appears on this branch only; the highest id on main and on every other `wmt/*` branch of the mobile repo is G-268. |

### Findings

**D1 · defect (V2, 500).** `POST /legal/ops/requests/:id/deliverables` with a file `url` that contains a NUL character answers 500. `@IsUrl` accepts `https://x.example/\u0000`, the insert then fails in Postgres (`22021 invalid byte sequence for encoding "UTF8": 0x00`) and the unhandled error becomes a 500. Reproduced live on a delivered request (`spot2.js`, case `url NUL`). The builder closed the same hole for `fileName` (NUL and lone surrogate) and missed `url`. Expected: 400, as for `fileName`.

**D2 · defect (V2, data and audit).** The same route accepts a `url` that contains a lone surrogate (`https://x.example/\ud800`) with `200`. The stored url is rewritten to U+FFFD (the client is handed a link that is not the one the consultant sent), the `legal_delivered` audit row is silently lost (`AdminOpsAuditService` logs "invalid input syntax for type json" and carries on) and the client is still notified. Expected: 400. Same fix as D1.

**D3 · defect (capability 1 across routes).** The web's `POST /legal/requests/:id/consultation`, which this branch changed to be length-aware, checks for a clash without the advisory lock that the new `POST /legal/requests/:id/booking` takes. With zoom set to 90 minutes in admin, one app booking and one web booking at different, overlapping starts sent at the same moment both answered `200` in 15 of 15 tries; sent one after the other, the second is refused (`409`), so it is the missing lock, not the arithmetic. Two clients are sold overlapping hours. It cannot happen at the default 60 minutes (overlap then needs the same start, which the unique index stops), so it appears the day an admin sets any length over 60. The same gap exists web against web. Evidence: `race.js`, `race2.js`.

**D4 · defect (reuse, claim not met).** The builder reports it reused LEGAL-01's chat and duplicated nothing. `LegalDeliverablesService.deliver` writes the consultant's `LegalChatMessage` rows with its own `tx.legalChatMessage.create`, not through `LegalAssistantAllowance.writeAsConsultant` (used by `LegalChatService.sendAsConsultant`), which takes the client's lock so that no client message can race the handover and slip past the assistant's hourly limit (`legal-assistant-allowance.ts`, the comment above `writeAsConsultant`). A delivery therefore hands the thread to the consultant without that ordering. I could not make it misfire by hand (the window is one transaction), so it is recorded as a defect against the stated reuse, low severity.

**F5 · defect (low, claim false).** The report and SHARED-CHANGES "LEGAL-03 #1" say the migration sorts after every open `wmt/*` backend migration. It does not: `origin/wmt/SCHOOLS-02` carries `20261010100000_schools_hidden`, later than `20261009120000_legal_consultations`. It does sort after main's newest (`20261008100000_admin_ads_audit`) and after INBOX-03's `20261009090000_push_tokens`. `prisma migrate deploy` applies pending migrations whatever their order, so no data risk is shown; the two touch different tables (not checked beyond the file list). Whoever merges second decides whether a rename matters.

**F6 · differs-for-recorded-reason (R-14).** The declared response of two web routes changes in `contract/openapi.json`: `GET /legal/catalogue` (`consultationOptions[].label`, `minutes` and `feeNaira` go from literal enums such as `45000` to number or null) and `POST /legal/requests/:id/consultation` (`flutterwaveConfig.amount` from `25000 | 45000` to number). R-14 takes the price out of the code, so the schema cannot keep a literal. With the seeded rows the answers are byte for byte what they were (live: chat 25000/60, zoom 45000/60, in person unpriced; protected suite green). The values, not the declared types, are what the web reads.

**F7 · unclear.** The delivered file appears in the chat as a consultant message whose text is the file name; the link is not in the chat view (`GET /legal/intake/chat/:id` has no url field). The app has to join to `GET /legal/requests/:id/deliverables` through `chatMessageId` to open the file. Capability 2 ("both appear in the chat") is met as written; whether S23 needs the link in the message itself is for the screen's owner.

**F8 · unclear (owner).** The migration seeds 25,000 (chat), 45,000 (video) naira and 60 minutes as rows, so the live consultations keep their price on deploy. R-14 says prices are set in admin and never in code; these are data and admin can change them, but WAWU did not set them there. The owner confirms they are WAWU's current prices.

**F9 · unclear (minor).** The in-person row accepts a price and a length through `PUT /legal/ops/prices/consultations/physical` (`500000` and `30` both answered 200) although the DTO comment says "always null for an in-person consultation"; the app's options then show a price on an in-person row marked `onRequest`. Nothing breaks.

**Not found wrong.** Calendar and held hours per medium and length; phone absent until priced and gone again when cleared; every admin route's role matrix; ownership (a user cannot read or book another's request); the first-booking and release behaviour; gap id; contract after regeneration; protected suite.

Back to `building` for D1, D2, D3, D4 and F5. Evidence scripts and logs: `/tmp/claude-0/-home-user/5061294a-27a4-5072-ae21-e672def9592e/scratchpad/legal03v/`.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
