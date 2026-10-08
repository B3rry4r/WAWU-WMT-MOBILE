---
id: PROS-03
title: Get listed as a professional
owner: YOU
area: PROS
order: 40
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: [PROS-02, UI-02]
decisions: []
passes: [V1, V4, V5, V6, V7, V9, V10]
artboards: [P5, P6, P7, P8, P9, P10]
---
# PROS-03 · Get listed as a professional

Taken over by the lead's agents on 8 Oct 2026 (owner: carry on with the tasks of developers who are delaying; Developer 3 had not pushed since about 02:00 UTC). The branch's rounds and rulings carry on as they stand.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV3.md` (what you own)
- The design: `python3 scripts/design/render_design.py P5 P6 P7 P8 P9 P10` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A6.json`
- `docs/designer/BRIEF.md` (the brief is part of the design, R-29; it has no entry for P5, P6, P7, P8, P9, P10, so those artboards stand, under its rules 3 to 8 on fees, refunds, licence lines and em-dashes)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

Inbox settings (P8) is added by INBOX-12 and Become a creator (P10) by AUTH-06 (docs/WORKFLOW.md section 7).

V10 runs on a real Android phone only (DECISIONS R-24).

Native modules: `expo-document-picker` (P6 licence upload). They are in `SHARED-CHANGES.md` row 8 (one batch for Developers 2 and 3, one new development build); if row 8 is not applied when this task starts, say so in the report and build everything else.

## Artboards

- **P5 · Offer your services**: Application step 1: 'People find you here and pay to send the first message.' Which fields? (Accounting & Tax, Add), one-line headline, about, what you take on (chips).
- **P6 · Credentials**: Step 2 for a regulated field: 'This field is regulated · We check your licence with the body that issued it.' Kind (Practising licence / Qualification / Work samples), Licence number ICAN/2016/40921, Who issued it ICAN, uploaded ican-licence.pdf, Send for review.
- **P7 · Under review**: 'Under review · Accounting & Tax · A person checks it. You'll see the outcome in your listings.' My listings / Done.
- **P8 · Your listings**: Listings per field: Listed (Hide), Under review, Turned down with reason 'This field needs a practising licence.' + Apply again; Apply in another field; note 'People reach you through paid messages · Set your price and reply time in Inbox settings (I21).'
- **P9 · Hidden**: Listing hidden: 'Hidden. Nobody can find you' with Show.
- **P10 · Needs a creator account**: Gate: 'This needs a creator account · Setting one up is free.' Become a creator.

## Added by later tasks

These entries are drawn on this task's artboards but lead to screens built by later tasks, so this task does
not build them. Each is added, exactly as drawn, by the task that builds where it leads (docs/WORKFLOW.md
section 7, R-27). The verifier reports their checks as belonging to that task.

- P8: Inbox settings (opens I21): added by INBOX-12
- P10: Become a creator (opens A11): added by AUTH-06

## Capability checks

- [ ] **P5**: a user can pick one or more fields; enter headline/about/services; Continue (P6).
- [ ] **P6**: a user can pick credential kind; enter licence number + issuer; upload document; Send for review (P7).
- [ ] **P7**: a user can My listings (P8); Done.
- [ ] **P8**: a user can Hide a listing (P9); Apply again; Apply in another field.
- [ ] **P9**: a user can Show.
- [ ] **P10**: a user without a creator account sees the gate.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states P9, P10.

## What the backend serves today (from the analysis)

- **P5**: partial. Missing: Board lets the user Add several fields in one pass; backend takes one category per application (unique wawuUserId+category), so the client must post once per field. Board fields 'Accounting & Tax', 'Legal & Compliance', 'Design & Creative', 'Technology & IT', 'Engineering', 'Healthcare', 'Business & Consulting' do not match PROFESSIONAL_CATEGORIES slugs (finance, legal_services, entertainment_creative, technology, healthcare, business_entrepreneurship, professional_services …, 25 total); there is no 'engineering' slug.
- **P6**: served.
- **P7**: served.
- **P8**: served.
- **P9**: served.
- **P10**: served.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- P5: 'pay to send the first message'
- P6: 'We check your licence with the body that issued it' (verification claim)
- P6: Licence number ICAN/2016/40921, issuer ICAN
- P10: Creator account setup is free

## Designer notes (⚠, unresolved)

- None.

## Builder report

Builder (resumed after a usage-limit crash), 7 Oct 2026. Mobile branch `wmt/PROS-03` from main with PROS-02 merged in (backend #47, mobile #3); backend unchanged, so no backend branch. Contract regenerated from backend main (`npm run api`).

- **Files:** `src/features/pro-listing/` (`api.ts`, `model.ts`, `ApplyScreen.tsx` P5 P6 P7 P10, `ListingsScreen.tsx` P8 P9 P10, `ProFrame.tsx`, `parts.tsx`, `pickDocument.ts` and `.web.ts`, `upload.ts`, `useRefreshOnFocus.ts`, tests), routes `src/app/professional-apply.tsx` and `professional-listings.tsx`. No `_layout.tsx` edit.
- **Backend:** none needed. PROS-02 serves the fields (with `regulated`), the application, `mine` and the listing switch; the licence file goes through `POST /uploads/presign` with `professional/document`. Apply is one field per call, so the client files one per chosen field (G-324).
- **Checks, how tested:** P5 pick fields, headline, about, services, Continue (boundaries 7/8, 39/40, 120/121, 2000/2001); P6 kind, number, issuer, upload, Send for review; P7 My listings and Done; P8 Hide, Apply again, Apply in another field; P9 Show; P10 gate. Jest `pro-listing/__tests__` (46 tests): per-field posts, partial failure with a field in the middle (third not tried, retry files the rest), double tap, upload and its failure, Send waits for an upload, prefill on Apply again, taken fields not offered, loading, empty, error and Try again on both screens, non-creator sees only the gate. Mutants tried and killed: no break after a failed field, status order, taken-field rule, headline boundary.
- **Pictures (V5):** `render_design.py P5 P6 P7 P8 P9 P10` beside my own 390 px light and dark screenshots from `npm run web` against a local Hub, in `/tmp/claude-0/.../scratchpad/pros03/` (`pair-P*.png`, design then mine, light then dark). I do not say they match. Known differences: no status bar and home indicator on web; the Licence number is not drawn in the kit's letter-spaced mono (the shared TextField takes no style); the Add chip after "What do you take on?" is mine (G-322); P10 and P8 carry no "Become a creator" and no Inbox settings link (added by AUTH-06 and INBOX-12, G-323).
- **V9 live seam:** web build, sign in through the app's real sign-in against the local Hub (WAWU ID is the repo's mock, `mock-wawu-id`, wrapped in `{ data }` as the real one answers; no real WAWU ID here), applied in Accounting & Tax through P5 and P6, the application read back through `GET /applications/mine`, approved in the database, shown Listed on P8, Hide then Show saved (`listed` read back in the database). A `creator` and a `user` account both walked (P10).
- **Probes on the one write route the screens call (not new):** NUL in a text field answers 500 (protected route, left; the app strips NUL, G-325); lone surrogate 201; `[]`, `"x"`, `{}`, wrong types 400; bad id on the listing switch 400.
- **Gaps and shared changes:** BACKEND_GAPS G-320 to G-325; SHARED-CHANGES `PROS-03 #1` (shared Banner with an icon and info tone) and `#2` (screen frame with a foot); row 8 (`expo-document-picker`) is still open.
- **NOT RUN:** the licence upload on a phone (G-321: `expo-document-picker` not installed, row 8 open; the upload row is not drawn on a phone); the upload end to end through real storage (the local Hub has no storage keys and answers 503 on `presign`; for the P6 picture only, the browser intercepted `presign` and the PUT, and the file's address went into the application); V10 (real Android phone); V9 through the real WAWU ID.
- **Defaults (agent), owner may override:** one application per chosen field with the same credentials (G-324); a field with an application under review or listed is not offered again; the claims in P5, P6 and P10 kept as drawn and filed (G-320); P6 is shown for any field (the regulated note only for a regulated one, licence number and issuer optional elsewhere, a regulated field takes only a practising licence); rows on P8 are ordered listed, under review, turned down.
- **Counts:** before (crashed builder, before merging newer main) 46 suites / 797 tests, gates 216 files 0 findings. After (main merged, `npm run check` exit 0): 68 suites / 1229 tests, gates 323 files 0 findings.

## Builder report, round 2

Builder (fix round 1, resumed after a usage-limit crash; I reviewed the crashed builder's uncommitted work and own it), 8 Oct 2026. Branch `wmt/PROS-03`, `origin/main` merged in (45 commits; conflicts in `src/app/(tabs)/me.tsx` and `BACKEND_GAPS.md` kept both sides, `docs/PROGRESS.md` regenerated). The crashed builder's run had reformatted all of `ApplyScreen.tsx` with Prettier's defaults (double quotes, wrapped lines); I restored the file and reapplied only its three real changes.

- **D1 (fixed, touches ME-01's files).** M2's listing row now opens P8 with the 18 ChevronRight in the muted colour that M2 draws (`design/_gen/me.js` line 24): `src/features/me/ServicesTab.tsx` (the row is a `Pressable` with `accessibilityRole="button"`; the paid messages row stays without a chevron or press until INBOX-12), `src/features/me/MeScreen.tsx` (one optional prop, `onOpenListings`, passed through), `src/app/(tabs)/me.tsx` (`router.push('/professional-listings')`, as the file's other entries do; no shared navigation helper exists on main). `(tabs)/me.tsx` is a route file, not a `_layout.tsx`, so it is not fenced (WORKFLOW section 4). Spec `src/features/me/__tests__/listingsEntry.test.tsx`: a user can tap the listing row on Services (pressed once; the paid messages row is not pressable) and the Me tab pushes `/professional-listings`. Picture: M2 beside the built Services tab, then the screen after a real click in the browser, which landed on `/professional-listings` showing P8, light and dark (`scratchpad/pros03f/pair-M2-light.png`, `shots/M2-*.png`, `shots/M2-tapped-*.png`). Other ways in: EXPLORE-01 is now merged but left out the whole doors card (X1, X15), so "List your services" has no card to go in; unblocked by the lead naming who draws the doors card first (PROS-01, SCHOOLS-03, or PROS-03 with its one door). The Create menu's "Service" row is on M19 (ME-04, `todo`); unblocked by ME-04 building M19. Both recorded in G-323.
- **D2 (fixed, own styles only; no theme or shared component edited).** P8: the card name, headline and rule text, and the "Apply in another field" label sit on `line-height: normal` (`canvasNormalLineHeight`); the card has the drawn 14 vertical padding; the rule line and the outline are inset shadows, as the canvas draws them, so they add no height. P5: the chip group labels sit on `line-height: normal` with a 10 gap; the about box ring is an inset shadow, so the box is 80 high, not 82. P6: "What are you showing us?" on `line-height: normal`. P7: the paragraph is held to 290 wide, because the canvas sets `text-wrap: pretty` (kit.js line 33) and breaks before "your". **Re-measured** at 390 px, 2x, light and dark, with a dev web build whose API calls the browser answered from fixtures (no Hub needed for layout), against `render_design.py P5 P6 P7 P8 M2`: P8 cards 224, 116, 360 px (2x) and the outline 76 px, the same as the design to the pixel; P5 label-to-chips gaps the same; P7 line breaks the same ("in / your listings"). What still differs: each `TextField` (shared) sits about 1 px low at 1x on P5 and 2 px on P6, so P6's file card is 4 px low. The cause is the shared label's line height; filed as SHARED-CHANGES `PROS-03 #3`. P6's regulated note breaks "that / issued it." in the design and "issued / it." in the build (the same `text-wrap: pretty`); its height is the same. P8's note is shorter because "(I21)" is not shown (recorded reason). I do not say the screens match.
- **U2 (closed with a spec and a fix).** The contract allows `accountType: null`, and `fetchIsCreator` used to throw "unreadable" on it, so a person with no account type saw an error. Now null is "not a creator" (P10), and only a non-text value is unreadable. New `src/features/pro-listing/__tests__/creatorGate.test.ts` (4 specs: creator, user, null, a number). Mutant `accountType !== 'user'` in a copy: the null spec fails (1 failed, 3 passed); the file is back as it was, byte for byte.
- **U1 (recorded, no change).** Main has no shared equivalent of `Note` or `ProFrame` in `src/components` (main added `Toast` and changed `Button`, `FilterChips` and `MediaCard` only), so the local copies stay and SHARED-CHANGES `PROS-03 #1`, `#2` stand. U3 is left for the owner.
- **Counts:** `npm run check` exit 0 on the merged branch: jest 80 suites / 1429 tests, gates 9 run / 362 files / 0 findings, tasks 212 / 279 artboards. Existing tests, gates and baseline untouched; cases added only. The first run had one gate finding (a literal `gap: 10` key in `parts.tsx`); renamed to `labelToChips`, a design-cited metric like the file's others.
- **NOT RUN:** the live stack this round (Hub plus WAWU ID); the layout pictures use fixture answers in the browser, and no route or data path changed except the null account type. V10 (a phone).

## Builder report, round 3

Builder (round 3), 8 Oct 2026. Branch `wmt/PROS-03`, `origin/main` merged in (merge, generated files regenerated). Rulings built as written, with these notes.

- **D3.** `src/features/explore/DoorsCard.tsx` (list of doors; one row, "List your services" / "Get paid to answer questions", the canvas's 13 by 14 row, 40 tile, 17 chevron) drawn by `ExploreScreen` after Featured creators when its route gives `onListServices`. EVENTS-01 is not on main (`tasks/EVENTS-01.md` is `todo`), so the card follows Featured creators; whichever merges second moves it after Upcoming events. The door goes through `src/features/pro-listing/door.ts`: P8 for a creator with any application (listed, pending, turned down, hidden), else P5; a `user` and a failed call go to P5 (which shows P10 or asks again). Specs in `src/features/explore/__tests__/screens.test.tsx` (the card has only that door; the three destinations). G-323 updated. Pictures at 390 px: NOT RUN (not taken in this round; the card's metrics are the canvas's `door` line 19 values, but no picture pair was made, so I do not say it matches).
- **D4.** `ApplyScreen`: full-screen error only when a query never had data; with data held, a failed refetch shows "Could not check for updates" with Try again and keeps the form, chips, typed text and the per-field send result. Specs: connection drops after field one is sent; 503 on refetch on P5 and on P6.
- **D5.** `refreshListings` (`pro-listing/api.ts`) invalidates `proKeys.mine` and M2's `listingsKey` in one place; Hide and Show call it (`mine` marked stale without an immediate refetch because the screen already holds the saved row; a successful apply refetches both). Spec: after Hide, `listingsKey` is invalidated.
- **D6.** `useSystemBack`: Android back via `BackHandler`, browser back via one history entry on P6 and a `popstate` listener; P6 goes to P5 with text kept. **Deviation to check:** P7 has no on-screen back and going to P6 after filing would offer a resend with no fields chosen, so system Back on P7 leaves the flow as Done does. The web `popstate` path is NOT RUN in a browser; the native path is specced with a captured `BackHandler` handler.
- **D7.** A 409 field is taken out of the chosen fields, named once ("X was left out: you already have an application in this field."), and the rest are sent in the same tap; any other refusal stops the loop and stays chosen. Spec: three fields, middle one 409, one tap files the other two. The earlier round's three-field spec used a 409 for its "stays chosen" case; I changed that one case to a 503 and its sentence (the behaviour it pinned is the one D7 reverses).
- **D8.** `latestPerField(rows, fields)`, `isTaken` and `rejectedIn` use the Hub's `categories`, not a local table; a row in a category no field files in keeps its card and reason and shows "Apply in another field" (opens P5 with no field) in place of Apply again. Specs for both.
- **D9.** `ServicesTab`: the paid messages row is ME-01's plain accessible group again; the listing row is a `Pressable` card with `useFocusRing`, the pressed `surfaceSunken` look of `ProfileHeader`'s chips, and the chevron. Diff against main: only the entry's lines. `listingsEntry.test.tsx`'s old assertion that the paid row is a disabled button now asserts it is a plain group.
- **D10.** `LongField` added to SHARED-CHANGES ME-11 #2.
- **U3.** Send does nothing while any file shows "Did not upload", and the screen says "Send is waiting: retry the file that did not upload, or remove it." Spec.
- **T1 to T3.** `src/features/me/__tests__/listingsEntryReal.test.tsx` (the real `(tabs)/me` route and the real `MeScreen`: tap opens P8; chevron present, paid row has none); `src/features/pro-listing/__tests__/routes.test.tsx` (the listings route pushes `{ pathname: '/professional-apply', params: { field } }`). **Mutants** applied one at a time and restored with `git restore`: dropping `onOpenListings` from `me.tsx` fails T1 and T2 (2 failed); removing the `ChevronRight` fails T2 (1 failed, 1 passed); dropping `params: { field }` in the listings route fails T3 (1 failed).
- Outside this task (lead files): admin unlist vs Hide sharing `listed`; presign reserving quota.

## Verifier report

Verifier session (not the builder), 7 Oct 2026. Branch `wmt/PROS-03` at `530ff54`, merged with `origin/main` (already up to date, no merge needed), checked in a fresh worktree. Evidence (screenshots, scripts, side by side pairs) is in the verifier's scratch directory and is not committed.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 | passed | `npm run check` exit 0 on the merged branch: jest 68 suites / 1229 tests (the builder's counts hold), gates 9 run / 323 files scanned / 0 findings, baseline 0, tasks 211 / 279 artboards. `npm run api` against backend `origin/main` (`3041887`) gives no diff. The diff against main is exactly the builder's list (`src/features/pro-listing/**`, two route files, BACKEND_GAPS, SHARED-CHANGES rows, task, LOG, PROGRESS); no fenced file, no `_layout.tsx`, no `package.json`. No em-dash, no "Flutterwave", no literal colour in the feature. |
| V4 | passed | Writers and readers traced live: category (the field's `applyCategory`), headline, services, about, credentialKind, licenceNumber, issuingBody, documents go through `POST /professionals/applications` to `ProfessionalProfile`; readers are `GET /applications/mine` (P8), the admin review view (licence, issuer, documents, about) and the directory (headline, services, field, category, city). `listed` is written by the listing switch and read by the directory (hidden, then absent from `GET /professionals/directory`; shown, then present). `about` has no reader on the directory detail (admin only); the task does not ask for one. City written through `PUT /professionals/location` and read by the directory ("Lagos"); no screen of this task writes it. Every value on P5 to P10 is the user's or the Hub's; the three sentences of the "Figures are not facts" list are kept as drawn and filed (G-320). |
| V5 | passed with finding D2 | Pairs (design left, built right) at 390 px, 2x, light and dark, for P5, P6, P7, P8, P9, P10. Structure, copy, icons, tones, weights and order match. Differences below. |
| V6 | passed | Every state through its real cause: loading (delayed `mine`); error (500 on `mine`, then Try again recovers; aborted `fields` gives "No connection..."); empty (a creator with no applications, and "Offer your services" opens P5); P10 (a `user` account on both routes); P9 (Hide through the UI, the `listed` column reads false, the screen reads "Hidden. Nobody can find you" after a reload); a failed submit (aborted POST: "This was not sent. Design & Creative could not be sent. No connection..."); a rejected application (reason and Apply again); a pending one (not offered again in P5's Add sheet); regulated against not regulated (the note and the licence rules only for a regulated field; Work samples hides number and issuer; a regulated field refuses Work samples); Engineering (the Hub marks it not regulated: no note). |
| V7 | passed | Walked as a creator with no applications, a creator with listed, pending, rejected and hidden rows, and a plain `user`; from a cold load (session restored from storage) and from resume (a reload on P8 keeps Hidden). Apply again opens P5 prefilled from the rejected row and P6 prefilled with number and issuer, and the Hub accepts it (the row goes from rejected to pending, reason cleared). Caveat: no screen of the app opens these routes yet (D1). |
| V9 | passed | Real stack: Hub from a worktree of backend `origin/main` (`3041887`, PROS-02 in it) on :4205 with its own database `wawu_hub_test_pros_03_v`, and the REAL WAWU ID (`origin/main` `4715d17`, not the mock) on :4206 with `wawu_hub_test_id_pros_03_v`, started by `scripts/local/up.sh`. Signed in through the app's real sign-in screen as `creator-basic`, `creator-pro` and `user` (no injected token). Applied in Accounting & Tax through P5 and P6 (row read back in Postgres with number, issuer, services and the document address); applied in three fields at once (three rows, one POST per field; a double click filed no duplicate; five rapid taps filed one); approved by SQL, and the listing showed in the directory with its field and city. Hide then Show: one PATCH for a double click. My mutants (in the worktree, restored after): headline `<` to `<=` killed (2 specs); licence number not required when regulated killed (2); `isTaken` ignoring approved killed (3); apply only the first field killed (2); Hide sending the same state killed (1); NUL strip removed killed (1); gate `accountType === 'creator'` to `!== 'user'` SURVIVED (U2). Odd inputs: NUL pasted into headline, about, a service, number and issuer reaches the Hub as clean text (201); a lone surrogate is accepted (201, stored as U+FFFD); an about of 2,500 characters and a 61-character service are refused in the app in its own words; 100,000 characters straight at the Hub answers 400. The builder's claim holds: `POST /professionals/applications` answers 500 to a NUL (curl) and the app never sends one. |
| V10 | NOT RUN | Needs a real Android phone and a development build with row 8's modules (R-24). |

**What the task allows.** The task's own sentence (Native modules) says: if row 8 is not applied when the task starts, say so in the report and build everything else. Row 8 is open on main and the builder said so (G-321: no upload row on a phone, no dead button). So the missing licence upload on a phone is not a defect; the web build uploads. P6's "Uploaded ican-licence.pdf" state is reachable only on web until row 8 is applied. The upload end to end through real storage is NOT RUN (the local Hub has no storage keys; presign answers 503); for the P6 picture I intercepted presign and the PUT in the browser, as the builder did, and the Hub stored the file's address.

**Judgement on G-325 (NUL answers 500).** Not a defect of this task. The route is on the protected list (the web calls it), so its answers are not changed here, and the app strips NUL before sending, which I confirmed against the real Hub. A 400 for NUL is an additive fix for a backend task; the owner may want it filed.

### Findings

- **D1 · defect (R-41 entry owed on a merged hub).** ME-01 is merged (`done`). Its Services tab (M2) leaves the listing row's tap out until PROS-03 adds it (`src/features/me/ServicesTab.tsx` comment: "the way into I21 and into the listings (P8) is added by INBOX-12 and PROS-03 (R-41)"; ME-01's builder report: "M2 the way into a professional listing (its chevron and tap, P8): PROS-03"). This task's own section "Hub entries this task adds (R-41)" says the task adds each one exactly as drawn. Nothing was added, and G-323 does not name it (it names Explore's "List your services" door, the Create menu row, Inbox settings and Become a creator). Today `/professional-listings` and `/professional-apply` cannot be reached from any screen. Fix: M2's listing row opens P8, with the chevron as drawn (this touches `src/features/me/`, ME-01's, so say so in the report). The Explore door (EXPLORE-01, `todo`) and the Create menu (HOME-01, `todo`) are unmerged hubs: a recorded blocker is fine there, and G-323 records them.
- **D2 · defect (vertical metrics drift from the artboards).** Measured on the 2x pairs, allowing for the 100 px status bar offset: P8 listing cards are taller than the design by 14 px (7 px at 1x) for a card with no rule row (Business & Consulting 127 against 113) and by 14 to 18 px (7 to 9 px at 1x) for cards with a rule row or reason (Accounting & Tax 239 against 221, Legal 371 against 357); the "Apply in another field" outline is 91 against 74 px (8 px at 1x taller). On P5 the label to chips gap is 7 px larger (3.5 px at 1x) in each chip group, and the drift adds up to 26 px (13 px at 1x) by the last chips; on P6 the fields drift 4 to 11 px (2 to 5 px at 1x) by the file card. The text lines of the card name, headline, outline label and chip group labels most likely use the theme's line height where the canvas uses `line-height: normal` (`canvasNormalLineHeight`, which this task applies to P7's title only); that is my reading, not checked in the code. P7's paragraph wraps "in / your listings" in the design (about 270 px wide) and "in your / listings" in the build (about 302 px wide). Light and dark are the same. Everything else measured (P7 icon, title, field name, the foot, P6's note, P8's note and Apply again) matches within 1 px.
- **U1 · unclear (local `Note` and `ProFrame`).** `parts.tsx` `Note` and `ProFrame.tsx` are local stand-ins, and SHARED-CHANGES `PROS-03 #1` and `#2` defer the swap, which my role file calls a defect. But main has no shared Banner or screen-with-foot to use: the only banner is `features/auth/Banner.tsx` (two tones, one icon, local to auth) and every frame in the app is local (`EditFrame`, `SettingsFrame`, `AuthFrame`). I count it as the same stand-in every other feature has, not a copy of something main shares; the lead should say whether `Note` should have been the auth Banner extended in place.
- **U2 · unclear, low (test gap).** The mutant `accountType !== 'user'` survives: no spec gives `accountType: null` (the contract allows it), so a null account type passing the creator gate is untested. The code as written (`=== 'creator'`) is right.
- **U3 · unclear, low.** A file that failed to upload stays on the row ("Did not upload. Try again", in red) and Send still goes without it. The Hub does not require a file and a spec pins that the failed file is never sent; whether Send should wait for a retry is a product choice.
- **differs-for-recorded-reason.** No status bar or home indicator (web build, builder's note). The Licence number is not in the kit's letter-spaced mono (shared `TextField` takes no style; builder's note). The extra Add chip after "What do you take on?" and the two small sheets (G-322, default agent). P8 and P10 have no "Inbox settings" link and no "Become a creator" (the task's "Added by later tasks": INBOX-12 and AUTH-06; their checks belong to those tasks). "(I21)" is not shown in P8's note (an artboard id, not user copy). The three claims in P5, P6 and P10 are kept as drawn and filed (G-320); `dmEnabled` false would make the P5 sentence untrue for a person with messages off, which G-320 states. A non-regulated field's application is sent with kind `licence` and no number when the person leaves the default; the Hub accepts it.
- **Not found wrong.** One application per field with a partial failure (specs plus live: the failed field is named, the earlier ones stay sent), double tap and rapid taps, taken fields not offered, P10 on both routes, loading, empty and error with real causes, Hide and Show, Apply again prefill, no `_layout.tsx` edit. Shared Button, ListRow, FilterChips, BottomSheet, StateViews, TextField, StatusPill, Card and IconTile are used (no local copies of them).

**Status:** back to `building` for D1 and D2.

## Hub entries this task adds (R-41)

The ME-01 and EXPLORE-01 hubs were built before this task, so the entries on them that lead to this task's screens are left out until now. This task adds each one exactly as the hub's artboard draws it, and the verifier checks it opens the right screen. The hub task's builder report names the entries.

## Verifier report, independent (lead)

Independent verifier (lead's session; wrote none of this task's code, and is not the session that wrote the "Verifier report" above), 8 Oct 2026. Checked mobile `wmt/PROS-03` at `864f92b` (main `9654080` already merged in: `git merge-base HEAD origin/main` is `9654080`, which is the newest main, so the trial merge is this same tree) in a fresh detached worktree, against backend main `3041887` and wawu-id main `fb8717e`. Evidence (not committed): `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vp03/` (`shots/`, `pairs/` design left and build right, `logs/`, the walk scripts `walk*.py`, `mutate.py`, `logs/mutants/results.json`).

**Backend.** This task has no backend branch: `git ls-remote` finds no `wmt/PROS-03` on WAWU-Backend or wawu-id. PROS-02's head `8c0c57b` is an ancestor of backend main `3041887`.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed | `npm run check` on `864f92b`: run 1 exit 1 with two timeouts in other tasks' tests under load (A26 `OpenWalletScreen` first test, Z3 `settingsScreens` first test, 20 s limit, load average 13 while the design renderer ran); those two files alone 128 of 128; run 2 exit 0: tsc 0, lint 0, jest 80 suites / 1429 tests, gates 9 run / 362 files scanned / 0 findings, baseline 0, tasks 212 / 279 artboards (`logs/check-864f92b*.log`). `npm run api -- --backend` (backend main `3041887`): no diff. Scope fence: 24 files, `src/features/pro-listing/**`, the two route files, `src/app/(tabs)/me.tsx`, `src/features/me/{MeScreen,ServicesTab}.tsx` and `listingsEntry.test.tsx`, BACKEND_GAPS, SHARED-CHANGES, LOG, PROGRESS, the task; no `_layout.tsx`, `src/components`, theme, API client or `package.json`. Added lines: no em-dash, no dollar, no "Flutterwave", no hex, rgb or named colour. The renamed `labelToChips: 10` (`parts.tsx`) is the design's own metric, `col(label('Which fields?') + chips, 10)` at design/_gen/pros.js line 32, kept in a named metrics object as ME-01's `serviceMetrics.between: 10` is, and the label-to-chips gap measures equal to P5 at 2x: not a gate dodge. |
| V4 Field trace | failed (D5) | Written by P5 and P6 through the app, one POST per field: category, headline, about, services, credentialKind, licenceNumber, issuingBody, documents, read back in Postgres. Readers: P8 (`applications/mine`); M2 (headline as the row title, approved and listed only); the admin queue and detail (about, number, issuer, documents) and `POST /admin/professionals/:id/document-url`, whose address returned the very file uploaded (592 bytes, `%PDF`); the directory (headline, services, field, price 10000 kobo). Status and reason: written by the admin approve and reject routes, read by P8, by P5's Add sheet (a pending or listed field is not offered) and by Apply again. `listed`: written by Hide and Show (one PATCH each), read by the directory (gone after Hide, back after Show) and by P8 and P9 after a reload, but NOT by M2 (D5). |
| V5 Picture | passed, with recorded differences | 390 px at 2x, light and dark, `pairs/pair-P5*.png` to `pair-P10*.png`, `pair-M2*.png`; 320 x 568 `shots/I*-320*.png` (no page-wide horizontal scroll on P5, P6, P8, P10; P5 scrolls to its last chip above the foot). Measured on the 2x pairs (design minus its 100 px status bar): P8 card with a rule row 204 = 204, card without one 96 = 96, turned-down card 340 = 340, the outline 68 = 68; P9 the same; P5 chips and labels equal, each `TextField` 2 px low at 2x (SHARED-CHANGES PROS-03 #3); P6 banner and kind chips equal, licence box 4 and issuer box and file card 8 low at 2x (the same row); P7 circle, title, field line, paragraph ("in / your listings") and foot equal; M2's listing row carries the 18 muted ChevronRight at the drawn place, and its three-line card is 150 high as the drawn three-line card is. D2 is closed. Classification below. |
| V6 States | failed (D4) | Each by its cause, through the app: loading (the Hub's answer held 4 s: skeleton); error (500 on `mine`, three tries: "This could not be loaded", Try again recovers; `fields` dropped: "No connection", Try again recovers); empty (creator-basic before applying, "Offer your services" opens P5); P10 (a `user`, and a real WAWU ID account with no Hub profile, `accountType` null); P9 (Hide through the UI); a Hide whose connection drops (the row keeps "Showing in the directory" and says why; the column stays true); partial failure by a 409 (D7) and by a dropped connection (D4); a refused upload (U3). |
| V7 Flow walk | failed (D3, D4, D6) | Walked as creator-basic (creator, KYC pending, no applications), creator-pro (listed, pending, turned down and hidden rows), a plain `user` and a null account type, from a cold load (session restored from storage) and from resume (reload on P8 keeps Hidden). A creator with no live listing has no way into P5 or P8 from any screen (D3). Apply again: P5 prefilled (field, headline, about, services) and P6 prefilled (kind, number, issuer); sent, the Hub's row went from rejected to pending with the reason cleared. |
| V9 Live seam | passed | Hub built from backend main `3041887` (`npm ci` in its own worktree, `scripts/local/up.sh`, :5481, database `vp03_hub_test`); the REAL wawu-id `fb8717e` (`npm ci`, :5482, `vp03_id_test`); object storage was a local S3-compatible stand-in on :5484 (STORAGE_ENDPOINT, path style), so the Hub's own S3 client signed the upload; web export (`npx expo export --clear`, private TMPDIR, EXPO_PUBLIC_API_URL and EXPO_PUBLIC_ID_URL local) on :5483; Chromium aborting every request that is not local (none was). Signed in through the app's own sign-in screen as each account (no injected token). Applied through P5 and P6 with a licence file, saw the row Under review on P8; a seeded superadmin signed in through `POST /admin/auth/login`, approved one application and turned one down through `/admin/professionals/:id/approve` and `/reject`; P8 showed Listed and Turned down with the reason; Hide through the UI read `listed = f` in the database, Show `t`. |
| R-41 entries | failed (D3) | D1 is closed: M2's listing row opens P8 with the drawn chevron (a real click in the web build, light and dark, `shots/B3-*`, `B4-*`, `E1-*`); the paid messages row has no chevron and no press (INBOX-12). ME-01's files, line by line: `MeScreen.tsx` gains one optional prop and passes it through, `(tabs)/me.tsx` one push, `ServicesTab.tsx` the row and its chevron, plus one change beyond the entry (D9). The Explore door "List your services" (X1, X15, opening P5), named for this task by its own section above and by SHARED-CHANGES EXPLORE-01 F1, is not built (D3). |
| Mutants | 17 run, 14 killed, 3 survived | `mutate.py`, `logs/mutants/results.json`; each file restored byte for byte, `git diff --quiet` after. Killed: gate `accountType !== 'user'` (the U2 mutant: the null spec fails), P8 never shows P10, the Me tab pushes P5, the listing row not pressable, the paid row opens P8 too, keep going after a failed field, sent fields stay chosen, the message drops which were sent, Hide always sends false, the answer not put on screen, a hidden row read as listed, no Apply again prefill, the licence number not prefilled, Apply again opens with no field. Survived: T1 to T3 below. |
| V10 Device | NOT RUN | Needs the owner's Android phone and a development build with SHARED-CHANGES row 8 applied (R-24). |

### Defects (open)

- **D3 · defect, high (R-41, V7): no way into P5, and none back to a hidden listing.** The task's own section "Hub entries this task adds (R-41)" and SHARED-CHANGES EXPLORE-01 F1 give this task Explore's "List your services" door (X1, X15; the canvas's own entry for P5 is "Explore (X15) · List your services, or Create · Service", design/_gen/pros.js `K.meta`). It is not built; G-323 holds it for "the lead naming who draws the doors card first". That is a question with a sensible default (WORKFLOW section 10), and R-41's pattern answers it: build the card with the door whose screen exists, and PROS-01 and SCHOOLS-03 add theirs. The only way in today is M2's row, which shows a listing only while it is approved and listed. Reproduce: sign in as creator-basic (no applications), visit all five tabs: no link to `/professional-*` and none of "List your services", "Offer your services", "Your listings" (`walkA.py`, `walkC2.py`, `shots/A1-*`, `A2-*`, `C3-tab-*`). Then, as a creator with one listing: Me, Services, the row, Hide; restart the app: M2 has no row (`C2-M2-cold-after-hide-light.png`) and nothing else opens P8, so "Hidden. Nobody can find you" cannot be undone in the app. Overlap: the door goes in `src/features/explore/ExploreScreen.tsx`, which EVENTS-01 also edits (X15 draws its events rail above the doors), so once this is fixed the second of the two to merge must merge main in first.
- **D4 · defect, medium-high (V6, partial failure): a failed refresh throws the whole flow away.** `ApplyScreen` shows its error screen whenever the account, fields or applications query is in error, even with data already on screen, and that unmounts `ApplyFlow` and everything typed and sent. Reproduce (`walkG4.py`): creator-basic picks Legal & Compliance, Healthcare and Business & Consulting, fills P5 and P6, taps Send; the first POST reaches the Hub, then the connection drops for every call. At 1 s the screen says "Legal & Compliance was sent. Healthcare could not be sent. No connection..."; within 3 s the refresh of `applications/mine` that follows a partly sent batch has failed three times and the screen is "This could not be loaded" with Try again; after Try again P5 is blank: no fields, headline, about, services, number or issuer, and nothing says which field went through (`pairs/G4-sequence.png`). The same without sending (`walkG5.py`): fill P5, the Hub answers 503 when the app comes back to the front after 30 s: the form is replaced and Try again gives a blank P5 (`shots/G5-P5-503-focus-light.png`). A refresh failing behind a loaded flow should leave the flow and its message in place.
- **D5 · defect, medium (V4): Hide and Show do not reach M2.** P8 updates only its own query (`proKeys.mine`); M2 reads ME-01's `listingsKey`, which nothing refreshes. Reproduce (`walkB.py`, `walkC.py`): creator-basic, Me, Services, tap the listing, Hide, Back: Services still says "Chartered accountant, 9 years · Listed as a professional · via paid messages" (`shots/B6-M2-after-hide-light.png`), and still does 35 s later after switching tabs (`C1-M2-35s-after-hide-light.png`); only a cold start drops it. The person's own profile tells them the listing is live after they hid it.
- **D6 · defect, low-medium (V7, Android first): the system Back on P6 leaves the flow.** P5, P6 and P7 are steps inside one route, and nothing handles the system back (no `BackHandler` or `beforeRemove` in the feature), so Back on P6 pops the route instead of returning to P5 as the on-screen back does, and P5's typing is lost. Reproduce (`walkK.py`): P8, Apply in another field, fill P5, Continue, then the browser's Back: the app is on P8, and Apply in another field opens a blank P5. On Android the back button goes through the same router pop (not run on a phone).
- **D7 · defect, low (partial failure): a field the Hub refuses with 409 blocks the rest.** It stays chosen, so Send repeats the 409 and the fields after it are never sent until the person goes back and takes it away; G-324 and the spec say "a retry files the rest", which holds only for a passing refusal. Reproduce (`walkG3.py`): creator-basic picks Design & Creative, Technology & IT and Engineering; while P6 is open the same person files Technology & IT elsewhere (the web's POST, 201); Send: "Design & Creative was sent. Technology & IT could not be sent. You already have an application in this field."; Send again: the same 409, Engineering not tried; Back shows Technology & IT still chosen.
- **D8 · defect, low: Apply again on a turned-down row filed on the web opens a blank P5.** A row in a category no field files in ("Real estate") or in a field's second category (Business & Consulting's `business_entrepreneurship`) offers Apply again, which opens P5 with no field and nothing prefilled, and P5 cannot file in that category; Business & Consulting also shows as two cards. Reproduce (`walkJ.py`): file `real_estate` and `business_entrepreneurship` for creator-pro as the web does, turn both down through the admin route, open P8 and tap each Apply again (`shots/J1-*`, `J2-*`).
- **D9 · defect, low (ME-01's file changed beyond the entry).** `ServiceRow` now wraps every row, the paid messages row too, in a `Pressable` that is `disabled` when it has no press: on web that row is now `aria-disabled="true"` with `tabindex="-1"` (seen), and React Native announces a disabled Pressable as disabled to TalkBack (not run on a phone); ME-01 drew it as a plain accessible group. The new listing row has no focus ring and no pressed look, where every other pressable in `src/features/me` uses `useFocusRing`.
- **D10 · defect, low (U1, bookkeeping).** `LongField` (`parts.tsx`) is a second local multi-line field beside ME-06's `BioField`, and SHARED-CHANGES ME-11 #2 already asks for the shared `TextField multiline` that would replace both, but no row names `LongField`, so nothing says to delete it when that lands. `Note` and `ProFrame` keep their rows (PROS-03 #1, #2).

### Test gaps (mutants that survived; the behaviour itself works in the browser)

- **T1:** `MeScreen` dropping `onOpenListings` on its way to `ServicesTab` survives: `listingsEntry.test.tsx` mocks `MeScreen` away and renders `ServicesTab` alone, so nothing proves a tap on the real Me screen's row opens P8.
- **T2:** the chevron removed survives (the spec's name says "shows its chevron" but nothing looks for it).
- **T3:** `src/app/professional-listings.tsx` dropping `?field=` from Apply again survives (no spec covers the route's mapping).

### U1, U2, U3

- **U1 (no fork).** Main's new shared pieces are `Toast` (a transient pill, not a banner), `Button` sizes (P8 uses `size="sm"`), `FilterChips` (P6 uses `variant="option"`) and `MediaCard` (not used here). No local piece copies one of them: `Note` has no shared banner to use (PROS-03 #1), `ProFrame` no shared frame with a foot (#2), `PickedChip` and `AddChip` draw the kit's `picked` chip, which only P5 uses, and `LongField` is D10.
- **U2 (closed).** The mutant `accountType !== 'user'` fails the null spec; live, a WAWU ID account with no Hub profile (`GET /users/me` answers `accountType: null`) sees P10 on both routes.
- **U3 (product question for the owner, not a defect).** Live (`walkG6.py`): the storage host refuses the upload; the row says "Did not upload. Try again" in red; Send goes, P7 says Under review, and the application is stored with no document (`documents` empty). Should Send wait until the file is uploaded or removed? Today's behaviour matches the Hub, which takes an application without a file.

### Classification (V5)

- matches: P5 to P9 structure, copy, icons, tones, weights, order and the measured metrics above, light and dark; M2's listing row and its chevron.
- differs-for-recorded-reason: no status bar or home indicator (web); each `TextField` label sits 1 px low at 1x, so P6's file card is 4 px low at 2x (SHARED-CHANGES PROS-03 #3); the Licence number is not in the kit's letter-spaced mono (shared `TextField` takes no style); P6's regulated note breaks "issued / it." where the canvas breaks "that / issued it." (`text-wrap: pretty`, builder round 2); the Add chip after "What do you take on?" and the two sheets (G-322); P8's note without "(I21)" and without the Inbox settings link (INBOX-12); P10 without "Become a creator" (AUTH-06); the three claims kept as drawn (G-320); the upload row on web only (G-321, row 8).
- not this task's file: P10's title is 7 px narrower at 1x than the kit's `empty` title, because the shared `EmptyState` uses `h3` with -0.015 tracking (`src/components/StateViews.tsx`).
- defect: none in the pictures; D3 and D9 above touch what is drawn.

### Overlap with EVENTS-01

`wmt/EVENTS-01` (`0af26e6`) and this branch share no source file: both touch only `BACKEND_GAPS.md`, `SHARED-CHANGES.md`, `docs/LOG.md` and `docs/PROGRESS.md`. `git merge-tree` in both orders conflicts only in `docs/PROGRESS.md`, which is generated; a local trial merge, regenerated with `check_tasks.py --write`, ran `npm run check` exit 0 (84 suites / 1502 tests, gates 379 files / 0 findings, tasks 212), then was aborted (never pushed). D3's fix would add `src/features/explore/ExploreScreen.tsx`, which EVENTS-01 changes.

### Outside this task (for the lead)

- The admin route `POST /admin/professionals/:id/unlist` writes the same `listed = false` a person's Hide writes, so the person sees "Hidden" with Show on P8 and can put back a listing an admin pulled (`setListed` checks only `approved`). PROS-02's backend; nothing in this task can tell the two apart.
- `POST /uploads/presign` reserves a `StorageObject` row before the upload, so a refused upload (U3) still counts against the person (2 rows for creator-pro, one file stored).

### NOT RUN

- V10 on a phone, including the licence upload on a phone and the Android back button (D6): unblocked by SHARED-CHANGES row 8 applied and a development build on the owner's Android phone (R-24).
- The upload against a real bucket: ran against a local S3-compatible stand-in; unblocked by sandbox STORAGE_* keys in the local `.env`.

**Status:** back to `building` for D3 to D10 (and T1 to T3 with them).

## Lead rulings after the independent verifier (8 Oct 2026)

Build round 3 on `5859875`, then status `verifying`. The lead's independent verifier re-checks it.

- **D3 (Explore door; G-323's question).** R-41 answers it: the first of PROS-01, SCHOOLS-03 and PROS-03 to build draws Explore's doors card (X1, X15) with only its own door, and the others add theirs to that card. So PROS-03 draws the card now with "List your services" (Get paid to answer questions), as the canvas draws it, after Upcoming events if EVENTS-01 is on main by then, else after Featured creators. It opens P5 for a person with no application, and P8 for a person who has any (listed, pending, turned down or hidden), so a hidden listing can always be shown again; a `user` account gets P10 as P5 does. EVENTS-01 also edits `ExploreScreen.tsx`: whichever of the two merges second takes main in and resolves the conflict; neither edits the other's branch. Update G-323.
- **D4 (a failed refresh throws the flow away).** The full-screen error is only for a first load that never got data. Once P5 to P7 have data, a failed refetch keeps the form, the chosen fields and what was typed on screen, and says so inline with a retry; the per-field send result ("X was sent, Y could not be sent") stays until the person acts. Spec with the connection dropping after the first field is sent, and with a 503 on refetch when the app returns to the front.
- **D5 (Hide and Show do not reach M2).** After Hide or Show succeeds, refresh every query that shows the listing, M2's `listingsKey` included (invalidate both keys in one place). Spec: Hide on P8, Back, M2 reads the new state with no restart.
- **D6 (system Back on P6).** The system back (Android button and the browser's back) does what the on-screen back does: P6 to P5 and P7 to P6, with what was typed kept. Spec.
- **D7 (409 blocks the rest).** A field the Hub refuses with 409 ("You already have an application in this field") is taken out of the chosen fields, said once by name, and the remaining fields are sent in the same tap. Other refusals stay chosen so a retry sends them. Spec with three fields, the middle one 409.
- **D8 (web-filed categories).** P8 shows one card per field: a row filed in a field's second category (`business_entrepreneurship`) belongs to that field's card, with the field list from the Hub, not a local table. A row in a category no field files in today (`real_estate`, filed on the web) keeps its card with its decision and reason, but offers no Apply again in the app; its place says "Apply in another field" instead. Specs for both.
- **D9 (ME-01's row).** The paid messages row goes back to what ME-01 drew: a plain accessible group, not a disabled Pressable. The listing row uses `useFocusRing` and the pressed look every other pressable in `src/features/me` uses. Diff ME-01's file against main and keep only the entry's lines.
- **D10.** Add `LongField` (`src/features/pro-listing/parts.tsx`) to SHARED-CHANGES ME-11 #2, so the shared multi-line field replaces both it and `BioField`.
- **T1 to T3.** A spec on the real Me screen (not a mocked `MeScreen`) that a tap on the listing row opens P8; a spec that looks for the chevron; a spec on the listings route's Apply again keeping `?field=`. Re-apply each mutant and show it failing.
- **U3 (owner's question, lead default until the owner answers).** Send waits while any chosen file shows "Did not upload": the person retries it or removes it, and Send says why it is waiting. An application never goes without a file the person still sees on screen. The owner may reverse this.
- **Outside this task (the lead files them):** the admin unlist and the person's Hide share `listed`, so a person can show again a listing an admin pulled (PROS-02's backend); presign reserves storage quota before an upload that may be refused.

## Verifier report, round 3

Verifier (independent of the builder), 8 Oct 2026, branch `wmt/PROS-03` from `47f0fac`, `origin/main` merged in (merge commit `24c8185`; the one conflict, generated `docs/PROGRESS.md`, regenerated with `npm run tasks -- --write`). Live stack: Hub from `origin/main` (`8359057`) on 4205, **`mock-wawu-id` from the backend repo** on 4206 (not the real WAWU ID), web build on 4207, database `wawu_hub_test_pros_03_v3` (dropped when done). PARTIAL REPORT, written pass by pass; later rows are added below as each pass finishes.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 `npm run check` as it will land | passed, exit 0: jest 82 suites / 1442 tests, gates 9 run / 366 files / 0 findings, tasks 253 / 279 artboards | scratchpad `pros03v3b/check.log` |
| D9 diff vs main (static) | see finding R3-1 | `git diff origin/main...HEAD -- src/features/me` |
| Existing tests the builder changed | both legitimate (see below) | `git diff 5859875 HEAD -- src/features/**/__tests__` |

**Changed tests.** (1) Three-field spec, 409 to 503: legitimate. D7 reverses what a 409 does, so the old 409 case now belongs to the new D7 spec (three fields, middle 409, other two sent in one tap, asserted by posted bodies and by the sent list); the old spec's behaviour (stop at a failure, third not tried, retry files the rest) is still pinned, now with a 503, and the assertions are as strict as before. Not weakened. (2) "Paid row is a disabled button": legitimate, it pinned the very thing D9 removed; it now asserts there is no `me-service-paid-open` and that the row is a plain labelled group; the listing-row press assertion is unchanged.

**D10.** `LongField` is named in SHARED-CHANGES ME-11 #2 (line 120). Done.

**R3-1 (minor, not blocking) D9.** The diff of ME-01's `ServicesTab.tsx` is not only the entry's lines: `ServiceRow`'s inner words block was lifted into a new `RowWords` helper shared with the new `ListingRow`. Rendered output of the paid row is unchanged (same nodes, same styles), the paid row is a plain `accessible` group inside `Card` again, and `ListingRow` uses `useFocusRing` and a `surfaceSunken` pressed look. Judged `differs-for-recorded-reason`: sharing the words block keeps the two rows from drifting; but a strict reading of D9 ("keep only the entry's lines") would inline it. Lead to decide; I do not hold the task for it.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
