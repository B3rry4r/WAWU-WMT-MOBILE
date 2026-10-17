# ADS-07 · round history

Moved out of [tasks/ADS-07.md](../ADS-07.md) word for word, oldest first. The current state is in that file.

## Builder report

_Sonnet builder, 17 Oct 2026._ **Files (backend):** `prisma/schema.prisma` (enum label, comment) and migration `20261024110000_ads_explore_slider`; `src/ads/` (`ads-serving.ts`, `ads.service.ts`, `ads.controller.ts`, `ads-view.type.ts`, `dto/ads.dto.ts`); `src/admin/ads/` (`admin-ads.service.ts`, `admin-ad-view.type.ts`, `dto/admin-ad.dto.ts`); `contract/openapi.json` (regenerated, additions only); `README.md`; specs `src/ads/tests/ads-serve`, `ads-events`, `ads-data-model`, `src/admin/ads/tests/admin-ads`. **Files (app):** `src/features/ads/{api,SponsoredSlot,SponsoredStep}`, `src/features/tgif/TgifReader.tsx`, the three ads tests, `contract/` and `src/api/schema.generated.ts`, `SHARED-CHANGES.md`, `BACKEND_GAPS.md` (G-761, G-805).
- **An admin cannot save a campaign without artwork; with artwork it saves and serves:** `admin-ads.contract.spec` (HTTP, real database): 422 and the exact sentence for a body with no artwork and for null, nothing written (campaign and audit counts unchanged); with artwork it saves, is scheduled and `GET /ads` returns it; PATCH null is 422; PATCH on a campaign saved without artwork is 422 until it is given one, then 200.
- **`GET /ads?placement=explore_slider` returns the live campaigns in order and counts a view once:** `ads-serve.contract.spec` (order by weight, start, booking, id; an empty list; status, window to the millisecond, card, picture, event, block rules; a pause takes effect at once; never mixes with the other placements) and `ads-events.contract.spec` (a slide's view counted once a day, tap once; a card with no picture is refused).
- **The Today card and the slider never draw a campaign without a picture:** backend (not served) and app (`drawable()` drops it; `ReaderSponsored`, `TodaySponsored` and `api` tests enter the real cause: a Hub answer with `artworkUrl` null or not a web address).
- **Gates:** backend 5 fail, 119 warn, 83 accepted before and after (the same 5 as main). New PROVISIONAL markers: none. Mobile gates: see the log.
- **Shared changes filed:** ADS-07 #1 (schema, contract), #2 (the app's contract copy), F1 (`TgifReader.tsx`). **Gaps:** G-761 and G-805 closed by this task.
- **Not done:** see Current state.

## Builder report, round 2

_Sonnet builder, 17 Oct 2026 (the lead's two rulings on the round 1 questions)._ **Files (backend):** `src/admin/ads/admin-ads.service.ts` (`transition`: schedule and resume throw the same `artworkRequired()` 422 as POST and PATCH, after the 409 for a move not allowed from the status and the no-card 409, before the window and event checks; pause and end untouched), `src/admin/ads/admin-ads.controller.ts` (two doc lines), `contract/openapi.json` (regenerated: two operation summaries), `README.md` (the lifecycle row), spec `src/admin/ads/tests/admin-ads.contract.spec.ts`. **Files (app):** `contract/openapi.json` and `contract/SOURCE_COMMIT` (copy of the backend's), this task file; no app code.
- **schedule refuses a campaign with no artwork:** new spec, red first (200 where 422 was expected), then green: 422, the exact sentence, `reason.code` `artwork_required`, status still draft, audit rows unchanged, not served; after a PATCH that gives it artwork, schedule is 200 and `GET /ads` serves it.
- **resume refuses a campaign with no artwork:** the same for a paused campaign (status still paused, no audit row); with artwork, resume is 200 and it is live.
- **Pause and end are never refused for it:** one spec (a live campaign with no picture can be paused, then ended; a draft can be ended).
- **No cap on the Explore slider:** unchanged; recorded in Current state.
- **Checks:** backend tsc and eslint clean; the admin ads spec and the `src/ads/tests` specs against the local stack (admin 207 tests, the rest 173) pass; the events spec failed once in its afterAll on one stray `MoneyCheckRun` row written by the stack's own background job while it ran (not ADS code) and passed alone on the re-run. GitHub and the mobile check: see Current state.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

