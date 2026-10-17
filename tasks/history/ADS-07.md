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

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

