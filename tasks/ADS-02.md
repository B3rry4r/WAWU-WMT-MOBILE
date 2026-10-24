---
id: ADS-02
title: Admin screens: ads
owner: YOU
area: ADS
order: 43
priority: launch
repo: wawu-dashboard
type: admin-screen
status: verifying
depends_on: [ADS-06, ADS-05]
decisions: [R-15]
passes: [V1, V6, V7, V9]
artboards: []
tier: T1
---
# ADS-02 · Admin screens: ads

## Current state

As of 24 Oct 2026, built by a Sonnet builder (T1, bundle B13), dashboard branch `wmt/ADS-02` `0d16895` (wawu-dashboard, on the ADS-02 branch `95e1085`), mobile `wmt/ADS-02` (records). Status verifying; nothing is merged or live.

| # | Before (dashboard `95e1085`, contract at backend `965280e`) | After (contract at backend `8fca5dd`) |
|---|---|---|
| 1 | a booking could be saved with no picture | R-59: a picture is required on a new booking and on an edit; the form names "a picture" as missing and the server's 422 is shown in its words |
| 2 | Schedule and Resume were offered on a booking with no picture | not offered when the server says `needsArtwork`; the Actions card says why and what to do (edit it, or pause it then edit it) |
| 3 | the Explore slider placement was unknown (a type error against the new contract) | "Explore slider" is a placement with its own label and hint |
| 4 | no way to find bookings with no picture | a "Picture" filter (`artwork=missing`), a "Needs a picture" badge on the row and the booking page, and a count under the figures (`needingArtwork`) |

Live look (local stack `b13dash`, Hub on backend `8fca5dd`, dashboard production build): `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/dash-b13/` `ads-1` to `ads-9` at 1440 px (list empty, create empty, create held for the missing picture, create filled, booking page, edit, list with data, list filtered to "Needs a picture", booking page of a booking with no picture). Nothing else about the task changed: G-332 stands, and the earlier verifier-free state (13 of 13 spec, 7 mutants) is in the builder report below.
- **Next:** a verifier session.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV2.md` (what you own)
- `DECISIONS.md`: R-15 (ruled; build what it says)
- This task changes `wawu-dashboard`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

Staff book, schedule and report on ads.

## Scope

Dashboard screens over ADS-06.

## Capability checks

- [ ] An admin can schedule a sponsored card for a date and later see its views and taps.

## Builder report

Built by the lead's agents, 8 Oct 2026. Dashboard branch `wmt/ADS-02` (wawu-dashboard, from main c1dfca6); mobile branch `wmt/ADS-02` (this file, `BACKEND_GAPS.md` G-332, `SHARED-CHANGES.md` ADS-02 #1, #2, F1 and F2, `docs/LOG.md`). **No backend change**: the screens use ADS-06's routes on backend main 965280e as they are. Evidence under `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/bad02/`: `shots-v2/` (screenshots, `flow.log` the walk, `db-readback.txt`), `spec-out/spec-real-2.txt`, `mut/`, `run/flow.py`, `run/spec.py`, `run/mutants.py`, `callers-after.txt`.
- **Files (dashboard):** new `src/app/(app)/ads/page.tsx` (the bookings: one filter for the figures and the table), `ads/new/page.tsx`, `ads/[id]/page.tsx`; `src/components/ads/` (`AdCampaignForm`, `AdCampaignDetail`, `AdActionPanel`, `AdReportCard`, `AdCardPreview`, `AdDeliveryFigures`, `AdBadges`, `adTime.ts`); `src/lib/api/admin-ads.ts` and its barrel exports; `src/lib/format.ts` (four formatters added); `src/components/layout/nav.ts` ("Sponsored cards" under Reach); `scripts/generate-contract-types.mjs` and the regenerated contract (SHARED-CHANGES ADS-02 #1); `src/components/events/EventBadges.tsx` (`hybrid`, which the regenerated enum brings) and `src/components/finance/PeriodPicker.tsx` (its labels now name its date inputs) (ADS-02 #2). No response shape is written by hand: views, DTOs, enums, the role matrix, the state machine (`ACTION_FROM`, `EDITABLE_STATUSES`, `DELETABLE_STATUSES`) and the limits (`AD_TEXT_LIMITS`, `AD_WEIGHT_MIN` and `MAX`, `AD_ARTWORK_URL_MAX`) all come from the generator.
- **Screens and states** (`shots-v2/`, each entered by its real cause, 1280 px, light and dark; list, booking page and form also at 1440 px, `40-wide-*`): list empty (01), list loading with the Hub's answer held (02), new booking empty (03), event picker loading (03b), the form refusing an em dash, weight 0, an end before the start, 61 characters and an `http` picture as they are typed, Save held (04), filled with the card preview (05), saved draft and its toast (06), booking page loading (06b), schedule confirmation (07), scheduled and not yet on air (08), live (09), paused (10), edit while paused (11), the edit in the history as "field: before to after" (12), delete confirmation (13) and back on the list (14), list with counts (15), the report (16), a range with nothing counted (17), a range that cannot be sent, said in words and not sent (18), one day (18b), a 409 when someone else paused it a moment before, in the server's words (19), end confirmation (20) and ended with no moves left and the counts kept (21), filters (22, and 23 empty), a real 404 (24), support and finance read-only (25, 26), a reviewer pausing and resuming (27), the Hub stopped: list, booking page and form errors (28 to 30), and back after the restart (31).
- **Capability check "an admin can schedule a sponsored card for a date and later see its views and taps": passed.** Local Hub built from backend main 965280e (own database `bad02_hub_test`, admins from `npm run admin:seed`, events inserted by SQL, stand-in WAWU ID on :5593), dashboard production build on :5592. A superadmin signs in through `/login` (no injected token), books "Gospel Night Live" on `/ads/new` for a window starting 4 minutes later (07:32 Lagos, sent as `06:32:00Z`) and schedules it on its page: `scheduled`, toast "Not on air yet: the window opens 08 Oct 2026, 07:32". After the window opened, three users registered on the stand-in got that campaign from `GET /ads?placement=tgif_card` and posted 3 views, 2 taps and 1 skip (plus a repeat view, not counted). The list row and the booking's report show 3, 2, 1 and 66.7%, the same as `AdDailyTotal` and `AdEvent` read straight from the database (`db-readback.txt`). Pause, resume and end on the page took the Today card off `GET /ads` (null), back on, and off again (`flow.log`).
- **Behaviour spec** (`run/spec.py`, 13 checks over real HTTP and the real build, 13 of 13 on the branch): only the moves the status allows are offered (draft, live, ended); a list row shows the server's views and taps; 09:00 typed in Lagos is sent as 08:00 UTC; the create body carries UTC times and the event and no empty line; an edit sends only the changed field (`{"weight":7}`); a To before From, and a To on the From day, are explained and not sent; a range with nothing counted says so; delete removes the draft (server 404) and returns to the list; support and finance cannot book, pause or end.
- **Mutants (mine, 7; each applied, rebuilt, spec run, `git restore`d, tree clean after; `mut/results.json`, `mut/results-5-7.json`):** all 7 killed: M1 every move offered whatever the status (3 checks fail), M2 "Book a card" for every role (2), M3 a typed time read as UTC (2), M4 an edit also sends the advertiser (1), M6 the views column shows taps (1), M5 a To on the From day is sent and M7 an empty subline is sent. M5 first SURVIVED (the spec only tried To before From), so the spec gained the same-day check and then killed it; M7 first crashed the spec (the save never left the form) and was killed by the spec's "a valid booking saves" check once that was written as a check.
- **Dashboard checks, before (main c1dfca6) to after:** `npm run check` exit 0 and exit 0 (contract 56 to 63 backend files, ops 14 and 14, `tsc` 0 and 0, eslint 0 errors and 1 warning both, the same `SHOP_DTO` warning, invariants clean on 128 to 140 files, contrast 58 pairs both); `npm run build` exit 0 both (adds `/ads`, `/ads/new`, `/ads/[id]`); `python3 scripts/gates/run.py` 1 fail, 0 warn, 6 accepted both (the same `finance/payouts/page.tsx:39` deferral; 128 to 140 files). The contract check needs `HUB_API_PATH=/home/user/wawu-backend HUB_API_REF=965280e WAWU_WEB_PATH=/home/user/wawuafrica` (from a worktree the dashboard's own search finds no backend). Main's generated contract is stale against backend main (`check:contract` exit 1 with `HUB_API_REF=origin/main`: no `hybrid`, `conference` or `concert`); this branch's matches 965280e. Browser console during the walk: no page error; the failed requests are the font CDN this sandbox cannot reach, the deliberately unreachable picture host, the 404, 409 and Hub-down cases, aborted link prefetches, and a 403 on the content queue when finance lands on the Overview (not this task's screen).
- **Mobile checks (this branch changes docs only; code identical to main 50a7a89):** `npm run check` exit 0 on the fourth run as one command (76 suites, 1377 of 1377 tests, gates 0 fail, 0 warn, 0 accepted on 346 files, baseline 0, task check ok with 249 tasks). The first three runs exited 1 on a 4-core machine at load 36 to 44 from other sessions, each with different Jest timing failures (run 1: OpenWalletScreen A26, settings Z2 to Z5, explore X13; run 2: auth-signup A15, explore X2 and X3; run 3: explore X2 and X3); every one of those suites passed alone in band (explore 24 of 24, settings and OpenWalletScreen 128 of 128), and the fourth run, at load 32, passed whole.
- **Protected routes:** `extract-callers.py` with the dashboard at main: 0 differences; at this branch: exit 1, exactly the 11 admin ads routes, none protected (G-332). The lock is untouched; adding them is an owner re-lock.
- **Secret scan:** the staged dashboard and mobile diffs, for `sk_`, `FLWSECK`, bearer tokens, private-key headers and long base64 or hex runs: only the generator manifests' sha256 content hashes (their existing format).
- **Defaults (agent), owner may override:** times are typed in the browser's zone (Lagos for the team) and the UTC instant to be sent is printed under each field; the report's range is picked in UTC days, as the counts are kept; the event picker lists published events (the first page of 100 by latest start), keeps those not over and sorts them soonest first, and a booking's current event stays listed, marked, if it has closed; an edit sends only what changed and is held when nothing has; Schedule and End ask first (on air, final), Pause and Resume are one press (reversible); a new booking is sent with weight 1 unless changed; the tap rate reads "No views yet" with no views, and no per-day rate is computed (the server sends none); the preview draws only what the team types, not the app's fixed words; no Overview tile (ads are not a queue waiting on a person); the contract is pinned to backend commit 965280e so its check is reproducible.
- **Filed, not done here:** G-332 (the protected list, an owner re-lock). SHARED-CHANGES ADS-02 F1 (19 controls in four other dashboard screens have labels tied to nothing, the pattern this task's first form had) and F2 (`Skeleton` heights passed as `className` do not apply, 34 call sites). G-195 stands: there is no admin upload, so the picture is a link the form checks is https.
- **NOT RUN:** a card preview with a real picture: no https image host is reachable from this sandbox, so every picture shows "No picture"; unblocked by an https image the browser can load (for example one stored through the admin upload G-195 asks for). The dashboard's own font: Alan Sans from cdn.jsdelivr.net is refused here, so the shots use the fallback; unblocked by the browser reaching that CDN. The app's side of the card: ADS-01 is not built, so the served card was checked through `GET /ads` only; unblocked by ADS-01. Backend gates, protected suite and `npm run api`: not applicable, no backend file changed.

### Round 2 (24 Oct 2026, bundle B13, Sonnet builder, T1)

R-59 and the contract drift since `965280e` (ADS-07 landed: `explore_slider`, `needsArtwork`, the `artwork=missing` filter, `needingArtwork`, a 422 for no picture). Files (dashboard): `scripts/generate-contract-types.mjs` (a `(typeof ARTWORK_FILTERS)[number]` resolution, the global prefix read from `src/hub-app-config.ts` where `setGlobalPrefix` moved), the regenerated contract, `src/lib/api/admin-ads.ts` (the `artwork` filter on the list and the summary), `src/components/ads/AdBadges.tsx`, `AdCampaignForm.tsx`, `AdActionPanel.tsx`, `AdCampaignDetail.tsx`, `src/app/(app)/ads/page.tsx`. Checks: see SCHOOLS-05's report for the bundle's dashboard checks (`npm run check` exit 0, `npm run build` exit 0, `npm test` 6 of 6). The earlier 13-check spec and mutants were not re-run (their harness is under `scratchpad/bad02/`, not part of this bundle); the new states were each reached by their real cause in the browser, and the booking with no picture was made the way R-59 says they exist: saved with a picture, then the picture removed in the database.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
