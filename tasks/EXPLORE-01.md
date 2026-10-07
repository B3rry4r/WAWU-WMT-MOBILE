---
id: EXPLORE-01
title: Explore: browse, categories, loading, empty
owner: YOU
area: EXPLORE
order: 110
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: building
depends_on: [EXPLORE-03, UI-02, UI-03]
decisions: [R-37]
passes: [V1, V4, V5, V6, V9]
artboards: [X1, X15, X2, X3, X13, X14]
---
# EXPLORE-01 · Explore: browse, categories, loading, empty

Taken over by the lead's agents on 7 Oct 2026 (Developer 1 at their usage limit; owner's instruction).


## Lead note (7 Oct 2026): built now, with what exists (R-41)

The owner asked for every tab to be built now. This hub is built before the tasks below; each entry on it that leads to one of their screens is left out here and added, exactly as drawn, by that task (R-27, R-41). Everything else on the artboards is built as drawn.

- EXPLORE-02 (All creators and search)
- EVENTS-01 (Events: list, filters, detail, sold out)
- PROS-01 (Find a professional)
- SCHOOLS-03 (Schools: directory, school page, course page, no results)
- PROS-03 (Get listed as a professional)

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV.md` (what you own)
- The design: `python3 scripts/design/render_design.py X1 X15 X2 X3 X13 X14` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A4.json`
- `docs/designer/BRIEF.md` (the brief is part of the design, R-29; it has no entry for X1, X15, X2, X3, X13, X14, so those artboards stand, under its rules 3 to 8 on fees, refunds, licence lines and em-dashes)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

- **X1 · Explore**: Explore ('Approved E4'): search bar, FEATURED EVENT hero (WAWU Creators Summit, Lagos, 12 Oct · Eko Convention Centre), category chips (All + 6 + More), Featured creators rail (@handle, field, Follow), Upcoming events list, then doors: Find a professional, Find a school, List your services.
- **X15 · Explore · scrolled down**: Explore scrolled: Upcoming events, then the doors: Find a professional (Accountants, lawyers, designers), Find a school (Courses from schools and academies), List your services (Get paid to answer questions).
- **X2 · Categories**: Categories screen: chip row (All, Music & Audio, Film & Video, Art & Design, Photography, Fashion & Beauty) above a creator list with Follow/Following.
- **X3 · One category**: Photography selected: chips stay in place; creators @amaka Photographer, @chidi Wedding films, @sade Portraits, @tunde Drone, each with Follow.
- **X13 · Empty category**: From X3 when a category is empty: chips All, Gaming & Esports, Faith & Spirituality; 'Nobody is publishing in Gaming & Esports yet'.
- **X14 · Explore · loading**: From X1 while loading: skeleton with search bar and tab bar.

## Added by later tasks

These entries are drawn on this task's artboards but lead to screens built by later tasks, so this task does
not build them. Each is added, exactly as drawn, by the task that builds where it leads (docs/WORKFLOW.md
section 7, R-27). The verifier reports their checks as belonging to that task.

- X1: the bell (opens M31): added by ME-14
- X1: a creator (opens M5): added by ME-02

## Capability checks

- [ ] **X1**: a user can search (X5); open the featured event or an event row (E2); tap a category (X3); See all creators (X4); Follow; Find a professional (P1); Find a school (SC1); List your services (P5).
- [ ] **X15**: a user can open an event (E2); Find a professional (P1); Find a school (SC1); List your services (P5).
- [ ] **X2**: a user can tap a chip (X3); Follow.
- [ ] **X3**: a user can switch chip; Follow.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states X13, X14.

## What the backend serves today (from the analysis)

- **X1**: partial. Missing: Featured event and event list served. Creators served but 'featured' creators has no featured/paid-featured flag (web FeaturedThisWeek.tsx: 'nothing on the contract marks a creator … as PAID-featured'); creator category filter matches UserProfile.interests strings, not the creator taxonomy categories drawn; no schools backend for the Find a school door.
- **X15**: partial. Missing: Events and professionals served; Schools door target has no backend at all (Schools flow is new).
- **X2**: partial. Missing: Filter is on free-text interests, not the creator taxonomy category ids the chips show; no specialization-based creator filter.
- **X3**: partial. Missing: Same as X2: category semantics differ from the drawn taxonomy.
- **X13**: partial. Missing: Works as an empty list; categories themselves differ (see X2).
- **X14**: n/a.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- X1: WAWU Creators Summit, Lagos, 12 Oct, Eko Convention Centre
- X1: Gospel Night Live, Abuja, OCT 18
- X1: Monetise Your Content, Online, NOV 02

## Designer notes (⚠, unresolved)

- None.

## Builder report

**Files.** `src/app/(tabs)/explore.tsx` (the tab now opens Explore), `src/app/categories.tsx` (new, `/categories?category=<id>`), `src/features/explore/`: `api.ts` (categories, featured, creators pages, follow and unfollow), `categories.ts`, `paging.ts`, `follow.ts` (one Follow state on every Explore list), `ExploreScreen.tsx` (X1), `ExploreSkeleton.tsx` (X14), `CategoriesScreen.tsx` (X2, X3, X13), `CategoryTiles.tsx`, `CategoryChips.tsx` (stand-in, SHARED-CHANGES EXPLORE-01 #1), `CreatorCard.tsx`, tests `__tests__/model.test.ts`, `__tests__/screens.test.tsx`. Docs: BACKEND_GAPS G-300 to G-302, SHARED-CHANGES EXPLORE-01 #1 to #3 and F1, docs/LOG.md.

**Left out (R-27, R-41), with the task that adds each as drawn:** X1 search bar (opens X5) and Featured creators "See all" (X4): EXPLORE-02. X1 bell (M31): ME-14. X1 a creator card opening M5: ME-02 (Follow on the card is built). X1 FEATURED EVENT hero, Upcoming events, its "See all" and event cards (E2, E1), and X14's hero skeleton block: EVENTS-01. X1 and X15 doors: Find a professional (P1) PROS-01, Find a school (SC1) SCHOOLS-03, List your services (P5) PROS-03. X1, X14, X15 Create button (M19): ME-04. **X15 is not built at all**: everything it draws is the events rail and the doors above. Nothing on these artboards leads to a screen already built, so nothing else was wired.

**Checks.** X1: tap a category (X3): jest `a user can tap a category tile...` and live (Photography tile opens X3 with Chidi). Follow: jest (Follow, Following, refused put back, own card has no Follow) and live (POST written, read back `zainab-pro following: true` with the user's token). Search, featured event, event row, See all, the doors: NOT RUN, left out (above). X15: NOT RUN, left out. X2: tap a chip (X3), Follow: jest and live. X3: switch chip, Follow: jest and live. V5: screenshots taken (list below), comparison is the verifier's. Every value comes from the Hub: categories, handles, fields and ticks from `GET /explore/*`; no event figure is on screen. V6: loading (requests held by the network), empty (X13: a category nobody publishes in, Gaming & Esports and Music & Audio on the seeded Hub), error (connection dropped on every try; Try again recovers), each live and in jest. X1 has no empty screen: with nobody featured the rail is not drawn and the tiles stay (jest).
**V9 (local Hub, wawu-backend 3041887, DB `bx01_test`, stand-in WAWU ID on 5372).** Signed in through the app's own sign-in screen as `user@test.wawu.dev`; featured creators were set by a superadmin through `PUT /admin/featured-creators/:id`; Chidi's and Zainab's interests were written through `PATCH /users/me` as each creator, so Photography and Business & Finance hold one creator each. The stand-in WAWU ID answers sign-in bare while the app reads `{ data }`; for this run a 15-line preload (scratch only, not committed) wrapped `/auth/login` and `/auth/refresh` answers in the real envelope. The exported bundle held only `localhost:5371` and `:5372`.

**Screenshots** (390 wide, light and dark): `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/bx01/shots/`: `X1`, `X1-following`, `X14-loading`, `X2`, `X3`, `X3-chip-switch`, `X13`, `categories-loading`, `categories-empty-music`, `categories-error`, `X1-error`, `X1-after-retry`, each `-light.png` and `-dark.png`.

**Gates.** Before: tsc 0, gates 9 run / 297 files / 0 findings, 210 tasks, jest 1142 passed and 1 failed (`OpenWalletScreen.test.tsx` A26 timed out at 20 s under load; it passes in the full run after). After (main a167415 merged): `npm run check` exit 0: tsc 0, lint 0, jest 65 suites 1171 passed (28 new), gates 9 run / 310 files / 0 findings, baseline 0, 210 tasks. One earlier full run failed once on `WorkScreen.test.tsx` (M35 Remove, not touched here) at load average 10; it passed alone (26/26) and in the next full run.

**Defaults (agent), owner may override.** Tiles and chips follow the server's category order (G-180), so X1 shows Music, Film, Photography, Fashion, Business, Technology, not the canvas's order. Icons for the four categories the canvas never draws: Business BriefcaseBusiness, Technology Smartphone, Food & Lifestyle Sun, Sports Dumbbell. All and More both open Categories on All. The creator tick shows first, else the professional tick. A card with no handle shows the name. With nobody featured, the Featured creators section is hidden. All's empty copy (not drawn): "Nobody is publishing yet" / "Come back once more people have published." The chip a link opens on is scrolled into view once if it starts out of view; after that the chips stay in place (X3). Follow on the card is the shared Button, size sm, held to the canvas's 32 height (its label is 13.5, the canvas 13); Following uses the glass look (white at 14% with a glass ring; the canvas draws white at 20%, no ring). The bar is announced as the heading "Explore" (X1 has no title).

**NOT RUN.** V10 (no tester build with this branch; unblocked when a development or tester build includes it). V4 beyond follow (the one field one person writes and another reads: tested both sides through the API). Picture comparison (V5) is the verifier's.

## Verifier report

Verifier: independent session (wrote none of this task), 7 Oct 2026. Mobile `wmt/EXPLORE-01` at 1f62d98 (main a167415 already merged, origin/main unmoved), own worktree. Backend origin/main 3041887 on a fresh database `vx01_hub_test` (migrated, `prisma db seed`), **the real WAWU ID** (wawu-id origin/main fb8717e, database `vx01_id_test`, seeded by `scripts/local/seed-wawu-id.js`) on 5412, Hub on 5411, web export on 5413 (`npx expo export --platform web --clear`, private TMPDIR; the bundle holds only `localhost:5411` and `localhost:5412`, no `wawuafrica.com`). Evidence: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vx01/` (`shots/`, `design/`, `logs/`, `mut/`).

| Pass | Result | Evidence |
|------|--------|----------|
| V1 | failed (defects 1 and 2, VERIFIER check 2) | `npm run check` first run at load 11 to 12: jest 63/65 suites, 1168/1171, the 3 failures are 20 s timeouts in `OpenWalletScreen.test.tsx` (A26, 2 tests) and `settingsScreens.test.tsx` (Z3, 1 test), other tasks' files; rerun alone 2 suites 128/128 passed. Final `npm run check` with this report (load 3.5): exit 0, tsc 0, lint 0, jest 65 suites 1171 passed, gates 9 run / 310 files scanned / 0 findings, baseline 0, 210 tasks. No em-dash, hex, rgb or named colour in the diff; every size is a named metric citing the kit (gates 0 findings). Scope fence kept: only `src/features/explore/`, `src/app/(tabs)/explore.tsx`, `src/app/categories.tsx`, tests and docs (BACKEND_GAPS, SHARED-CHANGES, LOG, PROGRESS, the task); no `_layout.tsx`, shared component, theme, `package.json` or shared test changed. `logs/check1.log` |
| R-41 | passed | Every entry left out leads to a screen not built: `src/app/` has no search (X5), All creators (X4), event (E1, E2), profile (M5), notifications (M31), professional (P1, P5), school (SC1) or Create (M19) route, and EXPLORE-02, EVENTS-01, PROS-01, PROS-03, SCHOOLS-03, ME-02, ME-14, ME-04 are all `todo`. Nothing drawn opens nothing: tiles open Categories, More and All open Categories on All, Follow works, a creator card has no press. No "Search", "See all", "Upcoming", door or "coming soon" text on X1 (driven, `logs/drive-main.log`). **X15 is not built at all**: below Featured creators X1 ends; no events rail and no doors. |
| V4 | passed | Tiles and chips in the Hub's order (`GET /explore/categories`); with the categories answer reversed and Photography renamed "Pictures VX" in flight, tiles read All, Gaming & Esports, Sports & Fitness, Writing & Publishing, Art & Design, Faith & Spirituality, Food & Lifestyle, More and the chips followed (`shots/X1-trace-light.png`). Featured rail in the admin's order from `FeaturedCreator` (zainab position 0, chidi 1). Seeded values are non-canvas: `@zainab-pro` with the creator tick (set by `creator_verified_at/until`) and field "Fashion & Beauty" (written through `PATCH /users/me`); changing her to handle `zainab.vx01`, interest "Sports & Fitness" through `PATCH /users/me` showed `@zainab.vx01 / Sports & Fitness` on reload. Follow state read from the Hub (the seed's two follows showed Following before any tap). Paging: 26 more creators (SQL seed, each with a live piece) gave Photography 27; scrolling sent `page=2&perPage=24&category=photography` and drew `@pg26` (`shots/X3-page2-light.png`). Follow read back: below. |
| V5 | passed with recorded differences, see findings 1 to 6 | Pairs below |
| V6 | passed | X14: Explore requests held by the network, skeleton (`shots/X14-*`). X1 error: connection dropped on every try, "Couldn’t load Explore / No connection. Check your internet and try again." with Try again; after the network returns, Try again draws X1 (`X1-error-*`, `X1-after-retry-*`). Featured rail empty: `FeaturedCreator` rows removed, tiles shown, no rail, no error (`X1-no-featured-light.png`); rows put back after. Categories loading: creators held (`categories-loading-*`). Empty category: Gaming & Esports (`X13-*`) and Music & Audio ("Nobody is publishing in Music & Audio yet", `categories-empty-music-light.png`). Categories error: creators dropped, "Couldn’t load creators", Try again recovers (`categories-error-*`). Chip switch: Fashion & Beauty tapped from Photography, chip box (160.9, 64) before and after, list now zainab only, route `?category=fashion_beauty` (`X3-chip-switch-light.png`). Paging to a second page: V4. Follow refused by the Hub: chidi (`creator-basic`) blocked the viewer through `POST /settings/privacy/blocked` after X1 loaded; Follow sent `POST /creators/.../follow`, Hub answered 403, button back to Follow, no follow row written (`X1-follow-refused-light.png`); unblocked after. Signed-out visit to `/categories?category=photography` lands on `/welcome` (`signed-out-categories-light.png`). The viewer's own card has no Follow (signed in as `creator-basic`: 0 Follow on own card, 1 on zainab's). |
| V9 | passed | Signed in through the app's own Welcome, Sign in screen as `user@test.wawu.dev` against the real WAWU ID (no injected token, no wrapper). Values only the server has: the seeded follow state, zainab's tick and field. On X1, Following on zainab sent DELETE (API then read `zainab-pro:false`, row gone), Follow sent POST (API `zainab-pro:true`, new `FollowRelationship` row 0001 to 0003 at 15:51:19 in `vx01_hub_test`), and Categories (Fashion & Beauty) read Following after a reload. |
| Mutants | 11 of 12 killed | `mut/results.txt`: tiles 5 not 6, unknown route category unchecked, no rollback on refusal, Following tap follows again, empty page keeps paging, wire page never names the next, empty rail drawn, pro tick first, own card gets Follow, category not sent, chip not kept in the route: all killed. Survived: `fetchCategories` keeping a category with a blank id or label (the filter is untested; finding 9). |
| V10 | NOT RUN | No tester build with this branch. Unblocked when a development or tester build includes `wmt/EXPLORE-01`. |

**The stand-in WAWU ID question.** Not needed here: the real wawu-id ran. Its `POST /auth/login` and `/auth/refresh` answer `{ data: <token pair> }` (`src/auth/auth.controller.ts`: `return { data: await this.auth.login(dto) }`), which is what the app reads (`src/api/identity.ts` `readTokenPair`). The app is in line; the stand-in (`wawu-backend mock-wawu-id/server.js` `/auth/login`, `res.json(tokenPairFor(user))`) is out of line. Already filed as G-59 (lead follow-up); nothing new to file.

**Screenshots (design `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vx01/design/`, app `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vx01/shots/`, 390 wide at 2x):** X1-light/dark vs `X1-light/dark`; X15 (not built, no app shot); X2-light/dark vs `X2-light/dark`; X3-light/dark vs `X3-light/dark`; X13-light/dark vs `X13-light/dark` and `X13-deeplink-*`; X14-light/dark vs `X14-light/dark`. 320 by 568: `X1-320`, `X3-320`, `X13-320` (no sideways scroll: scrollWidth 320 = clientWidth on X1 and X3).

### Findings

1. **defect (low, VERIFIER.md check 2; CLAUDE.md and BUILDER.md "never fork").** `src/features/explore/CategoryChips.tsx` is a fork of `src/components/FilterChips.tsx`, which main has. Its `Chip` is FilterChips' `Chip` copied (Pressable with `accessibilityRole="radio"`, `accessibilityState`, `aria-checked`, `useFocusRing`, `textPrimary` on / transparent off, `borderStrong` hairline, `font(600)` label at `chipMetrics.font`, the same `ringRoom` scroller margins), plus an icon and an opening scroll; SHARED-CHANGES EXPLORE-01 #1 defers the swap. VERIFIER.md: "A copy, or a SHARED-CHANGES row deferring the swap, is a defect." The `forks` gate does not catch it: it only matches `class`, `enum`, `mixin`, `extension` and `interface` declarations (`scripts/gates/checks/forks.py` `DECL`), so a React function component or a `type` alias is never compared. The removal is recorded (row #1 says the file is deleted when the prop lands). Precedent: SETTINGS-02's local `BankRow` was classed the same way (defect, low) and accepted by the lead at merge. Fix: the `icon` prop on `FilterChips` (row #1, a lead-applied fenced change, as MONEY-03 had) and delete the copy; or the lead accepts it at merge. Reproduce: `diff` the two `Chip` functions.
2. **defect (low, same rule).** `src/features/explore/CreatorCard.tsx` redraws `MediaCard`'s stacked branch (picture frame on `surfaceSunken`, `expo-image` cover, the `--scrim-card` `LinearGradient`, the caption box at `captionInset`, title and subtitle at the stacked sizes) instead of using `MediaCard`, deferred by SHARED-CHANGES EXPLORE-01 #3. Same fix route (an `action` slot, and a title accessory for the tick, on `MediaCard`) or lead acceptance.
3. **defect (low).** A Follow on one card blocks Follow on every other card until its answer comes back: `useFollow().toggle` returns early on `mutation.isPending` for any creator. Reproduce: on Categories (Photography), hold `POST /creators/*/follow`, tap Follow on `@pg01` (turns Following, 1 request), then tap Follow on `@pg02`: no request is sent and it stays Follow (`two.py` in `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vx01/bin`). On a slow connection a user who follows two creators in a row loses the second tap with no sign. Fix: ignore a second tap only for the same creator.
4. differs-for-recorded-reason: the mark is `<BrandMark>` (R-37). Search bar, bell, FEATURED EVENT hero, Upcoming events and its See all, Featured creators' See all, the doors, X15, the Create button and X14's hero block are left out (R-41, R-27; each named with its task in SHARED-CHANGES EXPLORE-01 F1). Tile and chip order is the server's (G-180). The Inbox badge, names, fields and the plain portrait (no avatar seeded) are data.
5. unclear (owner may override; builder Defaults): X3 draws the chip row starting at All with Photography out of view ("chips stay in place"); the app scrolls the opening chip to the row's start when it would be out of view (X3 opens with Photography first, `shots/X3-light.png`), and X13 opened by link shows Sports & Fitness, Gaming & Esports. After that the chips stay in place (finding V6 chip switch).
6. unclear (builder Defaults): Following is the shared Button's glass look (white at 14% with a ring), the canvas draws white at 20% with no ring; Follow's label is 13.5 against the canvas's 13.
7. unclear (no state drawn): when the Hub refuses a Follow (403 "You cannot follow this account."), the button goes back to Follow with no words, so the tap looks ignored. The canvas draws no refusal; the owner may want the Hub's sentence shown.
8. note: the Categories nav (56 bar, 42 back button, 17 title) is drawn locally, as every other feature frame is (`AuthFrame`, `SettingsFrame`, `WorksFrame`); main has no shared nav bar to use, so not a check 2 defect.
9. note (test gap): mutant "`fetchCategories` keeps a category with a blank id or label" survived; no test feeds such a category.
10. note: the builder's file list matches `git diff --stat a167415...HEAD` (19 files), nothing missing or extra.

Environment note (no effect on the result): the first local start linked wawu-id `node_modules` from `/home/user/wawu-id`; its `prisma generate` rewrote four files of that checkout's generated client (`node_modules/.prisma/client`). They were regenerated from that checkout's own schema straight after (HEAD 4715d17, no `jti`), and the run used an unlinked copy of `.prisma` from then on.

**Status: building** (defects 1, 2 and 3 open). Servers stopped, databases `vx01_hub_test` and `vx01_id_test` dropped, worktrees and build outputs removed after the run.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
