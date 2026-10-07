---
id: PROS-03
title: Get listed as a professional
owner: DEV3
area: PROS
order: 40
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: building
depends_on: [PROS-02, UI-02]
decisions: []
passes: [V1, V4, V5, V6, V7, V9, V10]
artboards: [P5, P6, P7, P8, P9, P10]
---
# PROS-03 · Get listed as a professional

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

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
