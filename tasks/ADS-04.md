---
id: ADS-04
title: Serve a sponsored card
owner: DEV2
area: ADS
order: 31
priority: launch
repo: wawu-backend
type: backend-endpoint
status: review
depends_on: [ADS-03]
decisions: [R-15]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# ADS-04 · Serve a sponsored card

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV2.md` (what you own)
- `DECISIONS.md`: R-15 (ruled; build what it says)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

Show at most one live sponsored card for today's placement.

## Scope

GET ads for a placement.

## Capability checks

- [ ] `GET ads?placement=tgif_card` and `?placement=today_slot` each return at most one live card, and none outside its dates.
- [ ] With no live campaign, nothing is returned and the screen shows no empty frame.

## Builder report

Backend branch `wmt/ADS-04` (aef0699, on ADS-03's `wmt/ADS-03` @ 0eeaa3c, not yet on main; main a94f338 had not moved, so bringing ADS-03 in was a fast-forward and there is no merge commit): `src/ads/ads.controller.ts`, `ads.service.ts`, `ads.module.ts`, `ads-serving.ts` (the rule, and the one new `PROVISIONAL(ADS-SERVE-RULE)`), `ads-clock.ts`, `ads-view.type.ts`, `dto/ads.dto.ts`, `tests/ads-serve.contract.spec.ts` (52 tests); fenced: `src/app.module.ts` (one import, one entry) and `contract/openapi.json` (regenerated: `GET /api/hub/ads` and `AdCardView` only), row ADS-04 #1 in `SHARED-CHANGES.md`. Mobile: this file, `BACKEND_GAPS.md` G-191 to G-193, `SHARED-CHANGES.md`, `docs/LOG.md`, `docs/PROGRESS.md`. No migration, no schema change, no new number except PROVISIONAL(ADS-SERVE-RULE).
- **What it serves:** `GET /api/hub/ads?placement=tgif_card|today_slot`, signed-in (WAWU ID token), `Cache-Control: no-store`. `data` is one card `{ id (the campaign), advertiser, headline, subline, ctaLabel, ctaDestination, ctaDestinationId, artworkUrl }` or `null`. The rule: placement; status `scheduled` or `live`; `startsAt <= now < endsAt` on the server clock (UTC); has a creative; its event is open (published, not cancelled, not finished by the Events list's own test, host not blocked either way). Highest weight wins; ties go to the earliest start, then earliest creation, then id. A campaign whose event is closed or gone is skipped and the next is tried. The `ads` first segment is new; the route-shadowing spec passes.
- **Check 1 (each placement returns at most one live card, none outside its dates):** HTTP spec with mock WAWU ID tokens, a settable clock: two bookings per placement give one object each from their own placement; the window is probed at start-1ms, start, start+1ms, end-1ms, end, end+1ms for both placements; draft, paused, ended, no-creative never served; scheduled and live served. A block at the end runs the real clock (a campaign running now is served; ended and not-yet-begun are not; one ending 1.5 s ahead stops being served).
- **Check 2 (nothing returned when nothing is live, no empty frame):** the answer is `200 {data: null}`, asserted on an empty table and with only out-of-window, draft, paused, ended and creative-less bookings. The app (ADS-01) draws no card on `null`; that screen is ADS-01's.
- **Also tested:** exact key set of the card (and null subline and artwork stay keys); a leak check that no word of draft, paused, ended, expired or other-placement bookings or of weight, status, window or creative id is in the body; 401 without or with a bad token; 400 for a missing, empty, wrong-case, repeated or extra query; ties in each tier; a heavier ineligible booking does not win; 8 closed-event cases (pending, rejected, removed, cancelled by status, cancelled by date, over, no-end and started) each for fallback and for empty; event deleted or never existing; event ending exactly now (open) and 1 ms later (closed); 40 closed events then one open; block either way for one viewer only; 60 parallel requests from two viewers give one body; serving writes nothing; pause then resume takes effect on the next request (ADS-06's "within a minute" has nothing to wait for here). Mutation check on the service: `gt` to `gte`, `lte` to `lt`, no status filter, no cancelled filter, no block filter, weight ascending, id descending and the event `gte` to `gt` each fail 1 to 7 tests. The spec removes its rows and asserts every table's row count equals its start; passed alone twice, beside event, account-purge and route-shadowing, and in the full suite.
- **Gates before then after (main a94f338 on its own worktree, then this branch; both on a seeded `wawu_hub_test`, one shared `node_modules` because the lockfile is identical, not a second `npm ci` because the disk had 1.8 GB free):** tsc 0 and 0; eslint (no --fix) 4514 problems both; gates 16 fail / 34 warn / 76 accepted before, 16 / 36 / 76 after (+1 is ADS-03's marker, +1 is `PROVISIONAL(ADS-SERVE-RULE)`, `GATES_RELEASE=1` will fail on both until the owner answers); `check_baseline.py` exit 0 both; `test:contract` 152 suites / 3665 tests (3658 passed) before, 154 / 3773 (3766 passed) after, the only failing suite both times `money/receipts/tests/receipt-units.spec.ts` (Node Unicode table, environment only; `data-export.contract.spec.ts` passed because `ADMIN_JWT_SECRET` was set); `scripts/protected-routes/run.sh --fresh` 244/244 both. Mobile `npm run check`: exit 0 after (docs only: 43 suites, 754 tests as ADS-03 recorded on this main, gates 0 fail on 195 files, no OpenWalletScreen timeout).
- **Gaps and shared changes:** G-191 (what weight means: priority or rotation, and the tie-break), G-192 (what "event still open" means, signed-in only), G-193 (subline typed by the team, can drift from the event); SHARED-CHANGES ADS-04 #1. All are owner questions; the simplest default is built and the one switch is `AD_TIE_BREAK` and the query's `orderBy` in `ads-serving.ts`.
- **Not done:** the mobile contract copy and `npm run api` (ADS-01 regenerates once the backend merges; the route is not on main yet). Counting views and taps is ADS-05; creating and pausing campaigns is ADS-06; neither is touched. The V9 live read-back (sign in and see an ad only the server has) needs ADS-06 to create one; this task's spec creates rows directly, so V9 for this route is NOT RUN here.

## Verifier report

Verifier session, 6 Oct 2026. Heads under test: backend `wmt/ADS-04` aef0699 (on ADS-03 0eeaa3c), mobile ce2b9d9. Main had not moved (backend a94f338, mobile 8484195); PRs INBOX-02 #66, INBOX-07 #67 and ADS-03 #68 were still unmerged. Own worktrees, own Postgres 16 on tmpfs (UTF8), own mock WAWU ID on :4001 started from the same checkout as the tests, real main (a94f338) and real ADS-03 (0eeaa3c) checkouts as baselines. ADS-04's own diff (`origin/wmt/ADS-03...origin/wmt/ADS-04`) is exactly the builder's file list: 10 backend files (7 src/ads files, the 52-test spec, `app.module.ts` +6 lines = one import and one entry, `contract/openapi.json` +81) and the 5 mobile doc files. Nothing in `prisma/` changed against ADS-03 (no migration, no schema).

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed | backend `tsc --noEmit` 0; `eslint src/ads src/app.module.ts` 0 problems (whole-repo eslint NOT RUN: it ran over 10 minutes and was stopped, so the builder's 4514 both sides is not re-counted); `scripts/gates/run.py` main 16 fail / 34 warn / 76 accepted (732 files), ADS-03 16/35/76 (734), branch 16/36/76 (742): the same 16 failures as main, +1 warn is `PROVISIONAL(ADS-WEIGHT-RANGE)`, +1 is `PROVISIONAL(ADS-SERVE-RULE)` in `src/ads/ads-serving.ts`, which is scanned; `check_baseline.py` exit 0. Full `test:contract` on a fresh seeded DB: main 152 suites / 3665 tests, ADS-03 153 / 3721, branch 154 / 3773 (3752 passed, 3 skipped); the only failing suites on all three are `receipt-units.spec.ts` and `data-export.contract.spec.ts` (no `ADMIN_JWT_SECRET`), 18 failed tests each time. Mobile `npm run check` exit 0 after a clean `npm ci`: 43 suites, 754 tests, gates 0 fail on 195 files, tasks check ok, no OpenWalletScreen timeout. |
| V2 Contract | passed | The capability checks below over real HTTP against a running built hub (own data, SQL-inserted rows, real clock), plus the builder's 52-test spec (passed alone twice, beside the event, account-purge and route-shadowing specs, and in the full suite). 401 for no token, garbage, forged and `alg: none`; 400 for missing, empty, wrong case, repeated, unknown, comma list, `[]`, NUL, trailing space, SQL-looking and extra params; POST/PUT/PATCH/DELETE answer 404; `/ads/abc` 404. |
| V3 Regression | passed | `protected-routes/run.sh --fresh`: 244/244 on the branch and 244/244 on `origin/main` (253 tests each). `route-shadowing` spec 8/8. Side by side, built main vs built branch on the same data, 77 GET routes of the registry as a signed-in user and as anonymous: 0 differences in status, body, Cache-Control or Vary. `app.module.ts` diff is one import and one list entry. `contract/openapi.json` against ADS-03: only `GET /api/hub/ads` and `AdCardView`; `npm run contract:build` leaves `git diff` empty (byte for byte). Scratch merge (never committed) of ADS-04 with INBOX-02 then INBOX-07: INBOX-02 merges clean, INBOX-07 conflicts only in `app.module.ts` (import and list entry, keep both) and `contract/openapi.json` (regenerated); after that `tsc` 0, contract has `/ads`, `/inbox`, `/inbox/unread`, `/live/catch-up`, and the ads, route-shadowing and inbox specs pass (152 tests). |
| V4 Field trace | passed | Writer is ADS-06 (not built; rows were SQL-inserted); storage `AdCampaign` + `AdCreative` (ADS-03); reader is `GET /ads`. Each served field equals the stored value: id is the campaign id; advertiser, headline, subline, ctaLabel, ctaDestination, ctaDestinationId, artworkUrl are as stored (an `http:` artwork and a query string are served unchanged; null subline and null artwork stay as keys). Weight, status, window, creative id, timestamps never reach the body or headers. Event side: the target is read from `Event` and the same viewer's blocks (both directions) from `BlockedAccount`. |
| V9 Live seam | passed | Real `scripts/local/up.sh` from a copy of the branch, with the real wawu-id (own checkout copy, own keypair and databases) on :3112 and the hub on :3111. Signed in through the real `POST /auth/login` (no injected token). `GET /ads?placement=tgif_card` returned `data: null`. Inserted by SQL a published event, a `live` campaign (weight 10, ending in 8 s) and its creative: the card came back (id equals the campaign, advertiser "VerifierCo", `Cache-Control: no-store`); `GET /events/<ctaDestinationId>` answered 200 (the button leads somewhere); `today_slot` stayed null; set `paused` it vanished on the next request; set `live` again it returned; after `endsAt` it was gone. Stack stopped with `down.sh`. |

### Capability checks, as written

- [x] **`GET ads?placement=tgif_card` and `?placement=today_slot` each return at most one live card, and none outside its dates.** Passed. Each placement returns one object from its own placement only (a 100-weight booking on the other placement never wins). Real-clock flip tests (window ending or starting 2.5 s ahead, polled every 60 ms, 66 samples each): 0 requests misclassified against the boundary. Exact boundaries start-1ms / start / start+1ms / end-1ms / end / end+1ms over HTTP with a scratch preload that freezes the clock only inside `ads.service` (never committed), on a server running with `TZ=Pacific/Auckland` (DST, +13): all six correct, and a window straddling Auckland's 2026-09-27 DST jump is correct at 13:29:59.999, 13:30, 14:00 (the jump), 14:29:59.999 and 14:30 UTC. Status matrix draft, scheduled, live, paused, ended: only scheduled and live are served; no creative: not served. 60 requests (3 viewers, 18 at a time, three rounds) all returned the same one id.
- [x] **With no live campaign, nothing is returned and the screen shows no empty frame.** The backend half passed: an empty table, only out-of-window, draft, paused, ended or creative-less bookings, or every campaign pointing at a closed event all answer `200 {"statusCode":200,"message":"OK","data":null}`. The "no empty frame" half is the app's (ADS-01 draws nothing on `null`); not testable in this task.

### Selection, event check, scale

- Highest weight first; ties by earliest start, then earliest creation, then smallest id: each tier verified over HTTP. Seven heavier ineligible bookings (paused, draft, ended, future, past, no creative, other placement) never beat a weight-1 eligible one.
- Fallback to the next campaign when the winner's event is pending, rejected, removed, cancelled by status, cancelled by `cancelledAt`, over, started with no end, deleted or never existed, or hosted by someone blocked in either direction with the viewer (only that viewer is affected; the host as viewer still sees it). A started event with an end still in the future is served. All closed gives `data: null` with 200.
- Scale: 6000 campaigns and 400 events (1233 eligible on tgif_card, 1230 of them pointing at closed events, one open weight-1 at the bottom): one object, 34 to 46 ms per request including HTTP. Postgres log shows 4 statements per request (campaign, creative, blocks, events), the same with 1 or 1233 closed candidates, so there is no N+1. `EXPLAIN ANALYZE` on the serving predicate uses `AdCampaign_placement_status_startsAt_endsAt_idx` (bitmap index scan), 5.5 ms. The service reads every eligible candidate (no limit) and sends all their event ids in one `IN`; see unclear U6.
- Leaks: exact key set asserted (8 keys); no weight, status, window, creative id, createdAt or updatedAt, and none of draft, paused, ended, expired, creative, or the names of draft or paused campaigns, in body or headers (the word "statusCode" is the common envelope). 401 and 400 bodies say nothing about campaigns.
- Caching: `Cache-Control: no-store`; Express adds a weak ETag from the body. A conditional GET with the old ETag after the ad was paused returned 200 with the new body, not a stale 304 (a 304 only when the body is unchanged). `Vary: Origin, Accept-Encoding`. No Last-Modified, Expires or Pragma. No header or env sets the clock: `X-Now` and `Date` request headers had no effect; the clock is a Nest provider (`ADS_CLOCK`, `systemClock`) that only the spec overrides.
- Rate limit: the global `ThrottlerGuard` applies (20 per second, 200 per minute); a burst of 60 from one user gave 20 x 200 and 40 x 429, identical to `GET /events`.

### Mutation checks (scratch copy, never committed, each restored; worktree clean after)

Spec failures out of 52: end `gt` to `gte` 3; start `lte` to `lt` 3; no status filter 7; no cancelled filter 2; no block filter 1; no published filter 11; weight ascending 3; id descending 2; startsAt tie descending 1; createdAt tie descending 1; event `gte` to `gt` 1; event no-end `gte` to `gt` 1; drop the placement filter 4; UTC replaced by a +13 h shift 8; remove no-store 1; skip the event check entirely 20. One survivor: dropping the `creative: { isNot: null }` condition leaves 52 passing, because the loop's `if (!creative ...) continue` gives the same answer (an equivalent mutant: the condition only saves reading those rows).

### Hygiene

The spec leaves every table's row count equal to the fresh seed and leaves no AdCampaign, AdCreative, Event or BlockedAccount rows (also after the full suite). No TODO or "for now" comments, no em-dashes in anything a user reads (src/ads, the gap rows, the SHARED-CHANGES row, the log line). No wallet or ledger write. Gap ids G-191 to G-193 are unique on main and on every open `origin` branch. Fenced files: `app.module.ts` and `contract/openapi.json` each have SHARED-CHANGES row ADS-04 #1. The 200-with-null contract is in the contract (`AdCardView`, `nullable: true`) and in the controller comment.

### Findings

No `defect`. No `differs-for-recorded-reason`.

`unclear` (for the owner, carried forward):
- U1 (G-191) What a campaign's weight means: strict priority (built: the heaviest wins every time, so a weight 1 booking never shows while a heavier one overlaps) or a share of the time. `PROVISIONAL(ADS-SERVE-RULE)` stays until answered; `GATES_RELEASE=1` will fail on it.
- U2 (G-192) What "event still open" means. Built: published, not cancelled, not finished by the Events list's own "upcoming" test, host not blocked either way. It differs from `GET /events` in one way, deliberately and recorded in G-192: a published event with `cancelledAt` set is listed by `GET /events` but never served as an ad. An event that started and has no end time counts as over (same as `GET /events`), so a one-day event with no end stops being advertised once it begins. Tickets on sale or sold out are not looked at.
- U3 (G-193) `subline` is typed by the team and can drift from the event's date and price.
- U4 Signed-in only (`WawuAuthGuard`) for both placements. Neither the task, R-15, nor any ruling says public; H33 and H36 are inside the signed-in app; the backend has no TGIF or Today route to compare with, and every other `GET /events`-style read here is signed-in. So not a defect; the owner confirms. A signed-out visitor sees no ad (401).
- U5 The "upcoming" test is a copy, not a reuse: `timeWindow()` in `src/event/event.service.ts` is a private function and `ads.service.ts` writes the same `OR` again. They agree today (the spec pins the boundary), but a change to one will not reach the other. Exporting the one function would remove the drift; not required by the task.
- U6 Candidates are not capped: every eligible campaign for the placement is read and all their event ids go into one `IN`. Fine for hand-booked ads (R-15; thousands were served in about 40 ms), but there is no bound if the table ever grows to tens of thousands of simultaneously live rows.
- U7 An `http:` artwork URL is served exactly as stored (ADS-03's CHECK allows `http` and `https`); the app should decide whether to draw it.
- U8 A burst over 20 per second gets 429 like every other route; the app should draw no card on any error (ADS-01's).

Environment notes, not findings: the first full branch run had one timing failure in `fintava-stall.spec.ts` ("lands at half the timeout"); it passed alone on branch and main, and a full second run on a fresh DB was clean (only the two known suites failed). On a cold jest cache `route-shadowing` failed once in a combined run and passed on rerun. ADS-03's data-model spec (blank text "in any locale") needs a UTF8 database; on an SQL_ASCII cluster it fails 5 tests, so the test database must be UTF8.

Status set to `review`.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
