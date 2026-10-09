---
id: PROS-01
title: Find a professional
owner: DEV3
area: PROS
order: 44
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: [PROS-02, PROS-03, UI-02, UI-03]
decisions: [R-37]
passes: [V1, V4, V5, V6, V9]
artboards: [P1, P2, P3, P4]
---
# PROS-01 · Find a professional

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV3.md` (what you own)
- The design: `python3 scripts/design/render_design.py P1 P2 P3 P4` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A6.json`
- `docs/designer/BRIEF.md` (the brief is part of the design, R-29; it has no entry for P1, P2, P3, P4, so those artboards stand, under its rules 3 to 8 on fees, refunds, licence lines and em-dashes)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

- **P1 · Professionals**: Directory: 'Vetted practitioners. Pay to send the first message.' Field chips (All, Accounting & Tax, Legal & Compliance, Design & Creative), rows with name, headline incl. years, field, price per message.
- **P2 · Profile**: Professional profile: name, headline, field, 'Ask a question · ₦5,000', 'Funmi replies within 24 hours, or you're refunded automatically.', About, What they take on (Tax filing, CAC annual returns, Bookkeeping, Payroll), Credentials 'Practising licence · Issued by ICAN · checked by WAWU'. Then Ask a question opens the paid DM (I3, Inbox flow).
- **P3 · Not taking messages**: Profile with button replaced: 'Not taking messages · Check back later, or find someone else in this field.'
- **P4 · Empty field**: Empty category: 'Nobody listed in Engineering yet · If you do this work, apply to be listed here.' Offer your services.

## Added by later tasks

These entries are drawn on this task's artboards but lead to screens built by later tasks, so this task does
not build them. Each is added, exactly as drawn, by the task that builds where it leads (docs/WORKFLOW.md
section 7, R-27). The verifier reports their checks as belonging to that task.

- P2: Ask a question · ₦price (opens I3): added by INBOX-10

## Capability checks

- [ ] **P1**: a user can filter by field; tap a professional (P2).
- [ ] **P2**: a user can read the profile, what they take on and their credentials.
- [ ] **P4**: a user can Offer your services (P5).
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states P3, P4.

## What the backend serves today (from the analysis)

- **P1**: partial. Missing: Board fields 'Accounting & Tax', 'Legal & Compliance', 'Design & Creative', 'Technology & IT', 'Engineering', 'Healthcare', 'Business & Consulting' do not match PROFESSIONAL_CATEGORIES slugs (finance, legal_services, entertainment_creative, technology, healthcare, business_entrepreneurship, professional_services …, 25 total); there is no 'engineering' slug. Years of experience is free text inside headline (no field).
- **P2**: served. Missing: Data served. The paid DM it opens is still a Flutterwave charge (direct-message.service.ts initCharge) and its refund is a Flutterwave refund; moving to the wallet is the Inbox flow's change (I3).
- **P3**: served.
- **P4**: partial. Missing: 'Engineering' is not in PROFESSIONAL_CATEGORIES, so this exact field cannot exist without adding a slug.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- P1: Funmi Adeyemi ₦5,000 a message
- P1: Tunde Bakare ₦7,500 a message
- P1: Ngozi Umeh ₦2,500 a message
- P1: Emeka Obi ₦3,000 a message
- P1: 'Pay to send the first message'
- P2: Ask a question · ₦5,000
- P2: Replies within 24 hours, or you're refunded automatically
- P2: Practising licence · Issued by ICAN · checked by WAWU

## Designer notes (⚠, unresolved)

- None.

## Builder report

Builder (resumed after a usage-limit crash; I reviewed the crashed builder's uncommitted work against this task, kept it and own it), 9 Oct 2026. Branch `wmt/PROS-01` from main (PROS-02 and PROS-03 merged), `origin/main` merged in; conflicts in the two Explore files taken from main (EVENTS-01's whole screen) with this task's door re-added; contract and types regenerated from the backend (`046444b`). No backend change.

- **Files:** `src/features/professionals/` (`api.ts`, `model.ts`, `parts.tsx`, `DirectoryScreen.tsx` P1 P4, `ProfileScreen.tsx` P2 P3, tests), routes `src/app/professionals/index.tsx` and `[id].tsx` (signed in only; system Back equals on-screen back). Explore: `ExploreScreen` takes `onFindProfessional` (optional, so existing specs still type; absent it stays `unbuilt('PROS-01')`) and `(tabs)/explore.tsx` passes `router.push('/professionals')`. The door was already drawn first by main, so only its target changed. No `_layout.tsx` edit, no fenced file.
- **Checks, how tested (jest, 39 specs in `professionals/__tests__`):** P1 filter by field (the Hub is asked for that field), `?field=` opens on it, tap opens P2, price from `messagePriceKobo` through the shared Money (none when not taking messages or no price), tick from the Hub, loading, offline, error with Try again, fields failing, failed refetch keeping the rows with an inline Try again, paging (page 2 once, never page 1 again, stops on the last page, no second ask while page 2 is on its way or after it failed, a failed page 2 keeps page 1 with Try again), rows once each when the offset page repeats a row; P4 empty field names the field and Offer your services opens P5 in that field (none on All); P2 about, what they take on, credentials (title from the kind, issuer, "checked by WAWU"); P3 closed state with nothing to press; gone/blocked listing; loading; error; failed refetch keeps the profile. Blocked people are left out by the Hub; nothing here re-filters. The test for the second ask while page 2 is on its way used a read that never answered and hung the runner; it now uses a read released at test end, and was split in two.
- **Mutants (scratch copy, restored):** dropping the repeated-row skip, and accepting a zero price, each fail the specs (2 failed).
- **Layout:** metrics are the values in `design/_gen/pros.js` (row 14 padding, 56 avatar, gap 13, 15.5/13/12 text, 14.5 price and 11.5 "a message", profile gap 18, 64 avatar, chips 30 high, credentials card 14 by 16); small text on `canvasNormalLineHeight`, the row rule is an inset shadow so the row adds no height. I did NOT take new pictures: V5 pair measurements (row pitch, gaps, line heights at 2x, light and dark) are NOT RUN this round, so I do not say the screens match.
- **Left to INBOX-10 (as the task says):** P2's "Ask a question · price" button and the reply promise under it. P1's second sentence "Pay to send the first message" is not drawn (it is listed as not a fact until the Hub says messages are paid; G-620).
- **`npm run check`:** exit 0 (jest 1778 of 1778, gates 0 fail, 14 warn). One first-run gate finding (literal `gap` keys) renamed to `partGap`.
- **Gaps:** G-620. **Shared changes:** none.
- **NOT RUN:** V5 pictures and measurements (above); V9 live seam against a running Hub and WAWU ID; V10 (a phone).


## Builder fix round

Fix round for the verifier's round 1 (D1, D2), 9 Oct 2026.

- **D1 fixed.** `onEndReached` in `DirectoryScreen.tsx` now decides from a ref (`asking`) set when `fetchNextPage()` goes out and cleared when it settles, as well as the query state, so a second end-reached in the same tick cannot ask again. The spec fires two `endReached` events inside one `act` (before any render) and expects one `page=2` ask; it is deterministic. Mutant: dropping the ref check fails that spec (1 failed). `npx jest src/features/professionals` run 3 times: 40 passed each time. `npm run check` run 3 times: exit 0 each time.
- **The `rows.length > 0` guard.** It cannot be killed by any spec: the page reader turns an empty page into `nextPage: null` (`api.ts`), so with no rows `hasNextPage` is already false, whatever the Hub's counts say. Removing the guard changes nothing anyone can observe, so it is removed from `onEndReached` (an unkillable mutant is dead code, not a gap). A spec now fires `endReached` on an empty list whose counts claim 40 and expects no `page=2` ask, which holds the behaviour either way.
- **D2 fixed.** P4's empty block now uses the design's body bottom padding (`directoryMetrics.emptyBottom` = 120, the `body` default in `design/_gen/kit.js`, applied when the list is empty; rows keep 40 plus the safe area), so the block centres in the same area as the design. Re-measure at 390 px in a browser: NOT RUN in this round (no browser session; the change is the padding value the design uses), for the verifier to measure.
- No backend change, no fenced file.

## Verifier report

Verifier round 1, 9 Oct 2026, on `wmt/PROS-01` with `origin/main` (99074e1) merged in as it will land (merge commit local to the branch, docs conflict only in generated PROGRESS, taken from main). Backend: `origin/main` 046444b built to `dist`, own database `wawu_hub_v_pros01`, the backend repo's mock-wawu-id (behind a thin proxy that wraps `/auth/*` in the `{data}` envelope the real WAWU ID answers with), the app on `expo start --web`, Chromium at 390 px, 2x, light and dark. Ports 4250 (Hub), 4251 (ID), 4252 (app). Seed: 26 listed professionals (22 in Accounting & Tax so P1 pages, one each in Legal, Design, Technology, none in Engineering).

| Pass | Result | Evidence |
|------|--------|----------|
| V1 diff | passed | `git diff --stat origin/main...HEAD`: 16 files, all in the builder's list (the screens, api, model, parts, routes, Explore wiring, tests, BACKEND_GAPS G-620, LOG, PROGRESS, contract/SOURCE_COMMIT, this task). No fenced file, no `_layout.tsx`. No local copy of a shared component (`ProsNav` is the per-feature bar every feature has; Button, FilterChips, Money, Avatar, EmptyState, ErrorState, Skeleton are the shared ones). |
| V1 `npm run check` | failed (D1) | typecheck 0 (after regenerating the untracked `.expo/types` for main's `/legal` route; not a branch defect), lint 0, jest 108 of 109 suites, 1850 of 1851 specs: `screens.test.tsx` "reaching the end again while page 2 is on its way does not ask again" fails in 2 of 3 runs on the unmodified branch (two `GET ...page=2`). Gates: 10 run, 445 files, 0 fail, 14 warn; baseline passes; task check fails only because PROGRESS is stale after the merge (regenerated with this commit). |
| V4 field trace | passed | Every value traced to a field of `GET /professionals/directory` and `/directory/{id}`: name, headline, field.label, avatarUrl (initials when none), `messagePriceKobo` (kobo, through Money) shown only when `dmEnabled`, pro tick from `verification.professional.verified`, about, services, `credentialKind` title, `issuingBody`. "checked by WAWU" is backed by the Hub listing only approved applications (status approved is the admin review). Live: Tunde Bakare's 7500 naira price, the 22-row list paging to 20 then 2, a field with no rows (Engineering) all came from the Hub. Tick NOT RUN live: after granting the professional tick in the mock the Hub still answered `verified: false` (its lookup cache or the mock's shape, not this task's code); covered by jest only. |
| V5 pictures | passed with D2 | `render_design.py P1 P2 P3 P4` beside the built screens at 390 px, 2x, both themes (`cmp-*.png` in the scratch folder). The design carries a 102 px (2x) status bar the web build does not, so offsets are taken from the header. P1: header to intro 51 and 51, intro to chips 86 and 84 (the intro in the design has the "Pay to send the first message" half sentence, left out by recorded decision G-620), chips to first row 150 and 151, row pitch 174 and 174, name/headline/field gaps 42 and 41 in both, hairline 468 and 468 after the offset, price column right edge 740 in both. P2: ABOUT label to text 51 and 51, line pitch 44, text to next label 71 and 71, chip row pitch 74, chips to Credentials card 66 and 66, card label 41, title 89, line 140 from the card top in both (card 217 against 183 only because a long issuer wraps). P3: the closed button 106 high at 297 against 399 less the offset, the note and everything under it equal. Dark: same positions, colours and tokens. The Ask a question button and its refund line are INBOX-10's, absent as the task says. Empty block of P4: D2. The P4 chip row opens scrolled so Engineering is in view (7 real fields against the design's 3); that follows the shared `revealSelected` and is not a defect. |
| V6 states | passed | Real causes in a browser: loading (delayed Hub answer, skeleton rows); Hub 500 on a never-loaded field (error screen with "Boom", Try again loads it); request aborted (`internetdisconnected`: "No connection. Check your internet and try again." with Try again, recovers); failed refetch of a field with rows on screen (cache older than the 30 s stale time, switch chip back, Hub 500 x3): the 20 rows stay, "Could not check for updates." with an inline Try again, which clears the line; P2 for an id the Hub does not list (404: "This listing isn't available", Back to professionals); P2 500 (error with Try again, recovers); P4 (Engineering, no one); P3 (Emeka Obi, not taking messages, no price on his P1 row). A paged P1 asked page 2 once. |
| V9 live seam | passed | Real login screen through `sign-in` (no injected token) against the Hub and the ID mock: the directory, names (from the ID lookup), prices, credentials and paging are the server's. The Explore door "Find a professional" opens P1, the on-screen back and the browser back both return to Explore, P4 "Offer your services" opens P5's route with `?field=engineering` (a person without a creator account reaches P10, as drawn). |
| V10 device | NOT RUN | no phone. |
| Mutants | 11 on the screens' logic, `src/features/professionals` jest | killed: tick always on, price without dmEnabled, no refetch note on P1, Offer your services dropping the field, no refetch note on P2, error screen beating data, zero price accepted, no issuer fallback, no in-flight guard on page 2, no error guard on page 2. Survived: `rows.length > 0` removed from `onEndReached` (harmless today: with no rows `hasNextPage` is false), test-gap note, killed by a spec that fires `endReached` while page 1 is still loading and expects no `page=2` ask. All files restored. |

Findings

- **D1, defect (V1, and a real race):** the "reaching the end again while page 2 is on its way" spec fails in 2 of 3 runs, so `npm run check` does not exit 0. It is not only the test: `onEndReached` decides from `isFetchingNextPage`, which is state and lags `fetchNextPage()` by a render, so a second `endReached` in the same tick asks for page 2 again (React Query then cancels and re-sends it: two identical GETs, seen in the spec). Fix with a ref set when the ask goes out and cleared when it settles, so the guard does not wait for a render; the spec then passes every run.
- **D2, defect (V5, minor):** P4's empty block sits lower than the design. The design's body keeps 120 of bottom padding (canvas default for its tab bar) and centres the block in what is left; the screen keeps 40 plus the safe area. Measured at 390 wide with no inset: icon top 130 px (2x, 65 points) lower than the design's relative to the header; on a phone with a 34 inset about 23 points. Make the empty state centre in the same area as the design (or record that the canvas padding is not the intent, in DECISIONS, so it is not a defect).
- Note, not a defect: P2 and P3 show "Issued by X · checked by WAWU" for a qualification as well as a licence; the Hub backs it (every listed profile was approved by a person).
- Note: `queryClient` has no `onlineManager` set; on web a browser that is offline leaves a first load on the skeleton (paused query) instead of the offline message. Not this task's (shared `src/api/query.ts`, every screen), so no row; a real network failure shows the offline state as above.

## Hub entries this task adds (R-41)

The EXPLORE-01 hub was built before this task, so the entries on it that lead to this task's screens are left out until now. This task adds each one exactly as the hub's artboard draws it, and the verifier checks it opens the right screen. The hub task's builder report names the entries.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
